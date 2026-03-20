import secrets
import time
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.security import get_password_hash, verify_password, create_access_token
from app.core.config import settings
from app.models.user import User, UserRole
from app.schemas.user import UserCreate, UserResponse
from app.schemas.auth import LoginRequest, TokenResponse, ForgotPasswordRequest, ResetPasswordRequest, VerifyPhoneRequest
from app.services.notification_service import send_email

router = APIRouter()

# In-memory password reset token storage
# Format: {token: {"user_id": str, "expires_at": float}}
_reset_tokens: dict[str, dict] = {}

# Token expiry in seconds (1 hour)
RESET_TOKEN_EXPIRY = 3600


def _cleanup_expired_tokens():
    """Remove expired tokens from memory."""
    now = time.time()
    expired = [token for token, data in _reset_tokens.items() if data["expires_at"] < now]
    for token in expired:
        del _reset_tokens[token]


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate, db: AsyncSession = Depends(get_db)):
    # Check duplicate email
    result = await db.execute(select(User).where(User.email == user_data.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="El email ya esta registrado")

    # Check duplicate phone
    result = await db.execute(select(User).where(User.phone == user_data.phone))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="El telefono ya esta registrado")

    # Determine role: auto-assign admin if email is in admin list
    role = user_data.role
    if user_data.email in settings.admin_emails_list:
        role = UserRole.admin

    user = User(
        email=user_data.email,
        phone=user_data.phone,
        full_name=user_data.full_name,
        hashed_password=get_password_hash(user_data.password),
        role=role,
    )
    db.add(user)
    await db.flush()
    await db.refresh(user)

    token = create_access_token({"sub": user.id})
    return TokenResponse(
        access_token=token,
        user=UserResponse.model_validate(user),
    )


@router.post("/login", response_model=TokenResponse)
async def login(data: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == data.email))
    user = result.scalar_one_or_none()

    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Credenciales incorrectas")

    if not user.is_active:
        raise HTTPException(status_code=401, detail="Cuenta desactivada")

    if user.is_banned:
        detail = "Tu cuenta ha sido suspendida"
        if user.ban_reason:
            detail += f": {user.ban_reason}"
        raise HTTPException(status_code=403, detail=detail)

    token = create_access_token({"sub": user.id})
    return TokenResponse(
        access_token=token,
        user=UserResponse.model_validate(user),
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(db: AsyncSession = Depends(get_db)):
    # In a real app, validate the refresh token
    raise HTTPException(status_code=501, detail="Refresh token no implementado aun")


@router.post("/logout")
async def logout():
    # In production, blacklist the token in Redis
    return {"message": "Sesion cerrada exitosamente"}


@router.post("/verify-phone")
async def verify_phone(data: VerifyPhoneRequest):
    # Stub for phone verification
    print(f"[DEV] Verificacion telefono: {data.phone} con codigo {data.code}")
    return {"message": "Telefono verificado (modo desarrollo)"}


@router.post("/forgot-password")
async def forgot_password(data: ForgotPasswordRequest, db: AsyncSession = Depends(get_db)):
    """Solicitar enlace de recuperacion de contrasena."""
    _cleanup_expired_tokens()

    result = await db.execute(select(User).where(User.email == data.email))
    user = result.scalar_one_or_none()

    # Always return success message to avoid email enumeration
    if user:
        # Generate secure token
        token = secrets.token_urlsafe(32)
        _reset_tokens[token] = {
            "user_id": user.id,
            "expires_at": time.time() + RESET_TOKEN_EXPIRY,
        }

        # Build reset URL
        reset_url = f"{settings.FRONTEND_URL}/reset-password?token={token}"

        # Send email
        html = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #6366f1;">CuartoYa - Recuperar Contrasena</h2>
            <p>Hola {user.full_name},</p>
            <p>Recibimos una solicitud para restablecer tu contrasena.</p>
            <p>Haz clic en el siguiente enlace para crear una nueva contrasena:</p>
            <p>
                <a href="{reset_url}"
                   style="background: #6366f1; color: white; padding: 12px 24px;
                          text-decoration: none; border-radius: 8px; display: inline-block;">
                    Restablecer Contrasena
                </a>
            </p>
            <p style="color: #666; font-size: 14px;">
                Este enlace expira en 1 hora. Si no solicitaste este cambio, ignora este email.
            </p>
            <p style="color: #666; font-size: 12px;">
                Token: {token}
            </p>
        </div>
        """

        await send_email(user.email, "CuartoYa - Recuperar Contrasena", html)
        print(f"[RESET] Token generado para {data.email}: {token}")

    return {"message": "Si el email existe, recibiras un enlace de recuperacion"}


@router.post("/reset-password")
async def reset_password(data: ResetPasswordRequest, db: AsyncSession = Depends(get_db)):
    """Restablecer contrasena usando token de recuperacion."""
    _cleanup_expired_tokens()

    token_data = _reset_tokens.get(data.token)
    if not token_data:
        raise HTTPException(
            status_code=400,
            detail="Token invalido o expirado. Solicita un nuevo enlace de recuperacion.",
        )

    if token_data["expires_at"] < time.time():
        del _reset_tokens[data.token]
        raise HTTPException(
            status_code=400,
            detail="El token ha expirado. Solicita un nuevo enlace de recuperacion.",
        )

    if len(data.new_password) < 8:
        raise HTTPException(
            status_code=400,
            detail="La contrasena debe tener al menos 8 caracteres",
        )

    # Update password
    result = await db.execute(select(User).where(User.id == token_data["user_id"]))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    user.hashed_password = get_password_hash(data.new_password)
    await db.commit()

    # Invalidate the token
    del _reset_tokens[data.token]

    return {"message": "Contrasena actualizada exitosamente. Ya puedes iniciar sesion."}
