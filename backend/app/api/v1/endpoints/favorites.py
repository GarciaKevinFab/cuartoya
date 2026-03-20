from typing import List
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.listing import Listing
from app.models.favorite import Favorite
from app.schemas.listing import ListingResponse

router = APIRouter()


class FavoriteResponse(BaseModel):
    id: str
    listing: ListingResponse
    created_at: datetime


@router.post("/{listing_id}", status_code=201)
async def add_favorite(
    listing_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Guardar una publicacion como favorita."""
    # Check listing exists
    result = await db.execute(select(Listing).where(Listing.id == listing_id))
    listing = result.scalar_one_or_none()
    if not listing:
        raise HTTPException(status_code=404, detail="Publicacion no encontrada")

    # Check if already favorited
    result = await db.execute(
        select(Favorite).where(
            Favorite.user_id == current_user.id,
            Favorite.listing_id == listing_id,
        )
    )
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Ya guardaste esta publicacion")

    favorite = Favorite(user_id=current_user.id, listing_id=listing_id)
    db.add(favorite)
    await db.commit()

    return {"message": "Publicacion guardada como favorita"}


@router.delete("/{listing_id}")
async def remove_favorite(
    listing_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Quitar una publicacion de favoritos."""
    result = await db.execute(
        select(Favorite).where(
            Favorite.user_id == current_user.id,
            Favorite.listing_id == listing_id,
        )
    )
    favorite = result.scalar_one_or_none()
    if not favorite:
        raise HTTPException(status_code=404, detail="Publicacion no esta en favoritos")

    await db.delete(favorite)
    await db.commit()

    return {"message": "Publicacion removida de favoritos"}


@router.get("", response_model=List[FavoriteResponse])
async def get_favorites(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Listar publicaciones guardadas como favoritas."""
    result = await db.execute(
        select(Favorite)
        .where(Favorite.user_id == current_user.id)
        .order_by(Favorite.created_at.desc())
    )
    favorites = result.scalars().all()

    response = []
    for fav in favorites:
        result = await db.execute(select(Listing).where(Listing.id == fav.listing_id))
        listing = result.scalar_one_or_none()
        if listing:
            response.append(FavoriteResponse(
                id=fav.id,
                listing=ListingResponse.model_validate(listing),
                created_at=fav.created_at,
            ))

    return response
