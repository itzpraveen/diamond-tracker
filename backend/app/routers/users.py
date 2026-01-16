import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db import get_db
from app.deps import require_roles
from app.models import Role, User
from app.schemas import UserCreate, UserOut, UserUpdate
from app.utils.security import hash_password

router = APIRouter(prefix="/users", tags=["users"])


@router.get("", response_model=list[UserOut])
def list_users(db: Session = Depends(get_db), user=Depends(require_roles(Role.ADMIN))):
    return db.query(User).order_by(User.created_at.desc()).all()


@router.post("", response_model=UserOut)
def create_user(payload: UserCreate, db: Session = Depends(get_db), user=Depends(require_roles(Role.ADMIN))):
    existing = db.query(User).filter(User.username == payload.username).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username already exists")
    new_user = User(
        username=payload.username,
        password_hash=hash_password(payload.password),
        roles=payload.roles,
        is_active=True,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


@router.patch("/{user_id}", response_model=UserOut)
def update_user(user_id: str, payload: UserUpdate, db: Session = Depends(get_db), user=Depends(require_roles(Role.ADMIN))):
    try:
        user_uuid = uuid.UUID(user_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Invalid user id") from exc
    target = db.query(User).filter(User.id == user_uuid).first()
    if not target:
        raise HTTPException(status_code=404, detail="User not found")

    if payload.password:
        target.password_hash = hash_password(payload.password)
    if payload.is_active is not None:
        target.is_active = payload.is_active
    if payload.roles is not None:
        if not payload.roles:
            raise HTTPException(status_code=400, detail="At least one role is required")
        target.roles = payload.roles

    db.commit()
    db.refresh(target)
    return target
