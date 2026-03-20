from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional
from datetime import datetime


class UserBase(BaseModel):
    email: EmailStr
    phone: str
    full_name: str
    role: str = "tenant"

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v):
        if not v.startswith("+51") or len(v) != 12:
            raise ValueError("Telefono debe ser formato peruano: +51XXXXXXXXX")
        return v


class UserCreate(UserBase):
    password: str

    @field_validator("password")
    @classmethod
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError("La contrasena debe tener al menos 8 caracteres")
        return v


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    bio: Optional[str] = None
    phone: Optional[str] = None
    occupation: Optional[str] = None
    university: Optional[str] = None
    dni: Optional[str] = None


class UserResponse(BaseModel):
    id: str
    email: str
    phone: str
    full_name: str
    bio: Optional[str] = None
    profile_photo: Optional[str] = None
    role: str
    is_verified: bool
    is_premium: bool
    occupation: Optional[str] = None
    university: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class UserPublic(BaseModel):
    id: str
    full_name: str
    profile_photo: Optional[str] = None
    role: str
    is_verified: bool
    is_premium: bool
    occupation: Optional[str] = None
    university: Optional[str] = None

    model_config = {"from_attributes": True}


class UserStats(BaseModel):
    likes_given: int = 0
    matches_count: int = 0
    listings_count: int = 0
    views_total: int = 0


class PushTokenRequest(BaseModel):
    push_token: str
