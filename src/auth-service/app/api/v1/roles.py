"""ロール管理エンドポイント"""
from fastapi import APIRouter, HTTPException, status, Depends
from ...schemas.role import RoleListResponse, RoleResponse, UserRoleAssignRequest
from ...repositories.role_repository import RoleRepository
from ...services.user_service import UserService
from ...utils.dependencies import get_current_user

router = APIRouter(prefix="/roles", tags=["roles"])


@router.get("", response_model=RoleListResponse)
async def get_roles(
    service_id: str = None,
    current_user: dict = Depends(get_current_user)
):
    """ロール一覧取得"""
    role_repo = RoleRepository()
    
    if service_id:
        roles = await role_repo.get_by_service_id(service_id)
    else:
        roles = await role_repo.get_all()
    
    role_responses = [
        RoleResponse(
            id=role.id,
            service_id=role.service_id,
            service_name=role.service_name,
            role_code=role.role_code,
            role_name=role.role_name,
            description=role.description,
            permissions=role.permissions
        )
        for role in roles
    ]
    
    return RoleListResponse(roles=role_responses, total=len(role_responses))


@router.post("/assign", status_code=status.HTTP_201_CREATED)
async def assign_role(
    request: UserRoleAssignRequest,
    current_user: dict = Depends(get_current_user)
):
    """ユーザーにロール割り当て"""
    user_service = UserService()
    
    success = await user_service.assign_role_to_user(
        user_id=request.user_id,
        role_id=request.role_id,
        service_id=request.service_id,
        assigned_by=current_user.get("user_id", "system")
    )
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to assign role"
        )
    
    return {"message": "Role assigned successfully"}
