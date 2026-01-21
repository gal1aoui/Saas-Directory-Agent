from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, EmailStr, Field, HttpUrl, field_validator


# User & Authentication Schemas
class UserBase(BaseModel):
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=100)


class UserCreate(UserBase):
    password: str = Field(..., min_length=8, max_length=100)

    @field_validator("username")
    @classmethod
    def validate_username(cls, v: str) -> str:
        """Validate username contains only allowed characters"""
        import re

        if not re.match(r"^[a-zA-Z0-9_-]+$", v):
            raise ValueError("Username can only contain letters, numbers, underscores, and hyphens")
        return v

    @field_validator("password")
    @classmethod
    def validate_password_strength(cls, v: str) -> str:
        """Validate password meets security requirements"""
        import re

        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not re.search(r"[a-z]", v):
            raise ValueError("Password must contain at least one lowercase letter")
        if not re.search(r"[0-9]", v):
            raise ValueError("Password must contain at least one number")
        return v


class UserLogin(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=1)


class User(UserBase):
    id: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    user_id: Optional[int] = None


# Enums
class SubmissionStatus(str, Enum):
    PENDING = "pending"
    SUBMITTED = "submitted"
    APPROVED = "approved"
    REJECTED = "rejected"
    FAILED = "failed"


class DirectoryStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    TESTING = "testing"


# SaaS Product Schemas
class SaasProductBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    website_url: HttpUrl
    description: str = Field(..., min_length=10)
    short_description: Optional[str] = Field(None, max_length=500)
    category: Optional[str] = None
    logo_url: Optional[HttpUrl] = None
    contact_email: EmailStr
    tagline: Optional[str] = None
    pricing_model: Optional[str] = None
    features: Optional[List[str]] = None
    social_links: Optional[Dict[str, str]] = None


class SaasProductCreate(SaasProductBase):
    pass


class SaasProductUpdate(BaseModel):
    name: Optional[str] = None
    website_url: Optional[HttpUrl] = None
    description: Optional[str] = None
    short_description: Optional[str] = None
    category: Optional[str] = None
    logo_url: Optional[HttpUrl] = None
    contact_email: Optional[EmailStr] = None
    tagline: Optional[str] = None
    pricing_model: Optional[str] = None
    features: Optional[List[str]] = None
    social_links: Optional[Dict[str, str]] = None


class SaasProduct(SaasProductBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Directory Schemas
class DirectoryBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    url: HttpUrl
    submission_url: Optional[HttpUrl] = None
    status: DirectoryStatus = DirectoryStatus.ACTIVE
    domain_authority: Optional[int] = Field(None, ge=0, le=100)
    category: Optional[str] = None
    requires_approval: bool = True
    estimated_approval_time: Optional[str] = None


class DirectoryCreate(DirectoryBase):
    pass


class DirectoryUpdate(BaseModel):
    name: Optional[str] = None
    url: Optional[HttpUrl] = None
    submission_url: Optional[HttpUrl] = None
    status: Optional[DirectoryStatus] = None
    domain_authority: Optional[int] = None
    category: Optional[str] = None
    requires_approval: Optional[bool] = None
    estimated_approval_time: Optional[str] = None


class Directory(DirectoryBase):
    id: int
    total_submissions: int
    successful_submissions: int
    detected_form_structure: Optional[Dict[str, Any]] = None
    last_form_detection: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Submission Schemas
class SubmissionBase(BaseModel):
    saas_product_id: int
    directory_id: int


class SubmissionCreate(SubmissionBase):
    pass


class SubmissionUpdate(BaseModel):
    status: Optional[SubmissionStatus] = None
    response_message: Optional[str] = None
    listing_url: Optional[HttpUrl] = None


class SubmissionError(BaseModel):
    timestamp: datetime
    error: str


class Submission(SubmissionBase):
    id: int
    status: SubmissionStatus
    submitted_at: Optional[datetime] = None
    approved_at: Optional[datetime] = None
    rejected_at: Optional[datetime] = None
    submission_data: Optional[Dict[str, Any]] = None
    response_message: Optional[str] = None
    listing_url: Optional[str] = None
    retry_count: int
    max_retries: int
    last_retry_at: Optional[datetime] = None
    error_log: Optional[List[SubmissionError]] = None
    detected_fields: Optional[Dict[str, Any]] = None
    form_screenshot_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Submission with relationships
class SubmissionWithDetails(Submission):
    saas_product: SaasProduct
    directory: Directory


# Bulk submission request
class BulkSubmissionRequest(BaseModel):
    saas_product_id: int
    directory_ids: List[int]


# Dashboard statistics
class DashboardStats(BaseModel):
    total_submissions: int
    pending_submissions: int
    submitted_submissions: int
    approved_submissions: int
    failed_submissions: int
    success_rate: float
    total_directories: int
    active_directories: int


# Form detection response
class DetectedFormField(BaseModel):
    field_name: str
    field_type: str
    field_label: str
    selector: str
    is_required: bool
    confidence_score: int


class FormDetectionResponse(BaseModel):
    directory_id: int
    detected_fields: List[DetectedFormField]
    screenshot_url: Optional[str] = None
    detection_timestamp: datetime
