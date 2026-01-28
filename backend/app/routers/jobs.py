from datetime import date, datetime, timezone
from typing import Optional
import enum
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy import desc, func
from sqlalchemy.orm import Session, selectinload

from app.db import get_db
from app.deps import require_roles
from app.models import (
    Batch,
    BatchItem,
    BatchStatus,
    Branch,
    Factory,
    ItemJob,
    ItemSource,
    JobEditAudit,
    RepairType,
    Role,
    Status,
    StatusEvent,
    User,
)
from app.schemas import JobCreate, JobDetail, JobMetric, JobOut, JobScanRequest, JobUpdate, LabelSheetRequest, StatusEventOut
from app.utils.pdf import generate_label_pdf, generate_label_sheet_pdf
from app.utils.errors import raise_validation_error
from app.utils.transitions import (
    STATUS_HOLDER_ROLE,
    allowed_next_statuses,
    is_allowed_transition,
    is_terminal,
    next_logical_statuses,
    requires_override,
    role_can_transition,
)
from app.utils.roles import select_role_for_action, select_role_for_status

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


def _get_job_by_code(db: Session, job_id: str, *, with_factory: bool = False) -> ItemJob:
    query = db.query(ItemJob)
    if with_factory:
        query = query.options(selectinload(ItemJob.factory))
    job = query.filter(ItemJob.job_id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job


def _resolve_factory_name(db: Session, job: ItemJob) -> Optional[str]:
    if job.factory_name:
        return job.factory_name
    batch_item = (
        db.query(BatchItem)
        .join(Batch, BatchItem.batch_id == Batch.id)
        .filter(BatchItem.job_id == job.id, Batch.factory_id.isnot(None))
        .order_by(BatchItem.added_at.desc())
        .first()
    )
    if batch_item and batch_item.batch and batch_item.batch.factory:
        return batch_item.batch.factory.name
    return None


def _record_label_print(db: Session, job: ItemJob, user: User) -> bool:
    if job.current_status != Status.PURCHASED:
        return False
    if Role.PACKING not in user.roles and Role.ADMIN not in user.roles:
        return False
    event_role = select_role_for_status(user.roles, Status.PACKED_READY)
    job.current_status = Status.PACKED_READY
    job.current_holder_role = STATUS_HOLDER_ROLE[Status.PACKED_READY]
    job.current_holder_user_id = user.id
    job.last_scan_at = datetime.now(timezone.utc)
    event = StatusEvent(
        job_id=job.id,
        from_status=Status.PURCHASED,
        to_status=Status.PACKED_READY,
        scanned_by_user_id=user.id,
        scanned_by_role=event_role,
        timestamp=datetime.now(timezone.utc),
        remarks="Label printed",
    )
    db.add(event)
    return True


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


def _get_batch_by_uuid(db: Session, batch_id: uuid.UUID) -> Batch:
    batch = db.query(Batch).filter(Batch.id == batch_id).first()
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")
    if batch.status == BatchStatus.CLOSED:
        raise HTTPException(status_code=400, detail="Batch is closed")
    return batch


def _get_factory_by_uuid(db: Session, factory_id: uuid.UUID) -> Factory:
    factory = db.query(Factory).filter(Factory.id == factory_id).first()
    if not factory:
        raise HTTPException(status_code=404, detail="Factory not found")
    if not factory.is_active:
        raise HTTPException(status_code=400, detail="Factory is inactive")
    return factory


@router.post("", response_model=JobOut)
def create_job(payload: JobCreate, user=Depends(require_roles(Role.PURCHASE, Role.ADMIN)), db: Session = Depends(get_db)):
    event_role = select_role_for_action(user.roles, preferred=[Role.PURCHASE])
    branch = _get_default_branch(db)
    voucher_no = payload.voucher_no.strip()
    errors = {}
    if not voucher_no:
        errors["voucher_no"] = "Voucher number is required"
    factory_id = None
    if payload.factory_id:
        factory = _get_factory_by_uuid(db, payload.factory_id)
        factory_id = factory.id
    repair_type = payload.repair_type
    if repair_type is None and payload.item_source:
        repair_type = (
            RepairType.CUSTOMER_REPAIR
            if payload.item_source == ItemSource.REPAIR
            else RepairType.STOCK_REPAIR
        )
    if errors:
        raise_validation_error(errors)
    job = ItemJob(
        job_id=_generate_job_id(db),
        branch_id=branch.id,
        customer_name=payload.customer_name,
        customer_phone=payload.customer_phone,
        item_description=payload.item_description,
        approximate_weight=payload.approximate_weight,
        purchase_value=payload.purchase_value,
        voucher_no=voucher_no,
        item_source=payload.item_source,
        repair_type=repair_type,
        work_narration=payload.work_narration,
        target_return_date=payload.target_return_date,
        factory_id=factory_id,
        diamond_cent=payload.diamond_cent,
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
        scanned_by_role=event_role,
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
    sort_by: Optional[str] = Query(default="created_at"),
    sort_dir: Optional[str] = Query(default="desc"),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
    user=Depends(require_roles(Role.ADMIN, Role.PURCHASE, Role.PACKING, Role.DISPATCH, Role.FACTORY, Role.QC_STOCK, Role.DELIVERY)),
):
    query = db.query(ItemJob).options(selectinload(ItemJob.factory))
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

    sort_map = {
        "created_at": ItemJob.created_at,
        "last_scan_at": ItemJob.last_scan_at,
        "job_id": ItemJob.job_id,
        "customer_name": ItemJob.customer_name,
        "current_status": ItemJob.current_status,
        "current_holder_role": ItemJob.current_holder_role,
    }
    sort_column = sort_map.get(sort_by or "created_at", ItemJob.created_at)
    if (sort_dir or "desc").lower() == "asc":
        query = query.order_by(sort_column.asc())
    else:
        query = query.order_by(sort_column.desc())

    return query.offset(offset).limit(limit).all()


@router.get("/metrics", response_model=list[JobMetric])
def job_metrics(
    statuses: Optional[list[Status]] = Query(default=None),
    from_date: Optional[datetime] = Query(default=None),
    to_date: Optional[datetime] = Query(default=None),
    db: Session = Depends(get_db),
    user=Depends(require_roles(Role.ADMIN, Role.PURCHASE, Role.PACKING, Role.DISPATCH, Role.FACTORY, Role.QC_STOCK, Role.DELIVERY)),
):
    query = db.query(
        ItemJob.current_status.label("status"),
        func.count(ItemJob.id).label("count"),
    )
    if statuses:
        query = query.filter(ItemJob.current_status.in_(statuses))
    if from_date:
        query = query.filter(ItemJob.created_at >= from_date)
    if to_date:
        query = query.filter(ItemJob.created_at <= to_date)
    rows = query.group_by(ItemJob.current_status).all()
    return [JobMetric(status=row.status, count=row.count) for row in rows]


@router.get("/{job_id}", response_model=JobDetail)
def get_job(job_id: str, db: Session = Depends(get_db), user=Depends(require_roles(Role.ADMIN, Role.PURCHASE, Role.PACKING, Role.DISPATCH, Role.FACTORY, Role.QC_STOCK, Role.DELIVERY))):
    job = _get_job_by_code(db, job_id, with_factory=True)
    events = db.query(StatusEvent).filter(StatusEvent.job_id == job.id).order_by(StatusEvent.timestamp).all()
    user_ids = {event.scanned_by_user_id for event in events}
    if job.current_holder_user_id:
        user_ids.add(job.current_holder_user_id)
    users = db.query(User).filter(User.id.in_(user_ids)).all() if user_ids else []
    user_map = {user.id: user.username for user in users}
    status_events = [
        StatusEventOut.model_validate(event).model_copy(
            update={"scanned_by_username": user_map.get(event.scanned_by_user_id)}
        )
        for event in events
    ]
    return JobDetail(
        **JobOut.model_validate(job).model_dump(),
        current_holder_username=user_map.get(job.current_holder_user_id),
        status_events=status_events,
    )


@router.patch("/{job_id}", response_model=JobOut)
def update_job(job_id: str, payload: JobUpdate, user=Depends(require_roles(Role.ADMIN)), db: Session = Depends(get_db)):
    job = _get_job_by_code(db, job_id)
    errors = {}
    if not payload.reason.strip():
        errors["reason"] = "Edit reason required"
    event_role = select_role_for_action(user.roles, preferred=[Role.ADMIN])
    if payload.factory_id is not None:
        _get_factory_by_uuid(db, payload.factory_id)
    changes = {}

    def _json_safe(value):
        if isinstance(value, (datetime, date)):
            return value.isoformat()
        if isinstance(value, uuid.UUID):
            return str(value)
        if isinstance(value, enum.Enum):
            return value.value
        if isinstance(value, list):
            return [_json_safe(item) for item in value]
        if isinstance(value, dict):
            return {key: _json_safe(item) for key, item in value.items()}
        return value
    for field in [
        "customer_name",
        "customer_phone",
        "item_description",
        "approximate_weight",
        "purchase_value",
        "voucher_no",
        "item_source",
        "repair_type",
        "work_narration",
        "target_return_date",
        "factory_id",
        "diamond_cent",
        "photos",
        "notes",
    ]:
        value = getattr(payload, field)
        if value is not None:
            old_value = getattr(job, field)
            if field == "photos":
                value = [photo.model_dump() for photo in value]
            if field == "voucher_no":
                value = value.strip()
                if not value:
                    errors["voucher_no"] = "Voucher number is required"
            if old_value != value:
                changes[field] = {"from": _json_safe(old_value), "to": _json_safe(value)}
                setattr(job, field, value)
    if errors:
        raise_validation_error(errors)
    if not changes:
        return job

    audit = JobEditAudit(
        job_id=job.id,
        edited_by_user_id=user.id,
        edited_by_role=event_role,
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
    batch = None
    event_role = select_role_for_status(user.roles, target_status)
    is_admin = Role.ADMIN in user.roles

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
        if not is_admin:
            raise HTTPException(status_code=403, detail="Admin override required")
        if not payload.override_reason:
            raise HTTPException(status_code=400, detail="Override reason required")
        event_role = Role.ADMIN
    else:
        if not is_allowed_transition(current_status, target_status):
            raise HTTPException(status_code=400, detail="Invalid transition")
        if not any(role_can_transition(role, target_status) for role in user.roles):
            raise HTTPException(status_code=403, detail="Role cannot perform this transition")

    if target_status == Status.DISPATCHED_TO_FACTORY and not override_needed:
        if not payload.batch_id:
            raise HTTPException(status_code=400, detail="Batch id required for dispatch")
        batch = _get_batch_by_uuid(db, payload.batch_id)
        if payload.factory_id:
            factory = _get_factory_by_uuid(db, payload.factory_id)
            if batch.factory_id and batch.factory_id != factory.id:
                raise HTTPException(status_code=400, detail="Batch factory does not match")
            batch.factory_id = factory.id
        elif not batch.factory_id:
            raise HTTPException(status_code=400, detail="Factory id required for dispatch")
        existing_item = (
            db.query(BatchItem)
            .filter(BatchItem.batch_id == batch.id, BatchItem.job_id == job.id)
            .first()
        )
        if existing_item:
            raise HTTPException(status_code=400, detail="Item already in batch")
        db.add(BatchItem(batch_id=batch.id, job_id=job.id))
        batch.item_count += 1
        job.factory_id = batch.factory_id
    elif target_status == Status.DISPATCHED_TO_FACTORY and payload.batch_id:
        batch = _get_batch_by_uuid(db, payload.batch_id)
        if payload.factory_id:
            factory = _get_factory_by_uuid(db, payload.factory_id)
            if batch.factory_id and batch.factory_id != factory.id:
                raise HTTPException(status_code=400, detail="Batch factory does not match")
            batch.factory_id = factory.id
        existing_item = (
            db.query(BatchItem)
            .filter(BatchItem.batch_id == batch.id, BatchItem.job_id == job.id)
            .first()
        )
        if not existing_item:
            db.add(BatchItem(batch_id=batch.id, job_id=job.id))
            batch.item_count += 1
        if batch.factory_id:
            job.factory_id = batch.factory_id

    job.current_status = target_status
    job.current_holder_role = STATUS_HOLDER_ROLE[target_status]
    job.current_holder_user_id = user.id
    job.last_scan_at = datetime.now(timezone.utc)
    remarks = payload.remarks
    if target_status == Status.DISPATCHED_TO_FACTORY and batch:
        remarks = remarks or f"Batch dispatch {batch.batch_code}"

    event = StatusEvent(
        job_id=job.id,
        from_status=current_status,
        to_status=target_status,
        scanned_by_user_id=user.id,
        scanned_by_role=event_role,
        timestamp=datetime.now(timezone.utc),
        location=payload.location,
        device_id=payload.device_id,
        remarks=remarks,
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
    factory_name = _resolve_factory_name(db, job)
    pdf_bytes = generate_label_pdf(job, branch.name if branch else "Main Branch", factory_name=factory_name)
    if _record_label_print(db, job, user):
        db.commit()
    return StreamingResponse(iter([pdf_bytes]), media_type="application/pdf")


@router.post("/labels.pdf")
def get_label_sheet(payload: LabelSheetRequest, db: Session = Depends(get_db), user=Depends(require_roles(Role.ADMIN, Role.PURCHASE, Role.PACKING, Role.DISPATCH, Role.FACTORY, Role.QC_STOCK, Role.DELIVERY))):
    job_ids = [job_id.strip() for job_id in payload.job_ids if job_id and job_id.strip()]
    if not job_ids:
        raise HTTPException(status_code=400, detail="Job ids are required")

    unique_job_ids = list(dict.fromkeys(job_ids))
    jobs = (
        db.query(ItemJob)
        .options(selectinload(ItemJob.factory))
        .filter(ItemJob.job_id.in_(unique_job_ids))
        .all()
    )
    job_map = {job.job_id: job for job in jobs}
    missing = [job_id for job_id in unique_job_ids if job_id not in job_map]
    if missing:
        raise HTTPException(status_code=404, detail=f"Jobs not found: {', '.join(missing)}")

    branch_ids = {job.branch_id for job in jobs}
    branches = db.query(Branch).filter(Branch.id.in_(branch_ids)).all()
    branch_map = {branch.id: branch.name for branch in branches}

    factory_name_by_job: dict[uuid.UUID, str] = {}
    for job in jobs:
        if job.factory:
            factory_name_by_job[job.id] = job.factory.name

    missing_factory_ids = [job.id for job in jobs if job.id not in factory_name_by_job]
    if missing_factory_ids:
        rows = (
            db.query(BatchItem.job_id, Factory.name)
            .join(Batch, BatchItem.batch_id == Batch.id)
            .join(Factory, Batch.factory_id == Factory.id)
            .filter(BatchItem.job_id.in_(missing_factory_ids))
            .order_by(BatchItem.job_id, BatchItem.added_at.desc())
            .all()
        )
        for job_id, factory_name in rows:
            if job_id not in factory_name_by_job:
                factory_name_by_job[job_id] = factory_name

    label_entries = []
    for job_id in job_ids:
        job = job_map[job_id]
        branch_name = branch_map.get(job.branch_id) or "Main Branch"
        factory_name = factory_name_by_job.get(job.id)
        if factory_name is None:
            factory_name = _resolve_factory_name(db, job)
        label_entries.append((job, branch_name, factory_name))

    try:
        pdf_bytes = generate_label_sheet_pdf(label_entries, start_position=payload.start_position)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    updated = False
    for job in jobs:
        updated = _record_label_print(db, job, user) or updated
    if updated:
        db.commit()

    return StreamingResponse(iter([pdf_bytes]), media_type="application/pdf")
