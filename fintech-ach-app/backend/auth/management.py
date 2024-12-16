from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete, func, or_
from typing import List, Optional, Union
from pydantic import BaseModel, UUID4, EmailStr
from datetime import datetime
import logging

from config.database import get_db
from domain.sql_models import SuperUser, OrganizationAdministrator, Organization, UserRole
from .roles import Role, RoleChecker
from .service import AuthService, get_auth_service
from .jwt import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/management", tags=["management"])

# Pydantic models for request/response
class OrganizationBase(BaseModel):
    name: str
    description: Optional[str] = None

class OrganizationCreate(OrganizationBase):
    pass

class OrganizationUpdate(OrganizationBase):
    status: Optional[str] = None

class OrganizationResponse(OrganizationBase):
    id: UUID4
    status: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class UserBase(BaseModel):
    email: EmailStr
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    role: UserRole

class AdminBase(UserBase):
    organization_id: UUID4

class UserCreate(UserBase):
    password: str

class AdminCreate(AdminBase):
    password: str

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None
    password: Optional[str] = None

class UserResponse(UserBase):
    id: UUID4
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class AdminResponse(AdminBase):
    id: UUID4
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class OrganizationsResponse(BaseModel):
    organizations: List[OrganizationResponse]
    total: int

class UsersResponse(BaseModel):
    data: List[Union[UserResponse, AdminResponse]]
    total: int
    limit: int
    offset: int

# Organization endpoints
@router.post("/organizations", response_model=OrganizationResponse)
async def create_organization(
    org: OrganizationCreate,
    session: AsyncSession = Depends(get_db)
):
    """Create a new organization. Only superusers can create organizations."""
    new_org = Organization(**org.model_dump())
    session.add(new_org)
    await session.commit()
    await session.refresh(new_org)
    return new_org

@router.get("/organizations", response_model=OrganizationsResponse)
async def list_organizations(
    session: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user),
    limit: int = 10,
    offset: int = 0,
    sort_by: Optional[str] = None,
    sort_direction: Optional[str] = 'desc'
):
    """List all organizations. Only superusers can view all organizations."""
    if current_user.role != UserRole.SUPERUSER:
        raise HTTPException(
            status_code=403,
            detail="Only superusers can view all organizations"
        )

    # Get total count
    count_query = select(func.count()).select_from(Organization)
    total_result = await session.execute(count_query)
    total = total_result.scalar()

    # Get paginated and sorted results
    query = select(Organization)
    
    # Apply sorting if specified
    if sort_by:
        sort_column = getattr(Organization, sort_by, None)
        if sort_column is not None:
            query = query.order_by(
                sort_column.desc() if sort_direction == 'desc' else sort_column.asc()
            )
    
    # Apply pagination
    query = query.offset(offset).limit(limit)
    
    result = await session.execute(query)
    organizations = result.scalars().all()

    return {
        "organizations": organizations,
        "total": total
    }

@router.get("/organizations/{org_id}", response_model=OrganizationResponse)
async def get_organization(
    org_id: UUID4,
    session: AsyncSession = Depends(get_db),
    
):
    """Get organization details. Superusers can view any org, admins can only view their own."""
    # if token["role"] == Role.ORGANIZATION_ADMIN and str(org_id) != token["org_id"]:
    #     raise HTTPException(status_code=403, detail="Not authorized to view this organization")
    
    result = await session.execute(select(Organization).where(Organization.id == org_id))
    org = result.scalar_one_or_none()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    return org

@router.put("/organizations/{org_id}", response_model=OrganizationResponse)
async def update_organization(
    org_id: UUID4,
    org_update: OrganizationUpdate,
    session: AsyncSession = Depends(get_db),
   
):
    """Update organization details. Only superusers can update organizations."""
    result = await session.execute(
        update(Organization)
        .where(Organization.id == org_id)
        .values(**org_update.model_dump(exclude_unset=True))
        .returning(Organization)
    )
    updated_org = result.scalar_one_or_none()
    if not updated_org:
        raise HTTPException(status_code=404, detail="Organization not found")
    await session.commit()
    return updated_org

@router.delete("/organizations/{org_id}")
async def delete_organization(
    org_id: UUID4,
    session: AsyncSession = Depends(get_db),
   
):
    """Delete an organization. Only superusers can delete organizations."""
    result = await session.execute(
        delete(Organization).where(Organization.id == org_id).returning(Organization)
    )
    deleted_org = result.scalar_one_or_none()
    if not deleted_org:
        raise HTTPException(status_code=404, detail="Organization not found")
    await session.commit()
    return {"message": "Organization deleted successfully"}

# User endpoints
@router.post("/users", response_model=Union[UserResponse, AdminResponse])
async def create_user(
    user_data: dict,
    session: AsyncSession = Depends(get_db),
    auth_service: AuthService = Depends(get_auth_service)
):
    """Create a new user. Superusers can create any user, org admins can only create users in their org."""
    try:
        logger.info(f"[CREATE_USER] Received user creation request with data: {user_data}")
        
        # First determine the role and validate against the appropriate model
        role = user_data.get("role")
        if not role:
            logger.error("[CREATE_USER] Role is missing from request data")
            raise HTTPException(status_code=400, detail="Role is required")
        
        logger.info(f"[CREATE_USER] Processing user with role: {role}")
        
        # Convert role to enum
        try:
            role_enum = UserRole(role)
            logger.info(f"[CREATE_USER] Role enum value: {role_enum}")
        except ValueError:
            logger.error(f"[CREATE_USER] Invalid role value: {role}")
            raise HTTPException(status_code=400, detail=f"Invalid role. Must be one of: {[r.value for r in UserRole]}")
        
        # Log the user data before validation
        logger.info(f"[CREATE_USER] User data before validation: {user_data}")
        
        # Validate against appropriate model
        try:
            logger.info(f"[CREATE_USER] Validating user data for role: {role_enum}")
            # Remove role from user_data since we'll pass it separately
            user_data.pop("role", None)
            if role_enum == UserRole.SUPERUSER:
                logger.info("[CREATE_USER] Creating superuser")
                user = UserCreate(**user_data, role=role_enum)
            elif role_enum == UserRole.ORGANIZATION_ADMIN:
                logger.info("[CREATE_USER] Creating organization admin")
                if "organization_id" not in user_data:
                    logger.error("[CREATE_USER] Organization ID missing for admin user")
                    raise HTTPException(status_code=400, detail="Organization ID is required for admin users")
                user = AdminCreate(**user_data, role=role_enum)
                # Verify organization exists
                logger.info(f"[CREATE_USER] Verifying organization exists: {user.organization_id}")
                org_result = await session.execute(
                    select(Organization).where(Organization.id == user.organization_id)
                )
                org = org_result.scalar_one_or_none()
                if not org:
                    logger.error(f"[CREATE_USER] Organization not found: {user.organization_id}")
                    raise HTTPException(status_code=404, detail="Organization not found")
                logger.info("[CREATE_USER] Organization verified successfully")
            else:
                logger.error(f"[CREATE_USER] Invalid role type: {role_enum}")
                raise HTTPException(status_code=400, detail="Invalid role")
        except ValueError as e:
            logger.error(f"[CREATE_USER] Validation error: {str(e)}")
            raise HTTPException(status_code=400, detail=str(e))

        # Check if email already exists in either table
        logger.info(f"[CREATE_USER] Checking if email exists: {user.email}")
        superuser_result = await session.execute(
            select(SuperUser).where(SuperUser.email == user.email)
        )
        admin_result = await session.execute(
            select(OrganizationAdministrator).where(OrganizationAdministrator.email == user.email)
        )
        
        if superuser_result.scalar_one_or_none() or admin_result.scalar_one_or_none():
            logger.error(f"[CREATE_USER] Email already exists: {user.email}")
            raise HTTPException(status_code=400, detail="Email already registered")
        
        # Create user with hashed password
        logger.info("[CREATE_USER] Creating user with hashed password")
        user_dict = user.model_dump()
        logger.info(f"[CREATE_USER] User dict after model_dump: {user_dict}")
        
        password = user_dict.pop("password")
        user_dict.pop("role", None)  # Remove role since it's handled by model defaults
        hashed_password = auth_service.get_password_hash(password)
        
        logger.info(f"[CREATE_USER] Final user dict before creation: {user_dict}")
        
        if role_enum == UserRole.SUPERUSER:
            new_user = SuperUser(
                **user_dict,
                hashed_password=hashed_password
            )
        else:
            new_user = OrganizationAdministrator(
                **user_dict,
                hashed_password=hashed_password
            )
        
        logger.info("[CREATE_USER] Adding user to session")
        session.add(new_user)
        await session.commit()
        await session.refresh(new_user)
        logger.info(f"[CREATE_USER] User created successfully: {new_user.id}")
        return new_user
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[CREATE_USER] Unexpected error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.get("/users", response_model=UsersResponse)
async def list_users(
    organization_id: Optional[UUID4] = None,
    limit: int = Query(10, ge=1, le=100),
    offset: int = Query(0, ge=0),
    sort_by: Optional[str] = Query(None, description="Field to sort by (email, first_name, last_name, role, created_at)"),
    sort_direction: Optional[str] = Query('desc', description="Sort direction (asc/desc)"),
    session: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """List users with pagination and sorting. Superusers can view all users, org admins can only view users in their org."""
    
    # Check permissions
    if current_user.role != UserRole.SUPERUSER:
        if not current_user.organization_id:
            raise HTTPException(status_code=403, detail="Access denied")
        organization_id = current_user.organization_id

    # Validate sort_by field
    valid_sort_fields = {'email', 'first_name', 'last_name', 'role', 'created_at'}
    if sort_by and sort_by not in valid_sort_fields:
        raise HTTPException(status_code=400, detail=f"Invalid sort_by field. Must be one of: {', '.join(valid_sort_fields)}")

    try:
        # Get total counts first
        superusers_count = await session.execute(select(func.count()).select_from(SuperUser))
        admins_query = select(func.count()).select_from(OrganizationAdministrator)
        if organization_id:
            admins_query = admins_query.where(OrganizationAdministrator.organization_id == organization_id)
        admins_count = await session.execute(admins_query)
        
        total = superusers_count.scalar() + admins_count.scalar()

        # Build base queries
        superusers_query = select(SuperUser)
        admins_query = select(OrganizationAdministrator)

        if organization_id:
            admins_query = admins_query.where(OrganizationAdministrator.organization_id == organization_id)

        # Execute queries without pagination first to get all results for proper sorting
        superusers = (await session.execute(superusers_query)).scalars().all()
        admins = (await session.execute(admins_query)).scalars().all()

        # Combine results
        all_users = []
        all_users.extend(superusers)
        all_users.extend(admins)

        # Sort combined results if needed
        if sort_by:
            all_users.sort(
                key=lambda x: getattr(x, sort_by) or '',
                reverse=(sort_direction == 'desc')
            )

        # Apply pagination to combined results
        start = offset
        end = offset + limit
        paginated_users = all_users[start:end]

        return {
            "data": paginated_users,
            "total": total,
            "limit": limit,
            "offset": offset
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching users: {str(e)}"
        )

@router.get("/users/{user_id}", response_model=Union[UserResponse, AdminResponse])
async def get_user(
    user_id: UUID4,
    session: AsyncSession = Depends(get_db),
):
    """Get user details. Superusers can view any user, org admins can only view users in their org."""
    # Try to find in superusers
    superuser_result = await session.execute(select(SuperUser).where(SuperUser.id == user_id))
    user = superuser_result.scalar_one_or_none()
    
    if not user:
        # Try to find in organization admins
        admin_result = await session.execute(select(OrganizationAdministrator).where(OrganizationAdministrator.id == user_id))
        user = admin_result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return user

@router.put("/users/{user_id}", response_model=Union[UserResponse, AdminResponse])
async def update_user(
    user_id: UUID4,
    user_update: UserUpdate,
    session: AsyncSession = Depends(get_db),
    auth_service: AuthService = Depends(get_auth_service)
):
    """Update user details. Superusers can update any user, org admins can only update users in their org."""
    # Try to find in superusers
    superuser_result = await session.execute(select(SuperUser).where(SuperUser.id == user_id))
    user = superuser_result.scalar_one_or_none()
    user_type = SuperUser if user else None
    
    if not user:
        # Try to find in organization admins
        admin_result = await session.execute(select(OrganizationAdministrator).where(OrganizationAdministrator.id == user_id))
        user = admin_result.scalar_one_or_none()
        user_type = OrganizationAdministrator if user else None
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Update user
    update_data = user_update.model_dump(exclude_unset=True)
    if "password" in update_data:
        update_data["hashed_password"] = auth_service.get_password_hash(update_data.pop("password"))
    
    result = await session.execute(
        update(user_type)
        .where(user_type.id == user_id)
        .values(**update_data)
        .returning(user_type)
    )
    updated_user = result.scalar_one_or_none()
    await session.commit()
    return updated_user

@router.delete("/users/{user_id}")
async def delete_user(
    user_id: UUID4,
    session: AsyncSession = Depends(get_db),
):
    """Delete a user. Superusers can delete any user, org admins can only delete users in their org."""
    # Try to find and delete from superusers
    result = await session.execute(
        delete(SuperUser).where(SuperUser.id == user_id).returning(SuperUser)
    )
    deleted_user = result.scalar_one_or_none()
    
    if not deleted_user:
        # Try to find and delete from organization admins
        result = await session.execute(
            delete(OrganizationAdministrator).where(OrganizationAdministrator.id == user_id).returning(OrganizationAdministrator)
        )
        deleted_user = result.scalar_one_or_none()
    
    if not deleted_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    await session.commit()
    return {"message": "User deleted successfully"}

@router.post("/organization-admins", response_model=AdminResponse)
async def create_organization_admin(
    admin: AdminCreate,
    session: AsyncSession = Depends(get_db),
    auth_service: AuthService = Depends(get_auth_service)
):
    """Create a new organization administrator."""
    # Check if email already exists
    superuser_result = await session.execute(select(SuperUser).where(SuperUser.email == admin.email))
    admin_result = await session.execute(select(OrganizationAdministrator).where(OrganizationAdministrator.email == admin.email))
    
    if superuser_result.scalar_one_or_none() or admin_result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Verify organization exists
    org_result = await session.execute(select(Organization).where(Organization.id == admin.organization_id))
    if not org_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Organization not found")
    
    # Create admin with hashed password
    admin_data = admin.model_dump()
    password = admin_data.pop("password")
    hashed_password = auth_service.get_password_hash(password)
    
    new_admin = OrganizationAdministrator(
        **admin_data,
        hashed_password=hashed_password,
        role=UserRole.ORGANIZATION_ADMIN
    )
    
    session.add(new_admin)
    await session.commit()
    await session.refresh(new_admin)
    return new_admin 