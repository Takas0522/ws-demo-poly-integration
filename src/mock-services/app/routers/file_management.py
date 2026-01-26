"""
File Management Service Router
"""
from fastapi import APIRouter

router = APIRouter()

@router.get("/api/roles")
async def get_roles():
    """
    Get available roles for file-management service
    """
    return {
        "data": {
            "roles": [
                {"id": "admin", "name": "管理者"},
                {"id": "editor", "name": "編集者"},
                {"id": "viewer", "name": "閲覧者"}
            ]
        }
    }
