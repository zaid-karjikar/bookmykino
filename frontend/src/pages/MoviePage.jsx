import { useState, useMemo } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getMovie, getShowtimes } from "../api";
import Navbar from "../components/Navbar";
import { langLabel } from "../lang";

function getNext7Days() {
  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    days.push({
      label: i === 0 ? "Today" : i === 1 ? "Tomorrow" : d.toLocaleDateString("en-DE", { weekday: "short", day: "numeric", month: "short" }),
      value: new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Berlin" }).format(d),
    });
  }
  return days;
}

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
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <Navbar />

      {/* Hero section */}
      <div style={{
        position: "relative",
        height: 360,
        marginBottom: 48,
        overflow: "hidden",
      }}>
        {movie?.poster_url && (
          <>
            <img
              src={movie.poster_url}
              alt={movie.title}
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
                objectPosition: "center top",
                filter: "blur(2px) brightness(0.35)",
                transform: "scale(1.05)",
              }}
            />
            <div style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(to right, rgba(20,20,20,0.95) 40%, transparent), linear-gradient(to top, var(--bg) 0%, transparent 40%)",
            }} />
          </>
        )}

        <div style={{
          position: "relative",
          height: "100%",
          display: "flex",
          alignItems: "flex-end",
          padding: "0 48px 32px",
          gap: 32,
        }}>
          {movie?.poster_url && (
            <img
              src={movie.poster_url}
              alt={movie.title}
              style={{
                height: 200,
                borderRadius: 4,
                boxShadow: "0 8px 32px rgba(0,0,0,0.8)",
                flexShrink: 0,
              }}
            />
          )}
          <div>
            <button
              type="button"
              onClick={() => navigate("/")}
              style={{
                background: "none",
                border: "none",
                color: "var(--text-secondary)",
                fontSize: 13,
                marginBottom: 12,
                padding: 0,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              ← Back
            </button>
            <h1 style={{
              fontFamily: "var(--font-display)",
              fontSize: 52,
              letterSpacing: 2,
              lineHeight: 1,
              color: "#fff",
              textShadow: "0 2px 8px rgba(0,0,0,0.5)",
            }}>
              {movie?.title ?? "Loading..."}
            </h1>
          </div>
        </div>
      </div>

      {/* Showtimes section */}
      <div style={{ padding: "0 48px 64px" }}>

        {/* Language filter */}
        {availableLangs.length > 0 && (
          <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => handleLangSelect(null)}
              style={{
                padding: "6px 16px", borderRadius: 2, fontSize: 12, fontWeight: 600,
                letterSpacing: 0.5, cursor: "pointer", transition: "all 0.15s ease",
                border: !selectedLang ? "1px solid var(--red)" : "1px solid var(--border)",
                background: !selectedLang ? "var(--red)" : "transparent",
                color: "#fff",
              }}
            >
              Any
            </button>
            {availableLangs.map((lang) => (
              <button
                type="button"
                key={lang}
                onClick={() => handleLangSelect(lang)}
                style={{
                  padding: "6px 16px", borderRadius: 2, fontSize: 12, fontWeight: 600,
                  letterSpacing: 0.5, cursor: "pointer", transition: "all 0.15s ease",
                  border: selectedLang === lang ? "1px solid var(--red)" : "1px solid var(--border)",
                  background: selectedLang === lang ? "var(--red)" : "transparent",
                  color: "#fff",
                }}
              >
                {langLabel(lang)}
              </button>
            ))}
          </div>
        )}

        {/* Date selector */}
        <div style={{ display: "flex", gap: 8, marginBottom: 32, flexWrap: "wrap" }}>
          {days.map(day => (
            <button
              type="button"
              key={day.value}
              onClick={() => setSelectedDate(day.value)}
              style={{
                padding: "8px 20px",
                borderRadius: 2,
                border: selectedDate === day.value ? "1px solid var(--red)" : "1px solid var(--border)",
                background: selectedDate === day.value ? "var(--red)" : "transparent",
                color: "#fff",
                fontSize: 13,
                fontWeight: 500,
                letterSpacing: 0.5,
                transition: "all 0.15s ease",
              }}
            >
              {day.label}
            </button>
          ))}
        </div>

        {/* Showtimes list */}
        {loading && (
          <p style={{ color: "var(--text-muted)", fontSize: 14 }}>Loading...</p>
        )}
        {error && (
          <p style={{ color: "var(--red)", fontSize: 14 }}>{error}</p>
        )}
        {!loading && !error && showtimes.length === 0 && (
          <p style={{ color: "var(--text-muted)", fontSize: 14 }}>No showtimes for this day.</p>
        )}
        {!loading && showtimes.map(showtime => (
          <div
            key={showtime.id}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "16px 20px",
              marginBottom: 8,
              background: "var(--bg-elevated)",
              borderRadius: 4,
              border: "1px solid var(--border)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
              <span style={{
                fontFamily: "var(--font-display)",
                fontSize: 28,
                letterSpacing: 1,
                color: "#fff",
                minWidth: 70,
              }}>
                {new Date(showtime.start_time).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}
              </span>
              <div>
                <p style={{ fontSize: 14, fontWeight: 500, color: "var(--text-primary)" }}>
                  {showtime.cinema_name}
                </p>
                {showtime.location_hint && (
                  <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                    {showtime.location_hint}
                  </p>
                )}
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
              {showtime.language_version && (
                <span style={{
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: 0.5,
                  color: "var(--text-muted)",
                  border: "1px solid var(--border)",
                  borderRadius: 2,
                  padding: "2px 6px",
                  textTransform: "uppercase",
                }}>
                  {langLabel(showtime.language_version)}
                </span>
              )}
              {showtime.price != null && (
                <span style={{ fontSize: 14, color: "var(--text-secondary)" }}>
                  from €{Number(showtime.price).toFixed(2)}
                </span>
              )}
              {showtime.booking_url && (
                <a
                  href={showtime.booking_url}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    padding: "8px 20px",
                    background: "var(--red)",
                    color: "#fff",
                    borderRadius: 2,
                    fontSize: 13,
                    fontWeight: 600,
                    letterSpacing: 0.5,
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = "var(--red-hover)"}
                  onMouseLeave={e => e.currentTarget.style.background = "var(--red)"}
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