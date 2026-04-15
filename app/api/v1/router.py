from fastapi import APIRouter

from app.api.v1.auth import router as auth_router
from app.api.v1.locations import router as locations_router
from app.api.v1.maps import router as maps_router
from app.api.v1.tracks import router as tracks_router
from app.api.v1.users import router as users_router
from app.api.v1.dashboard import router as dashboard_router

router = APIRouter(prefix="/v1")

router.include_router(auth_router, prefix="/auth", tags=["Аутентификация"])
router.include_router(locations_router, prefix="/locations", tags=["Местоположения"])
router.include_router(maps_router, prefix="/maps", tags=["Карты"])
router.include_router(tracks_router, prefix="/tracks", tags=["Треки"])
router.include_router(users_router, prefix="/users", tags=["Пользователи"])
router.include_router(dashboard_router, prefix="/dashboard", tags=["Dashboard"])
