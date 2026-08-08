import MovieCard from "./MovieCard";

export default function MovieGrid({ movies, onMovieClick, page, totalPages, onPageChange }) {
  return (
    <div>
      <div className="movie-grid">
        {movies.map(movie => (
          <MovieCard key={movie.id} movie={movie} onClick={() => onMovieClick(movie.id)} />
        ))}
      </div>

      {totalPages > 1 && (
        <nav className="pagination" aria-label="Pagination">
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              type="button"
              key={i}
              onClick={() => onPageChange(i)}
              className={`pagination__dot${i === page ? " pagination__dot--active" : ""}`}
              aria-label={`Page ${i + 1}`}
              aria-current={i === page ? "page" : undefined}
            />
          ))}
        </nav>
      )}
    </div>
  );
}
