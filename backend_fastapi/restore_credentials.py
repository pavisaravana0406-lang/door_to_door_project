"""
Restore SWMS login credentials into Neon from the legacy SQLite backup.

Why this is needed
------------------
Neon currently has 8 users that all share ONE identical bcrypt hash, so no
per-user password (e.g. TN66AD6465 / 6465) can log in. The old SQLite
database still has the correct 26 users, each with their own working hash.

This script is non-destructive:
  * inserts users that are missing in Neon
  * updates ONLY password_hash / role / full_name for users that already exist
  * never deletes anything
  * wraps everything in a single transaction (all-or-nothing)

Usage:  python restore_credentials.py [--dry-run]
"""
import argparse
import os
import sqlite3
import sys

import psycopg2
from psycopg2.extras import execute_batch
from dotenv import load_dotenv

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)

load_dotenv()
load_dotenv(os.path.join(HERE, ".env"))

BACKUP = os.path.join(
    os.environ.get("TEMP", "/tmp"),
    "opencode", "sqlite_backup", "swms_local.db",
)


def neon_conn():
    url = os.getenv("DATABASE_URL")
    if not url:
        sys.exit("[FATAL] DATABASE_URL is not set.")
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql://", 1)
    if url.startswith("sqlite"):
        sys.exit("[FATAL] DATABASE_URL points at SQLite.")
    return psycopg2.connect(url)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--source", default=BACKUP)
    args = ap.parse_args()

    if not os.path.exists(args.source):
        sys.exit(f"[FATAL] Credential backup not found: {args.source}")

    src = sqlite3.connect(args.source)
    src.row_factory = sqlite3.Row
    users = src.execute(
        "SELECT username, role, password_hash, full_name FROM swms_users"
    ).fetchall()
    src.close()
    print(f"credential source: {args.source} ({len(users)} users)")

    conn = neon_conn()
    cur = conn.cursor()

    cur.execute("SELECT username, password_hash FROM swms_users")
    existing = {u: h for u, h in cur.fetchall()}
    print(f"neon currently: {len(existing)} users\n")

    inserts, updates, unchanged, neon_only = [], [], [], []

    for u in users:
        username = u["username"]
        ph = u["password_hash"]
        if username in existing:
            if existing[username] == ph:
                unchanged.append(username)
            else:
                updates.append((ph, u["role"], u["full_name"], username))
        else:
            inserts.append((username, ph, u["role"], u["full_name"]))

    neon_only = [u for u in existing if u not in {x["username"] for x in users}]

    print(f"  identical password : {len(unchanged)}")
    print(f"  will UPDATE hash    : {len(updates)}  {sorted(x[3] for x in updates)}")
    print(f"  will INSERT         : {len(inserts)}")
    print(f"  neon-only (untouched): {len(neon_only)}  {sorted(neon_only)}\n")

    if args.dry_run:
        print("-- dry run, nothing written --")
        conn.close()
        return

    if updates:
        execute_batch(
            cur,
            "UPDATE swms_users SET password_hash=%s, role=%s, full_name=%s "
            "WHERE username=%s",
            updates, page_size=50,
        )
    if inserts:
        execute_batch(
            cur,
            "INSERT INTO swms_users (username, password_hash, role, full_name) "
            "VALUES (%s, %s, %s, %s)",
            inserts, page_size=50,
        )
    conn.commit()

    cur.execute("SELECT COUNT(*) FROM swms_users")
    print(f"committed. swms_users now has {cur.fetchone()[0]} rows")
    conn.close()


if __name__ == "__main__":
    main()
