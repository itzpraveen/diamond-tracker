import uuid
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db import get_db
from app.deps import require_roles
from app.models import ItemJob, Role, Status, StatusEvent
from app.schemas import StatusEventOut

router = APIRouter(prefix="/audit", tags=["audit"])


@router.get("/events", response_model=list[StatusEventOut])
def audit_events(
    job_id: Optional[str] = Query(default=None),
    user_id: Optional[str] = Query(default=None),
    from_status: Optional[Status] = Query(default=None),
    to_status: Optional[Status] = Query(default=None),
    from_date: Optional[datetime] = Query(default=None),
    to_date: Optional[datetime] = Query(default=None),
    db: Session = Depends(get_db),
    user=Depends(require_roles(Role.ADMIN)),
):
    query = db.query(StatusEvent)
    if job_id:
        query = query.join(ItemJob, ItemJob.id == StatusEvent.job_id).filter(ItemJob.job_id == job_id)
    if user_id:
        try:
            user_uuid = uuid.UUID(user_id)
        except ValueError as exc:
            raise HTTPException(status_code=400, detail="Invalid user id") from exc
        query = query.filter(StatusEvent.scanned_by_user_id == user_uuid)
    if from_status:
        query = query.filter(StatusEvent.from_status == from_status)
    if to_status:
        query = query.filter(StatusEvent.to_status == to_status)
    if from_date:
        query = query.filter(StatusEvent.timestamp >= from_date)
    if to_date:
        query = query.filter(StatusEvent.timestamp <= to_date)
    return query.order_by(StatusEvent.timestamp.desc()).limit(500).all()
