from sqlalchemy import Column, String, Float, ForeignKey, Enum as SQLEnum, DateTime, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from config.base import Base
import uuid
from datetime import datetime
from enum import Enum

class UserRole(str, Enum):
    SUPERUSER = "superuser"
    ORGANIZATION_ADMIN = "organization_admin"

class AccountStatus(str, Enum):
    PENDING = "pending"
    ACTIVE = "active"
    SUSPENDED = "suspended"
    CLOSED = "closed"

class BankAccountType(str, Enum):
    CHECKING = "checking"
    SAVINGS = "savings"
    FUNDING = "funding"
    CLAIMS = "claims"

class PaymentStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"

class Organization(Base):
    __tablename__ = "organizations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    description = Column(String)
    status = Column(String, nullable=False, default="active")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    administrators = relationship("OrganizationAdministrator", back_populates="organization")
    external_accounts = relationship("ExternalOrganizationBankAccount", back_populates="organization")

class SuperUser(Base):
    __tablename__ = "superusers"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    first_name = Column(String, nullable=True)
    last_name = Column(String, nullable=True)
    role = Column(SQLEnum(UserRole), nullable=False, default=UserRole.SUPERUSER)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class OrganizationAdministrator(Base):
    __tablename__ = "organization_administrators"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    role = Column(SQLEnum(UserRole), nullable=False, default=UserRole.ORGANIZATION_ADMIN)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    organization = relationship("Organization", back_populates="administrators")

class InternalOrganizationBankAccount(Base):
    __tablename__ = "internal_organization_bank_accounts"

    uuid = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    type = Column(String, nullable=False)  # funding or claims
    account_type = Column(SQLEnum(BankAccountType), nullable=False)
    account_number = Column(String, nullable=False)
    routing_number = Column(String, nullable=False)
    balance = Column(Float, nullable=False, default=0.0)
    status = Column(SQLEnum(AccountStatus), nullable=False, default=AccountStatus.PENDING)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class ExternalOrganizationBankAccount(Base):
    __tablename__ = "external_organization_bank_accounts"

    uuid = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    plaid_account_id = Column(String, nullable=False)
    account_type = Column(SQLEnum(BankAccountType), nullable=False)
    account_number = Column(String, nullable=False)
    routing_number = Column(String, nullable=False)
    balance = Column(Float, nullable=False, default=0.0)
    status = Column(SQLEnum(AccountStatus), nullable=False, default=AccountStatus.PENDING)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    organization = relationship("Organization", back_populates="external_accounts")

class Payment(Base):
    __tablename__ = "payments"

    uuid = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    from_account = Column(UUID(as_uuid=True), nullable=False)  # Can be either internal or external
    to_account = Column(UUID(as_uuid=True), nullable=False)    # Can be either internal or external
    amount = Column(Float, nullable=False)
    status = Column(SQLEnum(PaymentStatus), nullable=False, default=PaymentStatus.PENDING)
    description = Column(String)
    source_routing_number = Column(String, nullable=False)
    destination_routing_number = Column(String, nullable=False)
    payment_type = Column(String, nullable=False)  # ach_debit or ach_credit
    idempotency_key = Column(String, unique=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Add relationships without foreign key constraints
    from_internal_account = relationship(
        "InternalOrganizationBankAccount",
        foreign_keys=[from_account],
        primaryjoin="Payment.from_account == InternalOrganizationBankAccount.uuid",
        viewonly=True
    )
    from_external_account = relationship(
        "ExternalOrganizationBankAccount",
        foreign_keys=[from_account],
        primaryjoin="Payment.from_account == ExternalOrganizationBankAccount.uuid",
        viewonly=True
    )
    to_internal_account = relationship(
        "InternalOrganizationBankAccount",
        foreign_keys=[to_account],
        primaryjoin="Payment.to_account == InternalOrganizationBankAccount.uuid",
        viewonly=True
    )
    to_external_account = relationship(
        "ExternalOrganizationBankAccount",
        foreign_keys=[to_account],
        primaryjoin="Payment.to_account == ExternalOrganizationBankAccount.uuid",
        viewonly=True
    )
  