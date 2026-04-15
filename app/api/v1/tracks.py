from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.auth.users import get_current_user
from app.db.database import get_async_db
from app.modules.tracks.service import TrackService
from app.modules.tracks.repository import TrackRepository
from app.modules.tracks.schemas import (
    Track, TrackCreate, TrackWithPoints, TrackRecent,
    TrackPoint, TrackPointCreate, TrackUpload, TrackChunkUpload
)
from app.modules.users.models import User

router = APIRouter()


async def get_track_service(
        db: AsyncSession = Depends(get_async_db)
        ) -> TrackService:
    repository = TrackRepository(db)
    return TrackService(repository)


@router.get("/", response_model=List[Track])
async def get_tracks(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    service: TrackService = Depends(get_track_service)
):
    """Получение списка треков пользователя"""
    tracks = await service.get_tracks(current_user.id, skip, limit)
    return tracks


@router.get("/recent", response_model=List[TrackRecent])
async def get_recent_tracks(
    current_user: User = Depends(get_current_user),
    service: TrackService = Depends(get_track_service)
):
    """Получение списка последних треков пользователя"""
    recent_tracks = await service.get_recent_tracks(current_user.id)
    return [TrackRecent(**track) for track in recent_tracks]


@router.post("/", response_model=Track, status_code=status.HTTP_201_CREATED)
async def create_track(
    track_data: TrackCreate,
    current_user: User = Depends(get_current_user),
    service: TrackService = Depends(get_track_service)
):
    """Создание нового трека"""
    track = await service.create_track(track_data, current_user.id)
    return track


@router.get("/{track_id}", response_model=TrackWithPoints)
async def get_track(
    track_id: int,
    current_user: User = Depends(get_current_user),
    service: TrackService = Depends(get_track_service)
):
    """Получение трека с точками"""
    track = await service.get_track_with_points(track_id, current_user.id)
    if not track:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Track not found"
        )
    return track


@router.delete("/{track_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_track(
    track_id: int,
    current_user: User = Depends(get_current_user),
    service: TrackService = Depends(get_track_service)
):
    """Удаление трека"""
    success = await service.delete_track(track_id, current_user.id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Track not found"
        )


@router.post("/upload", response_model=Track, status_code=status.HTTP_201_CREATED)
async def upload_track(
    track_upload: TrackUpload,
    current_user: User = Depends(get_current_user),
    service: TrackService = Depends(get_track_service)
):
    """Загрузка трека с точками"""
    # Валидация входных данных
    if not track_upload.points:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Track must contain at least one point"
        )
    
    if len(track_upload.points) > 10000:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Track cannot contain more than 10,000 points"
        )
    
    # Валидация координат
    for i, point in enumerate(track_upload.points):
        if not (-90 <= point.latitude <= 90):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid latitude at point {i}: {point.latitude}"
            )
        if not (-180 <= point.longitude <= 180):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid longitude at point {i}: {point.longitude}"
            )
    
    try:
        track = await service.create_track_with_points(track_upload, current_user.id)
        return track
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create track with points: {str(e)}"
        )


@router.post("/{track_id}/points", response_model=TrackPoint, status_code=status.HTTP_201_CREATED)
async def add_track_point(
    track_id: int,
    point_data: TrackPointCreate,
    current_user: User = Depends(get_current_user),
    service: TrackService = Depends(get_track_service)
):
    """Добавление точки к треку"""
    point = await service.add_track_point(track_id, point_data, current_user.id)
    if not point:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Track not found"
        )
    return point


@router.post("/{track_id}/points/bulk", status_code=status.HTTP_201_CREATED)
async def add_track_points_bulk(
    track_id: int,
    points_data: List[TrackPointCreate],
    current_user: User = Depends(get_current_user),
    service: TrackService = Depends(get_track_service)
):
    """Массовое добавление точек к треку"""
    if not points_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No points provided"
        )
    
    if len(points_data) > 1000:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot add more than 1000 points at once"
        )
    
    points_added = await service.add_track_points_bulk(track_id, points_data, current_user.id)
    if points_added == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Track not found"
        )
    
    return {
        "message": f"Successfully added {points_added} points to track {track_id}",
        "track_id": track_id,
        "points_added": points_added
    }


@router.get("/{track_id}/points", response_model=List[TrackPoint])
async def get_track_points(
    track_id: int,
    current_user: User = Depends(get_current_user),
    service: TrackService = Depends(get_track_service)
):
    """Получение точек трека"""
    points = await service.get_track_points(track_id, current_user.id)
    if not points and not await service.get_track(track_id, current_user.id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Track not found"
        )
    return points


@router.post("/load_from_tracker")
async def load_from_tracker(
    chunk: TrackChunkUpload,
    current_user: User = Depends(get_current_user),
    service: TrackService = Depends(get_track_service)
):
    """Загрузка трека чанками с устройства (ESP/трекер)"""
    try:
        result = await service.load_from_tracker(chunk, current_user.id)
        return result
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to load track from tracker: {str(e)}"
        )