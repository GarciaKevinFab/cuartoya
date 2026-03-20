from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class SwipeRequest(BaseModel):
    listing_id: str
    action: str  # like, nope, super_like


class SwipeResponse(BaseModel):
    id: str
    swiper_id: str
    listing_id: str
    action: str
    created_at: datetime

    model_config = {"from_attributes": True}


class PendingSwipeResponse(BaseModel):
    id: str
    swiper_id: str
    swiper_name: str
    swiper_photo: Optional[str] = None
    swiper_occupation: Optional[str] = None
    swiper_university: Optional[str] = None
    swiper_is_verified: bool = False
    listing_id: str
    listing_title: str
    action: str
    created_at: datetime


class SwipeLimitResponse(BaseModel):
    allowed: bool
    remaining: int
    is_premium: bool
