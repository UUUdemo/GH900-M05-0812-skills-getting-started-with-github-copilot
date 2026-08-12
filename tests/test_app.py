import pytest
from httpx import AsyncClient
from src.app import app, activities

@pytest.mark.asyncio
async def test_get_activities():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        r = await ac.get("/activities")
        assert r.status_code == 200
        data = r.json()
        # basic sanity checks
        assert isinstance(data, dict)
        assert len(data) >= 1

@pytest.mark.asyncio
async def test_signup_duplicate_and_unregister():
    activity = "Basketball Team"
    email = "tester+step4@example.com"

    # Ensure activity exists in the in-memory DB
    assert activity in activities

    async with AsyncClient(app=app, base_url="http://test") as ac:
        # Clean up if email already present
        if email in activities[activity]["participants"]:
            activities[activity]["participants"].remove(email)

        # 1) Sign up should succeed first time
        r = await ac.post(f"/activities/{activity}/signup?email={email}")
        assert r.status_code == 200
        assert "Signed up" in r.json().get("message", "")

        # 2) Duplicate signup should fail
        r2 = await ac.post(f"/activities/{activity}/signup?email={email}")
        assert r2.status_code == 400
        assert r2.json().get("detail") == "Student is already signed up"

        # 3) Unregister should succeed
        r3 = await ac.delete(f"/activities/{activity}/participants?email={email}")
        assert r3.status_code == 200
        assert "Unregistered" in r3.json().get("message", "")

        # 4) Verify participant is no longer present
        r4 = await ac.get("/activities")
        assert r4.status_code == 200
        assert email not in r4.json()[activity]["participants"]
