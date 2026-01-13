from datetime import datetime, timezone
from typing import Optional
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy import desc, func
from sqlalchemy.orm import Session

from app.db import get_db
from app.deps import require_roles
from app.models import BatchItem, Branch, ItemJob, JobEditAudit, Role, Status, StatusEvent
from app.schemas import JobCreate, JobDetail, JobOut, JobScanRequest, JobUpdate, StatusEventOut
from app.utils.pdf import generate_label_pdf
from app.utils.transitions import (
    STATUS_HOLDER_ROLE,
    allowed_next_statuses,
    is_allowed_transition,
    is_terminal,
    next_logical_statuses,
    requires_override,
    role_can_transition,
)

router = APIRouter(prefix="/jobs", tags=["jobs"])


def _generate_job_id(db: Session) -> str:
    year = datetime.now(timezone.utc).year
    prefix = f"DJ-{year}-"
    last_job = (
        db.query(ItemJob)
        .filter(ItemJob.job_id.like(f"{prefix}%"))
        .order_by(desc(ItemJob.job_id))
        .first()
    )
    if not last_job:
        next_number = 1
    else:
        try:
            next_number = int(last_job.job_id.split("-")[-1]) + 1
        except ValueError:
            next_number = 1
    return f"{prefix}{next_number:06d}"


def _get_default_branch(db: Session) -> Branch:
    branch = db.query(Branch).first()
    if not branch:
        branch = Branch(name="Main Branch")
        db.add(branch)
        db.commit()
        db.refresh(branch)
    return branch


def _get_job_by_code(db: Session, job_id: str) -> ItemJob:
    job = db.query(ItemJob).filter(ItemJob.job_id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job


def _get_previous_status_before_hold(db: Session, job: ItemJob) -> Optional[Status]:
    hold_event = (
        db.query(StatusEvent)
        .filter(StatusEvent.job_id == job.id, StatusEvent.to_status == Status.ON_HOLD)
        .order_by(desc(StatusEvent.timestamp))
        .first()
    )
    if not hold_event:
        return None
    return hold_event.from_status


@router.post("", response_model=JobOut)
def create_job(payload: JobCreate, user=Depends(require_roles(Role.PURCHASE, Role.ADMIN)), db: Session = Depends(get_db)):
    branch = _get_default_branch(db)
    job = ItemJob(
        job_id=_generate_job_id(db),
        branch_id=branch.id,
        customer_name=payload.customer_name,
        customer_phone=payload.customer_phone,
        item_description=payload.item_description,
        approximate_weight=payload.approximate_weight,
        purchase_value=payload.purchase_value,
        photos=[photo.model_dump() for photo in payload.photos] if payload.photos else [],
        current_status=Status.PURCHASED,
        current_holder_role=Role.PURCHASE,
        current_holder_user_id=user.id,
        last_scan_at=datetime.now(timezone.utc),
        notes=payload.notes,
    )
    db.add(job)
    db.flush()

    event = StatusEvent(
        job_id=job.id,
        from_status=None,
        to_status=Status.PURCHASED,
        scanned_by_user_id=user.id,
        scanned_by_role=user.role,
        timestamp=datetime.now(timezone.utc),
        remarks="Job created",
    )
    db.add(event)
    db.commit()
    db.refresh(job)
    return job


@router.get("", response_model=list[JobOut])
def list_jobs(
    status: Optional[Status] = Query(default=None),
    from_date: Optional[datetime] = Query(default=None),
    to_date: Optional[datetime] = Query(default=None),
    batch_id: Optional[str] = Query(default=None),
    phone: Optional[str] = Query(default=None),
    job_id: Optional[str] = Query(default=None),
    db: Session = Depends(get_db),
    user=Depends(require_roles(Role.ADMIN, Role.PURCHASE, Role.PACKING, Role.DISPATCH, Role.FACTORY, Role.QC_STOCK, Role.DELIVERY)),
):
    query = db.query(ItemJob)
    if status:
        query = query.filter(ItemJob.current_status == status)
    if from_date:
        query = query.filter(ItemJob.created_at >= from_date)
    if to_date:
        query = query.filter(ItemJob.created_at <= to_date)
    if phone:
        query = query.filter(ItemJob.customer_phone.ilike(f"%{phone}%"))
    if job_id:
        query = query.filter(ItemJob.job_id.ilike(f"%{job_id}%"))
    if batch_id:
        try:
            batch_uuid = uuid.UUID(batch_id)
        except ValueError as exc:
            raise HTTPException(status_code=400, detail="Invalid batch id") from exc
        query = query.join(BatchItem).filter(BatchItem.batch_id == batch_uuid)
    return query.order_by(desc(ItemJob.created_at)).limit(200).all()


@router.get("/{job_id}", response_model=JobDetail)
def get_job(job_id: str, db: Session = Depends(get_db), user=Depends(require_roles(Role.ADMIN, Role.PURCHASE, Role.PACKING, Role.DISPATCH, Role.FACTORY, Role.QC_STOCK, Role.DELIVERY))):
    job = _get_job_by_code(db, job_id)
    events = db.query(StatusEvent).filter(StatusEvent.job_id == job.id).order_by(StatusEvent.timestamp).all()
    return JobDetail(
        **JobOut.model_validate(job).model_dump(),
        status_events=[StatusEventOut.model_validate(event) for event in events],
    )


@router.patch("/{job_id}", response_model=JobOut)
def update_job(job_id: str, payload: JobUpdate, user=Depends(require_roles(Role.ADMIN)), db: Session = Depends(get_db)):
    job = _get_job_by_code(db, job_id)
    if not payload.reason.strip():
        raise HTTPException(status_code=400, detail="Edit reason required")
    changes = {}
    for field in [
        "customer_name",
        "customer_phone",
        "item_description",
        "approximate_weight",
        "purchase_value",
        "photos",
        "notes",
    ]:
        value = getattr(payload, field)
        if value is not None:
            old_value = getattr(job, field)
            if field == "photos":
                value = [photo.model_dump() for photo in value]
            if old_value != value:
                changes[field] = {"from": old_value, "to": value}
                setattr(job, field, value)
    if not changes:
        return job

    audit = JobEditAudit(
        job_id=job.id,
        edited_by_user_id=user.id,
        edited_by_role=user.role,
        reason=payload.reason,
        changes=changes,
    )
    db.add(audit)
    db.commit()
    db.refresh(job)
    return job


@router.post("/{job_id}/scan", response_model=StatusEventOut)
def scan_job(job_id: str, payload: JobScanRequest, db: Session = Depends(get_db), user=Depends(require_roles(Role.ADMIN, Role.PACKING, Role.DISPATCH, Role.FACTORY, Role.QC_STOCK, Role.DELIVERY, Role.PURCHASE))):
    job = _get_job_by_code(db, job_id)
    current_status = job.current_status
    target_status = payload.to_status

    if current_status == Status.ON_HOLD:
        previous_status = _get_previous_status_before_hold(db, job)
        if not previous_status:
            raise HTTPException(status_code=400, detail="Cannot resolve ON_HOLD without previous status")
        allowed = target_status in next_logical_statuses(previous_status)
        if not allowed:
            raise HTTPException(status_code=400, detail="ON_HOLD can only move to the next logical step")
        override_needed = True
    else:
        override_needed = requires_override(current_status, target_status)

    if is_terminal(current_status) and target_status != current_status:
        raise HTTPException(status_code=400, detail="Item is in terminal status")

    if override_needed:
        if user.role != Role.ADMIN:
            raise HTTPException(status_code=403, detail="Admin override required")
        if not payload.override_reason:
            raise HTTPException(status_code=400, detail="Override reason required")
    else:
        if not is_allowed_transition(current_status, target_status):
            raise HTTPException(status_code=400, detail="Invalid transition")
        if not role_can_transition(user.role, target_status):
            raise HTTPException(status_code=403, detail="Role cannot perform this transition")

    job.current_status = target_status
    job.current_holder_role = STATUS_HOLDER_ROLE[target_status]
    job.current_holder_user_id = user.id
    job.last_scan_at = datetime.now(timezone.utc)

    event = StatusEvent(
        job_id=job.id,
        from_status=current_status,
        to_status=target_status,
        scanned_by_user_id=user.id,
        scanned_by_role=user.role,
        timestamp=datetime.now(timezone.utc),
        location=payload.location,
        device_id=payload.device_id,
        remarks=payload.remarks,
        incident_flag=payload.incident_flag,
        override_reason=payload.override_reason,
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    return event


@router.get("/{job_id}/label.pdf")
def get_label(job_id: str, db: Session = Depends(get_db), user=Depends(require_roles(Role.ADMIN, Role.PURCHASE, Role.PACKING, Role.DISPATCH, Role.FACTORY, Role.QC_STOCK, Role.DELIVERY))):
    job = _get_job_by_code(db, job_id)
    branch = db.query(Branch).filter(Branch.id == job.branch_id).first()
    pdf_bytes = generate_label_pdf(job, branch.name if branch else "Main Branch")
    return StreamingResponse(iter([pdf_bytes]), media_type="application/pdf")
