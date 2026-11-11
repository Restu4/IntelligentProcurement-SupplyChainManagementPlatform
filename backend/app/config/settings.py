from typing import List
import json

from pydantic_settings import BaseSettings, SettingsConfigDict

# Values that must never reach production.
INSECURE_JWT_SECRETS = {
    "",
    "change-this-to-a-secure-random-secret-key",
    "your-super-secret-random-key-here",
    "secret",
    "changeme",
}


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Runtime
    ENVIRONMENT: str = "development"

    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:///./smartprocure.db"
    DATABASE_ECHO: bool = False

    # JWT
    JWT_SECRET_KEY: str = "change-this-to-a-secure-random-secret-key"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # Google Gemini
    GEMINI_API_KEY: str | None = None

    # CORS: comma-separated list or a JSON array. Use "*" only in development.
    CORS_ORIGINS: str = "http://localhost:3000,http://127.0.0.1:3000"

    # ChromaDB
    CHROMA_PERSIST_DIR: str = "./vectordb"

    # Upload
    UPLOAD_DIR: str = "./uploads"
    MAX_UPLOAD_SIZE_MB: int = 20
    MAX_CHUNKS_PER_DOCUMENT: int = 500

    # LLM
    GEMINI_MODEL: str = "gemini-2.0-flash"

    # RAG
    RAG_TOP_K: int = 5
    CONFIDENCE_THRESHOLD: float = 0.70

    # Embedding
    EMBEDDING_MODEL_NAME: str = "all-MiniLM-L6-v2"

    # Logging
    LOG_LEVEL: str = "INFO"

    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT.strip().lower() in {"production", "prod"}

    @property
    def cors_origins(self) -> List[str]:
        raw = (self.CORS_ORIGINS or "").strip()
        if not raw:
            return []
        if raw.startswith("["):
            try:
                parsed = json.loads(raw)
                if isinstance(parsed, list):
                    return [str(item).strip() for item in parsed if str(item).strip()]
            except json.JSONDecodeError:
                pass
        return [item.strip() for item in raw.split(",") if item.strip()]

    @property
    def uses_insecure_jwt_secret(self) -> bool:
        return self.JWT_SECRET_KEY in INSECURE_JWT_SECRETS or len(self.JWT_SECRET_KEY) < 32

    def validate_runtime(self) -> None:
        """Fail fast on unsafe production configuration."""
        if not self.is_production:
            return

        problems: list[str] = []
        if self.uses_insecure_jwt_secret:
            problems.append(
                "JWT_SECRET_KEY must be a unique random value of at least 32 characters."
            )
        if not self.GEMINI_API_KEY:
            problems.append("GEMINI_API_KEY is required in production.")
        if not self.cors_origins or "*" in self.cors_origins:
            problems.append("CORS_ORIGINS must list explicit origins in production.")

        if problems:
            raise RuntimeError(
                "Invalid production configuration: " + " ".join(problems)
            )


settings = Settings()
