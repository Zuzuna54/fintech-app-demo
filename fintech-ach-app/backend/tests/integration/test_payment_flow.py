import asyncio
import pytest
from uuid import uuid4
from domain.models import (
    InternalOrganizationBankAccount,
    ExternalOrganizationBankAccount,
    AccountStatus,
    PaymentStatus,
    BankAccountType
)
from domain.db import (
    internal_accounts_db,
    external_accounts_db,
    payments_db
)

@pytest.fixture
async def setup_test_data():
    """Create test accounts for payment flow tests."""
    internal_account = InternalOrganizationBankAccount(
        id=1,
        uuid=uuid4(),
        name="Test Internal Account",
        type="funding",
        account_type=BankAccountType.CHECKING,
        account_number="1234567890",
        routing_number="987654321",
        balance=1000.0,
        status=AccountStatus.ACTIVE
    )
    internal_accounts_db[str(internal_account.uuid)] = internal_account

    external_account = ExternalOrganizationBankAccount(
        id=1,
        uuid=uuid4(),
        name="Test External Account",
        plaid_account_id="test_plaid_id",
        account_type=BankAccountType.CHECKING,
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
async def test_complete_payment_flow(async_client, setup_test_data):
    """Test the complete payment flow from creation to completion."""
    accounts = await setup_test_data
    
    # Create payment
    response = await async_client.post(
        "/payments",
        json={
            "from_account_id": str(accounts['external_account'].uuid),
            "to_account_id": str(accounts['internal_account'].uuid),
            "amount": 100.0,
            "description": "Test payment flow"
        }
    )
    
    assert response.status_code == 200
    data = response.json()
    payment_id = data["payment_id"]
    
    # Check payment status
    status_response = await async_client.get(f"/payments/{payment_id}/status")
    assert status_response.status_code == 200
    assert status_response.json()["status"] == PaymentStatus.COMPLETED
    
    # Verify account balances
    assert accounts['external_account'].balance == 400.0  # 500 - 100
    assert accounts['internal_account'].balance == 1100.0  # 1000 + 100

@pytest.mark.asyncio
async def test_failed_payment_flow(async_client, setup_test_data):
    """Test payment flow with insufficient funds."""
    accounts = await setup_test_data
    
    # Attempt payment with insufficient funds
    response = await async_client.post(
        "/payments",
        json={
            "from_account_id": str(accounts['external_account'].uuid),
            "to_account_id": str(accounts['internal_account'].uuid),
            "amount": 1000.0,  # More than available balance
            "description": "Test failed payment"
        }
    )
    
    assert response.status_code == 400
    assert "Insufficient funds" in response.json()["detail"]
    
    # Verify account balances unchanged
    assert accounts['external_account'].balance == 500.0
    assert accounts['internal_account'].balance == 1000.0

@pytest.mark.asyncio
async def test_invalid_account_payment_flow(async_client):
    """Test payment flow with invalid account IDs."""
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

@pytest.mark.asyncio
async def test_concurrent_payments(async_client, setup_test_data):
    """Test multiple concurrent payments."""
    accounts = await setup_test_data
    payment_amount = 100.0
    
    # Create multiple payments concurrently
    async def create_payment():
        return await async_client.post(
            "/payments",
            json={
                "from_account_id": str(accounts['external_account'].uuid),
                "to_account_id": str(accounts['internal_account'].uuid),
                "amount": payment_amount,
                "description": "Test concurrent payment"
            }
        )
    
    responses = await asyncio.gather(*[create_payment() for _ in range(3)])
    
    # Verify all payments were successful
    assert all(r.status_code == 200 for r in responses)
    
    # Verify final balances
    assert accounts['external_account'].balance == 200.0  # 500 - (100 * 3)
    assert accounts['internal_account'].balance == 1300.0  # 1000 + (100 * 3)