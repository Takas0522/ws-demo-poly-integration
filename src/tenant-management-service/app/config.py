from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # Service settings
    service_name: str = "tenant-management-service"
    port: int = 8002

    # Cosmos DB settings
    cosmos_db_endpoint: str
    cosmos_db_key: str
    cosmos_db_database: str = "tenant_management"
    cosmos_db_container: str = "tenants"

    # Log settings
    log_level: str = "INFO"

    class Config:
        env_file = ".env"
        case_sensitive = False


@lru_cache()
def get_settings() -> Settings:
    return Settings()
