import uuid
import enum
from datetime import datetime, date, timezone
from sqlalchemy import String, Boolean, Text, DateTime, Date, Float, Integer, Numeric, JSON, ForeignKey, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class RoomType(str, enum.Enum):
    single = "single"
    double = "double"
    studio = "studio"
    shared = "shared"
    apartment = "apartment"


class City(str, enum.Enum):
    huancayo = "huancayo"
    tarma = "tarma"
    la_oroya = "la_oroya"
    junin = "junin"
    jauja = "jauja"
    concepcion = "concepcion"
    chupaca = "chupaca"


class District(str, enum.Enum):
    # Huancayo
    el_tambo = "el_tambo"
    chilca = "chilca"
    cercado = "cercado"
    huancan = "huancan"
    pilcomayo = "pilcomayo"
    # Tarma
    tarma_centro = "tarma_centro"
    acobamba_tarma = "acobamba_tarma"
    palca = "palca"
    # La Oroya
    la_oroya_centro = "la_oroya_centro"
    santa_rosa_sacco = "santa_rosa_sacco"
    yauli = "yauli"
    # Junin
    junin_centro = "junin_centro"
    ondores = "ondores"
    carhuamayo = "carhuamayo"
    # Jauja
    jauja_centro = "jauja_centro"
    sausa = "sausa"
    yauyos_jauja = "yauyos_jauja"
    # Concepcion
    concepcion_centro = "concepcion_centro"
    aco = "aco"
    orcotuna = "orcotuna"
    # Chupaca
    chupaca_centro = "chupaca_centro"
    ahuac = "ahuac"
    huachac = "huachac"
    # Otros
    otros = "otros"


class Listing(Base):
    __tablename__ = "listings"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    owner_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False)
    city: Mapped[str] = mapped_column(SAEnum(City), default=City.huancayo, nullable=False)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    price: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    room_type: Mapped[str] = mapped_column(SAEnum(RoomType), default=RoomType.single, nullable=False)
    district: Mapped[str] = mapped_column(SAEnum(District), default=District.el_tambo, nullable=False)
    address: Mapped[str | None] = mapped_column(String(300), nullable=True)
    latitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    longitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    max_occupants: Mapped[int] = mapped_column(Integer, default=1)
    is_furnished: Mapped[bool] = mapped_column(Boolean, default=False)
    has_wifi: Mapped[bool] = mapped_column(Boolean, default=False)
    has_water_24h: Mapped[bool] = mapped_column(Boolean, default=False)
    has_parking: Mapped[bool] = mapped_column(Boolean, default=False)
    has_kitchen: Mapped[bool] = mapped_column(Boolean, default=False)
    has_bathroom_private: Mapped[bool] = mapped_column(Boolean, default=False)
    allows_couples: Mapped[bool] = mapped_column(Boolean, default=False)
    allows_pets: Mapped[bool] = mapped_column(Boolean, default=False)
    allows_smoking: Mapped[bool] = mapped_column(Boolean, default=False)
    min_stay_months: Mapped[int] = mapped_column(Integer, default=1)
    available_from: Mapped[date] = mapped_column(Date, default=date.today)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_boosted: Mapped[bool] = mapped_column(Boolean, default=False)
    boost_until: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    photos: Mapped[dict | None] = mapped_column(JSON, default=list)
    view_count: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc)
    )

    # Relationships
    owner = relationship("User", back_populates="listings")
    swipes = relationship("Swipe", back_populates="listing", lazy="selectin")
    matches = relationship("Match", back_populates="listing", lazy="selectin")
