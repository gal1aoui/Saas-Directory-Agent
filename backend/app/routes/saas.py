from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models import SaasProduct
from app.schemas import SaasProductCreate, SaasProductUpdate, SaasProduct as SaasProductSchema

router = APIRouter()

@router.post("/", response_model=SaasProductSchema, status_code=status.HTTP_201_CREATED)
async def create_saas_product(
    saas: SaasProductCreate,
    db: Session = Depends(get_db)
):
    """Create a new SaaS product"""
    db_saas = SaasProduct(**saas.model_dump(mode="json"))
    db.add(db_saas)
    db.commit()
    db.refresh(db_saas)
    return db_saas

@router.get("/", response_model=List[SaasProductSchema])
async def list_saas_products(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """List all SaaS products"""
    products = db.query(SaasProduct).offset(skip).limit(limit).all()
    return products

@router.get("/{saas_id}", response_model=SaasProductSchema)
async def get_saas_product(
    saas_id: int,
    db: Session = Depends(get_db)
):
    """Get a specific SaaS product"""
    saas = db.query(SaasProduct).filter(SaasProduct.id == saas_id).first()
    if not saas:
        raise HTTPException(status_code=404, detail="SaaS product not found")
    return saas

@router.put("/{saas_id}", response_model=SaasProductSchema)
async def update_saas_product(
    saas_id: int,
    saas_update: SaasProductUpdate,
    db: Session = Depends(get_db)
):
    """Update a SaaS product"""
    saas = db.query(SaasProduct).filter(SaasProduct.id == saas_id).first()
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
    db: Session = Depends(get_db)
):
    """Delete a SaaS product"""
    saas = db.query(SaasProduct).filter(SaasProduct.id == saas_id).first()
    if not saas:
        raise HTTPException(status_code=404, detail="SaaS product not found")
    
    db.delete(saas)
    db.commit()
    return None