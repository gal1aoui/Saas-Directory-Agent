from datetime import datetime
from typing import Annotated, List

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_active_user
from app.models import Directory, SaasProduct, Submission, SubmissionStatus, User
from app.schemas import (
    BulkSubmissionRequest,
    DashboardStats,
    Submission as SubmissionSchema,
    SubmissionCreate,
    SubmissionUpdate,
    SubmissionWithDetails,
)
from app.services.workflow_manager import WorkflowManager

router = APIRouter()


@router.post("/", response_model=SubmissionSchema, status_code=status.HTTP_201_CREATED)
async def create_submission(
    submission: SubmissionCreate,
    background_tasks: BackgroundTasks,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    """Create and execute a new submission for the authenticated user"""
    # Verify user owns the SaaS product and directory
    saas = (
        db.query(SaasProduct)
        .filter(
            SaasProduct.id == submission.saas_product_id,
            SaasProduct.user_id == current_user.id,
        )
        .first()
    )
    if not saas:
        raise HTTPException(status_code=404, detail="SaaS product not found")

    directory = (
        db.query(Directory)
        .filter(
            Directory.id == submission.directory_id, Directory.user_id == current_user.id
        )
        .first()
    )
    if not directory:
        raise HTTPException(status_code=404, detail="Directory not found")

    workflow = WorkflowManager(db)

    # Execute submission
    result = await workflow.submit_to_directory(
        saas_product_id=submission.saas_product_id,
        directory_id=submission.directory_id,
        user_id=current_user.id,
    )

    return result


@router.post("/bulk", response_model=List[SubmissionSchema])
async def bulk_submit(
    request: BulkSubmissionRequest,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    """Submit to multiple directories at once for the authenticated user"""
    # Verify user owns the SaaS product
    saas = (
        db.query(SaasProduct)
        .filter(
            SaasProduct.id == request.saas_product_id, SaasProduct.user_id == current_user.id
        )
        .first()
    )
    if not saas:
        raise HTTPException(status_code=404, detail="SaaS product not found")

    # Verify user owns all directories
    directories = (
        db.query(Directory)
        .filter(
            Directory.id.in_(request.directory_ids), Directory.user_id == current_user.id
        )
        .all()
    )
    if len(directories) != len(request.directory_ids):
        raise HTTPException(status_code=404, detail="One or more directories not found")

    workflow = WorkflowManager(db)

    submissions = await workflow.bulk_submit(
        saas_product_id=request.saas_product_id,
        directory_ids=request.directory_ids,
        user_id=current_user.id,
    )

    return submissions


@router.get("/", response_model=List[SubmissionWithDetails])
async def list_submissions(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_active_user)],
    status: SubmissionStatus = None,
    saas_product_id: int = None,
    directory_id: int = None,
    skip: int = 0,
    limit: int = 100,
):
    """List submissions owned by the authenticated user with filters"""
    query = db.query(Submission).filter(Submission.user_id == current_user.id)

    if status:
        query = query.filter(Submission.status == status)
    if saas_product_id:
        query = query.filter(Submission.saas_product_id == saas_product_id)
    if directory_id:
        query = query.filter(Submission.directory_id == directory_id)

    submissions = query.order_by(Submission.created_at.desc()).offset(skip).limit(limit).all()
    return submissions


@router.get("/stats", response_model=DashboardStats)
async def get_dashboard_stats(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    """Get dashboard statistics for the authenticated user"""
    # All stats filtered by user_id
    total_submissions = (
        db.query(func.count(Submission.id))
        .filter(Submission.user_id == current_user.id)
        .scalar()
    )
    pending = (
        db.query(func.count(Submission.id))
        .filter(
            Submission.user_id == current_user.id,
            Submission.status == SubmissionStatus.PENDING,
        )
        .scalar()
    )
    submitted = (
        db.query(func.count(Submission.id))
        .filter(
            Submission.user_id == current_user.id,
            Submission.status == SubmissionStatus.SUBMITTED,
        )
        .scalar()
    )
    approved = (
        db.query(func.count(Submission.id))
        .filter(
            Submission.user_id == current_user.id,
            Submission.status == SubmissionStatus.APPROVED,
        )
        .scalar()
    )
    failed = (
        db.query(func.count(Submission.id))
        .filter(
            Submission.user_id == current_user.id, Submission.status == SubmissionStatus.FAILED
        )
        .scalar()
    )

    success_rate = (approved / total_submissions * 100) if total_submissions > 0 else 0

    total_directories = (
        db.query(func.count(Directory.id))
        .filter(Directory.user_id == current_user.id)
        .scalar()
    )
    active_directories = (
        db.query(func.count(Directory.id))
        .filter(Directory.user_id == current_user.id, Directory.status == "active")
        .scalar()
    )

    return {
        "total_submissions": total_submissions,
        "pending_submissions": pending,
        "submitted_submissions": submitted,
        "approved_submissions": approved,
        "failed_submissions": failed,
        "success_rate": success_rate,
        "total_directories": total_directories,
        "active_directories": active_directories,
    }


@router.get("/{submission_id}", response_model=SubmissionWithDetails)
async def get_submission(
    submission_id: int,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    """Get a specific submission with details owned by the authenticated user"""
    submission = (
        db.query(Submission)
        .filter(Submission.id == submission_id, Submission.user_id == current_user.id)
        .first()
    )
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    return submission


@router.put("/{submission_id}", response_model=SubmissionSchema)
async def update_submission(
    submission_id: int,
    submission_update: SubmissionUpdate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    """Update a submission owned by the authenticated user"""
    submission = (
        db.query(Submission)
        .filter(Submission.id == submission_id, Submission.user_id == current_user.id)
        .first()
    )
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")

    update_data = submission_update.model_dump(mode="json", exclude_unset=True)
    for field, value in update_data.items():
        setattr(submission, field, value)

    if submission_update.status == SubmissionStatus.APPROVED:
        submission.approved_at = datetime.now()

    db.commit()
    db.refresh(submission)
    return submission


@router.post("/{submission_id}/retry", response_model=SubmissionSchema)
async def retry_submission(
    submission_id: int,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    """Manually retry a failed submission owned by the authenticated user"""
    submission = (
        db.query(Submission)
        .filter(Submission.id == submission_id, Submission.user_id == current_user.id)
        .first()
    )
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")

    workflow = WorkflowManager(db)
    result = await workflow.submit_to_directory(
        saas_product_id=submission.saas_product_id,
        directory_id=submission.directory_id,
        user_id=current_user.id,
    )

    return result
