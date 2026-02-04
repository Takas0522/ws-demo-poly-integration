# FAQ (よくある質問)

## ドキュメント情報

- **バージョン**: 1.0.0
- **最終更新日**: 2024年
- **対象**: すべてのプロジェクト関係者

---

## 目次

1. [一般的な質問](#1-一般的な質問)
2. [開発環境](#2-開発環境)
3. [アーキテクチャ](#3-アーキテクチャ)
4. [認証・認可](#4-認証認可)
5. [データベース](#5-データベース)
6. [デプロイメント](#6-デプロイメント)
7. [トラブルシューティング](#7-トラブルシューティング)
8. [運用・保守](#8-運用保守)

---

## 1. 一般的な質問

### Q1.1: このプロジェクトの目的は何ですか？

**A**: 複数のマイクロサービスを統合管理するマルチテナント対応の管理アプリケーションのPoCです。テナント管理、ユーザー管理、サービス設定機能を提供します。

---

### Q1.2: PoCとは何ですか？どのような制約がありますか？

**A**: PoC（Proof of Concept：概念実証）は、アイデアや技術の実現可能性を検証するためのプロトタイプです。

**制約事項**:
- エンタープライズレベルのセキュリティは未実装
- 高可用性構成は未実装
- ディザスタリカバリは未実装
- 最小コストでの構築を優先
- 必要最小限の機能実装

詳細は [アーキテクチャ概要 - 制約と前提](../arch/overview.md#13-制約と前提) を参照してください。

---

### Q1.3: どのような技術スタックを使用していますか？

**A**:
- **フロントエンド**: Next.js 14, React, TypeScript, Tailwind CSS
- **バックエンド**: FastAPI (Python 3.11+)
- **データベース**: Azure Cosmos DB (NoSQL API)
- **インフラ**: Azure (App Service, Container Apps)
- **IaC**: Azure Bicep

詳細は [アーキテクチャ概要 - 技術スタック](../arch/overview.md#4-技術スタック) を参照してください。

---

### Q1.4: ドキュメントはどこにありますか？

**A**: すべてのドキュメントは `docs/` ディレクトリにあります。

**主要ドキュメント**:
- [ドキュメントIndex](./README.md)
- [プロジェクト概要](./init.md)
- [アーキテクチャ概要](./arch/overview.md)
- [API設計仕様書](./arch/api/api-specification.md)
- [データ設計](./arch/data/data-model.md)

---

## 2. 開発環境

### Q2.1: 開発環境のセットアップ方法は？

**A**: DevContainer を使用します。

**手順**:
1. VS Code でプロジェクトを開く
2. コマンドパレット (Ctrl+Shift+P) を開く
3. "Dev Containers: Reopen in Container" を選択
4. コンテナのビルドと起動を待つ

詳細は [README.md - セットアップ](../README.md#セットアップ) を参照してください。

---

### Q2.2: DevContainer が起動しない場合は？

**A**: 以下を確認してください：

```bash
# Docker Desktop が起動しているか確認
docker ps

# コンテナを再ビルド
# VS Code: "Dev Containers: Rebuild Container"

# キャッシュをクリアして再ビルド
# VS Code: "Dev Containers: Rebuild Container Without Cache"
```

詳細は [トラブルシューティング - Q1](../README.md#q1-devcontainerが起動しない) を参照してください。

---

### Q2.3: ローカルでサービスを起動する方法は？

**A**: 各サービスディレクトリで起動コマンドを実行します。

```bash
# Frontend
cd src/front
npm run dev

# 認証認可サービス
cd src/auth-service
uvicorn app.main:app --reload --host 0.0.0.0 --port 8001

# テナント管理サービス
cd src/tenant-management-service
uvicorn app.main:app --reload --host 0.0.0.0 --port 8002

# 利用サービス設定サービス
cd src/service-setting-service
uvicorn app.main:app --reload --host 0.0.0.0 --port 8003
```

詳細は各サービスの README を参照してください。

---

### Q2.4: Cosmos DB Emulator に接続できない場合は？

**A**: 以下を確認してください：

```bash
# Emulator が起動しているか確認
docker ps | grep cosmos

# ログ確認
docker logs cosmosdb-emulator

# 再起動
docker-compose restart cosmosdb

# ブラウザでアクセス
# https://localhost:8081/_explorer/index.html
```

---

## 3. アーキテクチャ

### Q3.1: マイクロサービスアーキテクチャを採用した理由は？

**A**: 以下の理由からマイクロサービスアーキテクチャを採用しました：

- **疎結合**: 各サービスが独立してデプロイ・スケール可能
- **開発効率**: チーム間で並行開発が可能
- **技術選択の柔軟性**: サービスごとに最適な技術を選択可能
- **障害の隔離**: 1つのサービスの障害が他に影響しにくい

詳細は [アーキテクチャ概要 - アーキテクチャスタイル](../arch/overview.md#2-アーキテクチャスタイル) を参照してください。

---

### Q3.2: BFF（Backend for Frontend）とは何ですか？

**A**: フロントエンド専用のバックエンド層です。

**役割**:
- バックエンドサービスへのAPIリクエスト集約
- フロントエンドに最適化されたデータ形式の提供
- モックサービスのデータ返却
- 認証トークンの管理

本プロジェクトでは Next.js の API Routes が BFF として機能します。

詳細は [アーキテクチャ概要 - BFF](../arch/overview.md#51-frontend-nextjs) を参照してください。

---

### Q3.3: サービス間の通信方法は？

**A**: RESTful API による同期通信を使用します。

**通信フロー**:
```
ブラウザ → Next.js BFF → バックエンドサービス → Cosmos DB
```

- BFF はバックエンドサービスに HTTP リクエストを送信
- 認証は JWT トークンで実施
- エラーハンドリングは各レイヤーで実施

詳細は [アーキテクチャ概要 - データフロー](../arch/overview.md#6-データフロー) を参照してください。

---

### Q3.4: なぜ Cosmos DB を選択したのですか？

**A**: 以下の理由から Cosmos DB を選択しました：

- **スキーマレス**: PoCの柔軟な開発に適している
- **マネージドサービス**: 運用コストが低い
- **パーティショニング**: マルチテナントに適している
- **Azure統合**: Azure環境との統合が容易

詳細は [データ設計 - データベース概要](../arch/data/data-model.md#1-データベース概要) を参照してください。

---

## 4. 認証・認可

### Q4.1: 認証方式は何ですか？

**A**: JWT（JSON Web Token）ベース認証を使用します。

**認証フロー**:
1. ユーザーが ID/パスワードでログイン
2. 認証サービスが JWT を発行
3. フロントエンドが JWT を保存
4. 以降のリクエストに JWT を含める
5. 各サービスが JWT を検証

詳細は [アーキテクチャ概要 - 認証認可モデル](../arch/overview.md#7-認証認可モデル) を参照してください。

---

### Q4.2: JWT の有効期限は？

**A**: デフォルトで **24時間** です。

環境変数で変更可能：
```bash
JWT_EXPIRATION_MINUTES=1440  # 24時間
```

リフレッシュトークンはPoCのため未実装です。

---

### Q4.3: ロールベースアクセス制御（RBAC）の仕組みは？

**A**: サービスごとにロールを定義し、ユーザーに割り当てます。

**主要ロール**:
- **全体管理者**: すべての操作が可能
- **管理者**: 通常のテナント・ユーザー管理が可能
- **閲覧者**: 情報の参照のみ可能

**ロールチェック**:
```python
@router.delete("/tenants/{tenant_id}")
async def delete_tenant(
    tenant_id: str,
    current_user: User = Depends(require_role("管理者"))
):
    # 管理者のみアクセス可能
    pass
```

詳細は [アーキテクチャ概要 - 認可モデル](../arch/overview.md#72-認可モデル) を参照してください。

---

### Q4.4: 特権テナントとは何ですか？

**A**: システム管理を行う特別なテナントです。

**特徴**:
- システムに1つのみ存在
- 削除・編集不可
- ユーザーの追加・削除は「全体管理者」のみ可能
- 本アプリへのログインは特権テナント所属ユーザーのみ

詳細は [プロジェクト概要 - 特権テナント](./init.md#特権テナントについて) を参照してください。

---

## 5. データベース

### Q5.1: データモデルの構造は？

**A**: 3つのデータベースに分かれています：

1. **tenant_management**: テナント管理データ
   - tenants（テナント）
   - tenant_users（テナントユーザー）

2. **auth_management**: 認証認可データ
   - users（ユーザー）
   - roles（ロール）
   - user_roles（ユーザーロール）

3. **service_management**: サービス管理データ
   - services（サービス）
   - tenant_services（テナントサービス）

詳細は [データ設計](../arch/data/data-model.md) を参照してください。

---

### Q5.2: パーティションキーの設計は？

**A**: 各コンテナで以下のパーティションキーを使用：

| コンテナ | パーティションキー | 理由 |
|---------|-----------------|------|
| tenants | `id` (tenant_id) | テナント単位でのデータ分離 |
| users | `id` (user_id) | ユーザー単位でのデータ分離 |
| tenant_users | `tenant_id` | テナント単位でのクエリ最適化 |
| tenant_services | `tenant_id` | テナント単位でのクエリ最適化 |

詳細は [データ設計 - パーティションキー戦略](../arch/data/data-model.md#3-コンテナ設計) を参照してください。

---

### Q5.3: データのバックアップは？

**A**: Cosmos DB は自動バックアップが有効です。

- **バックアップ間隔**: 4時間ごと
- **保持期間**: 7日間
- **復元方法**: Point-in-Time Restore

詳細は [運用保守ガイド - バックアップ](./運用保守ガイド.md#3-バックアップとリストア) を参照してください。

---

### Q5.4: クエリのパフォーマンス最適化方法は？

**A**: 以下の方法で最適化します：

1. **パーティションキーを指定**
```python
container.query_items(
    query="SELECT * FROM c WHERE c.tenant_id = @tenant_id",
    partition_key=tenant_id  # 指定することでクロスパーティションクエリを回避
)
```

2. **インデックスの最適化**
   - よく使用されるフィールドにインデックスを作成
   - 不要なフィールドはインデックスから除外

3. **クエリの最適化**
   - SELECT * を避け、必要なフィールドのみ取得
   - WHERE句でフィルタリング

詳細は [運用保守ガイド - パフォーマンスチューニング](./運用保守ガイド.md#5-パフォーマンスチューニング) を参照してください。

---

## 6. デプロイメント

### Q6.1: デプロイ方法は？

**A**: Bicep を使用した IaC デプロイです。

**手順**:
```bash
# 1. Bicep テンプレートのバリデーション
az deployment group validate \
  --resource-group rg-poc-dev \
  --template-file main.bicep \
  --parameters @parameters.dev.json

# 2. デプロイ実行
az deployment group create \
  --resource-group rg-poc-dev \
  --template-file main.bicep \
  --parameters @parameters.dev.json
```

詳細は [デプロイ手順書](./デプロイ手順書.md) を参照してください。

---

### Q6.2: CI/CD パイプラインは構築されていますか？

**A**: GitHub Actions のテンプレートを用意しています。

```yaml
# .github/workflows/deploy.yml
name: Deploy to Azure
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Azure Login
        uses: azure/login@v1
      # デプロイ処理
```

詳細は [デプロイ手順書 - CI/CD](./デプロイ手順書.md#8-cicd-パイプライン) を参照してください。

---

### Q6.3: ロールバック方法は？

**A**: 以下の方法でロールバックできます：

**アプリケーション**:
```bash
# Container Apps の前のリビジョンに戻す
az containerapp revision activate \
  --name ca-auth-service \
  --resource-group rg-poc-prod \
  --revision <previous-revision-name>
```

**インフラ**:
```bash
# 前回のデプロイメントを再実行
az deployment group create \
  --resource-group rg-poc-prod \
  --template-file main.bicep \
  --parameters @parameters.prod.json
```

詳細は [デプロイ手順書 - ロールバック](./デプロイ手順書.md#6-ロールバック手順) を参照してください。

---

### Q6.4: 本番環境への初回デプロイ手順は？

**A**: 以下の順序でデプロイします：

1. **インフラストラクチャデプロイ**（Bicep）
2. **データベース初期化**
3. **バックエンドサービスデプロイ**
4. **フロントエンドデプロイ**
5. **動作確認**

詳細は [デプロイ手順書](./デプロイ手順書.md) を参照してください。

---

## 7. トラブルシューティング

### Q7.1: サービスが起動しない場合は？

**A**: 以下を確認してください：

```bash
# 1. 環境変数を確認
env | grep COSMOS

# 2. 依存サービスの状態確認
docker ps

# 3. ログ確認
docker logs <container_name>

# 4. サービス再起動
docker-compose restart <service_name>
```

詳細は [運用保守ガイド - トラブルシューティング](./運用保守ガイド.md#4-トラブルシューティング) を参照してください。

---

### Q7.2: 認証エラー（401 Unauthorized）が発生する場合は？

**A**: 以下を確認してください：

```bash
# JWT_SECRET が一致しているか確認
echo $JWT_SECRET

# 新しいトークンを取得
curl -X POST http://localhost:8001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password"}'

# トークンが有効期限内か確認
# JWT デコーダーで exp フィールドを確認
```

---

### Q7.3: データベース接続エラーが発生する場合は？

**A**: 以下を確認してください：

```bash
# Cosmos DB Emulator が起動しているか
docker ps | grep cosmos

# 接続文字列を確認
echo $COSMOS_ENDPOINT
echo $COSMOS_KEY

# ブラウザでアクセス可能か確認
# https://localhost:8081/_explorer/index.html
```

---

### Q7.4: パフォーマンスが遅い場合は？

**A**: 以下を確認してください：

1. **Application Insights でスローなリクエストを特定**
2. **Cosmos DB の RU 消費を確認**
3. **クエリの最適化**
   - パーティションキーを指定
   - 不要なフィールドを取得しない
4. **インデックスの最適化**

詳細は [運用保守ガイド - パフォーマンスチューニング](./運用保守ガイド.md#5-パフォーマンスチューニング) を参照してください。

---

## 8. 運用・保守

### Q8.1: 日常的な監視項目は？

**A**: 以下を監視してください：

- **ヘルスチェック**: 全サービスの稼働状況
- **エラーログ**: Application Insights でエラー確認
- **Cosmos DB RU**: RU 消費量の監視
- **レスポンスタイム**: API のパフォーマンス監視

詳細は [運用保守ガイド - 日常運用](./運用保守ガイド.md#1-日常運用) を参照してください。

---

### Q8.2: アラートの設定方法は？

**A**: Application Insights でアラートを設定します。

**推奨アラート**:
- 高エラーレート（> 5%）
- レスポンス遅延（> 3秒）
- 可用性低下（< 99%）

詳細は [運用保守ガイド - アラート設定](./運用保守ガイド.md#22-アラート設定) を参照してください。

---

### Q8.3: 定期メンテナンスの内容は？

**A**: 以下のメンテナンスを実施してください：

**月次**:
- パフォーマンスレビュー
- コストレビュー
- セキュリティパッチ適用
- ログアーカイブ

**四半期**:
- 災害復旧訓練
- セキュリティ監査
- キャパシティプランニング

詳細は [運用保守ガイド - 定期メンテナンス](./運用保守ガイド.md#7-定期メンテナンス) を参照してください。

---

### Q8.4: サポートへの問い合わせ方法は？

**A**: GitHub Issues で問い合わせてください。

- **技術的な質問**: `question` ラベル
- **バグ報告**: `bug` ラベル
- **機能要望**: `enhancement` ラベル
- **ドキュメント改善**: `documentation` ラベル

緊急時は [運用保守ガイド - 連絡先](./運用保守ガイド.md#8-連絡先) を参照してください。

---

## 質問の追加

このFAQに追加してほしい質問がある場合は、GitHub Issues で提案してください。

---

## 更新履歴

| バージョン | 日付 | 変更内容 | 作成者 |
|-----------|------|---------|-------|
| 1.0.0 | 2024 | 初版作成 | Document Updater Agent |
