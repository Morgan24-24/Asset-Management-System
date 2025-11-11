import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://itams_user:itams123@localhost:5432/itams_db")

# Parse connection string
parts = DATABASE_URL.replace("postgresql://", "").split("@")
user_pass = parts[0].split(":")
host_port_db = parts[1].split("/")
host_port = host_port_db[0].split(":")

try:
    conn = psycopg2.connect(
        host=host_port[0],
        port=host_port[1] if len(host_port) > 1 else "5432",
        database=host_port_db[1],
        user=user_pass[0],
        password=user_pass[1]
    )
    
    cur = conn.cursor()
    
    print("📋 Adding display_name column to users table...")
    
    # Add display_name column
    cur.execute("""
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS display_name VARCHAR(255)
    """)
    
    conn.commit()
    print("✅ display_name column added successfully!")
    
    # Optional: Auto-populate display_name from email for existing users
    print("\n📝 Auto-populating display_name from emails...")
    
    cur.execute("""
        UPDATE users 
        SET display_name = INITCAP(REPLACE(SPLIT_PART(email, '@', 1), '.', ' '))
        WHERE display_name IS NULL
    """)
    
    conn.commit()
    
    cur.execute("SELECT email, display_name FROM users")
    users = cur.fetchall()
    
    print("\n✅ Updated users:")
    for email, display_name in users:
        print(f"  {email} → {display_name}")
    
    cur.close()
    conn.close()
    
    print("\n🎉 Migration complete!")
    print("⚠️  IMPORTANT: Restart your backend server!")
    
except Exception as e:
    print(f"❌ Error: {e}")