from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import HTMLResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.utils import maps
from app.modules.users.models import User
from app.modules.locations.service import LocationService
from app.modules.locations.repository import LocationRepository
from app.modules.tracks.service import TrackService
from app.modules.tracks.repository import TrackRepository
from app.modules.auth.users import get_current_user
from app.db.database import get_async_db

router = APIRouter()


def get_location_service(
        db: AsyncSession = Depends(get_async_db)
        ) -> LocationService:
    """Dependency для получения сервиса локаций"""
    repository = LocationRepository(db)
    return LocationService(repository)


def get_track_service(
        db: AsyncSession = Depends(get_async_db)
        ) -> TrackService:
    """Dependency для получения сервиса локаций"""
    repository = TrackRepository(db)
    return TrackService(repository)


@router.get("/current-location", response_class=HTMLResponse)
async def get_current_location_map(
    current_user: User = Depends(get_current_user),
    service: LocationService = Depends(get_location_service)
):
    """Получение карты с текущим местоположением"""
    location = await service.get_current_location(user_id=current_user.id)
    if not location:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No location data found"
        )

    map_html = maps.create_location_map(location)
    return HTMLResponse(content=map_html)


@router.get("/track/{track_id}", response_class=HTMLResponse)
async def get_track_map(
    track_id: int,
    current_user: User = Depends(get_current_user),
    track_service: TrackService = Depends(get_track_service)
):
    """Получение карты с треком"""
    track = await track_service.get_track(
        track_id=track_id,
        user_id=current_user.id
        )
    if not track:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Track not found"
        )

    track_points = await track_service.get_track_points(
        track_id=track_id,
        user_id=current_user.id
        )
    map_html = maps.create_track_map(track, track_points)
    return HTMLResponse(content=map_html)


@router.get("/tracks", response_class=HTMLResponse)
async def get_tracks_map(
    skip: int,
    limit: int,
    current_user: User = Depends(get_current_user),
    track_service: TrackService = Depends(get_track_service)
):
    """Получение карты со всеми треками пользователя"""
    tracks = await track_service.get_tracks(
        user_id=current_user.id,
        skip=skip,
        limit=limit
        )
    if not tracks:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No tracks found"
        )

    # Загружаем точки для каждого трека
    for track in tracks:
        track.track_points = await track_service.get_track_points(
            track_id=track.id,
            user_id=current_user.id
            )
    map_html = maps.create_multi_track_map(tracks)
    return HTMLResponse(content=map_html)


@router.get("/locations", response_class=HTMLResponse)
async def get_locations_map(
    skip: int,
    limit: int,
    current_user: User = Depends(get_current_user),
    service: LocationService = Depends(get_location_service)
):
    """Получение карты со всеми местоположениями пользователя"""
    locations = await service.get_locations(
        user_id=current_user.id,
        skip=skip,
        limit=limit
        )
    if not locations:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No locations found"
        )

    map_html = maps.create_stats_map(locations)
    return HTMLResponse(content=map_html)
