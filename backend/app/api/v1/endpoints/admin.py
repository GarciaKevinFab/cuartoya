from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from datetime import datetime, timezone
from app.core.database import get_db
from app.core.security import get_current_user
from app.core.config import settings
from app.models.user import User, UserRole
from app.models.listing import Listing
from app.models.match import Match
from app.models.swipe import Swipe
from app.models.subscription import Subscription
from app.models.report import Report, ReportStatus

router = APIRouter()


# --- Helpers ---

async def get_admin_user(
    current_user: User = Depends(get_current_user),
) -> User:
    """Verify user is admin."""
    is_admin = (
        current_user.role == UserRole.admin
        or current_user.email in settings.admin_emails_list
    )
    if not is_admin:
        raise HTTPException(status_code=403, detail="Se requiere rol de administrador")
    return current_user


# --- Schemas ---

class GlobalStats(BaseModel):
    total_users: int
    total_listings: int
    active_listings: int
    total_matches: int
    total_swipes: int
    total_subscriptions: int
    active_subscriptions: int
    total_revenue: float
    pending_reports: int


class AdminUserResponse(BaseModel):
    id: str
    email: str
    phone: str
    full_name: str
    role: str
    is_verified: bool
    is_premium: bool
    is_active: bool
    is_banned: bool
    listings_count: int = 0
    created_at: datetime

    model_config = {"from_attributes": True}


class AdminUserList(BaseModel):
    users: List[AdminUserResponse]
    total: int
    page: int
    pages: int


class BanRequest(BaseModel):
    banned: bool
    reason: Optional[str] = None


class AdminReportResponse(BaseModel):
    id: str
    reporter_id: str
    reporter_name: str
    reported_user_id: Optional[str] = None
    reported_user_name: Optional[str] = None
    reported_listing_id: Optional[str] = None
    reported_listing_title: Optional[str] = None
    reason: str
    description: Optional[str] = None
    status: str
    admin_notes: Optional[str] = None
    created_at: datetime
    reviewed_at: Optional[datetime] = None


class ResolveReportRequest(BaseModel):
    status: str  # reviewed, resolved, dismissed
    admin_notes: Optional[str] = None


class AdminListingResponse(BaseModel):
    id: str
    owner_id: str
    owner_name: str
    title: str
    price: float
    district: str
    city: str
    is_active: bool
    is_boosted: bool
    view_count: int
    created_at: datetime

    model_config = {"from_attributes": True}


class RevenueBreakdown(BaseModel):
    total_revenue: float
    pro_revenue: float
    agency_revenue: float
    pro_count: int
    agency_count: int
    total_subscriptions: int


# --- Endpoints ---

@router.get("/stats", response_model=GlobalStats)
async def get_global_stats(
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """Estadisticas globales del sistema."""
    result = await db.execute(select(func.count(User.id)))
    total_users = result.scalar() or 0

    result = await db.execute(select(func.count(Listing.id)))
    total_listings = result.scalar() or 0

    result = await db.execute(select(func.count(Listing.id)).where(Listing.is_active == True))
    active_listings = result.scalar() or 0

    result = await db.execute(select(func.count(Match.id)))
    total_matches = result.scalar() or 0

    result = await db.execute(select(func.count(Swipe.id)))
    total_swipes = result.scalar() or 0

    result = await db.execute(select(func.count(Subscription.id)))
    total_subscriptions = result.scalar() or 0

    result = await db.execute(
        select(func.count(Subscription.id)).where(Subscription.is_active == True)
    )
    active_subscriptions = result.scalar() or 0

    result = await db.execute(select(func.sum(Subscription.amount)))
    total_revenue = float(result.scalar() or 0)

    result = await db.execute(
        select(func.count(Report.id)).where(Report.status == ReportStatus.pending)
    )
    pending_reports = result.scalar() or 0

    return GlobalStats(
        total_users=total_users,
        total_listings=total_listings,
        active_listings=active_listings,
        total_matches=total_matches,
        total_swipes=total_swipes,
        total_subscriptions=total_subscriptions,
        active_subscriptions=active_subscriptions,
        total_revenue=total_revenue,
        pending_reports=pending_reports,
    )


@router.get("/users", response_model=AdminUserList)
async def list_users(
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=20, le=100),
    search: Optional[str] = None,
    role: Optional[str] = None,
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """Listar todos los usuarios con paginacion."""
    query = select(User)

    if search:
        query = query.where(
            or_(
                User.full_name.ilike(f"%{search}%"),
                User.email.ilike(f"%{search}%"),
                User.phone.ilike(f"%{search}%"),
            )
        )

    if role:
        query = query.where(User.role == role)

    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    result = await db.execute(count_query)
    total = result.scalar() or 0

    # Paginate
    offset = (page - 1) * per_page
    query = query.order_by(User.created_at.desc()).offset(offset).limit(per_page)
    result = await db.execute(query)
    users = result.scalars().all()

    user_responses = []
    for user in users:
        # Count user listings
        result = await db.execute(
            select(func.count(Listing.id)).where(Listing.owner_id == user.id)
        )
        listings_count = result.scalar() or 0

        user_responses.append(AdminUserResponse(
            id=user.id,
            email=user.email,
            phone=user.phone,
            full_name=user.full_name,
            role=user.role,
            is_verified=user.is_verified,
            is_premium=user.is_premium,
            is_active=user.is_active,
            is_banned=user.is_banned,
            listings_count=listings_count,
            created_at=user.created_at,
        ))

    pages = max(1, (total + per_page - 1) // per_page)

    return AdminUserList(users=user_responses, total=total, page=page, pages=pages)


@router.put("/users/{user_id}/ban")
async def ban_unban_user(
    user_id: str,
    data: BanRequest,
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """Banear o desbanear un usuario."""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    if user.id == admin.id:
        raise HTTPException(status_code=400, detail="No puedes banearte a ti mismo")

    user.is_banned = data.banned
    user.ban_reason = data.reason if data.banned else None

    if data.banned:
        user.is_active = False
        # Deactivate all user listings
        result = await db.execute(select(Listing).where(Listing.owner_id == user_id))
        listings = result.scalars().all()
        for listing in listings:
            listing.is_active = False
    else:
        user.is_active = True

    await db.commit()

    action = "baneado" if data.banned else "desbaneado"
    return {"message": f"Usuario {user.full_name} {action}", "banned": data.banned}


@router.get("/reports", response_model=List[AdminReportResponse])
async def list_reports(
    status: Optional[str] = None,
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=20, le=100),
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """Listar todos los reportes con filtros."""
    query = select(Report)

    if status:
        try:
            ReportStatus(status)
            query = query.where(Report.status == status)
        except ValueError:
            raise HTTPException(status_code=400, detail="Estado de reporte invalido")

    offset = (page - 1) * per_page
    query = query.order_by(Report.created_at.desc()).offset(offset).limit(per_page)

    result = await db.execute(query)
    reports = result.scalars().all()

    response = []
    for report in reports:
        # Get reporter name
        result = await db.execute(select(User).where(User.id == report.reporter_id))
        reporter = result.scalar_one()

        reported_user_name = None
        if report.reported_user_id:
            result = await db.execute(select(User).where(User.id == report.reported_user_id))
            reported_user = result.scalar_one_or_none()
            reported_user_name = reported_user.full_name if reported_user else None

        reported_listing_title = None
        if report.reported_listing_id:
            result = await db.execute(select(Listing).where(Listing.id == report.reported_listing_id))
            reported_listing = result.scalar_one_or_none()
            reported_listing_title = reported_listing.title if reported_listing else None

        response.append(AdminReportResponse(
            id=report.id,
            reporter_id=report.reporter_id,
            reporter_name=reporter.full_name,
            reported_user_id=report.reported_user_id,
            reported_user_name=reported_user_name,
            reported_listing_id=report.reported_listing_id,
            reported_listing_title=reported_listing_title,
            reason=report.reason,
            description=report.description,
            status=report.status,
            admin_notes=report.admin_notes,
            created_at=report.created_at,
            reviewed_at=report.reviewed_at,
        ))

    return response


@router.put("/reports/{report_id}/resolve")
async def resolve_report(
    report_id: str,
    data: ResolveReportRequest,
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """Resolver un reporte."""
    result = await db.execute(select(Report).where(Report.id == report_id))
    report = result.scalar_one_or_none()
    if not report:
        raise HTTPException(status_code=404, detail="Reporte no encontrado")

    valid_statuses = ["reviewed", "resolved", "dismissed"]
    if data.status not in valid_statuses:
        raise HTTPException(
            status_code=400,
            detail=f"Estado invalido. Opciones: {', '.join(valid_statuses)}",
        )

    report.status = data.status
    report.admin_notes = data.admin_notes
    report.reviewed_at = datetime.now(timezone.utc)
    report.reviewed_by = admin.id
    await db.commit()

    return {"message": f"Reporte actualizado a '{data.status}'", "report_id": report_id}


@router.get("/listings", response_model=List[AdminListingResponse])
async def list_all_listings(
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=20, le=100),
    search: Optional[str] = None,
    district: Optional[str] = None,
    city: Optional[str] = None,
    is_active: Optional[bool] = None,
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """Listar todas las publicaciones con filtros."""
    query = select(Listing)

    if search:
        query = query.where(Listing.title.ilike(f"%{search}%"))
    if district:
        query = query.where(Listing.district == district)
    if city:
        query = query.where(Listing.city == city)
    if is_active is not None:
        query = query.where(Listing.is_active == is_active)

    offset = (page - 1) * per_page
    query = query.order_by(Listing.created_at.desc()).offset(offset).limit(per_page)

    result = await db.execute(query)
    listings = result.scalars().all()

    response = []
    for listing in listings:
        result = await db.execute(select(User).where(User.id == listing.owner_id))
        owner = result.scalar_one()

        response.append(AdminListingResponse(
            id=listing.id,
            owner_id=listing.owner_id,
            owner_name=owner.full_name,
            title=listing.title,
            price=float(listing.price),
            district=listing.district,
            city=listing.city,
            is_active=listing.is_active,
            is_boosted=listing.is_boosted,
            view_count=listing.view_count,
            created_at=listing.created_at,
        ))

    return response


@router.delete("/listings/{listing_id}")
async def force_remove_listing(
    listing_id: str,
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """Forzar la eliminacion (desactivacion) de una publicacion."""
    result = await db.execute(select(Listing).where(Listing.id == listing_id))
    listing = result.scalar_one_or_none()
    if not listing:
        raise HTTPException(status_code=404, detail="Publicacion no encontrada")

    listing.is_active = False
    listing.is_boosted = False
    listing.boost_until = None
    await db.commit()

    return {"message": "Publicacion removida por administrador", "listing_id": listing_id}


@router.get("/revenue", response_model=RevenueBreakdown)
async def get_revenue_breakdown(
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """Desglose de ingresos por plan."""
    # Pro revenue
    result = await db.execute(
        select(func.sum(Subscription.amount), func.count(Subscription.id))
        .where(Subscription.plan == "pro")
    )
    row = result.one()
    pro_revenue = float(row[0] or 0)
    pro_count = row[1] or 0

    # Agency revenue
    result = await db.execute(
        select(func.sum(Subscription.amount), func.count(Subscription.id))
        .where(Subscription.plan == "agency")
    )
    row = result.one()
    agency_revenue = float(row[0] or 0)
    agency_count = row[1] or 0

    total_revenue = pro_revenue + agency_revenue
    total_subscriptions = pro_count + agency_count

    return RevenueBreakdown(
        total_revenue=total_revenue,
        pro_revenue=pro_revenue,
        agency_revenue=agency_revenue,
        pro_count=pro_count,
        agency_count=agency_count,
        total_subscriptions=total_subscriptions,
    )
