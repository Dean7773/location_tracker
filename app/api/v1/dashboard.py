from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.db.database import get_async_db
from app.modules.auth.users import get_current_user
from app.modules.users.models import User
from app.modules.locations.models import Location
from app.modules.tracks.models import Track, TrackPoint

router = APIRouter()


@router.get("/stats")
async def get_dashboard_stats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db),
):
    """Получение статистики для дашборда."""
    
    # Общее количество локаций
    locations_count_result = await db.execute(
        select(func.count()).select_from(Location)
        .where(Location.user_id == current_user.id)
    )
    locations_count = locations_count_result.scalar() or 0
    
    # Общее количество треков
    tracks_count_result = await db.execute(
        select(func.count()).select_from(Track)
        .where(Track.user_id == current_user.id)
    )
    tracks_count = tracks_count_result.scalar() or 0
    
    # Общее количество точек треков
    points_count_result = await db.execute(
        select(func.count()).select_from(TrackPoint)
        .join(Track, TrackPoint.track_id == Track.id)
        .where(Track.user_id == current_user.id)
    )
    points_count = points_count_result.scalar() or 0
    
    # Текущая локация (последняя)
    current_location_result = await db.execute(
        select(Location)
        .where(Location.user_id == current_user.id)
        .order_by(Location.timestamp.desc())
        .limit(1)
    )
    current_location = current_location_result.scalar_one_or_none()
    
    # Последний трек
    last_track_result = await db.execute(
        select(Track)
        .where(Track.user_id == current_user.id)
        .order_by(Track.created_at.desc())
        .limit(1)
    )
    last_track = last_track_result.scalar_one_or_none()
    
    return {
        "locations_count": locations_count,
        "total_tracks": tracks_count,
        "points_count": points_count,
        "current_location": {
            "latitude": current_location.latitude if current_location else None,
            "longitude": current_location.longitude if current_location else None,
            "timestamp": current_location.timestamp.isoformat() if current_location else None,
            "name": current_location.name if current_location else None
        } if current_location else None,
        "last_track": {
            "id": last_track.id if last_track else None,
            "name": last_track.name if last_track else None,
            "created_at": last_track.created_at.isoformat() if last_track else None
        } if last_track else None
    }