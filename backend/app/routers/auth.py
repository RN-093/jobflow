from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import get_db
from app.deps import get_current_user
from app.errors import conflict, unauthorized
from app.security import create_access_token, hash_password, verify_password
from app.services.defaults import seed_defaults_for_user

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=schemas.AuthOut, status_code=201)
def register(payload: schemas.RegisterIn, db: Session = Depends(get_db)) -> schemas.AuthOut:
    existing = db.query(models.User).filter(models.User.email == payload.email).first()
    if existing is not None:
        raise conflict("An account with this email already exists")

    user = models.User(
        email=payload.email,
        hashed_password=hash_password(payload.password),
        full_name=payload.full_name,
    )
    db.add(user)
    db.flush()

    seed_defaults_for_user(db, user)
    db.commit()
    db.refresh(user)

    token = create_access_token(user.id)
    return schemas.AuthOut(access_token=token, user=schemas.UserOut.model_validate(user))


@router.post("/login", response_model=schemas.AuthOut)
def login(payload: schemas.LoginIn, db: Session = Depends(get_db)) -> schemas.AuthOut:
    user = db.query(models.User).filter(models.User.email == payload.email).first()
    if user is None or not verify_password(payload.password, user.hashed_password):
        raise unauthorized("Incorrect email or password")

    token = create_access_token(user.id)
    return schemas.AuthOut(access_token=token, user=schemas.UserOut.model_validate(user))


@router.get("/me", response_model=schemas.UserOut)
def me(current_user: models.User = Depends(get_current_user)) -> schemas.UserOut:
    return schemas.UserOut.model_validate(current_user)
