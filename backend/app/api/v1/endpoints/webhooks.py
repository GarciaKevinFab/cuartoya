import hmac
import hashlib
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.config import settings
from app.services.payment_service import process_culqi_webhook

router = APIRouter()


@router.post("/culqi")
async def culqi_webhook(
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """
    Webhook endpoint for Culqi payment notifications.
    Culqi sends POST requests when payment events occur.
    """
    try:
        body = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Body JSON invalido")

    event_type = body.get("type", "")
    data = body.get("data", {})

    if not event_type:
        raise HTTPException(status_code=400, detail="Tipo de evento no especificado")

    # Process the webhook event
    result = await process_culqi_webhook(event_type, data, db)

    return {"status": "ok", "result": result}
