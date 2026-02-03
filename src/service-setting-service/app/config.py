from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # Service settings
    service_name: str = "service-setting-service"
    port: int = 8003

    # Cosmos DB settings
    cosmos_db_endpoint: str
    cosmos_db_key: str
    cosmos_db_database: str = "service_management"
    cosmos_db_container: str = "services"

    # Log settings
    log_level: str = "INFO"

    class Config:
        env_file = ".env"
        case_sensitive = False


@lru_cache()
def get_settings() -> Settings:
    return Settings()
