from typing import Optional
from uuid import UUID
from fastapi import Depends
from auth.roles import Role, get_current_user_role as _get_current_user_role
from auth.jwt import get_current_user

async def get_current_user_role(user = Depends(get_current_user)) -> Role:
    """Get the role of the current user."""
    role = await _get_current_user_role(user)
    if not role:
        raise ValueError("User role not found")
    return role

async def get_current_user_org_id(user = Depends(get_current_user)) -> Optional[UUID]:
    """Get the organization ID of the current user if they are an organization admin."""
    if not user:
        return None
    
    if not hasattr(user, 'organization_id'):
        return None
        
    return user.organization_id 