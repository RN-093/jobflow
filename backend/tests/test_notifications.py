from datetime import timedelta

from app.utils import today


def _create_job(client, headers) -> str:
    return client.post("/jobs", json={"title": "Engineer", "company": "Acme"}, headers=headers).json()["id"]


def test_overdue_task_notification_dedupes(client, register_user):
    _, token = register_user(client)
    headers = {"Authorization": f"Bearer {token}"}
    job_id = _create_job(client, headers)

    yesterday = (today() - timedelta(days=1)).isoformat()
    client.post(f"/jobs/{job_id}/tasks", json={"title": "Follow up", "due_date": yesterday}, headers=headers)

    first = client.get("/notifications", headers=headers).json()
    overdue = [n for n in first if n["type"] == "task_overdue"]
    assert len(overdue) == 1
    assert overdue[0]["read"] is False

    second = client.get("/notifications", headers=headers).json()
    overdue_again = [n for n in second if n["type"] == "task_overdue"]
    assert len(overdue_again) == 1
    assert overdue_again[0]["id"] == overdue[0]["id"]  # same row, not duplicated


def test_read_notification_clears_once_condition_resolved(client, register_user):
    _, token = register_user(client)
    headers = {"Authorization": f"Bearer {token}"}
    job_id = _create_job(client, headers)

    yesterday = (today() - timedelta(days=1)).isoformat()
    task = client.post(
        f"/jobs/{job_id}/tasks", json={"title": "Follow up", "due_date": yesterday}, headers=headers
    ).json()

    notifications = client.get("/notifications", headers=headers).json()
    notification = next(n for n in notifications if n["type"] == "task_overdue")

    mark_read = client.patch(f"/notifications/{notification['id']}", json={"read": True}, headers=headers)
    assert mark_read.status_code == 200
    assert mark_read.json()["read"] is True

    client.patch(f"/jobs/{job_id}/tasks/{task['id']}", json={"completed": True}, headers=headers)

    after = client.get("/notifications", headers=headers).json()
    assert not any(n["id"] == notification["id"] for n in after)


def test_unread_notification_persists_after_condition_clears(client, register_user):
    _, token = register_user(client)
    headers = {"Authorization": f"Bearer {token}"}
    job_id = _create_job(client, headers)

    yesterday = (today() - timedelta(days=1)).isoformat()
    task = client.post(
        f"/jobs/{job_id}/tasks", json={"title": "Follow up", "due_date": yesterday}, headers=headers
    ).json()

    notifications = client.get("/notifications", headers=headers).json()
    notification = next(n for n in notifications if n["type"] == "task_overdue")
    assert notification["read"] is False

    # Complete the task WITHOUT marking the notification read first.
    client.patch(f"/jobs/{job_id}/tasks/{task['id']}", json={"completed": True}, headers=headers)

    after = client.get("/notifications", headers=headers).json()
    assert any(n["id"] == notification["id"] for n in after)
