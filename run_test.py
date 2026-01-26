#!/usr/bin/env python3
"""Test Service Setting Service APIs."""
import subprocess
import time
import sys

# Start services
print("Starting services...")
subprocess.Popen(
    ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8003"],
    cwd="/workspace/src/auth-service",
    stdout=subprocess.DEVNULL,
    stderr=subprocess.DEVNULL
)
subprocess.Popen(
    ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8004"],
    cwd="/workspace/src/service-setting-service",
    stdout=subprocess.DEVNULL,
    stderr=subprocess.DEVNULL
)

print("Waiting for services to start...")
time.sleep(5)

# Run the test script
print("Running API tests...\n")
result = subprocess.run(["/workspace/test_service_setting.sh"], capture_output=False)
sys.exit(result.returncode)
