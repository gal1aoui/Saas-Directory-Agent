"""
FastAPI dependencies for authentication and authorization.
"""

from typing import Annotated

from fastapi import Depends, HTTPException, Request, status
from jose import JWTError
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User
from app.utils.auth import verify_token


async def get_current_user(request: Request, db: Annotated[Session, Depends(get_db)]) -> User:
    """
    Extract and validate user from JWT token in:
    1. Authorization header (Bearer token) - primary
    2. httpOnly cookie - fallback

    Args:
        request: FastAPI request object
        db: Database session

    Returns:
        User: The authenticated user

    Raises:
        HTTPException: If authentication fails
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Not authenticated",
        headers={"WWW-Authenticate": "Bearer"},
    )

    # Try to get token from Authorization header first
    auth_header = request.headers.get("Authorization")
    token = None

    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header[7:]  # Remove "Bearer " prefix
    else:
        # Fallback to cookie
        token = request.cookies.get("access_token")

    if not token:
        raise credentials_exception

    try:
        # Verify and decode token
        payload = verify_token(token, token_type="access")
        user_id: int = int(payload.get("sub"))

        if user_id is None:
            raise credentials_exception

    except JWTError as e:
        raise credentials_exception from e
    except ValueError as e:
        raise credentials_exception from e

    # Get user from database
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    return user


async def get_current_active_user(current_user: Annotated[User, Depends(get_current_user)]) -> User:
    """
    Get current user and verify they are active.

    Args:
        current_user: The current authenticated user

    Returns:
        User: The active user

    Raises:
        HTTPException: If user is inactive
    """
    if not current_user.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Inactive user")

    return current_user


async def get_refresh_token(request: Request) -> str:
    """
    Extract refresh token from httpOnly cookie.

    Args:
        request: FastAPI request object

    Returns:
        str: The refresh token

    Raises:
        HTTPException: If refresh token not found
    """
    refresh_token = request.cookies.get("refresh_token")

    # Debug logging
    from app.utils.logger import get_logger

    logger = get_logger(__name__)

    if not refresh_token:
        logger.warning(
            f"⚠️ Refresh token not found in cookies. Available cookies: {list(request.cookies.keys())}"
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token not found",
        )

    logger.info("✅ Refresh token found in cookies")
    return refresh_token
