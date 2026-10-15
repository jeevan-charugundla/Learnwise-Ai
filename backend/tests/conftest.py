"""
Pytest configuration: force demo mode and use an in-memory SQLite DB
for all tests, regardless of the local .env file.
"""

import os
import pytest

# Override env vars BEFORE the app (and pydantic-settings) loads them.
# This must happen before any app import in test files.
os.environ.setdefault("SUPABASE_URL", "")
os.environ["SUPABASE_URL"] = ""
os.environ["SUPABASE_PUBLISHABLE_KEY"] = ""
os.environ["SUPABASE_SERVICE_ROLE_KEY"] = ""
os.environ["DATABASE_URL"] = "sqlite:///:memory:"
os.environ["GROQ_API_KEY"] = ""
os.environ["GROQ_MODEL"] = ""

# Re-build settings with overridden env now that vars are set.
from app.core.config import settings  # noqa: E402

settings.supabase_url = ""
settings.supabase_publishable_key = ""
settings.database_url = "sqlite:///:memory:"
settings.groq_api_key = ""
settings.groq_model = ""

# Recreate the DB engine so it points at :memory:
from app import db as _db  # noqa: E402
from sqlalchemy import create_engine  # noqa: E402
from sqlalchemy.orm import sessionmaker  # noqa: E402

_db.engine = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
)
_db.SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=_db.engine)
_db.Base.metadata.create_all(bind=_db.engine)
