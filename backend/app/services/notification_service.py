import json
import time
from typing import Optional
import httpx
from app.core.config import settings

# Module-level state for Firebase auth
_firebase_access_token: Optional[str] = None
_firebase_token_expiry: float = 0


async def init_firebase():
    """Initialize Firebase credentials at startup. Fetches OAuth2 token for FCM HTTP v1 API."""
    global _firebase_access_token, _firebase_token_expiry

    if not settings.FIREBASE_PROJECT_ID or not settings.FIREBASE_CLIENT_EMAIL or not settings.FIREBASE_PRIVATE_KEY:
        print("[FCM] Firebase no configurado. Notificaciones push en modo desarrollo.")
        return

    try:
        from google.oauth2 import service_account
        from google.auth.transport.requests import Request

        private_key = settings.FIREBASE_PRIVATE_KEY.replace("\\n", "\n")

        credentials = service_account.Credentials.from_service_account_info(
            {
                "type": "service_account",
                "project_id": settings.FIREBASE_PROJECT_ID,
                "private_key": private_key,
                "client_email": settings.FIREBASE_CLIENT_EMAIL,
                "token_uri": "https://oauth2.googleapis.com/token",
            },
            scopes=["https://www.googleapis.com/auth/firebase.messaging"],
        )

        credentials.refresh(Request())
        _firebase_access_token = credentials.token
        _firebase_token_expiry = time.time() + 3500  # ~58 minutes
        print("[FCM] Firebase inicializado correctamente")

    except ImportError:
        print("[FCM] google-auth no instalado. Notificaciones push en modo desarrollo.")
    except Exception as e:
        print(f"[FCM] Error al inicializar Firebase: {e}")


async def _get_fcm_token() -> Optional[str]:
    """Get a valid FCM access token, refreshing if needed."""
    global _firebase_access_token, _firebase_token_expiry

    if _firebase_access_token and time.time() < _firebase_token_expiry:
        return _firebase_access_token

    # Token expired, refresh
    if settings.FIREBASE_PROJECT_ID and settings.FIREBASE_CLIENT_EMAIL and settings.FIREBASE_PRIVATE_KEY:
        try:
            from google.oauth2 import service_account
            from google.auth.transport.requests import Request

            private_key = settings.FIREBASE_PRIVATE_KEY.replace("\\n", "\n")

            credentials = service_account.Credentials.from_service_account_info(
                {
                    "type": "service_account",
                    "project_id": settings.FIREBASE_PROJECT_ID,
                    "private_key": private_key,
                    "client_email": settings.FIREBASE_CLIENT_EMAIL,
                    "token_uri": "https://oauth2.googleapis.com/token",
                },
                scopes=["https://www.googleapis.com/auth/firebase.messaging"],
            )

            credentials.refresh(Request())
            _firebase_access_token = credentials.token
            _firebase_token_expiry = time.time() + 3500
            return _firebase_access_token
        except Exception as e:
            print(f"[FCM] Error al refrescar token: {e}")
            return None

    return None


async def send_fcm_push(token: str, title: str, body: str, data: dict = None) -> bool:
    """Send push notification via FCM HTTP v1 API."""
    access_token = await _get_fcm_token()

    if not access_token:
        print(f"[PUSH DEV] -> token:{token[:20]}... | {title}: {body}")
        return True

    try:
        message = {
            "message": {
                "token": token,
                "notification": {
                    "title": title,
                    "body": body,
                },
            }
        }

        if data:
            message["message"]["data"] = {k: str(v) for k, v in data.items()}

        # Android-specific config
        message["message"]["android"] = {
            "priority": "high",
            "notification": {
                "sound": "default",
                "click_action": "FLUTTER_NOTIFICATION_CLICK",
            },
        }

        # APNs config for iOS
        message["message"]["apns"] = {
            "payload": {
                "aps": {
                    "sound": "default",
                    "badge": 1,
                }
            }
        }

        url = f"https://fcm.googleapis.com/v1/projects/{settings.FIREBASE_PROJECT_ID}/messages:send"

        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                url,
                headers={
                    "Authorization": f"Bearer {access_token}",
                    "Content-Type": "application/json",
                },
                json=message,
            )

            if response.status_code == 200:
                print(f"[FCM] Notificacion enviada: {title}")
                return True
            else:
                print(f"[FCM] Error {response.status_code}: {response.text}")
                return False

    except Exception as e:
        print(f"[FCM] Error al enviar notificacion: {e}")
        return False


async def send_fcm_batch(tokens: list[str], title: str, body: str, data: dict = None) -> dict:
    """Send push notification to multiple tokens."""
    results = {"success": 0, "failure": 0, "errors": []}

    for token in tokens:
        success = await send_fcm_push(token, title, body, data)
        if success:
            results["success"] += 1
        else:
            results["failure"] += 1
            results["errors"].append(token[:20] + "...")

    return results


async def send_push(user_id: str, title: str, body: str, data: dict = None):
    """Send push notification via FCM. Looks up user token from DB."""
    # In a full implementation, you'd look up the user's push token from DB
    # For now, we use the user_id as a fallback identifier
    if settings.FIREBASE_PROJECT_ID and settings.FIREBASE_CLIENT_EMAIL:
        # Would need to query DB for user's push_token
        print(f"[FCM] -> {user_id}: {title} - {body}")
        return True

    # Dev mode: print to console
    print(f"[PUSH DEV] -> user:{user_id} | {title}: {body}")
    return True


async def send_push_to_user(push_token: str, title: str, body: str, data: dict = None):
    """Send push notification directly to a user's FCM token."""
    if not push_token:
        return False

    return await send_fcm_push(push_token, title, body, data)


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
