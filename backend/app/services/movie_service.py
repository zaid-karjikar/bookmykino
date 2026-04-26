from app.database.db import database
from app.schemas.movie_schema import MovieResponse, ShowtimeResponse
from datetime import datetime, date as date_type
import zoneinfo


def get_all_movies():
    berlin_tz = zoneinfo.ZoneInfo("Europe/Berlin")
    today = datetime.now(berlin_tz).date()
    today_start = datetime.combine(
        today, datetime.min.time(), tzinfo=berlin_tz
    ).isoformat()
    today_end = datetime.combine(
        today, datetime.max.time(), tzinfo=berlin_tz
    ).isoformat()

    movies = database.table("movies").select("id, title, poster_url").execute().data

    showtimes_today = (
        database.table("showtimes")
        .select("movie_id")
        .gte("start_time", today_start)
        .lte("start_time", today_end)
        .execute()
        .data
    )

    movie_ids_today = {row["movie_id"] for row in showtimes_today}

    return [
        MovieResponse(
            id=movie["id"],
            title=movie["title"],
            poster_url=movie["poster_url"],
            playing_today=movie["id"] in movie_ids_today,
        )
        for movie in movies
    ]


def get_showtimes_for_movie(movie_id: str, date: date_type | None = None):
    berlin_tz = zoneinfo.ZoneInfo("Europe/Berlin")

    if date:
        day_start = datetime.combine(date, datetime.min.time(), tzinfo=berlin_tz).isoformat()
        day_end = datetime.combine(date, datetime.max.time(), tzinfo=berlin_tz).isoformat()
    
    else:
        today = datetime.now(berlin_tz).date()
        day_start = datetime.combine(today, datetime.min.time(), tzinfo=berlin_tz).isoformat()
        day_end = datetime.combine(today, datetime.max.time(), tzinfo=berlin_tz).isoformat()

    data = (
        database.table("showtimes")
        .select("id, start_time, price, booking_url, cinemas(name, location_hint)")
        .eq("movie_id", movie_id)
        .gte("start_time", day_start)
        .lte("start_time", day_end)
        .order("start_time")
        .execute()
        .data
    )

    return [ShowtimeResponse.from_database(row) for row in data]
