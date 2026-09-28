import os
import sys

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

load_dotenv()
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

# ── Neon (PostgreSQL) only ───────────────────────────────────────────────────
# This service talks to Neon cloud Postgres. There is deliberately NO local
# SQLite fallback: silently writing to a local file would drop every worker's
# collection record and serve stale data, so we fail fast instead.
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    sys.exit(
        "[FATAL] DATABASE_URL is not set.\n"
        "         Set it to your Neon connection string, e.g.\n"
        "         DATABASE_URL=postgresql://USER:PASSWORD@ep-xxx.region.aws.neon.tech/neondb?sslmode=require"
    )

# Neon/Render sometimes hand back the legacy scheme.
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

if DATABASE_URL.startswith("sqlite"):
    sys.exit(
        "[FATAL] DATABASE_URL points at SQLite. This deployment is Neon-only.\n"
        "         Use a postgresql:// Neon connection string instead."
    )

SQLALCHEMY_DATABASE_URL = DATABASE_URL

try:
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL,
        pool_pre_ping=True,
        pool_size=5,
        max_overflow=10,
        pool_recycle=300,
    )
    with engine.connect() as conn:
        conn.exec_driver_sql("SELECT 1")
except ModuleNotFoundError as exc:
    # Almost always a missing PostgreSQL driver, not a bad Neon URL.
    name = exc.name or "psycopg2"
    driver_pkg = "psycopg[binary]" if name == "psycopg" else "psycopg2-binary"
    sys.exit(
        f"[FATAL] PostgreSQL driver '{name}' is not installed ({exc}).\n"
        f"         Add it to backend_fastapi/requirements.txt:  {driver_pkg}\n"
        "         Then redeploy."
    )
except Exception as exc:
    sys.exit(
        f"[FATAL] Could not connect to Neon PostgreSQL: {exc}\n"
        "         Check DATABASE_URL (host, credentials, sslmode=require) and redeploy."
    )

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
