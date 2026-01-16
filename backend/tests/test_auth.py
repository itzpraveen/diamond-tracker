from jose import jwt

from app.config import get_settings
from app.utils.security import create_access_token, create_refresh_token, new_jti


def test_access_token_payload():
    settings = get_settings()
    token = create_access_token(subject="user123", roles=["Admin"], expires_minutes=5)
    payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
    assert payload["sub"] == "user123"
    assert payload["role"] == "Admin"
    assert payload["roles"] == ["Admin"]
    assert payload["type"] == "access"


def test_refresh_token_payload():
    settings = get_settings()
    jti = new_jti()
    token = create_refresh_token(subject="user123", jti=jti, expires_days=1)
    payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
    assert payload["sub"] == "user123"
    assert payload["jti"] == jti
    assert payload["type"] == "refresh"
