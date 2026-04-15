from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.auth.schemas import TokenSchema
from app.modules.users.repository import UserRepository
from app.modules.users.service import (UserService, UserAlreadyExists,
                                       UsernameAlreadyTaken)
from app.modules.users.schemas import UserSchema, UserCreate
from app.modules.auth.security import verify_password
from app.modules.auth.jwt import create_access_token
from app.db.database import get_async_db
from app.core.config import settings

router = APIRouter()


@router.post("/login", response_model=TokenSchema)
async def login(form_data: OAuth2PasswordRequestForm = Depends(),
                db: AsyncSession = Depends(get_async_db)):
    """Вход пользователя и получение токена"""

    user_service = UserService(UserRepository(db))

    user = await user_service.get_user_by_username(form_data.username)
    if not user or not verify_password(form_data.password,
                                       str(user.hashed_password)):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token_expires = timedelta(
        minutes=settings.access_token_expire_minutes
    )
    access_token = create_access_token(
        data={"sub": str(user.username)}, expires_delta=access_token_expires
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "expires_in": settings.access_token_expire_minutes * 60,
        "user": user
    }


@router.post("/register", response_model=UserSchema)
async def register(user: UserCreate, db: AsyncSession = Depends(get_async_db)):
    """Регистрация нового пользователя"""

    user_service = UserService(UserRepository(db))

    try:
        return await user_service.create_user(user)

    except UserAlreadyExists:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    except UsernameAlreadyTaken:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already taken",
        )
