from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, not_
from app.models.listing import Listing
from app.models.swipe import Swipe


async def get_discover_feed(
    db: AsyncSession,
    user_id: str,
    district: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    room_type: Optional[str] = None,
    has_wifi: Optional[bool] = None,
    has_parking: Optional[bool] = None,
    is_furnished: Optional[bool] = None,
    has_bathroom_private: Optional[bool] = None,
    cursor: Optional[str] = None,
    limit: int = 10,
) -> tuple[List[Listing], Optional[str], bool]:
    """Get discover feed with filters and cursor pagination."""

    # Subquery: listings already swiped by user
    swiped_ids = select(Swipe.listing_id).where(Swipe.swiper_id == user_id).scalar_subquery()

    # Base query
    query = select(Listing).where(
        Listing.is_active == True,
        Listing.owner_id != user_id,
        Listing.id.not_in(swiped_ids),
    )

    # Apply filters
    if district:
        query = query.where(Listing.district == district)
    if min_price is not None:
        query = query.where(Listing.price >= min_price)
    if max_price is not None:
        query = query.where(Listing.price <= max_price)
    if room_type:
        query = query.where(Listing.room_type == room_type)
    if has_wifi is not None:
        query = query.where(Listing.has_wifi == has_wifi)
    if has_parking is not None:
        query = query.where(Listing.has_parking == has_parking)
    if is_furnished is not None:
        query = query.where(Listing.is_furnished == is_furnished)
    if has_bathroom_private is not None:
        query = query.where(Listing.has_bathroom_private == has_bathroom_private)

    # Cursor pagination
    if cursor:
        query = query.where(Listing.id > cursor)

    # Order: boosted first, then by created_at desc
    query = query.order_by(Listing.is_boosted.desc(), Listing.created_at.desc())

    # Limit + 1 to check if there are more
    query = query.limit(limit + 1)

    result = await db.execute(query)
    listings = list(result.scalars().all())

    has_more = len(listings) > limit
    if has_more:
        listings = listings[:limit]

    next_cursor = listings[-1].id if listings else None

    return listings, next_cursor, has_more
