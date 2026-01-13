from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session

from app.config import get_settings
from app.db import SessionLocal
from app.models import Branch, Role, User
from app.routers import audit, auth, batches, incidents, jobs, reports, uploads, users
from app.utils.security import hash_password

settings = get_settings()

app = FastAPI(title="Diamond Buyback Tracking System")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"] ,
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(jobs.router)
app.include_router(uploads.router)
app.include_router(batches.router)
app.include_router(incidents.router)
app.include_router(reports.router)
app.include_router(users.router)
app.include_router(audit.router)

if settings.storage_backend.lower() == "local":
    app.mount("/storage", StaticFiles(directory=settings.local_storage_path), name="storage")


@app.on_event("startup")
def seed_defaults() -> None:
    db: Session = SessionLocal()
    try:
        branch = db.query(Branch).first()
        if not branch:
            db.add(Branch(name="Main Branch"))
            db.commit()

        admin = db.query(User).filter(User.username == settings.admin_username).first()
        if not admin:
            admin_user = User(
                username=settings.admin_username,
                password_hash=hash_password(settings.admin_password),
                role=Role.ADMIN,
                is_active=True,
            )
            db.add(admin_user)
            db.commit()
    finally:
        db.close()


@app.get("/")
def root():
    return {"status": "ok"}
