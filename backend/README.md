# BookMyKino API

FastAPI backend for BookMyKino — a cinema movie discovery platform for Berlin.

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/movies/` | Paginated movie list |
| `GET` | `/movies/{id}` | Single movie by ID |
| `GET` | `/movies/{id}/showtimes` | Showtimes for a movie, filtered by date |

### `GET /movies/` query params
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `limit` | int | — | Max results to return (1–200) |
| `offset` | int | 0 | Number of results to skip |
| `playing_today` | bool | false | Only return movies with showtimes today |
| `language_version` | str | — | Only movies with an upcoming showtime in this version |
| `search` | str | — | Case-insensitive match on the original or German title (max 100 chars) |

Results are ordered by title so pagination is stable across requests.

Response: `{ "items": [...], "total": <int> }`

### `GET /movies/{id}/showtimes` query params
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `date` | date | today | Filter showtimes to this date (`YYYY-MM-DD`) |
| `language_version` | str | — | Only showtimes in this language version |

## Tech stack
- **Framework:** FastAPI
- **Database:** Supabase (PostgreSQL)
- **Timezone:** All "today" logic uses Europe/Berlin

## Data model
- **movies** — id, title, poster_url
- **cinemas** — id, name, location_hint
- **showtimes** — id, movie_id, cinema_id, start_time, price, booking_url

## Running locally

Requires **Python 3.12** (pinned in `.python-version`, matching the scraper's
CI). Avoid 3.14 for now: the Supabase client pulls in `pyiceberg`, which
publishes no wheel for it and fails to build from source.

```bash
uvicorn app.main:app --reload
```

## Environment variables
Copy `.env.example` to `.env` and fill in the values:
```
SUPABASE_URL=
SUPABASE_ANON_KEY=
ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```
