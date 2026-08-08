import MovieCard from "./MovieCard";

export default function MovieRow({ movies, onMovieClick }) {
  if (!movies.length) return null;
  return (
    <div className="movie-row">
      {movies.map(movie => (
        <div key={movie.id} className="movie-row__item">
          <MovieCard movie={movie} onClick={() => onMovieClick(movie.id)} />
        </div>
      ))}
    </div>
  );
}
