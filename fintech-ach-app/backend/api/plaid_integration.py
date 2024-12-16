from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, UUID4
from typing import Optional
import httpx
import os
from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import AsyncSession
from config.database import get_db
from domain.sql_models import ExternalOrganizationBankAccount, AccountStatus, BankAccountType
from auth.jwt import get_current_user
from auth.roles import Role
from uuid import uuid4

load_dotenv()

router = APIRouter(prefix="/plaid", tags=["plaid"])

PLAID_CLIENT_ID = os.getenv('PLAID_CLIENT_ID')
PLAID_SECRET = os.getenv('PLAID_SECRET')
PLAID_ENV = os.getenv('PLAID_ENV', 'sandbox')

PLAID_BASE_URL = {
    'sandbox': 'https://sandbox.plaid.com',
    'development': 'https://development.plaid.com',
    'production': 'https://production.plaid.com'
}.get(PLAID_ENV, 'https://sandbox.plaid.com')

class CreateLinkTokenRequest(BaseModel):
    organization_id: UUID4

class PublicTokenExchangeRequest(BaseModel):
    public_token: str
    organization_id: UUID4
    account_name: Optional[str] = None

@router.post("/create_link_token")
async def create_link_token(
    link_request: CreateLinkTokenRequest,
    current_user = Depends(get_current_user)
):
    """Create a Plaid Link token for account linking."""
    # Check if user is organization admin
    if current_user.role != Role.ORGANIZATION_ADMIN:
        raise HTTPException(status_code=403, detail="Only organization administrators can link bank accounts")
    
    # Check if user has access to the organization
    if not current_user.organization_id or str(link_request.organization_id) != str(current_user.organization_id):
        raise HTTPException(status_code=403, detail="User does not have access to this organization")
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{PLAID_BASE_URL}/link/token/create",
                json={
                    "client_id": PLAID_CLIENT_ID,
                    "secret": PLAID_SECRET,
                    "client_name": "Fintech ACH App",
                    "user": {"client_user_id": str(link_request.organization_id)},
                    "products": ["auth"],
                    "country_codes": ["US"],
                    "language": "en",
                    "account_filters": {
                        "depository": {
                            "account_subtypes": ["checking", "savings"]
                        }
                    }
                }
            )
            
            response_data = response.json()
            if response.status_code != 200:
                raise HTTPException(status_code=400, detail=str(response_data))
                
            return {"link_token": response_data.get("link_token")}
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/exchange_token")
async def exchange_public_token(
    token_request: PublicTokenExchangeRequest,
    session: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Exchange public token for access token and create external account."""
    # Check if user is organization admin
    if current_user.role != Role.ORGANIZATION_ADMIN:
        raise HTTPException(status_code=403, detail="Only organization administrators can link bank accounts")
    
    # Check if user has access to the organization
    if str(token_request.organization_id) != str(current_user.organization_id):
        raise HTTPException(status_code=403, detail="User does not have access to this organization")
    
    try:
        # Exchange public token for access token
        async with httpx.AsyncClient() as client:
            exchange_response = await client.post(
                f"{PLAID_BASE_URL}/item/public_token/exchange",
                json={
                    "client_id": PLAID_CLIENT_ID,
                    "secret": PLAID_SECRET,
                    "public_token": token_request.public_token
                }
            )
            
            if exchange_response.status_code != 200:
                error_detail = await exchange_response.json()
                raise HTTPException(status_code=400, detail=str(error_detail))

            access_token = exchange_response.json()["access_token"]
            
            # Get account details
            auth_response = await client.post(
                f"{PLAID_BASE_URL}/auth/get",
                json={
                    "client_id": PLAID_CLIENT_ID,
                    "secret": PLAID_SECRET,
                    "access_token": access_token
                }
            )
            
            if auth_response.status_code != 200:
                error_detail = await auth_response.json()
                raise HTTPException(status_code=400, detail=str(error_detail))
            
            auth_data = auth_response.json()
            created_accounts = []

            # Process all accounts
            for account in auth_data["accounts"]:
                # Find matching ACH numbers for this account
                numbers = next(
                    (nums for nums in auth_data["numbers"]["ach"] if nums["account_id"] == account["account_id"]),
                    None
                )
                
                if not numbers:
                    continue  # Skip accounts without ACH numbers
                
                # Create external account
                new_account = ExternalOrganizationBankAccount(
                    uuid=uuid4(),
                    name=account["name"],
                    plaid_account_id=account["account_id"],
                    account_type=BankAccountType.CHECKING if account["subtype"] == "checking" else BankAccountType.SAVINGS,
                    account_number=numbers["account"],
                    routing_number=numbers["routing"],
                    balance=float(account["balances"]["available"] or 0.0),
                    status=AccountStatus.ACTIVE,
                    organization_id=token_request.organization_id
                )

                session.add(new_account)
                created_accounts.append(str(new_account.uuid))

            if not created_accounts:
                raise HTTPException(status_code=400, detail="No valid ACH accounts found")

            await session.commit()
            
            return {
                "status": "success",
                "account_ids": created_accounts
            }
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e)) 