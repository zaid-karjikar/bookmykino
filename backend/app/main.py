from fastapi import FastAPI
from app.routers.movie_router import router as movie_router

app = FastAPI(title="BookMyKino API", version="1.0")
app.include_router(movie_router)


@app.get("/")
def root():
    return {"message": "Welcome to the BookMyKino API!"}
