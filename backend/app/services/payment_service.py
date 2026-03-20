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
    """Create charge via Culqi API or simulate in dev."""
    if settings.CULQI_SECRET_KEY and not settings.CULQI_SECRET_KEY.startswith("sk_test_REEMPLAZAR"):
        import httpx

        async with httpx.AsyncClient() as client:
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
                },
            )
            return response.json()

    # Dev mode: simulate success
    print(f"[CULQI DEV] Charge simulated: {amount_cents} centimos - {description}")
    return {"id": f"chr_test_{uuid.uuid4().hex[:12]}", "outcome": {"type": "venta_exitosa"}}


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
