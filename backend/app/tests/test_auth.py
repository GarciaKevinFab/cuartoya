import pytest
from httpx import AsyncClient
from app.tests.conftest import auth_headers


@pytest.mark.asyncio
async def test_register_success(client: AsyncClient):
    response = await client.post("/api/v1/auth/register", json={
        "email": "nuevo@test.com",
        "phone": "+51999111222",
        "full_name": "Nuevo Usuario",
        "password": "Nuevo1234!",
        "role": "tenant",
    })
    assert response.status_code == 201
    data = response.json()
    assert "access_token" in data
    assert data["user"]["email"] == "nuevo@test.com"


@pytest.mark.asyncio
async def test_register_duplicate_email(client: AsyncClient):
    # Register first
    await client.post("/api/v1/auth/register", json={
        "email": "dup@test.com",
        "phone": "+51999111223",
        "full_name": "Dup User",
        "password": "Dup12345!",
        "role": "tenant",
    })
    # Try duplicate
    response = await client.post("/api/v1/auth/register", json={
        "email": "dup@test.com",
        "phone": "+51999111224",
        "full_name": "Dup User 2",
        "password": "Dup12345!",
        "role": "tenant",
    })
    assert response.status_code == 400


@pytest.mark.asyncio
async def test_login_success(client: AsyncClient):
    # Register
    await client.post("/api/v1/auth/register", json={
        "email": "login@test.com",
        "phone": "+51999111225",
        "full_name": "Login User",
        "password": "Login1234!",
        "role": "tenant",
    })
    # Login
    response = await client.post("/api/v1/auth/login", json={
        "email": "login@test.com",
        "password": "Login1234!",
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


@pytest.mark.asyncio
async def test_login_wrong_password(client: AsyncClient):
    await client.post("/api/v1/auth/register", json={
        "email": "wrongpw@test.com",
        "phone": "+51999111226",
        "full_name": "Wrong PW",
        "password": "Correct1234!",
        "role": "tenant",
    })
    response = await client.post("/api/v1/auth/login", json={
        "email": "wrongpw@test.com",
        "password": "Wrong1234!",
    })
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_protected_route_without_token(client: AsyncClient):
    response = await client.get("/api/v1/users/me")
    assert response.status_code == 403  # No credentials


@pytest.mark.asyncio
async def test_protected_route_with_token(client: AsyncClient):
    # Register and get token
    reg = await client.post("/api/v1/auth/register", json={
        "email": "protected@test.com",
        "phone": "+51999111227",
        "full_name": "Protected User",
        "password": "Protect1234!",
        "role": "tenant",
    })
    token = reg.json()["access_token"]

    response = await client.get("/api/v1/users/me", headers=auth_headers(token))
    assert response.status_code == 200
    assert response.json()["email"] == "protected@test.com"


@pytest.mark.asyncio
async def test_health_check(client: AsyncClient):
    response = await client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"
