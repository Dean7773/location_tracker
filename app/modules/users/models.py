from sqlalchemy import Integer, String, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from typing import TYPE_CHECKING, List

from app.db.database import Base

if TYPE_CHECKING:
    from app.modules.locations.models import Location
    from app.modules.tracks.models import Track


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    username: Mapped[str] = mapped_column(String, unique=True, index=True)
    email: Mapped[str] = mapped_column(String, unique=True, index=True)
    hashed_password: Mapped[str] = mapped_column(String)
    created_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    # Relationships
    locations: Mapped[List["Location"]] = relationship(
        "Location",
        back_populates="user"
    )
    tracks: Mapped[List["Track"]] = relationship(
        "Track",
        back_populates="user"
    )
