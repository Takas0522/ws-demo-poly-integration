"""
認証モジュールのテスト
"""

import os
import pytest
from unittest.mock import patch
from datetime import timedelta
import jwt as pyjwt
from fastapi import HTTPException, Request
from fastapi.testclient import TestClient

# テスト用に環境変数を設定
os.environ["JWT_SECRET_KEY"] = "test-secret-key-for-unit-tests-only"

from common.auth.jwt import create_access_token, decode_access_token, SECRET_KEY, ALGORITHM
from common.auth.middleware import JWTAuthenticationMiddleware
from common.auth.dependencies import get_current_user, require_role


def test_create_access_token():
    """JWTトークン生成が成功すること"""
    data = {
        "user_id": "user_123",
        "tenant_id": "tenant_456",
        "roles": [{"service_id": "tenant-management", "role_name": "管理者"}]
    }
    
    token = create_access_token(data)
    
    assert isinstance(token, str)
    assert len(token) > 0
    
    # トークンをデコードして検証
    decoded = pyjwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    assert decoded["user_id"] == "user_123"
    assert decoded["tenant_id"] == "tenant_456"
    assert "exp" in decoded
    assert "iat" in decoded


def test_create_access_token_with_custom_expiration():
    """カスタム有効期限でトークン生成が成功すること"""
    data = {"user_id": "user_123", "tenant_id": "tenant_456"}
    expires_delta = timedelta(minutes=30)
    
    token = create_access_token(data, expires_delta)
    
    assert isinstance(token, str)
    decoded = pyjwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    assert decoded["user_id"] == "user_123"


def test_create_access_token_empty_data():
    """空のデータでValueErrorが発生すること"""
    with pytest.raises(ValueError, match="Token data cannot be empty"):
        create_access_token({})


def test_create_access_token_missing_user_id():
    """user_idがないとValueErrorが発生すること"""
    data = {"tenant_id": "tenant_456"}
    
    with pytest.raises(ValueError, match="must include user_id and tenant_id"):
        create_access_token(data)


def test_create_access_token_missing_tenant_id():
    """tenant_idがないとValueErrorが発生すること"""
    data = {"user_id": "user_123"}
    
    with pytest.raises(ValueError, match="must include user_id and tenant_id"):
        create_access_token(data)


def test_decode_valid_token():
    """有効なトークンがデコードできること"""
    data = {
        "user_id": "user_123",
        "tenant_id": "tenant_456",
        "roles": []
    }
    token = create_access_token(data)
    
    decoded = decode_access_token(token)
    
    assert decoded["user_id"] == "user_123"
    assert decoded["tenant_id"] == "tenant_456"


def test_decode_expired_token():
    """期限切れトークンでHTTPException(401)が発生すること"""
    data = {"user_id": "user_123", "tenant_id": "tenant_456"}
    # すぐに期限切れになるトークン
    token = create_access_token(data, expires_delta=timedelta(seconds=-1))
    
    with pytest.raises(HTTPException) as exc_info:
        decode_access_token(token)
    
    assert exc_info.value.status_code == 401
    assert "expired" in exc_info.value.detail.lower()


def test_decode_invalid_token():
    """無効なトークンでHTTPException(401)が発生すること"""
    invalid_token = "invalid.token.here"
    
    with pytest.raises(HTTPException) as exc_info:
        decode_access_token(invalid_token)
    
    assert exc_info.value.status_code == 401


def test_decode_empty_token():
    """空のトークンでValueErrorが発生すること"""
    with pytest.raises(ValueError, match="Token cannot be empty"):
        decode_access_token("")


def test_decode_token_with_wrong_signature():
    """署名が無効なトークンでHTTPException(401)が発生すること"""
    # 異なる秘密鍵で署名
    wrong_token = pyjwt.encode(
        {"user_id": "user_123", "tenant_id": "tenant_456"},
        "wrong_secret_key",
        algorithm=ALGORITHM
    )
    
    with pytest.raises(HTTPException) as exc_info:
        decode_access_token(wrong_token)
    
    assert exc_info.value.status_code == 401


class TestJWTAuthenticationMiddleware:
    """認証ミドルウェアのテスト"""
    
    def test_authentication_successful(self):
        """正常な認証が成功すること"""
        from fastapi import FastAPI
        
        app = FastAPI()
        app.add_middleware(JWTAuthenticationMiddleware)
        
        @app.get("/api/test")
        async def test_endpoint(request: Request):
            return {"user_id": request.state.user.get("user_id")}
        
        client = TestClient(app)
        
        # トークン生成
        token = create_access_token({"user_id": "user_123", "tenant_id": "tenant_456"})
        
        response = client.get(
            "/api/test",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 200
        assert response.json()["user_id"] == "user_123"
    
    def test_authentication_missing_header(self):
        """Authorizationヘッダーなしで401エラー"""
        from fastapi import FastAPI
        
        app = FastAPI()
        app.add_middleware(JWTAuthenticationMiddleware)
        
        @app.get("/api/test")
        async def test_endpoint():
            return {"message": "success"}
        
        client = TestClient(app)
        
        response = client.get("/api/test")
        
        assert response.status_code == 401
        assert "authorization header" in response.json()["detail"].lower()
    
    def test_authentication_invalid_format(self):
        """無効な形式のAuthorizationヘッダーで401エラー"""
        from fastapi import FastAPI
        
        app = FastAPI()
        app.add_middleware(JWTAuthenticationMiddleware)
        
        @app.get("/api/test")
        async def test_endpoint():
            return {"message": "success"}
        
        client = TestClient(app)
        
        response = client.get(
            "/api/test",
            headers={"Authorization": "InvalidFormat token123"}
        )
        
        assert response.status_code == 401
        assert "bearer" in response.json()["detail"].lower()
    
    def test_authentication_invalid_token(self):
        """無効なトークンで401エラー"""
        from fastapi import FastAPI
        
        app = FastAPI()
        app.add_middleware(JWTAuthenticationMiddleware)
        
        @app.get("/api/test")
        async def test_endpoint():
            return {"message": "success"}
        
        client = TestClient(app)
        
        response = client.get(
            "/api/test",
            headers={"Authorization": "Bearer invalid.token.here"}
        )
        
        assert response.status_code == 401
    
    def test_authentication_expired_token(self):
        """期限切れトークンで401エラー"""
        from fastapi import FastAPI
        
        app = FastAPI()
        app.add_middleware(JWTAuthenticationMiddleware)
        
        @app.get("/api/test")
        async def test_endpoint():
            return {"message": "success"}
        
        client = TestClient(app)
        
        # 期限切れトークン
        token = create_access_token(
            {"user_id": "user_123", "tenant_id": "tenant_456"},
            expires_delta=timedelta(seconds=-1)
        )
        
        response = client.get(
            "/api/test",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 401
    
    def test_excluded_paths_no_auth(self):
        """除外パスは認証なしでアクセス可能"""
        from fastapi import FastAPI
        
        app = FastAPI()
        app.add_middleware(JWTAuthenticationMiddleware)
        
        @app.get("/health")
        async def health():
            return {"status": "healthy"}
        
        @app.get("/docs")
        async def docs():
            return {"message": "docs"}
        
        client = TestClient(app)
        
        # 認証ヘッダーなしでアクセス
        response = client.get("/health")
        assert response.status_code == 200
        
        response = client.get("/docs")
        assert response.status_code == 200


class TestGetCurrentUser:
    """get_current_user依存性注入のテスト"""
    
    @pytest.mark.asyncio
    async def test_get_current_user_success(self):
        """ユーザー情報が取得できること"""
        from fastapi import Request
        
        # モックリクエスト作成
        request = Request({"type": "http", "headers": []})
        request.state.user = {
            "user_id": "user_123",
            "tenant_id": "tenant_456",
            "roles": []
        }
        
        user = await get_current_user(request)
        
        assert user["user_id"] == "user_123"
        assert user["tenant_id"] == "tenant_456"
    
    @pytest.mark.asyncio
    async def test_get_current_user_not_authenticated(self):
        """認証情報がない場合に401エラー"""
        from fastapi import Request
        
        request = Request({"type": "http", "headers": []})
        # request.state.userを設定しない
        
        with pytest.raises(HTTPException) as exc_info:
            await get_current_user(request)
        
        assert exc_info.value.status_code == 401


class TestRequireRole:
    """require_roleデコレータのテスト"""
    
    @pytest.mark.asyncio
    async def test_require_role_authorized(self):
        """必要なロールを持つユーザーがアクセス可能"""
        @require_role("tenant-management", ["管理者"])
        async def protected_endpoint(current_user: dict):
            return {"message": "success"}
        
        user = {
            "user_id": "user_123",
            "tenant_id": "tenant_456",
            "roles": [
                {"service_id": "tenant-management", "role_name": "管理者"}
            ]
        }
        
        result = await protected_endpoint(current_user=user)
        assert result["message"] == "success"
    
    @pytest.mark.asyncio
    async def test_require_role_unauthorized(self):
        """必要なロールを持たないユーザーが403エラー"""
        @require_role("tenant-management", ["管理者"])
        async def protected_endpoint(current_user: dict):
            return {"message": "success"}
        
        user = {
            "user_id": "user_123",
            "tenant_id": "tenant_456",
            "roles": [
                {"service_id": "tenant-management", "role_name": "閲覧者"}
            ]
        }
        
        with pytest.raises(HTTPException) as exc_info:
            await protected_endpoint(current_user=user)
        
        assert exc_info.value.status_code == 403
    
    @pytest.mark.asyncio
    async def test_require_role_different_service(self):
        """別サービスのロールでは403エラー"""
        @require_role("tenant-management", ["管理者"])
        async def protected_endpoint(current_user: dict):
            return {"message": "success"}
        
        user = {
            "user_id": "user_123",
            "tenant_id": "tenant_456",
            "roles": [
                {"service_id": "other-service", "role_name": "管理者"}
            ]
        }
        
        with pytest.raises(HTTPException) as exc_info:
            await protected_endpoint(current_user=user)
        
        assert exc_info.value.status_code == 403
    
    @pytest.mark.asyncio
    async def test_require_role_multiple_roles(self):
        """複数のロールのいずれかを持つ場合にアクセス可能"""
        @require_role("tenant-management", ["管理者", "全体管理者"])
        async def protected_endpoint(current_user: dict):
            return {"message": "success"}
        
        user = {
            "user_id": "user_123",
            "tenant_id": "tenant_456",
            "roles": [
                {"service_id": "tenant-management", "role_name": "全体管理者"}
            ]
        }
        
        result = await protected_endpoint(current_user=user)
        assert result["message"] == "success"

