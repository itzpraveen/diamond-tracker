import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.db import get_db
from app.deps import require_roles
from app.models import Factory, Role
from app.schemas import FactoryCreate, FactoryOut, FactoryUpdate

router = APIRouter(prefix="/factories", tags=["factories"])


@router.get("", response_model=list[FactoryOut])
def list_factories(
    include_inactive: bool = Query(default=False),
    db: Session = Depends(get_db),
    user=Depends(require_roles(Role.ADMIN, Role.DISPATCH)),
):
    query = db.query(Factory)
    if not include_inactive:
        query = query.filter(Factory.is_active.is_(True))
    return query.order_by(Factory.name.asc()).all()


@router.post("", response_model=FactoryOut)
def create_factory(
    payload: FactoryCreate,
    db: Session = Depends(get_db),
    user=Depends(require_roles(Role.ADMIN)),
):
    existing = (
        db.query(Factory)
        .filter(func.lower(Factory.name) == payload.name.lower().strip())
        .first()
    )
    if existing:
        raise HTTPException(status_code=400, detail="Factory already exists")
    factory = Factory(name=payload.name.strip(), is_active=payload.is_active)
    db.add(factory)
    db.commit()
    db.refresh(factory)
    return factory


@router.patch("/{factory_id}", response_model=FactoryOut)
def update_factory(
    factory_id: str,
    payload: FactoryUpdate,
    db: Session = Depends(get_db),
    user=Depends(require_roles(Role.ADMIN)),
):
    try:
        factory_uuid = uuid.UUID(factory_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Invalid factory id") from exc

    factory = db.query(Factory).filter(Factory.id == factory_uuid).first()
    if not factory:
        raise HTTPException(status_code=404, detail="Factory not found")

    if payload.name:
        name = payload.name.strip()
        existing = (
            db.query(Factory)
            .filter(func.lower(Factory.name) == name.lower(), Factory.id != factory.id)
            .first()
        )
        if existing:
            raise HTTPException(status_code=400, detail="Factory already exists")
        factory.name = name
    if payload.is_active is not None:
        factory.is_active = payload.is_active

    db.commit()
    db.refresh(factory)
    return factory
