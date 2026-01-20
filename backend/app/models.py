import enum
from datetime import datetime

from sqlalchemy import (
    JSON,
    Boolean,
    Column,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import relationship

from app.database import Base


class SubmissionStatus(str, enum.Enum):
    PENDING = "pending"
    SUBMITTED = "submitted"
    APPROVED = "approved"
    REJECTED = "rejected"
    FAILED = "failed"


class DirectoryStatus(str, enum.Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    TESTING = "testing"


class SaasProduct(Base):
    __tablename__ = "saas_products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    website_url = Column(String(500), nullable=False)
    description = Column(Text, nullable=False)
    short_description = Column(String(500))
    category = Column(String(100))
    logo_url = Column(String(500))
    contact_email = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)

    # Additional fields that might be needed
    tagline = Column(String(255))
    pricing_model = Column(String(100))
    features = Column(JSON)  # Store as array
    social_links = Column(JSON)  # Twitter, LinkedIn, etc.

    # Relationships
    submissions = relationship("Submission", back_populates="saas_product")


class Directory(Base):
    __tablename__ = "directories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    url = Column(String(500), nullable=False, unique=True)
    submission_url = Column(String(500))  # Specific submission page
    status = Column(Enum(DirectoryStatus), default=DirectoryStatus.ACTIVE)

    # Login credentials (encrypted in production)
    requires_login = Column(Boolean, default=False)
    login_url = Column(String(500))
    login_username = Column(String(255))
    login_password = Column(String(255))

    # Multi-step form support
    is_multi_step = Column(Boolean, default=False)
    step_count = Column(Integer, default=1)

    # Metadata
    domain_authority = Column(Integer)  # SEO metric
    category = Column(String(100))
    requires_approval = Column(Boolean, default=True)
    estimated_approval_time = Column(String(50))  # "24 hours", "1 week", etc.

    # Form detection cache
    detected_form_structure = Column(JSON)  # Cache of form fields
    last_form_detection = Column(DateTime)

    # Success tracking
    total_submissions = Column(Integer, default=0)
    successful_submissions = Column(Integer, default=0)

    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)

    # Relationships
    submissions = relationship("Submission", back_populates="directory")


class Submission(Base):
    __tablename__ = "submissions"

    id = Column(Integer, primary_key=True, index=True)
    saas_product_id = Column(Integer, ForeignKey("saas_products.id"), nullable=False)
    directory_id = Column(Integer, ForeignKey("directories.id"), nullable=False)

    status = Column(Enum(SubmissionStatus), default=SubmissionStatus.PENDING)

    # Submission details
    submitted_at = Column(DateTime)
    approved_at = Column(DateTime)
    rejected_at = Column(DateTime)

    # Metadata
    submission_data = Column(JSON)  # What data was submitted
    response_message = Column(Text)  # Success/error message
    listing_url = Column(String(500))  # URL of the approved listing

    # Retry logic
    retry_count = Column(Integer, default=0)
    max_retries = Column(Integer, default=3)
    last_retry_at = Column(DateTime)
    error_log = Column(JSON)  # Array of error messages

    # AI detection data
    detected_fields = Column(JSON)  # Fields detected by AI
    form_screenshot_url = Column(String(500))  # Screenshot of the form

    # Multi-step tracking
    current_step = Column(Integer, default=1)
    completed_steps = Column(JSON)

    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)

    # Relationships
    saas_product = relationship("SaasProduct", back_populates="submissions")
    directory = relationship("Directory", back_populates="submissions")


class FormField(Base):
    """Store detected form fields for learning and caching"""

    __tablename__ = "form_fields"

    id = Column(Integer, primary_key=True, index=True)
    directory_id = Column(Integer, ForeignKey("directories.id"), nullable=False)

    field_name = Column(String(255))  # e.g., "company_name", "website"
    field_type = Column(String(50))  # text, email, url, textarea, file
    field_label = Column(String(255))  # What the label says
    selector = Column(String(500))  # CSS/XPath selector
    is_required = Column(Boolean, default=False)

    # AI confidence
    confidence_score = Column(Integer)  # 0-100

    created_at = Column(DateTime, default=datetime.now)
