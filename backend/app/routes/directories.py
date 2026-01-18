from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Directory, DirectoryStatus
from app.schemas import Directory as DirectorySchema
from app.schemas import DirectoryCreate, DirectoryUpdate

router = APIRouter()


@router.post("/", response_model=DirectorySchema, status_code=status.HTTP_201_CREATED)
async def create_directory(directory: DirectoryCreate, db: Session = Depends(get_db)):
    """Add a new directory"""
    db_directory = Directory(**directory.model_dump(mode="json"))
    db.add(db_directory)
    db.commit()
    db.refresh(db_directory)
    return db_directory


@router.get("/", response_model=List[DirectorySchema])
async def list_directories(
    status: DirectoryStatus = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    """List all directories"""
    query = db.query(Directory)
    if status:
        query = query.filter(Directory.status == status)

    directories = query.offset(skip).limit(limit).all()
    return directories


@router.get("/{directory_id}", response_model=DirectorySchema)
async def get_directory(directory_id: int, db: Session = Depends(get_db)):
    """Get a specific directory"""
    directory = db.query(Directory).filter(Directory.id == directory_id).first()
    if not directory:
        raise HTTPException(status_code=404, detail="Directory not found")
    return directory


@router.put("/{directory_id}", response_model=DirectorySchema)
async def update_directory(
    directory_id: int, directory_update: DirectoryUpdate, db: Session = Depends(get_db)
):
    """Update a directory"""
    directory = db.query(Directory).filter(Directory.id == directory_id).first()
    if not directory:
        raise HTTPException(status_code=404, detail="Directory not found")

    update_data = directory_update.model_dump(mode="json", exclude_unset=True)
    for field, value in update_data.items():
        setattr(directory, field, value)

    db.commit()
    db.refresh(directory)
    return directory


@router.delete("/{directory_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_directory(directory_id: int, db: Session = Depends(get_db)):
    """Delete a directory"""
    directory = db.query(Directory).filter(Directory.id == directory_id).first()
    if not directory:
        raise HTTPException(status_code=404, detail="Directory not found")

    db.delete(directory)
    db.commit()
    return None
