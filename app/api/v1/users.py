from fastapi import APIRouter, Depends

from app.modules.auth.users import get_current_user
from app.modules.users.schemas import UserSchema


router = APIRouter()


@router.get("/me", response_model=UserSchema)
async def read_users_me(current_user=Depends(get_current_user)):
    """Получение информации о текущем пользователе"""
    return current_user
