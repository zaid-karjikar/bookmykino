export default function MovieCard({ movie, onClick }) {
  return (
    <button type="button" className="movie-card" onClick={onClick}>
      {movie.poster_url ? (
        <img
          className="movie-card__poster"
          src={movie.poster_url}
          alt={movie.title}
          loading="lazy"
        />
      ) : (
        <span className="movie-card__fallback">{movie.title}</span>
      )}

      {/* Title overlay — revealed on hover, always shown on touch devices.
          Purely decorative: it repeats text the button's accessible name
          (from the poster's alt or the fallback span) already provides. */}
      <span className="movie-card__overlay" aria-hidden="true">
        {movie.title}
      </span>
    </button>
  );
}
