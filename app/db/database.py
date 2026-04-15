from sqlalchemy import create_engine
from sqlalchemy.ext.asyncio import (AsyncSession, async_sessionmaker,
                                    create_async_engine)
from sqlalchemy.ext.declarative import declarative_base

from app.core.config import settings

# Create database engine
engine = create_async_engine(
    settings.database_url_async,
    echo=False,
    pool_pre_ping=True,
)

# Синхронный engine для Alembic (только если нужно)
sync_engine = create_engine(
    settings.database_url,
    echo=settings.debug,
    pool_pre_ping=True
)

# Create AsyncSessionLocal class
AsyncSessionLocal = async_sessionmaker(
    engine,
    expire_on_commit=False,
)

# Create Base class
Base = declarative_base()


# Dependency to get database session
async def get_async_db() -> AsyncSession:
    async with AsyncSessionLocal() as session:
        yield session
