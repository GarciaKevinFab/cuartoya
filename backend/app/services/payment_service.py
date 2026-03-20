import uuid
from datetime import datetime, timedelta, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.config import settings
from app.models.user import User
from app.models.listing import Listing
from app.models.subscription import Subscription, SubscriptionPlan

PRICES = {
    "pro": 2500,       # S/25.00 in cents
    "agency": 6500,    # S/65.00
    "boost_7": 1200,   # S/12.00
    "boost_15": 2200,  # S/22.00
    "boost_30": 3800,  # S/38.00
}


async def create_culqi_charge(token: str, amount_cents: int, email: str, description: str) -> dict:
    """Create charge via Culqi API v2 or simulate in dev."""
    if settings.CULQI_SECRET_KEY and not settings.CULQI_SECRET_KEY.startswith("sk_test_REEMPLAZAR"):
        import httpx

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    "https://api.culqi.com/v2/charges",
                    headers={
                        "Authorization": f"Bearer {settings.CULQI_SECRET_KEY}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "amount": amount_cents,
                        "currency_code": "PEN",
                        "email": email,
                        "source_id": token,
                        "description": description,
                        "metadata": {
                            "app": "CuartoYa",
                            "email": email,
                        },
                    },
                )

                data = response.json()

                if response.status_code in (200, 201):
                    return data
                else:
                    error_msg = data.get("user_message", data.get("merchant_message", "Error en el pago"))
                    return {"error": True, "message": error_msg, "status_code": response.status_code}

        except httpx.TimeoutException:
            return {"error": True, "message": "Tiempo de espera agotado con Culqi"}
        except httpx.RequestError as e:
            return {"error": True, "message": f"Error de conexion con Culqi: {str(e)}"}

    # Dev mode: simulate success
    print(f"[CULQI DEV] Charge simulated: {amount_cents} centimos - {description}")
    return {
        "id": f"chr_test_{uuid.uuid4().hex[:12]}",
        "amount": amount_cents,
        "currency_code": "PEN",
        "email": email,
        "description": description,
        "outcome": {"type": "venta_exitosa"},
        "source": {"type": "token"},
    }


async def create_culqi_refund(charge_id: str, amount_cents: int, reason: str = "solicitud del usuario") -> dict:
    """Create a refund via Culqi API v2 or simulate in dev."""
    if settings.CULQI_SECRET_KEY and not settings.CULQI_SECRET_KEY.startswith("sk_test_REEMPLAZAR"):
        import httpx

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    "https://api.culqi.com/v2/refunds",
                    headers={
                        "Authorization": f"Bearer {settings.CULQI_SECRET_KEY}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "amount": amount_cents,
                        "charge_id": charge_id,
                        "reason": reason,
                    },
                )

                data = response.json()

                if response.status_code in (200, 201):
                    return data
                else:
                    error_msg = data.get("user_message", data.get("merchant_message", "Error en el reembolso"))
                    return {"error": True, "message": error_msg}

        except httpx.TimeoutException:
            return {"error": True, "message": "Tiempo de espera agotado con Culqi"}
        except httpx.RequestError as e:
            return {"error": True, "message": f"Error de conexion con Culqi: {str(e)}"}

    # Dev mode: simulate refund
    print(f"[CULQI DEV] Refund simulated: {amount_cents} centimos for charge {charge_id}")
    return {
        "id": f"ref_test_{uuid.uuid4().hex[:12]}",
        "charge_id": charge_id,
        "amount": amount_cents,
        "reason": reason,
    }


async def process_culqi_webhook(event_type: str, data: dict, db: AsyncSession) -> dict:
    """Process Culqi webhook notifications."""
    if event_type == "charge.creation.succeeded":
        charge_id = data.get("id", "")
        metadata = data.get("metadata", {})
        print(f"[CULQI WEBHOOK] Pago exitoso: {charge_id}")
        return {"processed": True, "event": event_type, "charge_id": charge_id}

    elif event_type == "charge.creation.failed":
        charge_id = data.get("id", "")
        print(f"[CULQI WEBHOOK] Pago fallido: {charge_id}")
        # Deactivate subscription if associated
        result = await db.execute(
            select(Subscription).where(Subscription.culqi_charge_id == charge_id)
        )
        sub = result.scalar_one_or_none()
        if sub:
            sub.is_active = False
            result2 = await db.execute(select(User).where(User.id == sub.user_id))
            user = result2.scalar_one_or_none()
            if user:
                user.is_premium = False
                user.premium_until = None
            await db.commit()
        return {"processed": True, "event": event_type, "charge_id": charge_id}

    elif event_type == "refund.creation.succeeded":
        refund_id = data.get("id", "")
        charge_id = data.get("charge_id", "")
        print(f"[CULQI WEBHOOK] Reembolso exitoso: {refund_id} para cargo {charge_id}")
        return {"processed": True, "event": event_type, "refund_id": refund_id}

    else:
        print(f"[CULQI WEBHOOK] Evento no manejado: {event_type}")
        return {"processed": False, "event": event_type, "message": "Evento no manejado"}


def generate_receipt(subscription: Subscription, user_email: str) -> dict:
    """Generate a receipt/invoice for a subscription payment."""
    return {
        "receipt_id": f"REC-{subscription.id[:8].upper()}",
        "date": subscription.created_at.strftime("%d/%m/%Y %H:%M"),
        "customer_email": user_email,
        "plan": subscription.plan,
        "amount": float(subscription.amount),
        "currency": "PEN",
        "period": {
            "start": subscription.starts_at.strftime("%d/%m/%Y"),
            "end": subscription.ends_at.strftime("%d/%m/%Y"),
        },
        "charge_id": subscription.culqi_charge_id,
        "company": {
            "name": "CuartoYa",
            "ruc": "20XXXXXXXXX",
            "address": "Huancayo, Junin, Peru",
        },
        "status": "pagado",
    }


async def activate_subscription(db: AsyncSession, user_id: str, plan: str, charge_id: str):
    """Activate premium subscription."""
    now = datetime.now(timezone.utc)
    ends_at = now + timedelta(days=30)
    amount = PRICES[plan] / 100

    sub = Subscription(
        user_id=user_id,
        plan=plan,
        culqi_charge_id=charge_id,
        amount=amount,
        starts_at=now,
        ends_at=ends_at,
        is_active=True,
    )
    db.add(sub)

    # Update user premium status
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one()
    user.is_premium = True
    user.premium_until = ends_at
    await db.commit()

    return sub


async def activate_boost(db: AsyncSession, listing_id: str, days: int, charge_id: str):
    """Activate listing boost."""
    now = datetime.now(timezone.utc)
    boost_until = now + timedelta(days=days)

    result = await db.execute(select(Listing).where(Listing.id == listing_id))
    listing = result.scalar_one()
    listing.is_boosted = True
    listing.boost_until = boost_until
    await db.commit()

    return listing
