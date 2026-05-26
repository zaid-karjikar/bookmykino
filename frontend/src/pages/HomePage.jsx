import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getMovies } from "../api";
import MovieRow from "../components/MovieRow";
import MovieGrid from "../components/MovieGrid";
import Navbar from "../components/Navbar";

export default function HomePage() {
  const [movies, setMovies] = useState([]);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    getMovies()
      .then(setMovies)
      .catch(() => setError("Failed to load movies"));
  }, []);

  const playingToday = movies.filter(m => m.playing_today);
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
          <h2 style={{
            fontFamily: "var(--font-display)",
            fontSize: 22,
            letterSpacing: 2,
            color: "var(--text-secondary)",
            marginBottom: 16,
            textTransform: "uppercase",
          }}>
            All Movies
          </h2>
          <MovieGrid movies={movies} onMovieClick={handleMovieClick} />
        </section>
      </div>
    </div>
  );
}