import os
from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.pool import NullPool
from sqlalchemy import text
from uuid import uuid4
from domain.models import AccountStatus, BankAccountType, PaymentStatus, UserRole
from .base import Base

# Load environment variables
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://postgres:postgres@localhost:5432/fintech_ach")

# Create async engine
engine = create_async_engine(
    DATABASE_URL,
    poolclass=NullPool,
    echo=True
)

async_session = sessionmaker(
    engine, 
    class_=AsyncSession, 
    expire_on_commit=False,
    future=True
)

async def init_db():
    """Initialize database tables and seed data."""
    # Import here to avoid circular imports
    from domain.sql_models import (
        Organization,
        SuperUser,
        OrganizationAdministrator,
        InternalOrganizationBankAccount,
        ExternalOrganizationBankAccount,
        Payment
    )
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        
    async with async_session() as session:
        # Check if we already have seed data
        result = await session.execute(text("SELECT COUNT(*) FROM superusers"))
        count = result.scalar()
        if count > 0:
            return
            
        # Create organizations first
        org1_id = uuid4()
        org1 = Organization(
            id=org1_id,
            name="Organization 1",
            description="First test organization",
            status="active"
        )
        session.add(org1)

        org2_id = uuid4()
        org2 = Organization(
            id=org2_id,
            name="Organization 2",
            description="Second test organization",
            status="active"
        )
        session.add(org2)
        
        # Create superuser
        superuser = SuperUser(
            id=uuid4(),
            email="admin@example.com",
            hashed_password="$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewKyNiAYMxRHHJ",
            role=UserRole.SUPERUSER
        )
        session.add(superuser)
        
        # Create organization administrators
        admin1 = OrganizationAdministrator(
            id=uuid4(),
            email="john@org1.com",
            hashed_password="$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewKyNiAYMxRHHJ",
            first_name="John",
            last_name="Doe",
            role=UserRole.ORGANIZATION_ADMIN,
            organization_id=org1_id
        )
        session.add(admin1)

        admin2 = OrganizationAdministrator(
            id=uuid4(),
            email="jane@org2.com",
            hashed_password="$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewKyNiAYMxRHHJ",
            first_name="Jane",
            last_name="Smith",
            role=UserRole.ORGANIZATION_ADMIN,
            organization_id=org2_id
        )
        session.add(admin2)
        
        # Create internal accounts
        funding_account = InternalOrganizationBankAccount(
            uuid=uuid4(),
            name="Company Funding Account",
            type="funding",
            account_type=BankAccountType.FUNDING,
            account_number="1234567890",
            routing_number="021000021",
            balance=1000000.0,
            status=AccountStatus.ACTIVE
        )
        session.add(funding_account)
        
        claims_account = InternalOrganizationBankAccount(
            uuid=uuid4(),
            name="Company Claims Account",
            type="claims",
            account_type=BankAccountType.CLAIMS,
            account_number="0987654321",
            routing_number="021000021",
            balance=500000.0,
            status=AccountStatus.ACTIVE
        )
        session.add(claims_account)

        operations_account = InternalOrganizationBankAccount(
            uuid=uuid4(),
            name="Company Operations Account",
            type="funding",
            account_type=BankAccountType.FUNDING,
            account_number="5555666777",
            routing_number="021000021",
            balance=750000.0,
            status=AccountStatus.ACTIVE
        )
        session.add(operations_account)

        reserve_account = InternalOrganizationBankAccount(
            uuid=uuid4(),
            name="Company Reserve Account",
            type="funding",
            account_type=BankAccountType.FUNDING,
            account_number="9999888777",
            routing_number="021000021",
            balance=2000000.0,
            status=AccountStatus.ACTIVE
        )
        session.add(reserve_account)

        # Commit the first batch to get IDs
        await session.commit()
        
        # Create external accounts for Organization 1
        external_account1 = ExternalOrganizationBankAccount(
            uuid=uuid4(),
            name="Client Account 1",
            plaid_account_id="plaid_test_id_1",
            account_type=BankAccountType.CHECKING,
            account_number="1111222233",
            routing_number="021000021",
            balance=50000.0,
            status=AccountStatus.ACTIVE,
            organization_id=org1_id
        )
        session.add(external_account1)
        
        external_account2 = ExternalOrganizationBankAccount(
            uuid=uuid4(),
            name="Client Account 2",
            plaid_account_id="plaid_test_id_2",
            account_type=BankAccountType.CHECKING,
            account_number="4444555566",
            routing_number="021000021",
            balance=75000.0,
            status=AccountStatus.ACTIVE,
            organization_id=org1_id
        )
        session.add(external_account2)

        # Create external accounts for Organization 2
        external_account3 = ExternalOrganizationBankAccount(
            uuid=uuid4(),
            name="Client Account 3",
            plaid_account_id="plaid_test_id_3",
            account_type=BankAccountType.CHECKING,
            account_number="7777888899",
            routing_number="021000021",
            balance=100000.0,
            status=AccountStatus.ACTIVE,
            organization_id=org2_id
        )
        session.add(external_account3)

        external_account4 = ExternalOrganizationBankAccount(
            uuid=uuid4(),
            name="Client Account 4",
            plaid_account_id="plaid_test_id_4",
            account_type=BankAccountType.SAVINGS,
            account_number="3333444455",
            routing_number="021000021",
            balance=150000.0,
            status=AccountStatus.ACTIVE,
            organization_id=org2_id
        )
        session.add(external_account4)

        # Commit external accounts to get their IDs
        await session.commit()
        
        # Create sample payments
        # Organization 1 payments
        payment1 = Payment(
            uuid=uuid4(),
            from_account=external_account1.uuid,
            to_account=funding_account.uuid,
            amount=1000.0,
            status=PaymentStatus.COMPLETED,
            description="Initial deposit",
            source_routing_number=external_account1.routing_number,
            destination_routing_number=funding_account.routing_number,
            payment_type="ach_debit",
            idempotency_key=str(uuid4())
        )
        session.add(payment1)
        
        payment2 = Payment(
            uuid=uuid4(),
            from_account=external_account2.uuid,
            to_account=claims_account.uuid,
            amount=2000.0,
            status=PaymentStatus.PENDING,
            description="Claims payment",
            source_routing_number=external_account2.routing_number,
            destination_routing_number=claims_account.routing_number,
            payment_type="ach_debit",
            idempotency_key=str(uuid4())
        )
        session.add(payment2)

        payment3 = Payment(
            uuid=uuid4(),
            from_account=external_account1.uuid,
            to_account=operations_account.uuid,
            amount=5000.0,
            status=PaymentStatus.COMPLETED,
            description="Operations funding",
            source_routing_number=external_account1.routing_number,
            destination_routing_number=operations_account.routing_number,
            payment_type="ach_debit",
            idempotency_key=str(uuid4())
        )
        session.add(payment3)

        # Organization 2 payments
        payment4 = Payment(
            uuid=uuid4(),
            from_account=external_account3.uuid,
            to_account=funding_account.uuid,
            amount=3000.0,
            status=PaymentStatus.COMPLETED,
            description="Initial deposit",
            source_routing_number=external_account3.routing_number,
            destination_routing_number=funding_account.routing_number,
            payment_type="ach_debit",
            idempotency_key=str(uuid4())
        )
        session.add(payment4)
        
        payment5 = Payment(
            uuid=uuid4(),
            from_account=external_account4.uuid,
            to_account=claims_account.uuid,
            amount=4000.0,
            status=PaymentStatus.PENDING,
            description="Claims payment",
            source_routing_number=external_account4.routing_number,
            destination_routing_number=claims_account.routing_number,
            payment_type="ach_debit",
            idempotency_key=str(uuid4())
        )
        session.add(payment5)
        
        # Final commit
        await session.commit()

async def get_db() -> AsyncSession:
    """Get database session."""
    async with async_session() as session:
        try:
            yield session
        finally:
            await session.close() 