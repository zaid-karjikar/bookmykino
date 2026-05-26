import { useState, useEffect } from "react";
import MovieCard from "./MovieCard";

const PAGE_SIZE = 18;

export default function MovieGrid({ movies, onMovieClick }) {
  const [page, setPage] = useState(0);
  useEffect(() => { setPage(0); }, [movies.length]);
  const totalPages = Math.ceil(movies.length / PAGE_SIZE);
  const visible = movies.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <div>
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
        gap: 8,
      }}>
        {visible.map(movie => (
          <MovieCard key={movie.id} movie={movie} onClick={() => onMovieClick(movie.id)} />
        ))}
      </div>

      {totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 32 }}>
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              onClick={() => setPage(i)}
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