from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete, desc
from sqlalchemy.orm import selectinload
from typing import List, Optional, Sequence

from app.modules.tracks.models import Track, TrackPoint


class TrackRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    # Track CRUD operations
    async def get_tracks(
        self,
        user_id: int,
        skip: int = 0,
        limit: int = 100
    ) -> Sequence[Track]:
        """Получение треков пользователя"""
        result = await self.db.execute(
            select(Track)
            .where(Track.user_id == user_id)
            .order_by(desc(Track.created_at))
            .offset(skip)
            .limit(limit)
        )
        return result.scalars().all()

    async def get_track(
        self,
        track_id: int,
        user_id: int
    ) -> Optional[Track]:
        """Получение конкретного трека"""
        result = await self.db.execute(
            select(Track)
            .where(Track.id == track_id, Track.user_id == user_id)
        )
        return result.scalar_one_or_none()

    async def get_track_with_points(
        self,
        track_id: int,
        user_id: int
    ) -> Optional[Track]:
        """Получение трека с точками"""
        result = await self.db.execute(
            select(Track)
            .where(Track.id == track_id, Track.user_id == user_id)
            .options(selectinload(Track.track_points))
        )
        return result.scalar_one_or_none()

    async def create_track(
        self,
        track: Track
    ) -> Track:
        """Создание трека"""
        self.db.add(track)
        await self.db.commit()
        await self.db.refresh(track)
        return track

    async def delete_track(
        self,
        track_id: int,
        user_id: int
    ) -> bool:
        """Удаление трека"""
        result = await self.db.execute(
            delete(Track)
            .where(Track.id == track_id, Track.user_id == user_id)
        )
        await self.db.commit()
        return result.rowcount > 0

    # TrackPoint CRUD operations
    async def get_track_points(
        self,
        track_id: int
    ) -> Sequence[TrackPoint]:
        """Получение всех точек трека"""
        result = await self.db.execute(
            select(TrackPoint)
            .where(TrackPoint.track_id == track_id)
            .order_by(TrackPoint.timestamp)
        )
        return result.scalars().all()

    async def create_track_point(
        self,
        track_point: TrackPoint
    ) -> TrackPoint:
        """Создание точки трека"""
        self.db.add(track_point)
        await self.db.commit()
        await self.db.refresh(track_point)
        return track_point

    async def create_track_points_bulk(
        self,
        track_points: List[TrackPoint]
    ) -> List[TrackPoint]:
        """Массовое создание точек трека"""
        self.db.add_all(track_points)
        await self.db.commit()
        for point in track_points:
            await self.db.refresh(point)
        return track_points

    async def delete_track_points(
        self,
        track_id: int
    ) -> int:
        """Удаление всех точек трека"""
        result = await self.db.execute(
            delete(TrackPoint)
            .where(TrackPoint.track_id == track_id)
        )
        await self.db.commit()
        return result.rowcount
