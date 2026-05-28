import sqlite3
import sys

def list_tables(db_path):
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
        tables = cursor.fetchall()
        print(f"Tables in {db_path}:")
        for table in tables:
            print(f"  - {table[0]}")
        conn.close()
        return tables
    except Exception as e:
        print(f"Error accessing {db_path}: {e}")
        return []

print("=== database.db ===")
list_tables(r"C:\Users\SEOL\InformationExamProject\database.db")

print("\n=== backend/database.db ===")
list_tables(r"C:\Users\SEOL\InformationExamProject\backend\database.db")
