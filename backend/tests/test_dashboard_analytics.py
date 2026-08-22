from datetime import datetime, timedelta

from app.utils import today


def _stage_id_by_name(client, headers, name):
    stages = client.get("/pipeline/stages", headers=headers).json()
    return next(s["id"] for s in stages if s["name"] == name)


def test_dashboard_zero_division_safe_with_no_data(client, register_user):
    _, token = register_user(client)
    headers = {"Authorization": f"Bearer {token}"}

    resp = client.get("/dashboard", headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["stats"]["total_active"] == 0
    assert data["metrics"]["app_to_interview_pct"] is None
    assert data["metrics"]["interview_to_offer_pct"] is None
    assert data["metrics"]["avg_days_apply_to_first_interview"] is None
    assert data["metrics"]["avg_days_apply_to_offer"] is None
    assert data["recent_activity"] == []


def test_dashboard_math_on_known_fixture(client, register_user):
    _, token = register_user(client)
    headers = {"Authorization": f"Bearer {token}"}

    applied_stage = _stage_id_by_name(client, headers, "Applied")
    interview_stage = _stage_id_by_name(client, headers, "Interview 1")
    offer_stage = _stage_id_by_name(client, headers, "Offer")

    applied_date = today()

    job1 = client.post(
        "/jobs",
        json={
            "title": "Job With Offer",
            "company": "Acme",
            "stage_id": applied_stage,
            "date_applied": applied_date.isoformat(),
        },
        headers=headers,
    ).json()

    client.patch(f"/jobs/{job1['id']}/stage", json={"stage_id": interview_stage}, headers=headers)
    interview_time = datetime.combine(applied_date + timedelta(days=5), datetime.min.time()).isoformat()
    client.post(
        f"/jobs/{job1['id']}/interviews",
        json={"type_label": "Recruiter Screen", "scheduled_at": interview_time},
        headers=headers,
    )
    offer_date = applied_date + timedelta(days=10)
    client.patch(f"/jobs/{job1['id']}/stage", json={"stage_id": offer_stage}, headers=headers)
    client.patch(f"/jobs/{job1['id']}", json={"offer_date": offer_date.isoformat()}, headers=headers)

    client.post(
        "/jobs",
        json={
            "title": "Job Without Interview",
            "company": "Beta",
            "stage_id": applied_stage,
            "date_applied": applied_date.isoformat(),
        },
        headers=headers,
    )

    data = client.get("/dashboard", headers=headers).json()

    assert data["metrics"]["applications_this_week"] == 2
    assert data["metrics"]["offers_received"] == 1
    assert data["metrics"]["app_to_interview_pct"] == 50.0
    assert data["metrics"]["avg_days_apply_to_first_interview"] == 5.0
    assert data["metrics"]["avg_days_apply_to_offer"] == 10.0
    assert data["stats"]["offers"] == 1


def test_analytics_aggregation_matches_seeded_rows(client, register_user):
    _, token = register_user(client)
    headers = {"Authorization": f"Bearer {token}"}

    sources = client.get("/sources", headers=headers).json()
    linkedin_id = next(s["id"] for s in sources if s["name"] == "LinkedIn")

    applied_date = today()
    client.post(
        "/jobs",
        json={"title": "Role A", "company": "Acme", "source_id": linkedin_id, "date_applied": applied_date.isoformat()},
        headers=headers,
    )
    client.post(
        "/jobs",
        json={"title": "Role B", "company": "Beta", "source_id": linkedin_id, "date_applied": applied_date.isoformat()},
        headers=headers,
    )

    data = client.get("/analytics", headers=headers).json()

    linkedin_stat = next(s for s in data["by_source"] if s["source"] == "LinkedIn")
    assert linkedin_stat["applications"] == 2
    assert linkedin_stat["conversion_pct"] == 0.0  # real zero: applications exist, zero offers

    indeed_stat = next(s for s in data["by_source"] if s["source"] == "Indeed")
    assert indeed_stat["applications"] == 0
    assert indeed_stat["conversion_pct"] is None  # no data at all: null, not a fabricated zero

    month_key = applied_date.strftime("%Y-%m")
    matching_month = next(m for m in data["applications_over_time"] if m["month"] == month_key)
    assert matching_month["count"] == 2
