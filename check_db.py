import psycopg2
import traceback

conn_str = "host=aws-1-ap-south-1.pooler.supabase.com port=6543 dbname=postgres user=postgres.gmhznnwecujoafdisscl password=wjdcjrlgkqrur sslmode=require options='-c client_encoding=utf8'"

try:
    conn = psycopg2.connect(conn_str)
    conn.autocommit = True
    cur = conn.cursor()
    
    # Check tables
    print("=== TABLES ===")
    cur.execute("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;")
    tables = cur.fetchall()
    for t in tables:
        print(t[0])
    
    # Check subject table structure
    print("\n=== SUBJECT TABLE STRUCTURE ===")
    cur.execute("SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'subject' ORDER BY ordinal_position;")
    cols = cur.fetchall()
    for c in cols:
        print(c)
    
    # Check problem table structure
    print("\n=== PROBLEM TABLE STRUCTURE ===")
    cur.execute("SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'problem' ORDER BY ordinal_position;")
    cols = cur.fetchall()
    for c in cols:
        print(c)
    
    # Check constraints
    print("\n=== PROBLEM CONSTRAINTS ===")
    cur.execute("SELECT conname, contype, pg_get_constraintdef(oid) FROM pg_constraint WHERE conrelid = 'problem'::regclass;")
    constraints = cur.fetchall()
    for c in constraints:
        print(c)
    
    # Check existing data counts
    print("\n=== DATA COUNTS ===")
    cur.execute("SELECT COUNT(*) FROM subject;")
    print(f"Subject count: {cur.fetchone()[0]}")
    cur.execute("SELECT COUNT(*) FROM problem;")
    print(f"Problem count: {cur.fetchone()[0]}")
    
    # Check subject IDs
    print("\n=== SUBJECT IDs ===")
    cur.execute("SELECT id, name FROM subject ORDER BY id;")
    rows = cur.fetchall()
    for r in rows:
        print(r)
    
    # Check recent problems
    print("\n=== RECENT PROBLEMS (last 10) ===")
    cur.execute("SELECT id, subject_id, type, LEFT(question, 30) FROM problem ORDER BY id DESC LIMIT 10;")
    rows = cur.fetchall()
    for r in rows:
        print(r)
    
    cur.close()
    conn.close()
    
except Exception as e:
    print(f"Error: {e}")
    traceback.print_exc()
