from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.swipe import Swipe, SwipeAction
from app.models.listing import Listing
from app.models.match import Match, MatchStatus
from app.schemas.swipe import SwipeRequest, SwipeResponse, PendingSwipeResponse
from app.services.swipe_service import process_swipe
from app.services.notification_service import notify_match

router = APIRouter()


@router.post("", response_model=SwipeResponse, status_code=201)
async def create_swipe(
    data: SwipeRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        swipe = await process_swipe(db, current_user.id, data.listing_id, data.action)
        return SwipeResponse.model_validate(swipe)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except PermissionError as e:
        raise HTTPException(status_code=429, detail=str(e))


@router.get("/pending", response_model=List[PendingSwipeResponse])
async def get_pending_swipes(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get likes received on my listings (landlord view)."""
    # Get my listing IDs
    result = await db.execute(
        select(Listing.id).where(Listing.owner_id == current_user.id)
    )
    my_listing_ids = [r[0] for r in result.all()]

    if not my_listing_ids:
        return []

    # Get likes on my listings that haven't been matched yet
    matched_swipe_combos = select(Match.tenant_id, Match.listing_id).scalar_subquery()

    result = await db.execute(
        select(Swipe)
        .where(
            Swipe.listing_id.in_(my_listing_ids),
            Swipe.action.in_([SwipeAction.like, SwipeAction.super_like]),
        )
        .order_by(Swipe.created_at.desc())
    )
    swipes = result.scalars().all()

    pending = []
    for swipe in swipes:
        # Check if already matched
        result = await db.execute(
            select(Match).where(
                Match.tenant_id == swipe.swiper_id,
                Match.listing_id == swipe.listing_id,
            )
        )
        if result.scalar_one_or_none():
            continue

        # Get swiper info
        result = await db.execute(select(User).where(User.id == swipe.swiper_id))
        swiper = result.scalar_one()

        # Get listing info
        result = await db.execute(select(Listing).where(Listing.id == swipe.listing_id))
        listing = result.scalar_one()

        pending.append(PendingSwipeResponse(
            id=swipe.id,
            swiper_id=swiper.id,
            swiper_name=swiper.full_name,
            swiper_photo=swiper.profile_photo,
            swiper_occupation=swiper.occupation,
            swiper_university=swiper.university,
            swiper_is_verified=swiper.is_verified,
            listing_id=listing.id,
            listing_title=listing.title,
            action=swipe.action,
            created_at=swipe.created_at,
        ))

    return pending


@router.post("/{swipe_id}/accept")
async def accept_swipe(
    swipe_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Landlord accepts a like -> creates Match."""
    result = await db.execute(select(Swipe).where(Swipe.id == swipe_id))
    swipe = result.scalar_one_or_none()
    if not swipe:
        raise HTTPException(status_code=404, detail="Swipe no encontrado")

    # Verify ownership
    result = await db.execute(select(Listing).where(Listing.id == swipe.listing_id))
    listing = result.scalar_one()
    if listing.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="No tienes permiso")

    # Check if match already exists
    result = await db.execute(
        select(Match).where(
            Match.tenant_id == swipe.swiper_id,
            Match.listing_id == swipe.listing_id,
        )
    )
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="El match ya existe")

    # Create match
    match = Match(
        listing_id=swipe.listing_id,
        tenant_id=swipe.swiper_id,
        landlord_id=current_user.id,
        status=MatchStatus.active,
    )
    db.add(match)
    await db.flush()

    # Notify tenant
    await notify_match(swipe.swiper_id, listing.title)

    await db.commit()
    return {"message": "Match creado exitosamente", "match_id": match.id}


@router.post("/{swipe_id}/reject")
async def reject_swipe(
    swipe_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Landlord rejects a like."""
    result = await db.execute(select(Swipe).where(Swipe.id == swipe_id))
    swipe = result.scalar_one_or_none()
    if not swipe:
        raise HTTPException(status_code=404, detail="Swipe no encontrado")

    result = await db.execute(select(Listing).where(Listing.id == swipe.listing_id))
    listing = result.scalar_one()
    if listing.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="No tienes permiso")

    # Just change action to nope (soft reject)
    swipe.action = SwipeAction.nope
    await db.commit()
    return {"message": "Solicitud rechazada"}


@router.get("/my-likes", response_model=List[SwipeResponse])
async def get_my_likes(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Swipe)
        .where(
            Swipe.swiper_id == current_user.id,
            Swipe.action.in_([SwipeAction.like, SwipeAction.super_like]),
        )
        .order_by(Swipe.created_at.desc())
    )
    swipes = result.scalars().all()
    return [SwipeResponse.model_validate(s) for s in swipes]
