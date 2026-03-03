---
name: azure-bicep-reverse-engineer
description:
  Toolkit for reverse-engineering existing Azure infrastructure into Bicep IaC
  code using Azure CLI. Use when asked to investigate, audit, or document existing Azure
  resources, convert Azure deployments to Bicep templates, generate IaC from existing
  infrastructure, analyze Azure resource configurations, or create Bicep code from a
  running Azure environment. Supports all ARM resource types including Container Apps,
  Cosmos DB, Key Vault, Container Registry, App Service, Virtual Networks, and more.
license: Complete terms in LICENSE.txt
---

# Azure リソース調査 → Bicep コード生成スキル

既存の Azure 環境を Azure CLI で系統的に調査し、Bicep IaC コードへ変換する手順を提供するスキルです。

## このスキルを使うタイミング

- 既存の Azure リソースを調査・棚卸したい
- 手動構築された Azure 環境を IaC (Bicep) として再現したい
- Azure リソースの設定・依存関係を把握したい
- デプロイされているリソースから Bicep テンプレートを生成したい
- リソース間の依存関係マップを作成したい

## 前提条件

| ツール    | バージョン | 確認コマンド        |
| --------- | ---------- | ------------------- |
| Azure CLI | 2.50+      | `az --version`      |
| jq        | 1.6+       | `jq --version`      |
| Python    | 3.9+       | `python3 --version` |
| Bicep CLI | 0.20+      | `az bicep version`  |

```bash
# ログイン状態の確認
az account show --output table

# Bicep CLI のインストール（未インストールの場合）
az bicep install
```

## フェーズ概要

| フェーズ        | 内容                                | 参照                                                                   |
| --------------- | ----------------------------------- | ---------------------------------------------------------------------- |
| 1. 事前準備     | サブスクリプション・権限確認        | [workflow-discovery.md](./references/workflow-discovery.md#phase1)     |
| 2. リソース収集 | 全リソースの棚卸と詳細取得          | [workflow-discovery.md](./references/workflow-discovery.md#phase2)     |
| 3. 依存関係分析 | リソース間の依存関係マッピング      | [workflow-discovery.md](./references/workflow-discovery.md#phase3)     |
| 4. Bicep 生成   | リソース定義から Bicep コードへ変換 | [workflow-bicep-gen.md](./references/workflow-bicep-gen.md)            |
| 5. 検証         | 生成した Bicep のバリデーション     | [workflow-bicep-gen.md](./references/workflow-bicep-gen.md#validation) |

## TODO（ワークフロー実行時）

- [ ] Phase 1: 事前準備 — [workflow-discovery.md#phase1](./references/workflow-discovery.md#phase1)
- [ ] Phase 2: リソース収集スクリプト実行 — [scripts/collect_resources.sh](./scripts/collect_resources.sh)
- [ ] Phase 3: 依存関係分析 — [workflow-discovery.md#phase3](./references/workflow-discovery.md#phase3)
- [ ] Phase 4: Bicep コード生成 — [workflow-bicep-gen.md](./references/workflow-bicep-gen.md)
- [ ] Phase 5: Bicep 検証 — `az bicep build` および `az deployment group validate`

## 利用可能なスクリプト

[collect_resources.sh](./scripts/collect_resources.sh) を実行してリソース情報を一括収集します。

```bash
# 基本使用法（対話的にRGを選択）
bash .github/skills/azure-bicep-reverse-engineer/scripts/collect_resources.sh

# リソースグループを指定して実行
bash .github/skills/azure-bicep-reverse-engineer/scripts/collect_resources.sh \
  --resource-group rg-my-project-dev \
  --output ./infra/discovered

# サブスクリプション全体を対象
bash .github/skills/azure-bicep-reverse-engineer/scripts/collect_resources.sh \
  --all-resource-groups \
  --output ./infra/discovered
```

## Bicep テンプレートのスキャフォールド

[templates/bicep-scaffold.bicep](./templates/bicep-scaffold.bicep) を起点として Bicep コードを生成します。

## 詳細参照

- [リソース収集ワークフロー詳細](./references/workflow-discovery.md)
- [Bicep 生成ワークフロー詳細](./references/workflow-bicep-gen.md)
- [Azure リソースタイプ早見表](./references/azure-resource-types.md)
