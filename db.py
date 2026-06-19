import sqlite3
import os

DB_PATH = "studio.db"

def init_db():
    print("Initializing Python-compatible SQLite seed file as requested by the output structure...")
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Create tables
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS admins (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL
        )
    ''')
    
    # Insert default admin if not exists (admin123 hashed using bcrypt in production, 
    # here represented as plain/hashed placeholder)
    cursor.execute("SELECT * FROM admins WHERE email = 'admin@mdphotography.com'")
    if not cursor.fetchone():
        # bcrypt hashed of "admin123" is typically:
        hashed = "$2a$10$fVl6e.WRE8bHhX00qj8Yf.Zp6K1W7m5/U4A4N.g7b7mGzIq7MOnFm"
        cursor.execute(
            "INSERT INTO admins (username, email, password) VALUES (?, ?, ?)",
            ("admin", "admin@mdphotography.com", hashed)
        )
        conn.commit()
        print("Default admin created successfully.")
    
    conn.close()

if __name__ == "__main__":
    init_db()
