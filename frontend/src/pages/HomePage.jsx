import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getMovies } from "../api";
import MovieRow from "../components/MovieRow";
import MovieGrid from "../components/MovieGrid";
import Navbar from "../components/Navbar";

const PAGE_SIZE = 18;

export default function HomePage() {
  const [page, setPage] = useState(0);
  const navigate = useNavigate();

  const { data: playingTodayData, isError: playingTodayError } = useQuery({
    queryKey: ["movies", "playing-today"],
    queryFn: () => getMovies({ playingToday: true }),
  });

  const { data: allMoviesData, isError: allMoviesError } = useQuery({
    queryKey: ["movies", "all", page],
    queryFn: () => getMovies({ limit: PAGE_SIZE, offset: page * PAGE_SIZE }),
  });

  const playingToday = playingTodayData?.items ?? [];
  const allMovies = allMoviesData?.items ?? [];
  const total = allMoviesData?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const error = playingTodayError || allMoviesError;

  const handleMovieClick = (id) => navigate(`/movies/${id}`);

  const sectionHeadingStyle = {
    fontFamily: "var(--font-display)",
    fontSize: 22,
    letterSpacing: 2,
    color: "var(--text-secondary)",
    marginBottom: 16,
    textTransform: "uppercase",
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <Navbar />
      <div style={{ padding: "0 48px 64px" }}>
        {error && <p style={{ color: "var(--red)", padding: "32px 0" }}>Failed to load movies</p>}

        {playingToday.length > 0 && (
          <section style={{ marginBottom: 48 }}>
            <h2 style={sectionHeadingStyle}>Playing Today</h2>
            <MovieRow movies={playingToday} onMovieClick={handleMovieClick} />
          </section>
        )}

        <section>
          <h2 style={sectionHeadingStyle}>All Movies</h2>
          <MovieGrid
            movies={allMovies}
            onMovieClick={handleMovieClick}
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </section>
      </div>
    </div>
  );
}
