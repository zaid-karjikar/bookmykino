from fastapi import APIRouter, HTTPException, Query
from datetime import date
from app.schemas.movie_schema import (
    MovieResponse,
    ShowtimeResponse,
    PaginatedMovieResponse,
)
from app.services import movie_service
from typing import List

router = APIRouter(prefix="/movies", tags=["Movies"])


@router.get("/", response_model=PaginatedMovieResponse)
def get_movies(
    limit: int | None = Query(default=None, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    playing_today: bool = Query(default=False),
):
    return movie_service.get_all_movies(
        limit=limit, offset=offset, playing_today_only=playing_today
    )


@router.get("/{movie_id}", response_model=MovieResponse)
def get_movie(movie_id: str):
    movie = movie_service.get_movie_by_id(movie_id)
    if not movie:
        raise HTTPException(status_code=404, detail="Movie not found")
    return movie


@router.get("/{movie_id}/showtimes", response_model=List[ShowtimeResponse])
def get_showtimes(movie_id: str, date: date | None = Query(default=None)):
    return movie_service.get_showtimes_for_movie(movie_id, date)
