import { useState } from "react";
import MovieCard from "./MovieCard";

const PAGE_SIZE = 15;

export default function MovieGrid({ movies, onMovieClick }) {
    const [page, setPage] = useState(1);
    const totalPages = Math.ceil(movies.length / PAGE_SIZE);
    const start = (page - 1) * PAGE_SIZE;
    const visibleMovies = movies.slice(start, start + PAGE_SIZE);

    return (
        <div>
            <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(5, 1fr)",
                gap: 16,
            }}>
                {visibleMovies.map((movie) => (
                    <MovieCard
                        key={movie.id}
                        movie={movie}
                        onClick={() => onMovieClick(movie.id)}
                    />
                ))}
            </div>

            {totalPages > 1 && (
                <div style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    gap: 8,
                    marginTop: 16,
                }}>
                    <button onClick={() => setPage(page - 1)} disabled={page === 1}>
                        ◂
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                        <button
                            key={n}
                            onClick={() => setPage(n)}
                            style={{ fontWeight: n === page ? "bold" : "normal" }}
                        >
                            {n}
                        </button>
                    ))}
                    <button onClick={() => setPage(page + 1)} disabled={page === totalPages}>
                        ▸
                    </button>
                </div>
            )}
        </div>
    );
}