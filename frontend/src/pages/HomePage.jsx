import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getMovies } from "../api";
import MovieRow from "../components/MovieRow";
import MovieGrid from "../components/MovieGrid";
import Navbar from "../components/Navbar";

const PAGE_SIZE = 18;

import { langLabel } from "../lang";

const chipStyle = (active) => ({
  padding: "6px 16px",
  borderRadius: 2,
  border: active ? "1px solid var(--red)" : "1px solid var(--border)",
  background: active ? "var(--red)" : "transparent",
  color: "#fff",
  fontSize: 12,
  fontWeight: 600,
  letterSpacing: 0.5,
  cursor: "pointer",
  transition: "all 0.15s ease",
});

export default function HomePage() {
  const [page, setPage] = useState(0);
  const [selectedLang, setSelectedLang] = useState(null);
  const [availableLangs, setAvailableLangs] = useState([]);
  const navigate = useNavigate();

  const { data: playingTodayData, isError: playingTodayError } = useQuery({
    queryKey: ["movies", "playing-today"],
    queryFn: () => getMovies({ playingToday: true }),
  });

  const { data: allMoviesData, isError: allMoviesError } = useQuery({
    queryKey: ["movies", "all", page, selectedLang],
    queryFn: () => getMovies({ limit: PAGE_SIZE, offset: page * PAGE_SIZE, languageVersion: selectedLang }),
  });

  // Populate chip options from unfiltered data; keep them visible while filter is active
  useEffect(() => {
    if (!selectedLang && allMoviesData?.items) {
      const langs = new Set();
      allMoviesData.items.forEach((m) =>
        (m.language_versions || []).forEach((lv) => langs.add(lv))
      );
      const sorted = [...langs].sort();
      if (sorted.length > 0) setAvailableLangs(sorted);
    }
  }, [allMoviesData, selectedLang]);

  const playingToday = playingTodayData?.items ?? [];
  const allMovies = allMoviesData?.items ?? [];
  const total = allMoviesData?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const error = playingTodayError || allMoviesError;

  const handleMovieClick = (id) =>
    navigate(`/movies/${id}${selectedLang ? `?language_version=${selectedLang}` : ""}`);
  const handleLangSelect = (lang) => {
    setSelectedLang(lang);
    setPage(0);
  };

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

          {availableLangs.length > 0 && (
            <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
              <button type="button" style={chipStyle(!selectedLang)} onClick={() => handleLangSelect(null)}>
                Any
              </button>
              {availableLangs.map((lang) => (
                <button type="button" key={lang} style={chipStyle(selectedLang === lang)} onClick={() => handleLangSelect(lang)}>
                  {langLabel(lang)}
                </button>
              ))}
            </div>
          )}

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
