from datetime import datetime, timedelta
from typing import Optional, Dict, Any, Union
import jwt
from jwt import PyJWTError
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from config.database import get_db
from config.logging_config import get_logger
from domain.sql_models import SuperUser, OrganizationAdministrator
import os

logger = get_logger(__name__)

# JWT configuration
SECRET_KEY = os.getenv("JWT_SECRET")
if not SECRET_KEY:
    if os.getenv("ENVIRONMENT") == "development":
        SECRET_KEY = "development-secret-key-do-not-use-in-production"
        logger.warning("Using default development JWT secret key. Do not use in production!")
    else:
        raise ValueError("JWT_SECRET environment variable is not set")

ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("JWT_ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("AUTH_REFRESH_TOKEN_EXPIRE_DAYS", "7"))

security = HTTPBearer()

def create_token(data: dict, expires_delta: timedelta = None) -> str:
    """
    Create a JWT token with proper role handling and error checking
    """
    try:
        to_encode = data.copy()
        
        # Ensure required fields are present
        if "sub" not in to_encode:
            raise ValueError("User ID (sub) is required for token creation")
            
        # Set expiration
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=15)
        to_encode.update({"exp": expire})
        
        # Ensure role is properly formatted
        if "role" in to_encode:
            # Convert role to string if it's an enum
            if hasattr(to_encode["role"], "value"):
                to_encode["role"] = to_encode["role"].value
            else:
                to_encode["role"] = str(to_encode["role"])
        
        # Add token type
        to_encode["token_type"] = "access"
        
        # Create token
        encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
        return encoded_jwt
        
    except Exception as e:
        logger.error(f"Error creating token: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error creating authentication token"
        )

def verify_token(token: Union[str, HTTPAuthorizationCredentials] = Depends(security)) -> Dict[str, Any]:
    """
    Verify a JWT token. Can accept either a string token or HTTPAuthorizationCredentials.
    """
    try:
        # Handle both string tokens and HTTPAuthorizationCredentials
        if isinstance(token, HTTPAuthorizationCredentials):
            token_str = token.credentials
        else:
            token_str = token

        # During development, skip signature verification
        if os.getenv("ENVIRONMENT") == "development":
            payload = jwt.decode(token_str, options={"verify_signature": False})
        else:
            payload = jwt.decode(token_str, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired"
        )
    except PyJWTError as e:
        logger.error(f"JWT verification error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials"
        )

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    session: AsyncSession = Depends(get_db)
) -> Union[SuperUser, OrganizationAdministrator]:
    """
    Get the current authenticated user from the token
    """
    try:
        token = credentials.credentials
        # During development, skip signature verification
        if os.getenv("ENVIRONMENT") == "development":
            payload = jwt.decode(token, options={"verify_signature": False})
            # For development, create a mock user if not found
            user = SuperUser(
                id=payload.get("sub"),
                email=payload.get("email")
            )
            user.role = payload.get("role")
            user.organization_id = payload.get("org_id")
            return user
        else:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication token"
            )

        # Check user role and get the appropriate user
        role = payload.get("role")
        if role == "superuser":
            query = select(SuperUser).where(SuperUser.id == user_id)
        elif role == "organization_admin":
            query = select(OrganizationAdministrator).where(OrganizationAdministrator.id == user_id)
        else:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid user role"
            )

        result = await session.execute(query)
        user = result.scalar_one_or_none()

        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )

        # Add role and organization_id to user object
        user.role = role
        user.organization_id = payload.get("org_id") or payload.get("organization_id")
        return user

    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired"
        )
    except PyJWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials"
        )
    except Exception as e:
        logger.error("Authentication error", extra={
            'error': str(e),
            'token': token if 'token' in locals() else None,
            'payload': payload if 'payload' in locals() else None
        }, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Authentication error"
        ) 