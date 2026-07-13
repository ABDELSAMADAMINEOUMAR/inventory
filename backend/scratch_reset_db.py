import psycopg2

DB_URL = "postgresql://Smartims:RiUypjpkoHIfBRQ_gRKh4w@jailed-bittern-29150.j77.aws-ap-south-1.cockroachlabs.cloud:26257/defaultdb?sslmode=require"

conn = psycopg2.connect(DB_URL)
conn.autocommit = True
cur = conn.cursor()

cur.execute("SELECT table_name FROM information_schema.tables WHERE table_schema='public'")
tables = [r[0] for r in cur.fetchall()]
print(f"Dropping {len(tables)} tables...")

for t in tables:
    cur.execute(f'DROP TABLE IF EXISTS "{t}" CASCADE')

print("All tables dropped successfully!")
conn.close()
