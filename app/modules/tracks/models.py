from datetime import datetime
from typing import TYPE_CHECKING, List, Optional
from sqlalchemy import Float, DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
import math

from app.db.database import Base

if TYPE_CHECKING:
    from app.modules.users.models import User


class Track(Base):
    __tablename__ = "tracks"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE")
    )
    name: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="tracks")
    track_points: Mapped[List["TrackPoint"]] = relationship(
        "TrackPoint", back_populates="track", cascade="all, delete-orphan"
    )

    @property
    def total_distance(self) -> float:
        """Общая длина трека в метрах."""
        if len(self.track_points) < 2:
            return 0.0

        total = 0.0
        for i in range(len(self.track_points) - 1):
            total += self.track_points[i].distance_to(self.track_points[i + 1])
        return total

    @property
    def duration(self) -> float:
        """Длительность трека в секундах."""
        if len(self.track_points) < 2:
            return 0.0

        start_time = self.track_points[0].timestamp
        end_time = self.track_points[-1].timestamp
        return (end_time - start_time).total_seconds()


class TrackPoint(Base):
    __tablename__ = "track_points"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    track_id: Mapped[int] = mapped_column(
        ForeignKey("tracks.id", ondelete="CASCADE")
    )
    latitude: Mapped[float] = mapped_column(Float, nullable=False)
    longitude: Mapped[float] = mapped_column(Float, nullable=False)
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now()
    )
    altitude: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    speed: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    # Relationships
    track: Mapped["Track"] = relationship(
        "Track",
        back_populates="track_points"
    )

    def distance_to(self, other: "TrackPoint") -> float:
        """Вычисляет расстояние до другой точки в метрах (haversine)."""
        R = 6371000  # Радиус Земли в метрах
        phi1 = math.radians(self.latitude)
        phi2 = math.radians(other.latitude)
        d_phi = math.radians(other.latitude - self.latitude)
        d_lambda = math.radians(other.longitude - self.longitude)
        a = (
            math.sin(d_phi / 2) ** 2
            + math.cos(phi1) * math.cos(phi2) * math.sin(d_lambda / 2) ** 2
        )
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        return R * c
