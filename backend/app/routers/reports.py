import csv
from datetime import datetime, timedelta, timezone
from io import BytesIO, StringIO
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy import case, func
from sqlalchemy.orm import Session, selectinload

from app.db import get_db
from app.deps import require_roles
from app.models import Batch, Factory, Incident, ItemJob, Role, Status, StatusEvent, User
from app.schemas import (
    AgingBucket,
    BatchDelay,
    ExcelExportRequest,
    FactorySummary,
    JobOut,
    RepairTrackingReport,
    TurnaroundMetrics,
    UserActivity,
)

router = APIRouter(prefix="/reports", tags=["reports"])


def _stream_csv_rows(header: list[str], rows, row_builder):
    output = StringIO()
    writer = csv.writer(output)
    writer.writerow(header)
    yield output.getvalue()
    output.seek(0)
    output.truncate(0)
    for row in rows:
        writer.writerow(row_builder(row))
        yield output.getvalue()
        output.seek(0)
        output.truncate(0)


@router.get("/pending-aging", response_model=List[AgingBucket])
def pending_aging(db: Session = Depends(get_db), user=Depends(require_roles(Role.ADMIN, Role.DISPATCH, Role.QC_STOCK))):
    base_time = func.coalesce(ItemJob.last_scan_at, ItemJob.created_at)
    age_days = func.date_part("day", func.now() - base_time)
    bucket_0_2 = func.sum(case((age_days <= 2, 1), else_=0)).label("bucket_0_2")
    bucket_3_7 = func.sum(case((age_days.between(3, 7), 1), else_=0)).label("bucket_3_7")
    bucket_8_15 = func.sum(case((age_days.between(8, 15), 1), else_=0)).label("bucket_8_15")
    bucket_16_30 = func.sum(case((age_days.between(16, 30), 1), else_=0)).label("bucket_16_30")
    bucket_30_plus = func.sum(case((age_days > 30, 1), else_=0)).label("bucket_30_plus")

    rows = (
        db.query(ItemJob.current_status.label("status"), bucket_0_2, bucket_3_7, bucket_8_15, bucket_16_30, bucket_30_plus)
        .group_by(ItemJob.current_status)
        .all()
    )
    row_map = {row.status: row for row in rows}
    buckets = []
    for status in Status:
        row = row_map.get(status)
        buckets.append(
            AgingBucket(
                status=status,
                bucket_0_2=int(getattr(row, "bucket_0_2", 0) or 0),
                bucket_3_7=int(getattr(row, "bucket_3_7", 0) or 0),
                bucket_8_15=int(getattr(row, "bucket_8_15", 0) or 0),
                bucket_16_30=int(getattr(row, "bucket_16_30", 0) or 0),
                bucket_30_plus=int(getattr(row, "bucket_30_plus", 0) or 0),
            )
        )
    return buckets


@router.get("/turnaround", response_model=List[TurnaroundMetrics])
def turnaround(
    window_days: int = Query(default=365, ge=1, le=3650),
    db: Session = Depends(get_db),
    user=Depends(require_roles(Role.ADMIN)),
):
    stages = [
        ("Purchase->Packed", Status.PURCHASED, Status.PACKED_READY),
        ("Packed->Dispatch", Status.PACKED_READY, Status.DISPATCHED_TO_FACTORY),
        ("Dispatch->FactoryReceive", Status.DISPATCHED_TO_FACTORY, Status.RECEIVED_AT_FACTORY),
        ("FactoryReceive->Return", Status.RECEIVED_AT_FACTORY, Status.RETURNED_FROM_FACTORY),
        ("Return->ShopReceive", Status.RETURNED_FROM_FACTORY, Status.RECEIVED_AT_SHOP),
        ("ShopReceive->Stock/Delivery", Status.RECEIVED_AT_SHOP, None),
        ("Delivery->Delivered", Status.HANDED_TO_DELIVERY, Status.DELIVERED_TO_CUSTOMER),
    ]
    cutoff = datetime.now(timezone.utc) - timedelta(days=window_days)
    event_rows = (
        db.query(
            StatusEvent.job_id,
            StatusEvent.to_status,
            func.min(StatusEvent.timestamp).label("timestamp"),
        )
        .filter(StatusEvent.timestamp >= cutoff)
        .group_by(StatusEvent.job_id, StatusEvent.to_status)
        .all()
    )
    events_by_job: dict = {}
    for row in event_rows:
        events_by_job.setdefault(row.job_id, {})[row.to_status] = row.timestamp

    durations_by_stage = {label: [] for label, _, _ in stages}
    for statuses in events_by_job.values():
        for label, from_status, to_status in stages:
            start = statuses.get(from_status)
            if not start:
                continue
            if to_status:
                end = statuses.get(to_status)
                if not end:
                    continue
                durations_by_stage[label].append((end - start).days)
            else:
                candidates = [Status.ADDED_TO_STOCK, Status.HANDED_TO_DELIVERY]
                timestamps = [statuses.get(candidate) for candidate in candidates if statuses.get(candidate)]
                if not timestamps:
                    continue
                durations_by_stage[label].append((min(timestamps) - start).days)

    results: List[TurnaroundMetrics] = []
    for label, _, _ in stages:
        durations = durations_by_stage[label]
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


@router.get("/repair-targets", response_model=RepairTrackingReport)
def repair_targets(
    window_days: int = Query(default=3, ge=1, le=30),
    db: Session = Depends(get_db),
    user=Depends(require_roles(Role.ADMIN, Role.DISPATCH, Role.QC_STOCK)),
):
    now = datetime.now(timezone.utc)
    window_end = now + timedelta(days=window_days)
    base_query = db.query(ItemJob).filter(
        ItemJob.target_return_date.isnot(None),
        ItemJob.current_status != Status.CANCELLED,
    )

    not_returned_statuses = [
        Status.PURCHASED,
        Status.PACKED_READY,
        Status.DISPATCHED_TO_FACTORY,
        Status.RECEIVED_AT_FACTORY,
        Status.RETURNED_FROM_FACTORY,
        Status.ON_HOLD,
    ]
    overdue = (
        base_query.filter(
            ItemJob.target_return_date < now,
            ItemJob.current_status.in_(not_returned_statuses),
        )
        .order_by(ItemJob.target_return_date)
        .limit(200)
        .all()
    )
    approaching = (
        base_query.filter(
            ItemJob.target_return_date >= now,
            ItemJob.target_return_date <= window_end,
            ItemJob.current_status.in_(not_returned_statuses),
        )
        .order_by(ItemJob.target_return_date)
        .limit(200)
        .all()
    )

    uncollected_statuses = [
        Status.RECEIVED_AT_SHOP,
        Status.ADDED_TO_STOCK,
        Status.HANDED_TO_DELIVERY,
    ]
    uncollected = (
        base_query.filter(
            ItemJob.target_return_date < now,
            ItemJob.current_status.in_(uncollected_statuses),
        )
        .order_by(ItemJob.target_return_date)
        .limit(200)
        .all()
    )

    return RepairTrackingReport(
        overdue=[JobOut.model_validate(job) for job in overdue],
        approaching=[JobOut.model_validate(job) for job in approaching],
        uncollected=[JobOut.model_validate(job) for job in uncollected],
    )


@router.get("/user-activity", response_model=List[UserActivity])
def user_activity(db: Session = Depends(get_db), user=Depends(require_roles(Role.ADMIN))):
    rows = (
        db.query(StatusEvent.scanned_by_user_id, User.username, func.count(StatusEvent.id))
        .join(User, User.id == StatusEvent.scanned_by_user_id)
        .group_by(StatusEvent.scanned_by_user_id, User.username)
        .all()
    )
    return [UserActivity(user_id=row[0], username=row[1], scans=row[2]) for row in rows]


@router.post("/export.xlsx")
def export_xlsx(
    payload: ExcelExportRequest,
    db: Session = Depends(get_db),
    user=Depends(require_roles(Role.ADMIN, Role.PURCHASE, Role.DISPATCH)),
):
    from openpyxl import Workbook

    if not payload.job_ids:
        raise HTTPException(status_code=400, detail="job_ids is required")
    jobs = (
        db.query(ItemJob)
        .options(selectinload(ItemJob.factory))
        .filter(ItemJob.job_id.in_(payload.job_ids))
        .all()
    )
    if not jobs:
        raise HTTPException(status_code=404, detail="No matching jobs found")

    wb = Workbook()
    ws = wb.active
    ws.title = "Items"
    columns = [
        "Job ID", "Voucher No", "Customer Name", "Phone", "Item Description",
        "Style Number", "Card Weight", "Physical Weight", "Diamond Cent",
        "Purchase Value", "Factory", "Status", "Work Narration", "Item Source",
        "Repair Type", "Target Return Date", "Created At",
    ]
    ws.append(columns)
    for job in jobs:
        ws.append([
            job.job_id,
            job.voucher_no,
            job.customer_name,
            job.customer_phone,
            job.item_description,
            job.style_number,
            job.card_weight,
            job.approximate_weight,
            job.diamond_cent,
            job.purchase_value,
            job.factory.name if job.factory else None,
            job.current_status.value if job.current_status else None,
            job.work_narration,
            job.item_source.value if job.item_source else None,
            job.repair_type.value if job.repair_type else None,
            job.target_return_date.isoformat() if job.target_return_date else None,
            job.created_at.isoformat() if job.created_at else None,
        ])

    buf = BytesIO()
    wb.save(buf)
    buf.seek(0)
    headers = {"Content-Disposition": 'attachment; filename="items-export.xlsx"'}
    return StreamingResponse(
        buf,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers=headers,
    )


@router.get("/factory-summary", response_model=List[FactorySummary])
def factory_summary(
    db: Session = Depends(get_db),
    user=Depends(require_roles(Role.ADMIN, Role.DISPATCH, Role.FACTORY)),
):
    at_factory_statuses = [Status.DISPATCHED_TO_FACTORY, Status.RECEIVED_AT_FACTORY]
    expected_statuses = [Status.RECEIVED_AT_FACTORY]
    returned_statuses = [Status.RETURNED_FROM_FACTORY]
    dispatched_statuses = [
        Status.DISPATCHED_TO_FACTORY,
        Status.RECEIVED_AT_FACTORY,
        Status.RETURNED_FROM_FACTORY,
        Status.RECEIVED_AT_SHOP,
        Status.ADDED_TO_STOCK,
        Status.HANDED_TO_DELIVERY,
        Status.DELIVERED_TO_CUSTOMER,
    ]

    rows = (
        db.query(
            Factory.id.label("factory_id"),
            Factory.name.label("factory_name"),
            func.sum(case((ItemJob.current_status.in_(at_factory_statuses), 1), else_=0)).label("at_factory"),
            func.sum(case((ItemJob.current_status.in_(expected_statuses), 1), else_=0)).label("expected_from_factory"),
            func.sum(case((ItemJob.current_status.in_(returned_statuses), 1), else_=0)).label("returned_pending"),
            func.sum(case((ItemJob.current_status.in_(dispatched_statuses), 1), else_=0)).label("total_dispatched"),
        )
        .join(ItemJob, ItemJob.factory_id == Factory.id)
        .group_by(Factory.id, Factory.name)
        .all()
    )

    return [
        FactorySummary(
            factory_id=row.factory_id,
            factory_name=row.factory_name,
            at_factory=int(row.at_factory or 0),
            expected_from_factory=int(row.expected_from_factory or 0),
            returned_pending=int(row.returned_pending or 0),
            total_dispatched=int(row.total_dispatched or 0),
        )
        for row in rows
    ]


@router.get("/export.csv")
def export_csv(type: str = Query(...), db: Session = Depends(get_db), user=Depends(require_roles(Role.ADMIN))):
    export_type = type.lower()
    filename = "vouchers.csv" if export_type == "vouchers" else f"{export_type}.csv"
    headers = {"Content-Disposition": f'attachment; filename="{filename}"'}

    if export_type == "jobs":
        rows = db.query(ItemJob).execution_options(stream_results=True).yield_per(1000)
        generator = _stream_csv_rows(
            [
                "job_id",
                "status",
                "holder_role",
                "created_at",
                "phone",
                "repair_type",
                "target_return_date",
                "factory",
                "work_narration",
                "item_source",
            ],
            rows,
            lambda job: [
                job.job_id,
                job.current_status,
                job.current_holder_role,
                job.created_at,
                job.customer_phone,
                job.repair_type,
                job.target_return_date,
                job.factory_name,
                job.work_narration,
                job.item_source,
            ],
        )
    elif export_type == "incidents":
        rows = db.query(Incident).execution_options(stream_results=True).yield_per(1000)
        generator = _stream_csv_rows(
            ["id", "type", "status", "created_at", "description"],
            rows,
            lambda inc: [inc.id, inc.type, inc.status, inc.created_at, inc.description],
        )
    elif export_type in {"batches", "vouchers"}:
        rows = db.query(Batch).execution_options(stream_results=True).yield_per(1000)
        generator = _stream_csv_rows(
            ["batch_code", "status", "dispatch_date", "expected_return_date", "item_count"],
            rows,
            lambda batch: [batch.batch_code, batch.status, batch.dispatch_date, batch.expected_return_date, batch.item_count],
        )
    else:
        raise HTTPException(status_code=400, detail="Unsupported export type")

    return StreamingResponse(generator, media_type="text/csv", headers=headers)
