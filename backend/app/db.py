from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker
from app.core.config import settings

connect_args = (
    {"check_same_thread": False} if settings.database_url.startswith("sqlite") else {}
)
engine = create_engine(settings.database_url, connect_args=connect_args, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ---------------------------------------------------------------------------
# Supabase client — only initialised when SUPABASE_URL is configured.
# supabase_client is None in demo mode (is_demo_mode == True).
# ---------------------------------------------------------------------------
supabase_client = None

if settings.supabase_url:
    try:
        from supabase import create_client  # type: ignore

        supabase_client = create_client(
            settings.supabase_url,
            settings.supabase_publishable_key,
        )
    except Exception as _exc:  # pragma: no cover
        import logging

        logging.getLogger(__name__).warning(
            "Failed to initialise Supabase client: %s", _exc
        )
