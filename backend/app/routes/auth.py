"""
Authentication routes for user registration, login, logout, and token refresh.
"""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy.orm import Session

from app.config import get_settings
from app.database import get_db
from app.dependencies import get_current_active_user
from app.models import User as UserModel
from app.schemas import User, UserCreate, UserLogin
from app.utils.auth import (
    create_access_token,
    create_refresh_token,
    get_password_hash,
    verify_password,
    verify_token,
)
from app.utils.logger import get_logger

router = APIRouter(tags=["Authentication"])
settings = get_settings()
logger = get_logger(__name__)


def set_auth_cookies(response: Response, access_token: str, refresh_token: str):
    """
    Set authentication cookies on the response.

    Args:
        response: FastAPI response object
        access_token: JWT access token
        refresh_token: JWT refresh token
    """
    # Set access token cookie (30 minutes)
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=not settings.DEBUG,  # HTTPS only in production
        samesite="lax",
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )

    # Set refresh token cookie (7 days)
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=not settings.DEBUG,
        samesite="lax",
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
    )


def clear_auth_cookies(response: Response):
    """
    Clear authentication cookies from the response.

    Args:
        response: FastAPI response object
    """
    response.delete_cookie(key="access_token")
    response.delete_cookie(key="refresh_token")


@router.post("/register", response_model=User, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate, db: Annotated[Session, Depends(get_db)]):
    """
    Register a new user.

    Args:
        user_data: User registration data
        db: Database session

    Returns:
        User: The created user

    Raises:
        HTTPException: If email or username already exists
    """
    # Check if email already exists
    existing_user = db.query(UserModel).filter(UserModel.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    # Check if username already exists
    existing_username = db.query(UserModel).filter(UserModel.username == user_data.username).first()
    if existing_username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already taken",
        )

    # Create new user
    hashed_password = get_password_hash(user_data.password)
    db_user = UserModel(
        email=user_data.email,
        username=user_data.username,
        hashed_password=hashed_password,
    )

    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    return db_user


@router.post("/login")
async def login(response: Response, credentials: UserLogin, db: Annotated[Session, Depends(get_db)]):
    """
    Login user and return tokens.

    Args:
        response: FastAPI response object
        credentials: User login credentials
        db: Database session

    Returns:
        dict: Tokens and user info

    Raises:
        HTTPException: If credentials are invalid
    """
    logger.info(f"📝 Login attempt for email: {credentials.email}")

    # Find user by email
    user = db.query(UserModel).filter(UserModel.email == credentials.email).first()

    if not user or not verify_password(credentials.password, user.hashed_password):
        logger.warning(f"❌ Failed login attempt for email: {credentials.email}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )

    if not user.is_active:
        logger.warning(f"❌ Login attempted for inactive user: {user.id}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user",
        )

    # Create tokens
    access_token = create_access_token(data={"sub": str(user.id)})
    refresh_token = create_refresh_token(data={"sub": str(user.id)})
    logger.debug(f"🔑 Created tokens - access: {len(access_token)}, refresh: {len(refresh_token)}")

    # Also set cookies for browser-based requests
    logger.info(f"✅ Setting auth cookies for user {user.id}")
    set_auth_cookies(response, access_token, refresh_token)

    logger.info(f"✅ Login successful for user {user.id} ({user.email})")

    # Return tokens in body + headers for maximum compatibility
    response.headers["X-Access-Token"] = access_token
    response.headers["X-Refresh-Token"] = refresh_token

    return {
        "user": {
            "id": user.id,
            "email": user.email,
            "username": user.username,
        },
        "access_token": access_token,
        "refresh_token": refresh_token,
    }


@router.post("/refresh")
async def refresh_token(
    request: Request,
    db: Annotated[Session, Depends(get_db)],
    response: Response,
):
    """
    Refresh access token using refresh token from cookie or header.

    Args:
        request: FastAPI request object
        response: FastAPI response object
        db: Database session

    Returns:
        dict: New access token

    Raises:
        HTTPException: If refresh token is invalid
    """
    try:
        # Try to get refresh token from:
        # 1. Cookie (httpOnly)
        # 2. Authorization header
        # 3. Body

        refresh_token = request.cookies.get("refresh_token") or request.headers.get("X-Refresh-Token")

        if not refresh_token:
            logger.warning("⚠️ No refresh token found in cookies or headers")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Refresh token not found",
            )

        logger.info(f"🔄 Processing refresh token (length: {len(refresh_token)})")

        # Verify refresh token
        try:
            payload = verify_token(refresh_token, token_type="refresh")
        except Exception as e:
            logger.error(f"❌ Token verification failed: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token",
            ) from None

        user_id: int = int(payload.get("sub"))

        if user_id is None:
            logger.error("❌ Invalid refresh token: no user_id in payload")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token",
            )

        # Verify user exists and is active
        user = db.query(UserModel).filter(UserModel.id == user_id).first()
        if not user or not user.is_active:
            logger.error(f"❌ User not found or inactive: {user_id}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found or inactive",
            )

        # Create new access token
        new_access_token = create_access_token(data={"sub": str(user.id)})

        # Set new access token cookie
        response.set_cookie(
            key="access_token",
            value=new_access_token,
            httponly=True,
            secure=not settings.DEBUG,
            samesite="lax",
            max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        )

        # Also return token in header and body for maximum compatibility
        response.headers["X-Access-Token"] = new_access_token

        logger.info(f"✅ Token refreshed successfully for user {user.id}")

        return {
            "access_token": new_access_token,
            "message": "Token refreshed successfully",
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Token refresh error: {type(e).__name__}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token"
        ) from None


@router.post("/logout")
async def logout(response: Response):
    """
    Logout user by clearing authentication cookies.

    Args:
        response: FastAPI response object

    Returns:
        dict: Success message
    """
    clear_auth_cookies(response)
    return {"message": "Logout successful"}


@router.get("/me", response_model=User)
async def get_current_user_info(
    current_user: Annotated[UserModel, Depends(get_current_active_user)],
):
    """
    Get current authenticated user information.

    Args:
        current_user: The authenticated user

    Returns:
        User: Current user data
    """
    return current_user
