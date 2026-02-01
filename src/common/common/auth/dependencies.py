"""
依存注入ヘルパーモジュール

FastAPIの依存注入機能を使用した認証・認可ヘルパーを提供します。
"""

import logging
from typing import List, Dict, Any
from functools import wraps

from fastapi import Depends, Request, HTTPException

logger = logging.getLogger(__name__)


async def get_current_user(request: Request) -> Dict[str, Any]:
    """
    FastAPI Dependencyで現在のユーザーを取得
    
    Usage:
        @router.get("/profile")
        async def get_profile(current_user: dict = Depends(get_current_user)):
            return current_user
    
    Args:
        request: リクエストオブジェクト
    
    Returns:
        dict: ユーザー情報（user_id, tenant_id, roles等）
    
    Raises:
        HTTPException(401): ユーザー情報が存在しない場合
    
    Business Value:
        - エンドポイントごとに認証処理を記述する必要がなく、開発速度が向上
    """
    if not hasattr(request.state, "user"):
        logger.error("User information not found in request state")
        raise HTTPException(
            status_code=401,
            detail="Authentication required"
        )
    
    return request.state.user


def require_role(service_id: str, required_roles: List[str]):
    """
    ロールベース認可デコレータ
    
    Args:
        service_id: サービスID（"tenant-management"等）
        required_roles: 必要なロール一覧（["管理者", "全体管理者"]等）
    
    Usage:
        @router.post("/tenants")
        @require_role("tenant-management", ["管理者"])
        async def create_tenant(current_user: dict = Depends(get_current_user)):
            pass
    
    Raises:
        HTTPException(403): 必要なロールを持っていない場合
    
    Business Value:
        - 権限チェックの実装ミスを防止し、セキュリティを強化
        - 権限要件が明示的になり、コードレビューが容易
    """
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, current_user: Dict[str, Any] = Depends(get_current_user), **kwargs):
            # ユーザーのロール情報を取得
            user_roles = current_user.get("roles", [])
            
            # 対象サービスのロールをフィルタ
            service_roles = [
                role.get("role_name") 
                for role in user_roles 
                if role.get("service_id") == service_id
            ]
            
            # 必要なロールを持っているかチェック
            if not any(role in required_roles for role in service_roles):
                logger.warning(
                    f"Access denied: User {current_user.get('user_id')} "
                    f"does not have required roles {required_roles} for service {service_id}",
                    extra={
                        "user_id": current_user.get("user_id"),
                        "tenant_id": current_user.get("tenant_id"),
                        "service_id": service_id,
                        "required_roles": required_roles,
                        "user_roles": service_roles
                    }
                )
                raise HTTPException(
                    status_code=403,
                    detail=f"Requires one of the following roles: {', '.join(required_roles)}"
                )
            
            logger.debug(
                f"User {current_user.get('user_id')} authorized for {service_id}",
                extra={
                    "user_id": current_user.get("user_id"),
                    "service_id": service_id,
                    "user_roles": service_roles
                }
            )
            
            return await func(*args, current_user=current_user, **kwargs)
        
        return wrapper
    return decorator
