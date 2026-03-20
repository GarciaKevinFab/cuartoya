from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
from pathlib import Path
from app.core.config import settings
from app.core.database import create_tables
from app.api.v1.endpoints.auth import router as auth_router
from app.api.v1.endpoints.users import router as users_router
from app.api.v1.endpoints.listings import router as listings_router
from app.api.v1.endpoints.swipes import router as swipes_router
from app.api.v1.endpoints.matches import router as matches_router
from app.api.v1.endpoints.payments import router as payments_router
from app.api.v1.endpoints.websocket import router as ws_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await create_tables()
    Path("uploads").mkdir(exist_ok=True)
    print(f"🏠 {settings.APP_NAME} API iniciada en modo {settings.APP_ENV}")
    yield
    # Shutdown
    print(f"🏠 {settings.APP_NAME} API detenida")


app = FastAPI(
    title="CuartoYa API",
    description="API para la app de alquiler de habitaciones en Huancayo, Peru",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(GZipMiddleware)

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

# WebSocket routes
app.include_router(ws_router, prefix="/ws", tags=["WebSocket"])


@app.get("/health")
async def health_check():
    return {"status": "ok", "app": "CuartoYa", "version": "1.0.0"}
