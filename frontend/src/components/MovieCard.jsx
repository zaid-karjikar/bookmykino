export default function MovieCard({ movie, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        cursor: "pointer",
        borderRadius: 4,
        overflow: "hidden",
        position: "relative",
        aspectRatio: "2/3",
        backgroundColor: "var(--bg-card)",
        transition: "transform 0.2s ease, box-shadow 0.2s ease",
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = "scale(1.05)";
        e.currentTarget.style.boxShadow = "0 8px 32px rgba(0,0,0,0.6)";
        e.currentTarget.style.zIndex = "10";
        e.currentTarget.querySelector("[data-overlay]").style.opacity = "1";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = "scale(1)";
        e.currentTarget.style.boxShadow = "none";
        e.currentTarget.style.zIndex = "1";
        e.currentTarget.querySelector("[data-overlay]").style.opacity = "0";
      }}
    >
      {movie.poster_url ? (
        <img
          src={movie.poster_url}
          alt={movie.title}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
      ) : (
        <div style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 12,
          textAlign: "center",
        }}>
          <span style={{
            fontFamily: "var(--font-display)",
            fontSize: 14,
            letterSpacing: 1,
            color: "var(--text-muted)",
            lineHeight: 1.3,
          }}>
            {movie.title}
          </span>
        </div>
      )}

      {/* Hover overlay with title */}
      <div data-overlay="" style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        padding: "32px 10px 10px",
        background: "linear-gradient(to top, rgba(0,0,0,0.9), transparent)",
        opacity: 0,
        transition: "opacity 0.2s ease",
      }}>
        <p style={{
          fontSize: 12,
          fontWeight: 500,
          color: "#fff",
          lineHeight: 1.3,
        }}>
          {movie.title}
        </p>
      </div>
    </div>
  );
}