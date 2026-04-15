from datetime import datetime
from pydantic import BaseModel, Field
from typing import Optional


# Location schemas
class LocationBase(BaseModel):
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    name: Optional[str] = None


class LocationSchema(LocationBase):
    id: int
    user_id: int
    timestamp: datetime

    class Config:
        from_attributes = True


class LocationCreate(BaseModel):
    latitude: float
    longitude: float
    name: str | None = None


class LocationUpdate(BaseModel):
    latitude: float | None = None
    longitude: float | None = None
    name: str | None = None
