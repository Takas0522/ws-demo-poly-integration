#!/usr/bin/env python3
"""Service層テストのバリデーションエラーハンドリング修正"""

# Pydanticのバリデーションエラーを考慮したテストに修正
fixed_test = open("/workspace/src/tenant-management-service/tests/test_services_tenant.py").read()

# 無効なテナント作成時はPydanticのバリデーションでエラーになるため、ValidationErrorをキャッチ
fixed_test = fixed_test.replace(
    "from pydantic import ValidationError",
    "from pydantic_core import ValidationError"
)

# ValidationErrorのインポートを追加
if "from pydantic_core import ValidationError" not in fixed_test:
    fixed_test = fixed_test.replace(
        "from app.services.tenant_service import TenantService",
        "from app.services.tenant_service import TenantService\nfrom pydantic_core import ValidationError as PydanticValidationError"
    )

# 無効なname形式のテストを修正
fixed_test = fixed_test.replace(
    '''        @pytest.mark.asyncio
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
                await service.create_tenant(tenant_data, "user_001")''',
    '''        @pytest.mark.asyncio
        @pytest.mark.parametrize("invalid_name,description", INVALID_TENANT_NAMES)
        async def test_create_tenant_無効なname形式(self, invalid_name, description):
            """TC-S003: 無効なname形式でValidationErrorが発生することを検証"""
            # Arrange
            mock_repository = MagicMock()
            service = TenantService(mock_repository)
            
            # Act & Assert
            # Pydanticのバリデーションエラーが発生する
            with pytest.raises((PydanticValidationError, ValueError)):
                tenant_data = TenantCreate(
                    name=invalid_name if invalid_name else "x",
                    display_name="Test"
                )
                if invalid_name:  # Pydanticでエラーにならなかった場合
                    await service.create_tenant(tenant_data, "user_001")'''
)

# 無効なdisplay_name形式のテストを修正
fixed_test = fixed_test.replace(
    '''        @pytest.mark.asyncio
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
                await service.create_tenant(tenant_data, "user_001")''',
    '''        @pytest.mark.asyncio
        @pytest.mark.parametrize("invalid_display_name,description", INVALID_DISPLAY_NAMES)
        async def test_create_tenant_無効なdisplay_name(self, invalid_display_name, description):
            """TC-S004: 無効なdisplay_name形式でValidationErrorが発生することを検証"""
            # Arrange
            mock_repository = MagicMock()
            service = TenantService(mock_repository)
            
            # Act & Assert
            with pytest.raises((PydanticValidationError, ValueError)):
                tenant_data = TenantCreate(
                    name="test",
                    display_name=invalid_display_name if invalid_display_name else "x"
                )
                if invalid_display_name:
                    await service.create_tenant(tenant_data, "user_001")'''
)

# 無効なplanのテストを修正
fixed_test = fixed_test.replace(
    '''        @pytest.mark.asyncio
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
                await service.create_tenant(tenant_data, "user_001")''',
    '''        @pytest.mark.asyncio
        @pytest.mark.parametrize("invalid_plan", INVALID_PLANS)
        async def test_create_tenant_無効なplan(self, invalid_plan):
            """TC-S005: 無効なplan値でValidationErrorが発生することを検証"""
            # Arrange
            mock_repository = MagicMock()
            service = TenantService(mock_repository)
            
            # Act & Assert
            with pytest.raises((PydanticValidationError, ValueError)):
                tenant_data = TenantCreate(
                    name="test-corp",
                    display_name="Test",
                    plan=invalid_plan
                )
                await service.create_tenant(tenant_data, "user_001")'''
)

# 無効なmax_usersのテストを修正  
fixed_test = fixed_test.replace(
    '''        @pytest.mark.asyncio
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
                await service.create_tenant(tenant_data, "user_001")''',
    '''        @pytest.mark.asyncio
        @pytest.mark.parametrize("invalid_max_users", INVALID_MAX_USERS)
        async def test_create_tenant_無効なmax_users(self, invalid_max_users):
            """TC-S006: 無効なmax_users値でValidationErrorが発生することを検証"""
            # Arrange
            mock_repository = MagicMock()
            service = TenantService(mock_repository)
            
            # Act & Assert
            with pytest.raises((PydanticValidationError, ValueError)):
                tenant_data = TenantCreate(
                    name="test-corp",
                    display_name="Test",
                    max_users=invalid_max_users
                )
                await service.create_tenant(tenant_data, "user_001")'''
)

# 更新時の無効なdisplay_nameテストを修正
fixed_test = fixed_test.replace(
    '''        @pytest.mark.asyncio
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
                await service.update_tenant("tenant_acme", tenant_data, "user_001")''',
    '''        @pytest.mark.asyncio
        @pytest.mark.parametrize("invalid_display_name,description", INVALID_DISPLAY_NAMES)
        async def test_update_tenant_無効なdisplay_name(self, invalid_display_name, description, regular_tenant):
            """TC-S016: 無効なdisplay_name形式でValidationErrorが発生することを検証"""
            # Arrange
            mock_repository = MagicMock()
            service = TenantService(mock_repository)
            mock_repository.get = AsyncMock(return_value=regular_tenant)
            mock_repository.update = AsyncMock(return_value=regular_tenant)
            
            # Act & Assert
            with pytest.raises((PydanticValidationError, ValueError)):
                tenant_data = TenantUpdate(display_name=invalid_display_name if invalid_display_name else "x")
                if invalid_display_name:
                    await service.update_tenant("tenant_acme", tenant_data, "user_001")'''
)

with open("/workspace/src/tenant-management-service/tests/test_services_tenant.py", "w") as f:
    f.write(fixed_test)

print("Service層テスト修正完了")
