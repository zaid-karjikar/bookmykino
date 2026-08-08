import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { getMovies } from "../api";
import MovieRow from "../components/MovieRow";
import MovieGrid from "../components/MovieGrid";
import Navbar from "../components/Navbar";
import { langLabel } from "../lang";

const PAGE_SIZE = 18;
const SEARCH_DEBOUNCE_MS = 300;

export default function HomePage() {
  const [page, setPage] = useState(0);
  const [selectedLang, setSelectedLang] = useState(null);
  const [availableLangs, setAvailableLangs] = useState([]);
  // `searchInput` tracks the field so typing stays responsive; `search` is the
  // debounced value that actually drives the query.
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const debounceRef = useRef();
  const navigate = useNavigate();

  useEffect(() => () => clearTimeout(debounceRef.current), []);

  const { data: playingTodayData, isError: playingTodayError } = useQuery({
    queryKey: ["movies", "playing-today"],
    queryFn: () => getMovies({ playingToday: true }),
  });

  const { data: allMoviesData, isError: allMoviesError } = useQuery({
    queryKey: ["movies", "all", page, selectedLang, search],
    queryFn: () =>
      getMovies({
        limit: PAGE_SIZE,
        offset: page * PAGE_SIZE,
        languageVersion: selectedLang,
        search,
      }),
    // Keep the previous page on screen while the next one loads, so the grid
    // doesn't blank out on every keystroke.
    placeholderData: keepPreviousData,
  });

  // Populate chip options from unfiltered data; keep them visible while a
  // filter or search is narrowing the results.
  useEffect(() => {
    if (!selectedLang && !search && allMoviesData?.items) {
      const langs = new Set();
      allMoviesData.items.forEach((m) =>
        (m.language_versions || []).forEach((lv) => langs.add(lv))
      );
      const sorted = [...langs].sort();
      if (sorted.length > 0) setAvailableLangs(sorted);
    }
  }, [allMoviesData, selectedLang, search]);

  const playingToday = playingTodayData?.items ?? [];
  const allMovies = allMoviesData?.items ?? [];
  const total = allMoviesData?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const error = playingTodayError || allMoviesError;
  const isSearching = search.trim().length > 0;

  const handleMovieClick = (id) =>
    navigate(`/movies/${id}${selectedLang ? `?language_version=${selectedLang}` : ""}`);

  const handleLangSelect = (lang) => {
    setSelectedLang(lang);
    setPage(0);
  };

  // Debounced in the handler rather than an effect: one request per pause in
  // typing, without a render-triggered state cascade.
  const applySearch = (value) => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearch(value);
      setPage(0);
    }, SEARCH_DEBOUNCE_MS);
  };

  const handleSearchChange = (e) => {
    setSearchInput(e.target.value);
    applySearch(e.target.value);
  };

  const handleSearchClear = () => {
    clearTimeout(debounceRef.current);
    setSearchInput("");
    setSearch("");
    setPage(0);
  };

  const chipClass = (active) => `chip${active ? " chip--active" : ""}`;

  return (
    <div className="page">
      <Navbar />
      <div className="page-body">
        {error && <p className="status status--error">Failed to load movies</p>}

        {/* A search narrows the whole page, so the curated shelf steps aside. */}
        {!isSearching && playingToday.length > 0 && (
          <section className="section">
            <h2 className="section-heading">Playing Today</h2>
            <MovieRow movies={playingToday} onMovieClick={handleMovieClick} />
          </section>
        )}

        <section>
          <h2 className="section-heading">
            {isSearching ? `Results for "${search.trim()}"` : "All Movies"}
          </h2>

          <div className="search">
            <input
              className="search__input"
              type="search"
              value={searchInput}
              onChange={handleSearchChange}
              placeholder="Search movies…"
              aria-label="Search movies by title"
            />
            {searchInput && (
              <button
                type="button"
                className="search__clear"
                onClick={handleSearchClear}
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </div>

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

          {!error && allMovies.length === 0 ? (
            <p className="status">
              {isSearching ? `No movies match "${search.trim()}".` : "No movies to show."}
            </p>
          ) : (
            <MovieGrid
              movies={allMovies}
              onMovieClick={handleMovieClick}
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          )}
        </section>
      </div>
    </div>
  );
}
