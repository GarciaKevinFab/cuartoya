import pytest
from httpx import AsyncClient
from app.tests.conftest import auth_headers


@pytest.mark.asyncio
async def test_subscribe_pro_plan_success(client: AsyncClient):
    reg = await client.post("/api/v1/auth/register", json={
        "email": "pay_pro@test.com",
        "phone": "+51999777001",
        "full_name": "Pay Pro User",
        "password": "PayPro1234!",
        "role": "tenant",
    })
    token = reg.json()["access_token"]

    response = await client.post("/api/v1/payments/subscribe", json={
        "plan": "pro",
        "culqi_token": "tkn_test_fake_token",
    }, headers=auth_headers(token))
    assert response.status_code == 200
    assert "subscription_id" in response.json()


@pytest.mark.asyncio
async def test_subscribe_activates_premium(client: AsyncClient):
    reg = await client.post("/api/v1/auth/register", json={
        "email": "pay_premium@test.com",
        "phone": "+51999777002",
        "full_name": "Pay Premium",
        "password": "PayPrem1234!",
        "role": "tenant",
    })
    token = reg.json()["access_token"]

    # Subscribe
    await client.post("/api/v1/payments/subscribe", json={
        "plan": "pro",
        "culqi_token": "tkn_test_fake",
    }, headers=auth_headers(token))

    # Check premium status
    me = await client.get("/api/v1/users/me", headers=auth_headers(token))
    assert me.json()["is_premium"] is True


@pytest.mark.asyncio
async def test_boost_listing_success(client: AsyncClient):
    reg = await client.post("/api/v1/auth/register", json={
        "email": "pay_boost@test.com",
        "phone": "+51999777003",
        "full_name": "Pay Boost",
        "password": "PayBoost1234!",
        "role": "landlord",
    })
    token = reg.json()["access_token"]

    # Create listing
    listing_resp = await client.post("/api/v1/listings", json={
        "title": "Cuarto para testear boost de pago",
        "description": "Habitacion para boost test",
        "price": 350,
    }, headers=auth_headers(token))
    listing_id = listing_resp.json()["id"]

    # Boost
    response = await client.post("/api/v1/payments/boost", json={
        "listing_id": listing_id,
        "days": 7,
        "culqi_token": "tkn_test_boost",
    }, headers=auth_headers(token))
    assert response.status_code == 200
    assert response.json()["listing_id"] == listing_id


@pytest.mark.asyncio
async def test_payment_history(client: AsyncClient):
    reg = await client.post("/api/v1/auth/register", json={
        "email": "pay_history@test.com",
        "phone": "+51999777004",
        "full_name": "Pay History",
        "password": "PayHist1234!",
        "role": "tenant",
    })
    token = reg.json()["access_token"]

    # Subscribe
    await client.post("/api/v1/payments/subscribe", json={
        "plan": "agency",
        "culqi_token": "tkn_test_hist",
    }, headers=auth_headers(token))

    # Check history
    response = await client.get("/api/v1/payments/history", headers=auth_headers(token))
    assert response.status_code == 200
    assert len(response.json()) >= 1
