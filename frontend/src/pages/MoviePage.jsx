import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getShowtimes } from "../api";
import ShowtimeBlock from "../components/ShowtimeBlock";

export default function MoviePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [showtimes, setShowtimes] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    getShowtimes(id)
      .then(setShowtimes)
      .catch(() => setError("Failed to load showtimes"));
  }, [id]);

  if (error) return <p>{error}</p>;

  return (
    <div>
      <button onClick={() => navigate(-1)}>← Back</button>
      <h1>Showtimes</h1>
      {showtimes.length === 0 ? (
        <p>No showtimes available.</p>
      ) : (
        showtimes.map((showtime) => (
          <ShowtimeBlock key={showtime.id} showtime={showtime} />
        ))
      )}
    </div>
  );
}