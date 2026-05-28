import sqlite3
import os

def explore_db(db_path):
    print(f"\n{'='*60}")
    print(f"Exploring: {db_path}")
    print(f"File exists: {os.path.exists(db_path)}")
    print(f"File size: {os.path.getsize(db_path) if os.path.exists(db_path) else 'N/A'} bytes")
    print(f"{'='*60}")
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # List all tables
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
        tables = cursor.fetchall()
        print(f"\nTables found: {len(tables)}")
        
        if not tables:
            print("  (No tables found)")
        else:
            for table in tables:
                table_name = table[0]
                print(f"\n  Table: {table_name}")
                
                # Get schema
                cursor.execute(f"PRAGMA table_info('{table_name}')")
                columns = cursor.fetchall()
                print(f"    Columns:")
                for col in columns:
                    print(f"      - {col[1]} ({col[2]})")
                
                # Count rows
                try:
                    cursor.execute(f"SELECT COUNT(*) FROM '{table_name}'")
                    count = cursor.fetchone()[0]
                    print(f"    Row count: {count}")
                    
                    # Show sample data if not too many
                    if count > 0:
                        cursor.execute(f"SELECT * FROM '{table_name}' LIMIT 3")
                        rows = cursor.fetchall()
                        print(f"    Sample data (first 3 rows):")
                        for row in rows:
                            print(f"      {row}")
                except Exception as e:
                    print(f"    Error reading data: {e}")
        
        conn.close()
        
    except Exception as e:
        print(f"Error: {e}")

# Explore both databases
explore_db(r"C:\Users\SEOL\InformationExamProject\database.db")
explore_db(r"C:\Users\SEOL\InformationExamProject\backend\database.db")
