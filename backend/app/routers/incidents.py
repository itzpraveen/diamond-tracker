import uuid
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db import get_db
from app.deps import require_roles
from app.models import Incident, IncidentStatus, IncidentType, ItemJob, Role
from app.schemas import IncidentCreate, IncidentOut, IncidentResolve

router = APIRouter(prefix="/incidents", tags=["incidents"])


def _get_job(db: Session, job_code: str) -> ItemJob:
    job = db.query(ItemJob).filter(ItemJob.job_id == job_code).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job


@router.post("", response_model=IncidentOut)
def create_incident(payload: IncidentCreate, user=Depends(require_roles(Role.ADMIN, Role.PURCHASE, Role.PACKING, Role.DISPATCH, Role.FACTORY, Role.QC_STOCK, Role.DELIVERY)), db: Session = Depends(get_db)):
    job_uuid = None
    if payload.job_id:
        job = _get_job(db, payload.job_id)
        job_uuid = job.id

    incident = Incident(
        job_id=job_uuid,
        batch_id=payload.batch_id,
        type=payload.type,
        description=payload.description,
        reported_by=user.id,
        attachments=payload.attachments,
    )
    db.add(incident)
    db.commit()
    db.refresh(incident)
    return incident


@router.get("", response_model=list[IncidentOut])
def list_incidents(
    status: Optional[str] = Query(default=None),
    type: Optional[str] = Query(default=None),
    job_id: Optional[str] = Query(default=None),
    batch_id: Optional[str] = Query(default=None),
    from_date: Optional[datetime] = Query(default=None),
    to_date: Optional[datetime] = Query(default=None),
    db: Session = Depends(get_db),
    user=Depends(require_roles(Role.ADMIN, Role.PURCHASE, Role.PACKING, Role.DISPATCH, Role.FACTORY, Role.QC_STOCK, Role.DELIVERY)),
):
    query = db.query(Incident)
    if status:
        try:
            status_enum = IncidentStatus(status)
        except ValueError as exc:
            raise HTTPException(status_code=400, detail="Invalid status") from exc
        query = query.filter(Incident.status == status_enum)
    if type:
        try:
            type_enum = IncidentType(type)
        except ValueError as exc:
            raise HTTPException(status_code=400, detail="Invalid type") from exc
        query = query.filter(Incident.type == type_enum)
    if job_id:
        job = _get_job(db, job_id)
        query = query.filter(Incident.job_id == job.id)
    if batch_id:
        try:
            batch_uuid = uuid.UUID(batch_id)
        except ValueError as exc:
            raise HTTPException(status_code=400, detail="Invalid batch id") from exc
        query = query.filter(Incident.batch_id == batch_uuid)
    if from_date:
        query = query.filter(Incident.created_at >= from_date)
    if to_date:
        query = query.filter(Incident.created_at <= to_date)
    return query.order_by(Incident.created_at.desc()).limit(200).all()


@router.patch("/{incident_id}/resolve", response_model=IncidentOut)
def resolve_incident(incident_id: str, payload: IncidentResolve, user=Depends(require_roles(Role.ADMIN, Role.QC_STOCK)), db: Session = Depends(get_db)):
    try:
        incident_uuid = uuid.UUID(incident_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Invalid incident id") from exc
    incident = db.query(Incident).filter(Incident.id == incident_uuid).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    incident.status = IncidentStatus.RESOLVED
    incident.resolved_at = datetime.now(timezone.utc)
    incident.resolution_notes = payload.resolution_notes
    db.commit()
    db.refresh(incident)
    return incident
