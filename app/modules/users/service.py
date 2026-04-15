from passlib.context import CryptContext
from typing import Sequence

from app.modules.users.models import User
from app.modules.users.schemas import UserSchema, UserCreate
from app.modules.users.repository import UserRepository

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class UserAlreadyExists(Exception):
    pass


class UsernameAlreadyTaken(Exception):
    pass


class UserService():

    def __init__(self, repository: UserRepository):
        self.repository = repository

    async def get_user(self, user_id: int) -> UserSchema:
        user = await self.repository.get_user_by_id(user_id)
        if not user:
            raise ValueError("User not found")
        return user

    async def get_user_by_email(self, email: str) -> UserSchema:
        user = await self.repository.get_user_by_email(email)
        if not user:
            raise ValueError("Email not found")
        return user

    async def get_user_by_username(self, username: str) -> User:
        user = await self.repository.get_user_by_username(username)
        if not user:
            raise ValueError("User not found")
        return user

    async def get_users(self, skip: int = 0, limit: int = 100
                        ) -> Sequence[User]:
        return await self.repository.get_users(skip, limit)

    async def create_user(self, data: UserCreate) -> User:
        if await self.repository.get_user_by_email(data.email):
            raise UserAlreadyExists()

        if await self.repository.get_user_by_username(data.username):
            raise UsernameAlreadyTaken()

        new_user = User(
            username=data.username,
            email=data.email,
            hashed_password=pwd_context.hash(data.password)
        )
        return await self.repository.create_user(new_user)
