import pytest
from httpx import AsyncClient
from app.tests.conftest import auth_headers


@pytest.mark.asyncio
async def test_like_listing(client: AsyncClient):
    # Create landlord + listing
    reg = await client.post("/api/v1/auth/register", json={
        "email": "swipe_owner@test.com",
        "phone": "+51999333001",
        "full_name": "Swipe Owner",
        "password": "Swipe1234!",
        "role": "landlord",
    })
    token_owner = reg.json()["access_token"]

    listing_resp = await client.post("/api/v1/listings", json={
        "title": "Cuarto para testear swipe like",
        "description": "Habitacion para test de swipe",
        "price": 350,
    }, headers=auth_headers(token_owner))
    listing_id = listing_resp.json()["id"]

    # Create tenant
    reg2 = await client.post("/api/v1/auth/register", json={
        "email": "swipe_tenant@test.com",
        "phone": "+51999333002",
        "full_name": "Swipe Tenant",
        "password": "Swipe1234!",
        "role": "tenant",
    })
    token_tenant = reg2.json()["access_token"]

    # Like
    response = await client.post("/api/v1/swipes", json={
        "listing_id": listing_id,
        "action": "like",
    }, headers=auth_headers(token_tenant))
    assert response.status_code == 201
    assert response.json()["action"] == "like"


@pytest.mark.asyncio
async def test_nope_listing(client: AsyncClient):
    reg = await client.post("/api/v1/auth/register", json={
        "email": "nope_owner@test.com",
        "phone": "+51999333003",
        "full_name": "Nope Owner",
        "password": "Nope1234!",
        "role": "landlord",
    })
    token_owner = reg.json()["access_token"]

    listing_resp = await client.post("/api/v1/listings", json={
        "title": "Cuarto para testear swipe nope",
        "description": "Habitacion para test nope",
        "price": 300,
    }, headers=auth_headers(token_owner))
    listing_id = listing_resp.json()["id"]

    reg2 = await client.post("/api/v1/auth/register", json={
        "email": "nope_tenant@test.com",
        "phone": "+51999333004",
        "full_name": "Nope Tenant",
        "password": "Nope1234!",
        "role": "tenant",
    })
    token_tenant = reg2.json()["access_token"]

    response = await client.post("/api/v1/swipes", json={
        "listing_id": listing_id,
        "action": "nope",
    }, headers=auth_headers(token_tenant))
    assert response.status_code == 201
    assert response.json()["action"] == "nope"


@pytest.mark.asyncio
async def test_cannot_swipe_own_listing(client: AsyncClient):
    reg = await client.post("/api/v1/auth/register", json={
        "email": "own_swipe@test.com",
        "phone": "+51999333005",
        "full_name": "Own Swipe",
        "password": "Own12345!",
        "role": "both",
    })
    token = reg.json()["access_token"]

    listing_resp = await client.post("/api/v1/listings", json={
        "title": "Mi propia publicacion no puedo swipe",
        "description": "No deberia poder darle swipe",
        "price": 400,
    }, headers=auth_headers(token))
    listing_id = listing_resp.json()["id"]

    response = await client.post("/api/v1/swipes", json={
        "listing_id": listing_id,
        "action": "like",
    }, headers=auth_headers(token))
    assert response.status_code == 400


@pytest.mark.asyncio
async def test_duplicate_swipe_rejected(client: AsyncClient):
    reg = await client.post("/api/v1/auth/register", json={
        "email": "dup_swipe_owner@test.com",
        "phone": "+51999333006",
        "full_name": "Dup Swipe Owner",
        "password": "DupSwipe1234!",
        "role": "landlord",
    })
    token_owner = reg.json()["access_token"]

    listing_resp = await client.post("/api/v1/listings", json={
        "title": "Cuarto para test de swipe duplicado",
        "description": "Testing duplicate swipe rejection",
        "price": 350,
    }, headers=auth_headers(token_owner))
    listing_id = listing_resp.json()["id"]

    reg2 = await client.post("/api/v1/auth/register", json={
        "email": "dup_swipe_tenant@test.com",
        "phone": "+51999333007",
        "full_name": "Dup Swipe Tenant",
        "password": "DupSwipe1234!",
        "role": "tenant",
    })
    token_tenant = reg2.json()["access_token"]

    # First swipe
    await client.post("/api/v1/swipes", json={
        "listing_id": listing_id,
        "action": "like",
    }, headers=auth_headers(token_tenant))

    # Duplicate
    response = await client.post("/api/v1/swipes", json={
        "listing_id": listing_id,
        "action": "like",
    }, headers=auth_headers(token_tenant))
    assert response.status_code == 400


@pytest.mark.asyncio
async def test_landlord_accept_like_creates_match(client: AsyncClient):
    reg = await client.post("/api/v1/auth/register", json={
        "email": "match_owner@test.com",
        "phone": "+51999333008",
        "full_name": "Match Owner",
        "password": "Match1234!",
        "role": "landlord",
    })
    token_owner = reg.json()["access_token"]

    listing_resp = await client.post("/api/v1/listings", json={
        "title": "Cuarto para crear match de test",
        "description": "Testing match creation flow",
        "price": 400,
    }, headers=auth_headers(token_owner))
    listing_id = listing_resp.json()["id"]

    reg2 = await client.post("/api/v1/auth/register", json={
        "email": "match_tenant@test.com",
        "phone": "+51999333009",
        "full_name": "Match Tenant",
        "password": "Match1234!",
        "role": "tenant",
    })
    token_tenant = reg2.json()["access_token"]

    # Tenant likes
    swipe_resp = await client.post("/api/v1/swipes", json={
        "listing_id": listing_id,
        "action": "like",
    }, headers=auth_headers(token_tenant))
    swipe_id = swipe_resp.json()["id"]

    # Landlord accepts
    response = await client.post(f"/api/v1/swipes/{swipe_id}/accept", headers=auth_headers(token_owner))
    assert response.status_code == 200
    assert "match_id" in response.json()


@pytest.mark.asyncio
async def test_landlord_reject_like(client: AsyncClient):
    reg = await client.post("/api/v1/auth/register", json={
        "email": "reject_owner@test.com",
        "phone": "+51999333010",
        "full_name": "Reject Owner",
        "password": "Reject1234!",
        "role": "landlord",
    })
    token_owner = reg.json()["access_token"]

    listing_resp = await client.post("/api/v1/listings", json={
        "title": "Cuarto para test de rechazo swipe",
        "description": "Testing rejection flow",
        "price": 350,
    }, headers=auth_headers(token_owner))
    listing_id = listing_resp.json()["id"]

    reg2 = await client.post("/api/v1/auth/register", json={
        "email": "reject_tenant@test.com",
        "phone": "+51999333011",
        "full_name": "Reject Tenant",
        "password": "Reject1234!",
        "role": "tenant",
    })
    token_tenant = reg2.json()["access_token"]

    swipe_resp = await client.post("/api/v1/swipes", json={
        "listing_id": listing_id,
        "action": "like",
    }, headers=auth_headers(token_tenant))
    swipe_id = swipe_resp.json()["id"]

    response = await client.post(f"/api/v1/swipes/{swipe_id}/reject", headers=auth_headers(token_owner))
    assert response.status_code == 200
