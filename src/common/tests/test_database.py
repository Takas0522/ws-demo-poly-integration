"""
データベースモジュールのテスト
"""

import pytest
from unittest.mock import Mock, AsyncMock, patch
from typing import List

from common.database.cosmos import CosmosDBClient
from common.database.repository import BaseRepository, SecurityError
from common.models.base import BaseModel
from pydantic import Field, ConfigDict


# テスト用モデル
class UserModel(BaseModel):
    tenant_id: str = Field(..., alias="tenantId")
    name: str
    email: str
    
    model_config = ConfigDict(
        populate_by_name=True  # フィールド名とエイリアスの両方を許可
    )


@pytest.fixture
def mock_container():
    """モックコンテナ"""
    container = Mock()
    container.read_item = AsyncMock()
    container.create_item = AsyncMock()
    container.upsert_item = AsyncMock()
    container.delete_item = AsyncMock()
    container.query_items = AsyncMock()
    return container


@pytest.fixture
def test_repository(mock_container):
    """テスト用リポジトリ"""
    return BaseRepository(mock_container, UserModel)


def test_cosmos_client_singleton():
    """CosmosDBClientがシングルトンであること"""
    with patch.dict('os.environ', {
        'COSMOS_CONNECTION_STRING': 'AccountEndpoint=https://test.documents.azure.com:443/;AccountKey=test==;',
        'COSMOS_DATABASE_NAME': 'test-db'
    }):
        client1 = CosmosDBClient.get_instance()
        client2 = CosmosDBClient.get_instance()
        
        assert client1 is client2


@pytest.mark.asyncio
async def test_base_repository_get(test_repository, mock_container):
    """BaseRepository.getでアイテムが取得できること"""
    mock_container.read_item.return_value = {
        "id": "user_1",
        "tenantId": "tenant_1",
        "name": "Test User",
        "email": "test@example.com",
        "created_at": "2026-02-01T00:00:00Z",
        "updated_at": "2026-02-01T00:00:00Z"
    }
    
    result = await test_repository.get("user_1", "tenant_1")
    
    assert result is not None
    assert result.id == "user_1"
    assert result.tenant_id == "tenant_1"
    assert result.name == "Test User"
    
    mock_container.read_item.assert_called_once_with(
        item="user_1",
        partition_key="tenant_1"
    )


@pytest.mark.asyncio
async def test_base_repository_get_empty_id(test_repository):
    """空のIDでValueErrorが発生すること"""
    with pytest.raises(ValueError, match="id cannot be empty"):
        await test_repository.get("", "tenant_1")


@pytest.mark.asyncio
async def test_base_repository_get_empty_partition_key(test_repository):
    """空のパーティションキーでValueErrorが発生すること"""
    with pytest.raises(ValueError, match="partition_key cannot be empty"):
        await test_repository.get("user_1", "")


@pytest.mark.asyncio
async def test_base_repository_create(test_repository, mock_container):
    """BaseRepository.createでアイテムが作成されること"""
    user = UserModel(
        tenantId="tenant_1",
        name="New User",
        email="new@example.com"
    )
    
    mock_container.create_item.return_value = user.model_dump(by_alias=True)
    
    result = await test_repository.create(user)
    
    assert result.name == "New User"
    mock_container.create_item.assert_called_once()


@pytest.mark.asyncio
async def test_base_repository_query_without_partition_key(test_repository):
    """パーティションキーなしクエリでValueErrorが発生すること"""
    query = "SELECT * FROM c WHERE c.email = @email"
    parameters = [{"name": "@email", "value": "test@example.com"}]
    
    with pytest.raises(ValueError, match="partition_key is required"):
        await test_repository.query(query, parameters, partition_key=None, allow_cross_partition=False)


@pytest.mark.asyncio
async def test_base_repository_query_without_tenant_filter(test_repository):
    """テナントIDフィルタなしクエリでSecurityErrorが発生すること"""
    query = "SELECT * FROM c WHERE c.email = @email"  # tenantIdフィルタなし
    parameters = [
        {"name": "@tenant_id", "value": "tenant_1"},
        {"name": "@email", "value": "test@example.com"}
    ]
    
    with pytest.raises(SecurityError, match="must include tenant_id filter"):
        await test_repository.query(query, parameters, partition_key="tenant_1")


@pytest.mark.asyncio
async def test_base_repository_query_without_tenant_parameter(test_repository):
    """@tenant_idパラメータなしクエリでSecurityErrorが発生すること"""
    query = "SELECT * FROM c WHERE c.tenantId = @tenant_id AND c.email = @email"
    parameters = [{"name": "@email", "value": "test@example.com"}]  # @tenant_idなし
    
    with pytest.raises(SecurityError, match="must include @tenant_id"):
        await test_repository.query(query, parameters, partition_key="tenant_1")


@pytest.mark.asyncio
async def test_base_repository_query_success(test_repository, mock_container):
    """正しいクエリが実行されること"""
    query = "SELECT * FROM c WHERE c.tenantId = @tenant_id AND c.email = @email"
    parameters = [
        {"name": "@tenant_id", "value": "tenant_1"},
        {"name": "@email", "value": "test@example.com"}
    ]
    
    # AsyncIteratorをモック
    class AsyncIteratorMock:
        def __init__(self, items):
            self.items = items
            self.index = 0
        
        def __aiter__(self):
            return self
        
        async def __anext__(self):
            if self.index >= len(self.items):
                raise StopAsyncIteration
            item = self.items[self.index]
            self.index += 1
            return item
    
    # query_items が AsyncIteratorMock を返すように設定
    mock_container.query_items = Mock(return_value=AsyncIteratorMock([
        {
            "id": "user_1",
            "tenantId": "tenant_1",
            "name": "Test User",
            "email": "test@example.com",
            "created_at": "2026-02-01T00:00:00Z",
            "updated_at": "2026-02-01T00:00:00Z"
        }
    ]))
    
    results = await test_repository.query(query, parameters, partition_key="tenant_1")
    
    assert len(results) == 1
    assert results[0].email == "test@example.com"


@pytest.mark.asyncio
async def test_base_repository_query_cross_partition_allowed(test_repository, mock_container):
    """allow_cross_partition=Trueでクロスパーティションクエリが実行できること"""
    query = "SELECT * FROM c WHERE c.tenantId = @tenant_id"
    parameters = [{"name": "@tenant_id", "value": "tenant_1"}]
    
    class AsyncIteratorMock:
        def __init__(self, items):
            self.items = items
            self.index = 0
        
        def __aiter__(self):
            return self
        
        async def __anext__(self):
            if self.index >= len(self.items):
                raise StopAsyncIteration
            item = self.items[self.index]
            self.index += 1
            return item
    
    mock_container.query_items = Mock(return_value=AsyncIteratorMock([]))
    
    # allow_cross_partition=Trueでクエリ実行
    results = await test_repository.query(
        query,
        parameters,
        partition_key=None,
        allow_cross_partition=True
    )
    
    assert isinstance(results, list)


@pytest.mark.asyncio
async def test_base_repository_update(test_repository, mock_container):
    """BaseRepository.updateでアイテムが更新されること"""
    existing_user = {
        "id": "user_1",
        "tenantId": "tenant_1",
        "name": "Old Name",
        "email": "old@example.com",
        "created_at": "2026-02-01T00:00:00Z",
        "updated_at": "2026-02-01T00:00:00Z"
    }
    
    updated_user = {
        "id": "user_1",
        "tenantId": "tenant_1",
        "name": "New Name",
        "email": "old@example.com",
        "created_at": "2026-02-01T00:00:00Z",
        "updated_at": "2026-02-01T12:00:00Z"
    }
    
    mock_container.read_item.return_value = existing_user
    mock_container.upsert_item.return_value = updated_user
    
    result = await test_repository.update("user_1", "tenant_1", {"name": "New Name"})
    
    assert result.name == "New Name"
    mock_container.upsert_item.assert_called_once()


@pytest.mark.asyncio
async def test_base_repository_update_not_found(test_repository, mock_container):
    """存在しないアイテムの更新でValueErrorが発生すること"""
    from azure.cosmos.exceptions import CosmosHttpResponseError
    
    # 404エラーをシミュレート
    error = CosmosHttpResponseError(status_code=404, message="Not found")
    mock_container.read_item.side_effect = error
    
    # getメソッドが404をNoneとして返す
    with pytest.raises(ValueError, match="not found"):
        await test_repository.update("user_1", "tenant_1", {"name": "New Name"})


@pytest.mark.asyncio
async def test_base_repository_delete(test_repository, mock_container):
    """BaseRepository.deleteでアイテムが削除されること"""
    mock_container.delete_item.return_value = None
    
    await test_repository.delete("user_1", "tenant_1")
    
    mock_container.delete_item.assert_called_once_with(
        item="user_1",
        partition_key="tenant_1"
    )


@pytest.mark.asyncio
async def test_base_repository_delete_already_deleted(test_repository, mock_container):
    """既に削除されたアイテムの削除は例外を発生させない"""
    from azure.cosmos.exceptions import CosmosHttpResponseError
    
    # 404エラーをシミュレート（既に存在しない）
    error = CosmosHttpResponseError(status_code=404, message="Not found")
    mock_container.delete_item.side_effect = error
    
    # 404エラーは無視される
    await test_repository.delete("user_1", "tenant_1")
    
    mock_container.delete_item.assert_called_once()


@pytest.mark.asyncio
async def test_base_repository_security_tenant_filter_variations(test_repository):
    """様々なテナントIDフィルタ形式が受け入れられること"""
    # c.tenantId形式
    query1 = "SELECT * FROM c WHERE c.tenantId = @tenant_id"
    parameters = [{"name": "@tenant_id", "value": "tenant_1"}]
    
    # c.tenant_id形式（スネークケース）
    query2 = "SELECT * FROM c WHERE c.tenant_id = @tenant_id"
    
    # 大文字小文字を区別しない
    query3 = "SELECT * FROM c WHERE c.TENANTID = @TENANT_ID"
    parameters3 = [{"name": "@TENANT_ID", "value": "tenant_1"}]
    
    class AsyncIteratorMock:
        def __aiter__(self):
            return self
        async def __anext__(self):
            raise StopAsyncIteration
    
    mock_container = Mock()
    mock_container.query_items = Mock(return_value=AsyncIteratorMock())
    
    repo = BaseRepository(mock_container, UserModel)
    
    # 全てのパターンが成功すること
    await repo.query(query1, parameters, partition_key="tenant_1")
    await repo.query(query2, parameters, partition_key="tenant_1")
    await repo.query(query3, parameters3, partition_key="tenant_1")


@pytest.mark.asyncio
async def test_base_repository_list_by_partition(test_repository, mock_container):
    """BaseRepository.list_by_partitionでパーティション内の全アイテムが取得できること"""
    class AsyncIteratorMock:
        def __init__(self, items):
            self.items = items
            self.index = 0
        
        def __aiter__(self):
            return self
        
        async def __anext__(self):
            if self.index >= len(self.items):
                raise StopAsyncIteration
            item = self.items[self.index]
            self.index += 1
            return item
    
    mock_container.query_items = Mock(return_value=AsyncIteratorMock([
        {
            "id": "user_1",
            "tenantId": "tenant_1",
            "name": "User 1",
            "email": "user1@example.com",
            "created_at": "2026-02-01T00:00:00Z",
            "updated_at": "2026-02-01T00:00:00Z"
        },
        {
            "id": "user_2",
            "tenantId": "tenant_1",
            "name": "User 2",
            "email": "user2@example.com",
            "created_at": "2026-02-01T00:00:00Z",
            "updated_at": "2026-02-01T00:00:00Z"
        }
    ]))
    
    results = await test_repository.list_by_partition("tenant_1")
    
    assert len(results) == 2
    assert results[0].name == "User 1"
    assert results[1].name == "User 2"

