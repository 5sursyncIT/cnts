import logging
import secrets

from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

logger = logging.getLogger(__name__)

# Insecure default values that MUST be changed in production
_INSECURE_DEFAULTS = frozenset({
    "dev-only-change-me",
    "dev-admin-token",
    "change-me",
    "secret",
    "password",
})


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="CNTS_", env_file=".env", extra="ignore")

    env: str = "dev"
    log_level: str = "INFO"
    api_title: str = "SGI-CNTS API"
    api_version: str = "0.1.0"

    database_url: str = "postgresql+psycopg://cnts:cnts@localhost:5432/cnts"
    cni_hash_key: str = "dev-only-change-me"
    din_site_code: str = "A0001"
    fractionnement_max_overage_ml: int = 250

    auth_token_secret: str = "dev-only-change-me"
    recovery_codes_secret: str = "dev-only-change-me"
    admin_token: str = "dev-admin-token"

    cors_origins: list[str] = ["http://localhost:3000", "http://localhost:3001"]

    # Rate limiting configuration
    rate_limit_enabled: bool = True
    rate_limit_in_dev: bool = False  # Set to True to enable rate limiting in dev

    @model_validator(mode="after")
    def validate_secrets_in_production(self) -> "Settings":
        """Ensure cryptographic secrets are properly configured in production."""
        is_production = self.env in ("prod", "production", "staging")

        secrets_to_check = {
            "cni_hash_key": self.cni_hash_key,
            "auth_token_secret": self.auth_token_secret,
            "recovery_codes_secret": self.recovery_codes_secret,
            "admin_token": self.admin_token,
        }

        insecure_secrets = [
            name for name, value in secrets_to_check.items()
            if value.lower() in _INSECURE_DEFAULTS or len(value) < 32
        ]

        if insecure_secrets:
            if is_production:
                raise ValueError(
                    f"CRITICAL: Insecure secrets detected in production environment! "
                    f"The following secrets must be changed: {', '.join(insecure_secrets)}. "
                    f"Generate secure values with: python -c \"import secrets; print(secrets.token_hex(32))\""
                )
            else:
                logger.warning(
                    "⚠️  SECURITY WARNING: Using insecure default secrets (%s). "
                    "Set proper values via environment variables before deploying to production!",
                    ", ".join(insecure_secrets),
                )

        return self


settings = Settings()
