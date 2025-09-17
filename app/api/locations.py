from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app import crud, schemas, models
from app.auth import get_current_active_user
from app.database import get_db

router = APIRouter()


@router.get("/", response_model=List[schemas.Location])
def get_locations(
    skip: int = 0,
    limit: int = 100,
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Получение списка местоположений пользователя"""
    locations = crud.get_locations(db, user_id=current_user.id, skip=skip, limit=limit)
    return locations


@router.get("/current", response_model=schemas.Location)
def get_current_location(
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Получение текущего местоположения пользователя"""
    location = crud.get_current_location(db, user_id=current_user.id)
    if not location:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No location data found"
        )
    return location


@router.post("/", response_model=schemas.Location)
def create_location(
    location: schemas.LocationCreate,
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Создание нового местоположения"""
    return crud.create_location(db=db, location=location, user_id=current_user.id)


@router.put("/current", response_model=schemas.Location)
def update_current_location(
    location: schemas.LocationCreate,
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Обновление текущего местоположения"""
    return crud.update_location(db=db, user_id=current_user.id, location=location)


@router.get("/{location_id}", response_model=schemas.Location)
def get_location(
    location_id: int,
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Получение конкретного местоположения"""
    # Здесь можно добавить проверку, что местоположение принадлежит пользователю
    location = crud.get_locations(db, user_id=current_user.id)
    location = next((loc for loc in location if loc.id == location_id), None)
    if not location:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Location not found"
        )
    return location

@router.delete("/{location_id}", status_code=204)
def delete_current_location(
    location_id: int,
    user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Удаление местоположения"""
    location = db.query(models.Location).filter(models.Location.id == location_id, models.Location.user_id == user.id).first()
    if not location:
        raise HTTPException(status_code=404, detail="Location not found")
    db.delete(location)
    db.commit()
    return