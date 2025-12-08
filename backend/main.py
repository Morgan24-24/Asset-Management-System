from fastapi import FastAPI, HTTPException, Depends, Query, status, Request, UploadFile, File
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles  
from sqlalchemy.orm import Session, joinedload
from datetime import timedelta, datetime
from typing import Optional, List
from database import engine, get_db
from models import (
    Base, Asset, Maintenance, SoftwareLicense, User, Department,
    AssetType, Brand, AssetAssignment, ActivityLog, Notification,
    UserRole, AssetStatusEnum, WarrantyStatusEnum, ActivityType
)
from schemas import (
    AssetCreate, AssetUpdate, AssetResponse,
    MaintenanceCreate, MaintenanceResponse, PermissionBulkUpdate,
    SoftwareLicenseCreate, SoftwareLicenseResponse,
    DepartmentCreate, DepartmentUpdate, DepartmentResponse,
    AssetTypeCreate, AssetTypeResponse,
    BrandCreate, BrandResponse,
    AssetAssignmentCreate, AssetAssignmentResponse,
    ActivityLogResponse, NotificationResponse, PermissionResponse,
    UserCreate, UserUpdate, UserResponse, Token,
    UserProfileResponse, PasswordChangeRequest, AvatarUploadResponse
)
from auth import (
    get_password_hash, verify_password, get_user_permissions,
    create_access_token, get_current_user, require_permission, require_any_permission, require_all_permissions,
    ACCESS_TOKEN_EXPIRE_MINUTES
)
from sqlalchemy import func, or_, and_
from fastapi.responses import StreamingResponse
from report_generator import AssetReportGenerator, MaintenanceReportGenerator, DepartmentReportGenerator


app = FastAPI(title="IT Asset Management System", version="2.0")

# ==================== CORS SETUP ====================
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:8000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from pathlib import Path
Path("uploads/avatars").mkdir(parents=True, exist_ok=True)

app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

#ADD THIS VALIDATION ERROR HANDLER
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse


# ==================== HELPER FUNCTIONS ====================

def require_role(allowed_roles: List[UserRole]):
    """Decorator to check if user has required role"""
    def role_checker(current_user: dict = Depends(get_current_user)):
        user_role = current_user.get("role")
        if user_role not in [role.value for role in allowed_roles]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required roles: {[r.value for r in allowed_roles]}"
            )
        return current_user
    return role_checker

def log_activity(
    db: Session,
    user_id: int,
    action_type: ActivityType,
    description: str,
    asset_id: Optional[str] = None,
    ip_address: Optional[str] = None
):
    """Log user activity"""
    activity = ActivityLog(
        user_id=user_id,
        action_type=action_type,
        asset_id=asset_id,
        description=description,
        ip_address=ip_address
    )
    db.add(activity)
    db.commit()
    return activity

def create_notification(
    db: Session,
    user_id: int,
    title: str,
    message: str
):
    """Create a notification for a user"""
    notification = Notification(
        user_id=user_id,
        title=title,
        message=message
    )
    db.add(notification)
    db.commit()
    return notification

def get_user_by_email(db: Session, email: str):
    """Get user by email"""
    return db.query(User).filter(User.email == email).first()

# ==================== AUTHENTICATION ROUTES ====================

@app.get("/")
def home():
    return {
        "message": "IT Asset Management API v2.0",
        "status": "running",
        "features": [
            "Role-based access control",
            "Activity logging",
            "Asset transfer tracking",
            "Soft delete for assets",
            "Notification system"
        ]
    }

@app.post("/login", response_model=Token)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(), 
    db: Session = Depends(get_db),
    request: Request = None
):
    """Login and get access token (OAuth2 compatible)"""
    email = form_data.username
    password = form_data.password
    
    print(f"🔍 Login attempt for email: {email}")
    
    user = get_user_by_email(db, email)
    
    if not user:
        print(f"❌ User not found: {email}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated. Contact administrator."
        )
    
    if not verify_password(password, user.hashed_password):
        print(f"❌ Password verification failed")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    print(f"✅ Login successful for {user.email}")
    
    # Log activity
    ip_address = request.client.host if request else None
    log_activity(
        db, user.id, ActivityType.LOGIN,
        f"User {user.email} logged in",
        ip_address=ip_address
    )
    
    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email, "role": user.role.value, "user_id": user.id},
        expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/users/me")
def get_me(db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    """Get current user information"""
    user = get_user_by_email(db, current_user["email"])
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {
        "id": user.id,
        "email": user.email,
        "display_name": user.display_name,
        "company": user.company,
        "role": user.role.value,
        "is_active": user.is_active,
        "created_at": user.created_at,
        "avatar_url": user.avatar_url
    }

@app.post("/logout")
def logout(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
    request: Request = None
):
    """Log user logout activity"""
    try:
        ip_address = request.client.host if request else None
        log_activity(
            db, current_user["user_id"], ActivityType.LOGOUT,
            f"User {current_user['email']} logged out",
            ip_address=ip_address
        )
        return {"message": "Logged out successfully"}
    except Exception as e:
        print(f"Error logging logout: {e}")
        return {"message": "Logout processed"}
    
# ==================== USER SETTINGS ROUTES ====================

@app.get("/users/me/profile", response_model=UserProfileResponse)
def get_user_profile(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get complete user profile for settings page"""
    from models import Permission, UserPermission
    
    user = get_user_by_email(db, current_user["email"])
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get user's permissions
    permissions = []
    if user.role != UserRole.ADMIN:
        permissions = db.query(Permission).join(
            UserPermission, UserPermission.permission_id == Permission.id
        ).filter(UserPermission.user_id == user.id).all()
    
    return {
        "id": user.id,
        "email": user.email,
        "display_name": user.display_name,
        "company": user.company,
        "role": user.role,
        "is_active": user.is_active,
        "avatar_url": user.avatar_url,
        "created_at": user.created_at,
        "permissions": permissions
    }

@app.patch("/users/me/password")
def change_password(
    password_data: PasswordChangeRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Change user password"""
    user = get_user_by_email(db, current_user["email"])
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Verify current password
    if not verify_password(password_data.current_password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )
    
    # Check if new passwords match
    if password_data.new_password != password_data.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New passwords do not match"
        )
    
    # Update password
    user.hashed_password = get_password_hash(password_data.new_password)
    db.commit()
    
    # Log activity
    log_activity(
        db, user.id, ActivityType.UPDATE,
        f"User {user.email} changed their password"
    )
    
    return {"message": "Password changed successfully"}

@app.post("/users/me/avatar", response_model=AvatarUploadResponse)
async def upload_avatar(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Upload user profile picture"""
    from PIL import Image
    import os
    from pathlib import Path
    
    user = get_user_by_email(db, current_user["email"])
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Validate file type
    allowed_types = ["image/jpeg", "image/png", "image/jpg", "image/webp"]
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file type. Only JPEG, PNG, and WebP are allowed."
        )
    
    # Validate file size (max 5MB)
    file_size = 0
    chunk_size = 1024 * 1024  # 1MB chunks
    for chunk in iter(lambda: file.file.read(chunk_size), b""):
        file_size += len(chunk)
        if file_size > 5 * 1024 * 1024:  # 5MB
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File too large. Maximum size is 5MB."
            )
    
    file.file.seek(0)  # Reset file pointer
    
    # Create uploads directory if it doesn't exist
    upload_dir = Path("uploads/avatars")
    upload_dir.mkdir(parents=True, exist_ok=True)
    
    # Generate unique filename
    file_extension = file.filename.split(".")[-1]
    filename = f"user_{user.id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.{file_extension}"
    file_path = upload_dir / filename
    
    # Save and resize image
    try:
        # Read image
        image = Image.open(file.file)
        
        # Convert to RGB if necessary (for PNG with transparency)
        if image.mode in ("RGBA", "LA", "P"):
            background = Image.new("RGB", image.size, (255, 255, 255))
            if image.mode == "P":
                image = image.convert("RGBA")
            background.paste(image, mask=image.split()[-1] if image.mode == "RGBA" else None)
            image = background
        
        # Resize to 200x200
        image = image.resize((200, 200), Image.Resampling.LANCZOS)
        
        # Save
        image.save(file_path, quality=85, optimize=True)
        
        # Delete old avatar if exists
        if user.avatar_url:
            old_path = Path(user.avatar_url)
            if old_path.exists():
                old_path.unlink()
        
        # Update user
        user.avatar_url = str(file_path)
        db.commit()
        
        # Log activity
        log_activity(
            db, user.id, ActivityType.UPLOAD,
            f"User {user.email} uploaded a new profile picture"
        )
        
        return {
            "avatar_url": str(file_path),
            "message": "Profile picture uploaded successfully"
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process image: {str(e)}"
        )

@app.delete("/users/me/avatar")
def delete_avatar(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Remove user profile picture"""
    from pathlib import Path
    
    user = get_user_by_email(db, current_user["email"])
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if not user.avatar_url:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No profile picture to remove"
        )
    
    # Delete file
    file_path = Path(user.avatar_url)
    if file_path.exists():
        file_path.unlink()
    
    # Update user
    user.avatar_url = None
    db.commit()
    
    # Log activity
    log_activity(
        db, user.id, ActivityType.REMOVE,
        f"User {user.email} removed their profile picture"
    )
    
    return {"message": "Profile picture removed successfully"}

# ==================== USER DROPDOWN ROUTES (FOR ALL AUTHENTICATED USERS) ====================

@app.get("/users/active", response_model=List[UserResponse])
def get_active_users(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)  # Any authenticated user
):
    """Get active users for dropdowns (available to all authenticated users)"""
    users = db.query(User).filter(
        User.is_active == True
    ).order_by(User.email).all()
    return users


# ==================== USER MANAGEMENT ROUTES (ADMIN ONLY) ====================

@app.post("/admin/users", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(
    user_data: UserCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_role([UserRole.ADMIN]))
):
    """Admin creates a new user"""
    print(f"🔍 Creating user: {user_data.email}")
    
    # Check if user already exists
    existing_user = get_user_by_email(db, user_data.email)
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create new user
    new_user = User(
        email=user_data.email,
        hashed_password=get_password_hash(user_data.password),
        company=user_data.company,
        role=user_data.role,
        is_active=True
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Log activity
    log_activity(
        db, current_user["user_id"], ActivityType.CREATE,
        f"Admin created new user: {new_user.email} with role {new_user.role.value}"
    )
    
    print(f"✅ User created successfully: {new_user.email}")
    return new_user

@app.get("/admin/users", response_model=List[UserResponse])
def get_all_users(
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_role([UserRole.ADMIN])),
    skip: int = 0,
    limit: int = 100,
    is_active: Optional[bool] = None
):
    """Admin gets all users"""
    query = db.query(User)
    
    if is_active is not None:
        query = query.filter(User.is_active == is_active)
    
    users = query.offset(skip).limit(limit).all()
    return users

@app.patch("/admin/users/{user_id}/reactivate")
async def reactivate_user(
    user_id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Reactivate a deactivated user (Admin only)"""
    try:
        # Check if user is admin
        if current_user['role'] != 'Admin':
            raise HTTPException(status_code=403, detail="Admin access required")
        
        # Get the user
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Check if user is already active
        if user.is_active:
            raise HTTPException(status_code=400, detail="User is already active")
        
        # Reactivate the user
        user.is_active = True
        db.commit()
        db.refresh(user)
        
        # Log the activity
        try:
            activity = ActivityLog(
                user_id=current_user['user_id'],
                action_type=ActivityType.REACTIVATE,
                description=f"Reactivated user: {user.email}",
                ip_address="system"
            )
            db.add(activity)
            db.commit()
        except Exception as log_error:
            print(f"Failed to log activity: {log_error}")
            # Continue even if logging fails
        
        return {
            "message": "User reactivated successfully",
            "user": {
                "id": user.id,
                "email": user.email,
                "is_active": user.is_active,
                "role": user.role.value,
                "company": user.company
            }
        }
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error reactivating user: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to reactivate user: {str(e)}")

@app.delete("/admin/users/{user_id}/permanent") 
def permanently_delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_role([UserRole.ADMIN]))
):
    """Permanently delete a user (Admin only) - CANNOT BE UNDONE"""
    from models import UserPermission, AssetAssignment
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.id == current_user["user_id"]:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")
    
    # Check if user has active assignments
    active_assignments = db.query(AssetAssignment).filter(
        AssetAssignment.assigned_to_id == user_id,
        AssetAssignment.is_active == True
    ).count()
    
    if active_assignments > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete user. They have {active_assignments} active asset assignments. Please reassign or return assets first."
        )
    
    # Delete related records
    print(f"🗑️ Permanently deleting user: {user.email}")
    
    # 1. Delete permissions
    perm_count = db.query(UserPermission).filter(UserPermission.user_id == user_id).delete()
    print(f"   - Deleted {perm_count} permissions")
    
    # 2. Delete notifications
    notif_count = db.query(Notification).filter(Notification.user_id == user_id).delete()
    print(f"   - Deleted {notif_count} notifications")
    
    # 3. Update activity logs (keep for audit trail but anonymize)
    log_count = db.query(ActivityLog).filter(ActivityLog.user_id == user_id).count()
    if log_count > 0:
        db.query(ActivityLog).filter(ActivityLog.user_id == user_id).update({
            "description": func.concat(ActivityLog.description, " [User Deleted]")
        })
        print(f"   - Anonymized {log_count} activity logs")
    
    # 4. Update asset assignments (keep history but nullify user references)
    assigned_to_count = db.query(AssetAssignment).filter(
        AssetAssignment.assigned_to_id == user_id
    ).count()
    if assigned_to_count > 0:
        db.query(AssetAssignment).filter(AssetAssignment.assigned_to_id == user_id).update({
            "assigned_to_id": None
        })
        print(f"   - Nullified {assigned_to_count} 'assigned_to' references")
    
    assigned_by_count = db.query(AssetAssignment).filter(
        AssetAssignment.assigned_by_id == user_id
    ).count()
    if assigned_by_count > 0:
        db.query(AssetAssignment).filter(AssetAssignment.assigned_by_id == user_id).update({
            "assigned_by_id": None
        })
        print(f"   - Nullified {assigned_by_count} 'assigned_by' references")
    
    # 5. Delete the user
    user_email = user.email
    db.delete(user)
    db.commit()
    
    print(f"✅ User {user_email} permanently deleted")
    
    # Log activity
    log_activity(
        db, current_user["user_id"], ActivityType.DELETE,
        f"PERMANENTLY DELETED USER: {user_email}"
    )
    
    return {"message": f"User {user_email} permanently deleted"}

@app.get("/admin/users/{user_id}", response_model=UserResponse)
def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_role([UserRole.ADMIN]))
):
    """Admin gets a specific user"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@app.patch("/admin/users/{user_id}", response_model=UserResponse)
def update_user(
    user_id: int,
    user_update: UserUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_role([UserRole.ADMIN]))
):
    """Admin updates a user"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Update fields
    update_data = user_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(user, field, value)
    
    db.commit()
    db.refresh(user)
    
    # Log activity
    log_activity(
        db, current_user["user_id"], ActivityType.UPDATE,
        f"Admin updated user: {user.email}"
    )
    
    return user

@app.delete("/admin/users/{user_id}")
def deactivate_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_role([UserRole.ADMIN]))
):
    """Admin deactivates a user (soft delete)"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.id == current_user["user_id"]:
        raise HTTPException(status_code=400, detail="Cannot deactivate yourself")
    
    user.is_active = False
    db.commit()
    
    # Log activity
    log_activity(
        db, current_user["user_id"], ActivityType.DEACTIVATE,
        f"Admin deactivated user: {user.email}"
    )
    
    return {"message": f"User {user.email} deactivated successfully"}


# ==================== ASSET TYPE ROUTES ====================

@app.post("/asset-types", response_model=AssetTypeResponse)
def create_asset_type(
    asset_type: AssetTypeCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_role([UserRole.ADMIN, UserRole.MANAGER]))
):
    """Create a new asset type"""
    existing = db.query(AssetType).filter(AssetType.name == asset_type.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Asset type already exists")
    
    new_type = AssetType(**asset_type.dict())
    db.add(new_type)
    db.commit()
    db.refresh(new_type)
    
    log_activity(
        db, current_user["user_id"], ActivityType.CREATE,
        f"Created asset type: {new_type.name}"
    )
    
    return new_type

@app.get("/asset-types", response_model=List[AssetTypeResponse])
def get_asset_types(db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    """Get all asset types"""
    return db.query(AssetType).all()

# ==================== BRAND ROUTES ====================

@app.post("/brands", response_model=BrandResponse)
def create_brand(
    brand: BrandCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_role([UserRole.ADMIN, UserRole.MANAGER]))
):
    """Create a new brand"""
    existing = db.query(Brand).filter(Brand.name == brand.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Brand already exists")
    
    new_brand = Brand(**brand.dict())
    db.add(new_brand)
    db.commit()
    db.refresh(new_brand)
    
    log_activity(
        db, current_user["user_id"], ActivityType.CREATE,
        f"Created brand: {new_brand.name}"
    )
    
    return new_brand

@app.get("/brands", response_model=List[BrandResponse])
def get_brands(db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    """Get all brands"""
    return db.query(Brand).all()

# ==================== ASSET ROUTES ====================

@app.get("/assets", response_model=List[AssetResponse])
def get_assets(
    db: Session = Depends(get_db),
     current_user: dict = Depends(get_current_user),
    skip: int = 0,
    limit: int = 100,
    brand_id: Optional[int] = None,
    asset_type_id: Optional[int] = None,
    status: Optional[AssetStatusEnum] = None,
    department_id: Optional[int] = None,
    search: Optional[str] = None,
    include_deleted: bool = False
):
    """Get all assets with filtering"""
    query = db.query(Asset).options(
    joinedload(Asset.assignee),
    joinedload(Asset.department),
    joinedload(Asset.asset_type),
    joinedload(Asset.brand_obj)
)
    
    # Hide deleted assets by default
    if not include_deleted:
        query = query.filter(Asset.is_deleted == False)
    
    # Filters
    if brand_id:
        query = query.filter(Asset.brand_id == brand_id)
    if asset_type_id:
        query = query.filter(Asset.asset_type_id == asset_type_id)
    if status:
        query = query.filter(Asset.status == status)
    if department_id:
        query = query.filter(Asset.department_id == department_id)
    if search:
        query = query.filter(
            or_(
                Asset.model.ilike(f"%{search}%"),
                Asset.serial.ilike(f"%{search}%"),
                Asset.id.ilike(f"%{search}%")
            )
        )
    
    assets = query.offset(skip).limit(limit).all()
    return assets

@app.get("/assets/{asset_id}", response_model=AssetResponse)
def get_asset(
    asset_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get a specific asset"""
    asset = db.query(Asset).filter(Asset.id == asset_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    return asset

@app.post("/assets", response_model=AssetResponse, status_code=status.HTTP_201_CREATED)
def create_asset(
    asset: AssetCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_role([UserRole.ADMIN, UserRole.MANAGER]))
):
    """Create a new asset with auto-generated ID"""
    # Check if serial number already exists
    existing = db.query(Asset).filter(Asset.serial == asset.serial).first()
    if existing:
        raise HTTPException(status_code=400, detail="Asset with this serial already exists")
    
    # Get department code
    if asset.department_id:
        dept = db.query(Department).filter(Department.id == asset.department_id).first()
        if not dept:
            raise HTTPException(status_code=400, detail="Department not found")
        dept_code = dept.code
    else:
        dept_code = "GEN"
    
    # Count existing assets in this department
    existing_count = db.query(Asset).filter(
        Asset.id.like(f"{dept_code}-%")
    ).count()
    
    next_number = existing_count + 1
    asset_id = f"{dept_code}-{next_number:03d}"
    
    # Create asset
    asset_dict = asset.dict()
    asset_dict['id'] = asset_id
    
    new_asset = Asset(**asset_dict)
    db.add(new_asset)
    db.commit()
    db.refresh(new_asset)
    
    # Log activity
    asset_type = db.query(AssetType).filter(AssetType.id == asset.asset_type_id).first()
    brand = db.query(Brand).filter(Brand.id == asset.brand_id).first()
    log_activity(
        db, current_user["user_id"], ActivityType.CREATE,
        f"Created asset {asset_id}: {brand.name} {asset_type.name} - {new_asset.model}",
        asset_id=asset_id
    )
    
    return new_asset

@app.patch("/assets/{asset_id}", response_model=AssetResponse)
def update_asset(
    asset_id: str,
    asset_update: AssetUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_permission(["edit_assets"]))
):
    """Update an asset"""
    asset = db.query(Asset).filter(Asset.id == asset_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    
    if asset.is_deleted:
        raise HTTPException(status_code=400, detail="Cannot update deleted asset")
    
    # Update fields
    update_data = asset_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(asset, field, value)
    
    db.commit()
    db.refresh(asset)
    
    # Log activity
    log_activity(
        db, current_user["user_id"], ActivityType.UPDATE,
        f"Updated asset {asset_id}",
        asset_id=asset_id
    )
    
    return asset

@app.delete("/assets/{asset_id}")
def soft_delete_asset(
    asset_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_permission(["delete_assets"]))
):
    """Soft delete an asset (admin only)"""
    asset = db.query(Asset).filter(Asset.id == asset_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    
    if asset.is_deleted:
        raise HTTPException(status_code=400, detail="Asset already deleted")
    
    # Soft delete
    asset.is_deleted = True
    asset.deleted_at = datetime.utcnow()
    asset.deleted_by = current_user["user_id"]
    
    db.commit()
    
    # Log activity
    log_activity(
        db, current_user["user_id"], ActivityType.DELETE,
        f"Deleted asset {asset_id}",
        asset_id=asset_id
    )
    
    return {"message": f"Asset {asset_id} marked as deleted"}

# ==================== ASSET TRANSFER/ASSIGNMENT ROUTES ====================

@app.post("/assets/{asset_id}/assign", response_model=AssetAssignmentResponse)
def assign_asset(
    asset_id: str,
    assignment: AssetAssignmentCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_permission(["assign_assets"]))
):
    """Assign an asset to a user"""
    asset = db.query(Asset).filter(Asset.id == asset_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    
    if asset.is_deleted:
        raise HTTPException(status_code=400, detail="Cannot assign deleted asset")
    
    # Get assigned user
    assigned_user = db.query(User).filter(User.id == assignment.assigned_to_id).first()
    if not assigned_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Mark previous assignment as inactive
    previous_assignments = db.query(AssetAssignment).filter(
        AssetAssignment.asset_id == asset_id,
        AssetAssignment.is_active == True
    ).all()
    
    for prev in previous_assignments:
        prev.is_active = False
        prev.returned_date = datetime.utcnow()
    
    # Create new assignment
    new_assignment = AssetAssignment(
        asset_id=asset_id,
        assigned_to_id=assignment.assigned_to_id,
        assigned_by_id=current_user["user_id"],
        notes=assignment.notes
    )
    
    db.add(new_assignment)
    
    # Update asset
    asset.assignee_id = assignment.assigned_to_id
    asset.status = AssetStatusEnum.ACTIVE
    
    db.commit()
    db.refresh(new_assignment)
    
    # Log activity
    assigner = db.query(User).filter(User.id == current_user["user_id"]).first()
    log_activity(
        db, current_user["user_id"], ActivityType.ASSIGN,
        f"{assigner.email} assigned asset {asset_id} to {assigned_user.email}",
        asset_id=asset_id
    )
    
    # Create notification for assigned user
    create_notification(
        db, assignment.assigned_to_id,
        "Asset Assigned",
        f"Asset {asset_id} has been assigned to you by {assigner.email}"
    )
    
    return new_assignment

@app.post("/assets/{asset_id}/return")
def return_asset(
    asset_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_permission(["transfer_assets"]))
):
    """Return an asset (mark as available)"""
    asset = db.query(Asset).filter(Asset.id == asset_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    
    # Mark current assignment as returned
    active_assignment = db.query(AssetAssignment).filter(
        AssetAssignment.asset_id == asset_id,
        AssetAssignment.is_active == True
    ).first()
    
    if active_assignment:
        active_assignment.is_active = False
        active_assignment.returned_date = datetime.utcnow()
    
    # Update asset
    old_assignee_id = asset.assignee_id
    asset.assignee_id = None
    asset.status = AssetStatusEnum.AVAILABLE
    
    db.commit()
    
    # Log activity
    log_activity(
        db, current_user["user_id"], ActivityType.TRANSFER,
        f"Asset {asset_id} returned and marked as available",
        asset_id=asset_id
    )
    
    # Notify previous assignee
    if old_assignee_id:
        create_notification(
            db, old_assignee_id,
            "Asset Returned",
            f"Asset {asset_id} has been returned"
        )
    
    return {"message": f"Asset {asset_id} returned successfully"}

@app.get("/assets/{asset_id}/history")
def get_asset_history(
    asset_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get assignment history for an asset (role-based access)"""
    asset = db.query(Asset).filter(Asset.id == asset_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    
    user_role = current_user.get("role")
    
    # Admin and Manager get full history
    if user_role in ['Admin', 'Manager']:
        assignments = db.query(AssetAssignment).filter(
            AssetAssignment.asset_id == asset_id
        ).order_by(AssetAssignment.assigned_date.desc()).all()
        
        # Format with user details
        history = []
        for assignment in assignments:
            assigned_to = db.query(User).filter(User.id == assignment.assigned_to_id).first()
            assigned_by = db.query(User).filter(User.id == assignment.assigned_by_id).first()
            
            history.append({
                "id": assignment.id,
                "asset_id": assignment.asset_id,
                "assigned_to": assigned_to.email if assigned_to else "Unknown",
                "assigned_by": assigned_by.email if assigned_by else "Unknown",
                "assigned_date": assignment.assigned_date.strftime("%A, %B %d, %Y at %I:%M %p"),
                "returned_date": assignment.returned_date.strftime("%A, %B %d, %Y at %I:%M %p") if assignment.returned_date else None,
                "notes": assignment.notes,
                "is_active": assignment.is_active
            })
        
        return {
            "asset_id": asset_id,
            "full_access": True,
            "history": history
        }
    
    # Viewer gets only current assignment info
    else:
        current_assignee = None
        if asset.assignee_id:
            assignee = db.query(User).filter(User.id == asset.assignee_id).first()
            current_assignee = assignee.email if assignee else "Unknown"
        
        return {
            "asset_id": asset_id,
            "full_access": False,
            "current_assignee": current_assignee,
            "status": asset.status.value,
            "message": "Full assignment history is restricted to Manager and Admin roles."
        }

# ==================== MAINTENANCE ROUTES ====================

@app.post("/maintenance", response_model=MaintenanceResponse)
def add_maintenance(
    record: MaintenanceCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_role([UserRole.ADMIN, UserRole.MANAGER]))
):
    """Add a maintenance record"""
    asset = db.query(Asset).filter(Asset.id == record.asset_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    
    maintenance = Maintenance(
        **record.dict(),
        performed_by=current_user["user_id"]
    )
    
    db.add(maintenance)
    db.commit()
    db.refresh(maintenance)
    
    # Log activity
    log_activity(
        db, current_user["user_id"], ActivityType.MAINTENANCE,
        f"Maintenance performed on asset {record.asset_id}: {record.activity}",
        asset_id=record.asset_id
    )
    
    return maintenance

@app.get("/maintenance", response_model=List[MaintenanceResponse])
def get_maintenance(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
    skip: int = 0,
    limit: int = 100
):
    """Get all maintenance records"""
    return db.query(Maintenance).offset(skip).limit(limit).all()

@app.get("/maintenance/{asset_id}", response_model=List[MaintenanceResponse])
def get_asset_maintenance(
    asset_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get maintenance records for a specific asset"""
    asset = db.query(Asset).filter(Asset.id == asset_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    
    return db.query(Maintenance).filter(
        Maintenance.asset_id == asset_id
    ).order_by(Maintenance.date.desc()).all()

@app.delete("/maintenance/{maintenance_id}")
def delete_maintenance(
    maintenance_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_permission(["delete_maintenance"]))
):
    """Delete a maintenance record"""
    maintenance = db.query(Maintenance).filter(Maintenance.id == maintenance_id).first()
    if not maintenance:
        raise HTTPException(status_code=404, detail="Maintenance record not found")
    
    db.delete(maintenance)
    db.commit()
    
    return {"message": f"Maintenance record {maintenance_id} deleted successfully"}

# ==================== LICENSE ROUTES ====================

@app.post("/licenses", response_model=SoftwareLicenseResponse)
def add_license(
    license: SoftwareLicenseCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_role([UserRole.ADMIN, UserRole.MANAGER]))
):
    """Add a software license"""
    existing = db.query(SoftwareLicense).filter(
        SoftwareLicense.license_key == license.license_key
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="License key already exists")
    
    new_license = SoftwareLicense(**license.dict())
    db.add(new_license)
    db.commit()
    db.refresh(new_license)
    
    log_activity(
        db, current_user["user_id"], ActivityType.CREATE,
        f"Added software license: {new_license.name}"
    )
    
    return new_license

@app.get("/licenses", response_model=List[SoftwareLicenseResponse])
def get_licenses(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get all software licenses"""
    return db.query(SoftwareLicense).all()

@app.get("/licenses/{license_id}", response_model=SoftwareLicenseResponse)
def get_license(
    license_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get a specific license"""
    license = db.query(SoftwareLicense).filter(SoftwareLicense.id == license_id).first()
    if not license:
        raise HTTPException(status_code=404, detail="License not found")
    return license

@app.patch("/licenses/{license_id}", response_model=SoftwareLicenseResponse)
def update_license(
    license_id: int,
    fields: dict,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_role([UserRole.ADMIN, UserRole.MANAGER]))
):
    """Update a license"""
    license = db.query(SoftwareLicense).filter(SoftwareLicense.id == license_id).first()
    if not license:
        raise HTTPException(status_code=404, detail="License not found")
    
    for key, val in fields.items():
        if hasattr(license, key):
            setattr(license, key, val)
    
    db.commit()
    db.refresh(license)
    
    return license

@app.delete("/licenses/{license_id}")
def delete_license(
    license_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_role([UserRole.ADMIN]))
):
    """Delete a license"""
    license = db.query(SoftwareLicense).filter(SoftwareLicense.id == license_id).first()
    if not license:
        raise HTTPException(status_code=404, detail="License not found")
    
    db.delete(license)
    db.commit()
    
    return {"message": "License deleted"}

# ==================== DEPARTMENT ROUTES ====================

@app.post("/departments", response_model=DepartmentResponse)
def create_department(
    dept: DepartmentCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_role([UserRole.ADMIN]))
):
    """Create a new department (admin only)"""
    existing = db.query(Department).filter(Department.code == dept.code).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Department code '{dept.code}' already exists")
    
    new_dept = Department(**dept.dict())
    db.add(new_dept)
    db.commit()
    db.refresh(new_dept)
    
    log_activity(
        db, current_user["user_id"], ActivityType.CREATE,
        f"Created department: {new_dept.name} ({new_dept.code})"
    )
    
    return new_dept

@app.get("/departments", response_model=List[DepartmentResponse])
def get_departments(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get all departments"""
    return db.query(Department).filter(Department.is_active == True).all()

@app.get("/departments/{dept_id}", response_model=DepartmentResponse)
def get_department(
    dept_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get a single department"""
    dept = db.query(Department).filter(Department.id == dept_id).first()
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")
    return dept

@app.patch("/departments/{dept_id}", response_model=DepartmentResponse)
def update_department(
    dept_id: int,
    dept_data: DepartmentUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_permission(["edit_departments"]))
):
    """Update a department (admin only)"""
    dept = db.query(Department).filter(Department.id == dept_id).first()
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")
    
    update_data = dept_data.dict(exclude_unset=True)
    
    # Check if new code conflicts
    if 'code' in update_data and update_data['code'] != dept.code:
        existing = db.query(Department).filter(Department.code == update_data['code']).first()
        if existing:
            raise HTTPException(status_code=400, detail=f"Department code '{update_data['code']}' already exists")
    
    for field, value in update_data.items():
        setattr(dept, field, value)
    
    db.commit()
    db.refresh(dept)
    
    return dept

@app.delete("/departments/{dept_id}")
def delete_department(
    dept_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_permission(["delete_departments"]))
):
    """Delete a department (admin only)"""
    dept = db.query(Department).filter(Department.id == dept_id).first()
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")
    
    # Check if any assets are assigned
    assets_count = db.query(Asset).filter(
        Asset.department_id == dept_id,
        Asset.is_deleted == False
    ).count()
    
    if assets_count > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete department. {assets_count} assets are still assigned to it."
        )
    
    dept.is_active = False
    db.commit()
    
    return {"message": f"Department '{dept.name}' deleted successfully"}

@app.get("/departments/{dept_id}/assets")
def get_department_assets(
    dept_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get all assets in a department"""
    dept = db.query(Department).filter(Department.id == dept_id).first()
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")
    
    assets = db.query(Asset).options(
    joinedload(Asset.assignee),
    joinedload(Asset.department),
    joinedload(Asset.asset_type),
    joinedload(Asset.brand_obj)
).filter(
    Asset.department_id == dept_id,
    Asset.is_deleted == False
).all()
    
    total_cost = sum(asset.cost for asset in assets)
    active_count = sum(1 for asset in assets if asset.status == AssetStatusEnum.ACTIVE)
    
    return {
        "department": dept,
        "assets": assets,
        "total_assets": len(assets),
        "total_cost": total_cost,
        "active_assets": active_count
    }

# ==================== ACTIVITY LOG ROUTES ====================

@app.get("/activities", response_model=List[ActivityLogResponse])
def get_activities(
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_role([UserRole.ADMIN, UserRole.MANAGER])),  # Admin/Manager only
    skip: int = 0,
    limit: int = 25,  # Changed default to 25 per your request
    action_type: Optional[ActivityType] = None,
    asset_id: Optional[str] = None,
    user_id: Optional[int] = None,
    search: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None
):
    """Get activity logs (Admin/Manager only)"""
    query = db.query(ActivityLog)
    
    # Filter by action type
    if action_type:
        query = query.filter(ActivityLog.action_type == action_type)
    
    # Filter by asset
    if asset_id:
        query = query.filter(ActivityLog.asset_id == asset_id)
    
    # Filter by user
    if user_id:
        query = query.filter(ActivityLog.user_id == user_id)
    
    # Search in description
    if search:
        query = query.filter(ActivityLog.description.ilike(f"%{search}%"))
    
    # Filter by date range
    if start_date:
        query = query.filter(ActivityLog.timestamp >= start_date)
    if end_date:
        query = query.filter(ActivityLog.timestamp <= end_date)
    
    # Get total count for pagination
    total_count = query.count()
    
    # Get activities with pagination
    activities = query.order_by(ActivityLog.timestamp.desc()).offset(skip).limit(limit).all()
    
    return activities

@app.get("/activities/recent")
def get_recent_activities(
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_role([UserRole.ADMIN, UserRole.MANAGER])), 
    limit: int = 25
):
    """Get recent activities (Admin/Manager only)"""
    activities = db.query(ActivityLog).order_by(
        ActivityLog.timestamp.desc()
    ).limit(limit).all()
    
    # Format for frontend with full datetime
    formatted = []
    for activity in activities:
        user = db.query(User).filter(User.id == activity.user_id).first()
        
        # Format timestamp to show day, date, and time
        timestamp_str = activity.timestamp.strftime("%A, %B %d, %Y at %I:%M %p") if activity.timestamp else "Unknown"
        
        formatted.append({
            "id": activity.id,
            "user": user.email if user else "Unknown",
            "user_id": activity.user_id,
            "action": activity.action_type.value,
            "description": activity.description,
            "timestamp": activity.timestamp,
            "timestamp_formatted": timestamp_str,  # Human-readable format
            "asset_id": activity.asset_id
        })
    
    return formatted

# ==================== NOTIFICATION ROUTES ====================

@app.get("/notifications", response_model=List[NotificationResponse])
def get_notifications(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
    unread_only: bool = False
):
    """Get user notifications"""
    query = db.query(Notification).filter(Notification.user_id == current_user["user_id"])
    
    if unread_only:
        query = query.filter(Notification.is_read == False)
    
    notifications = query.order_by(Notification.created_at.desc()).all()
    return notifications

@app.patch("/notifications/{notification_id}/read")
def mark_notification_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Mark notification as read"""
    notification = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == current_user["user_id"]
    ).first()
    
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    notification.is_read = True
    db.commit()
    
    return {"message": "Notification marked as read"}

@app.post("/notifications/mark-all-read")
def mark_all_notifications_read(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Mark all notifications as read"""
    db.query(Notification).filter(
        Notification.user_id == current_user["user_id"],
        Notification.is_read == False
    ).update({"is_read": True})
    
    db.commit()
    
    return {"message": "All notifications marked as read"}

# ==================== PERMISSION MANAGEMENT ROUTES (ADMIN ONLY) ====================

@app.get("/permissions", response_model=List[PermissionResponse])
def get_all_permissions(
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_role([UserRole.ADMIN]))
):
    """Get all available permissions (admin only)"""
    from models import Permission
    return db.query(Permission).order_by(Permission.category, Permission.name).all()

@app.get("/users/{user_id}/permissions")
def get_user_permissions_list(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_permission(["manage_permissions", "view_users"]))
):
    """Get a specific user's permissions"""
    from models import User, Permission, UserPermission
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get user's permissions
    permissions = db.query(Permission).join(
        UserPermission, UserPermission.permission_id == Permission.id
    ).filter(UserPermission.user_id == user_id).all()
    
    return {
        "user_id": user_id,
        "email": user.email,
        "role": user.role.value,
        "permissions": [
            {
                "id": perm.id,
                "name": perm.name,
                "description": perm.description,
                "category": perm.category
            }
            for perm in permissions
        ]
    }

@app.post("/users/{user_id}/permissions/bulk")
def set_user_permissions(
    user_id: int,
    permission_data: PermissionBulkUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_role([UserRole.ADMIN]))
):
    """Set all permissions for a user at once (replaces existing)"""
    from models import User, Permission, UserPermission
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Remove all existing permissions
    db.query(UserPermission).filter(UserPermission.user_id == user_id).delete()
    
    # Add new permissions
    for perm_id in permission_data.permission_ids:
        permission = db.query(Permission).filter(Permission.id == perm_id).first()
        if permission:
            user_perm = UserPermission(
                user_id=user_id,
                permission_id=perm_id,
                granted_by=current_user["user_id"]
            )
            db.add(user_perm)
    
    db.commit()
    
    # Log activity
    log_activity(
        db, current_user["user_id"], ActivityType.UPDATE,
        f"Updated permissions for user {user.email}"
    )
    
    return {"message": f"Permissions updated for {user.email}"}

@app.post("/users/{user_id}/permissions/{permission_id}")
def grant_permission(
    user_id: int,
    permission_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_role([UserRole.ADMIN]))
):
    """Grant a permission to a user (admin only)"""
    from models import User, Permission, UserPermission
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    permission = db.query(Permission).filter(Permission.id == permission_id).first()
    if not permission:
        raise HTTPException(status_code=404, detail="Permission not found")
    
    # Check if already granted
    existing = db.query(UserPermission).filter(
        UserPermission.user_id == user_id,
        UserPermission.permission_id == permission_id
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Permission already granted")
    
    # Grant permission
    user_perm = UserPermission(
        user_id=user_id,
        permission_id=permission_id,
        granted_by=current_user["user_id"]
    )
    
    db.add(user_perm)
    db.commit()
    
    # Log activity
    log_activity(
        db, current_user["user_id"], ActivityType.UPDATE,
        f"Granted permission '{permission.name}' to user {user.email}"
    )
    
    return {"message": f"Permission '{permission.name}' granted to {user.email}"}

@app.delete("/users/{user_id}/permissions/{permission_id}")
def revoke_permission(
    user_id: int,
    permission_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_role([UserRole.ADMIN]))
):
    """Revoke a permission from a user (admin only)"""
    from models import User, Permission, UserPermission
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    permission = db.query(Permission).filter(Permission.id == permission_id).first()
    if not permission:
        raise HTTPException(status_code=404, detail="Permission not found")
    
    # Find permission assignment
    user_perm = db.query(UserPermission).filter(
        UserPermission.user_id == user_id,
        UserPermission.permission_id == permission_id
    ).first()
    
    if not user_perm:
        raise HTTPException(status_code=404, detail="Permission not found for this user")
    
    # Revoke permission
    db.delete(user_perm)
    db.commit()
    
    # Log activity
    log_activity(
        db, current_user["user_id"], ActivityType.UPDATE,
        f"Revoked permission '{permission.name}' from user {user.email}"
    )
    
    return {"message": f"Permission '{permission.name}' revoked from {user.email}"}

# ==================== REPORT ROUTES ====================

@app.get("/report/summary")
def get_summary(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get dashboard summary"""
    total_assets = db.query(Asset).filter(Asset.is_deleted == False).count()
    total_active = db.query(Asset).filter(
        Asset.status == AssetStatusEnum.ACTIVE,
        Asset.is_deleted == False
    ).count()
    total_maintenance = db.query(Asset).filter(
        Asset.status == AssetStatusEnum.UNDER_MAINTENANCE,
        Asset.is_deleted == False
    ).count()
    
    # FIX: Query available assets directly instead of calculating
    total_available = db.query(Asset).filter(
        Asset.status == AssetStatusEnum.AVAILABLE,
        Asset.is_deleted == False
    ).count()
    
    # Add retired count for completeness
    total_retired = db.query(Asset).filter(
        Asset.status == AssetStatusEnum.RETIRED,
        Asset.is_deleted == False
    ).count()
    
    total_cost = db.query(func.sum(Asset.cost)).filter(Asset.is_deleted == False).scalar() or 0.0
    total_maintenance_cost = db.query(func.sum(Maintenance.cost)).scalar() or 0.0
    
    # Additional stats
    total_users = db.query(User).filter(User.is_active == True).count()
    total_departments = db.query(Department).filter(Department.is_active == True).count()
    
    return {
        "total_assets": total_assets,
        "active_assets": total_active,
        "maintenance_assets": total_maintenance,
        "available_assets": total_available,  # FIX: Use direct query
        "retired_assets": total_retired,  # Add this for completeness
        "total_asset_cost": round(total_cost, 2),
        "total_maintenance_cost": round(total_maintenance_cost, 2),
        "total_users": total_users,
        "total_departments": total_departments
    }

@app.get("/report/asset-stats")
def asset_stats(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get asset statistics"""
    # By department
    dept_stats = db.query(
        Department.name,
        func.count(Asset.id).label("count")
    ).join(Asset, Asset.department_id == Department.id).filter(
        Asset.is_deleted == False
    ).group_by(Department.name).all()
    
    # By type
    type_stats = db.query(
        AssetType.name,
        func.count(Asset.id).label("count")
    ).join(Asset, Asset.asset_type_id == AssetType.id).filter(
        Asset.is_deleted == False
    ).group_by(AssetType.name).all()
    
    # By status
    status_stats = db.query(
        Asset.status,
        func.count(Asset.id).label("count")
    ).filter(Asset.is_deleted == False).group_by(Asset.status).all()
    
    return {
        "by_department": {dept: count for dept, count in dept_stats},
        "by_type": {type_name: count for type_name, count in type_stats},
        "by_status": {status.value: count for status, count in status_stats}
    }

@app.get("/report/maintenance-costs")
def maintenance_costs(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get maintenance cost breakdown"""
    total = db.query(func.sum(Maintenance.cost)).scalar() or 0.0
    
    breakdown = db.query(
        Asset.id,
        Brand.name.label("brand"),
        AssetType.name.label("type"),
        func.sum(Maintenance.cost).label("total_cost"),
        func.count(Maintenance.id).label("maintenance_count")
    ).join(Maintenance, Asset.id == Maintenance.asset_id)\
     .join(Brand, Asset.brand_id == Brand.id)\
     .join(AssetType, Asset.asset_type_id == AssetType.id)\
     .group_by(Asset.id, Brand.name, AssetType.name).all()
    
    return {
        "total_cost": round(total, 2),
        "breakdown": [
            {
                "asset_id": row.id,
                "brand": row.brand,
                "type": row.type,
                "total_cost": round(row.total_cost, 2),
                "maintenance_count": row.maintenance_count
            }
            for row in breakdown
        ]
    }

@app.get("/report/depreciation")
def get_depreciation_report(
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_permission(["view_financial_reports", "view_reports"]))
):
    """Calculate asset depreciation (5-year straight-line)"""
    assets = db.query(Asset).filter(Asset.is_deleted == False).all()
    depreciation_data = []
    
    for asset in assets:
        from datetime import datetime
        purchase_date = datetime.strptime(asset.purchase_date, "%Y-%m-%d")
        years_old = (datetime.now() - purchase_date).days / 365
        
        useful_life = 5
        annual_depreciation = asset.cost / useful_life
        accumulated_depreciation = min(annual_depreciation * years_old, asset.cost)
        current_value = max(asset.cost - accumulated_depreciation, 0)
        
        brand = db.query(Brand).filter(Brand.id == asset.brand_id).first()
        asset_type = db.query(AssetType).filter(AssetType.id == asset.asset_type_id).first()
        dept = db.query(Department).filter(Department.id == asset.department_id).first()
        
        depreciation_data.append({
            "asset_id": asset.id,
            "brand": brand.name if brand else "Unknown",
            "type": asset_type.name if asset_type else "Unknown",
            "model": asset.model,
            "department": dept.name if dept else "Unassigned",
            "purchase_cost": asset.cost,
            "current_value": round(current_value, 2),
            "depreciation": round(accumulated_depreciation, 2),
            "years_old": round(years_old, 1),
            "depreciation_rate": round((accumulated_depreciation / asset.cost * 100), 2) if asset.cost > 0 else 0
        })
    
    total_purchase_value = sum(asset.cost for asset in assets)
    total_current_value = sum(item["current_value"] for item in depreciation_data)
    total_depreciation = sum(item["depreciation"] for item in depreciation_data)
    
    return {
        "assets": depreciation_data,
        "summary": {
            "total_purchase_value": round(total_purchase_value, 2),
            "total_current_value": round(total_current_value, 2),
            "total_depreciation": round(total_depreciation, 2),
            "overall_depreciation_rate": round((total_depreciation / total_purchase_value * 100), 2) if total_purchase_value > 0 else 0
        }
    }

@app.get("/report/utilization")
def get_utilization_report(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Asset utilization report"""
    total_assets = db.query(Asset).filter(Asset.is_deleted == False).count()
    active_assets = db.query(Asset).filter(
        Asset.status == AssetStatusEnum.ACTIVE,
        Asset.is_deleted == False
    ).count()
    available_assets = db.query(Asset).filter(
        Asset.status == AssetStatusEnum.AVAILABLE,
        Asset.is_deleted == False
    ).count()
    maintenance_assets = db.query(Asset).filter(
        Asset.status == AssetStatusEnum.UNDER_MAINTENANCE,
        Asset.is_deleted == False
    ).count()
    
    # By department
    dept_utilization = []
    departments = db.query(Department).filter(Department.is_active == True).all()
    
    for dept in departments:
        dept_total = db.query(Asset).filter(
            Asset.department_id == dept.id,
            Asset.is_deleted == False
        ).count()
        
        dept_active = db.query(Asset).filter(
            Asset.department_id == dept.id,
            Asset.status == AssetStatusEnum.ACTIVE,
            Asset.is_deleted == False
        ).count()
        
        utilization_rate = (dept_active / dept_total * 100) if dept_total > 0 else 0
        
        dept_utilization.append({
            "department": dept.name,
            "code": dept.code,
            "total_assets": dept_total,
            "active_assets": dept_active,
            "utilization_rate": round(utilization_rate, 2)
        })
    
    return {
        "overall": {
            "total_assets": total_assets,
            "active": active_assets,
            "available": available_assets,
            "under_maintenance": maintenance_assets,
            "utilization_rate": round((active_assets / total_assets * 100), 2) if total_assets > 0 else 0
        },
        "by_department": dept_utilization
    }

# ==================== REPORT EXPORT ROUTES ====================

@app.get("/report/export/assets")
def export_asset_inventory(
    format: str = Query("pdf", regex="^(pdf|excel)$"),
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    department_id: Optional[int] = None,
    status: Optional[AssetStatusEnum] = None,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_permission(["generate_reports", "export_reports_pdf", "export_reports_excel"]))
):
    """
    Export asset inventory report
    Format: pdf or excel
    """
    # Build query
    query = db.query(Asset).filter(Asset.is_deleted == False)
    
    # Apply filters
    if start_date:
        query = query.filter(Asset.purchase_date >= start_date)
    if end_date:
        query = query.filter(Asset.purchase_date <= end_date)
    if department_id:
        query = query.filter(Asset.department_id == department_id)
    if status:
        query = query.filter(Asset.status == status)
    
    assets = query.all()
    
    # Prepare data
    asset_data = []
    for asset in assets:
        asset_type = db.query(AssetType).filter(AssetType.id == asset.asset_type_id).first()
        brand = db.query(Brand).filter(Brand.id == asset.brand_id).first()
        dept = db.query(Department).filter(Department.id == asset.department_id).first()
        
        asset_data.append({
            'id': asset.id,
            'type': asset_type.name if asset_type else 'Unknown',
            'brand': brand.name if brand else 'Unknown',
            'model': asset.model,
            'serial': asset.serial,
            'status': asset.status.value,
            'department': dept.name if dept else 'Unassigned',
            'cost': asset.cost
        })
    
    # Generate report
    generator = AssetReportGenerator("Asset Inventory Report")
    
    if format == 'pdf':
        buffer = generator.generate_asset_inventory_report(asset_data, format='pdf')
        filename = f"asset_inventory_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
        media_type = "application/pdf"
    else:
        buffer = generator.generate_asset_inventory_report(asset_data, format='excel')
        filename = f"asset_inventory_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
        media_type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    
    # Log activity
    log_activity(
        db, current_user["user_id"], ActivityType.EXPORTLOGS,
        f"Exported asset inventory report ({format.upper()})"
    )
    
    return StreamingResponse(
        buffer,
        media_type=media_type,
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@app.get("/report/export/depreciation")
def export_depreciation_report(
    format: str = Query("pdf", regex="^(pdf|excel)$"),
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_permission(["view_financial_reports", "generate_reports"]))
):
    """
    Export asset depreciation report
    Format: pdf or excel
    """
    assets = db.query(Asset).filter(Asset.is_deleted == False).all()
    depreciation_data = []
    
    for asset in assets:
        from datetime import datetime as dt
        purchase_date = dt.strptime(asset.purchase_date, "%Y-%m-%d")
        years_old = (dt.now() - purchase_date).days / 365
        
        useful_life = 5
        annual_depreciation = asset.cost / useful_life
        accumulated_depreciation = min(annual_depreciation * years_old, asset.cost)
        current_value = max(asset.cost - accumulated_depreciation, 0)
        
        brand = db.query(Brand).filter(Brand.id == asset.brand_id).first()
        asset_type = db.query(AssetType).filter(AssetType.id == asset.asset_type_id).first()
        dept = db.query(Department).filter(Department.id == asset.department_id).first()
        
        depreciation_data.append({
            "asset_id": asset.id,
            "brand": brand.name if brand else "Unknown",
            "type": asset_type.name if asset_type else "Unknown",
            "department": dept.name if dept else "Unassigned",
            "purchase_cost": asset.cost,
            "current_value": current_value,
            "depreciation": accumulated_depreciation,
            "years_old": years_old
        })
    
    # Generate report
    generator = AssetReportGenerator("Asset Depreciation Report")
    
    if format == 'pdf':
        buffer = generator.generate_depreciation_report(depreciation_data, format='pdf')
        filename = f"depreciation_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
        media_type = "application/pdf"
    else:
        buffer = generator.generate_depreciation_report(depreciation_data, format='excel')
        filename = f"depreciation_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
        media_type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    
    # Log activity
    log_activity(
        db, current_user["user_id"], ActivityType.EXPORTLOGS,
        f"Exported depreciation report ({format.upper()})"
    )
    
    return StreamingResponse(
        buffer,
        media_type=media_type,
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@app.get("/report/export/maintenance")
def export_maintenance_report(
    format: str = Query("pdf", regex="^(pdf|excel)$"),
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    asset_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_permission(["view_reports", "generate_reports"]))
):
    """
    Export maintenance cost report
    Format: pdf or excel
    """
    # Build query
    query = db.query(Maintenance)
    
    # Apply filters
    if start_date:
        query = query.filter(Maintenance.date >= start_date)
    if end_date:
        query = query.filter(Maintenance.date <= end_date)
    if asset_id:
        query = query.filter(Maintenance.asset_id == asset_id)
    
    maintenance_records = query.order_by(Maintenance.date.desc()).all()
    
    # Prepare data
    maintenance_data = []
    for record in maintenance_records:
        technician = db.query(User).filter(User.id == record.performed_by).first() if record.performed_by else None
        
        maintenance_data.append({
            'asset_id': record.asset_id,
            'date': record.date.strftime("%Y-%m-%d %H:%M") if record.date else 'N/A',
            'activity': record.activity,
            'cost': record.cost,
            'technician': technician.email if technician else 'N/A',
            'notes': record.notes or ''
        })
    
    # Generate report
    generator = MaintenanceReportGenerator("Maintenance Cost Report")
    
    if format == 'pdf':
        buffer = generator.generate_maintenance_report(maintenance_data, format='pdf')
        filename = f"maintenance_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
        media_type = "application/pdf"
    else:
        buffer = generator.generate_maintenance_report(maintenance_data, format='excel')
        filename = f"maintenance_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
        media_type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    
    # Log activity
    log_activity(
        db, current_user["user_id"], ActivityType.EXPORTLOGS,
        f"Exported maintenance report ({format.upper()})"
    )
    
    return StreamingResponse(
        buffer,
        media_type=media_type,
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@app.get("/report/export/departments")
def export_department_report(
    format: str = Query("pdf", regex="^(pdf|excel)$"),
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_permission(["view_reports", "generate_reports"]))
):
    """
    Export department summary report
    Format: pdf or excel
    """
    departments = db.query(Department).filter(Department.is_active == True).all()
    
    # Prepare data
    dept_data = []
    for dept in departments:
        assets = db.query(Asset).filter(
            Asset.department_id == dept.id,
            Asset.is_deleted == False
        ).all()
        
        total_cost = sum(asset.cost for asset in assets)
        active_count = sum(1 for asset in assets if asset.status == AssetStatusEnum.ACTIVE)
        utilization_rate = (active_count / len(assets) * 100) if assets else 0
        
        dept_data.append({
            'name': dept.name,
            'code': dept.code,
            'total_assets': len(assets),
            'active_assets': active_count,
            'total_cost': total_cost,
            'utilization_rate': utilization_rate
        })
    
    # Generate report
    generator = DepartmentReportGenerator("Department Summary Report")
    
    if format == 'pdf':
        buffer = generator.generate_department_summary(dept_data, format='pdf')
        filename = f"department_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
        media_type = "application/pdf"
    else:
        buffer = generator.generate_department_summary(dept_data, format='excel')
        filename = f"department_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
        media_type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    
    # Log activity
    log_activity(
        db, current_user["user_id"], ActivityType.EXPORTLOGS,
        f"Exported department summary report ({format.upper()})"
    )
    
    return StreamingResponse(
        buffer,
        media_type=media_type,
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@app.get("/report/export/activity-logs")
def export_activity_logs(
    format: str = Query("pdf", regex="^(pdf|excel)$"),
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    action_type: Optional[ActivityType] = None,
    user_id: Optional[int] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_role([UserRole.ADMIN]))  # Admin only
):
    """
    Export activity logs report (Admin only)
    Format: pdf or excel
    """
    # Build query
    query = db.query(ActivityLog)
    
    # Apply filters
    if start_date:
        query = query.filter(ActivityLog.timestamp >= start_date)
    if end_date:
        query = query.filter(ActivityLog.timestamp <= end_date)
    if action_type:
        query = query.filter(ActivityLog.action_type == action_type)
    if user_id:
        query = query.filter(ActivityLog.user_id == user_id)
    if search:
        query = query.filter(ActivityLog.description.ilike(f"%{search}%"))
    
    activities = query.order_by(ActivityLog.timestamp.desc()).all()
    
    # Prepare data
    activity_data = []
    for activity in activities:
        user = db.query(User).filter(User.id == activity.user_id).first()
        
        activity_data.append({
            'timestamp': activity.timestamp.strftime("%Y-%m-%d %H:%M:%S") if activity.timestamp else 'N/A',
            'user': user.email if user else 'Unknown',
            'action': activity.action_type.value,
            'description': activity.description,
            'asset_id': activity.asset_id or 'N/A',
            'ip_address': activity.ip_address or 'N/A'
        })
    
    # Generate report (using existing report generator logic)
    from io import BytesIO
    from reportlab.lib.pagesizes import letter, landscape
    from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph
    from reportlab.lib.styles import getSampleStyleSheet
    from reportlab.lib import colors
    
    buffer = BytesIO()
    
    if format == 'pdf':
        doc = SimpleDocTemplate(buffer, pagesize=landscape(letter))
        elements = []
        
        styles = getSampleStyleSheet()
        title = Paragraph("Activity Logs Report", styles['Title'])
        elements.append(title)
        
        # Table data
        table_data = [['Date & Time', 'User', 'Action', 'Description', 'Asset ID']]
        for act in activity_data:
            table_data.append([
                act['timestamp'],
                act['user'],
                act['action'],
                act['description'][:50] + '...' if len(act['description']) > 50 else act['description'],
                act['asset_id']
            ])
        
        table = Table(table_data)
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 10),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        elements.append(table)
        
        doc.build(elements)
        buffer.seek(0)
        
        filename = f"activity_logs_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
        media_type = "application/pdf"
    else:
        # Excel format
        import openpyxl
        wb = openpyxl.Workbook()
        ws = wb.active
        ws.title = "Activity Logs"
        
        # Headers
        ws.append(['Date & Time', 'User', 'Action', 'Description', 'Asset ID', 'IP Address'])
        
        # Data
        for act in activity_data:
            ws.append([
                act['timestamp'],
                act['user'],
                act['action'],
                act['description'],
                act['asset_id'],
                act['ip_address']
            ])
        
        wb.save(buffer)
        buffer.seek(0)
        
        filename = f"activity_logs_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
        media_type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    
    # Log activity
    log_activity(
        db, current_user["user_id"], ActivityType.EXPORTLOGS,
        f"Admin exported activity logs report ({format.upper()})"
    )
    
    return StreamingResponse(
        buffer,
        media_type=media_type,
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
    

# ==================== RUN SERVER ====================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)