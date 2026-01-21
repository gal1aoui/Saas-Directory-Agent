from typing import Annotated, List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_active_user
from app.models import SaasProduct, User
from app.schemas import SaasProduct as SaasProductSchema
from app.schemas import SaasProductCreate, SaasProductUpdate

router = APIRouter()


@router.post("/", response_model=SaasProductSchema, status_code=status.HTTP_201_CREATED)
async def create_saas_product(
    saas: SaasProductCreate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    """Create a new SaaS product for the authenticated user"""
    db_saas = SaasProduct(**saas.model_dump(mode="json"), user_id=current_user.id)
    db.add(db_saas)
    db.commit()
    db.refresh(db_saas)
    return db_saas


@router.get("/", response_model=List[SaasProductSchema])
async def list_saas_products(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_active_user)],
    skip: int = 0,
    limit: int = 100,
):
    """List all SaaS products owned by the authenticated user"""
    products = (
        db.query(SaasProduct)
        .filter(SaasProduct.user_id == current_user.id)
        .offset(skip)
        .limit(limit)
        .all()
    )
    return products


@router.get("/{saas_id}", response_model=SaasProductSchema)
async def get_saas_product(
    saas_id: int,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    """Get a specific SaaS product owned by the authenticated user"""
    saas = (
        db.query(SaasProduct)
        .filter(SaasProduct.id == saas_id, SaasProduct.user_id == current_user.id)
        .first()
    )
    if not saas:
        raise HTTPException(status_code=404, detail="SaaS product not found")
    return saas


@router.put("/{saas_id}", response_model=SaasProductSchema)
async def update_saas_product(
    saas_id: int,
    saas_update: SaasProductUpdate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    """Update a SaaS product owned by the authenticated user"""
    saas = (
        db.query(SaasProduct)
        .filter(SaasProduct.id == saas_id, SaasProduct.user_id == current_user.id)
        .first()
    )
    if not saas:
        raise HTTPException(status_code=404, detail="SaaS product not found")

    update_data = saas_update.model_dump(mode="json", exclude_unset=True)
    for field, value in update_data.items():
        setattr(saas, field, value)

    db.commit()
    db.refresh(saas)
    return saas


@router.delete("/{saas_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_saas_product(
    saas_id: int,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    """Delete a SaaS product owned by the authenticated user"""
    saas = (
        db.query(SaasProduct)
        .filter(SaasProduct.id == saas_id, SaasProduct.user_id == current_user.id)
        .first()
    )
    if not saas:
        raise HTTPException(status_code=404, detail="SaaS product not found")

    db.delete(saas)
    db.commit()
    return None
