from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app import crud, schemas, models
from app.auth import get_current_active_user
from app.database import get_db
from app.schemas import TrackChunkUpload, GPSData

router = APIRouter()


@router.get("/", response_model=List[schemas.Track])
def get_tracks(
    skip: int = 0,
    limit: int = 100,
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Получение списка треков пользователя"""
    tracks = crud.get_tracks(db, user_id=current_user.id, skip=skip, limit=limit)
    return tracks


@router.get("/recent", response_model=List[schemas.TrackRecent])
def get_recent_tracks(
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Получение списка последних треков пользователя"""
    tracks = crud.get_tracks(db, user_id=current_user.id, skip=0, limit=3)
    result = []
    for track in tracks:
        distance = crud.get_distance(db, track_id=track.id, user_id=current_user.id)
        duration = crud.get_duration(db, track_id=track.id, user_id=current_user.id)
        result.append(
            schemas.TrackRecent(
                id=track.id,
                name=track.name,
                description=track.description,
                created_at=track.created_at,
                distance=distance,
                duration=duration
            )
        )
    return result


@router.post("/", response_model=schemas.Track)
def create_track(
    track: schemas.TrackCreate,
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Создание нового трека"""
    return crud.create_track(db=db, track=track, user_id=current_user.id)


@router.get("/{track_id}", response_model=schemas.TrackWithPoints)
def get_track(
    track_id: int,
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Получение трека с точками"""
    track = crud.get_track(db, track_id=track_id, user_id=current_user.id)
    if not track:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Track not found"
        )
    
    # Получаем точки трека
    track_points = crud.get_track_points(db, track_id=track_id, user_id=current_user.id)
    
    # Создаем объект с точками
    track_with_points = schemas.TrackWithPoints(
        id=track.id,
        name=track.name,
        description=track.description,
        user_id=track.user_id,
        created_at=track.created_at,
        track_points=track_points
    )
    
    return track_with_points


@router.delete("/{track_id}")
def delete_track(
    track_id: int,
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Удаление трека"""
    success = crud.delete_track(db, track_id=track_id, user_id=current_user.id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Track not found"
        )
    return {"message": "Track deleted successfully"}


@router.post("/upload", response_model=schemas.Track)
def upload_track(
    track_upload: schemas.TrackUpload,
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Загрузка трека с точками"""
    # Валидация входных данных
    if not track_upload.points:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Track must contain at least one point"
        )
    
    if len(track_upload.points) > 10000:  # Ограничение на количество точек
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
        # Создаем трек с точками
        track = crud.create_track_with_points(db=db, track_upload=track_upload, user_id=current_user.id)
        
        # Получаем количество созданных точек
        points_count = len(track_upload.points)
        
        return {
            "id": track.id,
            "name": track.name,
            "description": track.description,
            "user_id": track.user_id,
            "created_at": track.created_at,
            "points_count": points_count
        }
        
    except Exception as e:
        # Логируем ошибку
        print(f"Error creating track: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create track with points"
        )


@router.post("/{track_id}/points", response_model=schemas.TrackPoint)
def add_track_point(
    track_id: int,
    point: schemas.TrackPointCreate,
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Добавление точки к треку"""
    # Проверяем, что трек существует и принадлежит пользователю
    track = crud.get_track(db, track_id=track_id, user_id=current_user.id)
    if not track:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Track not found"
        )
    
    return crud.create_track_point(db=db, track_point=point, track_id=track_id)


@router.post("/{track_id}/points/bulk", response_model=dict)
def add_track_points_bulk(
    track_id: int,
    points: List[schemas.TrackPointCreate],
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Массовое добавление точек к треку"""
    # Проверяем, что трек существует и принадлежит пользователю
    track = crud.get_track(db, track_id=track_id, user_id=current_user.id)
    if not track:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Track not found"
        )
    
    if not points:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No points provided"
        )
    
    if len(points) > 1000:  # Ограничение на количество точек за раз
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot add more than 1000 points at once"
        )
    
    try:
        # Создаем точки в транзакции
        created_points = []
        for point_data in points:
            db_track_point = models.TrackPoint(
                **point_data.dict(),
                track_id=track_id
            )
            db.add(db_track_point)
            created_points.append(db_track_point)
        
        db.commit()
        
        return {
            "message": f"Successfully added {len(created_points)} points to track {track_id}",
            "track_id": track_id,
            "points_added": len(created_points)
        }
        
    except Exception as e:
        db.rollback()
        print(f"Error adding points to track: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to add points to track"
        )


@router.get("/{track_id}/points", response_model=List[schemas.TrackPoint])
def get_track_points(
    track_id: int,
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Получение точек трека"""
    track_points = crud.get_track_points(db, track_id=track_id, user_id=current_user.id)
    return track_points


@router.post("/load_from_tracker", response_model=dict)
def load_from_tracker(
    chunk: TrackChunkUpload,
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Загрузка трека чанками с устройства (ESP/трекер).
    Первый чанк создает трек, остальные добавляют точки.
    """
    if chunk.is_first_chunk:
        # Создаем трек
        if not chunk.name or not chunk.points:
            raise HTTPException(status_code=400, detail="Name and points required for first chunk")
        track = crud.create_track(db=db, track=schemas.TrackCreate(name=chunk.name, description=chunk.description), user_id=current_user.id)
        track_id = track.id
    else:
        if not chunk.track_id:
            raise HTTPException(status_code=400, detail="track_id required for non-first chunk")
        track_id = chunk.track_id
        track = db.query(models.Track).filter(models.Track.id == track_id, models.Track.user_id == current_user.id).first()
        if not track:
            raise HTTPException(status_code=404, detail="Track not found")
    # Добавляем точки
    if chunk.points:
        for point in chunk.points:
            db_point = models.TrackPoint(
                track_id=track_id,
                latitude=point.latitude,
                longitude=point.longitude,
                timestamp=point.timestamp,
                altitude=point.altitude,
                speed=point.speed
            )
            db.add(db_point)
        db.commit()
    return {"track_id": track_id, "status": "ok", "is_last_chunk": chunk.is_last_chunk}

