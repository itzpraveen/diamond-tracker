import enum
import uuid
from datetime import datetime

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Column,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import ARRAY, JSONB, UUID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
from sqlalchemy.sql import func


class Base(DeclarativeBase):
    pass


class Role(str, enum.Enum):
    ADMIN = "Admin"
    PURCHASE = "Purchase"
    PACKING = "Packing"
    DISPATCH = "Dispatch"
    FACTORY = "Factory"
    QC_STOCK = "QC_Stock"
    DELIVERY = "Delivery"


class Status(str, enum.Enum):
    PURCHASED = "PURCHASED"
    PACKED_READY = "PACKED_READY"
    DISPATCHED_TO_FACTORY = "DISPATCHED_TO_FACTORY"
    RECEIVED_AT_FACTORY = "RECEIVED_AT_FACTORY"
    RETURNED_FROM_FACTORY = "RETURNED_FROM_FACTORY"
    RECEIVED_AT_SHOP = "RECEIVED_AT_SHOP"
    ADDED_TO_STOCK = "ADDED_TO_STOCK"
    HANDED_TO_DELIVERY = "HANDED_TO_DELIVERY"
    DELIVERED_TO_CUSTOMER = "DELIVERED_TO_CUSTOMER"
    ON_HOLD = "ON_HOLD"
    CANCELLED = "CANCELLED"


class ItemSource(str, enum.Enum):
    STOCK = "Stock"
    REPAIR = "Repair"


class RepairType(str, enum.Enum):
    CUSTOMER_REPAIR = "Customer Repair"
    STOCK_REPAIR = "Stock Repair"


class BatchStatus(str, enum.Enum):
    CREATED = "CREATED"
    DISPATCHED = "DISPATCHED"
    RECEIVED_AT_FACTORY = "RECEIVED_AT_FACTORY"
    RETURNED = "RETURNED"
    CLOSED = "CLOSED"


class IncidentType(str, enum.Enum):
    StickerMismatch = "StickerMismatch"
    MissingItem = "MissingItem"
    DuplicateScan = "DuplicateScan"
    Damage = "Damage"
    Other = "Other"


class IncidentStatus(str, enum.Enum):
    OPEN = "OPEN"
    RESOLVED = "RESOLVED"


ROLE_ENUM = Enum(Role, name="role", values_callable=lambda obj: [e.value for e in obj])
STATUS_ENUM = Enum(Status, name="status", values_callable=lambda obj: [e.value for e in obj])
ITEM_SOURCE_ENUM = Enum(ItemSource, name="item_source", values_callable=lambda obj: [e.value for e in obj])
REPAIR_TYPE_ENUM = Enum(RepairType, name="repair_type", values_callable=lambda obj: [e.value for e in obj])
BATCH_STATUS_ENUM = Enum(
    BatchStatus, name="batch_status", values_callable=lambda obj: [e.value for e in obj]
)
INCIDENT_TYPE_ENUM = Enum(
    IncidentType, name="incident_type", values_callable=lambda obj: [e.value for e in obj]
)
INCIDENT_STATUS_ENUM = Enum(
    IncidentStatus, name="incident_status", values_callable=lambda obj: [e.value for e in obj]
)


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    username: Mapped[str] = mapped_column(String(80), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    roles: Mapped[list[Role]] = mapped_column(ARRAY(ROLE_ENUM), default=list, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    jobs = relationship("ItemJob", back_populates="current_holder")


class Branch(Base):
    __tablename__ = "branches"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(120), unique=True)

    jobs = relationship("ItemJob", back_populates="branch")


class Factory(Base):
    __tablename__ = "factories"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(120), unique=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    batches = relationship("Batch", back_populates="factory")
    jobs = relationship("ItemJob", back_populates="factory")


class ItemJob(Base):
    __tablename__ = "item_jobs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    job_id: Mapped[str] = mapped_column(String(32), unique=True, index=True)
    branch_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("branches.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    customer_name: Mapped[str | None] = mapped_column(String(120), nullable=True)
    customer_phone: Mapped[str | None] = mapped_column(String(40), nullable=True)
    item_description: Mapped[str] = mapped_column(Text)
    approximate_weight: Mapped[float | None] = mapped_column(Float, nullable=True)
    purchase_value: Mapped[float | None] = mapped_column(Float, nullable=True)
    voucher_no: Mapped[str | None] = mapped_column(String(80), nullable=True)
    item_source: Mapped[ItemSource | None] = mapped_column(ITEM_SOURCE_ENUM, nullable=True)
    repair_type: Mapped[RepairType | None] = mapped_column(REPAIR_TYPE_ENUM, nullable=True)
    work_narration: Mapped[str | None] = mapped_column(Text, nullable=True)
    target_return_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    factory_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("factories.id"), nullable=True)
    diamond_cent: Mapped[float | None] = mapped_column(Float, nullable=True)
    photos: Mapped[list | None] = mapped_column(JSONB, default=list)
    current_status: Mapped[Status] = mapped_column(STATUS_ENUM)
    current_holder_role: Mapped[Role] = mapped_column(ROLE_ENUM)
    current_holder_user_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    last_scan_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    branch = relationship("Branch", back_populates="jobs")
    current_holder = relationship("User", back_populates="jobs")
    factory = relationship("Factory", back_populates="jobs")
    status_events = relationship("StatusEvent", back_populates="job", order_by="StatusEvent.timestamp")
    batch_items = relationship("BatchItem", back_populates="job")

    @property
    def factory_name(self) -> str | None:
        if not self.factory:
            return None
        return self.factory.name


class StatusEvent(Base):
    __tablename__ = "status_events"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    job_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("item_jobs.id"))
    from_status: Mapped[Status | None] = mapped_column(STATUS_ENUM, nullable=True)
    to_status: Mapped[Status] = mapped_column(STATUS_ENUM)
    scanned_by_user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))
    scanned_by_role: Mapped[Role] = mapped_column(ROLE_ENUM)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    location: Mapped[str | None] = mapped_column(String(120), nullable=True)
    device_id: Mapped[str | None] = mapped_column(String(120), nullable=True)
    remarks: Mapped[str | None] = mapped_column(Text, nullable=True)
    incident_flag: Mapped[bool] = mapped_column(Boolean, default=False)
    override_reason: Mapped[str | None] = mapped_column(Text, nullable=True)

    job = relationship("ItemJob", back_populates="status_events")


class Batch(Base):
    __tablename__ = "batches"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    batch_code: Mapped[str] = mapped_column(String(32), unique=True, index=True)
    branch_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("branches.id"))
    created_by: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))
    factory_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("factories.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    dispatch_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    expected_return_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    status: Mapped[BatchStatus] = mapped_column(BATCH_STATUS_ENUM, default=BatchStatus.CREATED)
    item_count: Mapped[int] = mapped_column(Integer, default=0)
    manifest_pdf_url: Mapped[str | None] = mapped_column(String(255), nullable=True)

    items = relationship("BatchItem", back_populates="batch")
    factory = relationship("Factory", back_populates="batches")

    @property
    def factory_name(self) -> str | None:
        if not self.factory:
            return None
        return self.factory.name


class BatchItem(Base):
    __tablename__ = "batch_items"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    batch_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("batches.id"))
    job_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("item_jobs.id"))
    added_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    batch = relationship("Batch", back_populates="items")
    job = relationship("ItemJob", back_populates="batch_items")

    __table_args__ = (UniqueConstraint("batch_id", "job_id", name="uq_batch_item"),)


class Incident(Base):
    __tablename__ = "incidents"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    job_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("item_jobs.id"), nullable=True)
    batch_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("batches.id"), nullable=True)
    type: Mapped[IncidentType] = mapped_column(INCIDENT_TYPE_ENUM)
    description: Mapped[str] = mapped_column(Text)
    reported_by: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    resolution_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    attachments: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    status: Mapped[IncidentStatus] = mapped_column(INCIDENT_STATUS_ENUM, default=IncidentStatus.OPEN)


class RefreshToken(Base):
    __tablename__ = "refresh_tokens"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    jti: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    revoked: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class JobEditAudit(Base):
    __tablename__ = "job_edit_audits"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    job_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("item_jobs.id"))
    edited_by_user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))
    edited_by_role: Mapped[Role] = mapped_column(ROLE_ENUM)
    edited_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    reason: Mapped[str] = mapped_column(Text)
    changes: Mapped[dict] = mapped_column(JSONB)
