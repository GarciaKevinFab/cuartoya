"""
Test completo de todas las rutas de CuartoYa API.
Ejecutar: ./venv/Scripts/python.exe test_all_routes.py
"""
import requests
import json
import sys

BASE = "http://localhost:8000/api/v1"
PASS = 0
FAIL = 0
ERRORS = []

def test(name, method, url, expected_status, **kwargs):
    global PASS, FAIL, ERRORS
    try:
        r = getattr(requests, method)(f"{BASE}{url}", **kwargs)
        if r.status_code == expected_status:
            PASS += 1
            print(f"  [OK] {name} -> {r.status_code}")
            return r
        else:
            FAIL += 1
            detail = ""
            try:
                detail = r.json().get("detail", "")[:80]
            except:
                detail = r.text[:80]
            msg = f"  [FAIL] {name} -> {r.status_code} (expected {expected_status}) {detail}"
            print(msg)
            ERRORS.append(msg)
            return r
    except Exception as e:
        FAIL += 1
        msg = f"  [ERROR] {name} -> {str(e)[:80]}"
        print(msg)
        ERRORS.append(msg)
        return None

# ============================================================
print("\n=== AUTH ===")
# Login
r = test("Login (inquilino)", "post", "/auth/login",
         200, json={"email": "jose.flores@demo.com", "password": "Demo1234!"})
tenant_token = r.json()["access_token"] if r and r.status_code == 200 else None
tenant_headers = {"Authorization": f"Bearer {tenant_token}"} if tenant_token else {}

r = test("Login (propietario)", "post", "/auth/login",
         200, json={"email": "maria.quispe@demo.com", "password": "Demo1234!"})
landlord_token = r.json()["access_token"] if r and r.status_code == 200 else None
landlord_headers = {"Authorization": f"Bearer {landlord_token}"} if landlord_token else {}

r = test("Login (admin)", "post", "/auth/login",
         200, json={"email": "admin@cuartoya.pe", "password": "Admin1234!"})
admin_token = r.json()["access_token"] if r and r.status_code == 200 else None
admin_headers = {"Authorization": f"Bearer {admin_token}"} if admin_token else {}

test("Login (bad password)", "post", "/auth/login",
     401, json={"email": "jose.flores@demo.com", "password": "wrong"})

test("Forgot password", "post", "/auth/forgot-password",
     200, json={"email": "jose.flores@demo.com"})

# ============================================================
print("\n=== USERS ===")
test("Get me (tenant)", "get", "/users/me", 200, headers=tenant_headers)
test("Get me (no auth)", "get", "/users/me", 403)

r = test("Get me stats", "get", "/users/me/stats", 200, headers=tenant_headers)
if r and r.status_code == 200:
    d = r.json()
    assert "likes_given" in d, f"Missing likes_given in stats: {d}"
    assert "matches_count" in d, f"Missing matches_count: {d}"
    print(f"    Stats: likes={d['likes_given']}, matches={d['matches_count']}")

test("Update me", "put", "/users/me", 200, headers=tenant_headers,
     json={"bio": "Testing bio update"})

# ============================================================
print("\n=== LISTINGS ===")
r = test("Feed (all)", "get", "/listings", 200, headers=tenant_headers)
if r and r.status_code == 200:
    d = r.json()
    listings = d.get("listings", [])
    print(f"    Feed: {len(listings)} listings, has_more={d.get('has_more')}")
    if listings:
        first = listings[0]
        assert "id" in first, f"Missing 'id' in listing: {list(first.keys())}"
        assert "title" in first, f"Missing 'title' in listing"
        assert "city" in first, f"Missing 'city' in listing"
        first_id = first["id"]
        print(f"    First listing: {first['title']} ({first.get('city')}/{first.get('district')})")

test("Feed (city filter)", "get", "/listings?city=huancayo", 200, headers=tenant_headers)
test("Feed (city tarma)", "get", "/listings?city=tarma", 200, headers=tenant_headers)
test("Feed (price filter)", "get", "/listings?min_price=200&max_price=500", 200, headers=tenant_headers)

test("My listings (landlord)", "get", "/listings/my", 200, headers=landlord_headers)

if first_id:
    r = test("Listing detail", "get", f"/listings/{first_id}", 200, headers=tenant_headers)
    if r and r.status_code == 200:
        d = r.json()
        assert "owner_name" in d, f"Missing owner_name: {list(d.keys())}"
        print(f"    Detail: {d['title']} by {d.get('owner_name')}")

    test("Register view", "post", f"/listings/{first_id}/view", 200)

test("Listing detail (bad id)", "get", "/listings/nonexistent-id", 404, headers=tenant_headers)

# ============================================================
print("\n=== SWIPES ===")
# Get feed to get a listing to swipe on
r = requests.get(f"{BASE}/listings", headers=tenant_headers, params={"city": "tarma"})
tarma_listings = r.json().get("listings", []) if r.status_code == 200 else []
if tarma_listings:
    swipe_listing_id = tarma_listings[0]["id"]
    test("Swipe like", "post", "/swipes", 201, headers=tenant_headers,
         json={"listing_id": swipe_listing_id, "action": "like"})
else:
    print("  [SKIP] No tarma listings to swipe on")

test("Swipe (no auth)", "post", "/swipes", 403, json={"listing_id": "x", "action": "like"})

test("Pending swipes (landlord)", "get", "/swipes/pending", 200, headers=landlord_headers)

# ============================================================
print("\n=== MATCHES ===")
test("My matches (tenant)", "get", "/matches", 200, headers=tenant_headers)
test("My matches (landlord)", "get", "/matches", 200, headers=landlord_headers)

# Get a match to test messages
r = requests.get(f"{BASE}/matches", headers=tenant_headers)
matches = r.json() if r.status_code == 200 else []
if isinstance(matches, list) and len(matches) > 0:
    match_id = matches[0]["id"]
    test("Match detail", "get", f"/matches/{match_id}", 200, headers=tenant_headers)
    test("Match messages", "get", f"/matches/{match_id}/messages", 200, headers=tenant_headers)
    test("Send message", "post", f"/matches/{match_id}/messages", 201, headers=tenant_headers,
         json={"content": "Test message from route test"})
else:
    print("  [SKIP] No matches to test messages")

# ============================================================
print("\n=== PAYMENTS ===")
test("Payment history", "get", "/payments/history", 200, headers=tenant_headers)

# Subscribe (will fail without Culqi but should return 200 in dev mode)
r = test("Subscribe (dev mode)", "post", "/payments/subscribe", 200, headers=tenant_headers,
         json={"plan": "pro", "culqi_token": "test_dev_token"})

# ============================================================
print("\n=== VERIFICATION ===")
test("Verification status", "get", "/verification/status", 200, headers=tenant_headers)
test("Verify DNI (dev mode)", "post", "/verification/dni", 200, headers=tenant_headers,
     json={"dni": "12345678"})

# ============================================================
print("\n=== FAVORITES ===")
if first_id:
    test("Add favorite", "post", f"/favorites/{first_id}", 201, headers=tenant_headers)
    test("List favorites", "get", "/favorites", 200, headers=tenant_headers)
    test("Remove favorite", "delete", f"/favorites/{first_id}", 200, headers=tenant_headers)

# ============================================================
print("\n=== REPORTS ===")
test("Create report", "post", "/reports", 201, headers=tenant_headers,
     json={"reported_listing_id": first_id if first_id else "test", "reason": "spam", "description": "Test report"})
test("My reports", "get", "/reports/my", 200, headers=tenant_headers)

# ============================================================
print("\n=== ADMIN ===")
test("Admin stats", "get", "/admin/stats", 200, headers=admin_headers)
test("Admin stats (no auth)", "get", "/admin/stats", 403)
test("Admin stats (not admin)", "get", "/admin/stats", 403, headers=tenant_headers)

test("Admin users", "get", "/admin/users", 200, headers=admin_headers)
test("Admin reports", "get", "/admin/reports", 200, headers=admin_headers)
test("Admin listings", "get", "/admin/listings", 200, headers=admin_headers)
test("Admin revenue", "get", "/admin/revenue", 200, headers=admin_headers)

# ============================================================
print("\n=== HEALTH ===")
# Health check is at root, not under /api/v1
r = requests.get("http://localhost:8000/health")
if r.status_code == 200:
    PASS += 1
    print(f"  [OK] Health check -> 200")
else:
    FAIL += 1
    print(f"  [FAIL] Health check -> {r.status_code}")

# ============================================================
print(f"\n{'='*50}")
print(f"RESULTADOS: {PASS} OK | {FAIL} FAIL | {PASS+FAIL} TOTAL")
print(f"{'='*50}")

if ERRORS:
    print("\nERRORES:")
    for e in ERRORS:
        print(e)

sys.exit(1 if FAIL > 0 else 0)
