"""
Authentication utilities for password hashing, JWT tokens, and credential encryption.
"""

from datetime import datetime, timedelta
from typing import Any, Dict

from cryptography.fernet import Fernet
from jose import JWTError, jwt
from passlib.context import CryptContext

from app.config import get_settings

settings = get_settings()

# Password hashing context
pwd_context = CryptContext(schemes=["argon2", "bcrypt"], deprecated="auto")

# Encryption for directory credentials
_fernet = None


def get_fernet():
    """Get or create Fernet cipher for credential encryption"""
    global _fernet
    if _fernet is None:
        encryption_key = settings.ENCRYPTION_KEY
        if not encryption_key:
            raise ValueError("ENCRYPTION_KEY not set in environment")
        _fernet = Fernet(encryption_key.encode())
    return _fernet


# Password Hashing Functions
def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a plain password against a hashed password.

    Args:
        plain_password: The plain text password
        hashed_password: The hashed password from database

    Returns:
        True if password matches, False otherwise
    """
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """
    Hash a password using bcrypt.

    Args:
        password: Plain text password

    Returns:
        Hashed password string
    """
    return pwd_context.hash(password)


# JWT Token Functions
def create_access_token(data: Dict[str, Any], expires_delta: timedelta = None) -> str:
    """
    Create a JWT access token.

    Args:
        data: Data to encode in the token (typically {"sub": user_id})
        expires_delta: Optional custom expiration time

    Returns:
        Encoded JWT token
    """
    to_encode = data.copy()

    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode.update({"exp": expire, "type": "access"})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def create_refresh_token(data: Dict[str, Any]) -> str:
    """
    Create a JWT refresh token.

    Args:
        data: Data to encode in the token (typically {"sub": user_id})

    Returns:
        Encoded JWT refresh token
    """
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)

    to_encode.update({"exp": expire, "type": "refresh"})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def verify_token(token: str, token_type: str = "access") -> Dict[str, Any]:
    """
    Verify and decode a JWT token.

    Args:
        token: The JWT token to verify
        token_type: Expected token type ("access" or "refresh")

    Returns:
        Decoded token payload

    Raises:
        JWTError: If token is invalid or expired
        ValueError: If token type doesn't match
    """
    try:
        # Decode with options to allow string subject
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
            options={"verify_signature": True},
        )

        # Verify token type
        if payload.get("type") != token_type:
            raise ValueError(f"Invalid token type. Expected {token_type}")

        return payload
    except JWTError as e:
        raise JWTError(f"Token verification failed: {str(e)}") from e


# Credential Encryption Functions
def encrypt_credential(value: str) -> str:
    """
    Encrypt a credential value (e.g., directory login password).

    Args:
        value: Plain text credential

    Returns:
        Encrypted credential as string
    """
    fernet = get_fernet()
    encrypted = fernet.encrypt(value.encode())
    return encrypted.decode()


def decrypt_credential(encrypted_value: str) -> str:
    """
    Decrypt a credential value.

    Args:
        encrypted_value: Encrypted credential string

    Returns:
        Decrypted plain text credential
    """
    fernet = get_fernet()
    decrypted = fernet.decrypt(encrypted_value.encode())
    return decrypted.decode()


def generate_encryption_key() -> str:
    """
    Generate a new Fernet encryption key.

    Returns:
        Base64-encoded encryption key
    """
    return Fernet.generate_key().decode()
