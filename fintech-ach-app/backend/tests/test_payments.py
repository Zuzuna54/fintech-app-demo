import pytest
from uuid import uuid4
from domain.models import (
    Payment,
    PaymentStatus,
    AccountStatus,
    InternalOrganizationBankAccount,
    ExternalOrganizationBankAccount
)
from domain.db import payments_db, internal_accounts_db, external_accounts_db

@pytest.fixture
async def test_accounts():
    """Create test accounts for payment tests."""
    internal_account = InternalOrganizationBankAccount(
        id=1,
        uuid=uuid4(),
        type="funding",
        account_number="1234567890",
        routing_number="987654321",
        balance=1000.0,
        status=AccountStatus.ACTIVE
    )
    internal_accounts_db[str(internal_account.uuid)] = internal_account

    external_account = ExternalOrganizationBankAccount(
        id=1,
        uuid=uuid4(),
        plaid_account_id="test_plaid_id",
        account_number="0987654321",
        routing_number="123456789",
        balance=500.0,
        status=AccountStatus.ACTIVE,
        organization_id=1
    )
    external_accounts_db[str(external_account.uuid)] = external_account

    yield {
        'internal_account': internal_account,
        'external_account': external_account
    }

    # Cleanup
    internal_accounts_db.clear()
    external_accounts_db.clear()
    payments_db.clear()

@pytest.mark.asyncio
async def test_create_payment(async_client, test_accounts):
    """Test creating a new payment."""
    accounts = await test_accounts
    response = await async_client.post(
        "/payments",
        json={
            "from_account_id": str(test_accounts['external_account'].uuid),
            "to_account_id": str(test_accounts['internal_account'].uuid),
            "amount": 100.0,
            "description": "Test payment"
        }
    )

    assert response.status_code == 200
    data = response.json()
    assert "payment_id" in data

    # Check payment status
    payment = payments_db[data["payment_id"]]
    assert payment.status == PaymentStatus.COMPLETED

@pytest.mark.asyncio
async def test_insufficient_funds(async_client, test_accounts):
    """Test payment with insufficient funds."""
    accounts = await test_accounts
    response = await async_client.post(
        "/payments",
        json={
            "from_account_id": str(accounts['external_account'].uuid),
            "to_account_id": str(accounts['internal_account'].uuid),
            "amount": 1000.0,
            "description": "Test insufficient funds"
        }
    )

    assert response.status_code == 400
    assert "Insufficient funds" in response.json()["detail"]

@pytest.mark.asyncio
async def test_get_payment(async_client, test_accounts):
    """Test retrieving a payment."""
    accounts = await test_accounts
    # Create a payment
    create_response = await async_client.post(
        "/payments",
        json={
            "from_account_id": str(accounts['external_account'].uuid),
            "to_account_id": str(accounts['internal_account'].uuid),
            "amount": 100.0,
            "description": "Test payment"
        }
    )
    
    assert create_response.status_code == 200
    payment_id = create_response.json()["payment_id"]

    # Get the payment
    get_response = await async_client.get(f"/payments/{payment_id}")
    assert get_response.status_code == 200
    payment_data = get_response.json()
    assert payment_data["status"] == PaymentStatus.COMPLETED

@pytest.mark.asyncio
async def test_invalid_account_ids(async_client):
    """Test payment with invalid account IDs."""
    response = await async_client.post(
        "/payments",
        json={
            "from_account_id": str(uuid4()),
            "to_account_id": str(uuid4()),
            "amount": 100.0,
            "description": "Test invalid accounts"
        }
    )

    assert response.status_code == 404
    assert "Account not found" in response.json()["detail"]