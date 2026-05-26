import MovieCard from "./MovieCard";

export default function MovieGrid({ movies, onMovieClick, page, totalPages, onPageChange }) {
  return (
    <div>
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
        gap: 8,
      }}>
        {movies.map(movie => (
          <MovieCard key={movie.id} movie={movie} onClick={() => onMovieClick(movie.id)} />
        ))}
      </div>

      {totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 32 }}>
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              type="button"
              key={i}
              onClick={() => onPageChange(i)}
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                border: "none",
                background: i === page ? "var(--red)" : "var(--text-muted)",
                padding: 0,
                transition: "background 0.2s",
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
