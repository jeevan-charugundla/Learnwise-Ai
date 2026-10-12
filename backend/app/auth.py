"""
Authentication helpers for LearnWise AI.

Demo mode (is_demo_mode == True):
    get_current_user  -> always returns 'demo-user-001', no token required.
    optional_user     -> always returns 'demo-user-001'.

Production mode (SUPABASE_URL is set):
    get_current_user  -> validates Bearer token via supabase.auth.get_user(token).
    optional_user     -> returns user_id if a valid token is present, else None.
"""

from fastapi import Header, HTTPException
from app.core.config import settings


def _resolve_token(authorization: str | None) -> str:
    """
    Given a raw Authorization header value, return the user_id string.
    Raises HTTPException(401) on any auth failure.
    """
    if settings.is_demo_mode:
        return "demo-user-001"

    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail="Missing or invalid Authorization header",
        )

    token = authorization.split(" ", 1)[1]

    # Import here to avoid circular imports and to allow demo mode with no
    # supabase package installed.
    from app.db import supabase_client  # noqa: PLC0415

    if supabase_client is None:
        raise HTTPException(
            status_code=500,
            detail="Supabase client not initialised; check SUPABASE_URL configuration.",
        )

    try:
        response = supabase_client.auth.get_user(token)
        user_id: str = response.user.id
        return user_id
    except Exception:
        raise HTTPException(status_code=401, detail="Token invalid or expired")


async def get_current_user(authorization: str | None = Header(None)) -> str:
    """
    FastAPI dependency that returns the authenticated user_id.
    Raises 401 when not authenticated (in production mode).
    """
    return _resolve_token(authorization)


async def optional_user(authorization: str | None = Header(None)) -> str | None:
    """
    FastAPI dependency that returns the user_id if authenticated, else None.
    Never raises — suitable for endpoints where auth is optional.
    """
    if settings.is_demo_mode:
        return "demo-user-001"

    if not authorization or not authorization.startswith("Bearer "):
        return None

    try:
        return _resolve_token(authorization)
    except HTTPException:
        return None
