from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):

    SUPABASE_URL: str
    SUPABASE_ANON_KEY: str

    REDIS_URL: str = "redis://localhost:6379/0"
    MOVIES_CACHE_TTL_SECONDS: int = 30

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
