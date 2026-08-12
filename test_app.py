from copy import deepcopy

from fastapi.testclient import TestClient

from src.app import activities, app

client = TestClient(app)


def _reset_activity(activity_name, participants):
    activities[activity_name]["participants"] = list(participants)


def test_duplicate_signup_is_rejected():
    original = deepcopy(activities)
    _reset_activity("Chess Club", ["michael@mergington.edu", "daniel@mergington.edu"])

    response = client.post("/activities/Chess%20Club/signup?email=michael@mergington.edu")

    assert response.status_code == 400
    assert response.json()["detail"] == "Student already signed up for this activity"
    assert activities["Chess Club"]["participants"] == [
        "michael@mergington.edu",
        "daniel@mergington.edu",
    ]

    activities.clear()
    activities.update(original)


def test_full_activity_rejects_new_signup():
    original = deepcopy(activities)
    _reset_activity("Programming Class", [f"student{i}@mergington.edu" for i in range(20)])

    response = client.post("/activities/Programming%20Class/signup?email=newstudent@mergington.edu")

    assert response.status_code == 400
    assert response.json()["detail"] == "Activity is full"
    assert len(activities["Programming Class"]["participants"]) == 20

    activities.clear()
    activities.update(original)
