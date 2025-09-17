from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session

from app import crud, schemas, models, maps
from app.auth import get_current_active_user
from app.database import get_db

router = APIRouter()


@router.get("/current-location", response_class=HTMLResponse)
def get_current_location_map(
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Получение карты с текущим местоположением"""
    location = crud.get_current_location(db, user_id=current_user.id)
    if not location:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No location data found"
        )
    
    map_html = maps.create_location_map(location)
    return HTMLResponse(content=map_html)


@router.get("/track/{track_id}", response_class=HTMLResponse)
def get_track_map(
    track_id: int,
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Получение карты с треком"""
    track = crud.get_track(db, track_id=track_id, user_id=current_user.id)
    if not track:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Track not found"
        )
    
    track_points = crud.get_track_points(db, track_id=track_id, user_id=current_user.id)
    map_html = maps.create_track_map(track, track_points)
    return HTMLResponse(content=map_html)


@router.get("/tracks", response_class=HTMLResponse)
def get_tracks_map(
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Получение карты со всеми треками пользователя"""
    tracks = crud.get_tracks(db, user_id=current_user.id)
    if not tracks:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No tracks found"
        )
    
    # Загружаем точки для каждого трека
    for track in tracks:
        track.track_points = crud.get_track_points(db, track_id=track.id, user_id=current_user.id)
    
    map_html = maps.create_multi_track_map(tracks)
    return HTMLResponse(content=map_html)


@router.get("/locations", response_class=HTMLResponse)
def get_locations_map(
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Получение карты со всеми местоположениями пользователя"""
    locations = crud.get_locations(db, user_id=current_user.id)
    if not locations:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No locations found"
        )
    
    map_html = maps.create_stats_map(locations)
    return HTMLResponse(content=map_html) 