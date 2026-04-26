from fastapi import APIRouter, Query
from datetime import date
from app.schemas.movie_schema import MovieResponse, ShowtimeResponse
from app.services import movie_service
from typing import List

router = APIRouter(prefix="/movies", tags=["Movies"])


@router.get("/", response_model=List[MovieResponse])
def get_movies():
    return movie_service.get_all_movies()


@router.get("/{movie_id}/showtimes", response_model=List[ShowtimeResponse])
def get_showtimes(movie_id: str, date: date | None = Query(default=None)):
    return movie_service.get_showtimes_for_movie(movie_id, date)
