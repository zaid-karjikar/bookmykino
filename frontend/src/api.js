const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';


export async function getMovies({ limit, offset, playingToday } = {}) {
    const params = new URLSearchParams();
    if (limit != null) params.set('limit', limit);
    if (offset != null && offset !== 0) params.set('offset', offset);
    if (playingToday) params.set('playing_today', 'true');
    const query = params.toString() ? `?${params}` : '';
    const response = await fetch(`${BASE_URL}/movies${query}`);
    if (!response.ok) {
        throw new Error('Failed to fetch movies');
    }
    return response.json();
}


export async function getMovie(movieId) {
    const response = await fetch(`${BASE_URL}/movies/${movieId}`);
    if (!response.ok) {
        throw new Error('Failed to fetch movie');
    }
    return response.json();
}


export async function getShowtimes(movieId, date) {
    const url = date
        ? `${BASE_URL}/movies/${movieId}/showtimes?date=${date}`
        : `${BASE_URL}/movies/${movieId}/showtimes`;
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error('Failed to fetch showtimes');
    }
    return response.json();
}