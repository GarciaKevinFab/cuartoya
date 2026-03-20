from app.core.config import settings


async def send_push(user_id: str, title: str, body: str, data: dict = None):
    """Send push notification via FCM."""
    if settings.FIREBASE_PROJECT_ID:
        # Firebase Admin SDK implementation would go here
        print(f"[FCM] -> {user_id}: {title} - {body}")
        return True

    # Dev mode: print to console
    print(f"[PUSH DEV] -> user:{user_id} | {title}: {body}")
    return True


async def send_email(to: str, subject: str, html: str):
    """Send email via Resend."""
    if settings.RESEND_API_KEY:
        import resend

        resend.api_key = settings.RESEND_API_KEY
        resend.Emails.send(
            {
                "from": settings.EMAIL_FROM,
                "to": to,
                "subject": subject,
                "html": html,
            }
        )
        print(f"[EMAIL] -> {to}: {subject}")
        return True

    # Dev mode: print to console
    print(f"[EMAIL DEV] -> {to} | {subject}")
    return True


async def notify_new_like(landlord_id: str, tenant_name: str, listing_title: str):
    """Notify landlord about a new like."""
    await send_push(
        landlord_id,
        "Nuevo interes en tu cuarto",
        f"{tenant_name} esta interesado en '{listing_title}'",
        {"type": "new_like"},
    )


async def notify_match(tenant_id: str, listing_title: str):
    """Notify tenant about a match."""
    await send_push(
        tenant_id,
        "Tienes un match!",
        f"El propietario de '{listing_title}' acepto tu solicitud",
        {"type": "match"},
    )


async def notify_new_message(recipient_id: str, sender_name: str, preview: str):
    """Notify about new chat message."""
    await send_push(
        recipient_id,
        f"Mensaje de {sender_name}",
        preview[:100],
        {"type": "message"},
    )
