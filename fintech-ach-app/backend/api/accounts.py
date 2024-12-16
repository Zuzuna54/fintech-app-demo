from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel
from typing import Optional
from uuid import UUID, uuid4
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete, func
from domain.models import AccountStatus, BankAccountType
from domain.sql_models import (
    InternalOrganizationBankAccount,
    ExternalOrganizationBankAccount
)
from config.database import get_db
from auth.roles import Role, get_current_user_role
from auth.jwt import get_current_user

router = APIRouter(prefix="/accounts", tags=["accounts"])

class AccountCreate(BaseModel):
    name: str
    account_type: BankAccountType
    routing_number: str
    account_number: str
    organization_id: UUID

class ExternalAccountCreate(AccountCreate):
    plaid_account_id: str

class InternalAccountUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    account_type: Optional[BankAccountType] = None
    status: Optional[AccountStatus] = None

class ExternalAccountUpdate(BaseModel):
    name: Optional[str] = None
    account_type: Optional[BankAccountType] = None
    status: Optional[AccountStatus] = None

@router.post("/internal")
async def create_internal_account(
    account: AccountCreate,
    session: AsyncSession = Depends(get_db),
    user = Depends(get_current_user)
):
    """Create a new internal organization bank account. Only superusers can create internal accounts."""
    user_role = await get_current_user_role(user)
    if user_role != Role.SUPERUSER:
        raise HTTPException(
            status_code=403,
            detail="Only superusers can create internal accounts"
        )
    
    new_account = InternalOrganizationBankAccount(
        uuid=uuid4(),
        name=account.name,
        type=BankAccountType.FUNDING if account.account_type == BankAccountType.FUNDING else BankAccountType.CLAIMS,
        account_type=account.account_type,
        account_number=account.account_number,
        routing_number=account.routing_number,
        balance=0.0,
        status=AccountStatus.PENDING
    )
    
    session.add(new_account)
    await session.commit()
    
    return new_account

@router.put("/internal/{account_id}")
async def update_internal_account(
    account_id: UUID,
    account_update: InternalAccountUpdate,
    session: AsyncSession = Depends(get_db),
    user = Depends(get_current_user)
):
    """Update an internal organization bank account. Only superusers can update internal accounts."""
    user_role = await get_current_user_role(user)
    if user_role != Role.SUPERUSER:
        raise HTTPException(
            status_code=403,
            detail="Only superusers can update internal accounts"
        )
    
    result = await session.execute(
        select(InternalOrganizationBankAccount).where(
            InternalOrganizationBankAccount.uuid == account_id
        )
    )
    account = result.scalar_one_or_none()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    
    if account_update.name:
        account.name = account_update.name
    if account_update.type:
        account.type = account_update.type
    if account_update.account_type:
        account.account_type = account_update.account_type
    if account_update.status:
        account.status = account_update.status
    
    await session.commit()
    return account

@router.delete("/internal/{account_id}")
async def delete_internal_account(
    account_id: UUID,
    session: AsyncSession = Depends(get_db),
    user = Depends(get_current_user)
):
    """Delete an internal organization bank account. Only superusers can delete internal accounts."""
    user_role = await get_current_user_role(user)
    if user_role != Role.SUPERUSER:
        raise HTTPException(
            status_code=403,
            detail="Only superusers can delete internal accounts"
        )
    
    result = await session.execute(
        delete(InternalOrganizationBankAccount).where(
            InternalOrganizationBankAccount.uuid == account_id
        ).returning(InternalOrganizationBankAccount)
    )
    deleted_account = result.scalar_one_or_none()
    if not deleted_account:
        raise HTTPException(status_code=404, detail="Account not found")
    
    await session.commit()
    return {"message": "Account deleted successfully"}

@router.post("/external")
async def create_external_account(
    account: ExternalAccountCreate,
    session: AsyncSession = Depends(get_db),
    user = Depends(get_current_user)
):
    """Create a new external organization bank account. Only organization admins can create external accounts for their organization."""
    user_role = await get_current_user_role(user)
    user_org_id = getattr(user, 'organization_id', None)
    
    if user_role != Role.ORGANIZATION_ADMIN or not user_org_id:
        raise HTTPException(
            status_code=403,
            detail="Only organization admins can create external accounts"
        )
    
    # Ensure the account belongs to the user's organization
    if str(user_org_id) != str(account.organization_id):
        raise HTTPException(
            status_code=403,
            detail="Cannot create account for another organization"
        )
    
    new_account = ExternalOrganizationBankAccount(
        uuid=uuid4(),
        name=account.name,
        plaid_account_id=account.plaid_account_id,
        account_type=account.account_type,
        account_number=account.account_number,
        routing_number=account.routing_number,
        balance=0.0,
        status=AccountStatus.PENDING,
        organization_id=account.organization_id
    )
    
    session.add(new_account)
    await session.commit()
    
    return new_account

@router.delete("/external/{account_id}")
async def delete_external_account(
    account_id: UUID,
    session: AsyncSession = Depends(get_db),
    user = Depends(get_current_user)
):
    """Delete an external organization bank account. Only organization admins can delete their organization's external accounts."""
    user_role = await get_current_user_role(user)
    user_org_id = getattr(user, 'organization_id', None)
    
    if user_role != Role.ORGANIZATION_ADMIN or not user_org_id:
        raise HTTPException(
            status_code=403,
            detail="Only organization admins can delete external accounts"
        )
    
    # First, check if the account exists and belongs to the user's organization
    result = await session.execute(
        select(ExternalOrganizationBankAccount).where(
            ExternalOrganizationBankAccount.uuid == account_id,
            ExternalOrganizationBankAccount.organization_id == user_org_id
        )
    )
    account = result.scalar_one_or_none()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found or you don't have permission to delete it")
    
    # Delete the account
    await session.execute(
        delete(ExternalOrganizationBankAccount).where(
            ExternalOrganizationBankAccount.uuid == account_id,
            ExternalOrganizationBankAccount.organization_id == user_org_id
        )
    )
    
    await session.commit()
    return {"message": "Account deleted successfully"}

@router.put("/external/{account_id}")
async def update_external_account(
    account_id: UUID,
    account_update: ExternalAccountUpdate,
    session: AsyncSession = Depends(get_db),
    user = Depends(get_current_user)
):
    """Update an external organization bank account. Only organization admins can update their organization's external accounts."""
    user_role = await get_current_user_role(user)
    user_org_id = getattr(user, 'organization_id', None)
    
    if user_role != Role.ORGANIZATION_ADMIN or not user_org_id:
        raise HTTPException(
            status_code=403,
            detail="Only organization admins can update external accounts"
        )
    
    # First, check if the account exists and belongs to the user's organization
    result = await session.execute(
        select(ExternalOrganizationBankAccount).where(
            ExternalOrganizationBankAccount.uuid == account_id,
            ExternalOrganizationBankAccount.organization_id == user_org_id
        )
    )
    account = result.scalar_one_or_none()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found or you don't have permission to update it")
    
    if account_update.name:
        account.name = account_update.name
    if account_update.account_type:
        account.account_type = account_update.account_type
    if account_update.status:
        account.status = account_update.status
    
    await session.commit()
    return account

@router.get("")
async def list_accounts(
    session: AsyncSession = Depends(get_db),
    account_type: Optional[str] = None,
    status: Optional[AccountStatus] = None,
    organization_id: Optional[UUID] = None,
    limit: int = 100,
    offset: int = 0,
    sort_by: Optional[str] = None,
    sort_direction: Optional[str] = 'desc',
    user = Depends(get_current_user)
):
    """List accounts with role-based access control and organization filtering."""
    response = {
        "internal_accounts": {
            "total": 0,
            "accounts": []
        },
        "external_accounts": {
            "total": 0,
            "accounts": []
        },
        "limit": limit,
        "offset": offset
    }

    # Get user role
    user_role = await get_current_user_role(user)
    user_org_id = getattr(user, 'organization_id', None)

    # Only superusers can see internal accounts
    if user_role == Role.SUPERUSER:
        internal_query = select(InternalOrganizationBankAccount)
        if status:
            internal_query = internal_query.where(InternalOrganizationBankAccount.status == status)
        if account_type:
            internal_query = internal_query.where(InternalOrganizationBankAccount.type == account_type)
        if sort_by:
            sort_column = getattr(InternalOrganizationBankAccount, sort_by, None)
            if sort_column is not None:
                internal_query = internal_query.order_by(
                    sort_column.desc() if sort_direction == 'desc' else sort_column.asc()
                )
        
        internal_query = internal_query.offset(offset).limit(limit)
        internal_result = await session.execute(internal_query)
        internal_accounts = internal_result.scalars().all()
        
        # Get total count for internal accounts using COUNT
        internal_count_query = select(func.count()).select_from(InternalOrganizationBankAccount)
        if status:
            internal_count_query = internal_count_query.where(InternalOrganizationBankAccount.status == status)
        if account_type:
            internal_count_query = internal_count_query.where(InternalOrganizationBankAccount.type == account_type)
        
        internal_count_result = await session.execute(internal_count_query)
        internal_total = internal_count_result.scalar()
        
        response["internal_accounts"] = {
            "total": internal_total,
            "accounts": internal_accounts
        }

    # External accounts query
    external_query = select(ExternalOrganizationBankAccount)
    
    # Organization admins can only see their organization's external accounts
    if user_role == Role.ORGANIZATION_ADMIN and user_org_id:
        external_query = external_query.where(
            ExternalOrganizationBankAccount.organization_id == user_org_id
        )
    elif user_role == Role.SUPERUSER and organization_id:
        external_query = external_query.where(
            ExternalOrganizationBankAccount.organization_id == organization_id
        )
    
    if status:
        external_query = external_query.where(ExternalOrganizationBankAccount.status == status)
    if account_type:
        external_query = external_query.where(ExternalOrganizationBankAccount.account_type == account_type)
    if sort_by:
        sort_column = getattr(ExternalOrganizationBankAccount, sort_by, None)
        if sort_column is not None:
            external_query = external_query.order_by(
                sort_column.desc() if sort_direction == 'desc' else sort_column.asc()
            )
    
    external_query = external_query.offset(offset).limit(limit)
    external_result = await session.execute(external_query)
    external_accounts = external_result.scalars().all()

    # Get total count for external accounts using COUNT
    external_count_query = select(func.count()).select_from(ExternalOrganizationBankAccount)
    if user_role == Role.ORGANIZATION_ADMIN and user_org_id:
        external_count_query = external_count_query.where(
            ExternalOrganizationBankAccount.organization_id == user_org_id
        )
    elif user_role == Role.SUPERUSER and organization_id:
        external_count_query = external_count_query.where(
            ExternalOrganizationBankAccount.organization_id == organization_id
        )
    if status:
        external_count_query = external_count_query.where(ExternalOrganizationBankAccount.status == status)
    if account_type:
        external_count_query = external_count_query.where(ExternalOrganizationBankAccount.account_type == account_type)
    
    external_count_result = await session.execute(external_count_query)
    external_total = external_count_result.scalar()
    
    response["external_accounts"] = {
        "total": external_total,
        "accounts": external_accounts
    }
    
    return response