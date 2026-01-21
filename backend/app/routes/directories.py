from typing import Annotated, List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_active_user
from app.models import Directory, DirectoryStatus, User
from app.schemas import Directory as DirectorySchema
from app.schemas import DirectoryCreate, DirectoryUpdate

router = APIRouter()


@router.post("/", response_model=DirectorySchema, status_code=status.HTTP_201_CREATED)
async def create_directory(
    directory: DirectoryCreate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    """Add a new directory for the authenticated user"""
    db_directory = Directory(**directory.model_dump(mode="json"), user_id=current_user.id)
    db.add(db_directory)
    db.commit()
    db.refresh(db_directory)
    return db_directory


@router.get("/", response_model=List[DirectorySchema])
async def list_directories(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_active_user)],
    status: DirectoryStatus = None,
    skip: int = 0,
    limit: int = 100,
):
    """List all directories owned by the authenticated user"""
    query = db.query(Directory).filter(Directory.user_id == current_user.id)
    if status:
        query = query.filter(Directory.status == status)

    directories = query.offset(skip).limit(limit).all()
    return directories


@router.get("/{directory_id}", response_model=DirectorySchema)
async def get_directory(
    directory_id: int,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    """Get a specific directory owned by the authenticated user"""
    directory = (
        db.query(Directory)
        .filter(Directory.id == directory_id, Directory.user_id == current_user.id)
        .first()
    )
    if not directory:
        raise HTTPException(status_code=404, detail="Directory not found")
    return directory


@router.put("/{directory_id}", response_model=DirectorySchema)
async def update_directory(
    directory_id: int,
    directory_update: DirectoryUpdate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    """Update a directory owned by the authenticated user"""
    directory = (
        db.query(Directory)
        .filter(Directory.id == directory_id, Directory.user_id == current_user.id)
        .first()
    )
    if not directory:
        raise HTTPException(status_code=404, detail="Directory not found")

    update_data = directory_update.model_dump(mode="json", exclude_unset=True)
    for field, value in update_data.items():
        setattr(directory, field, value)

    db.commit()
    db.refresh(directory)
    return directory


@router.delete("/{directory_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_directory(
    directory_id: int,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    """Delete a directory owned by the authenticated user"""
    directory = (
        db.query(Directory)
        .filter(Directory.id == directory_id, Directory.user_id == current_user.id)
        .first()
    )
    if not directory:
        raise HTTPException(status_code=404, detail="Directory not found")

    db.delete(directory)
    db.commit()
    return None
