# BookMyKino API

A FastAPI backend for BookMyKino, a cinema movies discovery platform for Berlin, Germany.

## What it does
Two endpoints:
- `GET /movies` - returns all movies (id, title, poster_url)
- `GET /movies/{id}/showtimes` - returns showtimes for a movie, sorted by time, with cinema name, location hint, and booking URL

## Tech stack
- **Framework:** FastAPI
- **Database:** Supabase (PostgreSQL)

## Data model
- **movies** - id, title, poster_url
- **cinemas** - id, name, location_hint
- **showtimes** - id, movie_id, cinema_id, start_time, price, booking_url

## Running locally
```bash
uvicorn app.main:app --reload
```
## Environment variables
SUPABASE_URL=
SUPABASE_ANON_KEY=