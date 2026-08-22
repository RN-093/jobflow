def _stage_id_by_name(client, headers, name: str) -> str:
    stages = client.get("/pipeline/stages", headers=headers).json()
    return next(s["id"] for s in stages if s["name"] == name)


def test_create_job_lands_in_interested_with_history_and_activity(client, register_user):
    _, token = register_user(client)
    headers = {"Authorization": f"Bearer {token}"}

    resp = client.post("/jobs", json={"title": "Software Engineer", "company": "Initech"}, headers=headers)
    assert resp.status_code == 201
    job = resp.json()
    assert job["stage_name"] == "Interested"
    assert job["position"] == 0

    timeline = client.get(f"/jobs/{job['id']}/timeline", headers=headers).json()
    assert any(a["type"] == "job_created" for a in timeline)


def test_job_crud(client, register_user):
    _, token = register_user(client)
    headers = {"Authorization": f"Bearer {token}"}

    create = client.post("/jobs", json={"title": "QA Engineer", "company": "Umbrella"}, headers=headers)
    job_id = create.json()["id"]

    get_resp = client.get(f"/jobs/{job_id}", headers=headers)
    assert get_resp.status_code == 200
    assert get_resp.json()["title"] == "QA Engineer"

    patch_resp = client.patch(f"/jobs/{job_id}", json={"title": "Senior QA Engineer"}, headers=headers)
    assert patch_resp.status_code == 200
    assert patch_resp.json()["title"] == "Senior QA Engineer"

    timeline = client.get(f"/jobs/{job_id}/timeline", headers=headers).json()
    assert any(a["type"] == "job_edited" for a in timeline)

    archive_resp = client.patch(f"/jobs/{job_id}/archive", json={"archived": True}, headers=headers)
    assert archive_resp.status_code == 200
    assert archive_resp.json()["archived"] is True

    delete_resp = client.delete(f"/jobs/{job_id}", headers=headers)
    assert delete_resp.status_code == 204

    missing_resp = client.get(f"/jobs/{job_id}", headers=headers)
    assert missing_resp.status_code == 404


def test_stage_move_writes_history_and_activity(client, register_user):
    _, token = register_user(client)
    headers = {"Authorization": f"Bearer {token}"}

    create = client.post("/jobs", json={"title": "Data Engineer", "company": "Hooli"}, headers=headers)
    job_id = create.json()["id"]
    original_entered_at = create.json()["entered_stage_at"]

    applied_id = _stage_id_by_name(client, headers, "Applied")
    move_resp = client.patch(f"/jobs/{job_id}/stage", json={"stage_id": applied_id, "note": "Applied via site"}, headers=headers)
    assert move_resp.status_code == 200
    moved = move_resp.json()
    assert moved["stage_name"] == "Applied"
    assert moved["entered_stage_at"] != original_entered_at

    timeline = client.get(f"/jobs/{job_id}/timeline", headers=headers).json()
    stage_changes = [a for a in timeline if a["type"] == "stage_changed"]
    assert len(stage_changes) == 1
    assert stage_changes[0]["meta"]["to"] == "Applied"


def test_stage_move_invalid_stage_404(client, register_user):
    _, token = register_user(client)
    headers = {"Authorization": f"Bearer {token}"}

    create = client.post("/jobs", json={"title": "Designer", "company": "Wayne Enterprises"}, headers=headers)
    job_id = create.json()["id"]

    resp = client.patch(f"/jobs/{job_id}/stage", json={"stage_id": "does-not-exist"}, headers=headers)
    assert resp.status_code == 404


def test_job_list_pagination_and_filters(client, register_user):
    _, token = register_user(client)
    headers = {"Authorization": f"Bearer {token}"}

    for i in range(3):
        client.post("/jobs", json={"title": f"Role {i}", "company": "Acme", "remote_status": "remote"}, headers=headers)
    client.post("/jobs", json={"title": "Onsite Role", "company": "Acme", "remote_status": "onsite"}, headers=headers)

    resp = client.get("/jobs", params={"page": 1, "page_size": 2}, headers=headers)
    body = resp.json()
    assert body["total"] == 4
    assert len(body["items"]) == 2

    filtered = client.get("/jobs", params={"remote_status": "remote"}, headers=headers).json()
    assert filtered["total"] == 3


def test_job_isolation_between_users(client, two_users):
    headers_a = two_users["a"]["headers"]
    headers_b = two_users["b"]["headers"]

    create = client.post("/jobs", json={"title": "Secret Role", "company": "Acme"}, headers=headers_a)
    job_id = create.json()["id"]

    assert client.get(f"/jobs/{job_id}", headers=headers_b).status_code == 404
    assert client.patch(f"/jobs/{job_id}", json={"title": "Hacked"}, headers=headers_b).status_code == 404
    assert client.delete(f"/jobs/{job_id}", headers=headers_b).status_code == 404

    list_b = client.get("/jobs", headers=headers_b).json()
    assert list_b["total"] == 0
