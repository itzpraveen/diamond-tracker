from datetime import datetime, timezone
import uuid

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session, selectinload

from app.db import get_db
from app.deps import require_roles
from app.models import Batch, BatchItem, BatchStatus, Branch, Factory, ItemJob, Role, Status
from app.schemas import BatchAddItem, BatchCreate, BatchDetail, BatchDispatchRequest, BatchOut, JobOut
from app.utils.pdf import generate_manifest_pdf
router = APIRouter(prefix="/batches", tags=["batches"])


def _get_default_branch(db: Session) -> Branch:
    branch = db.query(Branch).first()
    if not branch:
        branch = Branch(name="Main Branch")
        db.add(branch)
        db.commit()
        db.refresh(branch)
    return branch


def _get_batch(db: Session, batch_id: str, *, with_items: bool = False, with_factory: bool = False) -> Batch:
    try:
        batch_uuid = uuid.UUID(batch_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Invalid batch id") from exc
    query = db.query(Batch)
    if with_factory:
        query = query.options(selectinload(Batch.factory))
    if with_items:
        query = query.options(
            selectinload(Batch.items)
            .selectinload(BatchItem.job)
            .selectinload(ItemJob.factory)
        )
    batch = query.filter(Batch.id == batch_uuid).first()
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")
    return batch


def _get_job_by_code(db: Session, job_code: str) -> ItemJob:
    job = db.query(ItemJob).filter(ItemJob.job_id == job_code).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job


def _get_factory_by_uuid(db: Session, factory_id: uuid.UUID) -> Factory:
    factory = db.query(Factory).filter(Factory.id == factory_id).first()
    if not factory:
        raise HTTPException(status_code=404, detail="Factory not found")
    if not factory.is_active:
        raise HTTPException(status_code=400, detail="Factory is inactive")
    return factory


@router.post("", response_model=BatchOut)
def create_batch(payload: BatchCreate, user=Depends(require_roles(Role.DISPATCH, Role.ADMIN)), db: Session = Depends(get_db)):
    now = datetime.now(timezone.utc)
    year = payload.year or now.year
    month = payload.month or now.month
    batch_code = f"BATCH-{year}-{month:02d}"

    existing = db.query(Batch).filter(Batch.batch_code == batch_code).first()
    if existing:
        return existing

    branch = _get_default_branch(db)
    batch = Batch(
        batch_code=batch_code,
        branch_id=branch.id,
        created_by=user.id,
        expected_return_date=payload.expected_return_date,
        status=BatchStatus.CREATED,
    )
    db.add(batch)
    db.commit()
    db.refresh(batch)
    return batch


@router.get("", response_model=list[BatchOut])
def list_batches(db: Session = Depends(get_db), user=Depends(require_roles(Role.ADMIN, Role.DISPATCH, Role.FACTORY, Role.QC_STOCK))):
    return (
        db.query(Batch)
        .options(selectinload(Batch.factory))
        .order_by(Batch.created_at.desc())
        .limit(200)
        .all()
    )


@router.post("/{batch_id}/items", response_model=BatchOut)
def add_item(batch_id: str, payload: BatchAddItem, user=Depends(require_roles(Role.DISPATCH, Role.ADMIN)), db: Session = Depends(get_db)):
    batch = _get_batch(db, batch_id)
    job = _get_job_by_code(db, payload.job_id)
    if job.current_status != Status.PACKED_READY:
        raise HTTPException(status_code=400, detail="Only PACKED_READY items can be added")

    existing = db.query(BatchItem).filter(BatchItem.batch_id == batch.id, BatchItem.job_id == job.id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Item already in batch")

    db.add(BatchItem(batch_id=batch.id, job_id=job.id))
    batch.item_count += 1
    db.commit()
    db.refresh(batch)
    return batch


@router.post("/{batch_id}/dispatch", response_model=BatchOut)
def dispatch_batch(batch_id: str, payload: BatchDispatchRequest, user=Depends(require_roles(Role.DISPATCH, Role.ADMIN)), db: Session = Depends(get_db)):
    batch = _get_batch(db, batch_id)
    items = (
        db.query(BatchItem)
        .options(selectinload(BatchItem.job))
        .filter(BatchItem.batch_id == batch.id)
        .all()
    )
    if not items:
        raise HTTPException(status_code=400, detail="Batch has no items")
    if payload.factory_id:
        factory = _get_factory_by_uuid(db, payload.factory_id)
        if batch.factory_id and batch.factory_id != factory.id:
            raise HTTPException(status_code=400, detail="Batch factory does not match")
        batch.factory_id = factory.id
    if not batch.factory_id:
        raise HTTPException(status_code=400, detail="Factory id required before dispatch")

    jobs = [item.job for item in items]
    allowed_statuses = {
        Status.DISPATCHED_TO_FACTORY,
        Status.RECEIVED_AT_FACTORY,
        Status.RETURNED_FROM_FACTORY,
        Status.RECEIVED_AT_SHOP,
        Status.ADDED_TO_STOCK,
        Status.HANDED_TO_DELIVERY,
        Status.DELIVERED_TO_CUSTOMER,
    }
    for job in jobs:
        if job.current_status not in allowed_statuses:
            raise HTTPException(status_code=400, detail=f"Job {job.job_id} is not dispatched yet")

    batch.status = BatchStatus.DISPATCHED
    if payload.dispatch_date:
        batch.dispatch_date = payload.dispatch_date
    elif not batch.dispatch_date:
        batch.dispatch_date = datetime.now(timezone.utc)
    if payload.expected_return_date:
        batch.expected_return_date = payload.expected_return_date
        for job in jobs:
            if job.target_return_date is None:
                job.target_return_date = payload.expected_return_date
    db.commit()
    db.refresh(batch)
    return batch


@router.get("/{batch_id}", response_model=BatchDetail)
def get_batch(batch_id: str, db: Session = Depends(get_db), user=Depends(require_roles(Role.ADMIN, Role.DISPATCH, Role.FACTORY, Role.QC_STOCK))):
    batch = _get_batch(db, batch_id, with_items=True, with_factory=True)
    items = [item.job for item in batch.items]
    return BatchDetail(
        **BatchOut.model_validate(batch).model_dump(),
        items=[JobOut.model_validate(job) for job in items],
    )


@router.get("/{batch_id}/manifest.pdf")
def get_manifest(batch_id: str, db: Session = Depends(get_db), user=Depends(require_roles(Role.ADMIN, Role.DISPATCH))):
    batch = _get_batch(db, batch_id, with_items=True, with_factory=True)
    jobs = [item.job for item in batch.items]
    pdf_bytes = generate_manifest_pdf(batch, jobs)
    return StreamingResponse(iter([pdf_bytes]), media_type="application/pdf")


@router.post("/{batch_id}/close", response_model=BatchOut)
def close_batch(batch_id: str, db: Session = Depends(get_db), user=Depends(require_roles(Role.ADMIN, Role.DISPATCH))):
    batch = _get_batch(db, batch_id)
    jobs = [item.job for item in batch.items]
    allowed_statuses = {
        Status.RECEIVED_AT_SHOP,
        Status.ADDED_TO_STOCK,
        Status.HANDED_TO_DELIVERY,
        Status.DELIVERED_TO_CUSTOMER,
    }
    for job in jobs:
        if job.current_status not in allowed_statuses:
            raise HTTPException(status_code=400, detail="Not all items have returned")

    batch.status = BatchStatus.CLOSED
    db.commit()
    db.refresh(batch)
    return batch
