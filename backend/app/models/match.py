import uuid
import enum
from datetime import datetime, timezone
from sqlalchemy import String, DateTime, ForeignKey, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class MatchStatus(str, enum.Enum):
    active = "active"
    closed = "closed"
    cancelled = "cancelled"


class Match(Base):
    __tablename__ = "matches"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    listing_id: Mapped[str] = mapped_column(String(36), ForeignKey("listings.id"), nullable=False)
    tenant_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False)
    landlord_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False)
    status: Mapped[str] = mapped_column(SAEnum(MatchStatus), default=MatchStatus.active, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    listing = relationship("Listing", back_populates="matches")
    tenant = relationship("User", foreign_keys=[tenant_id], back_populates="matches_as_tenant")
    landlord = relationship("User", foreign_keys=[landlord_id], back_populates="matches_as_landlord")
    messages = relationship("Message", back_populates="match", lazy="selectin", order_by="Message.created_at")
