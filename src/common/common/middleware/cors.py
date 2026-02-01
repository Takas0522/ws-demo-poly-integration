"""
CORS設定モジュール

FastAPIアプリケーションのCORS設定を提供します。
"""

from typing import List
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware


def setup_cors(
    app: FastAPI,
    allow_origins: List[str] = None,
    allow_credentials: bool = True,
    allow_methods: List[str] = None,
    allow_headers: List[str] = None
) -> None:
    """
    FastAPIアプリケーションにCORSを設定
    
    Args:
        app: FastAPIアプリケーション
        allow_origins: 許可するオリジン（デフォルト: ["*"]）
        allow_credentials: 認証情報の送信を許可するか（デフォルト: True）
        allow_methods: 許可するHTTPメソッド（デフォルト: ["*"]）
        allow_headers: 許可するHTTPヘッダー（デフォルト: ["*"]）
    
    Usage:
        from fastapi import FastAPI
        from common.middleware import setup_cors
        
        app = FastAPI()
        setup_cors(app, allow_origins=["https://example.com"])
    
    Business Value:
        - CORS設定の一元化により、セキュリティポリシーを統一
        - 本番環境では特定のオリジンのみを許可することでセキュリティを強化
    """
    if allow_origins is None:
        allow_origins = ["*"]
    
    if allow_methods is None:
        allow_methods = ["*"]
    
    if allow_headers is None:
        allow_headers = ["*"]
    
    app.add_middleware(
        CORSMiddleware,
        allow_origins=allow_origins,
        allow_credentials=allow_credentials,
        allow_methods=allow_methods,
        allow_headers=allow_headers,
    )
