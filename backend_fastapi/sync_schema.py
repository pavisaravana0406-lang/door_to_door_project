"""
Keep the Neon schema in sync with the SQLAlchemy models.

`Base.metadata.create_all()` only CREATEs tables — it never ALTERs an existing
table, so a column added to a model later is silently missing in the database.
That surfaced as a 500 on worker login:

    UndefinedColumn: column swms_workers.updated_at does not exist

This script adds any missing columns (idempotent, non-destructive) and is
safe to run on every deploy.
"""
import os
import sys

import psycopg2
from dotenv import load_dotenv

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

load_dotenv()
load_dotenv(os.path.join(HERE, ".env"))

from database import Base  # noqa: E402
import models  # noqa: E402,F401

# SQLAlchemy type -> PostgreSQL type
PY2PG = {
    "INTEGER": "INTEGER",
    "SMALLINTEGER": "SMALLINTEGER",
    "BIGINT": "BIGINT",
    "VARCHAR": "VARCHAR(255)",
    "TEXT": "TEXT",
    "FLOAT": "DOUBLE PRECISION",
    "BOOLEAN": "BOOLEAN",
    "DATETIME": "TIMESTAMP WITH TIME ZONE",
    "DATE": "DATE",
    "NUMERIC": "NUMERIC",
    "JSON": "JSONB",
}


def sync_schema():
    url = os.getenv("DATABASE_URL")
    if not url:
        sys.exit("[FATAL] DATABASE_URL is not set.")
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql://", 1)
    if url.startswith("sqlite"):
        sys.exit("[FATAL] DATABASE_URL points at SQLite.")

    conn = psycopg2.connect(url)
    conn.autocommit = False
    cur = conn.cursor()

    cur.execute("""
        SELECT table_name, column_name FROM information_schema.columns
        WHERE table_schema = 'public'
    """)
    actual = {}
    for t, c in cur.fetchall():
        actual.setdefault(t, set()).add(c)

    added = []
    for name in sorted(Base.metadata.tables):
        table = Base.metadata.tables[name]
        if name not in actual:
            continue  # create_all already handled brand new tables
        for col in table.columns:
            if col.name in actual[name]:
                continue
            base = str(col.type).split("(")[0].split(",")[0].upper()
            pg_type = PY2PG.get(base, "TEXT")
            ddl = f'ALTER TABLE "{name}" ADD COLUMN "{col.name}" {pg_type}'
            cur.execute(ddl)
            added.append(f"{name}.{col.name} {pg_type}")

    if added:
        conn.commit()
        for a in added:
            print(f"[SYNC] added column {a}")
    else:
        conn.rollback()
        print("[SYNC] schema already up to date")

    conn.close()
    return added


if __name__ == "__main__":
    n = sync_schema()
    print(f"[SYNC] {len(n)} column(s) added")
