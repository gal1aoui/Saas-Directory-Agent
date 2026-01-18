from datetime import datetime
from typing import Annotated, List

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Submission, SubmissionStatus
from app.schemas import (
    BulkSubmissionRequest,
    DashboardStats,
    SubmissionCreate,
    SubmissionUpdate,
    SubmissionWithDetails,
)
from app.schemas import (
    Submission as SubmissionSchema,
)
from app.services.workflow_manager import WorkflowManager

router = APIRouter()


@router.post("/", response_model=SubmissionSchema, status_code=status.HTTP_201_CREATED)
async def create_submission(
    submission: SubmissionCreate,
    background_tasks: BackgroundTasks,
    db: Annotated[Session, Depends(get_db)],
):
    """Create and execute a new submission"""
    workflow = WorkflowManager(db)

    # Execute submission in background
    result = await workflow.submit_to_directory(
        saas_product_id=submission.saas_product_id, directory_id=submission.directory_id
    )

    return result


@router.post("/bulk", response_model=List[SubmissionSchema])
async def bulk_submit(request: BulkSubmissionRequest, db: Annotated[Session, Depends(get_db)]):
    """Submit to multiple directories at once"""
    workflow = WorkflowManager(db)

    submissions = await workflow.bulk_submit(
        saas_product_id=request.saas_product_id, directory_ids=request.directory_ids
    )

    return submissions


@router.get("/", response_model=List[SubmissionWithDetails])
async def list_submissions(
    db: Annotated[Session, Depends(get_db)],
    status: SubmissionStatus = None,
    saas_product_id: int = None,
    directory_id: int = None,
    skip: int = 0,
    limit: int = 100,
):
    """List submissions with filters"""
    query = db.query(Submission)

    if status:
        query = query.filter(Submission.status == status)
    if saas_product_id:
        query = query.filter(Submission.saas_product_id == saas_product_id)
    if directory_id:
        query = query.filter(Submission.directory_id == directory_id)

    submissions = query.order_by(Submission.created_at.desc()).offset(skip).limit(limit).all()
    return submissions


@router.get("/stats", response_model=DashboardStats)
async def get_dashboard_stats(db: Annotated[Session, Depends(get_db)]):
    """Get dashboard statistics"""
    from sqlalchemy import func

    from app.models import Directory

    total_submissions = db.query(func.count(Submission.id)).scalar()
    pending = (
        db.query(func.count(Submission.id))
        .filter(Submission.status == SubmissionStatus.PENDING)
        .scalar()
    )
    submitted = (
        db.query(func.count(Submission.id))
        .filter(Submission.status == SubmissionStatus.SUBMITTED)
        .scalar()
    )
    approved = (
        db.query(func.count(Submission.id))
        .filter(Submission.status == SubmissionStatus.APPROVED)
        .scalar()
    )
    failed = (
        db.query(func.count(Submission.id))
        .filter(Submission.status == SubmissionStatus.FAILED)
        .scalar()
    )

    success_rate = (approved / total_submissions * 100) if total_submissions > 0 else 0

    total_directories = db.query(func.count(Directory.id)).scalar()
    active_directories = (
        db.query(func.count(Directory.id)).filter(Directory.status == "active").scalar()
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
async def get_submission(submission_id: int, db: Annotated[Session, Depends(get_db)]):
    """Get a specific submission with details"""
    submission = db.query(Submission).filter(Submission.id == submission_id).first()
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    return submission


@router.put("/{submission_id}", response_model=SubmissionSchema)
async def update_submission(
    submission_id: int,
    submission_update: SubmissionUpdate,
    db: Annotated[Session, Depends(get_db)],
):
    """Update a submission (e.g., mark as approved)"""
    submission = db.query(Submission).filter(Submission.id == submission_id).first()
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")

    update_data = submission_update.model_dump(mode="json", exclude_unset=True)
    for field, value in update_data.items():
        setattr(submission, field, value)

    if submission_update.status == SubmissionStatus.APPROVED:
        submission.approved_at = datetime.utcnow()

    db.commit()
    db.refresh(submission)
    return submission


@router.post("/{submission_id}/retry", response_model=SubmissionSchema)
async def retry_submission(submission_id: int, db: Annotated[Session, Depends(get_db)]):
    """Manually retry a failed submission"""
    submission = db.query(Submission).filter(Submission.id == submission_id).first()
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")

    workflow = WorkflowManager(db)
    result = await workflow.submit_to_directory(
        saas_product_id=submission.saas_product_id, directory_id=submission.directory_id
    )

    return result
