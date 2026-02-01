#!/usr/bin/env python3
"""Schema層テストを実装するスクリプト"""

# Schema層テストの完全実装
schema_test_content = '''"""
テナントスキーマ層のユニットテスト

テストケース:
- TenantResponse、TenantListResponse、TenantCreateRequest、TenantUpdateRequestのバリデーション
"""
import pytest
from datetime import datetime
from pydantic import ValidationError

from app.schemas.tenant import (
    TenantResponse,
    TenantListResponse,
    TenantCreateRequest,
    TenantUpdateRequest,
)
from tests.conftest import (
    INVALID_TENANT_NAMES,
    VALID_TENANT_NAMES,
    INVALID_DISPLAY_NAMES,
    VALID_DISPLAY_NAMES,
    INVALID_PLANS,
    VALID_PLANS,
    INVALID_MAX_USERS,
    VALID_MAX_USERS,
)


class TestTenantResponse:
    """TenantResponseスキーマのテスト"""

    class Test正常系:
        """正常系テスト"""

        def test_tenant_response_正常な作成(self):
            """TC-Schema-001: 有効なデータでTenantResponseが作成できることを検証"""
            # Arrange & Act
            response = TenantResponse(
                id="tenant_test",
                name="test",
                displayName="Test Tenant",
                isPrivileged=False,
                status="active",
                plan="standard",
                userCount=10,
                maxUsers=100,
                metadata={"key": "value"},
                createdAt=datetime(2026, 2, 1, 10, 0, 0),
                updatedAt=datetime(2026, 2, 1, 10, 0, 0),
                createdBy="user_001",
                updatedBy="user_001",
            )

            # Assert
            assert response.id == "tenant_test"
            assert response.display_name == "Test Tenant"
            assert response.user_count == 10

        def test_tenant_response_キャメルケースエイリアス(self):
            """TC-Schema-002: エイリアス(CamelCase)が正しく機能することを検証"""
            # Arrange
            data = {
                "id": "tenant_test",
                "name": "test",
                "displayName": "Test Tenant",
                "isPrivileged": False,
                "status": "active",
                "plan": "standard",
                "userCount": 10,
                "maxUsers": 100,
                "createdAt": "2026-02-01T10:00:00Z",
                "updatedAt": "2026-02-01T10:00:00Z",
            }

            # Act
            response = TenantResponse(**data)

            # Assert
            assert response.display_name == "Test Tenant"
            assert response.is_privileged is False
            assert response.user_count == 10
            assert response.max_users == 100


class TestTenantListResponse:
    """TenantListResponseスキーマのテスト"""

    class Test正常系:
        """正常系テスト"""

        def test_tenant_list_response_正常な作成(self):
            """TC-Schema-003: 有効なデータでTenantListResponseが作成できることを検証"""
            # Arrange & Act
            response = TenantListResponse(
                id="tenant_test",
                name="test",
                displayName="Test Tenant",
                isPrivileged=False,
                status="active",
                plan="standard",
                userCount=10,
                maxUsers=100,
                createdAt=datetime(2026, 2, 1, 10, 0, 0),
                updatedAt=datetime(2026, 2, 1, 10, 0, 0),
            )

            # Assert
            assert response.id == "tenant_test"
            assert response.name == "test"


class TestTenantCreateRequest:
    """TenantCreateRequestスキーマのテスト"""

    class Test正常系:
        """正常系テスト"""

        def test_tenant_create_request_正常な作成(self):
            """TC-Schema-004: 有効なデータでTenantCreateRequestが作成できることを検証"""
            # Arrange & Act
            request = TenantCreateRequest(
                name="test-corp",
                displayName="Test Corporation"
            )

            # Assert
            assert request.name == "test-corp"
            assert request.display_name == "Test Corporation"
            assert request.plan == "standard"  # デフォルト値
            assert request.max_users == 100  # デフォルト値

        def test_tenant_create_request_デフォルト値(self):
            """TC-Schema-005: デフォルト値が正しく設定されることを検証"""
            # Arrange & Act
            request = TenantCreateRequest(
                name="test-corp",
                displayName="Test Corporation"
            )

            # Assert
            assert request.plan == "standard"
            assert request.max_users == 100

        @pytest.mark.parametrize("valid_name,description", VALID_TENANT_NAMES)
        def test_tenant_create_request_name境界値_有効(self, valid_name, description):
            """TC-Schema-006: name境界値(3文字、100文字)で正常に作成できることを検証"""
            # Arrange & Act
            request = TenantCreateRequest(
                name=valid_name,
                displayName="Test"
            )

            # Assert
            assert request.name == valid_name

        @pytest.mark.parametrize("valid_plan", VALID_PLANS)
        def test_tenant_create_request_有効なplan(self, valid_plan):
            """TC-Schema-007: 有効なplanで正常に作成できることを検証"""
            # Arrange & Act
            request = TenantCreateRequest(
                name="test-corp",
                displayName="Test",
                plan=valid_plan
            )

            # Assert
            assert request.plan == valid_plan

    class Test異常系:
        """異常系テスト"""

        def test_tenant_create_request_必須フィールド欠如_name(self):
            """TC-Schema-008: 必須フィールド(name)欠如時にValidationErrorが発生することを検証"""
            # Act & Assert
            with pytest.raises(ValidationError) as exc_info:
                TenantCreateRequest(displayName="Test")
            errors = exc_info.value.errors()
            assert any(e["loc"] == ("name",) for e in errors)

        def test_tenant_create_request_必須フィールド欠如_display_name(self):
            """TC-Schema-009: 必須フィールド(display_name)欠如時にValidationErrorが発生することを検証"""
            # Act & Assert
            with pytest.raises(ValidationError) as exc_info:
                TenantCreateRequest(name="test-corp")
            errors = exc_info.value.errors()
            assert any(e["loc"] in [("display_name",), ("displayName",)] for e in errors)

        @pytest.mark.parametrize("invalid_name,description", INVALID_TENANT_NAMES)
        def test_tenant_create_request_不正なname形式(self, invalid_name, description):
            """TC-Schema-010: 不正なname形式でValidationErrorが発生することを検証"""
            # Act & Assert
            with pytest.raises(ValidationError):
                TenantCreateRequest(
                    name=invalid_name if invalid_name else "x",  # 空文字は別途処理
                    displayName="Test"
                )

        @pytest.mark.parametrize("invalid_plan", INVALID_PLANS)
        def test_tenant_create_request_不正なplan(self, invalid_plan):
            """TC-Schema-011: 不正なplan値でValidationErrorが発生することを検証"""
            # Act & Assert
            with pytest.raises(ValidationError):
                TenantCreateRequest(
                    name="test-corp",
                    displayName="Test",
                    plan=invalid_plan
                )

        @pytest.mark.parametrize("invalid_max_users", INVALID_MAX_USERS)
        def test_tenant_create_request_不正なmax_users(self, invalid_max_users):
            """TC-Schema-012: 不正なmax_users値でValidationErrorが発生することを検証"""
            # Act & Assert
            with pytest.raises(ValidationError):
                TenantCreateRequest(
                    name="test-corp",
                    displayName="Test",
                    maxUsers=invalid_max_users
                )


class TestTenantUpdateRequest:
    """TenantUpdateRequestスキーマのテスト"""

    class Test正常系:
        """正常系テスト"""

        def test_tenant_update_request_部分更新_display_nameのみ(self):
            """TC-Schema-013: 部分更新(display_nameのみ)が可能であることを検証"""
            # Arrange & Act
            request = TenantUpdateRequest(displayName="Updated Name")

            # Assert
            assert request.display_name == "Updated Name"
            assert request.plan is None
            assert request.max_users is None

        def test_tenant_update_request_全フィールド指定(self):
            """TC-Schema-014: 全フィールドを指定できることを検証"""
            # Arrange & Act
            request = TenantUpdateRequest(
                displayName="Updated Name",
                plan="premium",
                maxUsers=500,
                metadata={"key": "value"}
            )

            # Assert
            assert request.display_name == "Updated Name"
            assert request.plan == "premium"
            assert request.max_users == 500
            assert request.metadata == {"key": "value"}

        def test_tenant_update_request_空のオブジェクト(self):
            """TC-Schema-015: 空のオブジェクト(何も更新しない)が作成できることを検証"""
            # Arrange & Act
            request = TenantUpdateRequest()

            # Assert
            assert request.display_name is None
            assert request.plan is None
            assert request.max_users is None
            assert request.metadata is None

    class Test異常系:
        """異常系テスト"""

        @pytest.mark.parametrize("invalid_display_name,description", INVALID_DISPLAY_NAMES)
        def test_tenant_update_request_不正なdisplay_name(self, invalid_display_name, description):
            """TC-Schema-016: 不正なdisplay_name形式でValidationErrorが発生することを検証"""
            # Act & Assert
            with pytest.raises(ValidationError):
                TenantUpdateRequest(
                    displayName=invalid_display_name if invalid_display_name else "x"
                )

        @pytest.mark.parametrize("invalid_plan", INVALID_PLANS)
        def test_tenant_update_request_不正なplan(self, invalid_plan):
            """TC-Schema-017: 不正なplan値でValidationErrorが発生することを検証"""
            # Act & Assert
            with pytest.raises(ValidationError):
                TenantUpdateRequest(plan=invalid_plan)

        @pytest.mark.parametrize("invalid_max_users", INVALID_MAX_USERS)
        def test_tenant_update_request_不正なmax_users(self, invalid_max_users):
            """TC-Schema-018: 不正なmax_users値でValidationErrorが発生することを検証"""
            # Act & Assert
            with pytest.raises(ValidationError):
                TenantUpdateRequest(maxUsers=invalid_max_users)
'''

# ファイルに書き込み
with open("/workspace/src/tenant-management-service/tests/test_schemas_tenant.py", "w") as f:
    f.write(schema_test_content)

print("Schema層テスト実装完了")
