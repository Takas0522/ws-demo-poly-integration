"""
ミドルウェアのテスト
"""

import pytest
from fastapi import FastAPI, HTTPException
from fastapi.testclient import TestClient
from pydantic import BaseModel, ValidationError

from common.middleware.error_handler import ErrorHandlerMiddleware
from common.middleware.request_id import RequestIDMiddleware
from common.middleware.cors import setup_cors


class SampleRequest(BaseModel):
    """テスト用リクエストモデル"""
    name: str
    age: int


def create_test_app():
    """テスト用アプリケーション作成"""
    app = FastAPI()
    
    # ミドルウェアを追加
    app.add_middleware(RequestIDMiddleware)
    app.add_middleware(ErrorHandlerMiddleware)
    
    @app.get("/")
    async def root():
        return {"message": "Hello World"}
    
    @app.get("/error")
    async def trigger_error():
        raise HTTPException(status_code=400, detail="Bad Request Test")
    
    @app.get("/server-error")
    async def trigger_server_error():
        raise Exception("Unexpected error")
    
    @app.post("/validate")
    async def validate_data(data: SampleRequest):
        return {"name": data.name, "age": data.age}
    
    @app.get("/request-id")
    async def get_request_id(request):
        return {"request_id": getattr(request.state, "request_id", None)}
    
    return app


class TestErrorHandlerMiddleware:
    """ErrorHandlerMiddlewareのテスト"""
    
    def test_successful_request(self):
        """正常なリクエストが成功すること"""
        app = create_test_app()
        client = TestClient(app, raise_server_exceptions=False)
        
        response = client.get("/")
        
        assert response.status_code == 200
        assert response.json() == {"message": "Hello World"}
    
    def test_http_exception_handling(self):
        """HTTPExceptionが標準フォーマットで返却されること"""
        app = create_test_app()
        client = TestClient(app, raise_server_exceptions=False)
        
        response = client.get("/error")
        
        assert response.status_code == 400
        assert "error" in response.json()
        error = response.json()["error"]
        assert error["code"] == "HTTP_EXCEPTION"
        assert error["message"] == "Bad Request Test"
        assert "request_id" in error
        assert "timestamp" in error
    
    def test_validation_error_handling(self):
        """ValidationErrorが標準フォーマットで返却されること"""
        app = create_test_app()
        client = TestClient(app, raise_server_exceptions=False)
        
        # 不正なデータ（ageが文字列）
        response = client.post("/validate", json={"name": "John", "age": "invalid"})
        
        assert response.status_code == 400
        assert "error" in response.json()
        error = response.json()["error"]
        assert error["code"] == "VALIDATION_ERROR"
        assert error["message"] == "Request validation failed"
        assert "details" in error
        assert "request_id" in error
    
    def test_validation_error_missing_field(self):
        """必須フィールド欠落時にValidationErrorが発生すること"""
        app = create_test_app()
        client = TestClient(app, raise_server_exceptions=False)
        
        # nameフィールドが欠落
        response = client.post("/validate", json={"age": 25})
        
        assert response.status_code == 400
        error = response.json()["error"]
        assert error["code"] == "VALIDATION_ERROR"
    
    def test_unexpected_error_handling(self):
        """予期しないエラーが500エラーとして返却されること"""
        app = create_test_app()
        client = TestClient(app, raise_server_exceptions=False)
        
        response = client.get("/server-error")
        
        assert response.status_code == 500
        assert "error" in response.json()
        error = response.json()["error"]
        assert error["code"] == "INTERNAL_SERVER_ERROR"
        assert error["message"] == "An unexpected error occurred"
        assert "request_id" in error
    
    def test_error_response_includes_timestamp(self):
        """エラーレスポンスにタイムスタンプが含まれること"""
        app = create_test_app()
        client = TestClient(app, raise_server_exceptions=False)
        
        response = client.get("/error")
        
        error = response.json()["error"]
        assert "timestamp" in error
        # ISO 8601形式
        assert "T" in error["timestamp"]


class TestRequestIDMiddleware:
    """RequestIDMiddlewareのテスト"""
    
    def test_request_id_generation(self):
        """リクエストIDが生成されること"""
        app = create_test_app()
        client = TestClient(app, raise_server_exceptions=False)
        
        response = client.get("/")
        
        # レスポンスヘッダーにX-Request-IDが含まれること
        assert "X-Request-ID" in response.headers
        request_id = response.headers["X-Request-ID"]
        assert len(request_id) > 0
    
    def test_request_id_unique(self):
        """各リクエストで異なるリクエストIDが生成されること"""
        app = create_test_app()
        client = TestClient(app, raise_server_exceptions=False)
        
        response1 = client.get("/")
        response2 = client.get("/")
        
        request_id1 = response1.headers["X-Request-ID"]
        request_id2 = response2.headers["X-Request-ID"]
        
        assert request_id1 != request_id2
    
    def test_request_id_preserved_in_error(self):
        """エラー時にもリクエストIDが保持されること"""
        app = create_test_app()
        client = TestClient(app, raise_server_exceptions=False)
        
        response = client.get("/error")
        
        # レスポンスヘッダーとエラーレスポンスの両方にリクエストIDが含まれること
        assert "X-Request-ID" in response.headers
        error = response.json()["error"]
        assert error["request_id"] == response.headers["X-Request-ID"]
    
    def test_request_id_format(self):
        """リクエストIDがUUID形式であること"""
        app = create_test_app()
        client = TestClient(app, raise_server_exceptions=False)
        
        response = client.get("/")
        request_id = response.headers["X-Request-ID"]
        
        # UUID形式（ハイフン含む）
        parts = request_id.split("-")
        assert len(parts) == 5


class TestCORSMiddleware:
    """CORS設定のテスト"""
    
    def test_cors_headers_present(self):
        """CORSヘッダーが設定されること"""
        app = FastAPI()
        setup_cors(app, allowed_origins=["http://localhost:3000"])
        
        @app.get("/")
        async def root():
            return {"message": "Hello"}
        
        client = TestClient(app, raise_server_exceptions=False)
        
        # Preflightリクエスト
        response = client.options(
            "/",
            headers={
                "Origin": "http://localhost:3000",
                "Access-Control-Request-Method": "GET"
            }
        )
        
        assert response.status_code == 200
        assert "access-control-allow-origin" in response.headers
    
    def test_cors_allows_configured_origin(self):
        """設定されたオリジンが許可されること"""
        app = FastAPI()
        setup_cors(app, allow_origins=["http://localhost:3000"])
        
        @app.get("/")
        async def root():
            return {"message": "Hello"}
        
        client = TestClient(app, raise_server_exceptions=False)
        
        response = client.get(
            "/",
            headers={"Origin": "http://localhost:3000"}
        )
        
        assert response.status_code == 200
        assert "access-control-allow-origin" in response.headers
        assert response.headers["access-control-allow-origin"] == "http://localhost:3000"
    
    def test_cors_wildcard(self):
        """ワイルドカードが機能すること"""
        app = FastAPI()
        setup_cors(app, allowed_origins=["*"])
        
        @app.get("/")
        async def root():
            return {"message": "Hello"}
        
        client = TestClient(app, raise_server_exceptions=False)
        
        response = client.get(
            "/",
            headers={"Origin": "http://example.com"}
        )
        
        assert response.status_code == 200
        assert "access-control-allow-origin" in response.headers


class TestMiddlewareIntegration:
    """ミドルウェアの統合テスト"""
    
    def test_multiple_middleware_work_together(self):
        """複数のミドルウェアが連携して動作すること"""
        app = create_test_app()
        setup_cors(app, allow_origins=["*"])
        client = TestClient(app, raise_server_exceptions=False)
        
        response = client.get(
            "/",
            headers={"Origin": "http://localhost:3000"}
        )
        
        # RequestIDとCORSヘッダーの両方が存在すること
        assert "X-Request-ID" in response.headers
        assert "access-control-allow-origin" in response.headers
        assert response.status_code == 200
    
    def test_error_with_all_middleware(self):
        """エラー時に全ミドルウェアが正常に動作すること"""
        app = create_test_app()
        setup_cors(app, allow_origins=["*"])
        client = TestClient(app, raise_server_exceptions=False)
        
        response = client.get(
            "/error",
            headers={"Origin": "http://localhost:3000"}
        )
        
        # エラーレスポンス、リクエストID、CORSヘッダーの全てが存在すること
        assert response.status_code == 400
        assert "X-Request-ID" in response.headers
        assert "access-control-allow-origin" in response.headers
        assert "error" in response.json()
        
        error = response.json()["error"]
        assert error["request_id"] == response.headers["X-Request-ID"]
