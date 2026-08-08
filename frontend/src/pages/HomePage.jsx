import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getMovies } from "../api";
import MovieRow from "../components/MovieRow";
import MovieGrid from "../components/MovieGrid";
import Navbar from "../components/Navbar";
import { langLabel } from "../lang";

const PAGE_SIZE = 18;

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

  const chipClass = (active) => `chip${active ? " chip--active" : ""}`;

  return (
    <div className="page">
      <Navbar />
      <div className="page-body">
        {error && <p className="status status--error">Failed to load movies</p>}

        {playingToday.length > 0 && (
          <section className="section">
            <h2 className="section-heading">Playing Today</h2>
            <MovieRow movies={playingToday} onMovieClick={handleMovieClick} />
          </section>
        )}

        <section>
          <h2 className="section-heading">All Movies</h2>

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
