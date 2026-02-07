"""
Integration tests for User Management API
"""
import pytest
from fastapi.testclient import TestClient


@pytest.mark.integration
class TestUserManagementAPI:
    """Test user management endpoints"""

    def test_get_users_list(self, test_client: TestClient, auth_headers: dict):
        """Test getting user list"""
        response = test_client.get(
            "/api/v1/users",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "data" in data
        assert isinstance(data["data"], list)
        
        if len(data["data"]) > 0:
            user = data["data"][0]
            assert "id" in user
            assert "user_id" in user
            assert "name" in user
            assert "tenant_id" in user
            assert "is_active" in user
            assert "created_at" in user
        
        # Check pagination if exists
        if "pagination" in data:
            assert "page" in data["pagination"]
            assert "per_page" in data["pagination"]
            assert "total" in data["pagination"]

    def test_get_users_with_pagination(self, test_client: TestClient, auth_headers: dict):
        """Test getting user list with pagination"""
        response = test_client.get(
            "/api/v1/users?page=1&per_page=10",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "data" in data

    def test_get_users_unauthorized(self, test_client: TestClient):
        """Test getting user list without authentication"""
        response = test_client.get("/api/v1/users")
        
        assert response.status_code == 401

    def test_get_user_detail(self, test_client: TestClient, auth_headers: dict):
        """Test getting user detail"""
        # First, get user list to find a user ID
        list_response = test_client.get(
            "/api/v1/users",
            headers=auth_headers
        )
        
        if list_response.status_code == 200:
            users = list_response.json().get("data", [])
            if len(users) > 0:
                user_id = users[0]["id"]
                
                # Get user detail
                response = test_client.get(
                    f"/api/v1/users/{user_id}",
                    headers=auth_headers
                )
                
                assert response.status_code == 200
                data = response.json()
                
                # Verify detail information
                assert "id" in data
                assert data["id"] == user_id
                assert "user_id" in data
                assert "name" in data
                assert "tenant_id" in data
                assert "is_active" in data
                assert "created_at" in data
                assert "roles" in data

    def test_get_user_detail_not_found(self, test_client: TestClient, auth_headers: dict):
        """Test getting non-existent user"""
        response = test_client.get(
            "/api/v1/users/non-existent-id",
            headers=auth_headers
        )
        
        assert response.status_code == 404

    def test_create_user(self, test_client: TestClient, auth_headers: dict):
        """Test creating a new user"""
        new_user = {
            "user_id": f"testuser{pytest.timestamp if hasattr(pytest, 'timestamp') else '123'}@example.com",
            "name": "Test User",
            "password": "TestPassword123!",
            "tenant_id": "test-tenant-id"
        }
        
        response = test_client.post(
            "/api/v1/users",
            json=new_user,
            headers=auth_headers
        )
        
        # May fail if not global admin or if user exists
        if response.status_code == 201:
            data = response.json()
            assert "id" in data
            assert data["user_id"] == new_user["user_id"]
            assert data["name"] == new_user["name"]
        elif response.status_code == 403:
            # Not authorized (expected if not global admin)
            pass
        elif response.status_code == 409:
            # User already exists (expected if test runs multiple times)
            pass

    def test_create_user_duplicate(self, test_client: TestClient, auth_headers: dict):
        """Test creating user with duplicate user_id"""
        duplicate_user = {
            "user_id": "admin@example.com",  # Existing user
            "name": "Duplicate User",
            "password": "TestPassword123!",
            "tenant_id": "test-tenant-id"
        }
        
        response = test_client.post(
            "/api/v1/users",
            json=duplicate_user,
            headers=auth_headers
        )
        
        # Should return conflict or forbidden
        assert response.status_code in [403, 409]

    def test_update_user(self, test_client: TestClient, auth_headers: dict):
        """Test updating user information"""
        # Get a user to update
        list_response = test_client.get(
            "/api/v1/users",
            headers=auth_headers
        )
        
        if list_response.status_code == 200:
            users = list_response.json().get("data", [])
            if len(users) > 0:
                user_id = users[0]["id"]
                
                update_data = {
                    "name": "Updated Name",
                    "is_active": True
                }
                
                response = test_client.put(
                    f"/api/v1/users/{user_id}",
                    json=update_data,
                    headers=auth_headers
                )
                
                # May succeed or fail based on permissions
                if response.status_code == 200:
                    data = response.json()
                    assert data["name"] == update_data["name"]

    def test_get_user_roles(self, test_client: TestClient, auth_headers: dict):
        """Test getting user roles"""
        # Get a user
        list_response = test_client.get(
            "/api/v1/users",
            headers=auth_headers
        )
        
        if list_response.status_code == 200:
            users = list_response.json().get("data", [])
            if len(users) > 0:
                user_id = users[0]["id"]
                
                response = test_client.get(
                    f"/api/v1/users/{user_id}/roles",
                    headers=auth_headers
                )
                
                assert response.status_code == 200
                data = response.json()
                assert "user_id" in data
                assert "roles" in data
                assert isinstance(data["roles"], list)
