from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User, UserRole
from app.models.listing import Listing
from app.schemas.listing import ListingCreate, ListingUpdate, ListingResponse, ListingDetail, ListingFeed
from app.services.feed_service import get_discover_feed
from app.services.cloudinary_service import upload_image

router = APIRouter()


@router.get("", response_model=ListingFeed)
async def get_feed(
    district: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    room_type: Optional[str] = None,
    has_wifi: Optional[bool] = None,
    has_parking: Optional[bool] = None,
    is_furnished: Optional[bool] = None,
    has_bathroom_private: Optional[bool] = None,
    cursor: Optional[str] = None,
    limit: int = Query(default=10, le=50),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    listings, next_cursor, has_more = await get_discover_feed(
        db, current_user.id, district, min_price, max_price, room_type,
        has_wifi, has_parking, is_furnished, has_bathroom_private, cursor, limit,
    )
    return ListingFeed(
        listings=[ListingResponse.model_validate(l) for l in listings],
        next_cursor=next_cursor,
        has_more=has_more,
    )


@router.post("", response_model=ListingResponse, status_code=201)
async def create_listing(
    data: ListingCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.role == UserRole.tenant:
        raise HTTPException(status_code=403, detail="Solo propietarios pueden crear publicaciones")

    listing = Listing(
        owner_id=current_user.id,
        **data.model_dump(exclude_unset=True),
    )
    if listing.available_from is None:
        from datetime import date
        listing.available_from = date.today()

    db.add(listing)
    await db.flush()
    await db.refresh(listing)
    return ListingResponse.model_validate(listing)


@router.get("/my", response_model=List[ListingResponse])
async def get_my_listings(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Listing)
        .where(Listing.owner_id == current_user.id)
        .order_by(Listing.created_at.desc())
    )
    listings = result.scalars().all()
    return [ListingResponse.model_validate(l) for l in listings]


@router.get("/{listing_id}", response_model=ListingDetail)
async def get_listing_detail(
    listing_id: str,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Listing).where(Listing.id == listing_id))
    listing = result.scalar_one_or_none()
    if not listing:
        raise HTTPException(status_code=404, detail="Publicacion no encontrada")

    # Get owner info
    result = await db.execute(select(User).where(User.id == listing.owner_id))
    owner = result.scalar_one()

    detail = ListingDetail.model_validate(listing)
    detail.owner_name = owner.full_name
    detail.owner_photo = owner.profile_photo
    detail.owner_is_verified = owner.is_verified
    return detail


@router.put("/{listing_id}", response_model=ListingResponse)
async def update_listing(
    listing_id: str,
    data: ListingUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Listing).where(Listing.id == listing_id))
    listing = result.scalar_one_or_none()
    if not listing:
        raise HTTPException(status_code=404, detail="Publicacion no encontrada")
    if listing.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="No tienes permiso para editar esta publicacion")

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(listing, key, value)
    await db.commit()
    await db.refresh(listing)
    return ListingResponse.model_validate(listing)


@router.delete("/{listing_id}")
async def delete_listing(
    listing_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Listing).where(Listing.id == listing_id))
    listing = result.scalar_one_or_none()
    if not listing:
        raise HTTPException(status_code=404, detail="Publicacion no encontrada")
    if listing.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="No tienes permiso")

    listing.is_active = False
    await db.commit()
    return {"message": "Publicacion desactivada"}


@router.post("/{listing_id}/photos", response_model=ListingResponse)
async def upload_listing_photos(
    listing_id: str,
    files: List[UploadFile] = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Listing).where(Listing.id == listing_id))
    listing = result.scalar_one_or_none()
    if not listing:
        raise HTTPException(status_code=404, detail="Publicacion no encontrada")
    if listing.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="No tienes permiso")

    photos = listing.photos or []
    if len(photos) + len(files) > 6:
        raise HTTPException(status_code=400, detail="Maximo 6 fotos por publicacion")

    for i, file in enumerate(files):
        url = await upload_image(file, folder="listings", public_id=f"listing_{listing_id}_{len(photos) + i}")
        photos.append(url)

    listing.photos = photos
    await db.commit()
    await db.refresh(listing)
    return ListingResponse.model_validate(listing)


@router.delete("/{listing_id}/photos/{photo_index}")
async def delete_listing_photo(
    listing_id: str,
    photo_index: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Listing).where(Listing.id == listing_id))
    listing = result.scalar_one_or_none()
    if not listing:
        raise HTTPException(status_code=404, detail="Publicacion no encontrada")
    if listing.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="No tienes permiso")

    photos = listing.photos or []
    if photo_index < 0 or photo_index >= len(photos):
        raise HTTPException(status_code=400, detail="Indice de foto invalido")

    photos.pop(photo_index)
    listing.photos = photos
    await db.commit()
    return {"message": "Foto eliminada"}


@router.post("/{listing_id}/view")
async def register_view(
    listing_id: str,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Listing).where(Listing.id == listing_id))
    listing = result.scalar_one_or_none()
    if not listing:
        raise HTTPException(status_code=404, detail="Publicacion no encontrada")

    listing.view_count += 1
    await db.commit()
    return {"view_count": listing.view_count}
