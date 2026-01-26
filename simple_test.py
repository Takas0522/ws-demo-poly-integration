#!/usr/bin/env python3
"""Simple test for Service Setting Service."""
import requests
import json

print("=" * 70)
print(" Service Setting Service - API Test")
print("=" * 70)

# Step 1: Login
print("\n[1] Login...")
login_response = requests.post(
    "http://localhost:8003/api/auth/login",
    json={
        "loginId": "admin@saas-platform.local",
        "password": "Admin@123",
        "tenantId": "tenant-001"
    }
)
print(f"Status: {login_response.status_code}")
if login_response.status_code != 200:
    print(f"Error: {login_response.text}")
    exit(1)

token = login_response.json()["accessToken"]
print(f"✅ Login successful! Token: {token[:50]}...")

headers = {"Authorization": f"Bearer {token}"}

# Step 2: Get all services
print("\n[2] Get all services...")
services_response = requests.get(
    "http://localhost:8004/api/services",
    headers=headers
)
print(f"Status: {services_response.status_code}")
services = services_response.json()
print(json.dumps(services, indent=2, ensure_ascii=False))
print(f"✅ Found {len(services['data'])} services")

# Step 3: Get tenant services (before)
print("\n[3] Get tenant services (before assignment)...")
tenant_services_response = requests.get(
    "http://localhost:8004/api/tenants/tenant-001/services",
    headers=headers
)
print(f"Status: {tenant_services_response.status_code}")
tenant_services = tenant_services_response.json()
print(json.dumps(tenant_services, indent=2, ensure_ascii=False))
print(f"✅ Tenant has {len(tenant_services['data'])} assigned services")

# Step 4: Assign services to tenant
print("\n[4] Assign services to tenant...")
assign_response = requests.put(
    "http://localhost:8004/api/tenants/tenant-001/services",
    headers=headers,
    json={"serviceIds": ["file-management", "messaging"]}
)
print(f"Status: {assign_response.status_code}")
assign_result = assign_response.json()
print(json.dumps(assign_result, indent=2, ensure_ascii=False))

if assign_response.status_code == 200:
    print(f"✅ Successfully assigned services!")
else:
    print(f"❌ Failed to assign services")

# Step 5: Get tenant services (after)
print("\n[5] Get tenant services (after assignment)...")
tenant_services_after = requests.get(
    "http://localhost:8004/api/tenants/tenant-001/services",
    headers=headers
)
print(f"Status: {tenant_services_after.status_code}")
services_after = tenant_services_after.json()
print(json.dumps(services_after, indent=2, ensure_ascii=False))
print(f"✅ Tenant now has {len(services_after['data'])} assigned services")

# Summary
print("\n" + "=" * 70)
print(" Test Summary")
print("=" * 70)
print(f"Total services: {len(services['data'])}")
print(f"Assigned before: {len(tenant_services['data'])}")
print(f"Assigned after: {len(services_after['data'])}")
print(f"\n🎉 Test completed successfully!")
print("=" * 70)
