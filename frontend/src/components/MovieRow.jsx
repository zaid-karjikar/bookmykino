import MovieCard from "./MovieCard";

export default function MovieRow({ movies, onMovieClick}) {
    return (
        <div style={{
            display: "flex",
            gap: 16,
            overflowX: "auto",
            paddingBottom: 8,
        }}>
            {movies.map((movie) => (
                <div key={movie.id} style={{flexShrink: 0}}>
                    <MovieCard movie={movie} onClick={() => onMovieClick(movie.id)} />
                </div>
            ))}
        </div>
    );
}