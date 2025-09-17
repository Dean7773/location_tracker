from datetime import datetime
from pydantic import BaseModel, Field
from typing import Optional, List


# User schemas
class UserBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: str = Field(..., pattern=r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$")


class UserCreate(UserBase):
    password: str = Field(..., min_length=6)


class User(UserBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True


# Location schemas
class LocationBase(BaseModel):
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    name: Optional[str] = None


class LocationCreate(LocationBase):
    pass


class Location(LocationBase):
    id: int
    user_id: int
    timestamp: datetime
    
    class Config:
        from_attributes = True


# Track schemas
class TrackBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None


class TrackCreate(TrackBase):
    pass


class Track(TrackBase):
    id: int
    user_id: int
    created_at: datetime
    points_count: Optional[int] = None
    
    class Config:
        from_attributes = True


#Track schemas for recent tracks
class TrackRecent(TrackBase):
    id: int
    name: str
    description: Optional[str] = None
    created_at: datetime
    distance: Optional[float] = None
    duration: Optional[float] = None
    
    class Config:
        from_attributes = True


# TrackPoint schemas
class TrackPointBase(BaseModel):
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    altitude: Optional[float] = None
    speed: Optional[float] = None


class TrackPointCreate(TrackPointBase):
    pass


class TrackPoint(TrackPointBase):
    id: int
    track_id: int
    timestamp: datetime
    
    class Config:
        from_attributes = True


# Track with points
class TrackWithPoints(Track):
    track_points: List[TrackPoint] = []
    
    class Config:
        from_attributes = True


# GPS Data for bulk upload
class GPSData(BaseModel):
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    timestamp: Optional[datetime] = None
    altitude: Optional[float] = None
    speed: Optional[float] = None


class TrackUpload(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None
    points: List[GPSData]


class TrackChunkUpload(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)  # только для первого чанка
    description: Optional[str] = None  # только для первого чанка
    track_id: Optional[int] = None  # для последующих чанков
    points: List[GPSData]
    is_first_chunk: bool = False
    is_last_chunk: bool = False 