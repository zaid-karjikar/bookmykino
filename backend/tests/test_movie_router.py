"""
Integration tests for movie_router.py using FastAPI's TestClient.

Service functions are mocked at the module level — we're testing that the
router correctly maps HTTP params to service calls and serialises responses,
not re-testing service logic.
"""
from unittest.mock import patch, MagicMock
from uuid import uuid4
from datetime import datetime, timezone

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.schemas.movie_schema import MovieResponse, ShowtimeResponse

client = TestClient(app)

# ---------------------------------------------------------------------------
# Sample data
# ---------------------------------------------------------------------------

MOVIE_ID = str(uuid4())
SHOWTIME_ID = str(uuid4())
START_TIME = datetime(2026, 5, 27, 14, 30, tzinfo=timezone.utc)


def _movie_response(**overrides):
    defaults = dict(
        id=MOVIE_ID,
        title="Test Movie",
        poster_url=None,
        playing_today=True,
        language_versions=["OV"],
    )
    defaults.update(overrides)
    return MovieResponse(**defaults)


def _showtime_response(**overrides):
    defaults = dict(
        id=SHOWTIME_ID,
        start_time=START_TIME,
        price=12.0,
        booking_url="https://example.com/book",
        cinema_name="CinemaxX",
        location_hint="Mitte",
        language_version="OV",
    )
    defaults.update(overrides)
    return ShowtimeResponse(**defaults)


# ---------------------------------------------------------------------------
# Root
# ---------------------------------------------------------------------------

class TestRoot:
    def test_root_returns_welcome(self):
        resp = client.get("/")
        assert resp.status_code == 200
        assert "message" in resp.json()


# ---------------------------------------------------------------------------
# GET /movies/
# ---------------------------------------------------------------------------

class TestGetMovies:
    def test_returns_200_with_paginated_shape(self):
        payload = {"items": [_movie_response()], "total": 1}
        with patch("app.services.movie_service.get_all_movies", return_value=payload):
            resp = client.get("/movies/")

        assert resp.status_code == 200
        body = resp.json()
        assert "items" in body
        assert "total" in body
        assert body["total"] == 1

    def test_passes_limit_and_offset(self):
        payload = {"items": [], "total": 0}
        with patch("app.services.movie_service.get_all_movies", return_value=payload) as mock_svc:
            client.get("/movies/?limit=10&offset=20")
            mock_svc.assert_called_once_with(
                limit=10, offset=20, playing_today_only=False, language_version=None
            )

    def test_passes_playing_today_flag(self):
        payload = {"items": [], "total": 0}
        with patch("app.services.movie_service.get_all_movies", return_value=payload) as mock_svc:
            client.get("/movies/?playing_today=true")
            _, kwargs = mock_svc.call_args
            assert kwargs["playing_today_only"] is True

    def test_passes_language_version(self):
        payload = {"items": [], "total": 0}
        with patch("app.services.movie_service.get_all_movies", return_value=payload) as mock_svc:
            client.get("/movies/?language_version=OV")
            _, kwargs = mock_svc.call_args
            assert kwargs["language_version"] == "OV"

    def test_movie_fields_serialised_correctly(self):
        payload = {"items": [_movie_response(title="Dune Part Two")], "total": 1}
        with patch("app.services.movie_service.get_all_movies", return_value=payload):
            resp = client.get("/movies/")

        item = resp.json()["items"][0]
        assert item["title"] == "Dune Part Two"
        assert item["playing_today"] is True
        assert "OV" in item["language_versions"]


# ---------------------------------------------------------------------------
# GET /movies/{movie_id}
# ---------------------------------------------------------------------------

class TestGetMovie:
    def test_returns_200_when_found(self):
        with patch("app.services.movie_service.get_movie_by_id", return_value=_movie_response()):
            resp = client.get(f"/movies/{MOVIE_ID}")

        assert resp.status_code == 200
        assert resp.json()["id"] == MOVIE_ID

    def test_returns_404_when_not_found(self):
        with patch("app.services.movie_service.get_movie_by_id", return_value=None):
            resp = client.get(f"/movies/{MOVIE_ID}")

        assert resp.status_code == 404
        assert resp.json()["detail"] == "Movie not found"

    def test_passes_movie_id_to_service(self):
        with patch("app.services.movie_service.get_movie_by_id", return_value=_movie_response()) as mock_svc:
            client.get(f"/movies/{MOVIE_ID}")
            mock_svc.assert_called_once_with(MOVIE_ID)


# ---------------------------------------------------------------------------
# GET /movies/{movie_id}/showtimes
# ---------------------------------------------------------------------------

class TestGetShowtimes:
    def test_returns_200_with_showtime_list(self):
        with patch("app.services.movie_service.get_showtimes_for_movie", return_value=[_showtime_response()]):
            resp = client.get(f"/movies/{MOVIE_ID}/showtimes")

        assert resp.status_code == 200
        assert isinstance(resp.json(), list)
        assert len(resp.json()) == 1

    def test_returns_empty_list_when_no_showtimes(self):
        with patch("app.services.movie_service.get_showtimes_for_movie", return_value=[]):
            resp = client.get(f"/movies/{MOVIE_ID}/showtimes")

        assert resp.status_code == 200
        assert resp.json() == []

    def test_passes_language_version_to_service(self):
        # Router calls get_showtimes_for_movie(movie_id, date, language_version)
        # positionally, so we inspect call_args.args.
        with patch("app.services.movie_service.get_showtimes_for_movie", return_value=[]) as mock_svc:
            client.get(f"/movies/{MOVIE_ID}/showtimes?language_version=OV")
            args, _ = mock_svc.call_args
            assert args[2] == "OV"

    def test_passes_date_to_service(self):
        with patch("app.services.movie_service.get_showtimes_for_movie", return_value=[]) as mock_svc:
            client.get(f"/movies/{MOVIE_ID}/showtimes?date=2026-05-28")
            args, _ = mock_svc.call_args
            assert str(args[1]) == "2026-05-28"

    def test_showtime_fields_serialised_correctly(self):
        with patch("app.services.movie_service.get_showtimes_for_movie", return_value=[_showtime_response()]):
            resp = client.get(f"/movies/{MOVIE_ID}/showtimes")

        st = resp.json()[0]
        assert st["cinema_name"] == "CinemaxX"
        assert st["location_hint"] == "Mitte"
        assert st["language_version"] == "OV"
        assert st["price"] == 12.0
