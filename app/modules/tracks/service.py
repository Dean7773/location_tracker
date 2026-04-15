from datetime import datetime
from typing import List, Optional

from app.modules.tracks.models import Track, TrackPoint
from app.modules.tracks.repository import TrackRepository
from app.modules.tracks.schemas import (
    TrackCreate, TrackPointCreate, TrackUpload, TrackChunkUpload
)


class TrackService:
    def __init__(self, repository: TrackRepository):
        self.repository = repository

    async def get_tracks(
        self,
        user_id: int,
        skip: int = 0,
        limit: int = 100
    ) -> List[Track]:
        """Получение треков пользователя"""
        tracks = await self.repository.get_tracks(user_id, skip, limit)
        return list(tracks)

    async def get_recent_tracks(
        self,
        user_id: int,
        limit: int = 3
    ) -> List[dict]:
        """Получение последних треков с расстоянием и длительностью"""
        tracks = await self.repository.get_tracks(user_id, skip=0, limit=limit)

        result = []
        for track in tracks:
            points = await self.repository.get_track_points(track.id)
            distance = self._calculate_distance(points)
            duration = self._calculate_duration(points)

            result.append({
                "id": track.id,
                "name": track.name,
                "description": track.description,
                "created_at": track.created_at,
                "distance": distance,
                "duration": duration
            })
        return result

    async def get_track(
        self, 
        track_id: int, 
        user_id: int
    ) -> Optional[Track]:
        """Получение конкретного трека"""
        return await self.repository.get_track(track_id, user_id)

    async def get_track_with_points(
        self, 
        track_id: int, 
        user_id: int
    ) -> Optional[Track]:
        """Получение трека с точками"""
        return await self.repository.get_track_with_points(track_id, user_id)

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

    async def create_track_with_points(
        self, 
        track_upload: TrackUpload, 
        user_id: int
    ) -> Track:
        """Создание трека с точками в одной транзакции"""
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
        
        return track

    async def add_track_point(
        self, 
        track_id: int,
        point_data: TrackPointCreate,
        user_id: int
    ) -> Optional[TrackPoint]:
        """Добавление точки к треку"""
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

    async def add_track_points_bulk(
        self, 
        track_id: int,
        points_data: List[TrackPointCreate],
        user_id: int
    ) -> int:
        """Массовое добавление точек к треку"""
        # Проверяем принадлежность трека пользователю
        track = await self.repository.get_track(track_id, user_id)
        if not track:
            return 0
        
        track_points = []
        for point_data in points_data:
            track_point = TrackPoint(
                **point_data.model_dump(),
                track_id=track_id,
                timestamp=point_data.timestamp or datetime.utcnow()
            )
            track_points.append(track_point)
        
        if track_points:
            await self.repository.create_track_points_bulk(track_points)
        
        return len(track_points)

    async def get_track_points(
        self, 
        track_id: int, 
        user_id: int
    ) -> List[TrackPoint]:
        """Получение точек трека"""
        # Проверяем принадлежность трека пользователю
        track = await self.repository.get_track(track_id, user_id)
        if not track:
            return []
        
        points = await self.repository.get_track_points(track_id)
        return list(points)

    async def load_from_tracker(
        self,
        chunk: TrackChunkUpload,
        user_id: int
    ) -> dict:
        """Загрузка трека чанками с устройства"""
        track_id = chunk.track_id
        
        if chunk.is_first_chunk:
            # Создаем трек
            if not chunk.name or not chunk.points:
                raise ValueError("Name and points required for first chunk")
            
            track_data = TrackCreate(
                name=chunk.name,
                description=chunk.description
            )
            track = await self.create_track(track_data, user_id)
            track_id = track.id
        else:
            # Проверяем существование трека
            if not chunk.track_id:
                raise ValueError("track_id required for non-first chunk")
            
            track = await self.repository.get_track(chunk.track_id, user_id)
            if not track:
                raise ValueError("Track not found")
        
        # Добавляем точки
        points_added = 0
        if chunk.points:
            track_points = []
            for point in chunk.points:
                track_point = TrackPoint(
                    track_id=track_id,
                    latitude=point.latitude,
                    longitude=point.longitude,
                    timestamp=point.timestamp or datetime.utcnow(),
                    altitude=point.altitude,
                    speed=point.speed
                )
                track_points.append(track_point)
            
            if track_points:
                await self.repository.create_track_points_bulk(track_points)
                points_added = len(track_points)
        
        return {
            "track_id": track_id,
            "status": "ok",
            "is_last_chunk": chunk.is_last_chunk,
            "points_added": points_added
        }

    # Вспомогательные методы
    def _calculate_distance(self, points: List[TrackPoint]) -> float:
        """Расчет расстояния между точками"""
        if len(points) < 2:
            return 0.0

        distance = 0.0
        for i in range(len(points) - 1):
            distance += points[i].distance_to(points[i + 1])
        return distance

    def _calculate_duration(self, points: List[TrackPoint]) -> float:
        """Расчет длительности трека"""
        if len(points) < 2:
            return 0.0

        duration = points[-1].timestamp - points[0].timestamp
        return duration.total_seconds()
