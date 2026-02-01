#!/usr/bin/env python3
"""Service層テストを実装するスクリプト"""

# Service層テストの完全実装
service_test_content = '''"""
TenantServiceのユニットテスト

テストケース:
- TC-S001 ~ TC-S026: TenantServiceのビジネスロジック、バリデーション、特権テナント保護
"""
import pytest
from unittest.mock import MagicMock, AsyncMock
from datetime import datetime

from app.services.tenant_service import TenantService
from app.models.tenant import Tenant, TenantCreate, TenantUpdate
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


class TestTenantService:
    """TenantServiceのテスト"""

    class Testテナント作成:
        """テナント作成のテスト"""

        @pytest.mark.asyncio
        async def test_create_tenant_正常作成(self):
            """TC-S001: 有効なデータでテナントを作成できることを検証"""
            # Arrange
            mock_repository = MagicMock()
            service = TenantService(mock_repository)
            mock_repository.find_by_name = AsyncMock(return_value=None)
            mock_repository.create = AsyncMock(side_effect=lambda t: t)
            
            tenant_data = TenantCreate(
                name="test-corp",
                display_name="Test Corporation",
                plan="standard",
                max_users=100
            )

            # Act
            result = await service.create_tenant(tenant_data, "user_001")

            # Assert
            assert result.name == "test-corp"
            assert result.user_count == 0
            assert result.status == "active"
            assert result.created_by == "user_001"
            mock_repository.find_by_name.assert_called_once_with("test-corp")
            mock_repository.create.assert_called_once()

        @pytest.mark.asyncio
        async def test_create_tenant_重複名エラー(self, sample_tenant):
            """TC-S002: テナント名重複時にValueErrorが発生することを検証"""
            # Arrange
            mock_repository = MagicMock()
            service = TenantService(mock_repository)
            mock_repository.find_by_name = AsyncMock(return_value=sample_tenant)
            
            tenant_data = TenantCreate(
                name="test",
                display_name="Test",
            )

            # Act & Assert
            with pytest.raises(ValueError) as exc_info:
                await service.create_tenant(tenant_data, "user_001")
            assert "already exists" in str(exc_info.value)

        @pytest.mark.asyncio
        @pytest.mark.parametrize("invalid_name,description", INVALID_TENANT_NAMES)
        async def test_create_tenant_無効なname形式(self, invalid_name, description):
            """TC-S003: 無効なname形式でValueErrorが発生することを検証"""
            # Arrange
            mock_repository = MagicMock()
            service = TenantService(mock_repository)
            tenant_data = TenantCreate(
                name=invalid_name if invalid_name else "valid_name",
                display_name="Test"
            )
            if not invalid_name:  # 空文字の場合は直接バリデーションチェック
                with pytest.raises(ValueError):
                    await service.create_tenant(tenant_data, "user_001")
                return

            # Act & Assert
            with pytest.raises(ValueError):
                await service.create_tenant(tenant_data, "user_001")

        @pytest.mark.asyncio
        @pytest.mark.parametrize("invalid_display_name,description", INVALID_DISPLAY_NAMES)
        async def test_create_tenant_無効なdisplay_name(self, invalid_display_name, description):
            """TC-S004: 無効なdisplay_name形式でValueErrorが発生することを検証"""
            # Arrange
            mock_repository = MagicMock()
            service = TenantService(mock_repository)
            tenant_data = TenantCreate(
                name="test",
                display_name=invalid_display_name if invalid_display_name else "valid"
            )
            if not invalid_display_name:  # 空文字の場合は直接バリデーションチェック
                with pytest.raises(ValueError):
                    await service.create_tenant(tenant_data, "user_001")
                return

            # Act & Assert
            with pytest.raises(ValueError):
                await service.create_tenant(tenant_data, "user_001")

        @pytest.mark.asyncio
        @pytest.mark.parametrize("invalid_plan", INVALID_PLANS)
        async def test_create_tenant_無効なplan(self, invalid_plan):
            """TC-S005: 無効なplan値でValueErrorが発生することを検証"""
            # Arrange
            mock_repository = MagicMock()
            service = TenantService(mock_repository)
            tenant_data = TenantCreate(
                name="test-corp",
                display_name="Test",
                plan=invalid_plan
            )

            # Act & Assert
            with pytest.raises(ValueError):
                await service.create_tenant(tenant_data, "user_001")

        @pytest.mark.asyncio
        @pytest.mark.parametrize("invalid_max_users", INVALID_MAX_USERS)
        async def test_create_tenant_無効なmax_users(self, invalid_max_users):
            """TC-S006: 無効なmax_users値でValueErrorが発生することを検証"""
            # Arrange
            mock_repository = MagicMock()
            service = TenantService(mock_repository)
            tenant_data = TenantCreate(
                name="test-corp",
                display_name="Test",
                max_users=invalid_max_users
            )

            # Act & Assert
            with pytest.raises(ValueError):
                await service.create_tenant(tenant_data, "user_001")

    class Testテナント取得:
        """テナント取得のテスト"""

        @pytest.mark.asyncio
        async def test_get_tenant_存在するテナント(self, sample_tenant):
            """TC-S007: 存在するテナントを取得できることを検証"""
            # Arrange
            mock_repository = MagicMock()
            service = TenantService(mock_repository)
            mock_repository.get = AsyncMock(return_value=sample_tenant)

            # Act
            result = await service.get_tenant("tenant_test")

            # Assert
            assert result == sample_tenant
            mock_repository.get.assert_called_once_with("tenant_test", "tenant_test")

        @pytest.mark.asyncio
        async def test_get_tenant_存在しないテナント(self):
            """TC-S008: 存在しないテナント取得時にNoneが返却されることを検証"""
            # Arrange
            mock_repository = MagicMock()
            service = TenantService(mock_repository)
            mock_repository.get = AsyncMock(return_value=None)

            # Act
            result = await service.get_tenant("tenant_nonexistent")

            # Assert
            assert result is None

    class Testテナント一覧:
        """テナント一覧取得のテスト"""

        @pytest.mark.asyncio
        async def test_list_tenants_特権テナント(self, sample_tenant, regular_tenant):
            """TC-S009: 特権テナントが全テナントを取得できることを検証"""
            # Arrange
            mock_repository = MagicMock()
            service = TenantService(mock_repository)
            mock_repository.list_all = AsyncMock(return_value=[sample_tenant, regular_tenant])

            # Act
            result = await service.list_tenants("tenant_privileged", True)

            # Assert
            assert len(result) == 2
            mock_repository.list_all.assert_called_once()

        @pytest.mark.asyncio
        async def test_list_tenants_一般テナント(self, regular_tenant):
            """TC-S010: 一般テナントが自テナントのみ取得できることを検証"""
            # Arrange
            mock_repository = MagicMock()
            service = TenantService(mock_repository)
            mock_repository.list_by_tenant_id = AsyncMock(return_value=[regular_tenant])

            # Act
            result = await service.list_tenants("tenant_acme", False)

            # Assert
            assert len(result) == 1
            mock_repository.list_by_tenant_id.assert_called_once()

        @pytest.mark.asyncio
        async def test_list_tenants_ページネーション(self):
            """TC-S011: ページネーション(skip, limit)が機能することを検証"""
            # Arrange
            mock_repository = MagicMock()
            service = TenantService(mock_repository)
            mock_repository.list_all = AsyncMock(return_value=[])

            # Act
            await service.list_tenants("tenant_privileged", True, skip=10, limit=20)

            # Assert
            mock_repository.list_all.assert_called_once_with(None, 10, 20)

        @pytest.mark.asyncio
        async def test_list_tenants_ステータスフィルタ(self):
            """TC-S012: ステータスでフィルタできることを検証"""
            # Arrange
            mock_repository = MagicMock()
            service = TenantService(mock_repository)
            mock_repository.list_all = AsyncMock(return_value=[])

            # Act
            await service.list_tenants("tenant_privileged", True, status="active")

            # Assert
            mock_repository.list_all.assert_called_once_with("active", 0, 20)

    class Testテナント更新:
        """テナント更新のテスト"""

        @pytest.mark.asyncio
        async def test_update_tenant_正常更新(self, regular_tenant):
            """TC-S013: 有効なデータでテナントを更新できることを検証"""
            # Arrange
            mock_repository = MagicMock()
            service = TenantService(mock_repository)
            mock_repository.get = AsyncMock(return_value=regular_tenant)
            mock_repository.update = AsyncMock(return_value=regular_tenant)
            
            tenant_data = TenantUpdate(display_name="Updated Name")

            # Act
            result = await service.update_tenant("tenant_acme", tenant_data, "user_001")

            # Assert
            assert result == regular_tenant
            mock_repository.update.assert_called_once()

        @pytest.mark.asyncio
        async def test_update_tenant_特権テナント保護(self, privileged_tenant):
            """TC-S014: 特権テナント更新時にValueErrorが発生することを検証"""
            # Arrange
            mock_repository = MagicMock()
            service = TenantService(mock_repository)
            mock_repository.get = AsyncMock(return_value=privileged_tenant)
            
            tenant_data = TenantUpdate(display_name="Updated")

            # Act & Assert
            with pytest.raises(ValueError) as exc_info:
                await service.update_tenant("tenant_privileged", tenant_data, "user_001")
            assert "Privileged tenant cannot be modified" in str(exc_info.value)

        @pytest.mark.asyncio
        async def test_update_tenant_存在しないテナント(self):
            """TC-S015: 存在しないテナント更新時にValueErrorが発生することを検証"""
            # Arrange
            mock_repository = MagicMock()
            service = TenantService(mock_repository)
            mock_repository.get = AsyncMock(return_value=None)
            
            tenant_data = TenantUpdate(display_name="Updated")

            # Act & Assert
            with pytest.raises(ValueError) as exc_info:
                await service.update_tenant("tenant_nonexistent", tenant_data, "user_001")
            assert "not found" in str(exc_info.value)

        @pytest.mark.asyncio
        @pytest.mark.parametrize("invalid_display_name,description", INVALID_DISPLAY_NAMES)
        async def test_update_tenant_無効なdisplay_name(self, invalid_display_name, description, regular_tenant):
            """TC-S016: 無効なdisplay_name形式でValueErrorが発生することを検証"""
            # Arrange
            mock_repository = MagicMock()
            service = TenantService(mock_repository)
            mock_repository.get = AsyncMock(return_value=regular_tenant)
            
            tenant_data = TenantUpdate(display_name=invalid_display_name if invalid_display_name else "valid")
            if not invalid_display_name:
                with pytest.raises(ValueError):
                    await service.update_tenant("tenant_acme", tenant_data, "user_001")
                return

            # Act & Assert
            with pytest.raises(ValueError):
                await service.update_tenant("tenant_acme", tenant_data, "user_001")

    class Testテナント削除:
        """テナント削除のテスト"""

        @pytest.mark.asyncio
        async def test_delete_tenant_正常削除(self, sample_tenant):
            """TC-S017: ユーザーが0人のテナントを削除できることを検証"""
            # Arrange
            mock_repository = MagicMock()
            service = TenantService(mock_repository)
            mock_repository.get = AsyncMock(return_value=sample_tenant)
            mock_repository.delete = AsyncMock()

            # Act
            await service.delete_tenant("tenant_test", "user_001")

            # Assert
            mock_repository.delete.assert_called_once_with("tenant_test", "tenant_test")

        @pytest.mark.asyncio
        async def test_delete_tenant_特権テナント保護(self, privileged_tenant):
            """TC-S018: 特権テナント削除時にValueErrorが発生することを検証"""
            # Arrange
            mock_repository = MagicMock()
            service = TenantService(mock_repository)
            mock_repository.get = AsyncMock(return_value=privileged_tenant)

            # Act & Assert
            with pytest.raises(ValueError) as exc_info:
                await service.delete_tenant("tenant_privileged", "user_001")
            assert "Privileged tenant cannot be deleted" in str(exc_info.value)

        @pytest.mark.asyncio
        async def test_delete_tenant_ユーザー存在チェック(self, tenant_with_users):
            """TC-S019: ユーザーが存在するテナント削除時にValueErrorが発生することを検証"""
            # Arrange
            mock_repository = MagicMock()
            service = TenantService(mock_repository)
            mock_repository.get = AsyncMock(return_value=tenant_with_users)

            # Act & Assert
            with pytest.raises(ValueError) as exc_info:
                await service.delete_tenant("tenant_populated", "user_001")
            assert "existing users" in str(exc_info.value)

        @pytest.mark.asyncio
        async def test_delete_tenant_存在しないテナント(self):
            """TC-S020: 存在しないテナント削除時にValueErrorが発生することを検証"""
            # Arrange
            mock_repository = MagicMock()
            service = TenantService(mock_repository)
            mock_repository.get = AsyncMock(return_value=None)

            # Act & Assert
            with pytest.raises(ValueError) as exc_info:
                await service.delete_tenant("tenant_nonexistent", "user_001")
            assert "not found" in str(exc_info.value)

    class Testユーザー数管理:
        """ユーザー数管理のテスト"""

        @pytest.mark.asyncio
        async def test_increment_user_count_正常動作(self, sample_tenant):
            """TC-S021: ユーザー数をインクリメントできることを検証"""
            # Arrange
            mock_repository = MagicMock()
            service = TenantService(mock_repository)
            mock_repository.get = AsyncMock(return_value=sample_tenant)
            mock_repository.update = AsyncMock()

            # Act
            await service.increment_user_count("tenant_test")

            # Assert
            mock_repository.update.assert_called_once()
            call_args = mock_repository.update.call_args[0]
            update_data = call_args[2]
            assert update_data["userCount"] == 1  # 0 + 1

        @pytest.mark.asyncio
        async def test_decrement_user_count_正常動作(self, regular_tenant):
            """TC-S022: ユーザー数をデクリメントできることを検証"""
            # Arrange
            mock_repository = MagicMock()
            service = TenantService(mock_repository)
            mock_repository.get = AsyncMock(return_value=regular_tenant)
            mock_repository.update = AsyncMock()

            # Act
            await service.decrement_user_count("tenant_acme")

            # Assert
            mock_repository.update.assert_called_once()
            call_args = mock_repository.update.call_args[0]
            update_data = call_args[2]
            assert  update_data["userCount"] == 24  # 25 - 1

        @pytest.mark.asyncio
        async def test_decrement_user_count_0より小さくならない(self, sample_tenant):
            """TC-S023: user_countが0より小さくならないことを検証"""
            # Arrange
            mock_repository = MagicMock()
            service = TenantService(mock_repository)
            mock_repository.get = AsyncMock(return_value=sample_tenant)
            mock_repository.update = AsyncMock()

            # Act
            await service.decrement_user_count("tenant_test")

            # Assert
            call_args = mock_repository.update.call_args[0]
            update_data = call_args[2]
            assert update_data["userCount"] == 0  # max(0, 0 - 1) = 0

    class Testバリデーション:
        """バリデーションのテスト"""

        @pytest.mark.parametrize("valid_name,description", VALID_TENANT_NAMES)
        def test_validate_tenant_name_有効な名前(self, valid_name, description):
            """TC-S024, TC-S025: 有効なテナント名がバリデーションを通過することを検証"""
            # Arrange
            service = TenantService(MagicMock())

            # Act
            result = service.validate_tenant_name(valid_name)

            # Assert
            assert result is True

        @pytest.mark.parametrize("invalid_name,description", INVALID_TENANT_NAMES)
        def test_validate_tenant_name_無効な名前(self, invalid_name, description):
            """TC-S024-2: 無効なテナント名がバリデーションで却下されることを検証"""
            # Arrange
            service = TenantService(MagicMock())

            # Act
            result = service.validate_tenant_name(invalid_name if invalid_name else "")

            # Assert
            assert result is False

        @pytest.mark.parametrize("max_users", VALID_MAX_USERS)
        def test_validate_max_users_境界値(self, max_users):
            """TC-S026: max_usersの境界値(1, 10000)がバリデーションを通過することを検証"""
            # Arrange
            service = TenantService(MagicMock())

            # Act
            result = service.validate_max_users(max_users)

            # Assert
            assert result is True

        @pytest.mark.parametrize("invalid_max_users", INVALID_MAX_USERS)
        def test_validate_max_users_境界値外(self, invalid_max_users):
            """TC-S026-2: max_usersの境界値外でバリデーションが却下されることを検証"""
            # Arrange
            service = TenantService(MagicMock())

            # Act
            result = service.validate_max_users(invalid_max_users)

            # Assert
            assert result is False
'''

# ファイルに書き込み
with open("/workspace/src/tenant-management-service/tests/test_services_tenant.py", "w") as f:
    f.write(service_test_content)

print("Service層テスト実装完了")
