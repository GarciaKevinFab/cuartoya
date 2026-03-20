from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class SubscribeRequest(BaseModel):
    plan: str  # pro, agency
    culqi_token: str


class BoostRequest(BaseModel):
    listing_id: str
    days: int  # 7, 15, 30
    culqi_token: str


class PaymentResponse(BaseModel):
    id: str
    plan: Optional[str] = None
    amount: float
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}


class DashboardStats(BaseModel):
    total_listings: int = 0
    total_views: int = 0
    total_likes: int = 0
    total_matches: int = 0
    active_listings: int = 0
    boosted_listings: int = 0
