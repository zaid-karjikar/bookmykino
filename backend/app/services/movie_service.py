from app.database.db import database
from app.schemas.schemas import ShowtimeResponse


def get_all_movies():
    return database.table("movies").select("id, title, poster_url").execute().data


def get_showtimes_for_movie(movie_id):
    data = (
        database.table("showtimes")
        .select("id, start_time, price, booking_url, cinemas(name, location_hint)")
        .eq("movie_id", movie_id)
        .order("start_time")
        .execute()
        .data
    )
    return [ShowtimeResponse.from_database(row) for row in data]
