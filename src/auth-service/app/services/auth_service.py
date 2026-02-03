"""認証サービス"""
from typing import Optional, Dict
from datetime import datetime
from ..repositories.user_repository import UserRepository
from ..repositories.role_repository import RoleRepository
from ..utils.password import verify_password
from ..utils.jwt import create_jwt_token
from ..config import get_settings

settings = get_settings()


class AuthService:
    """認証ビジネスロジック"""
    
    def __init__(self):
        self.user_repo = UserRepository()
        self.role_repo = RoleRepository()
    
    async def login(self, user_id: str, password: str) -> Optional[Dict]:
        """ログイン処理"""
        # ユーザー取得
        user = await self.user_repo.get_by_user_id(user_id)
        if not user:
            return None
        
        # アクティブチェック
        if not user.is_active:
            return None
        
        # パスワード検証
        if not verify_password(password, user.password_hash):
            return None
        
        # ユーザーロール取得
        user_roles = await self.user_repo.get_user_roles(user.id)
        
        # ロール詳細取得
        roles = []
        for user_role in user_roles:
            role = await self.role_repo.get_by_id(user_role.role_id)
            if role:
                roles.append({
                    "role_id": role.id,
                    "role_code": role.role_code,
                    "role_name": role.role_name,
                    "service_id": role.service_id,
                    "service_name": role.service_name,
                    "permissions": role.permissions
                })
        
        # 最終ログイン日時更新
        user.last_login_at = datetime.utcnow()
        await self.user_repo.update(user)
        
        # JWTペイロード作成
        payload = {
            "user_id": user.user_id,
            "id": user.id,
            "name": user.name,
            "tenant_id": user.tenant_id,
            "roles": roles
        }
        
        # JWT生成
        token = create_jwt_token(payload)
        
        return {
            "access_token": token,
            "token_type": "Bearer",
            "expires_in": settings.jwt_expiration_hours * 3600,
            "user": {
                "id": user.id,
                "user_id": user.user_id,
                "name": user.name,
                "tenant_id": user.tenant_id,
                "roles": roles
            }
        }
