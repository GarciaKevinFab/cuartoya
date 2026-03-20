import uuid
import enum
from datetime import datetime, timezone
from sqlalchemy import String, DateTime, ForeignKey, UniqueConstraint, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class SwipeAction(str, enum.Enum):
    like = "like"
    nope = "nope"
    super_like = "super_like"


class Swipe(Base):
    __tablename__ = "swipes"
    __table_args__ = (UniqueConstraint("swiper_id", "listing_id", name="uq_swiper_listing"),)

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    swiper_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False)
    listing_id: Mapped[str] = mapped_column(String(36), ForeignKey("listings.id"), nullable=False)
    action: Mapped[str] = mapped_column(SAEnum(SwipeAction), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    swiper = relationship("User", back_populates="swipes_given")
    listing = relationship("Listing", back_populates="swipes")
