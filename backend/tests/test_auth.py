from datetime import datetime, timedelta, timezone

import jwt

from app.config import settings
from tests.conftest import auth_headers


def test_register_login_me_happy_path(client, register_user):
    user, token = register_user(client, email="jane@example.com")
    assert user["email"] == "jane@example.com"
    assert user["is_demo"] is False

    login_resp = client.post("/auth/login", json={"email": "jane@example.com", "password": "password123"})
    assert login_resp.status_code == 200
    login_token = login_resp.json()["access_token"]

    me_resp = client.get("/auth/me", headers=auth_headers(login_token))
    assert me_resp.status_code == 200
    assert me_resp.json()["email"] == "jane@example.com"

    # Registration seeds 11 default stages and 8 default sources.
    stages_resp = client.get("/pipeline/stages", headers=auth_headers(token))
    assert len(stages_resp.json()) == 11
    sources_resp = client.get("/sources", headers=auth_headers(token))
    assert len(sources_resp.json()) == 8


def test_duplicate_email_conflict(client, register_user):
    register_user(client, email="dupe@example.com")
    resp = client.post(
        "/auth/register", json={"email": "dupe@example.com", "password": "password123"}
    )
    assert resp.status_code == 409
    assert resp.json()["error"]["code"] == "conflict"


def test_wrong_password_unauthorized(client, register_user):
    register_user(client, email="pw@example.com", password="correcthorse123")
    resp = client.post("/auth/login", json={"email": "pw@example.com", "password": "wrongpassword"})
    assert resp.status_code == 401
    assert resp.json()["error"]["code"] == "unauthorized"


def test_missing_token_unauthorized(client):
    resp = client.get("/auth/me")
    assert resp.status_code == 401


def test_garbage_token_unauthorized(client):
    resp = client.get("/auth/me", headers=auth_headers("not-a-real-token"))
    assert resp.status_code == 401


def test_expired_token_unauthorized(client, register_user):
    user, _token = register_user(client, email="expired@example.com")
    expired_payload = {
        "sub": user["id"],
        "iat": datetime.now(timezone.utc) - timedelta(hours=2),
        "exp": datetime.now(timezone.utc) - timedelta(hours=1),
    }
    expired_token = jwt.encode(expired_payload, settings.secret_key, algorithm="HS256")
    resp = client.get("/auth/me", headers=auth_headers(expired_token))
    assert resp.status_code == 401


def test_bad_signature_token_unauthorized(client, register_user):
    user, _token = register_user(client, email="badsig@example.com")
    payload = {
        "sub": user["id"],
        "iat": datetime.now(timezone.utc),
        "exp": datetime.now(timezone.utc) + timedelta(hours=1),
    }
    bad_token = jwt.encode(payload, "wrong-secret-key", algorithm="HS256")
    resp = client.get("/auth/me", headers=auth_headers(bad_token))
    assert resp.status_code == 401
