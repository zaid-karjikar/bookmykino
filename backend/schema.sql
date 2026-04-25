-- movies
CREATE TABLE movies (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title      text NOT NULL UNIQUE,
    title_de   text,
    poster_url text
);

-- cinemas
CREATE TABLE cinemas (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name          text NOT NULL UNIQUE,
    location_hint text
);

-- showtimes
CREATE TABLE showtimes (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    movie_id    uuid REFERENCES movies(id) ON DELETE CASCADE,
    cinema_id   uuid REFERENCES cinemas(id) ON DELETE CASCADE,
    start_time  timestamptz NOT NULL,
    price       numeric(6,2) NOT NULL,
    booking_url text UNIQUE
);