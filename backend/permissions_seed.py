"""
Seed default permissions
Run this AFTER running seed.py
"""

from sqlalchemy.orm import Session
from database import SessionLocal
from models import Permission, User, UserPermission, UserRole

def create_default_permissions():
    """Create all default permissions"""
    db = SessionLocal()
    
    permissions = [
        # Asset Permissions
        {"name": "view_assets", "description": "View assets list", "category": "Assets"},
        {"name": "create_assets", "description": "Create new assets", "category": "Assets"},
        {"name": "edit_assets", "description": "Edit existing assets", "category": "Assets"},
        {"name": "delete_assets", "description": "Delete/soft delete assets", "category": "Assets"},
        {"name": "assign_assets", "description": "Assign assets to users", "category": "Assets"},
        {"name": "transfer_assets", "description": "Transfer assets between users", "category": "Assets"},
        
        # Report Permissions
        {"name": "view_reports", "description": "View basic reports", "category": "Reports"},
        {"name": "generate_reports", "description": "Generate and export reports", "category": "Reports"},
        {"name": "view_financial_reports", "description": "View cost/financial reports", "category": "Reports"},
        {"name": "export_reports_pdf", "description": "Export reports to PDF", "category": "Reports"},
        {"name": "export_reports_excel", "description": "Export reports to Excel", "category": "Reports"},
        
        # User Management Permissions
        {"name": "view_users", "description": "View users list", "category": "Users"},
        {"name": "create_users", "description": "Create new users", "category": "Users"},
        {"name": "edit_users", "description": "Edit user details", "category": "Users"},
        {"name": "delete_users", "description": "Deactivate users", "category": "Users"},
        {"name": "manage_permissions", "description": "Manage user permissions", "category": "Users"},
        
        # Department Permissions
        {"name": "view_departments", "description": "View departments", "category": "Departments"},
        {"name": "create_departments", "description": "Create departments", "category": "Departments"},
        {"name": "edit_departments", "description": "Edit departments", "category": "Departments"},
        {"name": "delete_departments", "description": "Delete departments", "category": "Departments"},
        
        # Maintenance Permissions
        {"name": "view_maintenance", "description": "View maintenance records", "category": "Maintenance"},
        {"name": "create_maintenance", "description": "Add maintenance records", "category": "Maintenance"},
        {"name": "delete_maintenance", "description": "Delete maintenance records", "category": "Maintenance"},
        
        # Activity & Audit Permissions
        {"name": "view_activity_logs", "description": "View activity logs", "category": "Audit"},
        {"name": "view_all_activities", "description": "View all user activities (admin)", "category": "Audit"},
    ]
    
    try:
        for perm in permissions:
            existing = db.query(Permission).filter(Permission.name == perm["name"]).first()
            if not existing:
                new_perm = Permission(**perm)
                db.add(new_perm)
        
        db.commit()
        print("✅ Default permissions created!")
        
        # Assign all permissions to admin
        assign_admin_permissions(db)
        
    except Exception as e:
        print(f"❌ Error creating permissions: {e}")
        db.rollback()
    finally:
        db.close()

def assign_admin_permissions(db: Session):
    """Give all permissions to admin users"""
    admin_users = db.query(User).filter(User.role == UserRole.ADMIN).all()
    all_permissions = db.query(Permission).all()
    
    for admin in admin_users:
        for perm in all_permissions:
            # Check if already assigned
            existing = db.query(UserPermission).filter(
                UserPermission.user_id == admin.id,
                UserPermission.permission_id == perm.id
            ).first()
            
            if not existing:
                user_perm = UserPermission(
                    user_id=admin.id,
                    permission_id=perm.id
                )
                db.add(user_perm)
    
    db.commit()
    print(f"✅ Assigned all permissions to {len(admin_users)} admin user(s)")

def assign_default_permissions_by_role(db: Session, user_id: int, role: UserRole):
    """Assign default permissions based on role"""
    permission_map = {
        UserRole.ADMIN: [
            # Admin gets everything (already handled above)
        ],
        UserRole.MANAGER: [
            "view_assets", "create_assets", "edit_assets", "assign_assets", "transfer_assets",
            "view_reports", "generate_reports", "export_reports_pdf", "export_reports_excel",
            "view_departments", "view_maintenance", "create_maintenance",
            "view_activity_logs"
        ],
        UserRole.VIEWER: [
            "view_assets", "view_reports", "view_departments", "view_maintenance"
        ]
    }
    
    if role == UserRole.ADMIN:
        return  # Admins already have all permissions
    
    permission_names = permission_map.get(role, [])
    
    for perm_name in permission_names:
        permission = db.query(Permission).filter(Permission.name == perm_name).first()
        if permission:
            existing = db.query(UserPermission).filter(
                UserPermission.user_id == user_id,
                UserPermission.permission_id == permission.id
            ).first()
            
            if not existing:
                user_perm = UserPermission(
                    user_id=user_id,
                    permission_id=permission.id
                )
                db.add(user_perm)
    
    db.commit()

if __name__ == "__main__":
    print("\n" + "="*50)
    print("🔐 SEEDING PERMISSIONS")
    print("="*50 + "\n")
    
    create_default_permissions()
    
    print("\n" + "="*50)
    print("✅ PERMISSIONS SEEDING COMPLETE!")
    print("="*50 + "\n")