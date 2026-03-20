import uuid
import enum
from datetime import datetime, timezone
from sqlalchemy import String, Boolean, Text, DateTime, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class UserRole(str, enum.Enum):
    tenant = "tenant"
    landlord = "landlord"
    both = "both"
    admin = "admin"


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    phone: Mapped[str] = mapped_column(String(20), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(150), nullable=False)
    bio: Mapped[str | None] = mapped_column(Text, nullable=True)
    profile_photo: Mapped[str | None] = mapped_column(String(500), nullable=True)
    role: Mapped[str] = mapped_column(SAEnum(UserRole), default=UserRole.tenant, nullable=False)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_premium: Mapped[bool] = mapped_column(Boolean, default=False)
    premium_until: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    dni: Mapped[str | None] = mapped_column(String(20), nullable=True)
    occupation: Mapped[str | None] = mapped_column(String(100), nullable=True)
    university: Mapped[str | None] = mapped_column(String(200), nullable=True)
    push_token: Mapped[str | None] = mapped_column(String(500), nullable=True)
    notifications_enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    is_banned: Mapped[bool] = mapped_column(Boolean, default=False)
    ban_reason: Mapped[str | None] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc)
    )

    # Relationships
    listings = relationship("Listing", back_populates="owner", lazy="selectin")
    swipes_given = relationship("Swipe", back_populates="swiper", lazy="selectin")
    matches_as_tenant = relationship(
        "Match", foreign_keys="Match.tenant_id", back_populates="tenant", lazy="selectin"
    )
    matches_as_landlord = relationship(
        "Match", foreign_keys="Match.landlord_id", back_populates="landlord", lazy="selectin"
    )
    messages_sent = relationship("Message", back_populates="sender", lazy="selectin")
    subscriptions = relationship("Subscription", back_populates="user", lazy="selectin")
