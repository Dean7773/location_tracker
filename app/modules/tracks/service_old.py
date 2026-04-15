from datetime import datetime
from typing import List, Optional

from app.modules.tracks.models import Track, TrackPoint
from app.modules.tracks.repository import TrackRepository
from app.modules.tracks.schemas import TrackCreate, TrackPointCreate, TrackUpload


class TrackService:
    def __init__(self, repository: TrackRepository):
        self.repository = repository

    async def get_tracks(
        self,
        user_id: int,
        skip: int = 0,
        limit: int = 100
    ) -> List[Track]:
        """Получение треков пользователя с количеством точек"""
        tracks = await self.repository.get_tracks(user_id, skip, limit)
        return tracks

    async def get_track(
        self,
        track_id: int,
        user_id: int
    ) -> Optional[Track]:
        """Получение конкретного трека"""
        return await self.repository.get_track(track_id, user_id)

    async def create_track(
        self,
        track_data: TrackCreate,
        user_id: int
    ) -> Track:
        """Создание нового трека"""
        track = Track(**track_data.model_dump(), user_id=user_id)
        return await self.repository.create_track(track)

    async def delete_track(
        self,
        track_id: int,
        user_id: int
    ) -> bool:
        """Удаление трека"""
        return await self.repository.delete_track(track_id, user_id)

    async def get_track_points(
        self,
        track_id: int,
        user_id: int
    ) -> List[TrackPoint]:
        """Получение точек трека с проверкой прав"""
        # Проверяем принадлежность трека пользователю
        track = await self.repository.get_track(track_id, user_id)
        if not track:
            return []

        points = await self.repository.get_track_points(track_id)
        return list(points)

    async def get_distance(
        self,
        track_id: int,
        user_id: int
    ) -> float:
        """Расчет общей длины трека в метрах"""
        track_points = await self.get_track_points(track_id, user_id)
        if len(track_points) < 2:
            return 0.0

        distance = 0.0
        for i in range(len(track_points) - 1):
            distance += track_points[i].distance_to(track_points[i + 1])

        return distance

    async def get_duration(
        self,
        track_id: int,
        user_id: int
    ) -> float:
        """Расчет длительности трека в секундах"""
        track_points = await self.get_track_points(track_id, user_id)
        if len(track_points) < 2:
            return 0.0

        duration = track_points[-1].timestamp - track_points[0].timestamp
        return duration.total_seconds()

    async def create_track_point(
        self,
        point_data: TrackPointCreate,
        track_id: int,
        user_id: int
    ) -> Optional[TrackPoint]:
        """Создание точки трека с проверкой прав"""
        # Проверяем принадлежность трека пользователю
        track = await self.repository.get_track(track_id, user_id)
        if not track:
            return None

        track_point = TrackPoint(
            **point_data.model_dump(),
            track_id=track_id,
            timestamp=point_data.timestamp or datetime.utcnow()
        )
        return await self.repository.create_track_point(track_point)

    async def create_track_with_points(
        self,
        track_upload: TrackUpload,
        user_id: int
    ) -> Track:
        """Создание трека с точками в одной транзакции"""
        try:
            # Создаем трек
            track_data = TrackCreate(
                name=track_upload.name,
                description=track_upload.description
            )
            track = await self.create_track(track_data, user_id)

            # Создаем точки трека
            track_points = []
            for point_data in track_upload.points:
                track_point = TrackPoint(
                    latitude=point_data.latitude,
                    longitude=point_data.longitude,
                    altitude=point_data.altitude,
                    speed=point_data.speed,
                    track_id=track.id,
                    timestamp=point_data.timestamp or datetime.utcnow()
                )
                track_points.append(track_point)

            # Массовое создание точек
            if track_points:
                await self.repository.create_track_points_bulk(track_points)

            # Обновляем трек с точками
            track = await self.repository.get_track_with_points(track.id, user_id)
            return track

        except Exception as e:
            # Ошибка будет обработана на уровне репозитория
            raise e

    async def get_track_summary(
        self,
        track_id: int,
        user_id: int
    ) -> dict:
        """Получение сводной информации по треку"""
        track = await self.get_track(track_id, user_id)
        if not track:
            return {}

        distance = await self.get_distance(track_id, user_id)
        duration = await self.get_duration(track_id, user_id)
        points_count = len(await self.get_track_points(track_id, user_id))

        return {
            'id': track.id,
            'name': track.name,
            'description': track.description,
            'created_at': track.created_at,
            'distance_meters': distance,
            'distance_km': distance / 1000,
            'duration_seconds': duration,
            'duration_minutes': duration / 60,
            'points_count': points_count,
            'average_speed': (distance / 1000) / (duration / 3600) if duration > 0 else 0
        }
