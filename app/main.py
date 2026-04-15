import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.db import database
from app.core.config import settings
from app.api.v1.router import router as api_v1_router

# Настройка логирования
logging.basicConfig(level=getattr(logging, settings.log_level))
logger = logging.getLogger(__name__)


# Функция инициализации БД
async def init_models():
    """Создание таблиц в базе данных"""
    try:
        async with database.engine.begin() as conn:
            # Проверяем подключение
            await conn.execute(text("SELECT 1"))
            logger.info("Database connection successful")
            
            # Создаем таблицы
            await conn.run_sync(database.Base.metadata.create_all)
            logger.info("Database tables created successfully")
    except Exception as e:
        logger.error(f"Database initialization failed: {e}")
        raise


# Функция закрытия соединений
async def shutdown_models():
    """Закрытие соединений с базой данных"""
    try:
        await database.engine.dispose()
        logger.info("Database connections closed")
    except Exception as e:
        logger.error(f"Error closing database connections: {e}")


# # Lifespan менеджер (вместо startup/shutdown событий)
# @asynccontextmanager
# async def lifespan(app: FastAPI):
#     """Управление жизненным циклом приложения"""
#     # Startup
#     logger.info("Starting up Location Tracker API...")
    
#     # Инициализируем БД
#        alembic upgrade head &&
#     try:
#         await init_models()
#     except Exception as e:
#         logger.error(f"Failed to initialize database: {e}")
#         # Не останавливаем приложение, но логируем ошибку
    
#     yield
    
#     # Shutdown
#     logger.info("Shutting down Location Tracker API...")
#     await shutdown_models()

# FastAPI приложение
app = FastAPI(
    title="Location Tracker API",
    description="API для отслеживания местоположения и GPS треков",
    version="1.0.0",
    # lifespan=lifespan
)

# Настройка CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Обработчик ошибок
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    logger.error(f"Глобальная ошибка: {exc}")
    return {
        "error": "Внутренняя ошибка сервера",
        "detail": str(exc) if settings.log_level == "DEBUG" else None
    }


# Подключение роутов
app.include_router(api_v1_router, prefix="/api")


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
