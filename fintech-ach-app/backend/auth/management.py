from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete, func, or_
from sqlalchemy.orm import joinedload
from typing import List, Optional, Union
from pydantic import BaseModel, UUID4, EmailStr, validator
from datetime import datetime
import logging

from config.database import get_db
from domain.sql_models import (
    SuperUser, 
    OrganizationAdministrator, 
    Organization, 
    UserRole, 
    ExternalOrganizationBankAccount,
    InternalOrganizationBankAccount,
    Payment
)
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
    role: str

    @validator('role')
    def validate_role(cls, v):
        # Convert role to uppercase
        upper_role = v.upper()
        if upper_role not in ['SUPERUSER', 'ORGANIZATION_ADMIN']:
            raise ValueError('Role must be either SUPERUSER or ORGANIZATION_ADMIN')
        return upper_role

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
    role: Optional[str] = None
    is_active: Optional[bool] = None
    password: Optional[str] = None

    @validator('role')
    def validate_role(cls, v):
        if v is not None:
            upper_role = v.upper()
            if upper_role not in ['SUPERUSER', 'ORGANIZATION_ADMIN']:
                raise ValueError('Role must be either SUPERUSER or ORGANIZATION_ADMIN')
            return upper_role
        return v

class UserResponse(UserBase):
    id: UUID4
    created_at: datetime
    updated_at: Optional[datetime] = None
    organization: Optional[dict] = None

    class Config:
        from_attributes = True

class AdminResponse(AdminBase):
    id: UUID4
    created_at: datetime
    updated_at: Optional[datetime] = None
    organization: Optional[dict] = None

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
    """Delete an organization and all its associated data. Only superusers can delete organizations."""
    try:
        logger.info(f"[DELETE_ORGANIZATION] Starting deletion process for organization {org_id}")

        # Get all external bank accounts for this organization
        logger.debug(f"[DELETE_ORGANIZATION] Fetching external bank accounts for org {org_id}")
        ext_accounts_result = await session.execute(
            select(ExternalOrganizationBankAccount.uuid).where(
                ExternalOrganizationBankAccount.organization_id == org_id
            )
        )
        ext_account_ids = [row[0] for row in ext_accounts_result]
        logger.info(f"[DELETE_ORGANIZATION] Found {len(ext_account_ids)} external bank accounts")

        # Get all internal bank accounts for this organization
        logger.debug(f"[DELETE_ORGANIZATION] Fetching internal bank accounts for org {org_id}")
        int_accounts_result = await session.execute(
            select(InternalOrganizationBankAccount.uuid).where(
                InternalOrganizationBankAccount.uuid.in_(
                    select(Payment.to_account).where(
                        Payment.from_account.in_(ext_account_ids)
                    )
                )
            )
        )
        int_account_ids = [row[0] for row in int_accounts_result]
        logger.info(f"[DELETE_ORGANIZATION] Found {len(int_account_ids)} internal bank accounts")

        try:
            # First, delete all payments associated with these accounts
            if ext_account_ids:
                logger.debug("[DELETE_ORGANIZATION] Deleting payments for external accounts")
                await session.execute(
                    delete(Payment).where(
                        or_(
                            Payment.from_account.in_(ext_account_ids),
                            Payment.to_account.in_(ext_account_ids)
                        )
                    )
                )

            if int_account_ids:
                logger.debug("[DELETE_ORGANIZATION] Deleting payments for internal accounts")
                await session.execute(
                    delete(Payment).where(
                        or_(
                            Payment.from_account.in_(int_account_ids),
                            Payment.to_account.in_(int_account_ids)
                        )
                    )
                )

            # Then delete the bank accounts
            if ext_account_ids:
                logger.debug("[DELETE_ORGANIZATION] Deleting external bank accounts")
                await session.execute(
                    delete(ExternalOrganizationBankAccount).where(
                        ExternalOrganizationBankAccount.organization_id == org_id
                    )
                )

            if int_account_ids:
                logger.debug("[DELETE_ORGANIZATION] Deleting internal bank accounts")
                await session.execute(
                    delete(InternalOrganizationBankAccount).where(
                        InternalOrganizationBankAccount.uuid.in_(int_account_ids)
                    )
                )

            # Delete all organization administrators
            logger.debug("[DELETE_ORGANIZATION] Deleting organization administrators")
            await session.execute(
                delete(OrganizationAdministrator).where(
                    OrganizationAdministrator.organization_id == org_id
                )
            )

            # Finally delete the organization
            logger.debug("[DELETE_ORGANIZATION] Deleting organization")
            result = await session.execute(
                delete(Organization).where(Organization.id == org_id).returning(Organization)
            )
            deleted_org = result.scalar_one_or_none()
            
            if not deleted_org:
                logger.error(f"[DELETE_ORGANIZATION] Organization {org_id} not found")
                raise HTTPException(status_code=404, detail="Organization not found")
            
            await session.commit()
            logger.info(f"[DELETE_ORGANIZATION] Successfully deleted organization {org_id} and all associated data")
            return {"message": "Organization and all associated data deleted successfully"}
            
        except Exception as inner_e:
            logger.error(f"[DELETE_ORGANIZATION] Error during deletion operations: {str(inner_e)}", exc_info=True)
            raise
            
    except HTTPException:
        await session.rollback()
        raise
    except Exception as e:
        logger.error(f"[DELETE_ORGANIZATION] Unexpected error: {str(e)}", exc_info=True)
        await session.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete organization: {str(e)}"
        )

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
            # Normalize role string
            role = role.upper().replace('_', '')
            if role == 'SUPERUSER':
                role_enum = UserRole.SUPERUSER
            elif role in ['ORGANIZATIONADMIN', 'ORGADMIN']:
                role_enum = UserRole.ORGANIZATION_ADMIN
            else:
                raise ValueError(f"Invalid role: {role}")
                
            logger.info(f"[CREATE_USER] Role enum value: {role_enum}")
            
            # Update role in user_data with the string value expected by the model
            user_data["role"] = role_enum.value
            
            # Validate against appropriate model
            try:
                logger.info(f"[CREATE_USER] Validating user data for role: {role_enum}")
                if role_enum == UserRole.SUPERUSER:
                    logger.info("[CREATE_USER] Creating superuser")
                    user = UserCreate(**user_data)
                elif role_enum == UserRole.ORGANIZATION_ADMIN:
                    logger.info("[CREATE_USER] Creating organization admin")
                    if "organization_id" not in user_data:
                        logger.error("[CREATE_USER] Organization ID missing for admin user")
                        raise HTTPException(status_code=400, detail="Organization ID is required for admin users")
                    user = AdminCreate(**user_data)
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
                raise HTTPException(
                    status_code=400,
                    detail=f"Email already registered: {user.email}. Please use a different email address."
                )
            
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
                    hashed_password=hashed_password,
                    role=role_enum
                )
                session.add(new_user)
                await session.commit()
                await session.refresh(new_user)
                return new_user
            else:
                new_user = OrganizationAdministrator(
                    **user_dict,
                    hashed_password=hashed_password,
                    role=role_enum
                )
                session.add(new_user)
                await session.commit()
                
                # Reload the user with organization relationship
                result = await session.execute(
                    select(OrganizationAdministrator)
                    .options(joinedload(OrganizationAdministrator.organization))
                    .where(OrganizationAdministrator.id == new_user.id)
                )
                loaded_user = result.unique().scalar_one()
                
                # Format the response
                return {
                    'id': str(loaded_user.id),
                    'email': loaded_user.email,
                    'first_name': loaded_user.first_name,
                    'last_name': loaded_user.last_name,
                    'role': loaded_user.role.upper() if loaded_user.role else None,
                    'organization_id': str(loaded_user.organization_id) if loaded_user.organization_id else None,
                    'created_at': loaded_user.created_at,
                    'updated_at': loaded_user.updated_at,
                    'organization': {
                        'id': str(loaded_user.organization.id),
                        'name': loaded_user.organization.name,
                        'description': loaded_user.organization.description,
                        'status': loaded_user.organization.status,
                        'created_at': loaded_user.organization.created_at,
                        'updated_at': loaded_user.organization.updated_at
                    } if loaded_user.organization else None
                }
            
        except ValueError as e:
            logger.error(f"[CREATE_USER] Role conversion error: {str(e)}")
            raise HTTPException(status_code=400, detail=f"Invalid role. Must be one of: {[r.value for r in UserRole]}")
            
    except HTTPException:
        await session.rollback()
        raise
    except Exception as e:
        logger.error(f"[CREATE_USER] Unexpected error: {str(e)}", exc_info=True)
        await session.rollback()
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.get("/users", response_model=UsersResponse)
async def list_users(
    organization_id: Optional[UUID4] = None,
    limit: int = Query(10, ge=1, le=100),
    offset: int = Query(0, ge=0),
    sort_by: Optional[str] = Query(None, description="Field to sort by (email, first_name, last_name, role, created_at, organization)"),
    sort_direction: Optional[str] = Query('desc', description="Sort direction (asc/desc)"),
    session: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """List users with pagination and sorting. Superusers can view all users, org admins can only view users in their org."""
    logger.info(f"[LIST_USERS] Starting list_users request. Params: limit={limit}, offset={offset}, sort_by={sort_by}, sort_direction={sort_direction}")
    logger.info(f"[LIST_USERS] Current user role: {current_user.role}, org_id: {current_user.organization_id if hasattr(current_user, 'organization_id') else None}")
    
    try:
        # Check permissions
        if current_user.role != UserRole.SUPERUSER:
            logger.info("[LIST_USERS] Non-superuser access, restricting to organization")
            if not current_user.organization_id:
                logger.error("[LIST_USERS] Organization admin without organization_id")
                raise HTTPException(status_code=403, detail="Access denied")
            organization_id = current_user.organization_id
            logger.info(f"[LIST_USERS] Filtered by organization_id: {organization_id}")

        # Validate sort_by field
        valid_sort_fields = {'email', 'first_name', 'last_name', 'role', 'created_at', 'organization'}
        if sort_by and sort_by not in valid_sort_fields:
            logger.error(f"[LIST_USERS] Invalid sort_by field: {sort_by}")
            raise HTTPException(status_code=400, detail=f"Invalid sort_by field. Must be one of: {', '.join(valid_sort_fields)}")

        logger.info("[LIST_USERS] Starting database queries")
        
        try:
            # Get total counts first
            logger.debug("[LIST_USERS] Querying superusers count")
            superusers_count = await session.execute(select(func.count()).select_from(SuperUser))
            superusers_total = superusers_count.scalar()
            logger.debug(f"[LIST_USERS] Superusers count: {superusers_total}")

            logger.debug("[LIST_USERS] Querying admins count")
            admins_query = select(func.count()).select_from(OrganizationAdministrator)
            if organization_id:
                admins_query = admins_query.where(OrganizationAdministrator.organization_id == organization_id)
            admins_count = await session.execute(admins_query)
            admins_total = admins_count.scalar()
            logger.debug(f"[LIST_USERS] Admins count: {admins_total}")
            
            total = superusers_total + admins_total
            logger.info(f"[LIST_USERS] Total users count: {total}")

            # Build base queries
            logger.debug("[LIST_USERS] Building superusers query")
            superusers_query = select(SuperUser)
            
            logger.debug("[LIST_USERS] Building admins query with organization join")
            admins_query = select(OrganizationAdministrator, Organization).join(
                Organization,
                OrganizationAdministrator.organization_id == Organization.id,
                isouter=True
            )

            if organization_id:
                logger.debug(f"[LIST_USERS] Filtering admins by organization_id: {organization_id}")
                admins_query = admins_query.where(OrganizationAdministrator.organization_id == organization_id)

            # Execute queries
            logger.debug("[LIST_USERS] Executing superusers query")
            superusers = (await session.execute(superusers_query)).scalars().all()
            logger.debug(f"[LIST_USERS] Retrieved {len(superusers)} superusers")

            logger.debug("[LIST_USERS] Executing admins query")
            admin_results = (await session.execute(admins_query)).all()
            logger.debug(f"[LIST_USERS] Retrieved {len(admin_results)} admins")

            # Process admin results
            logger.debug("[LIST_USERS] Processing admin results")
            admins = []
            for admin, org in admin_results:
                # Convert role to uppercase and create a clean dict without SQLAlchemy state
                admin_dict = {
                    'id': str(admin.id),
                    'email': admin.email,
                    'first_name': admin.first_name,
                    'last_name': admin.last_name,
                    'role': admin.role.upper() if admin.role else None,
                    'organization_id': str(admin.organization_id) if admin.organization_id else None,
                    'created_at': admin.created_at,
                    'updated_at': admin.updated_at,
                    'organization': {
                        'id': str(org.id),
                        'name': org.name
                    } if org else None
                }
                admins.append(admin_dict)

            # Combine results
            logger.debug("[LIST_USERS] Combining user results")
            all_users = []
            # Process superusers with clean dict creation
            all_users.extend([{
                'id': str(user.id),
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'role': user.role.upper() if user.role else None,
                'organization_id': None,
                'created_at': user.created_at,
                'updated_at': user.updated_at,
                'organization': None
            } for user in superusers])
            all_users.extend(admins)
            logger.debug(f"[LIST_USERS] Combined total users: {len(all_users)}")

            # Sort combined results
            if sort_by:
                logger.debug(f"[LIST_USERS] Sorting results by {sort_by} {sort_direction}")
                try:
                    if sort_by == 'organization':
                        # Custom sorting for organization field
                        all_users.sort(
                            key=lambda x: (
                                x.get('organization', {}).get('name', '') or ''
                            ).lower() if x.get('organization') else '',
                            reverse=(sort_direction == 'desc')
                        )
                    else:
                        # Standard sorting for other fields
                        all_users.sort(
                            key=lambda x: (x.get(sort_by) or '').lower() if isinstance(x.get(sort_by, ''), str) else (x.get(sort_by) or ''),
                            reverse=(sort_direction == 'desc')
                        )
                except Exception as sort_error:
                    logger.error(f"[LIST_USERS] Error during sorting: {sort_error}", exc_info=True)
                    # Continue without sorting if there's an error

            # Apply pagination
            logger.debug(f"[LIST_USERS] Applying pagination: offset={offset}, limit={limit}")
            start = offset
            end = offset + limit
            paginated_users = all_users[start:end]
            logger.debug(f"[LIST_USERS] Paginated results count: {len(paginated_users)}")

            response_data = {
                "data": paginated_users,
                "total": total,
                "limit": limit,
                "offset": offset
            }
            logger.info("[LIST_USERS] Successfully prepared response")
            return response_data

        except Exception as db_error:
            logger.error("[LIST_USERS] Database operation error", exc_info=True)
            raise HTTPException(
                status_code=500,
                detail=f"Database error: {str(db_error)}"
            )

    except HTTPException as http_error:
        logger.error(f"[LIST_USERS] HTTP exception: {http_error.detail}", exc_info=True)
        raise
    except Exception as e:
        logger.error("[LIST_USERS] Unexpected error", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
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
        # Try to find in organization admins with organization join
        admin_result = await session.execute(
            select(OrganizationAdministrator)
            .options(joinedload(OrganizationAdministrator.organization))
            .where(OrganizationAdministrator.id == user_id)
        )
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
    
    # If it's an admin, reload with organization
    if user_type == OrganizationAdministrator:
        result = await session.execute(
            select(OrganizationAdministrator)
            .options(joinedload(OrganizationAdministrator.organization))
            .where(OrganizationAdministrator.id == user_id)
        )
        updated_user = result.scalar_one_or_none()
        
        # Format the organization data as a dictionary
        if updated_user and updated_user.organization:
            org = updated_user.organization
            updated_user = {
                'id': str(updated_user.id),
                'email': updated_user.email,
                'first_name': updated_user.first_name,
                'last_name': updated_user.last_name,
                'role': updated_user.role.upper() if updated_user.role else None,
                'organization_id': str(updated_user.organization_id) if updated_user.organization_id else None,
                'created_at': updated_user.created_at,
                'updated_at': updated_user.updated_at,
                'organization': {
                    'id': str(org.id),
                    'name': org.name,
                    'description': org.description,
                    'status': org.status,
                    'created_at': org.created_at,
                    'updated_at': org.updated_at
                }
            }
    else:
        # Format superuser data
        updated_user = {
            'id': str(updated_user.id),
            'email': updated_user.email,
            'first_name': updated_user.first_name,
            'last_name': updated_user.last_name,
            'role': updated_user.role.upper() if updated_user.role else None,
            'created_at': updated_user.created_at,
            'updated_at': updated_user.updated_at,
            'organization': None
        }
    
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