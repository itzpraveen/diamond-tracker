import csv
from datetime import datetime, timezone
from io import StringIO
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.db import get_db
from app.deps import require_roles
from app.models import Batch, Incident, ItemJob, Role, Status, StatusEvent, User
from app.schemas import AgingBucket, BatchDelay, TurnaroundMetrics, UserActivity

router = APIRouter(prefix="/reports", tags=["reports"])


@router.get("/pending-aging", response_model=List[AgingBucket])
def pending_aging(db: Session = Depends(get_db), user=Depends(require_roles(Role.ADMIN, Role.DISPATCH, Role.QC_STOCK))):
    now = datetime.now(timezone.utc)
    buckets = []
    statuses = [status for status in Status]
    for status in statuses:
        jobs = db.query(ItemJob).filter(ItemJob.current_status == status).all()
        counts = {"bucket_0_2": 0, "bucket_3_7": 0, "bucket_8_15": 0, "bucket_16_30": 0, "bucket_30_plus": 0}
        for job in jobs:
            base = job.last_scan_at or job.created_at
            age_days = (now - base).days if base else 0
            if age_days <= 2:
                counts["bucket_0_2"] += 1
            elif age_days <= 7:
                counts["bucket_3_7"] += 1
            elif age_days <= 15:
                counts["bucket_8_15"] += 1
            elif age_days <= 30:
                counts["bucket_16_30"] += 1
            else:
                counts["bucket_30_plus"] += 1
        buckets.append(AgingBucket(status=status, **counts))
    return buckets


@router.get("/turnaround", response_model=List[TurnaroundMetrics])
def turnaround(db: Session = Depends(get_db), user=Depends(require_roles(Role.ADMIN))):
    stages = [
        ("Purchase->Packed", Status.PURCHASED, Status.PACKED_READY),
        ("Packed->Dispatch", Status.PACKED_READY, Status.DISPATCHED_TO_FACTORY),
        ("Dispatch->FactoryReceive", Status.DISPATCHED_TO_FACTORY, Status.RECEIVED_AT_FACTORY),
        ("FactoryReceive->Return", Status.RECEIVED_AT_FACTORY, Status.RETURNED_FROM_FACTORY),
        ("Return->ShopReceive", Status.RETURNED_FROM_FACTORY, Status.RECEIVED_AT_SHOP),
        ("ShopReceive->Stock/Delivery", Status.RECEIVED_AT_SHOP, None),
        ("Delivery->Delivered", Status.HANDED_TO_DELIVERY, Status.DELIVERED_TO_CUSTOMER),
    ]
    results: List[TurnaroundMetrics] = []
    jobs = db.query(ItemJob).all()
    for label, from_status, to_status in stages:
        durations = []
        for job in jobs:
            events_by_status = {}
            for event in job.status_events:
                events_by_status.setdefault(event.to_status, []).append(event)
            if from_status not in events_by_status:
                continue
            start = min(events_by_status[from_status], key=lambda e: e.timestamp).timestamp
            if to_status:
                if to_status not in events_by_status:
                    continue
                end = min(events_by_status[to_status], key=lambda e: e.timestamp).timestamp
                durations.append((end - start).days)
            else:
                candidates = [Status.ADDED_TO_STOCK, Status.HANDED_TO_DELIVERY]
                timestamps = [
                    min(events_by_status[c], key=lambda e: e.timestamp).timestamp
                    for c in candidates
                    if c in events_by_status
                ]
                if not timestamps:
                    continue
                durations.append((min(timestamps) - start).days)
        average = sum(durations) / len(durations) if durations else 0
        results.append(TurnaroundMetrics(stage=label, average_days=round(average, 2)))
    return results


@router.get("/batch-delays", response_model=List[BatchDelay])
def batch_delays(db: Session = Depends(get_db), user=Depends(require_roles(Role.ADMIN, Role.DISPATCH))):
    now = datetime.now(timezone.utc)
    batches = db.query(Batch).all()
    delays = []
    for batch in batches:
        delay_days = 0
        if batch.expected_return_date and batch.dispatch_date:
            if now > batch.expected_return_date:
                delay_days = (now - batch.expected_return_date).days
        delays.append(
            BatchDelay(
                batch_code=batch.batch_code,
                expected_return_date=batch.expected_return_date,
                dispatch_date=batch.dispatch_date,
                delay_days=delay_days,
            )
        )
    return delays


@router.get("/user-activity", response_model=List[UserActivity])
def user_activity(db: Session = Depends(get_db), user=Depends(require_roles(Role.ADMIN))):
    rows = (
        db.query(StatusEvent.scanned_by_user_id, User.username, func.count(StatusEvent.id))
        .join(User, User.id == StatusEvent.scanned_by_user_id)
        .group_by(StatusEvent.scanned_by_user_id, User.username)
        .all()
    )
    return [UserActivity(user_id=row[0], username=row[1], scans=row[2]) for row in rows]


@router.get("/export.csv")
def export_csv(type: str = Query(...), db: Session = Depends(get_db), user=Depends(require_roles(Role.ADMIN))):
    output = StringIO()
    writer = csv.writer(output)

    if type == "jobs":
        writer.writerow(["job_id", "status", "holder_role", "created_at", "phone"])
        for job in db.query(ItemJob).all():
            writer.writerow([job.job_id, job.current_status, job.current_holder_role, job.created_at, job.customer_phone])
    elif type == "incidents":
        writer.writerow(["id", "type", "status", "created_at", "description"])
        for inc in db.query(Incident).all():
            writer.writerow([inc.id, inc.type, inc.status, inc.created_at, inc.description])
    elif type == "batches":
        writer.writerow(["batch_code", "status", "dispatch_date", "expected_return_date", "item_count"])
        for batch in db.query(Batch).all():
            writer.writerow([batch.batch_code, batch.status, batch.dispatch_date, batch.expected_return_date, batch.item_count])
    else:
        raise HTTPException(status_code=400, detail="Unsupported export type")

    output.seek(0)
    return StreamingResponse(iter([output.getvalue()]), media_type="text/csv")
