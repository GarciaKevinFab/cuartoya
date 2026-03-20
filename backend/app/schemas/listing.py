from pydantic import BaseModel, field_validator
from typing import Optional, List
from datetime import date, datetime


class ListingBase(BaseModel):
    title: str
    description: str
    price: float
    room_type: str = "single"
    city: str = "huancayo"
    district: str = "el_tambo"
    address: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    max_occupants: int = 1
    is_furnished: bool = False
    has_wifi: bool = False
    has_water_24h: bool = False
    has_parking: bool = False
    has_kitchen: bool = False
    has_bathroom_private: bool = False
    allows_couples: bool = False
    allows_pets: bool = False
    allows_smoking: bool = False
    min_stay_months: int = 1
    available_from: date = None

    @field_validator("title")
    @classmethod
    def validate_title(cls, v):
        if len(v) < 10:
            raise ValueError("El titulo debe tener al menos 10 caracteres")
        return v

    @field_validator("price")
    @classmethod
    def validate_price(cls, v):
        if v <= 0:
            raise ValueError("El precio debe ser mayor a 0")
        return v


class ListingCreate(ListingBase):
    pass


class ListingUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    room_type: Optional[str] = None
    city: Optional[str] = None
    district: Optional[str] = None
    address: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    max_occupants: Optional[int] = None
    is_furnished: Optional[bool] = None
    has_wifi: Optional[bool] = None
    has_water_24h: Optional[bool] = None
    has_parking: Optional[bool] = None
    has_kitchen: Optional[bool] = None
    has_bathroom_private: Optional[bool] = None
    allows_couples: Optional[bool] = None
    allows_pets: Optional[bool] = None
    allows_smoking: Optional[bool] = None
    min_stay_months: Optional[int] = None
    available_from: Optional[date] = None
    is_active: Optional[bool] = None


class ListingResponse(BaseModel):
    id: str
    owner_id: str
    title: str
    description: str
    price: float
    room_type: str
    city: str = "huancayo"
    district: str
    address: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    max_occupants: int
    is_furnished: bool
    has_wifi: bool
    has_water_24h: bool
    has_parking: bool
    has_kitchen: bool
    has_bathroom_private: bool
    allows_couples: bool
    allows_pets: bool
    allows_smoking: bool
    min_stay_months: int
    available_from: Optional[date] = None
    is_active: bool
    is_boosted: bool
    photos: Optional[List[str]] = []
    view_count: int
    created_at: datetime

    model_config = {"from_attributes": True}


class ListingDetail(ListingResponse):
    owner_name: Optional[str] = None
    owner_photo: Optional[str] = None
    owner_is_verified: bool = False


class ListingFeed(BaseModel):
    listings: List[ListingResponse]
    next_cursor: Optional[str] = None
    has_more: bool = False
