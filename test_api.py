#!/usr/bin/env python3
"""Test script to verify service-setting-service API."""
import requests
import json

BASE_URL = "http://localhost:8004"

def test_root():
    """Test root endpoint."""
    print("Testing root endpoint...")
    response = requests.get(f"{BASE_URL}/")
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    print()

def test_health():
    """Test health endpoint."""
    print("Testing health endpoint...")
    response = requests.get(f"{BASE_URL}/health")
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    print()

def test_docs():
    """Test docs endpoint."""
    print("Testing docs endpoint...")
    response = requests.get(f"{BASE_URL}/docs")
    print(f"Status: {response.status_code}")
    print(f"Content-Type: {response.headers.get('content-type')}")
    print()

if __name__ == "__main__":
    import time
    print("Waiting for service to start...")
    time.sleep(3)
    
    try:
        test_root()
        test_health()
        test_docs()
        print("✅ All API tests passed!")
    except Exception as e:
        print(f"❌ Test failed: {e}")
