from pydantic import BaseModel, EmailStr, Field
from datetime import date, datetime
from typing import Optional, List
from enum import Enum

# ==================== ENUMS ====================

class UserRole(str, Enum):
    ADMIN = "Admin"
    MANAGER = "Manager"
    VIEWER = "Viewer"

class AssetStatusEnum(str, Enum):
    AVAILABLE = "Available"
    ACTIVE = "Active"
    UNDER_MAINTENANCE = "Under Maintenance"
    RETIRED = "Retired"

class WarrantyStatusEnum(str, Enum):
    ACTIVE = "Active"
    EXPIRED = "Expired"
    NO_WARRANTY = "No Warranty"

class ActivityType(str, Enum):
    CREATE = "CREATE"
    UPDATE = "UPDATE"
    DELETE = "DELETE"
    ASSIGN = "ASSIGN"
    TRANSFER = "TRANSFER"
    MAINTENANCE = "MAINTENANCE"

# ==================== USER SCHEMAS ====================

class UserBase(BaseModel):
    email: EmailStr
    company: str
    role: UserRole

class UserCreate(BaseModel):
    email: EmailStr
    company: str
    role: UserRole
    password: str

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    company: Optional[str] = None
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None

class UserResponse(UserBase):
    id: int
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

# ==================== DEPARTMENT SCHEMAS ====================

class DepartmentBase(BaseModel):
    name: str
    code: str
    location: Optional[str] = None
    head_of_department: Optional[str] = None  
    contact_email: Optional[str] = None        
    contact_phone: Optional[str] = None  

class DepartmentCreate(DepartmentBase):
    pass

class DepartmentUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    location: Optional[str] = None
    head_of_department: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None

class DepartmentResponse(DepartmentBase):
    id: int
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

# ==================== ASSET TYPE SCHEMAS ====================

class AssetTypeBase(BaseModel):
    name: str
    description: Optional[str] = None

class AssetTypeCreate(AssetTypeBase):
    pass

class AssetTypeResponse(AssetTypeBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

# ==================== BRAND SCHEMAS ====================

class BrandBase(BaseModel):
    name: str

class BrandCreate(BrandBase):
    pass

class BrandResponse(BrandBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

# ==================== ASSET SCHEMAS ====================

class AssetCreate(BaseModel):
    asset_type_id: int
    brand_id: int
    model: str
    serial: str
    purchase_date: date
    cost: float
    warranty_status: WarrantyStatusEnum
    status: AssetStatusEnum
    assignee_id: Optional[int] = None
    department_id: Optional[int] = None
    location: Optional[str] = None

class AssetUpdate(BaseModel):
    asset_type_id: Optional[int] = None
    brand_id: Optional[int] = None
    model: Optional[str] = None
    warranty_status: Optional[WarrantyStatusEnum] = None
    status: Optional[AssetStatusEnum] = None
    assignee_id: Optional[int] = None
    department_id: Optional[int] = None
    location: Optional[str] = None

class AssetResponse(BaseModel):
    id: str
    asset_type_id: int
    brand_id: int
    model: str
    serial: str
    purchase_date: str
    cost: float
    warranty_status: WarrantyStatusEnum
    status: AssetStatusEnum
    assignee_id: Optional[int]
    department_id: Optional[int]
    location: Optional[str]
    is_deleted: bool
    created_at: datetime
    updated_at: Optional[datetime]
    
    class Config:
        from_attributes = True

# ==================== MAINTENANCE SCHEMAS ====================

class MaintenanceCreate(BaseModel):
    asset_id: str
    activity: str
    cost: float = 0.0
    notes: Optional[str] = None

class MaintenanceResponse(BaseModel):
    id: int
    asset_id: str
    date: datetime
    activity: str
    cost: float
    notes: Optional[str]
    performed_by: Optional[int]
    
    class Config:
        from_attributes = True

# ==================== LICENSE SCHEMAS ====================

class SoftwareLicenseCreate(BaseModel):
    name: str
    vendor: str
    license_key: str
    purchase_date: str
    expiry_date: str
    cost: float
    assigned_to_id: Optional[int] = None
    department_id: Optional[int] = None
    status: str

class SoftwareLicenseResponse(BaseModel):
    id: int
    name: str
    vendor: str
    license_key: str
    purchase_date: str
    expiry_date: str
    cost: float
    assigned_to_id: Optional[int]
    department_id: Optional[int]
    status: str
    
    class Config:
        from_attributes = True

# ==================== ASSET ASSIGNMENT SCHEMAS ====================

class AssetAssignmentCreate(BaseModel):
    asset_id: str
    assigned_to_id: int
    notes: Optional[str] = None

class AssetAssignmentResponse(BaseModel):
    id: int
    asset_id: str
    assigned_to_id: int
    assigned_by_id: int
    assigned_date: datetime
    returned_date: Optional[datetime]
    notes: Optional[str]
    is_active: bool
    
    class Config:
        from_attributes = True

# ==================== ACTIVITY LOG SCHEMAS ====================

class ActivityLogCreate(BaseModel):
    action_type: ActivityType
    asset_id: Optional[str] = None
    description: str

class ActivityLogResponse(BaseModel):
    id: int
    user_id: int
    action_type: ActivityType
    asset_id: Optional[str]
    description: str
    timestamp: datetime
    
    class Config:
        from_attributes = True

# ==================== NOTIFICATION SCHEMAS ====================

class NotificationCreate(BaseModel):
    user_id: int
    title: str
    message: str

class NotificationResponse(BaseModel):
    id: int
    user_id: int
    title: str
    message: str
    is_read: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

# ==================== PERMISSION SCHEMAS ====================

class PermissionBase(BaseModel):
    name: str
    description: str
    category: str

class PermissionCreate(PermissionBase):
    pass

class PermissionResponse(PermissionBase):
    id: int
    
    class Config:
        from_attributes = True

class UserPermissionCreate(BaseModel):
    user_id: int
    permission_id: int

class UserPermissionResponse(BaseModel):
    id: int
    user_id: int
    permission_id: int
    granted_by: Optional[int]
    granted_at: datetime
    
    class Config:
        from_attributes = True

class UserWithPermissions(UserResponse):
    permissions: List[str] = []  # List of permission names


# ==================== PERMISSION BULK UPDATE SCHEMA ====================

class PermissionBulkUpdate(BaseModel):
    permission_ids: List[int]