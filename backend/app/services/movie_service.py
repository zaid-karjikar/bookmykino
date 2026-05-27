from app.database.db import database
from app.schemas.movie_schema import MovieResponse, ShowtimeResponse
from datetime import datetime, date as date_type
import zoneinfo

BERLIN_TZ = zoneinfo.ZoneInfo("Europe/Berlin")


def _day_range(d: date_type) -> tuple[str, str]:
    start = datetime.combine(d, datetime.min.time(), tzinfo=BERLIN_TZ).isoformat()
    end = datetime.combine(d, datetime.max.time(), tzinfo=BERLIN_TZ).isoformat()
    return start, end


def get_all_movies(
    limit: int | None = None,
    offset: int = 0,
    playing_today_only: bool = False,
):
    today = datetime.now(BERLIN_TZ).date()
    today_start, today_end = _day_range(today)

    showtimes_today = (
        database.table("showtimes")
        .select("movie_id")
        .gte("start_time", today_start)
        .lte("start_time", today_end)
        .execute()
        .data
    )
    movie_ids_today = {row["movie_id"] for row in showtimes_today}

    if playing_today_only and not movie_ids_today:
        return {"items": [], "total": 0}

    query = database.table("movies").select("id, title, poster_url", count="exact")

    if playing_today_only:
        query = query.in_("id", list(movie_ids_today))

    if limit is not None:
        query = query.range(offset, offset + limit - 1)

    result = query.execute()

    return {
        "items": [
            MovieResponse(
                id=movie["id"],
                title=movie["title"],
                poster_url=movie["poster_url"],
                playing_today=movie["id"] in movie_ids_today,
            )
            for movie in result.data
        ],
        "total": result.count or 0,
    }


def get_movie_by_id(movie_id: str):
    today = datetime.now(BERLIN_TZ).date()
    today_start, today_end = _day_range(today)

    result = (
        database.table("movies")
        .select("id, title, poster_url")
        .eq("id", movie_id)
        .execute()
        .data
    )
    if not result:
        return None

    movie = result[0]

    showtimes_today = (
        database.table("showtimes")
        .select("movie_id")
        .eq("movie_id", movie_id)
        .gte("start_time", today_start)
        .lte("start_time", today_end)
        .execute()
        .data
    )

    return MovieResponse(
        id=movie["id"],
        title=movie["title"],
        poster_url=movie["poster_url"],
        playing_today=len(showtimes_today) > 0,
    )


def get_showtimes_for_movie(movie_id: str, date: date_type | None = None):
    day_start, day_end = _day_range(date or datetime.now(BERLIN_TZ).date())

    data = (
        database.table("showtimes")
        .select(
            "id, start_time, price, booking_url, language_version, cinemas(name, location_hint)"
        )
        .eq("movie_id", movie_id)
        .gte("start_time", day_start)
        .lte("start_time", day_end)
        .order("start_time")
        .execute()
        .data
    )

    return [ShowtimeResponse.from_database(row) for row in data]
