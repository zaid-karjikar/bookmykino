const BASE_URL = 'http://localhost:8000';


export async function getMovies() {
    const response = await fetch(`${BASE_URL}/movies`);
    if (!response.ok) {
        throw new Error('Failed to fetch movies');
    }
    return response.json();
}


export async function getShowtimes(movieId) {
    const response = await fetch(`${BASE_URL}/movies/${movieId}/showtimes`);
    if (!response.ok) {
        throw new Error('Failed to fetch showtimes');
    }
    return response.json();
}