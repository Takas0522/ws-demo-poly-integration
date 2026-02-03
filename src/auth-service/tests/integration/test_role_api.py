"""
Integration tests for Role Management API
"""
import pytest
from fastapi.testclient import TestClient


@pytest.mark.integration
class TestRoleManagementAPI:
    """Test role management endpoints"""

    def test_get_roles_list(self, test_client: TestClient, auth_headers: dict):
        """Test getting role list"""
        response = test_client.get(
            "/api/v1/roles",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "data" in data
        assert isinstance(data["data"], list)
        
        if len(data["data"]) > 0:
            role = data["data"][0]
            assert "id" in role
            assert "service_id" in role
            assert "service_name" in role
            assert "role_code" in role
            assert "role_name" in role

    def test_get_roles_by_service(self, test_client: TestClient, auth_headers: dict):
        """Test getting roles filtered by service"""
        response = test_client.get(
            "/api/v1/roles?service_id=test-service-id",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "data" in data

    def test_get_roles_unauthorized(self, test_client: TestClient):
        """Test getting roles without authentication"""
        response = test_client.get("/api/v1/roles")
        
        assert response.status_code == 401

    def test_assign_role_to_user(self, test_client: TestClient, auth_headers: dict):
        """Test assigning a role to a user"""
        # Get users and roles first
        users_response = test_client.get(
            "/api/v1/users",
            headers=auth_headers
        )
        
        roles_response = test_client.get(
            "/api/v1/roles",
            headers=auth_headers
        )
        
        if users_response.status_code == 200 and roles_response.status_code == 200:
            users = users_response.json().get("data", [])
            roles = roles_response.json().get("data", [])
            
            if len(users) > 0 and len(roles) > 0:
                user_id = users[0]["id"]
                role_id = roles[0]["id"]
                
                response = test_client.post(
                    f"/api/v1/users/{user_id}/roles",
                    json={"role_id": role_id},
                    headers=auth_headers
                )
                
                # May succeed, conflict, or forbidden based on state and permissions
                assert response.status_code in [201, 403, 409]
                
                if response.status_code == 201:
                    data = response.json()
                    assert "user_id" in data
                    assert "role_id" in data

    def test_remove_role_from_user(self, test_client: TestClient, auth_headers: dict):
        """Test removing a role from a user"""
        # Get users first
        users_response = test_client.get(
            "/api/v1/users",
            headers=auth_headers
        )
        
        if users_response.status_code == 200:
            users = users_response.json().get("data", [])
            
            if len(users) > 0:
                user_id = users[0]["id"]
                
                # Get user's roles
                roles_response = test_client.get(
                    f"/api/v1/users/{user_id}/roles",
                    headers=auth_headers
                )
                
                if roles_response.status_code == 200:
                    user_roles = roles_response.json().get("roles", [])
                    
                    if len(user_roles) > 0:
                        role_id = user_roles[0]["id"]
                        
                        response = test_client.delete(
                            f"/api/v1/users/{user_id}/roles/{role_id}",
                            headers=auth_headers
                        )
                        
                        # May succeed or be forbidden based on permissions
                        assert response.status_code in [204, 403]

    def test_assign_invalid_role(self, test_client: TestClient, auth_headers: dict):
        """Test assigning an invalid role"""
        users_response = test_client.get(
            "/api/v1/users",
            headers=auth_headers
        )
        
        if users_response.status_code == 200:
            users = users_response.json().get("data", [])
            
            if len(users) > 0:
                user_id = users[0]["id"]
                
                response = test_client.post(
                    f"/api/v1/users/{user_id}/roles",
                    json={"role_id": "non-existent-role-id"},
                    headers=auth_headers
                )
                
                # Should return error
                assert response.status_code in [400, 403, 404]
