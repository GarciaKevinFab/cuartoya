from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.schemas.user import UserPublic
from app.schemas.listing import ListingResponse


class MatchResponse(BaseModel):
    id: str
    listing_id: str
    tenant_id: str
    landlord_id: str
    status: str
    listing_title: Optional[str] = None
    listing_photo: Optional[str] = None
    listing_price: Optional[float] = None
    other_user_name: Optional[str] = None
    other_user_photo: Optional[str] = None
    last_message: Optional[str] = None
    last_message_at: Optional[datetime] = None
    unread_count: int = 0
    created_at: datetime

    model_config = {"from_attributes": True}


class MatchDetail(BaseModel):
    id: str
    listing: ListingResponse
    tenant: UserPublic
    landlord: UserPublic
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}
