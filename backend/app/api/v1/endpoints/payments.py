from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.listing import Listing
from app.models.subscription import Subscription
from app.schemas.payment import SubscribeRequest, BoostRequest, PaymentResponse
from app.services.payment_service import create_culqi_charge, activate_subscription, activate_boost, PRICES

router = APIRouter()


@router.post("/subscribe")
async def subscribe(
    data: SubscribeRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if data.plan not in ("pro", "agency"):
        raise HTTPException(status_code=400, detail="Plan invalido. Usa 'pro' o 'agency'")

    amount = PRICES[data.plan]
    description = f"CuartoYa Plan {data.plan.title()} - {current_user.email}"

    charge = await create_culqi_charge(data.culqi_token, amount, current_user.email, description)

    if "id" not in charge:
        raise HTTPException(status_code=400, detail="Error en el pago")

    sub = await activate_subscription(db, current_user.id, data.plan, charge["id"])

    return {
        "message": f"Suscripcion {data.plan.title()} activada",
        "subscription_id": sub.id,
        "charge_id": charge["id"],
    }


@router.post("/boost")
async def boost_listing(
    data: BoostRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if data.days not in (7, 15, 30):
        raise HTTPException(status_code=400, detail="Duracion invalida. Usa 7, 15 o 30 dias")

    # Verify listing ownership
    result = await db.execute(select(Listing).where(Listing.id == data.listing_id))
    listing = result.scalar_one_or_none()
    if not listing or listing.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="No tienes permiso para impulsar esta publicacion")

    amount = PRICES[f"boost_{data.days}"]
    description = f"CuartoYa Boost {data.days} dias - {listing.title}"

    charge = await create_culqi_charge(data.culqi_token, amount, current_user.email, description)

    if "id" not in charge:
        raise HTTPException(status_code=400, detail="Error en el pago")

    updated = await activate_boost(db, data.listing_id, data.days, charge["id"])

    return {
        "message": f"Publicacion impulsada por {data.days} dias",
        "listing_id": updated.id,
        "boost_until": str(updated.boost_until),
    }


@router.get("/history", response_model=List[PaymentResponse])
async def get_payment_history(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Subscription)
        .where(Subscription.user_id == current_user.id)
        .order_by(Subscription.created_at.desc())
    )
    subs = result.scalars().all()
    return [
        PaymentResponse(
            id=s.id,
            plan=s.plan,
            amount=float(s.amount),
            status="active" if s.is_active else "expired",
            created_at=s.created_at,
        )
        for s in subs
    ]


@router.post("/cancel")
async def cancel_subscription(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Subscription)
        .where(Subscription.user_id == current_user.id, Subscription.is_active == True)
        .order_by(Subscription.created_at.desc())
        .limit(1)
    )
    sub = result.scalar_one_or_none()
    if not sub:
        raise HTTPException(status_code=404, detail="No tienes una suscripcion activa")

    sub.is_active = False
    current_user.is_premium = False
    current_user.premium_until = None
    await db.commit()

    return {"message": "Suscripcion cancelada"}
