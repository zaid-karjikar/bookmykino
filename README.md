# BookMyKino

A cinema movie discovery platform for Berlin. Browse what's playing today, explore the full catalog, and book tickets directly from the app.

## Data status

Showtimes are currently a **fixed snapshot rather than a live feed.** The
companion scraper read its data from cinemaxx.de, which has since moved behind
Cloudflare bot protection and now returns 403 to every automated request —
including the showings endpoint the scraper used. A headless browser cannot
clear the challenge, and the daily GitHub Actions job is challenged harder
still on datacenter IPs, so the scheduled scrape has been disabled instead of
left to fail nightly.

Because of this, the "Playing Today" shelf may be empty and listed showtimes
may be in the past. Everything else — catalog, search, language filters,
pagination, per-movie showtime pages — works against the real API.

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
