import logging

import redis

from app.core.config import settings

logger = logging.getLogger(__name__)


class Cache:
    """Redis cache-aside client.

    A Redis outage must never break a request: connection and command errors
    are caught and treated as a cache miss, with a short timeout so a dead
    Redis doesn't stall requests waiting to fail.
    """

    def __init__(self, url: str):
        self._client = redis.Redis.from_url(
            url, socket_connect_timeout=0.25, socket_timeout=0.25
        )

    def get(self, key: str) -> str | None:
        try:
            value = self._client.get(key)
        except redis.RedisError:
            logger.warning("cache get failed for key=%s", key, exc_info=True)
            return None
        return value.decode() if value is not None else None

    def set(self, key: str, value: str, ttl: int) -> None:
        try:
            self._client.set(key, value, ex=ttl)
        except redis.RedisError:
            logger.warning("cache set failed for key=%s", key, exc_info=True)


cache = Cache(settings.REDIS_URL)
