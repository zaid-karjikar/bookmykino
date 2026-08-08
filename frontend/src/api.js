const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';


export async function getMovies({ limit, offset, playingToday, languageVersion, search } = {}) {
    const params = new URLSearchParams();
    if (limit != null) params.set('limit', limit);
    if (offset != null && offset !== 0) params.set('offset', offset);
    if (playingToday) params.set('playing_today', 'true');
    if (languageVersion) params.set('language_version', languageVersion);
    if (search) params.set('search', search);
    const query = params.toString() ? `?${params}` : '';
    const response = await fetch(`${BASE_URL}/movies/${query}`);
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


export async function getShowtimes(movieId, date, languageVersion) {
    const params = new URLSearchParams();
    if (date) params.set('date', date);
    if (languageVersion) params.set('language_version', languageVersion);
    const query = params.toString() ? `?${params}` : '';
    const response = await fetch(`${BASE_URL}/movies/${movieId}/showtimes${query}`);
    if (!response.ok) {
        throw new Error('Failed to fetch showtimes');
    }
    return response.json();
}