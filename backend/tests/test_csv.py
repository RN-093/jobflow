import csv
import io
import json

from app.utils import today


def _upload(client, headers, endpoint, csv_text, column_map=None, mode=None):
    data = {}
    if column_map is not None:
        data["column_map"] = json.dumps(column_map)
    if mode is not None:
        data["mode"] = mode
    files = {"file": ("import.csv", csv_text, "text/csv")}
    return client.post(endpoint, headers=headers, files=files, data=data)


def test_export_csv_round_trip(client, register_user):
    _, token = register_user(client)
    headers = {"Authorization": f"Bearer {token}"}

    client.post(
        "/jobs",
        json={
            "title": "Platform Engineer",
            "company": "Acme",
            "location": "Remote",
            "salary_min": 90000,
            "salary_max": 110000,
            "salary_currency": "USD",
            "salary_period": "annual",
            "date_applied": today().isoformat(),
        },
        headers=headers,
    )

    resp = client.get("/export/csv", headers=headers)
    assert resp.status_code == 200
    assert resp.headers["content-type"].startswith("text/csv")

    reader = csv.DictReader(io.StringIO(resp.text))
    rows = list(reader)
    assert len(rows) == 1
    row = rows[0]
    assert row["title"] == "Platform Engineer"
    assert row["company"] == "Acme"
    assert row["stage"] == "Interested"
    assert row["salary_min"] == "90000"


def test_preview_flags_issues_without_dropping_rows(client, register_user):
    _, token = register_user(client)
    headers = {"Authorization": f"Bearer {token}"}

    client.post("/jobs", json={"title": "Existing Role", "company": "Acme"}, headers=headers)

    csv_text = (
        "title,company,stage,date_applied\n"
        "Existing Role,Acme,Interested,2026-01-15\n"
        "New Role,Beta,Nonexistent Stage,2026/02/20\n"
        "Broken Date Role,Gamma,Applied,not-a-date\n"
        ",Delta,Applied,2026-01-01\n"
    )
    mapping = {"title": "title", "company": "company", "stage": "stage", "date_applied": "date_applied"}

    resp = _upload(client, headers, "/import/csv/preview", csv_text, column_map=mapping)
    assert resp.status_code == 200
    body = resp.json()
    assert len(body["rows"]) == 4  # never drops rows, even the invalid ones

    dup_row = body["rows"][0]
    assert dup_row["status"] == "warning"
    assert any("duplicate" in w.lower() for w in dup_row["warnings"])

    unknown_stage_row = body["rows"][1]
    assert unknown_stage_row["status"] == "warning"
    assert any("unknown stage" in w.lower() for w in unknown_stage_row["warnings"])

    bad_date_row = body["rows"][2]
    assert bad_date_row["status"] == "error"
    assert any("date" in e.lower() for e in bad_date_row["errors"])

    missing_title_row = body["rows"][3]
    assert missing_title_row["status"] == "error"


def test_commit_skip_duplicates_vs_import_all(client, register_user):
    _, token = register_user(client)
    headers = {"Authorization": f"Bearer {token}"}

    client.post("/jobs", json={"title": "Existing Role", "company": "Acme"}, headers=headers)

    csv_text = "title,company\nExisting Role,Acme\nBrand New Role,Zeta\n"
    mapping = {"title": "title", "company": "company"}

    skip_resp = _upload(client, headers, "/import/csv/commit", csv_text, column_map=mapping, mode="skip_duplicates")
    assert skip_resp.status_code == 200
    skip_body = skip_resp.json()
    assert skip_body["imported"] == 1
    assert skip_body["skipped"] == 1
    assert skip_body["error_rows"] == []

    import_all_resp = _upload(client, headers, "/import/csv/commit", csv_text, column_map=mapping, mode="import_all")
    assert import_all_resp.status_code == 200
    import_all_body = import_all_resp.json()
    assert import_all_body["imported"] == 2
    assert import_all_body["skipped"] == 0

    jobs = client.get("/jobs", params={"page_size": 100}, headers=headers).json()
    assert jobs["total"] == 4
