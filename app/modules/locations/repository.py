from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import desc, delete, select
from typing import Sequence

from app.modules.locations.models import Location


class LocationRepository:

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_locations(
            self,
            user_id: int,
            skip: int = 0,
            limit: int = 100
            ) -> Sequence[Location]:

        result = await self.db.execute(
            select(Location)
            .where(Location.user_id == user_id)
            .offset(skip)
            .limit(limit)
            )
        return result.scalars().all()

    async def get_current_location(
            self,
            user_id: int
            ) -> Location | None:

        result = await self.db.execute(
            select(Location)
            .where(Location.user_id == user_id)
            .order_by(desc(Location.timestamp))
            .limit(1)
            )
        return result.scalar_one_or_none()

    async def create_location(
            self,
            location: Location
            ) -> Location:

        self.db.add(location)
        await self.db.commit()
        await self.db.refresh(location)
        return location

    async def update_location(
            self,
            user_id: int,
            location: Location
            ) -> Location:

        current_location = await self.get_current_location(user_id)
        if current_location:
            current_location.latitude = location.latitude
            current_location.longitude = location.longitude
            current_location.name = location.name or current_location.name
            await self.db.commit()
            await self.db.refresh(current_location)
            return current_location
        else:
            location.user_id = user_id
            return await self.create_location(location)

    async def delete_location(
                self,
                location_id: int,
                user_id: int
                ) -> bool:

        result = await self.db.execute(
            delete(Location)
            .where(Location.id == location_id, Location.user_id == user_id)
        )
        await self.db.commit()
        return result.rowcount > 0
