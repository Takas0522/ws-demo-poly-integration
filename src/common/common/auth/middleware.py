"""
認証Middlewareモジュール

FastAPIアプリケーションに認証機能を追加するミドルウェアを提供します。
"""

import logging
from typing import Callable

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response
from fastapi import HTTPException

from common.auth.jwt import decode_access_token

logger = logging.getLogger(__name__)


class JWTAuthenticationMiddleware(BaseHTTPMiddleware):
    """
    FastAPI Middleware for JWT authentication
    
    Functionality:
        - Authorizationヘッダーからトークン抽出
        - トークン検証
        - request.state.user にユーザー情報設定
        - 認証失敗時は 401 エラー
    
    Business Value:
        - 全エンドポイントで自動的に認証チェックが実行され、手動実装の漏れを防止
        - 認証ロジックの変更が全サービスに即座に反映
    """
    
    # 認証不要なパスのリスト
    EXCLUDED_PATHS = [
        "/docs",
        "/redoc",
        "/openapi.json",
        "/health",
        "/api/health",
    ]
    
    async def dispatch(
        self, request: Request, call_next: Callable
    ) -> Response:
        """
        リクエストごとに実行される認証処理
        
        Args:
            request: リクエストオブジェクト
            call_next: 次のミドルウェアまたはエンドポイント
        
        Returns:
            Response: レスポンスオブジェクト
        """
        # 認証不要なパスはスキップ
        if any(request.url.path.startswith(path) for path in self.EXCLUDED_PATHS):
            return await call_next(request)
        
        # Authorizationヘッダー取得
        authorization = request.headers.get("Authorization")
        
        if not authorization:
            logger.warning(
                f"Missing authorization header for {request.url.path}",
                extra={"path": request.url.path, "method": request.method}
            )
            raise HTTPException(
                status_code=401,
                detail="Missing authorization header"
            )
        
        if not authorization.startswith("Bearer "):
            logger.warning(
                f"Invalid authorization format for {request.url.path}",
                extra={"path": request.url.path}
            )
            raise HTTPException(
                status_code=401,
                detail="Invalid authorization header format. Expected 'Bearer <token>'"
            )
        
        # トークン抽出
        token = authorization[7:]  # "Bearer " を除去
        
        # トークン検証
        try:
            payload = decode_access_token(token)
            # ユーザー情報をrequest.stateに保存
            request.state.user = payload
            logger.debug(
                f"User authenticated: {payload.get('user_id')}",
                extra={
                    "user_id": payload.get("user_id"),
                    "tenant_id": payload.get("tenant_id"),
                    "path": request.url.path
                }
            )
        except HTTPException:
            # decode_access_tokenが既にHTTPExceptionを発生させている
            raise
        except Exception as e:
            logger.error(f"Authentication error: {e}", exc_info=True)
            raise HTTPException(
                status_code=401,
                detail="Authentication failed"
            )
        
        # 次のミドルウェアまたはエンドポイントを実行
        response = await call_next(request)
        return response
