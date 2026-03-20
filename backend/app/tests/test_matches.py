import pytest
from httpx import AsyncClient
from app.tests.conftest import auth_headers


async def create_match_setup(client: AsyncClient):
    """Helper: create landlord, tenant, listing, swipe, and accept -> match."""
    import uuid
    suffix = uuid.uuid4().hex[:6]

    reg = await client.post("/api/v1/auth/register", json={
        "email": f"m_owner_{suffix}@test.com",
        "phone": f"+5199944{suffix[:4]}",
        "full_name": "Match Test Owner",
        "password": "Match1234!",
        "role": "landlord",
    })
    token_owner = reg.json()["access_token"]

    listing_resp = await client.post("/api/v1/listings", json={
        "title": "Cuarto para test de match completo",
        "description": "Testing match and messaging",
        "price": 400,
    }, headers=auth_headers(token_owner))
    listing_id = listing_resp.json()["id"]

    reg2 = await client.post("/api/v1/auth/register", json={
        "email": f"m_tenant_{suffix}@test.com",
        "phone": f"+5199955{suffix[:4]}",
        "full_name": "Match Test Tenant",
        "password": "Match1234!",
        "role": "tenant",
    })
    token_tenant = reg2.json()["access_token"]

    swipe_resp = await client.post("/api/v1/swipes", json={
        "listing_id": listing_id,
        "action": "like",
    }, headers=auth_headers(token_tenant))
    swipe_id = swipe_resp.json()["id"]

    accept_resp = await client.post(
        f"/api/v1/swipes/{swipe_id}/accept",
        headers=auth_headers(token_owner),
    )
    match_id = accept_resp.json()["match_id"]

    return token_owner, token_tenant, match_id


@pytest.mark.asyncio
async def test_get_matches_list(client: AsyncClient):
    token_owner, token_tenant, match_id = await create_match_setup(client)

    response = await client.get("/api/v1/matches", headers=auth_headers(token_tenant))
    assert response.status_code == 200
    assert len(response.json()) >= 1


@pytest.mark.asyncio
async def test_send_message_in_match(client: AsyncClient):
    token_owner, token_tenant, match_id = await create_match_setup(client)

    response = await client.post(f"/api/v1/matches/{match_id}/messages", json={
        "content": "Hola, estoy interesado en la habitacion!",
    }, headers=auth_headers(token_tenant))
    assert response.status_code == 201
    assert response.json()["content"] == "Hola, estoy interesado en la habitacion!"


@pytest.mark.asyncio
async def test_cannot_message_without_match(client: AsyncClient):
    reg = await client.post("/api/v1/auth/register", json={
        "email": "nomatch@test.com",
        "phone": "+51999666001",
        "full_name": "No Match User",
        "password": "NoMatch1234!",
        "role": "tenant",
    })
    token = reg.json()["access_token"]

    response = await client.post("/api/v1/matches/fake-match-id/messages", json={
        "content": "No deberia poder enviar esto",
    }, headers=auth_headers(token))
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_mark_message_as_read(client: AsyncClient):
    token_owner, token_tenant, match_id = await create_match_setup(client)

    # Send message
    msg_resp = await client.post(f"/api/v1/matches/{match_id}/messages", json={
        "content": "Mensaje para marcar como leido",
    }, headers=auth_headers(token_tenant))
    msg_id = msg_resp.json()["id"]

    # Mark as read (by owner)
    response = await client.put(
        f"/api/v1/matches/{match_id}/messages/{msg_id}/read",
        headers=auth_headers(token_owner),
    )
    assert response.status_code == 200
