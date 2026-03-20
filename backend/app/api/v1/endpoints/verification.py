from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, field_validator
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.services.reniec_service import verify_dni, names_match

router = APIRouter()


class DNIVerifyRequest(BaseModel):
    dni: str

    @field_validator("dni")
    @classmethod
    def validate_dni(cls, v):
        if len(v) != 8 or not v.isdigit():
            raise ValueError("El DNI debe tener exactamente 8 digitos")
        return v


class DNIVerifyResponse(BaseModel):
    verified: bool
    message: str
    reniec_name: str | None = None
    dni: str | None = None


class VerificationStatusResponse(BaseModel):
    is_verified: bool
    dni: str | None = None
    full_name: str


@router.post("/dni", response_model=DNIVerifyResponse)
async def verify_user_dni(
    data: DNIVerifyRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Verifica el DNI del usuario contra RENIEC y actualiza su estado de verificacion."""
    if current_user.is_verified:
        return DNIVerifyResponse(
            verified=True,
            message="Tu cuenta ya esta verificada",
            reniec_name=current_user.full_name,
            dni=current_user.dni,
        )

    # Call RENIEC API
    result = await verify_dni(data.dni)

    if not result.get("success"):
        raise HTTPException(
            status_code=400,
            detail=result.get("error", "Error al verificar DNI"),
        )

    reniec_name = result.get("full_name", "")

    # Check if names match
    if names_match(reniec_name, current_user.full_name):
        current_user.is_verified = True
        current_user.dni = data.dni
        await db.commit()
        await db.refresh(current_user)

        return DNIVerifyResponse(
            verified=True,
            message="DNI verificado exitosamente. Tu cuenta esta verificada.",
            reniec_name=reniec_name,
            dni=data.dni,
        )
    else:
        return DNIVerifyResponse(
            verified=False,
            message="El nombre en RENIEC no coincide con tu perfil. Actualiza tu nombre y vuelve a intentar.",
            reniec_name=reniec_name,
            dni=data.dni,
        )


@router.get("/status", response_model=VerificationStatusResponse)
async def get_verification_status(
    current_user: User = Depends(get_current_user),
):
    """Retorna el estado de verificacion actual del usuario."""
    return VerificationStatusResponse(
        is_verified=current_user.is_verified,
        dni=current_user.dni,
        full_name=current_user.full_name,
    )
