from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app import models
from app.database import get_db
from app.errors import unauthorized
from app.security import TokenError, decode_access_token

bearer_scheme = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> models.User:
    if credentials is None or not credentials.credentials:
        raise unauthorized("Missing authentication token")
    try:
        user_id = decode_access_token(credentials.credentials)
    except TokenError as exc:
        raise unauthorized("Invalid or expired token") from exc
    user = db.get(models.User, user_id)
    if user is None:
        raise unauthorized("Invalid or expired token")
    return user
