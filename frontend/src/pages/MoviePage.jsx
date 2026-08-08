import { useState, useMemo } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getMovie, getShowtimes } from "../api";
import Navbar from "../components/Navbar";
import DemoNotice from "../components/DemoNotice";
import { langLabel } from "../lang";

// Every date and time on this page is the cinema's local time, never the
// viewer's. A screening at 20:15 in Berlin reads as 20:15 from anywhere;
// without this a visitor in Los Angeles would be shown 11:15 the same morning.
const CINEMA_TZ = "Europe/Berlin";

function getNext7Days() {
  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    days.push({
      label:
        i === 0
          ? "Today"
          : i === 1
            ? "Tomorrow"
            : d.toLocaleDateString("en-DE", {
                weekday: "short",
                day: "numeric",
                month: "short",
                timeZone: CINEMA_TZ,
              }),
      value: new Intl.DateTimeFormat("en-CA", { timeZone: CINEMA_TZ }).format(d),
    });
  }
  return days;
}

const chipClass = (active) => `chip${active ? " chip--active" : ""}`;

export default function MoviePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const days = getNext7Days();
  const [selectedDate, setSelectedDate] = useState(days[0].value);
  const [selectedLang, setSelectedLang] = useState(searchParams.get("language_version"));

  const { data: movie } = useQuery({
    queryKey: ["movie", id],
    queryFn: () => getMovie(id),
  });

  const { data: allShowtimes = [], isLoading: loading, isError } = useQuery({
    queryKey: ["showtimes", id, selectedDate],
    queryFn: () => getShowtimes(id, selectedDate),
  });

  const availableLangs = useMemo(() => {
    const langs = new Set(allShowtimes.map((s) => s.language_version).filter(Boolean));
    return [...langs].sort();
  }, [allShowtimes]);

  const showtimes = useMemo(
    () => selectedLang ? allShowtimes.filter((s) => s.language_version === selectedLang) : allShowtimes,
    [allShowtimes, selectedLang]
  );

  const handleLangSelect = (lang) => {
    setSelectedLang(lang);
    if (lang) setSearchParams({ language_version: lang });
    else setSearchParams({});
  };

  const error = isError ? "Failed to load showtimes" : null;

  return (
    <div className="page">
      <Navbar />

      {/* Hero section */}
      <div className="hero">
        {movie?.poster_url && (
          <>
            <img className="hero__backdrop" src={movie.poster_url} alt="" aria-hidden="true" />
            <div className="hero__scrim" />
          </>
        )}

        <div className="hero__inner">
          {movie?.poster_url && (
            <img className="hero__poster" src={movie.poster_url} alt={movie.title} />
          )}
          <div>
            <button type="button" className="hero__back" onClick={() => navigate("/")}>
              ← Back
            </button>
            <h1 className="hero__title">{movie?.title ?? "Loading..."}</h1>
          </div>
        </div>
      </div>

      {/* Showtimes section */}
      <div className="page-body">
        <DemoNotice />

        {/* Language filter */}
        {availableLangs.length > 0 && (
          <div className="chip-row">
            <button type="button" className={chipClass(!selectedLang)} onClick={() => handleLangSelect(null)}>
              Any
            </button>
            {availableLangs.map((lang) => (
              <button type="button" key={lang} className={chipClass(selectedLang === lang)} onClick={() => handleLangSelect(lang)}>
                {langLabel(lang)}
              </button>
            ))}
          </div>
        )}

        {/* Date selector */}
        <div className="chip-row" style={{ marginBottom: 32 }}>
          {days.map(day => (
            <button
              type="button"
              key={day.value}
              className={chipClass(selectedDate === day.value)}
              onClick={() => setSelectedDate(day.value)}
            >
              {day.label}
            </button>
          ))}
        </div>

        {/* Showtimes list */}
        {loading && <p className="status">Loading...</p>}
        {error && <p className="status status--error">{error}</p>}
        {!loading && !error && showtimes.length === 0 && (
          <p className="status">No showtimes for this day.</p>
        )}
        {!loading && showtimes.map(showtime => (
          <div key={showtime.id} className="showtime">
            <div className="showtime__main">
              <span className="showtime__time">
                {new Date(showtime.start_time).toLocaleTimeString("de-DE", {
                  hour: "2-digit",
                  minute: "2-digit",
                  timeZone: CINEMA_TZ,
                })}
              </span>
              <div>
                <p className="showtime__cinema">{showtime.cinema_name}</p>
                {showtime.location_hint && (
                  <p className="showtime__hint">{showtime.location_hint}</p>
                )}
              </div>
            </div>
            <div className="showtime__meta">
              {showtime.language_version && (
                <span className="showtime__badge">{langLabel(showtime.language_version)}</span>
              )}
              {showtime.price != null && (
                <span className="showtime__price">from €{Number(showtime.price).toFixed(2)}</span>
              )}
              {showtime.booking_url && (
                <a
                  className="showtime__book"
                  href={showtime.booking_url}
                  target="_blank"
                  rel="noreferrer"
                >
                  Book
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
