# BookMyKino Frontend

React frontend for BookMyKino — browse movies playing in Berlin cinemas, filter by date, and book tickets.

## Tech stack
- **Framework:** React 19 + Vite
- **Routing:** React Router v7
- **Data fetching / caching:** TanStack React Query

## Running locally
```bash
npm install
npm run dev
```

## Environment variables
Copy `.env.example` to `.env`:
```
VITE_API_URL=http://localhost:8000
```

If `VITE_API_URL` is not set, the app defaults to `http://localhost:8000`.

## Pages
- `/` — Home: "Playing Today" row + paginated "All Movies" grid
- `/movies/:id` — Movie detail: hero banner, date selector, showtimes list with booking links
