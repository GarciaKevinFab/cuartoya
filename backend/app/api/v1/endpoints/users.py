from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.listing import Listing
from app.models.swipe import Swipe, SwipeAction
from app.models.match import Match
from app.schemas.user import UserResponse, UserUpdate, UserPublic, UserStats, PushTokenRequest
from app.services.cloudinary_service import upload_image

router = APIRouter()


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return UserResponse.model_validate(current_user)


@router.put("/me", response_model=UserResponse)
async def update_me(
    data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(current_user, key, value)
    await db.commit()
    await db.refresh(current_user)
    return UserResponse.model_validate(current_user)


@router.post("/me/photo", response_model=UserResponse)
async def upload_profile_photo(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    url = await upload_image(file, folder="profiles", public_id=f"user_{current_user.id}")
    current_user.profile_photo = url
    await db.commit()
    await db.refresh(current_user)
    return UserResponse.model_validate(current_user)


@router.get("/{user_id}", response_model=UserPublic)
async def get_user_public(user_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return UserPublic.model_validate(user)


@router.post("/me/push-token")
async def register_push_token(
    data: PushTokenRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    current_user.push_token = data.push_token
    await db.commit()
    return {"message": "Token de push registrado"}


@router.get("/me/stats", response_model=UserStats)
async def get_my_stats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Likes given
    result = await db.execute(
        select(func.count(Swipe.id)).where(
            Swipe.swiper_id == current_user.id,
            Swipe.action.in_([SwipeAction.like, SwipeAction.super_like]),
        )
    )
    likes_given = result.scalar() or 0

    # Matches
    result = await db.execute(
        select(func.count(Match.id)).where(
            (Match.tenant_id == current_user.id) | (Match.landlord_id == current_user.id)
        )
    )
    matches_count = result.scalar() or 0

    # Listings
    result = await db.execute(
        select(func.count(Listing.id)).where(Listing.owner_id == current_user.id)
    )
    listings_count = result.scalar() or 0

    # Total views
    result = await db.execute(
        select(func.sum(Listing.view_count)).where(Listing.owner_id == current_user.id)
    )
    views_total = result.scalar() or 0

    return UserStats(
        likes_given=likes_given,
        matches_count=matches_count,
        listings_count=listings_count,
        views_total=views_total,
    )
