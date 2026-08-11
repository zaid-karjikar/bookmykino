from app.core.cache import cache
from app.core.config import settings
from app.database.db import database
from app.schemas.movie_schema import (
    MovieResponse,
    PaginatedMovieResponse,
    ShowtimeResponse,
)
from datetime import datetime, date as date_type
import hashlib
import json
import zoneinfo

BERLIN_TZ = zoneinfo.ZoneInfo("Europe/Berlin")


def _day_range(d: date_type) -> tuple[str, str]:
    start = datetime.combine(d, datetime.min.time(), tzinfo=BERLIN_TZ).isoformat()
    end = datetime.combine(d, datetime.max.time(), tzinfo=BERLIN_TZ).isoformat()
    return start, end


def _ilike_pattern(term: str) -> str:
    """Build a PostgREST-safe quoted ILIKE pattern for use inside an `or` filter.

    Two layers of escaping are required:

    1. LIKE wildcards (% and _) typed by the user must match literally, so they
       get a backslash prefix (Postgres' default LIKE escape character).
    2. The result is wrapped in double quotes, because PostgREST reads commas
       and parentheses as `or=(...)` structure. Inside quotes it unescapes \\"
       and \\\\, so every backslash produced by step 1 has to be doubled.
    """
    literal = term.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
    escaped = f"%{literal}%".replace("\\", "\\\\").replace('"', '\\"')
    return f'"{escaped}"'


def _movies_cache_key(
    limit: int | None,
    offset: int,
    playing_today_only: bool,
    language_version: str | None,
    search: str | None,
) -> str:
    payload = json.dumps(
        {
            "limit": limit,
            "offset": offset,
            "playing_today_only": playing_today_only,
            "language_version": language_version,
            "search": search,
        },
        sort_keys=True,
    )
    digest = hashlib.sha256(payload.encode()).hexdigest()
    return f"movies:list:{digest}"


def get_all_movies(
    limit: int | None = None,
    offset: int = 0,
    playing_today_only: bool = False,
    language_version: str | None = None,
    search: str | None = None,
):
    cache_key = _movies_cache_key(
        limit, offset, playing_today_only, language_version, search
    )
    cached = cache.get(cache_key)
    if cached is not None:
        parsed = PaginatedMovieResponse.model_validate_json(cached)
        return {"items": parsed.items, "total": parsed.total}

    response = _fetch_all_movies(
        limit, offset, playing_today_only, language_version, search
    )
    cache.set(
        cache_key,
        PaginatedMovieResponse(**response).model_dump_json(),
        settings.MOVIES_CACHE_TTL_SECONDS,
    )
    return response


def _fetch_all_movies(
    limit: int | None,
    offset: int,
    playing_today_only: bool,
    language_version: str | None,
    search: str | None,
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

    # Match either the original title or the German release title, since a
    # Berlin audience searches for both.
    if search and search.strip():
        pattern = _ilike_pattern(search.strip())
        query = query.or_(f"title.ilike.{pattern},title_de.ilike.{pattern}")

    if language_version:
        lang_filter_rows = (
            database.table("showtimes")
            .select("movie_id")
            .eq("language_version", language_version)
            .gte("start_time", today_start)
            .execute()
            .data
        )
        lang_movie_ids = {row["movie_id"] for row in lang_filter_rows}
        if not lang_movie_ids:
            return {"items": [], "total": 0}
        query = query.in_("id", list(lang_movie_ids))

    # Explicit ordering — without it Postgres gives no stable row order and
    # paging can repeat or skip movies between requests.
    query = query.order("title")

    if limit is not None:
        query = query.range(offset, offset + limit - 1)

    result = query.execute()

    # Batch language_versions for returned movies, scoped to upcoming showtimes
    returned_ids = [m["id"] for m in result.data]
    lang_map: dict[str, list[str]] = {}
    if returned_ids:
        lang_rows = (
            database.table("showtimes")
            .select("movie_id, language_version")
            .in_("movie_id", returned_ids)
            .gte("start_time", today_start)
            .execute()
            .data
        )
        seen: dict[str, set[str]] = {}
        for row in lang_rows:
            lv = row.get("language_version")
            if lv:
                seen.setdefault(row["movie_id"], set()).add(lv)
        lang_map = {mid: list(lvs) for mid, lvs in seen.items()}

    return {
        "items": [
            MovieResponse(
                id=movie["id"],
                title=movie["title"],
                poster_url=movie["poster_url"],
                playing_today=movie["id"] in movie_ids_today,
                language_versions=lang_map.get(movie["id"], []),
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


def get_showtimes_for_movie(
    movie_id: str,
    date: date_type | None = None,
    language_version: str | None = None,
):
    day_start, day_end = _day_range(date or datetime.now(BERLIN_TZ).date())

    query = (
        database.table("showtimes")
        .select(
            "id, start_time, price, booking_url, language_version, cinemas(name, location_hint)"
        )
        .eq("movie_id", movie_id)
        .gte("start_time", day_start)
        .lte("start_time", day_end)
        .order("start_time")
    )
    if language_version:
        query = query.eq("language_version", language_version)

    return [ShowtimeResponse.from_database(row) for row in query.execute().data]
