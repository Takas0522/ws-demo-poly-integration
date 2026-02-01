"""
エラーハンドリングMiddlewareモジュール

全ての例外を標準フォーマットで返却するミドルウェアを提供します。
"""

import logging
import traceback
from typing import Callable
from datetime import datetime

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response, JSONResponse
from fastapi import HTTPException
from pydantic import ValidationError

from common.models.errors import ErrorResponse, ErrorDetail

logger = logging.getLogger(__name__)


class ErrorHandlerMiddleware(BaseHTTPMiddleware):
    """
    全ての例外を標準フォーマットで返却
    
    Handled Exceptions:
        - HTTPException: FastAPIの標準HTTPエラー
        - ValidationError: Pydanticバリデーションエラー
        - Exception: 予期しないエラー（500エラーとして返却）
    
    Features:
        - エラーログの自動記録
        - スタックトレースの出力（開発環境のみ）
        - 標準ErrorResponse形式での返却
    
    Business Value:
        - 予期しないエラーでもクライアントに一貫したレスポンス
        - エラー発生時の調査時間を短縮
    """
    
    async def dispatch(
        self, request: Request, call_next: Callable
    ) -> Response:
        """
        リクエストごとに実行されるエラーハンドリング処理
        
        Args:
            request: リクエストオブジェクト
            call_next: 次のミドルウェアまたはエンドポイント
        
        Returns:
            Response: レスポンスオブジェクト
        """
        try:
            response = await call_next(request)
            return response
            
        except HTTPException as e:
            # FastAPIのHTTPException
            logger.warning(
                f"HTTP exception: {e.status_code} - {e.detail}",
                extra={
                    "status_code": e.status_code,
                    "detail": e.detail,
                    "path": request.url.path,
                    "method": request.method,
                    "request_id": getattr(request.state, "request_id", None)
                }
            )
            
            error_response = ErrorResponse(
                code="HTTP_EXCEPTION",
                message=e.detail,
                request_id=getattr(request.state, "request_id", None)
            )
            
            return JSONResponse(
                status_code=e.status_code,
                content={"error": error_response.model_dump()}
            )
            
        except ValidationError as e:
            # Pydanticバリデーションエラー
            logger.warning(
                f"Validation error: {e}",
                extra={
                    "errors": e.errors(),
                    "path": request.url.path,
                    "method": request.method,
                    "request_id": getattr(request.state, "request_id", None)
                }
            )
            
            details = [
                ErrorDetail(
                    field=".".join(str(loc) for loc in error.get("loc", [])),
                    message=error.get("msg", ""),
                    value=error.get("input")
                )
                for error in e.errors()
            ]
            
            error_response = ErrorResponse(
                code="VALIDATION_ERROR",
                message="Request validation failed",
                details=details,
                request_id=getattr(request.state, "request_id", None)
            )
            
            return JSONResponse(
                status_code=400,
                content={"error": error_response.model_dump()}
            )
            
        except Exception as e:
            # 予期しないエラー
            logger.error(
                f"Unexpected error: {e}",
                exc_info=True,
                extra={
                    "path": request.url.path,
                    "method": request.method,
                    "request_id": getattr(request.state, "request_id", None),
                    "traceback": traceback.format_exc()
                }
            )
            
            error_response = ErrorResponse(
                code="INTERNAL_SERVER_ERROR",
                message="An unexpected error occurred",
                request_id=getattr(request.state, "request_id", None)
            )
            
            return JSONResponse(
                status_code=500,
                content={"error": error_response.model_dump()}
            )
