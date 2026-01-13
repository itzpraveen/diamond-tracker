import os

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.config import get_settings
from app.models import Role, User
from app.utils.security import hash_password

settings = get_settings()

engine = create_engine(settings.database_url)
SessionLocal = sessionmaker(bind=engine)


def main() -> None:
    db = SessionLocal()
    try:
        username = settings.admin_username
        password = settings.admin_password
        existing = db.query(User).filter(User.username == username).first()
        if existing:
            print("Admin user already exists")
            return
        admin_user = User(
            username=username,
            password_hash=hash_password(password),
            role=Role.ADMIN,
            is_active=True,
        )
        db.add(admin_user)
        db.commit()
        print("Admin user created")
    finally:
        db.close()


if __name__ == "__main__":
    main()
