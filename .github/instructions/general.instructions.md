---
applyTo: "**/*"
---

# 開発環境について

- 開発環境はDatabase含めDevContainerで構築されています
- CosmosDBエミュレーターはDocker-in-Dockerで動作しています。post-createコマンドの中で起動と初期化が実行されています。
- 開発や仕様に関わるドキュメントは `docs` にまとめられています
  - `docs`のルートディレクトリにIndexがあるため、そちらを参照し関連文書を検索してください

# リポジトリ構成について

- 本リポジトリはPolyrepo構成を採用しており、各サービスはGit Submoduleとして管理されています
- `src/` 配下の各サービスディレクトリは独立したGitリポジトリです
  - `src/front` — フロントエンド（Next.js）
  - `src/auth-service` — 認証認可サービス（FastAPI）
  - `src/tenant-management-service` — テナント管理サービス（FastAPI）
  - `src/service-setting-service` — 利用サービス設定サービス（FastAPI）
- クローン時は `git clone --recursive` または `git submodule update --init --recursive` が必要です
- 各サブモジュール内での変更は、そのサブモジュールのリポジトリ内で個別にcommit/pushする必要があります
- 親リポジトリではサブモジュールの参照コミットを管理します
