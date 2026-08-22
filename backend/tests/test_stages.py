def _stage_id_by_name(client, headers, name: str) -> str:
    stages = client.get("/pipeline/stages", headers=headers).json()
    return next(s["id"] for s in stages if s["name"] == name)


def test_create_stage_and_duplicate_conflict(client, register_user):
    _, token = register_user(client)
    headers = {"Authorization": f"Bearer {token}"}

    resp = client.post("/pipeline/stages", json={"name": "Ghosted", "color": "#111111"}, headers=headers)
    assert resp.status_code == 201
    body = resp.json()
    assert body["stage_type"] == "custom"
    assert body["position"] == 11  # appended after the 11 defaults

    dupe = client.post("/pipeline/stages", json={"name": "Ghosted", "color": "#222222"}, headers=headers)
    assert dupe.status_code == 409
    assert dupe.json()["error"]["code"] == "conflict"


def test_patch_stage(client, register_user):
    _, token = register_user(client)
    headers = {"Authorization": f"Bearer {token}"}
    stage_id = _stage_id_by_name(client, headers, "Interested")

    resp = client.patch(f"/pipeline/stages/{stage_id}", json={"color": "#abcdef"}, headers=headers)
    assert resp.status_code == 200
    assert resp.json()["color"] == "#abcdef"


def test_delete_stage_with_jobs_conflict_then_success(client, register_user):
    _, token = register_user(client)
    headers = {"Authorization": f"Bearer {token}"}

    interested_id = _stage_id_by_name(client, headers, "Interested")
    applied_id = _stage_id_by_name(client, headers, "Applied")

    job_resp = client.post(
        "/jobs", json={"title": "Backend Engineer", "company": "Acme", "stage_id": interested_id}, headers=headers
    )
    assert job_resp.status_code == 201

    delete_resp = client.delete(f"/pipeline/stages/{interested_id}", headers=headers)
    assert delete_resp.status_code == 409
    assert "1 jobs" in delete_resp.json()["error"]["message"]

    job_id = job_resp.json()["id"]
    move_resp = client.patch(f"/jobs/{job_id}/stage", json={"stage_id": applied_id}, headers=headers)
    assert move_resp.status_code == 200

    delete_resp_2 = client.delete(f"/pipeline/stages/{interested_id}", headers=headers)
    assert delete_resp_2.status_code == 204


def test_reorder_persists_positions(client, register_user):
    _, token = register_user(client)
    headers = {"Authorization": f"Bearer {token}"}

    stages = client.get("/pipeline/stages", headers=headers).json()
    ids = [s["id"] for s in stages]
    reversed_ids = list(reversed(ids))

    resp = client.patch("/pipeline/stages/reorder", json={"ordered_ids": reversed_ids}, headers=headers)
    assert resp.status_code == 200

    after = client.get("/pipeline/stages", headers=headers).json()
    assert [s["id"] for s in after] == reversed_ids
    assert [s["position"] for s in after] == list(range(len(after)))


def test_stage_isolation_between_users(client, two_users):
    headers_a = two_users["a"]["headers"]
    headers_b = two_users["b"]["headers"]

    stage_id_a = _stage_id_by_name(client, headers_a, "Interested")

    resp = client.patch(f"/pipeline/stages/{stage_id_a}", json={"color": "#000000"}, headers=headers_b)
    assert resp.status_code == 404

    resp = client.delete(f"/pipeline/stages/{stage_id_a}", headers=headers_b)
    assert resp.status_code == 404
