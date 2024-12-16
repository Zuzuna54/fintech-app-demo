from datetime import datetime, timedelta
from typing import Optional, Dict, Union
from fastapi import Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from config.database import get_db
from domain.sql_models import SuperUser, OrganizationAdministrator
from passlib.context import CryptContext
from .jwt import create_token, ACCESS_TOKEN_EXPIRE_MINUTES, REFRESH_TOKEN_EXPIRE_DAYS
import logging

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
logger = logging.getLogger(__name__)

class AuthService:
    def __init__(self, session: AsyncSession):
        self.session = session

    def get_password_hash(self, password: str) -> str:
        """
        Hash a password using bcrypt
        """
        return pwd_context.hash(password)

    async def authenticate_user(self, email: str, password: str) -> Optional[Union[SuperUser, OrganizationAdministrator]]:
        """
        Authenticate a user with email and password
        """
        try:
            logger.info(f"[AUTH] Starting authentication for user: {email}")
            
            # Try superuser first
            logger.debug("[AUTH] Executing superuser query")
            try:
                result = await self.session.execute(
                    select(SuperUser).where(SuperUser.email == email)
                )
                user = result.scalar_one_or_none()
                logger.debug(f"[AUTH] Superuser query result: {user is not None}")
            except Exception as e:
                logger.error(f"[AUTH] Error querying superuser table: {str(e)}", exc_info=True)
                raise
            
            if not user:
                logger.debug("[AUTH] User not found in superuser table, checking organization admin table")
                try:
                    # Try organization admin
                    result = await self.session.execute(
                        select(OrganizationAdministrator).where(OrganizationAdministrator.email == email)
                    )
                    user = result.scalar_one_or_none()
                    logger.debug(f"[AUTH] Organization admin query result: {user is not None}")
                except Exception as e:
                    logger.error(f"[AUTH] Error querying organization admin table: {str(e)}", exc_info=True)
                    raise
            
            if not user:
                logger.info(f"[AUTH] No user found with email: {email}")
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail={
                        "message": "Authentication failed",
                        "reason": "User not found",
                        "email": email
                    }
                )
            
            logger.debug(f"[AUTH] Found user with role: {getattr(user, 'role', 'unknown')}")
            logger.debug(f"[AUTH] User attributes: {dir(user)}")
            
            if not hasattr(user, 'hashed_password'):
                logger.error(f"[AUTH] User {email} has no hashed_password field")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail={
                        "message": "Authentication failed",
                        "reason": "Invalid user data",
                        "error": "Missing password hash"
                    }
                )
            
            try:
                logger.debug("[AUTH] Attempting password verification")
                logger.debug(f"[AUTH] Password hash exists: {bool(user.hashed_password)}")
                is_valid = pwd_context.verify(password, user.hashed_password)
                logger.debug(f"[AUTH] Password verification result: {is_valid}")
                if not is_valid:
                    logger.info(f"[AUTH] Invalid password for user: {email}")
                    raise HTTPException(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        detail={
                            "message": "Authentication failed",
                            "reason": "Invalid password"
                        }
                    )
            except ValueError as ve:
                logger.error(f"[AUTH] Password verification error: {str(ve)}", exc_info=True)
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail={
                        "message": "Authentication failed",
                        "reason": "Password verification error",
                        "error": str(ve)
                    }
                )
                
            logger.info(f"[AUTH] Successfully authenticated user: {email}")
            return user
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"[AUTH] Authentication error for {email}: {str(e)}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail={
                    "message": "Authentication failed",
                    "reason": "Internal server error",
                    "error": str(e),
                    "error_type": type(e).__name__
                }
            )

    async def create_tokens(self, user: Union[SuperUser, OrganizationAdministrator, Dict]) -> Dict[str, str]:
        """
        Create access and refresh tokens for a user
        """
        try:
            logger.debug("[AUTH] Creating tokens for user")
            
            # Handle both user objects and token data dictionaries
            if isinstance(user, dict):
                user_data = user
            else:
                user_data = {
                    "sub": str(user.id),
                    "email": user.email,
                    "role": user.role if hasattr(user, "role") else "organization_admin",
                }
                # Add organization_id if present
                if hasattr(user, "organization_id") and user.organization_id:
                    user_data["org_id"] = str(user.organization_id)
            
            # Create access token
            access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
            access_token = create_token(
                data=user_data,
                expires_delta=access_token_expires
            )
            
            # Create refresh token with longer expiration and refresh flag
            refresh_token_expires = timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
            refresh_data = user_data.copy()
            refresh_data["refresh"] = True  # Add refresh flag
            refresh_data["token_type"] = "refresh"  # Add token type
            refresh_token = create_token(
                data=refresh_data,
                expires_delta=refresh_token_expires
            )
            
            logger.debug("[AUTH] Tokens created successfully")
            return {
                "access_token": access_token,
                "refresh_token": refresh_token,
                "token_type": "bearer"
            }
            
        except Exception as e:
            logger.error(f"[AUTH] Error creating tokens: {str(e)}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error creating authentication tokens: {str(e)}"
            )

    async def get_current_user(self, user_id: str) -> Optional[Union[SuperUser, OrganizationAdministrator]]:
        """
        Get current user from database
        """
        # Try superuser first
        result = await self.session.execute(
            select(SuperUser).where(SuperUser.id == user_id)
        )
        user = result.scalar_one_or_none()
        
        if not user:
            # Try organization admin
            result = await self.session.execute(
                select(OrganizationAdministrator).where(OrganizationAdministrator.id == user_id)
            )
            user = result.scalar_one_or_none()
            
        return user

async def get_auth_service(session: AsyncSession = Depends(get_db)) -> AuthService:
    return AuthService(session) 