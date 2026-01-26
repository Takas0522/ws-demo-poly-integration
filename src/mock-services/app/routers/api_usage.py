"""
API Usage Service Router
"""
from fastapi import APIRouter

router = APIRouter()

@router.get("/api/roles")
async def get_roles():
    """
    Get available roles for api-usage service
    """
    return {
        "data": {
            "roles": [
                {"id": "admin", "name": "管理者"},
                {"id": "user", "name": "利用者"},
                {"id": "viewer", "name": "閲覧者"}
            ]
        }
    }
