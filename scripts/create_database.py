#!/usr/bin/env python3
"""
Cosmos DB データベースとコンテナを作成するスクリプト
"""
import sys
import os

# プロジェクトルートをパスに追加
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'src'))

from shared.cosmos_client import CosmosDBClient


def create_auth_database():
    """認証認可データベース作成"""
    print("\n=== auth_management データベース作成 ===")
    
    client = CosmosDBClient(database_name="auth_management")
    client.create_database()
    
    # users コンテナ
    client.create_container("users", partition_key_path="/id")
    
    # roles コンテナ
    client.create_container("roles", partition_key_path="/serviceId")
    
    print("✓ auth_management セットアップ完了\n")


def create_tenant_database():
    """テナント管理データベース作成"""
    print("=== tenant_management データベース作成 ===")
    
    client = CosmosDBClient(database_name="tenant_management")
    client.create_database()
    
    # tenants コンテナ
    client.create_container("tenants", partition_key_path="/id")
    
    print("✓ tenant_management セットアップ完了\n")


def create_service_database():
    """サービス設定データベース作成"""
    print("=== service_management データベース作成 ===")
    
    client = CosmosDBClient(database_name="service_management")
    client.create_database()
    
    # services コンテナ
    client.create_container("services", partition_key_path="/id")
    
    # tenant_services コンテナ（テナント-サービス紐付け）
    client.create_container("tenant_services", partition_key_path="/tenantId")
    
    print("✓ service_management セットアップ完了\n")


if __name__ == "__main__":
    print("=== Cosmos DB セットアップ開始 ===\n")
    
    try:
        create_auth_database()
        create_tenant_database()
        create_service_database()
        
        print("=== すべてのデータベースセットアップ完了 ===")
    except Exception as e:
        print(f"✗ エラー: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
