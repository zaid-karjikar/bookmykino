import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getShowtimes } from "../api";
import ShowtimeBlock from "../components/ShowtimeBlock";

function getNext7Days() {
  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    days.push({
      label: i === 0 ? "Today" : i === 1 ? "Tomorrow" : d.toLocaleDateString("en-DE", {weekday: "short", day: "numeric", month: "short" }),
      value: d.toISOString().split("T")[0],
    })
  }
  return days;
}
export default function MoviePage() {
  const { id } = useParams();
  const days = getNext7Days();
  const [selectedDate, setSelectedDate] = useState(days[0].value);
  const navigate = useNavigate();
  const [showtimes, setShowtimes] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(null);
    getShowtimes(id, selectedDate)
      .then(setShowtimes)
      .catch(() => setError("Failed to load showtimes"))
      .finally(() => setLoading(false));
  }, [id, selectedDate]);

  return (
    <div style={{ padding: 24 }}>
      <h1>Showtimes</h1>

      <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
        {days.map((day) => (
          <button
            key={day.value}
            onClick={() => setSelectedDate(day.value)}
            style={{
              padding: "8px 16px",
              borderRadius: 8,
              border: "1px solid #ccc",
              cursor: "pointer",
              backgroundColor: selectedDate === day.value ? "#000" : "#fff",
              color: selectedDate === day.value ? "#fff" : "#000",
              fontWeight: selectedDate === day.value ? "bold" : "normal",
            }}
          >
            {day.label}
          </button>
        ))}
      </div>

      {loading && <p>Loading...</p>}
      {error && <p>{error}</p>}
      {!loading && !error && showtimes.length === 0 && (
        <p>No showtimes for this day.</p>
      )}
      {!loading && showtimes.map((showtime) => (
        <ShowtimeBlock key={showtime.id} showtime={showtime} />
      ))}
    </div>
  );
}