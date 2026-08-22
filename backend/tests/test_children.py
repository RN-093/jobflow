def _create_job(client, headers, title="Engineer", company="Acme") -> str:
    resp = client.post("/jobs", json={"title": title, "company": company}, headers=headers)
    return resp.json()["id"]


def test_contacts_crud(client, register_user):
    _, token = register_user(client)
    headers = {"Authorization": f"Bearer {token}"}
    job_id = _create_job(client, headers)

    create = client.post(
        f"/jobs/{job_id}/contacts", json={"name": "Jamie Recruiter", "email": "jamie@acme.com"}, headers=headers
    )
    assert create.status_code == 201
    contact_id = create.json()["id"]

    listed = client.get(f"/jobs/{job_id}/contacts", headers=headers).json()
    assert len(listed) == 1

    patched = client.patch(f"/jobs/{job_id}/contacts/{contact_id}", json={"phone": "555-1234"}, headers=headers)
    assert patched.status_code == 200
    assert patched.json()["phone"] == "555-1234"

    timeline = client.get(f"/jobs/{job_id}/timeline", headers=headers).json()
    assert any(a["type"] == "contact_added" for a in timeline)

    deleted = client.delete(f"/jobs/{job_id}/contacts/{contact_id}", headers=headers)
    assert deleted.status_code == 204

    timeline_after = client.get(f"/jobs/{job_id}/timeline", headers=headers).json()
    assert any(a["type"] == "contact_removed" for a in timeline_after)


def test_interviews_crud_and_completion(client, register_user):
    _, token = register_user(client)
    headers = {"Authorization": f"Bearer {token}"}
    job_id = _create_job(client, headers)

    create = client.post(
        f"/jobs/{job_id}/interviews",
        json={"type_label": "Recruiter Screen", "scheduled_at": "2026-09-01T10:00:00"},
        headers=headers,
    )
    assert create.status_code == 201
    interview = create.json()
    assert interview["status"] == "scheduled"

    timeline = client.get(f"/jobs/{job_id}/timeline", headers=headers).json()
    assert any(a["type"] == "interview_created" for a in timeline)

    completed = client.patch(
        f"/jobs/{job_id}/interviews/{interview['id']}",
        json={"status": "completed", "feedback": "Went well"},
        headers=headers,
    )
    assert completed.status_code == 200
    assert completed.json()["status"] == "completed"

    timeline_after = client.get(f"/jobs/{job_id}/timeline", headers=headers).json()
    assert any(a["type"] == "interview_completed" for a in timeline_after)

    deleted = client.delete(f"/jobs/{job_id}/interviews/{interview['id']}", headers=headers)
    assert deleted.status_code == 204


def test_tasks_crud_and_completion(client, register_user):
    _, token = register_user(client)
    headers = {"Authorization": f"Bearer {token}"}
    job_id = _create_job(client, headers)

    create = client.post(f"/jobs/{job_id}/tasks", json={"title": "Send thank-you email"}, headers=headers)
    assert create.status_code == 201
    task = create.json()
    assert task["completed"] is False
    assert task["completed_at"] is None

    timeline = client.get(f"/jobs/{job_id}/timeline", headers=headers).json()
    assert any(a["type"] == "task_created" for a in timeline)

    completed = client.patch(f"/jobs/{job_id}/tasks/{task['id']}", json={"completed": True}, headers=headers)
    assert completed.status_code == 200
    assert completed.json()["completed"] is True
    assert completed.json()["completed_at"] is not None

    timeline_after = client.get(f"/jobs/{job_id}/timeline", headers=headers).json()
    assert any(a["type"] == "task_completed" for a in timeline_after)

    deleted = client.delete(f"/jobs/{job_id}/tasks/{task['id']}", headers=headers)
    assert deleted.status_code == 204


def test_notes_crud(client, register_user):
    _, token = register_user(client)
    headers = {"Authorization": f"Bearer {token}"}
    job_id = _create_job(client, headers)

    create = client.post(f"/jobs/{job_id}/notes", json={"body": "Great culture fit"}, headers=headers)
    assert create.status_code == 201
    note_id = create.json()["id"]

    patched = client.patch(f"/jobs/{job_id}/notes/{note_id}", json={"body": "Updated note"}, headers=headers)
    assert patched.status_code == 200
    assert patched.json()["body"] == "Updated note"

    deleted = client.delete(f"/jobs/{job_id}/notes/{note_id}", headers=headers)
    assert deleted.status_code == 204


def test_children_authorization_isolation(client, two_users):
    headers_a = two_users["a"]["headers"]
    headers_b = two_users["b"]["headers"]
    job_id = _create_job(client, headers_a)

    # user B cannot even see that the job exists
    assert client.get(f"/jobs/{job_id}/contacts", headers=headers_b).status_code == 404
    assert client.get(f"/jobs/{job_id}/interviews", headers=headers_b).status_code == 404
    assert client.get(f"/jobs/{job_id}/tasks", headers=headers_b).status_code == 404
    assert client.get(f"/jobs/{job_id}/notes", headers=headers_b).status_code == 404
    assert client.get(f"/jobs/{job_id}/timeline", headers=headers_b).status_code == 404

    assert (
        client.post(f"/jobs/{job_id}/contacts", json={"name": "Intruder"}, headers=headers_b).status_code == 404
    )
