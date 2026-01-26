"""
Backup Service Router
"""
from fastapi import APIRouter

router = APIRouter()

@router.get("/api/roles")
async def get_roles():
    """
    Get available roles for backup service
    """
    return {
        "data": {
            "roles": [
                {"id": "admin", "name": "管理者"},
                {"id": "executor", "name": "実行者"},
                {"id": "viewer", "name": "閲覧者"}
            ]
        }
    }
