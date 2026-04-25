import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getMovies } from "../api";
import MovieCard from "../components/MovieCard";

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

  return (
    <div>
      <h1>BoxOffice</h1>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
        {movies.map((movie) => (
          <MovieCard
            key={movie.id}
            movie={movie}
            onClick={() => navigate(`/movies/${movie.id}`)}
          />
        ))}
      </div>
    </div>
  );
}