from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, func, desc
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.listing import Listing
from app.models.match import Match, MatchStatus
from app.models.message import Message
from app.schemas.match import MatchResponse, MatchDetail
from app.schemas.message import MessageCreate, MessageResponse, MessageList
from app.schemas.user import UserPublic
from app.schemas.listing import ListingResponse
from app.services.notification_service import notify_new_message

router = APIRouter()


@router.get("", response_model=List[MatchResponse])
async def get_matches(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Match)
        .where(
            or_(Match.tenant_id == current_user.id, Match.landlord_id == current_user.id),
            Match.status == MatchStatus.active,
        )
        .order_by(Match.created_at.desc())
    )
    matches = result.scalars().all()

    response = []
    for match in matches:
        # Get listing info
        result = await db.execute(select(Listing).where(Listing.id == match.listing_id))
        listing = result.scalar_one()

        # Get other user
        other_id = match.landlord_id if match.tenant_id == current_user.id else match.tenant_id
        result = await db.execute(select(User).where(User.id == other_id))
        other_user = result.scalar_one()

        # Get last message
        result = await db.execute(
            select(Message)
            .where(Message.match_id == match.id)
            .order_by(Message.created_at.desc())
            .limit(1)
        )
        last_msg = result.scalar_one_or_none()

        # Count unread
        result = await db.execute(
            select(func.count(Message.id)).where(
                Message.match_id == match.id,
                Message.sender_id != current_user.id,
                Message.is_read == False,
            )
        )
        unread = result.scalar() or 0

        response.append(MatchResponse(
            id=match.id,
            listing_id=match.listing_id,
            tenant_id=match.tenant_id,
            landlord_id=match.landlord_id,
            status=match.status,
            listing_title=listing.title,
            listing_photo=listing.photos[0] if listing.photos else None,
            listing_price=float(listing.price),
            other_user_name=other_user.full_name,
            other_user_photo=other_user.profile_photo,
            last_message=last_msg.content if last_msg else None,
            last_message_at=last_msg.created_at if last_msg else None,
            unread_count=unread,
            created_at=match.created_at,
        ))

    return response


@router.get("/{match_id}", response_model=MatchDetail)
async def get_match_detail(
    match_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Match).where(Match.id == match_id))
    match = result.scalar_one_or_none()
    if not match:
        raise HTTPException(status_code=404, detail="Match no encontrado")

    if match.tenant_id != current_user.id and match.landlord_id != current_user.id:
        raise HTTPException(status_code=403, detail="No tienes acceso a este match")

    result = await db.execute(select(Listing).where(Listing.id == match.listing_id))
    listing = result.scalar_one()

    result = await db.execute(select(User).where(User.id == match.tenant_id))
    tenant = result.scalar_one()

    result = await db.execute(select(User).where(User.id == match.landlord_id))
    landlord = result.scalar_one()

    return MatchDetail(
        id=match.id,
        listing=ListingResponse.model_validate(listing),
        tenant=UserPublic.model_validate(tenant),
        landlord=UserPublic.model_validate(landlord),
        status=match.status,
        created_at=match.created_at,
    )


@router.get("/{match_id}/messages", response_model=MessageList)
async def get_messages(
    match_id: str,
    limit: int = Query(default=50, le=100),
    before: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Verify access
    result = await db.execute(select(Match).where(Match.id == match_id))
    match = result.scalar_one_or_none()
    if not match:
        raise HTTPException(status_code=404, detail="Match no encontrado")
    if match.tenant_id != current_user.id and match.landlord_id != current_user.id:
        raise HTTPException(status_code=403, detail="No tienes acceso")

    query = select(Message).where(Message.match_id == match_id)
    if before:
        query = query.where(Message.id < before)
    query = query.order_by(Message.created_at.desc()).limit(limit + 1)

    result = await db.execute(query)
    messages = list(result.scalars().all())

    has_more = len(messages) > limit
    if has_more:
        messages = messages[:limit]

    return MessageList(
        messages=[MessageResponse.model_validate(m) for m in reversed(messages)],
        has_more=has_more,
    )


@router.post("/{match_id}/messages", response_model=MessageResponse, status_code=201)
async def send_message(
    match_id: str,
    data: MessageCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Match).where(Match.id == match_id))
    match = result.scalar_one_or_none()
    if not match:
        raise HTTPException(status_code=404, detail="Match no encontrado")
    if match.tenant_id != current_user.id and match.landlord_id != current_user.id:
        raise HTTPException(status_code=403, detail="No tienes acceso")
    if match.status != MatchStatus.active:
        raise HTTPException(status_code=400, detail="Este match ya no esta activo")

    message = Message(
        match_id=match_id,
        sender_id=current_user.id,
        content=data.content,
    )
    db.add(message)
    await db.flush()
    await db.refresh(message)

    # Notify recipient
    recipient_id = match.landlord_id if match.tenant_id == current_user.id else match.tenant_id
    await notify_new_message(recipient_id, current_user.full_name, data.content)

    await db.commit()
    return MessageResponse.model_validate(message)


@router.put("/{match_id}/messages/{message_id}/read")
async def mark_message_read(
    match_id: str,
    message_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Message).where(Message.id == message_id, Message.match_id == match_id)
    )
    message = result.scalar_one_or_none()
    if not message:
        raise HTTPException(status_code=404, detail="Mensaje no encontrado")

    message.is_read = True
    await db.commit()
    return {"message": "Marcado como leido"}


@router.delete("/{match_id}")
async def archive_match(
    match_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Match).where(Match.id == match_id))
    match = result.scalar_one_or_none()
    if not match:
        raise HTTPException(status_code=404, detail="Match no encontrado")
    if match.tenant_id != current_user.id and match.landlord_id != current_user.id:
        raise HTTPException(status_code=403, detail="No tienes acceso")

    match.status = MatchStatus.cancelled
    await db.commit()
    return {"message": "Match archivado"}
