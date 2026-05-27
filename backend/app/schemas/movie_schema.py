from pydantic import BaseModel
from datetime import datetime
from uuid import UUID


class MovieResponse(BaseModel):
    id: UUID
    title: str
    poster_url: str | None
    playing_today: bool
    language_versions: list[str] = []


class PaginatedMovieResponse(BaseModel):
    items: list[MovieResponse]
    total: int


class ShowtimeResponse(BaseModel):
    id: UUID
    start_time: datetime
    price: float | None
    booking_url: str | None
    cinema_name: str | None
    location_hint: str | None
    language_version: str | None

    @classmethod
    def from_database(cls, data: dict):
        cinema = data.get("cinemas", {})
        return cls(
            **{k: v for k, v in data.items() if k != "cinemas"},
            cinema_name=cinema.get("name"),
            location_hint=cinema.get("location_hint")
        )
