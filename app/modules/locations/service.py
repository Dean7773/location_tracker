from typing import List, Sequence

from app.modules.locations.models import Location
from app.modules.locations.schemas import LocationCreate, LocationUpdate
from app.modules.locations.repository import LocationRepository


class LocationService:

    def __init__(self, repository: LocationRepository):
        self.repository = repository

    async def get_locations(
            self,
            user_id: int,
            skip: int = 0,
            limit: int = 100
            ) -> List[Location]:

        result = await self.repository.get_locations(user_id, skip, limit)
        return list(result)

    async def get_current_location(
            self,
            user_id: int
            ) -> Location | None:

        return await self.repository.get_current_location(user_id)

    async def create_location(
            self,
            location_data: LocationCreate,
            user_id: int
            ) -> Location:

        location = Location(**location_data.model_dump(),
                            user_id=user_id)
        return await self.repository.create_location(location)

    async def update_location(
            self,
            user_id: int,
            location_data: LocationUpdate
            ) -> Location:

        location = Location(**location_data.model_dump(exclude_unset=True),
                            user_id=user_id)
        return await self.repository.update_location(user_id, location)

    async def delete_location(
            self,
            location_id: int,
            user_id: int
            ) -> bool:

        return await self.repository.delete_location(location_id, user_id)
