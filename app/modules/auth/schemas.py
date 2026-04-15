from pydantic import BaseModel
from app.modules.users.schemas import UserSchema


class TokenSchema(BaseModel):
    access_token: str
    token_type: str
    expires_in: int
    user: UserSchema
