from pydantic import BaseModel
from datetime import datetime
from uuid import UUID


class MovieResponse(BaseModel):
    id: UUID
    title: str
    poster_url: str | None


class ShowtimeResponse(BaseModel):
    id: UUID
    start_time: datetime
    price: float
    booking_url: str | None
    cinema_name: str
    location_hint: str | None

    @classmethod
    def from_supabase(cls, data: dict):
        cinema = data.pop("cinemas", {})
        return cls(
            **data,
            cinema_name=cinema.get("name"),
            location_hint=cinema.get("location_hint")
        )
