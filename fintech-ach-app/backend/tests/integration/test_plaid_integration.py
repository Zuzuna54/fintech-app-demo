import pytest
from unittest.mock import patch, MagicMock
from domain.models import AccountStatus
from domain.db import external_accounts_db

@pytest.fixture
def mock_plaid_response():
    return {
        "access_token": "test_access_token",
        "item_id": "test_item_id",
        "accounts": [{
            "account_id": "test_account_id",
            "balances": {
                "available": 1000.00,
                "current": 1000.00
            },
            "mask": "1234",
            "name": "Test Checking",
            "type": "depository",
            "subtype": "checking",
            "verification_status": "verified"
        }]
    }

@pytest.fixture(autouse=True)
async def cleanup():
    yield
    external_accounts_db.clear()

@pytest.mark.asyncio
async def test_exchange_token_success(async_client, mock_plaid_response):
    """Test successful token exchange flow."""
    with patch('httpx.AsyncClient.post') as mock_post:
        mock_post.return_value = MagicMock(
            status_code=200,
            json=lambda: {
                "access_token": mock_plaid_response["access_token"],
                "item_id": mock_plaid_response["item_id"]
            }
        )

        response = await async_client.post(
            "/plaid/exchange_token",
            json={"public_token": "test_public_token"}
        )

        assert response.status_code == 200
        assert response.json() == {
            "status": "success",
            "item_id": mock_plaid_response["item_id"]
        }

@pytest.mark.asyncio
async def test_exchange_token_failure(async_client):
    """Test token exchange failure handling."""
    with patch('httpx.AsyncClient.post') as mock_post:
        mock_post.return_value = MagicMock(
            status_code=400,
            json=lambda: {"error_message": "Invalid token"}
        )

        response = await async_client.post(
            "/plaid/exchange_token",
            json={"public_token": "invalid_token"}
        )

        assert response.status_code == 400
        assert "Failed to exchange token" in response.json()["detail"]

@pytest.mark.asyncio
async def test_create_external_account(async_client, mock_plaid_response):
    """Test creating external account after Plaid link."""
    # First exchange token
    with patch('httpx.AsyncClient.post') as mock_post:
        mock_post.return_value = MagicMock(
            status_code=200,
            json=lambda: {
                "access_token": mock_plaid_response["access_token"],
                "item_id": mock_plaid_response["item_id"]
            }
        )

        token_response = await async_client.post(
            "/plaid/exchange_token",
            json={"public_token": "test_public_token"}
        )
        assert token_response.status_code == 200

    # Then create external account
    account_data = {
        "plaid_account_id": mock_plaid_response["accounts"][0]["account_id"],
        "account_number": mock_plaid_response["accounts"][0]["mask"],
        "routing_number": "123456789",
        "organization_id": 1,
        "balance": mock_plaid_response["accounts"][0]["balances"]["available"]
    }

    account_response = await async_client.post("/accounts/external", json=account_data)
    assert account_response.status_code == 200
    created_account = account_response.json()
    assert created_account["plaid_account_id"] == account_data["plaid_account_id"]
    assert created_account["status"] == AccountStatus.PENDING

@pytest.mark.asyncio
async def test_plaid_webhook_account_verification(async_client):
    """Test Plaid webhook for account verification."""
    # Create a pending external account first
    account_data = {
        "plaid_account_id": "test_account_id",
        "account_number": "1234",
        "routing_number": "123456789",
        "organization_id": 1,
        "balance": 1000.00
    }
    
    account_response = await async_client.post("/accounts/external", json=account_data)
    assert account_response.status_code == 200
    account_id = account_response.json()["uuid"]
    
    # Simulate Plaid webhook for successful verification
    webhook_data = {
        "webhook_type": "VERIFICATION",
        "webhook_code": "VERIFICATION_STATUS_UPDATED",
        "account_id": "test_account_id",
        "verification_status": "verified"
    }
    
    webhook_response = await async_client.post("/plaid/webhook", json=webhook_data)
    assert webhook_response.status_code == 200
    
    # Verify account status was updated
    account = external_accounts_db[account_id]
    assert account.status == AccountStatus.ACTIVE

@pytest.mark.asyncio
async def test_plaid_webhook_account_error(async_client):
    """Test Plaid webhook for account verification error."""
    # Create a pending external account first
    account_data = {
        "plaid_account_id": "test_account_id",
        "account_number": "1234",
        "routing_number": "123456789",
        "organization_id": 1,
        "balance": 1000.00
    }
    
    account_response = await async_client.post("/accounts/external", json=account_data)
    assert account_response.status_code == 200
    account_id = account_response.json()["uuid"]
    
    # Simulate Plaid webhook for failed verification
    webhook_data = {
        "webhook_type": "VERIFICATION",
        "webhook_code": "VERIFICATION_STATUS_UPDATED",
        "account_id": "test_account_id",
        "verification_status": "failed"
    }
    
    webhook_response = await async_client.post("/plaid/webhook", json=webhook_data)
    assert webhook_response.status_code == 200
    
    # Verify account status was updated
    account = external_accounts_db[account_id]
    assert account.status == AccountStatus.INACTIVE

@pytest.mark.asyncio
async def test_plaid_balance_update(async_client):
    """Test Plaid balance update webhook."""
    # Create an active external account first
    account_data = {
        "plaid_account_id": "test_account_id",
        "account_number": "1234",
        "routing_number": "123456789",
        "organization_id": 1,
        "balance": 1000.00
    }
    
    account_response = await async_client.post("/accounts/external", json=account_data)
    assert account_response.status_code == 200
    account_id = account_response.json()["uuid"]
    
    # Simulate Plaid webhook for balance update
    webhook_data = {
        "webhook_type": "BALANCE",
        "webhook_code": "DEFAULT_UPDATE",
        "account_id": "test_account_id",
        "new_balance": 1500.00
    }
    
    webhook_response = await async_client.post("/plaid/webhook", json=webhook_data)
    assert webhook_response.status_code == 200
    
    # Verify balance was updated
    account = external_accounts_db[account_id]
    assert account.balance == 1500.00