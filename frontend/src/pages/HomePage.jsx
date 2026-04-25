import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getMovies } from "../api";
import MovieRow from "../components/MovieRow";
import MovieGrid from "../components/MovieGrid";


export default function HomePage() {
  const [movies, setMovies] = useState([]);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    getMovies()
      .then(setMovies)
      .catch(() => setError("Failed to load movies"));
  }, []);

  if (error) return <p>{error}</p>;

  const playingToday = movies.filter((m) => m.playing_today);

  const handleMovieClick = (id) => navigate(`/movies/${id}`);

  return (
  <div style={{ padding: 24 }}>
      <h1>BookMyKino</h1>

      <section style={{ marginBottom: 32 }}>
        <h2>Playing today</h2>
        <MovieRow movies={playingToday} onMovieClick={handleMovieClick} />
      </section>

      <section>
        <h2>Browse movies</h2>
        <MovieGrid movies={movies} onMovieClick={handleMovieClick} />
      </section>
    </div>
  );
}