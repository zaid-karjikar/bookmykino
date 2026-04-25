export default function MovieCard({ movie, onClick }) {
  return (
    <div onClick={onClick} style={{ cursor: "pointer", width: 120 }}>
        {movie.poster_url ? (
            <img 
                src={movie.poster_url} 
                alt={movie.title} 
                style={{ width: "100%", aspectRatio: "2/3", objectFit: "cover", borderRadius: 8 }}
            />
        ) : (
            <div style={{
                width: "100%",
                aspectRatio: "2/3",
                backgroundColor: "#ccc",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 8,
            }}>
            No Poster
            </div>
        )}
        <p style={{ margin: "6px 0 0", fontSize: 13, textAlign: "center" }}>{movie.title}</p>
    </div>
  );
}