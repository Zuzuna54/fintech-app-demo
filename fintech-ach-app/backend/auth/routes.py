from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from config.database import get_db
from .service import AuthService, get_auth_service
from .jwt import verify_token, get_current_user
from pydantic import BaseModel, EmailStr, UUID4
from typing import Dict, Optional, Union
from config.logging_config import get_logger
import traceback
import json
from domain.sql_models import SuperUser, OrganizationAdministrator

logger = get_logger("auth.routes")
router = APIRouter(prefix="/auth", tags=["auth"])

class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str

class RefreshToken(BaseModel):
    refresh_token: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: UUID4
    email: str
    role: str
    organization_id: Optional[UUID4] = None
    
    class Config:
        from_attributes = True

@router.options("/token")
async def token_options():
    return {}

@router.post("/token", response_model=Token)
async def login(
    request: Request,
    login_data: LoginRequest,
    auth_service: AuthService = Depends(get_auth_service)
):
    """
    Authenticate user and return access and refresh tokens
    """
    logger.info(f"[LOGIN] Login attempt for user: {login_data.email}", extra={
        'ip': request.client.host,
        'user_agent': request.headers.get('user-agent', 'unknown')
    })
    
    try:
        # Log request data (excluding password)
        logger.debug("[LOGIN] Processing login request", extra={
            'email': login_data.email,
            'ip': request.client.host,
            'headers': dict(request.headers)
        })
        
        logger.debug("[LOGIN] Calling authenticate_user")
        try:
            user = await auth_service.authenticate_user(login_data.email, login_data.password)
        except Exception as e:
            logger.error(f"[LOGIN] Authentication error: {str(e)}", exc_info=True)
            if isinstance(e, HTTPException):
                raise e
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail={
                    "message": "Login failed",
                    "reason": "Authentication error",
                    "error": str(e),
                    "error_type": type(e).__name__
                }
            )
        
        if not user:
            logger.warning(f"[LOGIN] Failed login attempt", extra={
                'ip': request.client.host,
                'email': login_data.email,
                'reason': 'Invalid credentials'
            })
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail={
                    "message": "Login failed",
                    "reason": "Invalid credentials"
                }
            )
        
        logger.debug("[LOGIN] User authenticated, creating tokens", extra={
            'user_id': str(user.id),
            'role': str(getattr(user, 'role', 'unknown')),
            'has_org_id': hasattr(user, 'organization_id')
        })
            
        try:
            logger.debug("[LOGIN] Calling create_tokens")
            tokens = await auth_service.create_tokens(user)
            logger.debug("[LOGIN] Tokens created successfully")
        except Exception as e:
            logger.error(f"[LOGIN] Error creating tokens: {str(e)}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail={
                    "message": "Login failed",
                    "reason": "Error creating authentication tokens",
                    "error": str(e),
                    "error_type": type(e).__name__
                }
            )
            
        logger.info(f"[LOGIN] Successful login", extra={
            'ip': request.client.host,
            'user_id': str(user.id),
            'email': login_data.email
        })
        return tokens
        
    except HTTPException as he:
        logger.error(f"[LOGIN] HTTP exception during login", extra={
            'ip': request.client.host,
            'email': login_data.email,
            'error': str(he),
            'status_code': he.status_code,
            'detail': he.detail
        })
        raise he
    except Exception as e:
        logger.error(f"[LOGIN] Unexpected error during login", extra={
            'ip': request.client.host,
            'email': login_data.email,
            'error': str(e),
            'error_type': type(e).__name__
        }, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "message": "Login failed",
                "reason": "Internal server error",
                "error": str(e),
                "error_type": type(e).__name__
            }
        )

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    request: Request,
    current_user: Union[SuperUser, OrganizationAdministrator] = Depends(get_current_user),
    session: AsyncSession = Depends(get_db)
):
    """
    Get current authenticated user information
    """
    logger.info("User info request", extra={
        'ip': request.client.host,
        'user_id': str(current_user.id)
    })
    
    try:
        return current_user
    except Exception as e:
        logger.error("Error retrieving user info", extra={
            'ip': request.client.host,
            'user_id': str(current_user.id),
            'error': str(e)
        }, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error retrieving user information"
        )

@router.post("/refresh", response_model=Token)
async def refresh_token(
    request: Request,
    refresh_token: RefreshToken,
    auth_service: AuthService = Depends(get_auth_service)
):
    """
    Refresh access token using refresh token
    """
    try:
        logger.info("Token refresh attempt", extra={
            'ip': request.client.host
        })
        
        # Verify the token without checking for refresh field
        try:
            payload = verify_token(refresh_token.refresh_token)
            if not all(k in payload for k in ["sub", "email", "role"]):
                logger.warning("Invalid refresh token: missing required fields", extra={
                    'ip': request.client.host,
                    'payload': payload
                })
                raise HTTPException(
                    status_code=400,
                    detail="Invalid refresh token format"
                )
        except Exception as e:
            logger.error(f"Token verification failed: {str(e)}", exc_info=True)
            raise HTTPException(
                status_code=401,
                detail="Invalid or expired refresh token"
            )
        
        # Create new tokens
        token_data = {
            "sub": payload["sub"],
            "email": payload["email"],
            "role": payload["role"],
            "org_id": payload.get("org_id")  # Make org_id optional
        }
        
        tokens = await auth_service.create_tokens(token_data)
        logger.info("Successful token refresh", extra={
            'ip': request.client.host,
            'user_id': payload["sub"]
        })
        return tokens
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Token refresh error", extra={
            'ip': request.client.host,
            'error': str(e)
        }, exc_info=True)
        raise HTTPException(
            status_code=401,
            detail="Could not refresh token"
        ) 