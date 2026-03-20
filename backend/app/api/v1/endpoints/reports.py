from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.listing import Listing
from app.models.report import Report, ReportReason, ReportStatus
from app.models.block import Block

router = APIRouter()


# --- Schemas ---

class ReportCreate(BaseModel):
    reported_user_id: Optional[str] = None
    reported_listing_id: Optional[str] = None
    reason: str
    description: Optional[str] = None


class ReportResponse(BaseModel):
    id: str
    reporter_id: str
    reported_user_id: Optional[str] = None
    reported_listing_id: Optional[str] = None
    reason: str
    description: Optional[str] = None
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}


class BlockedUserResponse(BaseModel):
    id: str
    blocked_id: str
    blocked_name: str
    blocked_photo: Optional[str] = None
    created_at: datetime


# --- Report Endpoints ---

@router.post("", response_model=ReportResponse, status_code=201)
async def create_report(
    data: ReportCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Crear un reporte contra un usuario o publicacion."""
    if not data.reported_user_id and not data.reported_listing_id:
        raise HTTPException(
            status_code=400,
            detail="Debes especificar un usuario o publicacion a reportar",
        )

    # Validate reason
    try:
        ReportReason(data.reason)
    except ValueError:
        valid_reasons = ", ".join([r.value for r in ReportReason])
        raise HTTPException(
            status_code=400,
            detail=f"Razon invalida. Opciones validas: {valid_reasons}",
        )

    # Validate reported user exists
    if data.reported_user_id:
        if data.reported_user_id == current_user.id:
            raise HTTPException(status_code=400, detail="No puedes reportarte a ti mismo")
        result = await db.execute(select(User).where(User.id == data.reported_user_id))
        if not result.scalar_one_or_none():
            raise HTTPException(status_code=404, detail="Usuario reportado no encontrado")

    # Validate reported listing exists
    if data.reported_listing_id:
        result = await db.execute(select(Listing).where(Listing.id == data.reported_listing_id))
        listing = result.scalar_one_or_none()
        if not listing:
            raise HTTPException(status_code=404, detail="Publicacion reportada no encontrada")
        # If no reported_user_id, use listing owner
        if not data.reported_user_id:
            data.reported_user_id = listing.owner_id

    report = Report(
        reporter_id=current_user.id,
        reported_user_id=data.reported_user_id,
        reported_listing_id=data.reported_listing_id,
        reason=data.reason,
        description=data.description,
        status=ReportStatus.pending,
    )
    db.add(report)
    await db.flush()
    await db.refresh(report)

    return ReportResponse.model_validate(report)


@router.get("/my", response_model=List[ReportResponse])
async def get_my_reports(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Obtener mis reportes enviados."""
    result = await db.execute(
        select(Report)
        .where(Report.reporter_id == current_user.id)
        .order_by(Report.created_at.desc())
    )
    reports = result.scalars().all()
    return [ReportResponse.model_validate(r) for r in reports]


# --- Block Endpoints ---

@router.post("/users/{user_id}/block")
async def block_user(
    user_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Bloquear a un usuario. Sus publicaciones no apareceran en tu feed."""
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="No puedes bloquearte a ti mismo")

    # Verify user exists
    result = await db.execute(select(User).where(User.id == user_id))
    target_user = result.scalar_one_or_none()
    if not target_user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    # Check if already blocked
    result = await db.execute(
        select(Block).where(
            Block.blocker_id == current_user.id,
            Block.blocked_id == user_id,
        )
    )
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Este usuario ya esta bloqueado")

    block = Block(blocker_id=current_user.id, blocked_id=user_id)
    db.add(block)
    await db.commit()

    return {"message": f"Usuario {target_user.full_name} bloqueado"}


@router.delete("/users/{user_id}/block")
async def unblock_user(
    user_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Desbloquear a un usuario."""
    result = await db.execute(
        select(Block).where(
            Block.blocker_id == current_user.id,
            Block.blocked_id == user_id,
        )
    )
    block = result.scalar_one_or_none()
    if not block:
        raise HTTPException(status_code=404, detail="Este usuario no esta bloqueado")

    await db.delete(block)
    await db.commit()

    return {"message": "Usuario desbloqueado"}


@router.get("/users/me/blocked", response_model=List[BlockedUserResponse])
async def get_blocked_users(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Listar usuarios bloqueados."""
    result = await db.execute(
        select(Block).where(Block.blocker_id == current_user.id).order_by(Block.created_at.desc())
    )
    blocks = result.scalars().all()

    response = []
    for block in blocks:
        result = await db.execute(select(User).where(User.id == block.blocked_id))
        blocked_user = result.scalar_one_or_none()
        if blocked_user:
            response.append(BlockedUserResponse(
                id=block.id,
                blocked_id=blocked_user.id,
                blocked_name=blocked_user.full_name,
                blocked_photo=blocked_user.profile_photo,
                created_at=block.created_at,
            ))

    return response
