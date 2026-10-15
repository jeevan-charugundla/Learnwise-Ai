"""
Diagnostic: connects to the configured DATABASE_URL and lists tables in public schema.
Prints NO secret values — only structural information.
Run from backend/ directory: python check_db.py
"""

import sys
import os

# Load .env manually (no dotenv dependency needed)
env_path = os.path.join(os.path.dirname(__file__), ".env")
if os.path.exists(env_path):
    with open(env_path) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                os.environ.setdefault(k.strip(), v.strip())

database_url = os.environ.get("DATABASE_URL", "")
if not database_url:
    print("ERROR: DATABASE_URL is not set")
    sys.exit(1)

scheme = database_url.split("://")[0] if "://" in database_url else "unknown"
print(f"DATABASE_URL scheme  : {scheme}")
print(f"Is Postgres          : {scheme in ('postgresql', 'postgres')}")

try:
    from sqlalchemy import create_engine, text
    engine = create_engine(database_url, connect_args={} if "postgres" in scheme else {"check_same_thread": False})

    with engine.connect() as conn:
        print("\n--- Connection: OK ---\n")

        # List tables in public schema
        rows = conn.execute(text(
            "SELECT table_name FROM information_schema.tables "
            "WHERE table_schema = 'public' ORDER BY table_name"
        )).fetchall()

        if rows:
            print(f"Tables found in public schema ({len(rows)}):")
            for r in rows:
                print(f"  - {r[0]}")
        else:
            print("No tables found in public schema.")

        # Also check if schema_migrations / supabase_migrations table exists
        mig_rows = conn.execute(text(
            "SELECT table_name FROM information_schema.tables "
            "WHERE table_schema IN ('public', 'supabase_migrations') "
            "AND table_name LIKE '%migrat%'"
        )).fetchall()
        if mig_rows:
            print("\nMigration tracking tables:")
            for r in mig_rows:
                print(f"  - {r[0]}")

except Exception as e:
    print(f"\nERROR connecting to database: {type(e).__name__}: {e}")
    sys.exit(1)
