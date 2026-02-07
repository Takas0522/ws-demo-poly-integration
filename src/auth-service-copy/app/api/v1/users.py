"""ユーザー管理エンドポイント"""
from fastapi import APIRouter, HTTPException, status, Depends, Query
from typing import List
from ...schemas.user import (
    UserCreate,
    UserUpdate,
    UserResponse,
    UserListResponse
)
from ...services.user_service import UserService
from ...utils.dependencies import get_current_user, require_role

router = APIRouter(prefix="/users", tags=["users"])


@router.get("", response_model=UserListResponse)
async def get_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    current_user: dict = Depends(get_current_user)
):
    """ユーザー一覧取得"""
    user_service = UserService()
    users = await user_service.get_all_users(skip=skip, limit=limit)
    
    return UserListResponse(users=users, total=len(users))


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: str,
    current_user: dict = Depends(get_current_user)
):
    """ユーザー詳細取得"""
    user_service = UserService()
    user = await user_service.get_user_by_id(user_id)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return user


@router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    user_create: UserCreate,
    current_user: dict = Depends(require_role(["global_admin"]))
):
    """ユーザー作成"""
    user_service = UserService()
    user = await user_service.create_user(user_create)
    
    return user


@router.put("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: str,
    user_update: UserUpdate,
    current_user: dict = Depends(require_role(["global_admin"]))
):
    """ユーザー更新"""
    user_service = UserService()
    user = await user_service.update_user(user_id, user_update)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return user


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: str,
    current_user: dict = Depends(require_role(["global_admin"]))
):
    """ユーザー削除"""
    user_service = UserService()
    success = await user_service.delete_user(user_id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return None
