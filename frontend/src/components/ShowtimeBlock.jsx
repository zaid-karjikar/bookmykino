export default function ShowtimeBlock({ showtime }) {
    const startTime = new Date(showtime.start_time).toLocaleTimeString("de-DE", {
        hour: "2-digit",
        minute: "2-digit",
    });

    return (
        <div>
            <p>{startTime}</p>
            <p>{showtime.cinema_name}</p>
            {showtime.location_hint && <p>{showtime.location_hint}</p>}
            {showtime.booking_url && (
                <a href={showtime.booking_url} target="_blank" rel="noreferrer">
                    Book
                </a>
            )}
        </div>
    );
}