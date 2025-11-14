'''import os
import time
import requests
from typing import Dict, Any, Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from jose import jwt

from .database import SessionLocal
from . import models


# -----------------------------
# ENVIRONMENT
# -----------------------------
SUPABASE_URL = (
    os.environ.get("SUPABASE_URL")
    or os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
)

if not SUPABASE_URL:
    raise RuntimeError("SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL not set")

SUPABASE_URL = SUPABASE_URL.rstrip("/")

# Correct JWKS endpoints
JWKS_CANDIDATES = [
    f"{SUPABASE_URL}/auth/v1/.well-known/jwks.json",   # Supabase standard
    f"{SUPABASE_URL}/.well-known/jwks.json",           # fallback
]

# -----------------------------
# JWKs CACHE
# -----------------------------
_jwks_cache = {"keys": None, "fetched_at": 0, "ttl": 3600}


def _fetch_jwks():
    """
    Fetch JWKS with fallback and caching.
    Tries /auth/v1/.well-known/jwks.json first.
    """
    now = time.time()

    # return cached version
    if _jwks_cache["keys"] and (now - _jwks_cache["fetched_at"] < _jwks_cache["ttl"]):
        return _jwks_cache["keys"]

    last_exc = None

    for url in JWKS_CANDIDATES:
        try:
            r = requests.get(url, timeout=5)
            r.raise_for_status()
            data = r.json()

            if "keys" in data:
                _jwks_cache["keys"] = data["keys"]
                _jwks_cache["fetched_at"] = now
                return _jwks_cache["keys"]

            last_exc = RuntimeError(f"No 'keys' in JWKS at {url}")

        except Exception as e:
            last_exc = e
            continue

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail=f"Failed to fetch JWKS: {last_exc}"
    )


# -----------------------------
# TOKEN VERIFICATION
# -----------------------------
bearer_scheme = HTTPBearer(auto_error=False)


def verify_supabase_token(token: str) -> Dict[str, Any]:
    """
    Decode a Supabase JWT using JWKS.
    """
    header = jwt.get_unverified_header(token)
    kid = header.get("kid")

    jwks = _fetch_jwks()

    key = next((k for k in jwks if k.get("kid") == kid), None)
    if not key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token: JWK with matching kid not found"
        )

    public_key = jwt.construct_rsa_key(key)

    try:
        payload = jwt.decode(
            token,
            public_key,
            algorithms=[key.get("alg", "RS256")],
            issuer=SUPABASE_URL,
            options={"verify_aud": False},
        )
        return payload
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Token verification error: {e}"
        )


# -----------------------------
# DB USER MAPPING
# -----------------------------
def _map_supabase_to_local_user(payload: Dict[str, Any]) -> Dict[str, Any]:
    """
    Maps a Supabase JWT payload to a local user record (auto-creates if needed).
    Returns a plain dict and NOT an SQLAlchemy model.
    """
    sub = payload.get("sub")
    email = payload.get("email")

    username = (
        payload.get("user_name")
        or payload.get("preferred_username")
        or (email.split("@")[0] if email else None)
        or f"sb_{sub[:6]}"
    )

    db: Session = SessionLocal()
    try:
        user = db.query(models.User).filter(models.User.external_id == sub).first()

        if not user:
            user = models.User(
                username=username,
                email=email or f"{sub}@supabase.local",
                external_id=sub,
                is_active=True,
            )
            db.add(user)
            db.commit()
            db.refresh(user)

        return {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "external_id": user.external_id,
        }

    finally:
        db.close()


# -----------------------------
# FASTAPI DEPENDENCIES
# -----------------------------
def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
) -> Dict[str, Any]:
    """
    Strict auth: token required.
    """
    if credentials is None:
        raise HTTPException(status_code=401, detail="Not authenticated")

    token = credentials.credentials
    payload = verify_supabase_token(token)

    return _map_supabase_to_local_user(payload)


def get_current_user_optional(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
) -> Optional[Dict[str, Any]]:
    """
    Optional auth: token optional.
    """
    if credentials is None:
        return None

    token = credentials.credentials
    payload = verify_supabase_token(token)

    return _map_supabase_to_local_user(payload)
'''