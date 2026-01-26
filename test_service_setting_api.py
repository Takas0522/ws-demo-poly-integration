#!/usr/bin/env python3
"""Test script for Service Setting Service APIs."""

import json
import sys
import requests
import time

# API endpoints
AUTH_SERVICE_URL = "http://localhost:8003"
SERVICE_SETTING_URL = "http://localhost:8004"

def print_section(title: str) -> None:
    """Print a section header."""
    print(f"\n{'=' * 60}")
    print(f"  {title}")
    print('=' * 60)

def print_response(response: requests.Response) -> None:
    """Print response details."""
    print(f"Status Code: {response.status_code}")
    print(f"Response Body:")
    try:
        print(json.dumps(response.json(), indent=2, ensure_ascii=False))
    except:
        print(response.text)

def get_auth_token() -> str:
    """Get authentication token."""
    print_section("1. Login to get access token")
    
    login_data = {
        "loginId": "admin@example.com",
        "password": "password123",
        "tenantId": "tenant-001"
    }
    
    try:
        response = requests.post(
            f"{AUTH_SERVICE_URL}/api/auth/login",
            json=login_data,
            headers={"Content-Type": "application/json"}
        )
        print_response(response)
        
        if response.status_code == 200:
            token = response.json()["access_token"]
            print(f"\n✅ Login successful! Token obtained.")
            return token
        else:
            print(f"\n❌ Login failed!")
            sys.exit(1)
    except Exception as e:
        print(f"❌ Error connecting to auth service: {e}")
        print("Make sure auth service is running on port 8003")
        sys.exit(1)

def test_get_all_services(token: str) -> None:
    """Test GET /api/services endpoint."""
    print_section("2. Get All Services (GET /api/services)")
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.get(
            f"{SERVICE_SETTING_URL}/api/services",
            headers=headers
        )
        print_response(response)
        
        if response.status_code == 200:
            services = response.json()["data"]
            print(f"\n✅ Found {len(services)} services")
            for service in services:
                print(f"  - {service['id']}: {service['name']}")
        else:
            print(f"\n❌ Failed to get services")
    except Exception as e:
        print(f"❌ Error: {e}")
        print("Make sure service-setting-service is running on port 8004")

def test_get_tenant_services(token: str, tenant_id: str) -> None:
    """Test GET /api/tenants/{tenant_id}/services endpoint."""
    print_section(f"3. Get Tenant Services (GET /api/tenants/{tenant_id}/services)")
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.get(
            f"{SERVICE_SETTING_URL}/api/tenants/{tenant_id}/services",
            headers=headers
        )
        print_response(response)
        
        if response.status_code == 200:
            services = response.json()["data"]
            print(f"\n✅ Tenant {tenant_id} has {len(services)} assigned services")
            for service in services:
                print(f"  - {service['serviceId']}: {service['serviceName']}")
        else:
            print(f"\n⚠️  Tenant may not have services assigned yet")
    except Exception as e:
        print(f"❌ Error: {e}")

def test_update_tenant_services(token: str, tenant_id: str) -> None:
    """Test PUT /api/tenants/{tenant_id}/services endpoint."""
    print_section(f"4. Update Tenant Services (PUT /api/tenants/{tenant_id}/services)")
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    # Assign 2 services to the tenant
    update_data = {
        "serviceIds": ["file-management", "messaging"]
    }
    
    try:
        response = requests.put(
            f"{SERVICE_SETTING_URL}/api/tenants/{tenant_id}/services",
            json=update_data,
            headers=headers
        )
        print_response(response)
        
        if response.status_code == 200:
            print(f"\n✅ Successfully updated services for tenant {tenant_id}")
        else:
            print(f"\n❌ Failed to update tenant services")
    except Exception as e:
        print(f"❌ Error: {e}")

def test_verify_tenant_services_updated(token: str, tenant_id: str) -> None:
    """Verify that tenant services were updated."""
    print_section(f"5. Verify Update (GET /api/tenants/{tenant_id}/services)")
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.get(
            f"{SERVICE_SETTING_URL}/api/tenants/{tenant_id}/services",
            headers=headers
        )
        print_response(response)
        
        if response.status_code == 200:
            services = response.json()["data"]
            print(f"\n✅ Verification successful!")
            print(f"Tenant {tenant_id} now has {len(services)} assigned services:")
            for service in services:
                print(f"  - {service['serviceId']}: {service['serviceName']}")
        else:
            print(f"\n❌ Failed to verify update")
    except Exception as e:
        print(f"❌ Error: {e}")

def test_health_check() -> None:
    """Test health check endpoint."""
    print_section("0. Health Check")
    
    try:
        response = requests.get(f"{SERVICE_SETTING_URL}/health")
        print_response(response)
        
        if response.status_code == 200:
            print(f"\n✅ Service is healthy!")
        else:
            print(f"\n⚠️  Service health check returned: {response.status_code}")
    except Exception as e:
        print(f"❌ Error: {e}")
        print("Make sure service-setting-service is running on port 8004")
        sys.exit(1)

def main():
    """Run all tests."""
    print("\n" + "="*60)
    print("  Service Setting Service API Test")
    print("="*60)
    
    # Health check first
    test_health_check()
    
    # Get auth token
    token = get_auth_token()
    
    # Test all endpoints
    test_get_all_services(token)
    
    tenant_id = "tenant-001"
    test_get_tenant_services(token, tenant_id)
    test_update_tenant_services(token, tenant_id)
    test_verify_tenant_services_updated(token, tenant_id)
    
    print("\n" + "="*60)
    print("  ✅ All tests completed!")
    print("="*60 + "\n")

if __name__ == "__main__":
    main()
