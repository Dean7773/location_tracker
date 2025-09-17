from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from passlib.context import CryptContext
from typing import List, Optional

from app import models, schemas

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# User CRUD operations
def get_user(db: Session, user_id: int) -> Optional[models.User]:
    return db.query(models.User).filter(models.User.id == user_id).first()


def get_user_by_email(db: Session, email: str) -> Optional[models.User]:
    return db.query(models.User).filter(models.User.email == email).first()


def get_user_by_username(db: Session, username: str) -> Optional[models.User]:
    return db.query(models.User).filter(models.User.username == username).first()


def get_users(db: Session, skip: int = 0, limit: int = 100) -> List[models.User]:
    return db.query(models.User).offset(skip).limit(limit).all()


def create_user(db: Session, user: schemas.UserCreate) -> models.User:
    hashed_password = pwd_context.hash(user.password)
    db_user = models.User(
        username=user.username,
        email=user.email,
        hashed_password=hashed_password
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


# Location CRUD operations
def get_locations(db: Session, user_id: int, skip: int = 0, limit: int = 100) -> List[models.Location]:
    return db.query(models.Location).filter(models.Location.user_id == user_id).offset(skip).limit(limit).all()


def get_current_location(db: Session, user_id: int) -> Optional[models.Location]:
    return db.query(models.Location).filter(models.Location.user_id == user_id).order_by(desc(models.Location.timestamp)).first()


def create_location(db: Session, location: schemas.LocationCreate, user_id: int) -> models.Location:
    db_location = models.Location(**location.dict(), user_id=user_id)
    db.add(db_location)
    db.commit()
    db.refresh(db_location)
    return db_location


def update_location(db: Session, user_id: int, location: schemas.LocationCreate) -> models.Location:
    # Get current location or create new one
    current_location = get_current_location(db, user_id)
    if current_location:
        # Update existing location
        current_location.latitude = location.latitude
        current_location.longitude = location.longitude
        current_location.name = location.name or current_location.name
        db.commit()
        db.refresh(current_location)
        return current_location
    else:
        # Create new location
        return create_location(db, location, user_id)


# Track CRUD operations
def get_tracks(db: Session, user_id: int, skip: int = 0, limit: int = 100) -> List[models.Track]:
    """Получение треков пользователя с количеством точек"""
    tracks = db.query(
        models.Track,
        func.count(models.TrackPoint.id).label('points_count')
    ).outerjoin(models.TrackPoint).filter(
        models.Track.user_id == user_id
    ).group_by(models.Track.id).offset(skip).limit(limit).all()
    
    # Добавляем количество точек к каждому треку
    result = []
    for track, points_count in tracks:
        track.points_count = points_count
        result.append(track)
    
    return result


def get_track(db: Session, track_id: int, user_id: int) -> Optional[models.Track]:
    return db.query(models.Track).filter(models.Track.id == track_id, models.Track.user_id == user_id).first()


def create_track(db: Session, track: schemas.TrackCreate, user_id: int) -> models.Track:
    db_track = models.Track(**track.dict(), user_id=user_id)
    db.add(db_track)
    db.commit()
    db.refresh(db_track)
    return db_track


def delete_track(db: Session, track_id: int, user_id: int) -> bool:
    track = get_track(db, track_id, user_id)
    if track:
        db.delete(track)
        db.commit()
        return True
    return False


# TrackPoint CRUD operations
def get_track_points(db: Session, track_id: int, user_id: int) -> List[models.TrackPoint]:
    # Verify track belongs to user
    track = get_track(db, track_id, user_id)
    if not track:
        return []
    return db.query(models.TrackPoint).filter(models.TrackPoint.track_id == track_id).all()


def get_distance(db: Session, track_id: int, user_id: int) -> float | None:
    track_points = get_track_points(db, track_id, user_id)
    if not track_points:
        return 0
    distance = 0
    for i in range(len(track_points) - 1):
        point1 = track_points[i]
        point2 = track_points[i + 1]
        distance += point1.distance_to(point2)
    return distance


def get_duration(db: Session, track_id: int, user_id: int) -> float | None:
    track_points = get_track_points(db, track_id, user_id)
    if not track_points:
        return 0
    duration = track_points[-1].timestamp - track_points[0].timestamp
    return duration.total_seconds()

def create_track_point(db: Session, track_point: schemas.TrackPointCreate, track_id: int) -> models.TrackPoint:
    db_track_point = models.TrackPoint(**track_point.dict(), track_id=track_id)
    db.add(db_track_point)
    db.commit()
    db.refresh(db_track_point)
    return db_track_point


def create_track_with_points(db: Session, track_upload: schemas.TrackUpload, user_id: int) -> models.Track:
    """Создание трека с точками в транзакции"""
    try:
        # Создаем трек
        track_data = schemas.TrackCreate(name=track_upload.name, description=track_upload.description)
        db_track = create_track(db, track_data, user_id)
        
        # Создаем точки трека
        for point_data in track_upload.points:
            point = schemas.TrackPointCreate(
                latitude=point_data.latitude,
                longitude=point_data.longitude,
                altitude=point_data.altitude,
                speed=point_data.speed
            )
            db_track_point = models.TrackPoint(
                **point.dict(),
                track_id=db_track.id,
                timestamp=point_data.timestamp or datetime.utcnow()
            )
            db.add(db_track_point)
        
        # Коммитим все изменения
        db.commit()
        db.refresh(db_track)
        
        return db_track
        
    except Exception as e:
        # Откатываем транзакцию в случае ошибки
        db.rollback()
        raise e 