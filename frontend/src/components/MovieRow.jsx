import MovieCard from "./MovieCard";

export default function MovieRow({ movies, onMovieClick }) {
  if (!movies.length) return null;
  return (
    <div style={{
      display: "flex",
      gap: 8,
      overflowX: "auto",
      paddingBottom: 12,
      scrollbarWidth: "thin",
    }}>
      {movies.map(movie => (
        <div key={movie.id} style={{ minWidth: 140, flexShrink: 0 }}>
          <MovieCard movie={movie} onClick={() => onMovieClick(movie.id)} />
        </div>
      ))}
    </div>
  );
}