"""
Pure unit tests for movie_schema.py — no DB, no network.
"""
from uuid import uuid4
from datetime import datetime, timezone

import pytest

from app.schemas.movie_schema import ShowtimeResponse


SHOWTIME_ID = str(uuid4())
START_TIME = "2026-05-27T14:30:00+02:00"


class TestShowtimeResponseFromDatabase:
    def _base_row(self, **overrides):
        row = {
            "id": SHOWTIME_ID,
            "start_time": START_TIME,
            "price": 12.50,
            "booking_url": "https://example.com/book",
            "language_version": "OV",
            "cinemas": {"name": "CinemaxX Berlin", "location_hint": "Potsdamer Platz"},
        }
        row.update(overrides)
        return row

    def test_full_row_parsed_correctly(self):
        st = ShowtimeResponse.from_database(self._base_row())

        assert str(st.id) == SHOWTIME_ID
        assert st.price == 12.50
        assert st.booking_url == "https://example.com/book"
        assert st.language_version == "OV"
        assert st.cinema_name == "CinemaxX Berlin"
        assert st.location_hint == "Potsdamer Platz"

    def test_cinema_name_and_hint_extracted_from_nested_dict(self):
        st = ShowtimeResponse.from_database(self._base_row(
            cinemas={"name": "UCI Multiplex", "location_hint": "East Side"}
        ))
        assert st.cinema_name == "UCI Multiplex"
        assert st.location_hint == "East Side"

    def test_missing_cinema_key_yields_none_fields(self):
        row = self._base_row()
        del row["cinemas"]
        st = ShowtimeResponse.from_database(row)
        assert st.cinema_name is None
        assert st.location_hint is None

    def test_empty_cinema_dict_yields_none_fields(self):
        st = ShowtimeResponse.from_database(self._base_row(cinemas={}))
        assert st.cinema_name is None
        assert st.location_hint is None

    def test_nullable_price(self):
        st = ShowtimeResponse.from_database(self._base_row(price=None))
        assert st.price is None

    def test_nullable_booking_url(self):
        st = ShowtimeResponse.from_database(self._base_row(booking_url=None))
        assert st.booking_url is None

    def test_nullable_language_version(self):
        st = ShowtimeResponse.from_database(self._base_row(language_version=None))
        assert st.language_version is None
