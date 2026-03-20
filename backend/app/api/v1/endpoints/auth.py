from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.security import get_password_hash, verify_password, create_access_token
from app.models.user import User
from app.schemas.user import UserCreate, UserResponse
from app.schemas.auth import LoginRequest, TokenResponse, ForgotPasswordRequest, ResetPasswordRequest, VerifyPhoneRequest

router = APIRouter()


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

    user = User(
        email=user_data.email,
        phone=user_data.phone,
        full_name=user_data.full_name,
        hashed_password=get_password_hash(user_data.password),
        role=user_data.role,
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
    result = await db.execute(select(User).where(User.email == data.email))
    user = result.scalar_one_or_none()
    if user:
        # In production, send email with reset token
        print(f"[DEV] Email de recuperacion enviado a: {data.email}")
    return {"message": "Si el email existe, recibiras un enlace de recuperacion"}


@router.post("/reset-password")
async def reset_password(data: ResetPasswordRequest, db: AsyncSession = Depends(get_db)):
    # In production, validate the reset token
    raise HTTPException(status_code=501, detail="Reset password no implementado aun")
