import pytest
import asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from app.core.database import Base, get_db
from app.core.security import get_password_hash
from app.models.user import User, UserRole
from app.models.listing import Listing, RoomType, District
from app.main import app
import uuid
from datetime import date

# Test database (SQLite in-memory)
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"
test_engine = create_async_engine(TEST_DATABASE_URL, echo=False)
TestSession = async_sessionmaker(test_engine, class_=AsyncSession, expire_on_commit=False)


async def override_get_db():
    async with TestSession() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(autouse=True)
async def setup_db():
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest.fixture
async def db_session():
    async with TestSession() as session:
        yield session


@pytest.fixture
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest.fixture
async def landlord_user(db_session: AsyncSession):
    user = User(
        id=str(uuid.uuid4()),
        email="landlord@test.com",
        phone="+51999888771",
        full_name="Test Landlord",
        hashed_password=get_password_hash("Test1234!"),
        role=UserRole.landlord,
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest.fixture
async def tenant_user(db_session: AsyncSession):
    user = User(
        id=str(uuid.uuid4()),
        email="tenant@test.com",
        phone="+51999888772",
        full_name="Test Tenant",
        hashed_password=get_password_hash("Test1234!"),
        role=UserRole.tenant,
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest.fixture
async def premium_user(db_session: AsyncSession):
    user = User(
        id=str(uuid.uuid4()),
        email="premium@test.com",
        phone="+51999888773",
        full_name="Test Premium",
        hashed_password=get_password_hash("Test1234!"),
        role=UserRole.both,
        is_premium=True,
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest.fixture
async def sample_listing(db_session: AsyncSession, landlord_user: User):
    listing = Listing(
        id=str(uuid.uuid4()),
        owner_id=landlord_user.id,
        title="Habitacion de prueba cerca a la UNCP",
        description="Una habitacion para testing del sistema",
        price=350.00,
        room_type=RoomType.single,
        district=District.el_tambo,
        is_furnished=True,
        has_wifi=True,
        has_water_24h=True,
        available_from=date.today(),
        photos=["https://picsum.photos/seed/test1/800/600"],
    )
    db_session.add(listing)
    await db_session.commit()
    await db_session.refresh(listing)
    return listing


async def get_auth_token(client: AsyncClient, email: str, password: str) -> str:
    response = await client.post("/api/v1/auth/login", json={"email": email, "password": password})
    return response.json()["access_token"]


def auth_headers(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}
