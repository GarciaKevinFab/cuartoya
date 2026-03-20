from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
from pathlib import Path
from app.core.config import settings
from app.core.database import create_tables
from app.core.rate_limit import RateLimitMiddleware
from app.api.v1.endpoints.auth import router as auth_router
from app.api.v1.endpoints.users import router as users_router
from app.api.v1.endpoints.listings import router as listings_router
from app.api.v1.endpoints.swipes import router as swipes_router
from app.api.v1.endpoints.matches import router as matches_router
from app.api.v1.endpoints.payments import router as payments_router
from app.api.v1.endpoints.websocket import router as ws_router
from app.api.v1.endpoints.verification import router as verification_router
from app.api.v1.endpoints.webhooks import router as webhooks_router
from app.api.v1.endpoints.reports import router as reports_router
from app.api.v1.endpoints.admin import router as admin_router
from app.api.v1.endpoints.favorites import router as favorites_router
from app.services.notification_service import init_firebase

APP_VERSION = "2.0.0"


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await create_tables()
    await init_firebase()
    Path("uploads").mkdir(exist_ok=True)
    print(f"[CuartoYa] API v{APP_VERSION} iniciada en modo {settings.APP_ENV}")
    yield
    # Shutdown
    print(f"[CuartoYa] API detenida")


app = FastAPI(
    title="CuartoYa API",
    description="API para la app de alquiler de habitaciones en la region Junin, Peru",
    version=APP_VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# Middleware order: LAST added = FIRST to execute (outermost)
# So we add: GZip first (innermost), then RateLimit, then CORS last (outermost)
# This ensures CORS handles preflight OPTIONS before anything else

app.add_middleware(GZipMiddleware)
app.add_middleware(RateLimitMiddleware, max_calls=120, period=60)

# CORS — must be outermost (added last) to handle preflight requests
cors_origins = settings.cors_origins_list
if settings.APP_ENV == "development":
    cors_origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True if settings.APP_ENV != "development" else False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static files for local uploads
uploads_path = Path("uploads")
uploads_path.mkdir(exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# API routes
app.include_router(auth_router, prefix="/api/v1/auth", tags=["Auth"])
app.include_router(users_router, prefix="/api/v1/users", tags=["Users"])
app.include_router(listings_router, prefix="/api/v1/listings", tags=["Listings"])
app.include_router(swipes_router, prefix="/api/v1/swipes", tags=["Swipes"])
app.include_router(matches_router, prefix="/api/v1/matches", tags=["Matches"])
app.include_router(payments_router, prefix="/api/v1/payments", tags=["Payments"])
app.include_router(verification_router, prefix="/api/v1/verification", tags=["Verification"])
app.include_router(webhooks_router, prefix="/api/v1/webhooks", tags=["Webhooks"])
app.include_router(reports_router, prefix="/api/v1/reports", tags=["Reports"])
app.include_router(admin_router, prefix="/api/v1/admin", tags=["Admin"])
app.include_router(favorites_router, prefix="/api/v1/favorites", tags=["Favorites"])

# WebSocket routes
app.include_router(ws_router, prefix="/ws", tags=["WebSocket"])


@app.get("/health")
async def health_check():
    """Health check con verificacion de conectividad a la base de datos."""
    health = {
        "status": "ok",
        "app": "CuartoYa",
        "version": APP_VERSION,
        "database": "unknown",
        "redis": "unknown",
    }

    # Check database connectivity
    try:
        from sqlalchemy import text
        from app.core.database import async_session

        async with async_session() as db:
            await db.execute(text("SELECT 1"))
        health["database"] = "connected"
    except Exception as e:
        health["database"] = f"error: {str(e)[:100]}"
        health["status"] = "degraded"

    # Check Redis connectivity
    try:
        import redis.asyncio as aioredis

        r = aioredis.from_url(settings.REDIS_URL, socket_connect_timeout=2)
        await r.ping()
        health["redis"] = "connected"
        await r.aclose()
    except Exception:
        health["redis"] = "not_available"
        # Redis is optional, don't degrade status

    return health
