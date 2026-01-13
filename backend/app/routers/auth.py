import time
from datetime import datetime, timedelta, timezone
from typing import Dict, Tuple

from fastapi import APIRouter, Depends, HTTPException, Request, status
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.config import get_settings
from app.db import get_db
from app.models import RefreshToken, User
from app.schemas import LoginRequest, RefreshRequest, TokenResponse
from app.utils.security import create_access_token, create_refresh_token, new_jti, verify_password

router = APIRouter(prefix="/auth", tags=["auth"])
settings = get_settings()


class LoginLimiter:
    def __init__(self, max_attempts: int = 5, window_seconds: int = 300) -> None:
        self.max_attempts = max_attempts
        self.window_seconds = window_seconds
        self.attempts: Dict[Tuple[str, str], list[float]] = {}

    def check(self, username: str, ip: str) -> None:
        key = (username, ip)
        now = time.time()
        window_start = now - self.window_seconds
        attempts = [t for t in self.attempts.get(key, []) if t >= window_start]
        if len(attempts) >= self.max_attempts:
            raise HTTPException(status_code=429, detail="Too many login attempts")
        attempts.append(now)
        self.attempts[key] = attempts


limiter = LoginLimiter()


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, request: Request, db: Session = Depends(get_db)) -> TokenResponse:
    client_ip = request.client.host if request.client else "unknown"
    limiter.check(payload.username, client_ip)

    user = db.query(User).filter(User.username == payload.username).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User inactive")

    access_token = create_access_token(subject=str(user.id), role=user.role.value)
    jti = new_jti()
    refresh_token = create_refresh_token(subject=str(user.id), jti=jti)

    expires_at = datetime.now(timezone.utc) + timedelta(days=settings.refresh_token_expire_days)
    db.add(RefreshToken(jti=jti, user_id=user.id, expires_at=expires_at))
    db.commit()

    return TokenResponse(access_token=access_token, refresh_token=refresh_token)


@router.post("/refresh", response_model=TokenResponse)
def refresh(payload: RefreshRequest, db: Session = Depends(get_db)) -> TokenResponse:
    try:
        token_payload = jwt.decode(payload.refresh_token, settings.secret_key, algorithms=[settings.algorithm])
        if token_payload.get("type") != "refresh":
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token type")
        user_id = token_payload.get("sub")
        jti = token_payload.get("jti")
    except JWTError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token") from exc

    db_token = db.query(RefreshToken).filter(RefreshToken.jti == jti).first()
    if not db_token or db_token.revoked:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token revoked")
    if db_token.expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token expired")

    user = db.query(User).filter(User.id == db_token.user_id).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid user")

    db_token.revoked = True
    new_refresh_jti = new_jti()
    new_refresh = create_refresh_token(subject=str(user.id), jti=new_refresh_jti)
    expires_at = datetime.now(timezone.utc) + timedelta(days=settings.refresh_token_expire_days)
    db.add(RefreshToken(jti=new_refresh_jti, user_id=user.id, expires_at=expires_at))
    db.commit()

    access_token = create_access_token(subject=str(user.id), role=user.role.value)
    return TokenResponse(access_token=access_token, refresh_token=new_refresh)


@router.post("/logout")
def logout(payload: RefreshRequest, db: Session = Depends(get_db)) -> dict:
    try:
        token_payload = jwt.decode(payload.refresh_token, settings.secret_key, algorithms=[settings.algorithm])
        if token_payload.get("type") != "refresh":
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token type")
        jti = token_payload.get("jti")
    except JWTError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token") from exc

    db_token = db.query(RefreshToken).filter(RefreshToken.jti == jti).first()
    if db_token:
        db_token.revoked = True
        db.commit()
    return {"ok": True}
