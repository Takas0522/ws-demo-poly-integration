"""
リクエストID生成Middlewareモジュール

各リクエストに一意のIDを付与するミドルウェアを提供します。
"""

import uuid
import logging
from typing import Callable

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

logger = logging.getLogger(__name__)


class RequestIDMiddleware(BaseHTTPMiddleware):
    """
    各リクエストに一意のIDを付与
    
    Functionality:
        - X-Request-IDヘッダーの生成
        - request.state.request_id に設定
        - レスポンスヘッダーに付与
    
    Business Value:
        - 分散システムでのリクエスト追跡が可能
        - ログ分析時に特定リクエストの全ログを抽出可能
    """
    
    async def dispatch(
        self, request: Request, call_next: Callable
    ) -> Response:
        """
        リクエストごとに実行されるID生成処理
        
        Args:
            request: リクエストオブジェクト
            call_next: 次のミドルウェアまたはエンドポイント
        
        Returns:
            Response: レスポンスオブジェクト
        """
        # 既存のX-Request-IDがあればそれを使用、なければ生成
        request_id = request.headers.get("X-Request-ID")
        
        if not request_id:
            request_id = str(uuid.uuid4())
            logger.debug(f"Generated new request ID: {request_id}")
        else:
            logger.debug(f"Using existing request ID: {request_id}")
        
        # request.stateに保存
        request.state.request_id = request_id
        
        # 次のミドルウェアまたはエンドポイントを実行
        response = await call_next(request)
        
        # レスポンスヘッダーにX-Request-IDを付与
        response.headers["X-Request-ID"] = request_id
        
        return response
