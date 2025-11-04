# Backend Setup Instructions

## 1. Install Python Requirements
```bash
cd backend
pip install -r requirements.txt
```

## 2. Install & Setup PostgreSQL

### Install PostgreSQL 18
Download from: https://www.postgresql.org/download/
after installing, it will ask you certain things, tick all boxes. including the command line tools.
you should see and copy the directory just incase when you open the command prompt and type the psql -U postgres and it doesn't come, you'd paste it there and continue.
it will ask for password, make sure the password is "postgres123" and remember it also!

### Create Database
Open Command Prompt and run:
```bash
psql -U postgres 

if it gives you an error, open where the postgresql was setup. (thus pasting the project directory you copied earlier)
once you're in, it'll ask for password. type the password you entered. 

once you're in, copy and paste these commands: 

CREATE DATABASE itams_db;
CREATE USER itams_user WITH PASSWORD 'itams123';
GRANT ALL PRIVILEGES ON DATABASE itams_db TO itams_user;

\c itams_db
GRANT ALL ON SCHEMA public TO itams_user;
GRANT CREATE ON SCHEMA public TO itams_user;
ALTER DATABASE itams_db OWNER TO itams_user;

\q
```
if this does not work, 

## 2. Setup Database (Using pgAdmin 4)

### Method 1: Run SQL Script (EASIEST!)

1. **Open pgAdmin 4** (installed with PostgreSQL)
2. **Connect to PostgreSQL 18** 
   - Click "PostgreSQL 18"
   - Enter password: `postgres123`
3. **Open Query Tool**
   - Right-click "PostgreSQL 18" → Query Tool
4. **Open SQL file**
   - Click folder icon 📁
   - Select `setup_database.sql` (in project root)
5. **Run first 3 commands**
   - Select lines 1-10 (CREATE DATABASE, CREATE USER, GRANT)
   - Click Execute (▶️ button)
6. **Connect to itams_db**
   - Close Query Tool
   - Right-click "Databases" → Refresh
   - You should see "itams_db"
   - Right-click "itams_db" → Query Tool
7. **Run remaining commands**
   - Select lines 18-20 (GRANT ALL ON SCHEMA...)
   - Click Execute (▶️ button)

**Done! Database is ready.**

### Method 2: Manual Setup (If SQL script doesn't work)

1. **Create Database:**
   - Right-click "Databases" → Create → Database
   - Name: `itams_db`
   - Save

2. **Create User:**
   - Right-click "Login/Group Roles" → Create → Login/Group Role
   - General tab: Name = `itams_user`
   - Definition tab: Password = `itams123`
   - Privileges tab: Can login? ✅
   - Save

3. **Grant Permissions:**
   - Right-click `itams_db` → Properties
   - Security tab → Add `itams_user`
   - Check ALL privileges
   - Save

## 3. Install Python Requirements
```bash
cd backend
pip install -r requirements.txt
```

## 4. Seed Database
```bash
python seed.py
python permissions_seed.py
```

**Expected Output:**
```
✅ Tables created successfully!
✅ Admin user created!
✅ Default asset types created!
✅ Default brands created!
✅ Default permissions created!
```

## 5. Start Backend Server
```bash
python main.py
```

Server runs on: **http://localhost:8000**

API Docs: **http://localhost:8000/docs**

## 5. Login Credentials

**Email:** admin@school.edu  
**Password:** admin123

## 6. Get Access Token

1. Go to http://localhost:8000/docs
2. Click authorize at the top and login with the following credentials
3. Enter:
   - username: `admin@assethub.com`
   - password: `admin123`
4. Click "Authorize" button
6. Now you can test all endpoints!

---

**That's it! Backend is ready.**

For API details, see: http://localhost:8000/docs