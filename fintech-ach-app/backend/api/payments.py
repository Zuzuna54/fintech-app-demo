from fastapi import APIRouter, HTTPException, Depends, Request, Query
from pydantic import BaseModel, UUID4
from typing import Optional
from uuid import UUID, uuid4
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_
from domain.models import PaymentStatus, AccountStatus
from domain.sql_models import (
    Payment as SQLPayment,
    ExternalOrganizationBankAccount,
    InternalOrganizationBankAccount
)
from config.database import get_db
from auth.roles import Role, check_role
from auth.jwt import get_current_user
from message_queue.redis_queue import RedisQueue
from datetime import datetime
import os
import logging

router = APIRouter(prefix="/payments", tags=["payments"])
queue = RedisQueue(os.getenv("REDIS_URL", "redis://localhost:6379"))
logger = logging.getLogger(__name__)

class PaymentCreate(BaseModel):
    amount: float
    from_account_id: UUID4
    to_account_id: UUID4
    description: Optional[str] = None
    idempotency_key: str
    payment_type: str

@router.post("")
async def create_payment(
    request: Request,
    payment: PaymentCreate,
    user = Depends(get_current_user),
    session: AsyncSession = Depends(get_db)
):
    """Create a new payment and enqueue it for processing."""
    try:
        if not user:
            raise HTTPException(
                status_code=401,
                detail="Authentication required"
            )

        # Check idempotency
        result = await session.execute(
            select(SQLPayment).where(SQLPayment.idempotency_key == payment.idempotency_key)
        )
        existing_payment = result.scalar_one_or_none()
        if existing_payment:
            return {"payment_id": existing_payment.uuid}

        # Validate accounts based on payment type
        try:
            if payment.payment_type == "ach_debit":
                # For ACH debit: from external to internal
                from_result = await session.execute(
                    select(ExternalOrganizationBankAccount).where(
                        ExternalOrganizationBankAccount.uuid == payment.from_account_id
                    )
                )
                to_result = await session.execute(
                    select(InternalOrganizationBankAccount).where(
                        InternalOrganizationBankAccount.uuid == payment.to_account_id
                    )
                )
            elif payment.payment_type == "ach_credit":
                # For ACH credit: from internal to external
                from_result = await session.execute(
                    select(InternalOrganizationBankAccount).where(
                        InternalOrganizationBankAccount.uuid == payment.from_account_id
                    )
                )
                to_result = await session.execute(
                    select(ExternalOrganizationBankAccount).where(
                        ExternalOrganizationBankAccount.uuid == payment.to_account_id
                    )
                )
            else:
                raise HTTPException(
                    status_code=400,
                    detail="Invalid payment type. Must be 'ach_debit' or 'ach_credit'"
                )
            
            from_account = from_result.scalar_one_or_none()
            to_account = to_result.scalar_one_or_none()

            if not from_account:
                raise HTTPException(status_code=404, detail="Source account not found")
            if not to_account:
                raise HTTPException(status_code=404, detail="Destination account not found")
            
            # Check permissions based on user role
            if user.role == Role.ORGANIZATION_ADMIN.value:
                # Organization admin can only create payments involving their organization's external accounts
                if payment.payment_type == "ach_debit":
                    # Check if from_account belongs to the organization
                    if not hasattr(from_account, 'organization_id') or str(from_account.organization_id) != str(user.organization_id):
                        raise HTTPException(
                            status_code=403,
                            detail="Not authorized to create payment from this account"
                        )
                else:  # ach_credit
                    # Check if to_account belongs to the organization
                    if not hasattr(to_account, 'organization_id') or str(to_account.organization_id) != str(user.organization_id):
                        raise HTTPException(
                            status_code=403,
                            detail="Not authorized to create payment to this account"
                        )
            elif user.role != Role.SUPERUSER.value:
                raise HTTPException(
                    status_code=403,
                    detail="Not authorized to create payments"
                )
            
            if from_account.status != AccountStatus.ACTIVE:
                raise HTTPException(status_code=400, detail="Source account is not active")
            if to_account.status != AccountStatus.ACTIVE:
                raise HTTPException(status_code=400, detail="Destination account is not active")

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Account validation failed: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Account validation failed: {str(e)}")

        try:
            # Create payment
            new_payment = SQLPayment(
                uuid=uuid4(),
                from_account=payment.from_account_id,
                to_account=payment.to_account_id,
                amount=payment.amount,
                description=payment.description,
                status=PaymentStatus.PENDING,
                source_routing_number=from_account.routing_number,
                destination_routing_number=to_account.routing_number,
                payment_type=payment.payment_type,
                idempotency_key=payment.idempotency_key
            )
            
            session.add(new_payment)
            await session.commit()
            
            # Enqueue for processing
            await queue.enqueue_payment(str(new_payment.uuid), {
                "payment_id": str(new_payment.uuid),
                "amount": payment.amount,
                "from_account": str(payment.from_account_id),
                "to_account": str(payment.to_account_id),
                "payment_type": payment.payment_type
            })
            
            return {"payment_id": new_payment.uuid}
        except Exception as e:
            logger.error(f"Payment creation or enqueuing failed: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Payment creation failed: {str(e)}")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Unexpected error: {str(e)}"
        )

@router.get("/{payment_id}")
async def get_payment(
    request: Request,
    payment_id: UUID,
    user = Depends(get_current_user),
    session: AsyncSession = Depends(get_db)
):
    """Get payment status by ID."""
    # Verify user role
    if not user:
        raise HTTPException(
            status_code=401,
            detail="Authentication required"
        )
    
    if user.role not in [Role.SUPERUSER.value, Role.ORGANIZATION_ADMIN.value]:
        raise HTTPException(
            status_code=403,
            detail="Not enough permissions"
        )
    
    result = await session.execute(
        select(SQLPayment).where(SQLPayment.uuid == payment_id)
    )
    payment = result.scalar_one_or_none()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
        
    # For org admin, only show their own organization's payments
    if user.role == Role.ORGANIZATION_ADMIN.value:
        # Get the external account to check organization
        from_account_result = await session.execute(
            select(ExternalOrganizationBankAccount).where(
                ExternalOrganizationBankAccount.uuid == payment.from_account
            )
        )
        from_account = from_account_result.scalar_one_or_none()
        if not from_account:
            raise HTTPException(status_code=404, detail="Payment not found")
            
        # Check if payment belongs to the organization
        if not user.organization_id or str(from_account.organization_id) != str(user.organization_id):
            raise HTTPException(status_code=403, detail="Not authorized to view this payment")
            
    return payment

@router.get("")
async def list_payments(
    session: AsyncSession = Depends(get_db),
    status: Optional[str] = Query(None, description="Filter by payment status"),
    startDate: Optional[str] = Query(None, description="Filter by start date (YYYY-MM-DD)"),
    endDate: Optional[str] = Query(None, description="Filter by end date (YYYY-MM-DD)"),
    minAmount: Optional[str] = Query(None, description="Filter by minimum amount"),
    maxAmount: Optional[str] = Query(None, description="Filter by maximum amount"),
    sort_by: Optional[str] = Query(None, description="Field to sort by"),
    sort_direction: Optional[str] = Query(None, description="Sort direction (asc/desc)"),
    limit: int = 10,
    offset: int = 0,
    user = Depends(get_current_user)
):
    """List payments with optional filtering, sorting, and role-based access control."""
    if not user:
        raise HTTPException(
            status_code=401,
            detail="Authentication required"
        )

    query = select(SQLPayment)
    filters = []

    # Organization-based filtering for organization admins
    if user.role == Role.ORGANIZATION_ADMIN.value:
        if not user.organization_id:
            raise HTTPException(
                status_code=403,
                detail="Organization ID not found for admin user"
            )
        
        # Get all external accounts for the organization
        org_accounts_result = await session.execute(
            select(ExternalOrganizationBankAccount.uuid).where(
                ExternalOrganizationBankAccount.organization_id == user.organization_id
            )
        )
        org_account_ids = [str(acc[0]) for acc in org_accounts_result.fetchall()]
        
        if not org_account_ids:
            # Return empty result if organization has no accounts
            return {
                "total": 0,
                "payments": [],
                "limit": limit,
                "offset": offset
            }
        
        # Filter payments where either from_account or to_account belongs to the organization
        filters.append(
            or_(
                SQLPayment.from_account.in_(org_account_ids),
                SQLPayment.to_account.in_(org_account_ids)
            )
        )

    # Status filter
    if status and status.strip():
        try:
            payment_status = PaymentStatus(status.lower())
            filters.append(SQLPayment.status == payment_status)
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid status value. Must be one of: {', '.join([s.value for s in PaymentStatus])}"
            )
    
    # Date range filter
    if startDate:
        try:
            start_date = datetime.strptime(startDate, "%Y-%m-%d")
            filters.append(SQLPayment.created_at >= start_date)
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail="Invalid start date format. Use YYYY-MM-DD"
            )
    
    if endDate:
        try:
            # Add one day to include the entire end date
            end_date = datetime.strptime(endDate, "%Y-%m-%d").replace(hour=23, minute=59, second=59)
            filters.append(SQLPayment.created_at <= end_date)
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail="Invalid end date format. Use YYYY-MM-DD"
            )

    # Amount range filter
    if minAmount and minAmount.strip():
        try:
            min_amount = float(minAmount)
            filters.append(SQLPayment.amount >= min_amount)
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail="Invalid minimum amount. Must be a valid number"
            )
    
    if maxAmount and maxAmount.strip():
        try:
            max_amount = float(maxAmount)
            filters.append(SQLPayment.amount <= max_amount)
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail="Invalid maximum amount. Must be a valid number"
            )

    # Apply all filters
    if filters:
        query = query.where(and_(*filters))
    
    # Apply sorting
    if sort_by and sort_direction:
        sort_column = getattr(SQLPayment, sort_by, None)
        if sort_column is not None:
            query = query.order_by(
                sort_column.desc() if sort_direction == 'desc' else sort_column.asc()
            )
    else:
        # Default sorting by created_at desc
        query = query.order_by(SQLPayment.created_at.desc())
    
    # Apply pagination after sorting
    query = query.offset(offset).limit(limit)
    result = await session.execute(query)
    payments = result.scalars().all()
    
    # Get total count with same filters
    count_query = select(SQLPayment)
    if filters:
        count_query = count_query.where(and_(*filters))
    
    count_result = await session.execute(count_query)
    total = len(count_result.scalars().all())
    
    # Enhance payment data with account details
    enhanced_payments = []
    for payment in payments:
        payment_dict = {
            "uuid": payment.uuid,
            "amount": payment.amount,
            "status": payment.status,
            "payment_type": payment.payment_type,
            "created_at": payment.created_at,
            "description": payment.description,
            "from_account": payment.from_account,
            "to_account": payment.to_account
        }
        
        # Get account details
        if payment.payment_type == "ach_debit":
            # From external to internal
            from_account = await session.execute(
                select(ExternalOrganizationBankAccount).where(
                    ExternalOrganizationBankAccount.uuid == payment.from_account
                )
            )
            to_account = await session.execute(
                select(InternalOrganizationBankAccount).where(
                    InternalOrganizationBankAccount.uuid == payment.to_account
                )
            )
        else:
            # From internal to external
            from_account = await session.execute(
                select(InternalOrganizationBankAccount).where(
                    InternalOrganizationBankAccount.uuid == payment.from_account
                )
            )
            to_account = await session.execute(
                select(ExternalOrganizationBankAccount).where(
                    ExternalOrganizationBankAccount.uuid == payment.to_account
                )
            )
        
        from_account = from_account.scalar_one_or_none()
        to_account = to_account.scalar_one_or_none()
        
        if from_account:
            payment_dict["from_account_details"] = {
                "name": from_account.name,
                "account_type": from_account.account_type,
                "organization_id": getattr(from_account, 'organization_id', None)
            }
        
        if to_account:
            payment_dict["to_account_details"] = {
                "name": to_account.name,
                "account_type": to_account.account_type,
                "organization_id": getattr(to_account, 'organization_id', None)
            }
        
        enhanced_payments.append(payment_dict)
    
    return {
        "total": total,
        "payments": enhanced_payments,
        "limit": limit,
        "offset": offset
    }