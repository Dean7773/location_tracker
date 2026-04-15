from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.locations.repository import LocationRepository
from app.modules.locations.schemas import (LocationSchema, LocationCreate,
                                           LocationUpdate)
from app.modules.locations.service import LocationService
from app.modules.users.models import User
from app.modules.auth.users import get_current_user
from app.db.database import get_async_db

router = APIRouter()


def get_location_service(
        db: AsyncSession = Depends(get_async_db)
        ) -> LocationService:
    """Dependency для получения сервиса локаций"""
    repository = LocationRepository(db)
    return LocationService(repository)


@router.get("/", response_model=List[LocationSchema])
async def get_locations(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    service: LocationService = Depends(get_location_service)
):
    """Получение списка местоположений пользователя"""
    locations = await service.get_locations(
        user_id=current_user.id,
        skip=skip,
        limit=limit
    )
    return locations


@router.get("/current", response_model=LocationSchema)
async def get_current_location(
    current_user: User = Depends(get_current_user),
    service: LocationService = Depends(get_location_service)
):
    """Получение текущего местоположения пользователя"""
    location = await service.get_current_location(user_id=current_user.id)
    if not location:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No location data found"
        )
    return location


@router.post("/", response_model=LocationSchema)
async def create_location(
    location: LocationCreate,
    current_user: User = Depends(get_current_user),
    service: LocationService = Depends(get_location_service)
):
    """Создание нового местоположения"""
    new_location = await service.create_location(
        location_data=location,
        user_id=current_user.id
    )
    return new_location


@router.put("/current", response_model=LocationSchema)
async def update_current_location(
    location: LocationUpdate,
    current_user: User = Depends(get_current_user),
    service: LocationService = Depends(get_location_service)
):
    """Обновление текущего местоположения"""
    updated_location = await service.update_location(
        user_id=current_user.id,
        location_data=location
    )
    return updated_location


@router.delete("/{location_id}", status_code=204)
async def delete_current_location(
    location_id: int,
    user: User = Depends(get_current_user),
    service: LocationService = Depends(get_location_service)
):
    """Удаление местоположения"""
    deleted = await service.delete_location(
        location_id=location_id,
        user_id=user.id
    )
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Location not found"
        )
    return None
