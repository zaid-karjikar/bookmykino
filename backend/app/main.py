import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers.movie_router import router as movie_router

app = FastAPI(title="BookMyKino API", version="1.0")

_default_origins = "http://localhost:5173,http://127.0.0.1:5173"
_allowed_origins = os.getenv("ALLOWED_ORIGINS", _default_origins).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(movie_router)


@app.get("/")
def root():
    return {"message": "Welcome to the BookMyKino API!"}
