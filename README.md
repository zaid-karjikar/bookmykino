# BookMyKino

A cinema movie discovery platform for Berlin. Browse what's playing today, explore the full catalog, and book tickets directly from the app.

## Data status

**Films and posters are real. Screening times are generated sample data.**

The companion scraper read its data from cinemaxx.de, which has since moved
behind Cloudflare bot protection and now returns 403 to every automated
request — including the showings endpoint the scraper used. A headless browser
cannot clear the challenge, and the daily GitHub Actions job is challenged
harder still on datacenter IPs, so the scheduled scrape has been disabled
instead of left to fail nightly.

The movie catalogue is the last real scrape, enriched via TMDB. The showtimes
attached to it expired shortly afterwards, which left the deployed app looking
broken rather than merely stale: the "Playing Today" shelf renders only when
something is playing, and the language chips are derived from *upcoming*
showtimes, so both disappeared entirely and every movie page reported "No
showtimes for this day".

So [`backend/seed.py`](backend/seed.py) generates a rolling 7-day demo
schedule, refreshed daily by
[a scheduled workflow](.github/workflows/seed.yml). It is deterministic per
(movie, day), upserts on the `booking_url` unique constraint, and only ever
deletes rows it created — real scraped showtimes are never touched. The
generated distributions (language mix, price bands, time-of-day spread) are
modelled on the last real scrape. The UI labels this data as generated on both
pages.

The durable fix is to stop scraping and read from a licensed feed. The
[International Showtimes API](https://www.internationalshowtimes.com/showtimes-api)
covers Berlin and returns cinemas, showtimes, language/format attributes and
deep booking links over plain HTTP with an API key, which would also remove
the separate TMDB enrichment step. It starts at €149/month per market, so it
is not wired up here.

## Structure

```
bookmykino/
├── backend/   FastAPI + Supabase
└── frontend/  React + Vite
```

## Quick start

Start the backend:
```bash
cd backend
uvicorn app.main:app --reload
```

Start the frontend:
```bash
cd frontend
npm install
npm run dev
```

Populate an empty database (inserts the movie fixture, then a 7-day schedule):
```bash
cd backend
python seed.py --with-movies
```
