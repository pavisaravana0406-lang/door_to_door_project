"""
Neon PostgreSQL migration / verification tool.

What it does
------------
1. Creates any missing tables in Neon (Base.metadata.create_all).
2. For every table, if Neon is EMPTY and the old SQLite file still has rows,
   it copies those rows in. Neon data is never overwritten or deleted.
3. Prints a per-table report so you can see exactly what landed in Neon.

Usage
-----
    cd backend_fastapi
    python migrate_to_neon.py                 # verify / migrate
    python migrate_to_neon.py --check-only    # report only, change nothing
    python migrate_to_neon.py --source ../swms_local.db

Requires DATABASE_URL to point at Neon and the service to be reachable.
"""

import argparse
import os
import sqlite3
import sys

import psycopg2
import psycopg2.extras
from dotenv import load_dotenv

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)

sys.path.insert(0, HERE)

load_dotenv()
load_dotenv(os.path.join(HERE, ".env"))

# Import AFTER load_dotenv so database.py sees DATABASE_URL.
from database import Base, engine  # noqa: E402
import models  # noqa: E402,F401  (registers every table on Base.metadata)

DEFAULT_SOURCES = [
    os.path.join(ROOT, "swms_local.db"),
    os.path.join(ROOT, "swms.db"),
    os.path.join(HERE, "swms_local.db"),
]

# Tables that must never be copied across: auth tokens are device/session
# specific and collection records are written by the live app, not by the DB.
SKIP_TABLES = {"swms_auth_tokens"}


def neon_url():
    url = os.getenv("DATABASE_URL")
    if not url:
        sys.exit("[FATAL] DATABASE_URL is not set. Put your Neon URL in "
                 "backend_fastapi/.env or the environment.")
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql://", 1)
    if url.startswith("sqlite"):
        sys.exit("[FATAL] DATABASE_URL still points at SQLite.")
    return url


def pick_source(explicit=None):
    if explicit:
        return explicit if os.path.exists(explicit) else None
    for p in DEFAULT_SOURCES:
        if os.path.exists(p):
            return p
    return None


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--check-only", action="store_true",
                    help="report only, do not write anything")
    ap.add_argument("--source", help="path to the legacy SQLite file")
    args = ap.parse_args()

    url = neon_url()
    print("Neon target:", url.split("@")[-1].split("/")[0])
    print()

    if not args.check_only:
        Base.metadata.create_all(bind=engine)
        print("[OK] schema ensured in Neon\n")

    conn = psycopg2.connect(url)
    conn.autocommit = False

    src_path = pick_source(args.source)
    src = None
    if src_path:
        src = sqlite3.connect(src_path)
        print(f"legacy SQLite source: {src_path}")
    else:
        print("legacy SQLite source: (already deleted — nothing to import)")

    tables = [t.name for t in Base.metadata.sorted_tables]
    imported, skipped_present, empty = [], [], []

    with conn.cursor() as cur:
        for table in tables:
            cur.execute(f'SELECT COUNT(*) FROM "{table}"')
            neon_n = cur.fetchone()[0]

            if neon_n > 0:
                skipped_present.append((table, neon_n))
                print(f"  {table:<28} neon={neon_n:<6} keep")
                continue

            if table in SKIP_TABLES:
                empty.append(table)
                print(f"  {table:<28} neon=0     skipped (session data)")
                continue

            if src is None:
                empty.append(table)
                print(f"  {table:<28} neon=0     (no source)")
                continue

            src.execute(f'SELECT * FROM "{table}"')
            cols = [d[0] for d in src.description]
            rows = src.fetchall()
            if not rows:
                empty.append(table)
                print(f"  {table:<28} neon=0     source empty")
                continue

            if args.check_only:
                print(f"  {table:<28} neon=0     would import {len(rows)}")
                continue

            placeholders = ", ".join(["%s"] * len(cols))
            collist = ", ".join(f'"{c}"' for c in cols)
            psycopg2.extras.execute_batch(
                cur,
                f'INSERT INTO "{table}" ({collist}) VALUES ({placeholders})',
                rows,
                page_size=200,
            )
            imported.append((table, len(rows)))
            print(f"  {table:<28} neon=0  ->  imported {len(rows)}")

        if imported and not args.check_only:
            conn.commit()
            print(f"\n[OK] committed {sum(n for _, n in imported)} rows "
                  f"across {len(imported)} tables")
        elif args.check_only and imported:
            print(f"\n[--] dry run: would import "
                  f"{sum(n for _, n in imported)} rows")

    conn.close()
    if src:
        src.close()

    print(f"\nsummary: imported={len(imported)} "
          f"already_in_neon={len(skipped_present)} empty={len(empty)}")


if __name__ == "__main__":
    main()
