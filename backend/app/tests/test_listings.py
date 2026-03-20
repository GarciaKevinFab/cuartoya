import pytest
from httpx import AsyncClient
from app.tests.conftest import auth_headers


@pytest.mark.asyncio
async def test_create_listing_landlord(client: AsyncClient):
    # Register as landlord
    reg = await client.post("/api/v1/auth/register", json={
        "email": "landlord_list@test.com",
        "phone": "+51999222001",
        "full_name": "Landlord Listing",
        "password": "Land1234!",
        "role": "landlord",
    })
    token = reg.json()["access_token"]

    response = await client.post("/api/v1/listings", json={
        "title": "Habitacion de prueba para test listing",
        "description": "Descripcion de la habitacion de prueba",
        "price": 400,
        "room_type": "single",
        "district": "el_tambo",
        "is_furnished": True,
        "has_wifi": True,
    }, headers=auth_headers(token))
    assert response.status_code == 201
    assert response.json()["title"] == "Habitacion de prueba para test listing"


@pytest.mark.asyncio
async def test_create_listing_tenant_forbidden(client: AsyncClient):
    reg = await client.post("/api/v1/auth/register", json={
        "email": "tenant_list@test.com",
        "phone": "+51999222002",
        "full_name": "Tenant Listing",
        "password": "Tenant1234!",
        "role": "tenant",
    })
    token = reg.json()["access_token"]

    response = await client.post("/api/v1/listings", json={
        "title": "No deberia poder crear listing",
        "description": "Soy inquilino no puedo crear",
        "price": 300,
    }, headers=auth_headers(token))
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_get_feed_excludes_own_listings(client: AsyncClient):
    # Register landlord
    reg = await client.post("/api/v1/auth/register", json={
        "email": "owner_feed@test.com",
        "phone": "+51999222003",
        "full_name": "Owner Feed",
        "password": "Owner1234!",
        "role": "both",
    })
    token = reg.json()["access_token"]

    # Create listing
    await client.post("/api/v1/listings", json={
        "title": "Mi propia publicacion de habitacion",
        "description": "No deberia aparecer en mi feed",
        "price": 500,
        "district": "el_tambo",
    }, headers=auth_headers(token))

    # Get feed - should not include own listing
    response = await client.get("/api/v1/listings", headers=auth_headers(token))
    assert response.status_code == 200
    for listing in response.json()["listings"]:
        assert listing["owner_id"] != reg.json()["user"]["id"]


@pytest.mark.asyncio
async def test_listing_detail(client: AsyncClient):
    # Create landlord + listing
    reg = await client.post("/api/v1/auth/register", json={
        "email": "detail_owner@test.com",
        "phone": "+51999222004",
        "full_name": "Detail Owner",
        "password": "Detail1234!",
        "role": "landlord",
    })
    token = reg.json()["access_token"]

    create_resp = await client.post("/api/v1/listings", json={
        "title": "Habitacion para ver detalle completo",
        "description": "Descripcion completa del detalle",
        "price": 450,
        "district": "cercado",
        "is_furnished": True,
    }, headers=auth_headers(token))
    listing_id = create_resp.json()["id"]

    response = await client.get(f"/api/v1/listings/{listing_id}")
    assert response.status_code == 200
    assert response.json()["id"] == listing_id
    assert response.json()["owner_name"] == "Detail Owner"


@pytest.mark.asyncio
async def test_filter_by_district(client: AsyncClient):
    # Create landlord + listings in different districts
    reg = await client.post("/api/v1/auth/register", json={
        "email": "filter_district@test.com",
        "phone": "+51999222005",
        "full_name": "Filter District",
        "password": "Filter1234!",
        "role": "landlord",
    })
    token = reg.json()["access_token"]

    await client.post("/api/v1/listings", json={
        "title": "Cuarto en Chilca para filtro test",
        "description": "Habitacion en Chilca",
        "price": 300,
        "district": "chilca",
    }, headers=auth_headers(token))

    # Register tenant to query feed
    reg2 = await client.post("/api/v1/auth/register", json={
        "email": "filter_tenant@test.com",
        "phone": "+51999222006",
        "full_name": "Filter Tenant",
        "password": "Filter1234!",
        "role": "tenant",
    })
    token2 = reg2.json()["access_token"]

    response = await client.get("/api/v1/listings?district=chilca", headers=auth_headers(token2))
    assert response.status_code == 200
    for listing in response.json()["listings"]:
        assert listing["district"] == "chilca"


@pytest.mark.asyncio
async def test_filter_by_price_range(client: AsyncClient):
    reg = await client.post("/api/v1/auth/register", json={
        "email": "price_owner@test.com",
        "phone": "+51999222007",
        "full_name": "Price Owner",
        "password": "Price1234!",
        "role": "landlord",
    })
    token = reg.json()["access_token"]

    await client.post("/api/v1/listings", json={
        "title": "Cuarto barato para filtro de precio",
        "description": "Habitacion economica",
        "price": 200,
    }, headers=auth_headers(token))

    await client.post("/api/v1/listings", json={
        "title": "Cuarto caro para filtro de precio",
        "description": "Habitacion premium",
        "price": 800,
    }, headers=auth_headers(token))

    reg2 = await client.post("/api/v1/auth/register", json={
        "email": "price_tenant@test.com",
        "phone": "+51999222008",
        "full_name": "Price Tenant",
        "password": "Price1234!",
        "role": "tenant",
    })
    token2 = reg2.json()["access_token"]

    response = await client.get("/api/v1/listings?min_price=100&max_price=300", headers=auth_headers(token2))
    assert response.status_code == 200
    for listing in response.json()["listings"]:
        assert 100 <= listing["price"] <= 300
