import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getMovie, getMovies, getShowtimes } from './api';

function mockFetchOnce(body, { ok = true } = {}) {
  globalThis.fetch = vi.fn().mockResolvedValue({
    ok,
    json: () => Promise.resolve(body),
  });
}

describe('api', () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getMovies', () => {
    it('requests the movies list with no query string when called with no args', async () => {
      mockFetchOnce({ items: [], total: 0 });

      await getMovies();

      expect(fetch).toHaveBeenCalledWith('http://localhost:8000/movies/');
    });

    it('serializes filters into the query string', async () => {
      mockFetchOnce({ items: [], total: 0 });

      await getMovies({
        limit: 20,
        offset: 40,
        playingToday: true,
        languageVersion: 'OV',
        search: 'dune',
      });

      const url = new URL(fetch.mock.calls[0][0]);
      expect(url.pathname).toBe('/movies/');
      expect(url.searchParams.get('limit')).toBe('20');
      expect(url.searchParams.get('offset')).toBe('40');
      expect(url.searchParams.get('playing_today')).toBe('true');
      expect(url.searchParams.get('language_version')).toBe('OV');
      expect(url.searchParams.get('search')).toBe('dune');
    });

    it('omits offset when it is 0', async () => {
      mockFetchOnce({ items: [], total: 0 });

      await getMovies({ offset: 0 });

      const url = new URL(fetch.mock.calls[0][0]);
      expect(url.searchParams.has('offset')).toBe(false);
    });

    it('throws when the response is not ok', async () => {
      mockFetchOnce({}, { ok: false });

      await expect(getMovies()).rejects.toThrow('Failed to fetch movies');
    });
  });

  describe('getMovie', () => {
    it('requests a single movie by id', async () => {
      mockFetchOnce({ id: 'abc', title: 'Dune' });

      const movie = await getMovie('abc');

      expect(fetch).toHaveBeenCalledWith('http://localhost:8000/movies/abc');
      expect(movie).toEqual({ id: 'abc', title: 'Dune' });
    });

    it('throws when the response is not ok', async () => {
      mockFetchOnce({}, { ok: false });

      await expect(getMovie('abc')).rejects.toThrow('Failed to fetch movie');
    });
  });

  describe('getShowtimes', () => {
    it('requests showtimes for a movie with no filters', async () => {
      mockFetchOnce([]);

      await getShowtimes('abc');

      expect(fetch).toHaveBeenCalledWith('http://localhost:8000/movies/abc/showtimes');
    });

    it('serializes date and language_version filters', async () => {
      mockFetchOnce([]);

      await getShowtimes('abc', '2026-05-27', 'OV');

      const url = new URL(fetch.mock.calls[0][0]);
      expect(url.searchParams.get('date')).toBe('2026-05-27');
      expect(url.searchParams.get('language_version')).toBe('OV');
    });

    it('throws when the response is not ok', async () => {
      mockFetchOnce([], { ok: false });

      await expect(getShowtimes('abc')).rejects.toThrow('Failed to fetch showtimes');
    });
  });
});
