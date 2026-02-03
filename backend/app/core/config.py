from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="CNTS_", env_file=".env", extra="ignore")

    env: str = "dev"
    log_level: str = "INFO"
    api_title: str = "SGI-CNTS API"
    api_version: str = "0.1.0"

    database_url: str = "postgresql+psycopg://cnts:cnts@localhost:5432/cnts"
    cni_hash_key: str = "dev-only-change-me"
    din_site_code: str = "CNTS"
    fractionnement_max_overage_ml: int = 250

    auth_token_secret: str = "dev-only-change-me"
    recovery_codes_secret: str = "dev-only-change-me"
    admin_token: str = "dev-admin-token"

    cors_origins: list[str] = ["http://localhost:3000", "http://localhost:3001"]


settings = Settings()
