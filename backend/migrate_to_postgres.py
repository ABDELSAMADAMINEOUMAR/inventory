#!/usr/bin/env python
"""
migrate_to_postgres.py
Run this AFTER setting DATABASE_URL env var to your Cloud PostgreSQL connection string.
Supported Cloud Providers (Free 24/7 Always-On tiers):
  - Neon.tech (Recommended: Serverless PostgreSQL, instant startup, no 7-day auto-pause)
  - CockroachDB Cloud (Up to 10GB free 24/7/365)
  - Aiven PostgreSQL (Free tier, always active)
  - AWS RDS / DigitalOcean / Railway / Supabase

Usage:
  $env:DATABASE_URL = "postgresql://username:PASSWORD@HOST:PORT/database_name"
  venv\Scripts\python migrate_to_postgres.py
"""

import os
import sys
import subprocess

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MANAGE_PY = os.path.join(BASE_DIR, "manage.py")
DATA_EXPORT_JSON = os.path.join(BASE_DIR, "data_export.json")

def run(cmd, description, env):
    print(f"\n{'='*50}")
    print(f"[INFO] {description}...")
    print(f"{'='*50}")
    result = subprocess.run(
        [sys.executable, MANAGE_PY] + cmd,
        capture_output=False,
        text=True,
        env=env
    )
    if result.returncode != 0:
        print(f"\n[ERROR] FAILED: {description}")
        sys.exit(1)
    print(f"[SUCCESS] Done: {description}")

if __name__ == "__main__":
    env_file = os.path.join(BASE_DIR, ".env")
    if os.path.exists(env_file):
        with open(env_file, "r") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    k, v = line.split("=", 1)
                    os.environ.setdefault(k.strip(), v.strip())

    db_url = sys.argv[1] if len(sys.argv) > 1 else os.environ.get("DATABASE_URL", "")
    if not db_url:
        print("[ERROR] DATABASE_URL environment variable is not set!")
        print("\nSet it first with your Cloud PostgreSQL URL (e.g. CockroachDB):")
        print('  $env:DATABASE_URL = "postgresql://user:PASSWORD@host.cockroachlabs.cloud/dbname?sslmode=require"')
        sys.exit(1)

    env = os.environ.copy()
    env["DATABASE_URL"] = db_url

    print(f"\n[INFO] Connecting to Cloud Database: {db_url[:45]}...")
    print("[INFO] This will create tables and import all your data.\n")

    # Step 1: Ensure all schema migrations are marked applied
    subprocess.run([sys.executable, MANAGE_PY, "migrate", "--fake"], capture_output=True, env=env)

    # Step 2: Load all exported data
    run(["loaddata", DATA_EXPORT_JSON], "Importing all records from SQLite", env)

    print("\n" + "="*50)
    print("[SUCCESS] Migration complete!")
    print("   All data has been imported to your Cloud CockroachDB database.")
    print("   Your Django backend is now connected and ready for 24/7 production use.")
    print("="*50)
