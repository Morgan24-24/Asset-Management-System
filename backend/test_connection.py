import psycopg2

try:
    conn = psycopg2.connect(
        dbname="itams_db",
        user="itams_user",
        password="itams123",
        host="localhost",
        port="5432"
    )
    print("✅ Connection successful!")
    print(f"Connected to database: {conn.get_dsn_parameters()['dbname']}")
    print(f"User: {conn.get_dsn_parameters()['user']}")
    print(f"Host: {conn.get_dsn_parameters()['host']}")
    conn.close()
except Exception as e:
    print(f"❌ Connection failed!")
    print(f"Error: {e}")