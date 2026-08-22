import os
import tempfile
from collections.abc import Generator

os.environ.setdefault("SECRET_KEY", "test-secret-key-not-for-production")
os.environ.setdefault("DATABASE_URL", "sqlite:///./unused-for-tests.db")

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event
from sqlalchemy.orm import Session, sessionmaker

from app.database import Base, get_db
from app.main import app


@pytest.fixture()
def db_session() -> Generator[Session, None, None]:
    fd, path = tempfile.mkstemp(suffix=".db")
    os.close(fd)
    engine = create_engine(f"sqlite:///{path}", connect_args={"check_same_thread": False})

    @event.listens_for(engine, "connect")
    def _set_sqlite_pragma(dbapi_connection, connection_record) -> None:
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

    Base.metadata.create_all(engine)
    testing_session_local = sessionmaker(bind=engine, autoflush=False, autocommit=False)
    session = testing_session_local()
    try:
        yield session
    finally:
        session.close()
        engine.dispose()
        os.unlink(path)


@pytest.fixture()
def client(db_session: Session) -> Generator[TestClient, None, None]:
    def override_get_db() -> Generator[Session, None, None]:
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


def auth_headers(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture()
def register_user():
    def _register(
        test_client: TestClient,
        email: str = "user@example.com",
        password: str = "password123",
        full_name: str | None = "Test User",
    ) -> tuple[dict, str]:
        resp = test_client.post(
            "/auth/register", json={"email": email, "password": password, "full_name": full_name}
        )
        assert resp.status_code == 201, resp.text
        data = resp.json()
        return data["user"], data["access_token"]

    return _register


@pytest.fixture()
def two_users(client: TestClient, register_user) -> dict:
    user_a, token_a = register_user(client, email="alice@example.com")
    user_b, token_b = register_user(client, email="bob@example.com")
    return {
        "a": {"user": user_a, "token": token_a, "headers": auth_headers(token_a)},
        "b": {"user": user_b, "token": token_b, "headers": auth_headers(token_b)},
    }
