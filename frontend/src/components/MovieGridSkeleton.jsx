const PLACEHOLDER_COUNT = 18;

export default function MovieGridSkeleton({ count = PLACEHOLDER_COUNT }) {
  return (
    <div className="movie-grid" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton" />
      ))}
    </div>
  );
}
