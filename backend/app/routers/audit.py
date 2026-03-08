import uuid
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db import get_db
from app.deps import require_roles
from app.models import ItemJob, Role, Status, StatusEvent, User
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
    limit: int = Query(default=200, ge=1, le=500),
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

    events = query.order_by(StatusEvent.timestamp.desc()).limit(limit).all()
    if not events:
        return []

    job_ids = {event.job_id for event in events}
    user_ids = {event.scanned_by_user_id for event in events}
    jobs = db.query(ItemJob).filter(ItemJob.id.in_(job_ids)).all()
    users = db.query(User).filter(User.id.in_(user_ids)).all()
    job_map = {job.id: job.job_id for job in jobs}
    user_map = {entry.id: entry.username for entry in users}

    return [
        StatusEventOut.model_validate(event).model_copy(
            update={
                "job_code": job_map.get(event.job_id),
                "scanned_by_username": user_map.get(event.scanned_by_user_id),
            }
        )
        for event in events
    ]
