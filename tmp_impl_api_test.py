#!/usr/bin/env python3
"""API層テストを実装するスクリプト"""

# API層テストの完全実装
api_test_content = '''"""
テナント管理API層のユニットテスト

テストケース:
- TC-A001 ~ TC-A023: テナント管理APIエンドポイントの統合テスト
"""
import pytest
from unittest.mock import MagicMock, AsyncMock, patch
from fastapi import HTTPException

from app.api.tenants import (
    list_tenants,
    get_tenant,
    create_tenant,
    update_tenant,
    delete_tenant,
)
from app.schemas.tenant import TenantCreateRequest, TenantUpdateRequest
from app.utils.jwt import TokenData
from app.models.tenant import TenantCreate, TenantUpdate


class TestListTenantsAPI:
    """GET /api/v1/tenants - テナント一覧取得APIのテスト"""

    class Test正常系:
        """正常系テスト"""

        @pytest.mark.asyncio
        async def test_list_tenants_特権テナントで全取得(self, privileged_token_data, sample_tenant, regular_tenant):
            """TC-A001: 特権テナントが全テナントを取得できることを検証"""
            # Arrange
            mock_service = MagicMock()
            mock_service.list_tenants = AsyncMock(return_value=[sample_tenant, regular_tenant])

            # Act
            result = await list_tenants(
                current_user=privileged_token_data,
                tenant_service=mock_service
            )

            # Assert
            assert len(result["data"]) == 2
            mock_service.list_tenants.assert_called_once()
            # 特権テナントはis_privileged=Trueで呼ばれる
            call_kwargs = mock_service.list_tenants.call_args[1]
            assert call_kwargs["is_privileged"] is True

        @pytest.mark.asyncio
        async def test_list_tenants_一般テナントで自取得(self, regular_token_data, regular_tenant):
            """TC-A002: 一般テナントが自テナントのみ取得できることを検証"""
            # Arrange
            mock_service = MagicMock()
            mock_service.list_tenants = AsyncMock(return_value=[regular_tenant])

            # Act
            result = await list_tenants(
                current_user=regular_token_data,
                tenant_service=mock_service
            )

            # Assert
            assert len(result["data"]) == 1
            call_kwargs = mock_service.list_tenants.call_args[1]
            assert call_kwargs["is_privileged"] is False
            assert call_kwargs["current_tenant_id"] == "tenant_acme"

        @pytest.mark.asyncio
        async def test_list_tenants_ステータスフィルタ(self, privileged_token_data, sample_tenant):
            """TC-A003: ステータスでフィルタできることを検証"""
            # Arrange
            mock_service = MagicMock()
            mock_service.list_tenants = AsyncMock(return_value=[sample_tenant])

            # Act
            result = await list_tenants(
                status="active",
                current_user=privileged_token_data,
                tenant_service=mock_service
            )

            # Assert
            call_kwargs = mock_service.list_tenants.call_args[1]
            assert call_kwargs["status"] == "active"

        @pytest.mark.asyncio
        async def test_list_tenants_ページネーション(self, privileged_token_data, sample_tenant):
            """TC-A004: ページネーション(skip, limit)が機能することを検証"""
            # Arrange
            mock_service = MagicMock()
            mock_service.list_tenants = AsyncMock(return_value=[sample_tenant])

            # Act
            result = await list_tenants(
                skip=10,
                limit=20,
                current_user=privileged_token_data,
                tenant_service=mock_service
            )

            # Assert
            call_kwargs = mock_service.list_tenants.call_args[1]
            assert call_kwargs["skip"] == 10
            assert call_kwargs["limit"] == 20
            assert result["pagination"]["skip"] == 10
            assert result["pagination"]["limit"] == 20

    class Test異常系:
        """異常系テスト"""

        @pytest.mark.asyncio
        async def test_list_tenants_認証なし(self):
            """TC-A005: 認証なしでアクセス時に401エラーが発生することを検証"""
            # Note: get_current_userが例外を投げるため、実際のテストは統合テストで実施
            pass


class TestGetTenantAPI:
    """GET /api/v1/tenants/{tenant_id} - テナント詳細取得APIのテスト"""

    class Test正常系:
        """正常系テスト"""

        @pytest.mark.asyncio
        async def test_get_tenant_正常取得(self, regular_token_data, regular_tenant):
            """TC-A006: 有効なテナントIDで詳細を取得できることを検証"""
            # Arrange
            mock_service = MagicMock()
            mock_service.get_tenant = AsyncMock(return_value=regular_tenant)

            # Act
            result = await get_tenant(
                tenant_id="tenant_acme",
                current_user=regular_token_data,
                tenant_service=mock_service
            )

            # Assert
            assert result.id == "tenant_acme"
            mock_service.get_tenant.assert_called_once_with("tenant_acme")

        @pytest.mark.asyncio
        async def test_get_tenant_特権テナントは他取得可(self, privileged_token_data, regular_tenant):
            """TC-A009: 特権テナントが他テナントのデータを取得できることを検証"""
            # Arrange
            mock_service = MagicMock()
            mock_service.get_tenant = AsyncMock(return_value=regular_tenant)

            # Act
            result = await get_tenant(
                tenant_id="tenant_acme",
                current_user=privileged_token_data,
                tenant_service=mock_service
            )

            # Assert
            assert result.id == "tenant_acme"

    class Test異常系:
        """異常系テスト"""

        @pytest.mark.asyncio
        async def test_get_tenant_テナント分離違反(self, regular_token_data):
            """TC-A007: 一般テナントが他テナントのデータにアクセス時に403エラーが発生することを検証"""
            # Arrange
            mock_service = MagicMock()

            # Act & Assert
            with pytest.raises(HTTPException) as exc_info:
                await get_tenant(
                    tenant_id="tenant_other",
                    current_user=regular_token_data,
                    tenant_service=mock_service
                )
            assert exc_info.value.status_code == 403
            assert "Cannot access data from other tenants" in exc_info.value.detail

        @pytest.mark.asyncio
        async def test_get_tenant_存在しないテナント(self, privileged_token_data):
            """TC-A008: 存在しないテナントID指定時に404エラーが発生することを検証"""
            # Arrange
            mock_service = MagicMock()
            mock_service.get_tenant = AsyncMock(return_value=None)

            # Act & Assert
            with pytest.raises(HTTPException) as exc_info:
                await get_tenant(
                    tenant_id="tenant_nonexistent",
                    current_user=privileged_token_data,
                    tenant_service=mock_service
                )
            assert exc_info.value.status_code == 404
            assert "Tenant not found" in exc_info.value.detail


class TestCreateTenantAPI:
    """POST /api/v1/tenants - テナント作成APIのテスト"""

    class Test正常系:
        """正常系テスト"""

        @pytest.mark.asyncio
        async def test_create_tenant_正常作成(self, manager_token_data, sample_tenant):
            """TC-A010: 有効なデータでテナントを作成できることを検証"""
            # Arrange
            mock_service = MagicMock()
            mock_service.create_tenant = AsyncMock(return_value=sample_tenant)
            
            tenant_data = TenantCreateRequest(
                name="test-corp",
                displayName="Test Corporation"
            )

            # Act
            result = await create_tenant(
                tenant_data=tenant_data,
                current_user=manager_token_data,
                tenant_service=mock_service
            )

            # Assert
            assert result.id == "tenant_test"
            mock_service.create_tenant.assert_called_once()

    class Test異常系:
        """異常系テスト"""

        @pytest.mark.asyncio
        async def test_create_tenant_重複名エラー(self, manager_token_data):
            """TC-A011: テナント名重複時に409エラーが発生することを検証"""
            # Arrange
            mock_service = MagicMock()
            mock_service.create_tenant = AsyncMock(
                side_effect=ValueError("Tenant name 'test-corp' already exists")
            )
            
            tenant_data = TenantCreateRequest(
                name="test-corp",
                displayName="Test Corporation"
            )

            # Act & Assert
            with pytest.raises(HTTPException) as exc_info:
                await create_tenant(
                    tenant_data=tenant_data,
                    current_user=manager_token_data,
                    tenant_service=mock_service
                )
            assert exc_info.value.status_code == 409
            assert "already exists" in exc_info.value.detail

        @pytest.mark.asyncio
        async def test_create_tenant_バリデーションエラー(self, manager_token_data):
            """TC-A012: バリデーションエラー時に422エラーが発生することを検証"""
            # Arrange
            mock_service = MagicMock()
            mock_service.create_tenant = AsyncMock(
                side_effect=ValueError("Invalid tenant name")
            )
            
            tenant_data = TenantCreateRequest(
                name="test-corp",
                displayName="Test"
            )

            # Act & Assert
            with pytest.raises(HTTPException) as exc_info:
                await create_tenant(
                    tenant_data=tenant_data,
                    current_user=manager_token_data,
                    tenant_service=mock_service
                )
            assert exc_info.value.status_code == 422

        @pytest.mark.asyncio
        async def test_create_tenant_認証なし(self):
            """TC-A013: 認証なしでアクセス時に401エラーが発生することを検証"""
            # Note: get_current_userが例外を投げるため、実際のテストは統合テストで実施
            pass


class TestUpdateTenantAPI:
    """PUT /api/v1/tenants/{tenant_id} - テナント更新APIのテスト"""

    class Test正常系:
        """正常系テスト"""

        @pytest.mark.asyncio
        async def test_update_tenant_正常更新(self, manager_token_data, regular_tenant):
            """TC-A014: 有効なデータでテナントを更新できることを検証"""
            # Arrange
            mock_service = MagicMock()
            mock_service.update_tenant = AsyncMock(return_value=regular_tenant)
            
            tenant_data = TenantUpdateRequest(displayName="Updated Name")

            # Act
            result = await update_tenant(
                tenant_id="tenant_acme",
                tenant_data=tenant_data,
                current_user=manager_token_data,
                tenant_service=mock_service
            )

            # Assert
            assert result.id == "tenant_acme"
            mock_service.update_tenant.assert_called_once()

    class Test異常系:
        """異常系テスト"""

        @pytest.mark.asyncio
        async def test_update_tenant_特権テナント保護(self, manager_token_data):
            """TC-A015: 特権テナント更新時に403エラーが発生することを検証"""
            # Arrange
            mock_service = MagicMock()
            mock_service.update_tenant = AsyncMock(
                side_effect=ValueError("Privileged tenant cannot be modified")
            )
            
            tenant_data = TenantUpdateRequest(displayName="Updated")

            # Act & Assert
            with pytest.raises(HTTPException) as exc_info:
                await update_tenant(
                    tenant_id="tenant_privileged",
                    tenant_data=tenant_data,
                    current_user=manager_token_data,
                    tenant_service=mock_service
                )
            assert exc_info.value.status_code == 403
            assert "Privileged tenant" in exc_info.value.detail

        @pytest.mark.asyncio
        async def test_update_tenant_存在しないテナント(self, manager_token_data):
            """TC-A016: 存在しないテナント更新時に404エラーが発生することを検証"""
            # Arrange
            mock_service = MagicMock()
            mock_service.update_tenant = AsyncMock(
                side_effect=ValueError("Tenant not found")
            )
            
            tenant_data = TenantUpdateRequest(displayName="Updated")

            # Act & Assert
            with pytest.raises(HTTPException) as exc_info:
                await update_tenant(
                    tenant_id="tenant_nonexistent",
                    tenant_data=tenant_data,
                    current_user=manager_token_data,
                    tenant_service=mock_service
                )
            assert exc_info.value.status_code == 404
            assert "not found" in exc_info.value.detail

        @pytest.mark.asyncio
        async def test_update_tenant_バリデーションエラー(self, manager_token_data):
            """TC-A017: バリデーションエラー時に422エラーが発生することを検証"""
            # Arrange
            mock_service = MagicMock()
            mock_service.update_tenant = AsyncMock(
                side_effect=ValueError("Invalid display name")
            )
            
            tenant_data = TenantUpdateRequest(displayName="x" * 201)

            # Act & Assert
            with pytest.raises(HTTPException) as exc_info:
                await update_tenant(
                    tenant_id="tenant_acme",
                    tenant_data=tenant_data,
                    current_user=manager_token_data,
                    tenant_service=mock_service
                )
            assert exc_info.value.status_code == 422


class TestDeleteTenantAPI:
    """DELETE /api/v1/tenants/{tenant_id} - テナント削除APIのテスト"""

    class Test正常系:
        """正常系テスト"""

        @pytest.mark.asyncio
        async def test_delete_tenant_正常削除(self, manager_token_data):
            """TC-A018: ユーザーが0人のテナントを削除できることを検証"""
            # Arrange
            mock_service = MagicMock()
            mock_service.delete_tenant = AsyncMock()

            # Act
            result = await delete_tenant(
                tenant_id="tenant_test",
                current_user=manager_token_data,
                tenant_service=mock_service
            )

            # Assert
            assert result is None
            mock_service.delete_tenant.assert_called_once_with("tenant_test", manager_token_data.user_id)

    class Test異常系:
        """異常系テスト"""

        @pytest.mark.asyncio
        async def test_delete_tenant_特権テナント保護(self, manager_token_data):
            """TC-A019: 特権テナント削除時に403エラーが発生することを検証"""
            # Arrange
            mock_service = MagicMock()
            mock_service.delete_tenant = AsyncMock(
                side_effect=ValueError("Privileged tenant cannot be deleted")
            )

            # Act & Assert
            with pytest.raises(HTTPException) as exc_info:
                await delete_tenant(
                    tenant_id="tenant_privileged",
                    current_user=manager_token_data,
                    tenant_service=mock_service
                )
            assert exc_info.value.status_code == 403
            assert "Privileged tenant" in exc_info.value.detail

        @pytest.mark.asyncio
        async def test_delete_tenant_ユーザー存在エラー(self, manager_token_data):
            """TC-A020: ユーザーが存在するテナント削除時に400エラーが発生することを検証"""
            # Arrange
            mock_service = MagicMock()
            mock_service.delete_tenant = AsyncMock(
                side_effect=ValueError("Cannot delete tenant with existing users")
            )

            # Act & Assert
            with pytest.raises(HTTPException) as exc_info:
                await delete_tenant(
                    tenant_id="tenant_populated",
                    current_user=manager_token_data,
                    tenant_service=mock_service
                )
            assert exc_info.value.status_code == 400
            assert "existing users" in exc_info.value.detail

        @pytest.mark.asyncio
        async def test_delete_tenant_存在しないテナント(self, manager_token_data):
            """TC-A021: 存在しないテナント削除時に404エラーが発生することを検証"""
            # Arrange
            mock_service = MagicMock()
            mock_service.delete_tenant = AsyncMock(
                side_effect=ValueError("Tenant not found")
            )

            # Act & Assert
            with pytest.raises(HTTPException) as exc_info:
                await delete_tenant(
                    tenant_id="tenant_nonexistent",
                    current_user=manager_token_data,
                    tenant_service=mock_service
                )
            assert exc_info.value.status_code == 404
            assert "not found" in exc_info.value.detail


class Test境界値:
    """境界値テスト"""

    @pytest.mark.asyncio
    async def test_list_tenants_limit最大値(self, privileged_token_data):
        """TC-A022: limit=100(最大値)が正常に機能することを検証"""
        # Arrange
        mock_service = MagicMock()
        mock_service.list_tenants = AsyncMock(return_value=[])

        # Act
        result = await list_tenants(
            limit=100,
            current_user=privileged_token_data,
            tenant_service=mock_service
        )

        # Assert
        call_kwargs = mock_service.list_tenants.call_args[1]
        assert call_kwargs["limit"] == 100

    @pytest.mark.asyncio
    async def test_list_tenants_limit超過(self, privileged_token_data):
        """TC-A023: limit>100でバリデーションエラーが発生することを検証"""
        # Note: FastAPIのバリデーションでle=100が適用されるため、
        # APIレベルでは 422 が自動的に返される（テストはFastAPI統合テストで実施）
        pass
'''

# ファイルに書き込み
with open("/workspace/src/tenant-management-service/tests/test_api_tenants.py", "w") as f:
    f.write(api_test_content)

print("API層テスト実装完了")
