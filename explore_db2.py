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
        
        # List ALL objects in sqlite_master
        cursor.execute("SELECT type, name, sql FROM sqlite_master")
        objects = cursor.fetchall()
        print(f"\nObjects found: {len(objects)}")
        
        if not objects:
            print("  (No objects found - database may be empty or corrupted)")
        else:
            for obj in objects:
                obj_type, obj_name, obj_sql = obj
                print(f"\n  {obj_type}: {obj_name}")
                if obj_sql:
                    print(f"    SQL: {obj_sql[:200]}...")
        
        # Also check for any data
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
        tables = cursor.fetchall()
        print(f"\nTables: {tables}")
        
        conn.close()
        
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

# Explore both databases
explore_db(r"C:\Users\SEOL\InformationExamProject\database.db")
explore_db(r"C:\Users\SEOL\InformationExamProject\backend\database.db")
