from types import SimpleNamespace

import pytest
from fastapi import HTTPException
from jose import jwt

from app.config import get_settings
from app.deps import extract_access_token
from app.routers.auth import _request_is_secure
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


def test_extract_access_token_prefers_bearer_header():
    request = SimpleNamespace(cookies={get_settings().auth_access_cookie_name: "cookie-token"})
    credentials = SimpleNamespace(scheme="Bearer", credentials="header-token")
    assert extract_access_token(request, credentials) == "header-token"


def test_extract_access_token_falls_back_to_cookie():
    request = SimpleNamespace(cookies={get_settings().auth_access_cookie_name: "cookie-token"})
    assert extract_access_token(request, None) == "cookie-token"


def test_extract_access_token_requires_authentication():
    request = SimpleNamespace(cookies={})
    with pytest.raises(HTTPException) as exc:
        extract_access_token(request, None)
    assert exc.value.status_code == 401


def test_request_is_secure_prefers_forwarded_proto():
    request = SimpleNamespace(
        headers={"x-forwarded-proto": "https"},
        url=SimpleNamespace(scheme="http"),
    )
    assert _request_is_secure(request) is True
