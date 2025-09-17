import logging
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app import models
from app.api import auth, locations, tracks, maps
from app.config import settings
from app.database import engine, get_db

# Настройка логирования
logging.basicConfig(level=getattr(logging, settings.log_level))
logger = logging.getLogger(__name__)

# Создаем таблицы в базе данных
models.Base.metadata.create_all(bind=engine)

# Создаем FastAPI приложение
app = FastAPI(
    title="Location Tracker API",
    description="API для отслеживания местоположения и GPS треков",
    version="1.0.0"
)

# Настройка CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Подключаем роуты
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Аутентификация"])
app.include_router(locations.router, prefix="/api/v1/locations", tags=["Местоположения"])
app.include_router(tracks.router, prefix="/api/v1/tracks", tags=["Треки"])
app.include_router(maps.router, prefix="/api/v1/maps", tags=["Карты"])

# Health check эндпоинт
@app.get("/health")
async def health_check():
    """Проверка состояния сервиса"""
    return {
        "status": "healthy",
        "service": "Location Tracker API",
        "version": "1.0.0"
    }

# Корневой эндпоинт
@app.get("/")
async def root():
    """Корневой эндпоинт"""
    return {
        "message": "Location Tracker API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health"
    }

# Обработчик ошибок
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    logger.error(f"Глобальная ошибка: {exc}")
    return {
        "error": "Внутренняя ошибка сервера",
        "detail": str(exc) if settings.log_level == "DEBUG" else None
    } 