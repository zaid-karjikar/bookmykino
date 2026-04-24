export default function MovieCard({ movie, onClick}) {
    return (
        <div onClick={onClick} style={{ cursor: "pointer"}}>
            {movie.poster_url ? (
                <img src={movie.poster_url} alt={movie.title} width={200} />
            ) : (
                <div style={{
                    width: 200,
                    height: 300,
                    backgroundColor: "#ccc",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                }}>
                    <p>No poster available</p>
                </div>
            )}
            <p>{movie.title}</p>
        </div>
    )
}