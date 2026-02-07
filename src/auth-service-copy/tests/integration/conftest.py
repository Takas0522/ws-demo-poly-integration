"""
Integration test configuration and fixtures
"""
import os
import pytest
from typing import Generator
from fastapi.testclient import TestClient
from httpx import AsyncClient

# Test environment variables
TEST_JWT_SECRET = "test-secret-key-for-integration-tests"
TEST_COSMOS_ENDPOINT = os.getenv("COSMOS_ENDPOINT", "")
TEST_COSMOS_KEY = os.getenv("COSMOS_KEY", "")

# Test user credentials
TEST_ADMIN_USER = {
    "user_id": "admin@example.com",
    "password": "password123"
}

TEST_REGULAR_USER = {
    "user_id": "user@example.com",
    "password": "password123"
}


@pytest.fixture
def test_client() -> Generator:
    """
    Create a test client for the FastAPI application
    """
    from app.main import app
    
    with TestClient(app) as client:
        yield client


@pytest.fixture
async def async_test_client() -> Generator:
    """
    Create an async test client for the FastAPI application
    """
    from app.main import app
    
    async with AsyncClient(app=app, base_url="http://test") as client:
        yield client


@pytest.fixture
def admin_token(test_client: TestClient) -> str:
    """
    Get JWT token for admin user
    """
    response = test_client.post(
        "/api/v1/auth/login",
        json=TEST_ADMIN_USER
    )
    
    if response.status_code != 200:
        pytest.skip("Admin user not available in test database")
    
    data = response.json()
    return data.get("access_token")


@pytest.fixture
def regular_token(test_client: TestClient) -> str:
    """
    Get JWT token for regular user
    """
    response = test_client.post(
        "/api/v1/auth/login",
        json=TEST_REGULAR_USER
    )
    
    if response.status_code != 200:
        pytest.skip("Regular user not available in test database")
    
    data = response.json()
    return data.get("access_token")


@pytest.fixture
def auth_headers(admin_token: str) -> dict:
    """
    Get authorization headers with admin token
    """
    return {
        "Authorization": f"Bearer {admin_token}"
    }


def pytest_configure(config):
    """
    Configure pytest with custom markers
    """
    config.addinivalue_line(
        "markers", "integration: mark test as integration test"
    )
    config.addinivalue_line(
        "markers", "slow: mark test as slow running"
    )
