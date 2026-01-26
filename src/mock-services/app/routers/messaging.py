"""
Messaging Service Router
"""
from fastapi import APIRouter

router = APIRouter()

@router.get("/api/roles")
async def get_roles():
    """
    Get available roles for messaging service
    """
    return {
        "data": {
            "roles": [
                {"id": "admin", "name": "管理者"},
                {"id": "sender", "name": "送信者"},
                {"id": "viewer", "name": "閲覧者"}
            ]
        }
    }
