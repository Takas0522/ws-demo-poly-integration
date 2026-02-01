"""
エラーモデルモジュール

標準化されたエラーレスポンスモデルを提供します。
"""

from datetime import datetime
from typing import Optional, List, Any

from pydantic import BaseModel, Field, ConfigDict


class ErrorDetail(BaseModel):
    """
    エラー詳細
    
    単一のエラー情報を表現します（バリデーションエラー等）。
    """
    field: Optional[str] = Field(
        None,
        description="エラーが発生したフィールド名"
    )
    message: str = Field(
        ...,
        description="エラーメッセージ"
    )
    value: Optional[Any] = Field(
        None,
        description="エラーが発生した値"
    )


class ErrorResponse(BaseModel):
    """
    標準化されたエラーレスポンス
    
    Fields:
        - code: エラーコード（"TENANT_NOT_FOUND"等）
        - message: エラーメッセージ
        - details: 詳細情報（オプショナル）
        - timestamp: 発生日時
        - request_id: リクエストID（トレース用）
    
    Business Value:
        - APIエラーレスポンスが全サービスで統一
        - クライアント側のエラーハンドリングが容易
        - request_idによるエラー追跡が可能
    
    Usage:
        error_response = ErrorResponse(
            code="TENANT_NOT_FOUND",
            message="The specified tenant does not exist",
            details=[
                ErrorDetail(
                    field="tenant_id",
                    message="Tenant with ID 'tenant_123' not found",
                    value="tenant_123"
                )
            ],
            request_id=request.state.request_id
        )
    """
    code: str = Field(
        ...,
        description="エラーコード（大文字スネークケース）",
        examples=["TENANT_NOT_FOUND", "VALIDATION_ERROR", "UNAUTHORIZED"]
    )
    message: str = Field(
        ...,
        description="エラーメッセージ（人間が読める形式）"
    )
    details: Optional[List[ErrorDetail]] = Field(
        None,
        description="詳細なエラー情報リスト"
    )
    timestamp: datetime = Field(
        default_factory=lambda: datetime.now(datetime.UTC) if hasattr(datetime, 'UTC') else datetime.utcnow(),
        description="エラー発生日時（UTC）"
    )
    request_id: Optional[str] = Field(
        None,
        description="リクエストID（トレース用）"
    )
    
    model_config = ConfigDict(
        json_encoders={
            datetime: lambda v: v.isoformat() + "Z" if v else None
        }
    )
