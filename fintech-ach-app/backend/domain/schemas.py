from pydantic import BaseModel, UUID4
from datetime import datetime
from typing import Optional
from domain.models import AccountStatus, BankAccountType

class InternalAccountResponse(BaseModel):
    uuid: UUID4
    name: str
    type: str
    account_type: BankAccountType
    account_number: str
    routing_number: str
    balance: float
    status: AccountStatus
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class ExternalAccountResponse(BaseModel):
    uuid: UUID4
    name: str
    plaid_account_id: str
    account_type: BankAccountType
    account_number: str
    routing_number: str
    balance: float
    status: AccountStatus
    organization_id: UUID4
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True 