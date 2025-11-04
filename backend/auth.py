from datetime import datetime, timedelta
from typing import Optional, List
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session
from database import get_db

# Import schemas from schemas.py
from schemas import UserCreate, UserLogin, Token, TokenData, UserResponse as UserSchema

# Security configurations
SECRET_KEY = "77fe9ecd073a63782b0a5a99c9b3b9ac22e0342cb5124803077fbb7811b4a3b2"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

# Password utilities
def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain password against a hashed password"""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Hash a password"""
    return pwd_context.hash(password)

# JWT token utilities
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create a JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str):
    """Decode and verify a JWT token"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            return None
        return TokenData(email=email)
    except JWTError:
        return None

# Authentication dependencies
async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    """Get the current authenticated user"""
    from models import User  # Import here to avoid circular imports
    
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    token_data = decode_access_token(token)
    if token_data is None:
        raise credentials_exception
    
    user = db.query(User).filter(User.email == token_data.email).first()
    if user is None:
        raise credentials_exception
    
    return {"email": user.email, "role": user.role, "id": user.id, "user_id": user.id}

def get_user_permissions(db: Session, user_id: int) -> List[str]:
    """Get list of permission names for a user"""
    from models import UserPermission, Permission
    
    user_permissions = db.query(Permission.name).join(
        UserPermission, UserPermission.permission_id == Permission.id
    ).filter(UserPermission.user_id == user_id).all()
    
    return [perm[0] for perm in user_permissions]

def require_permission(required_permissions: List[str]):
    """
    Dependency to check if user has required permissions
    Usage: current_user = Depends(require_permission(["view_assets", "edit_assets"]))
    """
    async def permission_checker(
        current_user: dict = Depends(get_current_user),
        db: Session = Depends(get_db)
    ):
        from models import User, UserRole
        
        # Get user from database
        user = db.query(User).filter(User.id == current_user["user_id"]).first()
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Admins have all permissions automatically
        if user.role == UserRole.ADMIN:
            return current_user
        
        # Get user's permissions
        user_perms = get_user_permissions(db, user.id)
        
        # Check if user has at least one of the required permissions
        has_permission = any(perm in user_perms for perm in required_permissions)
        
        if not has_permission:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required permissions: {required_permissions}"
            )
        
        return current_user
    
    return permission_checker

def require_any_permission(required_permissions: List[str]):
    """
    Check if user has ANY of the required permissions (OR logic)
    """
    return require_permission(required_permissions)

def require_all_permissions(required_permissions: List[str]):
    """
    Check if user has ALL of the required permissions (AND logic)
    """
    async def permission_checker(
        current_user: dict = Depends(get_current_user),
        db: Session = Depends(get_db)
    ):
        from models import User, UserRole
        
        user = db.query(User).filter(User.id == current_user["user_id"]).first()
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Admins have all permissions
        if user.role == UserRole.ADMIN:
            return current_user
        
        # Get user's permissions
        user_perms = get_user_permissions(db, user.id)
        
        # Check if user has ALL required permissions
        has_all = all(perm in user_perms for perm in required_permissions)
        
        if not has_all:
            missing = [perm for perm in required_permissions if perm not in user_perms]
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Missing permissions: {missing}"
            )
        
        return current_user
    
    return permission_checker

# Export schemas so they can be imported from auth
__all__ = [
    'UserCreate', 'UserLogin', 'Token', 'UserSchema', 'TokenData',
    'get_password_hash', 'verify_password', 'create_access_token', 
    'get_current_user', 'get_user_permissions', 'require_permission',
    'require_any_permission', 'require_all_permissions',
    'ACCESS_TOKEN_EXPIRE_MINUTES'
]