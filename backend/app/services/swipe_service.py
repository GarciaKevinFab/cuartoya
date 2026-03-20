from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.models.swipe import Swipe, SwipeAction
from app.models.listing import Listing
from app.models.user import User
from app.services.notification_service import notify_new_like

DAILY_LIMIT_FREE = 10


async def check_daily_limit(db: AsyncSession, user_id: str) -> tuple[bool, int]:
    """Check if user has reached daily swipe limit. Returns (allowed, remaining)."""
    # Check if premium
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if user and user.is_premium:
        return True, 999  # Unlimited for premium

    # Count today's likes
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    result = await db.execute(
        select(func.count(Swipe.id)).where(
            Swipe.swiper_id == user_id,
            Swipe.action.in_([SwipeAction.like, SwipeAction.super_like]),
            Swipe.created_at >= today_start,
        )
    )
    count = result.scalar() or 0
    remaining = max(0, DAILY_LIMIT_FREE - count)
    return remaining > 0, remaining


async def process_swipe(db: AsyncSession, swiper_id: str, listing_id: str, action: str) -> Swipe:
    """Process a swipe action."""
    # Check if already swiped
    result = await db.execute(
        select(Swipe).where(Swipe.swiper_id == swiper_id, Swipe.listing_id == listing_id)
    )
    existing = result.scalar_one_or_none()
    if existing:
        raise ValueError("Ya deslizaste esta publicacion")

    # Check listing exists and is not own
    result = await db.execute(select(Listing).where(Listing.id == listing_id))
    listing = result.scalar_one_or_none()
    if not listing:
        raise ValueError("Publicacion no encontrada")
    if listing.owner_id == swiper_id:
        raise ValueError("No puedes deslizar tu propia publicacion")

    # Check daily limit for likes
    if action in [SwipeAction.like, SwipeAction.super_like]:
        allowed, remaining = await check_daily_limit(db, swiper_id)
        if not allowed:
            raise PermissionError("Limite diario alcanzado. Actualiza a Premium para likes ilimitados.")

    # Create swipe
    swipe = Swipe(swiper_id=swiper_id, listing_id=listing_id, action=action)
    db.add(swipe)
    await db.flush()

    # Notify landlord for likes
    if action in [SwipeAction.like, SwipeAction.super_like]:
        result = await db.execute(select(User).where(User.id == swiper_id))
        swiper = result.scalar_one()
        await notify_new_like(listing.owner_id, swiper.full_name, listing.title)

    await db.commit()
    await db.refresh(swipe)
    return swipe
