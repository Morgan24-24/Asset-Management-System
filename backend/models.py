from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Boolean, Text, Enum as SQLEnum
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime
from sqlalchemy import func
import enum

# ==================== ENUMS ====================

class UserRole(str, enum.Enum):
    ADMIN = "Admin"
    MANAGER = "Manager"
    VIEWER = "Viewer"

class AssetStatusEnum(str, enum.Enum):
    AVAILABLE = "Available"
    ACTIVE = "Active"
    UNDER_MAINTENANCE = "Under Maintenance"
    RETIRED = "Retired"

class WarrantyStatusEnum(str, enum.Enum):
    ACTIVE = "Active"
    EXPIRED = "Expired"
    NO_WARRANTY = "No Warranty"

class ActivityType(str, enum.Enum):
    CREATE = "CREATE"
    UPDATE = "UPDATE"
    DELETE = "DELETE"
    ASSIGN = "ASSIGN"
    TRANSFER = "TRANSFER"
    MAINTENANCE = "MAINTENANCE"

# ==================== MODELS ====================

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    company = Column(String, nullable=False)
    role = Column(SQLEnum(UserRole), default=UserRole.VIEWER, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    created_activities = relationship("ActivityLog", foreign_keys="ActivityLog.user_id", back_populates="user")
    notifications = relationship("Notification", back_populates="user")
    asset_assignments = relationship("AssetAssignment", foreign_keys="AssetAssignment.assigned_by_id", back_populates="assigned_by_user", overlaps="assigned_to")
    user_permissions = relationship("UserPermission", foreign_keys="UserPermission.user_id", back_populates="user")

class Department(Base):
    __tablename__ = "departments"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, unique=True)
    code = Column(String, unique=True, nullable=False)
    location = Column(String, nullable=True)
    head_of_department = Column(String, nullable=True)
    contact_email = Column(String, nullable=True)
    contact_phone = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class AssetType(Base):
    __tablename__ = "asset_types"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    assets = relationship("Asset", back_populates="asset_type")

class Brand(Base):
    __tablename__ = "brands"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    assets = relationship("Asset", back_populates="brand_obj")

class Asset(Base):
    __tablename__ = "assets"

    id = Column(String, primary_key=True, index=True)
    asset_type_id = Column(Integer, ForeignKey("asset_types.id"), nullable=False)
    brand_id = Column(Integer, ForeignKey("brands.id"), nullable=False)
    model = Column(String, nullable=False)
    serial = Column(String, unique=True, nullable=False)
    purchase_date = Column(String, nullable=False)
    cost = Column(Float, nullable=False)
    warranty_status = Column(SQLEnum(WarrantyStatusEnum), nullable=False)
    status = Column(SQLEnum(AssetStatusEnum), nullable=False)
    
    # Assignment
    assignee_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=True)
    location = Column(String, nullable=True)
    
    # Soft delete
    is_deleted = Column(Boolean, default=False)
    deleted_at = Column(DateTime(timezone=True), nullable=True)
    deleted_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    asset_type = relationship("AssetType", back_populates="assets")
    brand_obj = relationship("Brand", back_populates="assets")
    assignee = relationship("User", foreign_keys=[assignee_id])
    deleted_by_user = relationship("User", foreign_keys=[deleted_by])
    maintenance_records = relationship("Maintenance", back_populates="asset")
    assignments = relationship("AssetAssignment", back_populates="asset")
    activities = relationship("ActivityLog", back_populates="asset")

class Maintenance(Base):
    __tablename__ = "maintenance"

    id = Column(Integer, primary_key=True, index=True)
    asset_id = Column(String, ForeignKey("assets.id"), nullable=False)
    date = Column(DateTime, default=datetime.utcnow)
    activity = Column(String, nullable=False)
    cost = Column(Float, default=0.0)
    notes = Column(Text, nullable=True)
    performed_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Relationships
    asset = relationship("Asset", back_populates="maintenance_records")
    technician = relationship("User")

class SoftwareLicense(Base):
    __tablename__ = "software_licenses"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    vendor = Column(String, nullable=False)
    license_key = Column(String, unique=True, nullable=False)
    purchase_date = Column(String, nullable=False)
    expiry_date = Column(String, nullable=False)
    cost = Column(Float, nullable=False)
    assigned_to_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=True)
    status = Column(String, nullable=False)
    
    # Relationships
    assigned_to = relationship("User")

class AssetAssignment(Base):
    """Tracks asset transfers between users"""
    __tablename__ = "asset_assignments"
    
    id = Column(Integer, primary_key=True, index=True)
    asset_id = Column(String, ForeignKey("assets.id"), nullable=False)
    assigned_to_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    assigned_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    assigned_date = Column(DateTime(timezone=True), server_default=func.now())
    returned_date = Column(DateTime(timezone=True), nullable=True)
    notes = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    
    # Relationships - specify foreign_keys explicitly
    asset = relationship("Asset", back_populates="assignments")
    assigned_to = relationship("User", foreign_keys=[assigned_to_id], overlaps="assigned_by_user")
    assigned_by_user = relationship("User", foreign_keys=[assigned_by_id], back_populates="asset_assignments", overlaps="assigned_to")

class ActivityLog(Base):
    """Audit trail for all actions"""
    __tablename__ = "activity_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    action_type = Column(SQLEnum(ActivityType), nullable=False)
    asset_id = Column(String, ForeignKey("assets.id"), nullable=True)
    description = Column(Text, nullable=False)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    ip_address = Column(String, nullable=True)
    
    # Relationships
    user = relationship("User", foreign_keys=[user_id], back_populates="created_activities")
    asset = relationship("Asset", back_populates="activities")

class Notification(Base):
    """User notifications"""
    __tablename__ = "notifications"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="notifications")

class Permission(Base):
    """Define available permissions in the system"""
    __tablename__ = "permissions"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)  # e.g., "view_assets"
    description = Column(String, nullable=False)
    category = Column(String, nullable=False)  # "Assets", "Reports", "Users", etc.
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user_permissions = relationship("UserPermission", back_populates="permission")

class UserPermission(Base):
    """Link users to their specific permissions"""
    __tablename__ = "user_permissions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    permission_id = Column(Integer, ForeignKey("permissions.id"), nullable=False)
    granted_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    granted_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User", foreign_keys=[user_id], back_populates="user_permissions")
    permission = relationship("Permission", back_populates="user_permissions")
    granted_by_user = relationship("User", foreign_keys=[granted_by])