from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Core
    app_name: str = "LearnWise AI API"
    app_env: str = "development"
    api_prefix: str = "/api"

    # CORS / Origins
    frontend_origin: str = "http://localhost:5173"
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"  # backward compat

    # Database
    database_url: str = "sqlite:///./learnwise.db"

    # Supabase
    supabase_url: str = ""
    supabase_publishable_key: str = ""
    supabase_service_role_key: str = ""

    # Groq (primary LLM)
    groq_api_key: str = ""
    groq_model: str = ""
    groq_base_url: str = "https://api.groq.com/openai/v1"
    llm_timeout_seconds: int = 45
    max_questions_per_request: int = 10
    max_csv_size_mb: int = 10

    # Legacy LLM settings (kept for backward compat)
    llm_api_key: str = ""
    llm_base_url: str = "https://api.openai.com/v1"
    llm_model: str = ""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @model_validator(mode="after")
    def validate_groq(self) -> "Settings":
        if self.groq_api_key and not self.groq_model:
            raise ValueError(
                "GROQ_MODEL must be set when GROQ_API_KEY is configured. "
                "Example: GROQ_MODEL=llama3-8b-8192"
            )
        return self

    @property
    def origins(self) -> list[str]:
        """Merge frontend_origin and legacy cors_origins, deduplicated."""
        seen: set[str] = set()
        result: list[str] = []
        candidates = [self.frontend_origin] + [
            x.strip() for x in self.cors_origins.split(",") if x.strip()
        ]
        for origin in candidates:
            if origin and origin not in seen:
                seen.add(origin)
                result.append(origin)
        return result

    @property
    def is_demo_mode(self) -> bool:
        """True when no Supabase URL is configured — auth checks are skipped."""
        return not self.supabase_url.strip()


settings = Settings()
