from datetime import datetime
from typing import Any, List, Optional
from uuid import UUID

from pydantic import BaseModel, Field, model_validator

from app.models import BatchStatus, IncidentStatus, IncidentType, ItemSource, Role, Status


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class LoginRequest(BaseModel):
    username: str
    password: str


class RefreshRequest(BaseModel):
    refresh_token: str


class UserCreate(BaseModel):
    username: str
    password: str
    roles: List[Role] = Field(default_factory=list)
    role: Optional[Role] = None

    @model_validator(mode="after")
    def ensure_roles(self) -> "UserCreate":
        if not self.roles and self.role:
            self.roles = [self.role]
        if not self.roles:
            raise ValueError("At least one role is required")
        return self


class UserOut(BaseModel):
    id: UUID
    username: str
    roles: List[Role]
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class UserUpdate(BaseModel):
    password: Optional[str] = None
    roles: Optional[List[Role]] = None
    role: Optional[Role] = None
    is_active: Optional[bool] = None

    @model_validator(mode="after")
    def ensure_roles(self) -> "UserUpdate":
        if self.roles is None and self.role is not None:
            self.roles = [self.role]
        return self


class PhotoMeta(BaseModel):
    key: str
    url: str
    thumb_url: str


class JobCreate(BaseModel):
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    item_description: str
    approximate_weight: Optional[float] = None
    purchase_value: Optional[float] = None
    item_source: ItemSource
    diamond_cent: Optional[float] = None
    photos: Optional[List[PhotoMeta]] = None
    notes: Optional[str] = None


class JobUpdate(BaseModel):
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    item_description: Optional[str] = None
    approximate_weight: Optional[float] = None
    purchase_value: Optional[float] = None
    item_source: Optional[ItemSource] = None
    diamond_cent: Optional[float] = None
    photos: Optional[List[PhotoMeta]] = None
    notes: Optional[str] = None
    reason: str


class JobOut(BaseModel):
    job_id: str
    branch_id: UUID
    created_at: datetime
    updated_at: datetime
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    item_description: str
    approximate_weight: Optional[float] = None
    purchase_value: Optional[float] = None
    item_source: Optional[ItemSource] = None
    diamond_cent: Optional[float] = None
    photos: Optional[List[PhotoMeta]] = None
    current_status: Status
    current_holder_role: Role
    current_holder_user_id: Optional[UUID] = None
    last_scan_at: Optional[datetime] = None
    notes: Optional[str] = None

    model_config = {"from_attributes": True}


class StatusEventOut(BaseModel):
    id: UUID
    job_id: UUID
    from_status: Optional[Status] = None
    to_status: Status
    scanned_by_user_id: UUID
    scanned_by_username: Optional[str] = None
    scanned_by_role: Role
    timestamp: datetime
    location: Optional[str] = None
    device_id: Optional[str] = None
    remarks: Optional[str] = None
    incident_flag: bool
    override_reason: Optional[str] = None

    model_config = {"from_attributes": True}


class JobDetail(JobOut):
    current_holder_username: Optional[str] = None
    status_events: List[StatusEventOut]


class JobScanRequest(BaseModel):
    to_status: Status
    remarks: Optional[str] = None
    device_id: Optional[str] = None
    location: Optional[str] = None
    batch_id: Optional[UUID] = None
    factory_id: Optional[UUID] = None
    override_reason: Optional[str] = None
    incident_flag: bool = False


class UploadResponse(BaseModel):
    key: str
    url: str
    thumb_url: str


class BatchCreate(BaseModel):
    year: Optional[int] = None
    month: Optional[int] = None
    expected_return_date: Optional[datetime] = None


class BatchOut(BaseModel):
    id: UUID
    batch_code: str
    branch_id: UUID
    created_by: UUID
    factory_id: Optional[UUID] = None
    factory_name: Optional[str] = None
    created_at: datetime
    dispatch_date: Optional[datetime] = None
    expected_return_date: Optional[datetime] = None
    status: BatchStatus
    item_count: int
    manifest_pdf_url: Optional[str] = None

    model_config = {"from_attributes": True}


class BatchDetail(BatchOut):
    items: List[JobOut]


class BatchAddItem(BaseModel):
    job_id: str


class BatchDispatchRequest(BaseModel):
    dispatch_date: Optional[datetime] = None
    expected_return_date: Optional[datetime] = None
    factory_id: Optional[UUID] = None


class IncidentCreate(BaseModel):
    job_id: Optional[str] = None
    batch_id: Optional[UUID] = None
    type: IncidentType
    description: str
    attachments: Optional[List[dict]] = None


class IncidentResolve(BaseModel):
    resolution_notes: str


class IncidentOut(BaseModel):
    id: UUID
    job_id: Optional[UUID] = None
    batch_id: Optional[UUID] = None
    type: IncidentType
    description: str
    reported_by: UUID
    created_at: datetime
    resolved_at: Optional[datetime] = None
    resolution_notes: Optional[str] = None
    attachments: Optional[List[dict]] = None
    status: IncidentStatus

    model_config = {"from_attributes": True}


class AgingBucket(BaseModel):
    status: Status
    bucket_0_2: int
    bucket_3_7: int
    bucket_8_15: int
    bucket_16_30: int
    bucket_30_plus: int


class TurnaroundMetrics(BaseModel):
    stage: str
    average_days: float


class BatchDelay(BaseModel):
    batch_code: str
    expected_return_date: Optional[datetime]
    dispatch_date: Optional[datetime]
    delay_days: float


class UserActivity(BaseModel):
    user_id: UUID
    username: str
    scans: int


class FactoryCreate(BaseModel):
    name: str
    is_active: bool = True


class FactoryUpdate(BaseModel):
    name: Optional[str] = None
    is_active: Optional[bool] = None


class FactoryOut(BaseModel):
    id: UUID
    name: str
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}
