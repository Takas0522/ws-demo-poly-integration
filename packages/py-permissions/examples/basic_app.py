"""
Example FastAPI application demonstrating permission system usage.

This example shows how to:
1. Set up authentication middleware
2. Protect routes with permissions
3. Use role-based access control
4. Implement admin overrides
5. Check permissions programmatically

To run this example:
    pip install fastapi uvicorn python-jose[cryptography] passlib[bcrypt]
    python examples/basic_app.py

Then visit:
    http://localhost:8000/docs for the interactive API documentation
"""

from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from fastapi import FastAPI, Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthCredentials
from pydantic import BaseModel
import uvicorn

print("Note: This is a minimal example. In production, use proper imports and setup.")
print("For full functionality, ensure the permissions package is installed.")
