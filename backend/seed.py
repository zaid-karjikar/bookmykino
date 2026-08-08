"""
seed.py — generate a rolling demo schedule.

Why this exists
---------------
Showtimes used to come from the companion CinemaxX scraper. That source now
sits behind Cloudflare bot protection and the scheduled scrape is disabled, so
the last real snapshot is frozen in the past. With every showtime expired the
app renders as a catalogue of dead links: the "Playing Today" shelf is empty,
the language chips never appear (they are derived from upcoming showtimes),
and every movie page reports "No showtimes for this day".

This script keeps the deployed demo browsable by generating a schedule for the
next `--days` days. It is a *demo schedule*, not a feed, and the UI labels it
as such. The movies and posters it references are real scraped/TMDB data; only
the screening times, prices and language versions are generated.

Properties
----------
Deterministic  A given (movie, date) always produces the same screenings, so
               re-running mid-window is a no-op rather than a reshuffle.
Idempotent     Rows are upserted on the `booking_url` unique constraint.
Self-cleaning  Demo rows outside the current window are deleted after the new
               window is written, so the table does not grow without bound.
Non-destructive Only rows carrying DEMO_MARKER are ever deleted. Real scraped
               showtimes are never touched.

Usage
-----
    python seed.py                # seed the next 7 days
    python seed.py --days 14      # longer window
    python seed.py --dry-run      # print the plan, write nothing
    python seed.py --with-movies  # also insert the movie fixture if empty
"""

from __future__ import annotations

import argparse
import json
import os
import random
import sys
import zoneinfo
from datetime import datetime, timedelta, date as date_type
from pathlib import Path

from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

BERLIN_TZ = zoneinfo.ZoneInfo("Europe/Berlin")

CINEMA_NAME = "CinemaxX Berlin"
LOCATION_HINT = "Potsdamer Platz"

# Every generated booking_url carries this token. It is what makes demo rows
# identifiable for cleanup, and it cannot collide with a real scraped URL.
DEMO_MARKER = "bookmykino-demo"
# Real page, so the "Book" button lands somewhere that exists rather than 404ing.
BOOKING_BASE = "https://www.cinemaxx.de/kinoprogramm/berlin/jetzt-im-kino"

FIXTURE_PATH = Path(__file__).parent / "seed_movies.json"

# Distributions below are taken from the last real scrape (192 sampled
# screenings) so the demo keeps the shape of the actual data.

# german 70% · english 23% · englische-untertitel 5% · deutsche-untertitel 2%
LANGUAGE_WEIGHTS = [
    ("german", 70),
    ("english", 23),
    ("englische-untertitel", 5),
    ("deutsche-untertitel", 2),
]

# (start_minute, end_minute, price_floor) per daypart, minutes from midnight.
# Real listings ran 09:30–21:00 on a 5-minute grid with .99 prices.
DAYPARTS = [
    (9 * 60 + 30, 12 * 60, [8.99, 9.99, 10.99]),      # matinee
    (12 * 60, 17 * 60, [10.99, 11.99, 12.99, 13.99]),  # afternoon
    (17 * 60, 21 * 60, [12.99, 13.99, 14.99, 15.99, 16.99]),  # evening
]
DAYPART_WEIGHTS = [2, 3, 5]  # evenings carry the most screenings

# How many screenings a title gets per day, by popularity tier. A tier-0 title
# does not run every day, which is what keeps the grid from looking generated.
TIER_SCREENINGS = {
    0: (0, 2),
    1: (2, 4),
    2: (3, 6),
}


def _client():
    """Prefer the service role key for writes; fall back to anon."""
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_ANON_KEY")
    if not url or not key:
        sys.exit(
            "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_ANON_KEY) "
            "must be set. Copy .env.example to .env and fill them in."
        )
    return create_client(url, key)


def _weighted(rng: random.Random, pairs: list[tuple]) -> str:
    values = [v for v, _ in pairs]
    weights = [w for _, w in pairs]
    return rng.choices(values, weights=weights, k=1)[0]


def _tier(movie_id: str) -> int:
    """Stable popularity tier for a title, derived from its id."""
    return random.Random(f"tier:{movie_id}").choices([0, 1, 2], weights=[4, 4, 2], k=1)[0]


def get_or_create_cinema(db, dry_run: bool) -> str | None:
    found = db.table("cinemas").select("id").eq("name", CINEMA_NAME).execute().data
    if found:
        return found[0]["id"]
    if dry_run:
        print(f"  would create cinema {CINEMA_NAME!r}")
        return None
    created = (
        db.table("cinemas")
        .insert({"name": CINEMA_NAME, "location_hint": LOCATION_HINT})
        .execute()
        .data
    )
    print(f"  created cinema {CINEMA_NAME!r}")
    return created[0]["id"]


def ensure_movies(db, with_movies: bool, dry_run: bool) -> list[dict]:
    """Return the catalogue, inserting the fixture only into an empty table."""
    movies = db.table("movies").select("id, title").execute().data
    if movies:
        return movies

    if not with_movies:
        sys.exit(
            "No movies in the database. Re-run with --with-movies to insert the "
            f"fixture from {FIXTURE_PATH.name}."
        )

    fixture = json.loads(FIXTURE_PATH.read_text(encoding="utf-8"))
    if dry_run:
        print(f"  would insert {len(fixture)} movies from {FIXTURE_PATH.name}")
        return []

    inserted = db.table("movies").upsert(fixture, on_conflict="title").execute().data
    print(f"  inserted {len(inserted)} movies from {FIXTURE_PATH.name}")
    return db.table("movies").select("id, title").execute().data


def screenings_for(movie: dict, day: date_type, cinema_id: str) -> list[dict]:
    """Deterministically generate one movie's screenings for one day."""
    rng = random.Random(f"{movie['id']}:{day.isoformat()}")
    low, high = TIER_SCREENINGS[_tier(movie["id"])]
    count = rng.randint(low, high)
    if count == 0:
        return []

    rows: list[dict] = []
    used_minutes: set[int] = set()

    for _ in range(count):
        part = rng.choices(DAYPARTS, weights=DAYPART_WEIGHTS, k=1)[0]
        start_min, end_min, price_pool = part

        # 5-minute grid, matching how the real listings were spaced.
        for _attempt in range(10):
            minute = rng.randrange(start_min, end_min, 5)
            # Keep screenings of the same title at least 45 minutes apart.
            if all(abs(minute - m) >= 45 for m in used_minutes):
                break
        else:
            continue
        used_minutes.add(minute)

        start = datetime.combine(day, datetime.min.time(), tzinfo=BERLIN_TZ) + timedelta(
            minutes=minute
        )
        stamp = start.strftime("%Y%m%d%H%M")
        rows.append(
            {
                "movie_id": movie["id"],
                "cinema_id": cinema_id,
                "start_time": start.isoformat(),
                "price": rng.choice(price_pool),
                "booking_url": f"{BOOKING_BASE}?{DEMO_MARKER}={movie['id'][:8]}-{stamp}",
                "language_version": _weighted(rng, LANGUAGE_WEIGHTS),
            }
        )

    return sorted(rows, key=lambda r: r["start_time"])


def prune_stale_demo_rows(db, window_start: str, window_end: str) -> int:
    """Delete demo rows outside the current window. Real rows are untouched."""
    stale = (
        db.table("showtimes")
        .select("id")
        .like("booking_url", f"%{DEMO_MARKER}%")
        .or_(f"start_time.lt.{window_start},start_time.gt.{window_end}")
        .execute()
        .data
    )
    if not stale:
        return 0
    ids = [row["id"] for row in stale]
    db.table("showtimes").delete().in_("id", ids).execute()
    return len(ids)


def main() -> None:
    # Literal rather than __doc__, which contains characters the Windows
    # console (cp1252) cannot encode.
    parser = argparse.ArgumentParser(
        description="Generate a rolling demo schedule of cinema showtimes."
    )
    parser.add_argument("--days", type=int, default=7, help="window length (default 7)")
    parser.add_argument("--dry-run", action="store_true", help="print, do not write")
    parser.add_argument(
        "--with-movies",
        action="store_true",
        help="insert the movie fixture when the table is empty",
    )
    args = parser.parse_args()

    db = _client()
    today = datetime.now(BERLIN_TZ).date()
    days = [today + timedelta(days=i) for i in range(args.days)]

    print(f"Seeding demo schedule: {days[0]} -> {days[-1]} ({args.days} days)")

    cinema_id = get_or_create_cinema(db, args.dry_run)
    movies = ensure_movies(db, args.with_movies, args.dry_run)
    if not movies or cinema_id is None:
        print("Nothing further to do (dry run on an empty database).")
        return

    rows = [
        row
        for day in days
        for movie in movies
        for row in screenings_for(movie, day, cinema_id)
    ]

    per_day: dict[str, int] = {}
    for row in rows:
        per_day[row["start_time"][:10]] = per_day.get(row["start_time"][:10], 0) + 1
    for day in days:
        print(f"  {day}  {per_day.get(day.isoformat(), 0):>3} screenings")

    if args.dry_run:
        print(f"\nDry run: {len(rows)} screenings generated, nothing written.")
        return

    # Write the new window first so the app is never briefly empty, then prune.
    for chunk_start in range(0, len(rows), 500):
        chunk = rows[chunk_start : chunk_start + 500]
        db.table("showtimes").upsert(chunk, on_conflict="booking_url").execute()

    window_start = datetime.combine(
        days[0], datetime.min.time(), tzinfo=BERLIN_TZ
    ).isoformat()
    window_end = datetime.combine(
        days[-1], datetime.max.time(), tzinfo=BERLIN_TZ
    ).isoformat()
    pruned = prune_stale_demo_rows(db, window_start, window_end)

    print(f"\nUpserted {len(rows)} demo screenings, pruned {pruned} stale.")


if __name__ == "__main__":
    main()
