from enum import Enum
from typing import List, Optional
from fastapi import HTTPException, Request, status, Depends
from .jwt import verify_token, get_current_user

class Role(str, Enum):
    SUPERUSER = "superuser"
    ORGANIZATION_ADMIN = "organization_admin"

def check_role(allowed_roles: List[Role]):
    async def role_checker(user = Depends(get_current_user)):
        if not user or not hasattr(user, 'role') or user.role not in [role.value for role in allowed_roles]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions"
            )
        return True
    return role_checker

class RoleChecker:
    def __init__(self, allowed_roles: List[Role]):
        self.allowed_roles = allowed_roles

    async def __call__(self, user = Depends(get_current_user)):
        if not user or not hasattr(user, 'role'):
            raise HTTPException(
                status_code=401,
                detail="No role found for user"
            )
        
        try:
            user_role = Role(user.role)
        except ValueError:
            raise HTTPException(
                status_code=401,
                detail=f"Invalid role: {user.role}"
            )
            
        if user_role not in self.allowed_roles:
            raise HTTPException(
                status_code=403,
                detail=f"Role {user.role} not allowed. Must be one of {[r.value for r in self.allowed_roles]}"
            )
        
        return user

async def get_current_user_role(user = Depends(get_current_user)) -> Optional[Role]:
    if not user or not hasattr(user, 'role'):
        return None
    try:
        return Role(user.role)
    except ValueError:
        return None
    
