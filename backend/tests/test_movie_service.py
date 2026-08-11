"""
Unit tests for movie_service.py.

The Supabase client is replaced by MockDatabase (via the mock_db fixture),
which lets each test pre-load exactly the responses execute() will pop off.

Execute-call order per function
────────────────────────────────
get_all_movies (no filters, no pagination):
  1. showtimes today        → movie_ids_today set
  2. movies query           → paginated list + count
  3. lang_versions batch    → language_versions per movie

get_all_movies (playing_today_only=True, no movies today):
  1. showtimes today → empty → early return

get_all_movies (language_version filter):
  1. showtimes today
  2. lang_filter showtimes  → narrow to matching movie IDs
  3. movies query
  4. lang_versions batch

get_movie_by_id:
  1. movies select          → [movie] or []
  2. showtimes today        → playing_today flag (only if movie found)

get_showtimes_for_movie:
  1. showtimes query        → list of rows
"""

from datetime import date
from uuid import uuid4

from app.services import movie_service

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

MOVIE_ID_1 = str(uuid4())
MOVIE_ID_2 = str(uuid4())
SHOWTIME_ID_1 = str(uuid4())
SHOWTIME_ID_2 = str(uuid4())

TODAY_ISO = "2026-05-27T12:00:00+02:00"


def _movie_row(movie_id=MOVIE_ID_1, title="Test Movie", poster=None):
    return {"id": movie_id, "title": title, "poster_url": poster}


def _showtime_row(movie_id=MOVIE_ID_1, lang="OV"):
    return {
        "id": str(uuid4()),
        "start_time": TODAY_ISO,
        "price": 12.0,
        "booking_url": "https://example.com",
        "language_version": lang,
        "cinemas": {"name": "CinemaxX", "location_hint": "Mitte"},
        "movie_id": movie_id,
    }


# ---------------------------------------------------------------------------
# _day_range
# ---------------------------------------------------------------------------


class TestDayRange:
    def test_returns_two_strings(self):
        start, end = movie_service._day_range(date(2026, 5, 27))
        assert isinstance(start, str)
        assert isinstance(end, str)

    def test_start_before_end(self):
        start, end = movie_service._day_range(date(2026, 5, 27))
        assert start < end

    def test_same_date(self):
        start, end = movie_service._day_range(date(2026, 5, 27))
        # Both should contain the date
        assert "2026-05-27" in start
        assert "2026-05-27" in end

    def test_different_days_do_not_overlap(self):
        _, end_day1 = movie_service._day_range(date(2026, 5, 27))
        start_day2, _ = movie_service._day_range(date(2026, 5, 28))
        assert end_day1 < start_day2


# ---------------------------------------------------------------------------
# get_all_movies
# ---------------------------------------------------------------------------


class TestGetAllMovies:
    def test_returns_empty_when_no_movies(self, mock_db):
        # 1) showtimes today → none
        mock_db.queue([])
        # 2) movies query → empty
        mock_db.queue([], count=0)
        # returned_ids is empty → no 3rd call

        result = movie_service.get_all_movies()

        assert result["total"] == 0
        assert result["items"] == []

    def test_returns_movies_with_metadata(self, mock_db):
        movie_row = _movie_row()
        # 1) showtimes today (movie is playing)
        mock_db.queue([{"movie_id": MOVIE_ID_1}])
        # 2) movies query
        mock_db.queue([movie_row], count=1)
        # 3) lang_versions batch
        mock_db.queue([{"movie_id": MOVIE_ID_1, "language_version": "OV"}])

        result = movie_service.get_all_movies()

        assert result["total"] == 1
        assert len(result["items"]) == 1
        item = result["items"][0]
        assert item.title == "Test Movie"
        assert item.playing_today is True
        assert "OV" in item.language_versions

    def test_playing_today_flag_false_when_not_in_showtimes(self, mock_db):
        movie_row = _movie_row(movie_id=MOVIE_ID_2)
        # 1) showtimes today → different movie
        mock_db.queue([{"movie_id": MOVIE_ID_1}])
        # 2) movies query returns MOVIE_ID_2
        mock_db.queue([movie_row], count=1)
        # 3) lang_versions batch
        mock_db.queue([])

        result = movie_service.get_all_movies()

        assert result["items"][0].playing_today is False

    def test_playing_today_only_early_return_when_none_playing(self, mock_db):
        # 1) showtimes today → empty → early return
        mock_db.queue([])

        result = movie_service.get_all_movies(playing_today_only=True)

        assert result == {"items": [], "total": 0}

    def test_playing_today_only_filters_to_playing_movies(self, mock_db):
        movie_row = _movie_row()
        # 1) showtimes today
        mock_db.queue([{"movie_id": MOVIE_ID_1}])
        # 2) movies query (should be filtered to playing IDs)
        mock_db.queue([movie_row], count=1)
        # 3) lang_versions batch
        mock_db.queue([{"movie_id": MOVIE_ID_1, "language_version": "DE"}])

        result = movie_service.get_all_movies(playing_today_only=True)

        assert result["total"] == 1
        assert result["items"][0].playing_today is True

    def test_language_version_filter_returns_matching_movies(self, mock_db):
        movie_row = _movie_row()
        # 1) showtimes today
        mock_db.queue([{"movie_id": MOVIE_ID_1}])
        # 2) lang_filter → only MOVIE_ID_1 has OV
        mock_db.queue([{"movie_id": MOVIE_ID_1}])
        # 3) movies query (filtered to lang_movie_ids)
        mock_db.queue([movie_row], count=1)
        # 4) lang_versions batch
        mock_db.queue([{"movie_id": MOVIE_ID_1, "language_version": "OV"}])

        result = movie_service.get_all_movies(language_version="OV")

        assert result["total"] == 1
        assert result["items"][0].language_versions == ["OV"]

    def test_language_version_filter_returns_empty_when_no_match(self, mock_db):
        # 1) showtimes today
        mock_db.queue([{"movie_id": MOVIE_ID_1}])
        # 2) lang_filter → no movies with that language
        mock_db.queue([])

        result = movie_service.get_all_movies(language_version="OV")

        assert result == {"items": [], "total": 0}

    def test_language_versions_are_deduplicated_per_movie(self, mock_db):
        movie_row = _movie_row()
        # 1) showtimes today
        mock_db.queue([{"movie_id": MOVIE_ID_1}])
        # 2) movies query
        mock_db.queue([movie_row], count=1)
        # 3) lang_versions batch — same language appears twice
        mock_db.queue(
            [
                {"movie_id": MOVIE_ID_1, "language_version": "OV"},
                {"movie_id": MOVIE_ID_1, "language_version": "OV"},
                {"movie_id": MOVIE_ID_1, "language_version": "DE"},
            ]
        )

        result = movie_service.get_all_movies()

        langs = result["items"][0].language_versions
        assert len(langs) == len(set(langs))
        assert set(langs) == {"OV", "DE"}

    def test_multiple_movies_get_correct_language_versions(self, mock_db):
        row1 = _movie_row(movie_id=MOVIE_ID_1, title="Movie A")
        row2 = _movie_row(movie_id=MOVIE_ID_2, title="Movie B")
        # 1) showtimes today
        mock_db.queue([{"movie_id": MOVIE_ID_1}, {"movie_id": MOVIE_ID_2}])
        # 2) movies query
        mock_db.queue([row1, row2], count=2)
        # 3) lang_versions batch
        mock_db.queue(
            [
                {"movie_id": MOVIE_ID_1, "language_version": "OV"},
                {"movie_id": MOVIE_ID_2, "language_version": "DE"},
            ]
        )

        result = movie_service.get_all_movies()

        items_by_id = {str(item.id): item for item in result["items"]}
        assert items_by_id[MOVIE_ID_1].language_versions == ["OV"]
        assert items_by_id[MOVIE_ID_2].language_versions == ["DE"]

    def test_results_are_ordered_for_stable_pagination(self, mock_db):
        mock_db.queue([{"movie_id": MOVIE_ID_1}])
        mock_db.queue([_movie_row()], count=1)
        mock_db.queue([])

        movie_service.get_all_movies(limit=10)

        assert mock_db.calls_to("order"), "movies query must specify an order"


# ---------------------------------------------------------------------------
# get_all_movies caching
# ---------------------------------------------------------------------------


class TestGetAllMoviesCaching:
    def test_second_identical_call_is_served_from_cache(self, mock_db, mock_cache):
        # Only one round of responses queued — if the second call fell
        # through to the database it would drain an empty queue and get
        # back {"data": [], "count": 0} instead, so an equal result here
        # proves the cache served it.
        mock_db.queue([{"movie_id": MOVIE_ID_1}])
        mock_db.queue([_movie_row()], count=1)
        mock_db.queue([{"movie_id": MOVIE_ID_1, "language_version": "OV"}])

        first = movie_service.get_all_movies()
        second = movie_service.get_all_movies()

        assert second["total"] == first["total"] == 1
        assert [str(i.id) for i in second["items"]] == [
            str(i.id) for i in first["items"]
        ]
        assert len(mock_cache.store) == 1

    def test_different_params_are_cached_separately(self, mock_db, mock_cache):
        mock_db.queue([{"movie_id": MOVIE_ID_1}])
        mock_db.queue([_movie_row()], count=1)
        mock_db.queue([])

        mock_db.queue([{"movie_id": MOVIE_ID_1}])
        mock_db.queue([_movie_row()], count=1)
        mock_db.queue([])

        movie_service.get_all_movies(search="dune")
        movie_service.get_all_movies(search="matrix")

        assert len(mock_cache.store) == 2
        assert len(mock_db.calls_to("table")) == 6  # 3 queries × 2 uncached calls

    def test_cache_miss_falls_through_when_redis_is_down(self, mock_db, monkeypatch):
        class BrokenCache:
            def get(self, key):
                return None  # mirrors Cache.get()'s fail-open behavior

            def set(self, key, value, ttl):
                pass  # mirrors Cache.set()'s fail-open behavior

        monkeypatch.setattr("app.services.movie_service.cache", BrokenCache())
        mock_db.queue([{"movie_id": MOVIE_ID_1}])
        mock_db.queue([_movie_row()], count=1)
        mock_db.queue([{"movie_id": MOVIE_ID_1, "language_version": "OV"}])

        result = movie_service.get_all_movies()

        assert result["total"] == 1


# ---------------------------------------------------------------------------
# _ilike_pattern  (search escaping)
# ---------------------------------------------------------------------------


class TestIlikePattern:
    """PostgREST reads commas/parens as `or=(...)` structure and Postgres reads
    % and _ as LIKE wildcards, so both need neutralising in user input."""

    def test_wraps_in_quotes_and_wildcards(self):
        assert movie_service._ilike_pattern("dune") == '"%dune%"'

    def test_comma_stays_inside_the_quoted_value(self):
        # An unquoted comma would split the or() filter into a bogus condition.
        result = movie_service._ilike_pattern("hello,world")
        assert result == '"%hello,world%"'
        assert result.startswith('"') and result.endswith('"')

    def test_parenthesis_is_contained(self):
        result = movie_service._ilike_pattern("movie (2026)")
        assert result == '"%movie (2026)%"'

    def test_percent_is_escaped_as_literal(self):
        # Must reach Postgres as \% so it matches a literal percent sign.
        assert movie_service._ilike_pattern("100%") == '"%100\\\\%%"'

    def test_underscore_is_escaped_as_literal(self):
        assert movie_service._ilike_pattern("a_b") == '"%a\\\\_b%"'

    def test_double_quote_is_escaped(self):
        # A raw " would terminate the quoted value early.
        result = movie_service._ilike_pattern('say "hi"')
        assert result == '"%say \\"hi\\"%"'

    def test_backslash_is_escaped(self):
        assert movie_service._ilike_pattern("a\\b") == '"%a\\\\\\\\b%"'


class TestGetAllMoviesSearch:
    def test_search_applies_or_filter_on_both_titles(self, mock_db):
        mock_db.queue([{"movie_id": MOVIE_ID_1}])
        mock_db.queue([_movie_row(title="Dune")], count=1)
        mock_db.queue([])

        movie_service.get_all_movies(search="dune")

        or_calls = mock_db.calls_to("or_")
        assert len(or_calls) == 1
        expr = or_calls[0][0][0]
        assert expr == 'title.ilike."%dune%",title_de.ilike."%dune%"'

    def test_search_is_skipped_when_blank(self, mock_db):
        mock_db.queue([{"movie_id": MOVIE_ID_1}])
        mock_db.queue([_movie_row()], count=1)
        mock_db.queue([])

        movie_service.get_all_movies(search="   ")

        assert mock_db.calls_to("or_") == []

    def test_search_is_skipped_when_none(self, mock_db):
        mock_db.queue([{"movie_id": MOVIE_ID_1}])
        mock_db.queue([_movie_row()], count=1)
        mock_db.queue([])

        movie_service.get_all_movies(search=None)

        assert mock_db.calls_to("or_") == []

    def test_search_term_is_trimmed(self, mock_db):
        mock_db.queue([{"movie_id": MOVIE_ID_1}])
        mock_db.queue([_movie_row()], count=1)
        mock_db.queue([])

        movie_service.get_all_movies(search="  dune  ")

        expr = mock_db.calls_to("or_")[0][0][0]
        assert expr == 'title.ilike."%dune%",title_de.ilike."%dune%"'

    def test_search_returns_empty_result_set_cleanly(self, mock_db):
        mock_db.queue([{"movie_id": MOVIE_ID_1}])
        mock_db.queue([], count=0)

        result = movie_service.get_all_movies(search="nonexistent")

        assert result["items"] == []
        assert result["total"] == 0

    def test_search_composes_with_playing_today(self, mock_db):
        mock_db.queue([{"movie_id": MOVIE_ID_1}])
        mock_db.queue([_movie_row(title="Dune")], count=1)
        mock_db.queue([{"movie_id": MOVIE_ID_1, "language_version": "OV"}])

        result = movie_service.get_all_movies(playing_today_only=True, search="dune")

        assert mock_db.calls_to("or_")
        assert mock_db.calls_to("in_")
        assert result["items"][0].playing_today is True


# ---------------------------------------------------------------------------
# get_movie_by_id
# ---------------------------------------------------------------------------


class TestGetMovieById:
    def test_returns_none_when_not_found(self, mock_db):
        # 1) movies select → empty
        mock_db.queue([])

        result = movie_service.get_movie_by_id(MOVIE_ID_1)

        assert result is None

    def test_returns_movie_response_when_found(self, mock_db):
        # 1) movies select
        mock_db.queue([_movie_row(title="Dune Part Two")])
        # 2) showtimes today → playing
        mock_db.queue([{"movie_id": MOVIE_ID_1}])

        result = movie_service.get_movie_by_id(MOVIE_ID_1)

        assert result is not None
        assert result.title == "Dune Part Two"
        assert str(result.id) == MOVIE_ID_1

    def test_playing_today_true_when_showtime_exists(self, mock_db):
        mock_db.queue([_movie_row()])
        mock_db.queue([{"movie_id": MOVIE_ID_1}])

        result = movie_service.get_movie_by_id(MOVIE_ID_1)

        assert result.playing_today is True

    def test_playing_today_false_when_no_showtime(self, mock_db):
        mock_db.queue([_movie_row()])
        mock_db.queue([])

        result = movie_service.get_movie_by_id(MOVIE_ID_1)

        assert result.playing_today is False


# ---------------------------------------------------------------------------
# get_showtimes_for_movie
# ---------------------------------------------------------------------------


class TestGetShowtimesForMovie:
    def test_returns_empty_list_when_no_showtimes(self, mock_db):
        mock_db.queue([])

        result = movie_service.get_showtimes_for_movie(MOVIE_ID_1)

        assert result == []

    def test_returns_parsed_showtimes(self, mock_db):
        mock_db.queue([_showtime_row(lang="OV"), _showtime_row(lang="DE")])

        result = movie_service.get_showtimes_for_movie(MOVIE_ID_1)

        assert len(result) == 2
        langs = {st.language_version for st in result}
        assert langs == {"OV", "DE"}

    def test_cinema_fields_parsed(self, mock_db):
        mock_db.queue([_showtime_row()])

        result = movie_service.get_showtimes_for_movie(MOVIE_ID_1)

        assert result[0].cinema_name == "CinemaxX"
        assert result[0].location_hint == "Mitte"

    def test_language_version_filter_passed_to_query(self, mock_db):
        # With mock, we can't inspect the query itself, but we verify that
        # when the DB returns only OV rows, the result contains only OV.
        mock_db.queue([_showtime_row(lang="OV")])

        result = movie_service.get_showtimes_for_movie(
            MOVIE_ID_1, language_version="OV"
        )

        assert all(st.language_version == "OV" for st in result)

    def test_accepts_explicit_date(self, mock_db):
        mock_db.queue([_showtime_row()])

        result = movie_service.get_showtimes_for_movie(
            MOVIE_ID_1, date=date(2026, 5, 28)
        )

        assert len(result) == 1
