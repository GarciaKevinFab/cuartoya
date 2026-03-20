import httpx
from app.core.config import settings


async def verify_dni(dni: str) -> dict:
    """
    Verifica un DNI contra la API de RENIEC (via apis.net.pe).
    Si no hay API key configurado, simula una respuesta exitosa para desarrollo.
    """
    if len(dni) != 8 or not dni.isdigit():
        return {"success": False, "error": "El DNI debe tener 8 digitos numericos"}

    if settings.RENIEC_API_TOKEN:
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(
                    f"https://api.apis.net.pe/v2/reniec/dni?numero={dni}",
                    headers={"Authorization": f"Bearer {settings.RENIEC_API_TOKEN}"},
                )

                if response.status_code == 200:
                    data = response.json()
                    full_name = f"{data.get('nombres', '')} {data.get('apellidoPaterno', '')} {data.get('apellidoMaterno', '')}".strip()
                    return {
                        "success": True,
                        "dni": dni,
                        "full_name": full_name,
                        "nombres": data.get("nombres", ""),
                        "apellido_paterno": data.get("apellidoPaterno", ""),
                        "apellido_materno": data.get("apellidoMaterno", ""),
                        "verified": True,
                    }
                elif response.status_code == 404:
                    return {"success": False, "error": "DNI no encontrado en RENIEC"}
                elif response.status_code == 422:
                    return {"success": False, "error": "DNI invalido"}
                else:
                    return {"success": False, "error": f"Error en la API de RENIEC (codigo {response.status_code})"}

        except httpx.TimeoutException:
            return {"success": False, "error": "Tiempo de espera agotado al consultar RENIEC"}
        except httpx.RequestError as e:
            return {"success": False, "error": f"Error de conexion con RENIEC: {str(e)}"}

    # Modo desarrollo: simular respuesta exitosa
    print(f"[RENIEC DEV] Verificacion simulada para DNI: {dni}")
    return {
        "success": True,
        "dni": dni,
        "full_name": "Usuario Simulado Desarrollo",
        "nombres": "Usuario",
        "apellido_paterno": "Simulado",
        "apellido_materno": "Desarrollo",
        "verified": True,
    }


def names_match(reniec_name: str, user_name: str) -> bool:
    """
    Compara el nombre de RENIEC con el nombre del usuario.
    Normaliza y compara de forma flexible (al menos 2 palabras coinciden).
    """
    reniec_parts = set(reniec_name.lower().split())
    user_parts = set(user_name.lower().split())
    common = reniec_parts & user_parts
    return len(common) >= 2
