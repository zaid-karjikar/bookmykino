import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getMovies } from "../api";
import MovieRow from "../components/MovieRow";
import MovieGrid from "../components/MovieGrid";
import Navbar from "../components/Navbar";

const PAGE_SIZE = 18;

export default function HomePage() {
  const [playingToday, setPlayingToday] = useState([]);
  const [allMovies, setAllMovies] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    getMovies({ playingToday: true })
      .then(data => setPlayingToday(data.items))
      .catch(() => setError("Failed to load movies"));
  }, []);

  useEffect(() => {
    getMovies({ limit: PAGE_SIZE, offset: page * PAGE_SIZE })
      .then(data => {
        setAllMovies(data.items);
        setTotal(data.total);
      })
      .catch(() => setError("Failed to load movies"));
  }, [page]);

  const totalPages = Math.ceil(total / PAGE_SIZE);
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
        {error && <p style={{ color: "var(--red)", padding: "32px 0" }}>{error}</p>}

        {playingToday.length > 0 && (
          <section style={{ marginBottom: 48 }}>
            <h2 style={sectionHeadingStyle}>
              Playing Today
            </h2>
            <MovieRow movies={playingToday} onMovieClick={handleMovieClick} />
          </section>
        )}

        <section>
          <h2 style={sectionHeadingStyle}>
            All Movies
          </h2>
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
