"""
conftest.py — shared fixtures and mock DB infrastructure.

Env vars are set before any app import so that pydantic-settings (Settings())
doesn't raise a validation error during collection.
"""
import os

os.environ.setdefault("SUPABASE_URL", "https://test.supabase.co")
os.environ.setdefault("SUPABASE_ANON_KEY", "test-anon-key")

import pytest
from fastapi.testclient import TestClient
from unittest.mock import MagicMock

from app.main import app


# ---------------------------------------------------------------------------
# Fluent mock database
# ---------------------------------------------------------------------------

class MockQueryBuilder:
    """
    Mimics the Supabase PostgREST fluent query builder.

    Every filter/modifier method (select, eq, gte, …) returns *self* so
    chaining works naturally.  execute() pops the next result from the shared
    queue owned by MockDatabase, so each call in a service function gets its
    own pre-configured response.
    """

    def __init__(self, queue: list):
        self._queue = queue

    # Catch-all: any unknown attribute → a callable that returns self
    def __getattr__(self, name):
        def method(*args, **kwargs):
            return self
        return method

    def execute(self):
        item = self._queue.pop(0) if self._queue else {}
        result = MagicMock()
        result.data = item.get("data", [])
        result.count = item.get("count", 0)
        return result


class MockDatabase:
    """
    Drop-in replacement for the Supabase client used in movie_service.

    Usage in tests:
        mock_db.queue([{"movie_id": "abc"}])   # first execute() returns this
        mock_db.queue([{"id": "abc", ...}], count=1)  # second execute()
    """

    def __init__(self):
        self._results: list[dict] = []

    def table(self, name: str) -> MockQueryBuilder:
        return MockQueryBuilder(self._results)

    def queue(self, data: list, count: int | None = None) -> None:
        """Enqueue the payload for the next execute() call."""
        self._results.append({
            "data": data,
            "count": count if count is not None else len(data),
        })


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture
def mock_db(monkeypatch):
    """Patch movie_service.database with a fresh MockDatabase."""
    db = MockDatabase()
    monkeypatch.setattr("app.services.movie_service.database", db)
    return db


@pytest.fixture
def client():
    """FastAPI TestClient (re-created per test for isolation)."""
    return TestClient(app)
