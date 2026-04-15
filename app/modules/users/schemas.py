from datetime import datetime
from pydantic import BaseModel, Field


# User schemas
class UserBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: str = Field(..., pattern=r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$")


class UserCreate(UserBase):
    password: str = Field(..., min_length=6)


class UserSchema(UserBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
