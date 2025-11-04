from sqlalchemy.orm import Session
from database import engine, SessionLocal
from models import Base, User, Department, AssetType, Brand, UserRole, AssetStatusEnum, WarrantyStatusEnum
from auth import get_password_hash
import os
from dotenv import load_dotenv

load_dotenv()

def create_tables():
    """Create all database tables"""
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("✅ Tables created successfully!")

def create_admin_user(db: Session):
    """Create the first admin user"""
    admin_email = os.getenv("ADMIN_EMAIL", "lloydjunior080@gmail.com")
    admin_password = os.getenv("ADMIN_PASSWORD", "admin123")
    admin_company = os.getenv("ADMIN_COMPANY", "School Management System")
    
    # Check if admin already exists
    existing_admin = db.query(User).filter(User.email == admin_email).first()
    if existing_admin:
        print(f"⚠️  Admin user already exists: {admin_email}")
        return
    
    # Create admin user
    admin = User(
        email=admin_email,
        hashed_password=get_password_hash(admin_password),
        company=admin_company,
        role=UserRole.ADMIN,
        is_active=True
    )
    
    db.add(admin)
    db.commit()
    db.refresh(admin)
    
    print(f"✅ Admin user created!")
    print(f"   Email: {admin_email}")
    print(f"   Password: {admin_password}")
    print(f"   ⚠️  CHANGE THIS PASSWORD AFTER FIRST LOGIN!")

def create_default_asset_types(db: Session):
    """Create default asset types"""
    asset_types = [
        {"name": "Laptop", "description": "Portable computers"},
        {"name": "Desktop", "description": "Desktop computers"},
        {"name": "Monitor", "description": "Display screens"},
        {"name": "Printer", "description": "Printing devices"},
        {"name": "Server", "description": "Server hardware"},
        {"name": "Network Device", "description": "Routers, switches, etc."},
        {"name": "Projector", "description": "Projection equipment"},
        {"name": "Scanner", "description": "Document scanners"},
        {"name": "Phone", "description": "Office phones"},
        {"name": "Other", "description": "Other equipment"}
    ]
    
    for at in asset_types:
        existing = db.query(AssetType).filter(AssetType.name == at["name"]).first()
        if not existing:
            asset_type = AssetType(**at)
            db.add(asset_type)
    
    db.commit()
    print("✅ Default asset types created!")

def create_default_brands(db: Session):
    """Create default brands"""
    brands = [
        "Dell", "HP", "Lenovo", "Apple", "Asus", "Acer", "Microsoft",
        "Canon", "Epson", "Brother", "Cisco", "TP-Link", "Samsung",
        "LG", "BenQ", "Logitech", "Other"
    ]
    
    for brand_name in brands:
        existing = db.query(Brand).filter(Brand.name == brand_name).first()
        if not existing:
            brand = Brand(name=brand_name)
            db.add(brand)
    
    db.commit()
    print("✅ Default brands created!")

def main():
    """Main seed function"""
    print("\n" + "="*50)
    print("🌱 SEEDING DATABASE")
    print("="*50 + "\n")
    
    # Create tables
    create_tables()
    
    # Create database session
    db = SessionLocal()
    
    try:
        # Create default data
        create_admin_user(db)
        create_default_asset_types(db)
        create_default_brands(db)
        
        print("\n" + "="*50)
        print("✅ DATABASE SEEDING COMPLETE!")
        print("="*50)
        print("\n📝 Next steps:")
        print("1. Start the server: python main.py")
        print("2. Login with admin credentials")
        print("3. Change admin password immediately!")
        print("\n")
        
    except Exception as e:
        print(f"\n❌ Error during seeding: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    main()