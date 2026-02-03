"""
Integration tests for Authentication API
"""
import pytest
from fastapi.testclient import TestClient


@pytest.mark.integration
class TestAuthenticationAPI:
    """Test authentication endpoints"""

    def test_health_check(self, test_client: TestClient):
        """Test health check endpoint"""
        response = test_client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "service" in data

    def test_login_success(self, test_client: TestClient):
        """Test successful login"""
        response = test_client.post(
            "/api/v1/auth/login",
            json={
                "user_id": "admin@example.com",
                "password": "password123"
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "access_token" in data
        assert "token_type" in data
        assert data["token_type"] == "Bearer"
        assert "expires_in" in data
        assert "user" in data
        
        # Verify user information
        user = data["user"]
        assert "id" in user
        assert "user_id" in user
        assert user["user_id"] == "admin@example.com"
        assert "name" in user
        assert "tenant_id" in user
        assert "roles" in user

    def test_login_invalid_credentials(self, test_client: TestClient):
        """Test login with invalid credentials"""
        response = test_client.post(
            "/api/v1/auth/login",
            json={
                "user_id": "invalid@example.com",
                "password": "wrongpassword"
            }
        )
        
        assert response.status_code == 401
        data = response.json()
        assert "error" in data
        assert data["error"]["code"] == "UNAUTHORIZED"

    def test_login_missing_fields(self, test_client: TestClient):
        """Test login with missing fields"""
        response = test_client.post(
            "/api/v1/auth/login",
            json={
                "user_id": "admin@example.com"
            }
        )
        
        assert response.status_code == 422  # Validation error

    def test_verify_token_valid(self, test_client: TestClient, admin_token: str):
        """Test token verification with valid token"""
        response = test_client.post(
            "/api/v1/auth/verify",
            json={
                "token": admin_token
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["valid"] is True
        assert "payload" in data
        assert "user_id" in data["payload"]
        assert "tenant_id" in data["payload"]

    def test_verify_token_invalid(self, test_client: TestClient):
        """Test token verification with invalid token"""
        response = test_client.post(
            "/api/v1/auth/verify",
            json={
                "token": "invalid.token.here"
            }
        )
        
        assert response.status_code == 401
        data = response.json()
        assert "error" in data
        assert data["error"]["code"] == "UNAUTHORIZED"

    def test_get_current_user(self, test_client: TestClient, auth_headers: dict):
        """Test getting current user information"""
        response = test_client.get(
            "/api/v1/auth/me",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify user information
        assert "id" in data
        assert "user_id" in data
        assert "name" in data
        assert "tenant_id" in data
        assert "is_active" in data
        assert "created_at" in data
        assert "roles" in data

    def test_get_current_user_unauthorized(self, test_client: TestClient):
        """Test getting current user without authentication"""
        response = test_client.get("/api/v1/auth/me")
        
        assert response.status_code == 401
        data = response.json()
        assert "error" in data

    def test_get_current_user_invalid_token(self, test_client: TestClient):
        """Test getting current user with invalid token"""
        response = test_client.get(
            "/api/v1/auth/me",
            headers={"Authorization": "Bearer invalid.token.here"}
        )
        
        assert response.status_code == 401
        data = response.json()
        assert "error" in data
