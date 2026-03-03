#!/usr/bin/env bash
# =============================================================================
# collect_resources.sh
# Azure リソース一括収集スクリプト
#
# 使用法:
#   bash collect_resources.sh [OPTIONS]
#
# Options:
#   -g, --resource-group RG   対象リソースグループ名（省略時は対話選択）
#   -a, --all-resource-groups 全リソースグループを対象にする
#   -o, --output DIR          出力ディレクトリ（デフォルト: ./discovered）
#   -s, --subscription ID     対象サブスクリプションID
#   -h, --help                このヘルプを表示
#
# 前提条件:
#   - Azure CLI がインストール済みでログイン済みであること (az account show)
#   - jq がインストール済みであること
#
# セキュリティ:
#   - シークレット値・接続文字列・キーは収集しません
#   - Key Vault のシークレット値は取得しません
# =============================================================================

set -euo pipefail

# =============================================================================
# 定数・デフォルト値
# =============================================================================
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUTPUT_DIR="./discovered"
TARGET_RG=""
ALL_RGS=false
SUBSCRIPTION=""

# =============================================================================
# ユーティリティ関数
# =============================================================================
log_info()    { echo "[INFO]  $*"; }
log_success() { echo "[OK]    $*"; }
log_warn()    { echo "[WARN]  $*" >&2; }
log_error()   { echo "[ERROR] $*" >&2; }

usage() {
  sed -n '/#/,/^$/p' "$0" | grep '^#' | sed 's/^# \{0,2\}//' | head -20
  exit 0
}

check_prerequisites() {
  local missing=0
  if ! command -v az &>/dev/null; then
    log_error "Azure CLI (az) が見つかりません。インストールしてください。"
    missing=1
  fi
  if ! command -v jq &>/dev/null; then
    log_error "jq が見つかりません。インストールしてください: sudo apt-get install jq"
    missing=1
  fi
  if [[ $missing -eq 1 ]]; then
    exit 1
  fi

  # ログイン確認
  if ! az account show &>/dev/null; then
    log_error "Azure CLI にログインしていません。'az login' を実行してください。"
    exit 1
  fi
  log_success "前提条件チェック完了"
}

# =============================================================================
# 引数解析
# =============================================================================
parse_args() {
  while [[ $# -gt 0 ]]; do
    case "$1" in
      -g|--resource-group)
        TARGET_RG="$2"; shift 2;;
      -a|--all-resource-groups)
        ALL_RGS=true; shift;;
      -o|--output)
        OUTPUT_DIR="$2"; shift 2;;
      -s|--subscription)
        SUBSCRIPTION="$2"; shift 2;;
      -h|--help)
        usage;;
      *)
        log_error "不明なオプション: $1"; usage;;
    esac
  done
}

# =============================================================================
# サブスクリプション設定
# =============================================================================
setup_subscription() {
  if [[ -n "$SUBSCRIPTION" ]]; then
    log_info "サブスクリプションを設定: $SUBSCRIPTION"
    az account set --subscription "$SUBSCRIPTION"
  fi
  local sub_name
  sub_name=$(az account show --query name -o tsv)
  local sub_id
  sub_id=$(az account show --query id -o tsv)
  log_info "対象サブスクリプション: $sub_name ($sub_id)"
  echo "$sub_id"
}

# =============================================================================
# リソースグループ選択
# =============================================================================
select_resource_groups() {
  if [[ "$ALL_RGS" == true ]]; then
    az group list --query "[].name" -o tsv
    return
  fi

  if [[ -n "$TARGET_RG" ]]; then
    # 存在確認
    if ! az group show --name "$TARGET_RG" &>/dev/null; then
      log_error "リソースグループ '$TARGET_RG' が見つかりません。"
      exit 1
    fi
    echo "$TARGET_RG"
    return
  fi

  # 対話選択
  log_info "利用可能なリソースグループ:"
  az group list --query "[].{名前:name, 場所:location, 状態:properties.provisioningState}" \
    --output table
  echo ""
  read -rp "対象リソースグループ名を入力してください: " TARGET_RG
  echo "$TARGET_RG"
}

# =============================================================================
# リソースグループ基本情報収集
# =============================================================================
collect_resource_group_info() {
  local rg="$1"
  local out_dir="$2"

  log_info "[$rg] リソース一覧を収集中..."
  az resource list \
    --resource-group "$rg" \
    --output json 2>/dev/null > "${out_dir}/${rg}-resources.json"

  local count
  count=$(jq length "${out_dir}/${rg}-resources.json")
  log_success "[$rg] ${count} 件のリソースを収集"

  # RBAC
  log_info "[$rg] ロール割り当てを収集中..."
  local sub_id
  sub_id=$(az account show --query id -o tsv)
  az role assignment list \
    --scope "/subscriptions/${sub_id}/resourceGroups/${rg}" \
    --output json 2>/dev/null > "${out_dir}/${rg}-role-assignments.json"

  # マネージドID
  log_info "[$rg] マネージドIDを収集中..."
  az identity list --resource-group "$rg" --output json 2>/dev/null \
    > "${out_dir}/${rg}-managed-identities.json"
}

# =============================================================================
# Container Apps 収集
# =============================================================================
collect_container_apps() {
  local rg="$1"
  local out_dir="$2"

  local env_count
  env_count=$(az containerapp env list -g "$rg" --query "length(@)" -o tsv 2>/dev/null || echo 0)
  if [[ "$env_count" -eq 0 ]]; then return; fi

  log_info "[$rg] Container Apps 環境を収集中... (${env_count}件)"
  az containerapp env list --resource-group "$rg" --output json 2>/dev/null \
    > "${out_dir}/${rg}-containerapp-envs.json"

  local app_count
  app_count=$(az containerapp list -g "$rg" --query "length(@)" -o tsv 2>/dev/null || echo 0)
  log_info "[$rg] Container Apps を収集中... (${app_count}件)"
  az containerapp list --resource-group "$rg" --output json 2>/dev/null \
    > "${out_dir}/${rg}-containerapps.json"

  # 個別アプリの詳細（シークレット値は除外）
  for app in $(az containerapp list -g "$rg" --query "[].name" -o tsv 2>/dev/null); do
    az containerapp show -g "$rg" -n "$app" \
      --query "{name:name, location:location, identity:identity, properties: {
        environmentId: properties.environmentId,
        configuration: {
          ingress: properties.configuration.ingress,
          registries: properties.configuration.registries,
          activeRevisionsMode: properties.configuration.activeRevisionsMode,
          dapr: properties.configuration.dapr
        },
        template: properties.template
      }}" \
      --output json 2>/dev/null > "${out_dir}/${rg}-containerapp-${app}.json"
  done
  log_success "[$rg] Container Apps 収集完了"
}

# =============================================================================
# Cosmos DB 収集
# =============================================================================
collect_cosmos_db() {
  local rg="$1"
  local out_dir="$2"

  local count
  count=$(az cosmosdb list -g "$rg" --query "length(@)" -o tsv 2>/dev/null || echo 0)
  if [[ "$count" -eq 0 ]]; then return; fi

  log_info "[$rg] Cosmos DB アカウントを収集中... (${count}件)"
  az cosmosdb list --resource-group "$rg" --output json 2>/dev/null \
    > "${out_dir}/${rg}-cosmosdb-accounts.json"

  for account in $(az cosmosdb list -g "$rg" --query "[].name" -o tsv 2>/dev/null); do
    # アカウント詳細
    az cosmosdb show -g "$rg" -n "$account" --output json 2>/dev/null \
      > "${out_dir}/${rg}-cosmosdb-${account}.json"

    # SQL データベース
    az cosmosdb sql database list -g "$rg" -a "$account" --output json 2>/dev/null \
      > "${out_dir}/${rg}-cosmosdb-${account}-databases.json"

    # 各データベースのコンテナ
    for db in $(az cosmosdb sql database list -g "$rg" -a "$account" \
                  --query "[].name" -o tsv 2>/dev/null); do
      az cosmosdb sql container list -g "$rg" -a "$account" -d "$db" \
        --output json 2>/dev/null \
        > "${out_dir}/${rg}-cosmosdb-${account}-${db}-containers.json"
    done
  done
  log_success "[$rg] Cosmos DB 収集完了"
}

# =============================================================================
# Container Registry 収集
# =============================================================================
collect_container_registry() {
  local rg="$1"
  local out_dir="$2"

  local count
  count=$(az acr list -g "$rg" --query "length(@)" -o tsv 2>/dev/null || echo 0)
  if [[ "$count" -eq 0 ]]; then return; fi

  log_info "[$rg] Container Registry を収集中... (${count}件)"
  az acr list --resource-group "$rg" --output json 2>/dev/null \
    > "${out_dir}/${rg}-acr.json"

  for acr in $(az acr list -g "$rg" --query "[].name" -o tsv 2>/dev/null); do
    az acr show -g "$rg" -n "$acr" --output json 2>/dev/null \
      > "${out_dir}/${rg}-acr-${acr}.json"
  done
  log_success "[$rg] Container Registry 収集完了"
}

# =============================================================================
# Key Vault 収集（シークレット値は取得しない）
# =============================================================================
collect_key_vault() {
  local rg="$1"
  local out_dir="$2"

  local count
  count=$(az keyvault list -g "$rg" --query "length(@)" -o tsv 2>/dev/null || echo 0)
  if [[ "$count" -eq 0 ]]; then return; fi

  log_info "[$rg] Key Vault を収集中... (${count}件)"
  az keyvault list --resource-group "$rg" --output json 2>/dev/null \
    > "${out_dir}/${rg}-keyvaults.json"

  for kv in $(az keyvault list -g "$rg" --query "[].name" -o tsv 2>/dev/null); do
    # シークレット値・キーマテリアルは含めない、メタデータのみ
    az keyvault show -g "$rg" -n "$kv" \
      --query "{name:name, location:location, properties: {
        sku: properties.sku,
        enableRbacAuthorization: properties.enableRbacAuthorization,
        enableSoftDelete: properties.enableSoftDelete,
        softDeleteRetentionInDays: properties.softDeleteRetentionInDays,
        enablePurgeProtection: properties.enablePurgeProtection,
        networkAcls: properties.networkAcls,
        accessPolicies: properties.accessPolicies
      }}" \
      --output json 2>/dev/null > "${out_dir}/${rg}-keyvault-${kv}.json"
  done
  log_success "[$rg] Key Vault 収集完了（シークレット値は除外）"
}

# =============================================================================
# App Service 収集
# =============================================================================
collect_app_service() {
  local rg="$1"
  local out_dir="$2"

  local count
  count=$(az webapp list -g "$rg" --query "length(@)" -o tsv 2>/dev/null || echo 0)
  if [[ "$count" -eq 0 ]]; then return; fi

  log_info "[$rg] App Service を収集中... (${count}件)"
  az webapp list --resource-group "$rg" --output json 2>/dev/null \
    > "${out_dir}/${rg}-webapps.json"

  # App Service プランも収集
  az appservice plan list --resource-group "$rg" --output json 2>/dev/null \
    > "${out_dir}/${rg}-appservice-plans.json"

  log_success "[$rg] App Service 収集完了"
}

# =============================================================================
# 監視系コンポーネント収集
# =============================================================================
collect_monitoring() {
  local rg="$1"
  local out_dir="$2"

  log_info "[$rg] Log Analytics Workspace を収集中..."
  az monitor log-analytics workspace list -g "$rg" --output json 2>/dev/null \
    > "${out_dir}/${rg}-log-analytics.json"

  log_info "[$rg] Application Insights を収集中..."
  az monitor app-insights component list -g "$rg" --output json 2>/dev/null \
    > "${out_dir}/${rg}-app-insights.json"

  log_success "[$rg] 監視系コンポーネント収集完了"
}

# =============================================================================
# ネットワーク系収集
# =============================================================================
collect_networking() {
  local rg="$1"
  local out_dir="$2"

  local vnet_count
  vnet_count=$(az network vnet list -g "$rg" --query "length(@)" -o tsv 2>/dev/null || echo 0)
  if [[ "$vnet_count" -gt 0 ]]; then
    log_info "[$rg] VNet / NSG / Public IP を収集中..."
    az network vnet list -g "$rg" --output json 2>/dev/null \
      > "${out_dir}/${rg}-vnets.json"
    az network nsg list -g "$rg" --output json 2>/dev/null \
      > "${out_dir}/${rg}-nsgs.json"
    az network public-ip list -g "$rg" --output json 2>/dev/null \
      > "${out_dir}/${rg}-public-ips.json"
    log_success "[$rg] ネットワーク収集完了"
  fi
}

# =============================================================================
# サマリレポート生成
# =============================================================================
generate_summary() {
  local rg="$1"
  local out_dir="$2"

  local summary_file="${out_dir}/${rg}-summary.md"
  local sub_id
  sub_id=$(az account show --query id -o tsv)
  local sub_name
  sub_name=$(az account show --query name -o tsv)

  {
    echo "# リソース収集サマリ: ${rg}"
    echo ""
    echo "- **収集日時**: $(date '+%Y-%m-%d %H:%M:%S')"
    echo "- **サブスクリプション**: ${sub_name} (${sub_id})"
    echo "- **リソースグループ**: ${rg}"
    echo ""
    echo "## 収集リソース数"
    echo ""

    local resources_file="${out_dir}/${rg}-resources.json"
    if [[ -f "$resources_file" ]]; then
      echo "| リソースタイプ | 件数 |"
      echo "|--------------|------|"
      jq -r '[.[] | .type] | group_by(.) | .[] | "| \(.[0]) | \(length) |"' \
        "$resources_file"
    fi

    echo ""
    echo "## 収集ファイル一覧"
    echo ""
    ls -1 "${out_dir}/${rg}-"* 2>/dev/null | sed "s|${out_dir}/|- |"
  } > "$summary_file"

  log_success "[$rg] サマリレポート生成: $summary_file"
}

# =============================================================================
# メイン処理
# =============================================================================
main() {
  parse_args "$@"
  check_prerequisites

  local sub_id
  sub_id=$(setup_subscription)

  # 出力ディレクトリ作成
  mkdir -p "$OUTPUT_DIR"
  log_info "出力先: $(realpath "$OUTPUT_DIR")"

  # サブスクリプション全体を JSON で保存
  az account show --output json > "${OUTPUT_DIR}/subscription.json"
  az group list --output json > "${OUTPUT_DIR}/resource-groups.json"

  # 対象リソースグループを取得
  mapfile -t TARGET_RGS < <(select_resource_groups)

  for rg in "${TARGET_RGS[@]}"; do
    log_info "========================================"
    log_info "リソースグループ: $rg"
    log_info "========================================"

    local rg_out_dir="${OUTPUT_DIR}"
    mkdir -p "$rg_out_dir"

    collect_resource_group_info "$rg" "$rg_out_dir"
    collect_container_apps       "$rg" "$rg_out_dir"
    collect_cosmos_db            "$rg" "$rg_out_dir"
    collect_container_registry   "$rg" "$rg_out_dir"
    collect_key_vault            "$rg" "$rg_out_dir"
    collect_app_service          "$rg" "$rg_out_dir"
    collect_monitoring           "$rg" "$rg_out_dir"
    collect_networking           "$rg" "$rg_out_dir"
    generate_summary             "$rg" "$rg_out_dir"

    log_success "[$rg] 全リソース収集完了"
  done

  log_success "========================================"
  log_success "収集完了。出力先: $(realpath "$OUTPUT_DIR")"
  log_success "次のステップ: workflow-bicep-gen.md を参照して Bicep を生成してください。"
  log_success "========================================"
}

main "$@"
