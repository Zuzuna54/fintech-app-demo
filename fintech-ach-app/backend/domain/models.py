from pydantic import BaseModel, UUID4
from typing import Optional, Literal
from enum import Enum
from uuid import UUID

class UserRole(str, Enum):
    SUPERUSER = "superuser"
    ORGANIZATION_ADMIN = "organization_admin"

class AccountType(str, Enum):
    INTERNAL = "internal"
    EXTERNAL = "external"

class AccountStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    PENDING = "pending"

class PaymentStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"

class BankAccountType(str, Enum):
    CHECKING = "checking"
    SAVINGS = "savings"
    FUNDING = "funding"
    CLAIMS = "claims"

class SuperUser(BaseModel):
    id: int
    uid: UUID4

class OrganizationAdministrator(BaseModel):
    id: int
    uid: UUID4
    first_name: str
    last_name: str
    organization_id: int

class InternalOrganizationBankAccount(BaseModel):
    id: int
    uuid: UUID4
    name: str = "Internal Account"
    type: Literal["funding", "claims"]
    account_type: BankAccountType = BankAccountType.CHECKING
    account_number: str
    routing_number: str
    balance: float
    status: AccountStatus

class ExternalOrganizationBankAccount(BaseModel):
    id: int
    uuid: UUID4
    name: str = "External Account"
    plaid_account_id: str
    account_type: BankAccountType = BankAccountType.CHECKING
    account_number: str
    routing_number: str
    balance: float
    status: AccountStatus
    organization_id: int

class Payment(BaseModel):
    uuid: UUID
    from_account: str
    to_account: str
    amount: float
    status: PaymentStatus
    description: Optional[str] = None
    source_routing_number: str
    destination_routing_number: str
    payment_type: Literal["ach_debit", "ach_credit", "book"]
    idempotency_key: str