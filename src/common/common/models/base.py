"""
基底モデルモジュール

全エンティティで共通利用する基底Pydanticモデルを提供します。
"""

import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel as PydanticBaseModel, Field, ConfigDict


class BaseModel(PydanticBaseModel):
    """
    全エンティティの基底クラス
    
    Fields:
        - id: ユニークID（UUID自動生成）
        - created_at: 作成日時（自動設定）
        - updated_at: 更新日時（自動設定）
    
    Features:
        - datetimeのISO 8601形式変換
        - JSON変換の統一
    
    Business Value:
        - 全エンティティで一貫したID生成とタイムスタンプ管理
        - データ整合性の向上
    """
    
    model_config = ConfigDict(
        # JSON変換時のカスタムエンコーダー
        json_encoders={
            datetime: lambda v: v.isoformat() + "Z" if v else None
        },
        # フィールドにNoneを許可（オプショナルフィールド用）
        validate_default=True,
        # 追加フィールドを禁止（厳格なバリデーション）
        extra='forbid'
    )
    
    id: str = Field(
        default_factory=lambda: str(uuid.uuid4()),
        description="ユニークID（UUID形式）"
    )
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(datetime.UTC) if hasattr(datetime, 'UTC') else datetime.utcnow(),
        description="作成日時（UTC）"
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(datetime.UTC) if hasattr(datetime, 'UTC') else datetime.utcnow(),
        description="更新日時（UTC）"
    )
    
    def update_timestamp(self) -> None:
        """
        更新日時を現在時刻に更新
        
        Usage:
            tenant.name = "Updated Name"
            tenant.update_timestamp()
        """
        self.updated_at = datetime.now(datetime.UTC) if hasattr(datetime, 'UTC') else datetime.utcnow()
