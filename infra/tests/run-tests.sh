#!/bin/bash

################################################################################
# テスト実行メインスクリプト
#
# 目的: インフラ基盤構築の全テストを統合実行し、結果をレポート
# 使用方法: ./run-tests.sh [--all|--quick|--category <category>]
#
# カテゴリ:
#   - validation: 構文・Linter・パラメータ検証
#   - deployment: ARM検証・What-If分析
#   - security: セキュリティ設定検証
#   - all: 全テスト実行
################################################################################

# カラー定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# グローバル変数
SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0
SKIPPED_TESTS=0
START_TIME=$(date +%s)

################################################################################
# ログ関数
################################################################################

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_test_result() {
    local test_id="$1"
    local test_name="$2"
    local result="$3"
    
    case "$result" in
        PASS)
            echo -e "${GREEN}[✓]${NC} $test_id: $test_name - PASS"
            ((PASSED_TESTS++))
            ;;
        FAIL)
            echo -e "${RED}[✗]${NC} $test_id: $test_name - FAIL"
            ((FAILED_TESTS++))
            ;;
        SKIP)
            echo -e "${YELLOW}[-]${NC} $test_id: $test_name - SKIP"
            ((SKIPPED_TESTS++))
            ;;
    esac
    ((TOTAL_TESTS++))
}

log_test_skip() {
    local test_id="$1"
    local reason="${2:-統合テストでカバー済み}"
    echo -e "${YELLOW}[-]${NC} $test_id: SKIP - $reason"
    ((SKIPPED_TESTS++))
}

################################################################################
# 使用方法表示
################################################################################

usage() {
    cat << EOF
Usage: $0 [OPTIONS]

Options:
  --all              Run all tests (default)
  --quick            Run only high-priority tests
  --category <name>  Run specific category tests (validation|deployment|security)
  --ci               CI/CD mode (skip Azure login required tests)
  --report           Generate detailed report
  --help             Show this help message

Examples:
  $0 --all           # Run all tests
  $0 --quick         # Quick test for development
  $0 --category validation  # Run only validation tests
  $0 --ci            # Run in CI/CD mode
EOF
}

################################################################################
# 前提条件チェック
################################################################################

check_prerequisites() {
    log_info "Checking prerequisites..."
    
    local all_ok=true
    
    # Azure CLI
    if ! check_azure_cli; then
        all_ok=false
    fi
    
    # Bicep CLI
    if ! check_bicep_cli; then
        all_ok=false
    fi
    
    # Required files
    if ! check_required_files; then
        all_ok=false
    fi
    
    if $all_ok; then
        log_info "All prerequisites met"
        return 0
    else
        log_error "Prerequisites not met"
        return 1
    fi
}

check_azure_cli() {
    if command -v az &> /dev/null; then
        local version=$(az version --query '"azure-cli"' -o tsv 2>/dev/null || echo "unknown")
        log_info "Azure CLI: $version"
        return 0
    else
        log_error "Azure CLI not found"
        return 1
    fi
}

check_bicep_cli() {
    if az bicep version &> /dev/null; then
        local version=$(az bicep version 2>&1 | grep -oP 'Bicep CLI version \K[0-9.]+'  || echo "unknown")
        log_info "Bicep CLI: $version"
        return 0
    else
        log_error "Bicep CLI not found"
        return 1
    fi
}

check_required_files() {
    local required_files=(
        "$SCRIPT_DIR/../main.bicep"
        "$SCRIPT_DIR/validation-tests.sh"
        "$SCRIPT_DIR/deployment-tests.sh"
        "$SCRIPT_DIR/security-tests.sh"
    )
    
    local all_exist=true
    for file in "${required_files[@]}"; do
        if [[ ! -f "$file" ]]; then
            log_error "Required file not found: $file"
            all_exist=false
        fi
    done
    
    return $([[ $all_exist == true ]] && echo 0 || echo 1)
}

################################################################################
# テストカテゴリ実行
################################################################################

run_validation_tests() {
    log_info "Running validation tests..."
    
    if bash "$SCRIPT_DIR/validation-tests.sh"; then
        log_info "Validation tests: PASS"
        return 0
    else
        log_warn "Validation tests: FAIL"
        return 1
    fi
}

run_deployment_tests() {
    log_info "Running deployment tests..."
    
    if bash "$SCRIPT_DIR/deployment-tests.sh"; then
        log_info "Deployment tests: PASS"
        return 0
    else
        log_warn "Deployment tests: FAIL"
        return 1
    fi
}

run_security_tests() {
    log_info "Running security tests..."
    
    if bash "$SCRIPT_DIR/security-tests.sh"; then
        log_info "Security tests: PASS"
        return 0
    else
        log_warn "Security tests: FAIL"
        return 1
    fi
}

run_script_tests() {
    log_info "Running script tests..."
    # MVP段階ではスキップ
    log_info "Script tests: SKIP (MVP phase)"
    return 0
}

################################################################################
# 結果レポート
################################################################################

generate_test_report() {
    local end_time=$(date +%s)
    local duration=$((end_time - START_TIME))
    
    echo
    echo -e "${BLUE}===========================================${NC}"
    echo -e "${BLUE}    テスト実行結果サマリー${NC}"
    echo -e "${BLUE}===========================================${NC}"
    echo -e "実行日時: $(date)"
    echo -e "実行時間: ${duration}秒"
    echo
    
    print_summary_header
    
    # カテゴリ別結果は各テストスクリプトが出力済み
    
    print_overall_result
    
    echo -e "${BLUE}===========================================${NC}"
}

generate_json_report() {
    local report_file="$SCRIPT_DIR/test-results.json"
    
    cat > "$report_file" << EOF
{
  "timestamp": "$(date -Iseconds)",
  "duration": $(($(date +%s) - START_TIME)),
  "summary": {
    "total": $TOTAL_TESTS,
    "passed": $PASSED_TESTS,
    "failed": $FAILED_TESTS,
    "skipped": $SKIPPED_TESTS
  }
}
EOF
    
    log_info "JSON report generated: $report_file"
}

print_summary_header() {
    echo
    echo -e "${BLUE}=== Test Summary ===${NC}"
}

print_category_result() {
    local category="$1"
    local passed="$2"
    local total="$3"
    
    local percentage=0
    if [[ $total -gt 0 ]]; then
        percentage=$((passed * 100 / total))
    fi
    
    if [[ $passed -eq $total ]]; then
        echo -e "${GREEN}[✓]${NC} $category: $passed/$total 合格 ($percentage%)"
    else
        echo -e "${YELLOW}[!]${NC} $category: $passed/$total 合格 ($percentage%)"
    fi
}

print_overall_result() {
    local total_executed=$((PASSED_TESTS + FAILED_TESTS))
    local success_rate=0
    
    if [[ $total_executed -gt 0 ]]; then
        success_rate=$((PASSED_TESTS * 100 / total_executed))
    fi
    
    echo
    echo -e "Total Tests: $total_executed"
    echo -e "${GREEN}Passed: $PASSED_TESTS${NC}"
    echo -e "${RED}Failed: $FAILED_TESTS${NC}"
    echo -e "${YELLOW}Skipped: $SKIPPED_TESTS${NC}"
    echo -e "Success Rate: ${success_rate}%"
    echo
    
    if [[ $FAILED_TESTS -eq 0 ]]; then
        echo -e "${GREEN}総合判定: ✅ PASS${NC}"
    elif [[ $success_rate -ge 90 ]]; then
        echo -e "${YELLOW}総合判定: ⚠️ WARNING (90%+ passed)${NC}"
    else
        echo -e "${RED}総合判定: ❌ FAIL${NC}"
    fi
}

################################################################################
# クイックテストモード
################################################################################

run_quick_tests() {
    log_info "Running quick tests (high priority only)..."
    
    # 構文チェックとセキュリティの基本チェックのみ
    run_validation_tests
    local val_result=$?
    
    run_security_tests
    local sec_result=$?
    
    if [[ $val_result -eq 0 && $sec_result -eq 0 ]]; then
        return 0
    else
        return 1
    fi
}

################################################################################
# CI/CD統合モード
################################################################################

run_ci_mode() {
    log_info "Running in CI/CD mode..."
    
    export CI_MODE=true
    
    # 全自動テストを実行
    run_validation_tests
    local val_result=$?
    
    run_deployment_tests
    local dep_result=$?
    
    run_security_tests
    local sec_result=$?
    
    # JSONレポート生成
    generate_json_report
    
    if [[ $val_result -eq 0 && $dep_result -eq 0 && $sec_result -eq 0 ]]; then
        return 0
    else
        return 1
    fi
}

generate_junit_report() {
    local report_file="$SCRIPT_DIR/test-report.xml"
    
    cat > "$report_file" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<testsuites>
  <testsuite name="Infrastructure Tests" tests="$TOTAL_TESTS" failures="$FAILED_TESTS" skipped="$SKIPPED_TESTS">
  </testsuite>
</testsuites>
EOF
    
    log_info "JUnit report generated: $report_file"
}

################################################################################
# エラーハンドリング
################################################################################

cleanup() {
    # クリーンアップ処理
    :
}

handle_signal() {
    echo
    log_warn "Test execution interrupted"
    cleanup
    exit 130
}

################################################################################
# メイン関数
################################################################################

main() {
    local mode="all"
    local generate_report_flag=false
    
    # 引数解析
    while [[ $# -gt 0 ]]; do
        case $1 in
            --all)
                mode="all"
                shift
                ;;
            --quick)
                mode="quick"
                shift
                ;;
            --category)
                mode="category"
                CATEGORY="$2"
                shift 2
                ;;
            --ci)
                mode="ci"
                shift
                ;;
            --report)
                generate_report_flag=true
                shift
                ;;
            --help)
                usage
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                usage
                exit 1
                ;;
        esac
    done
    
    # ヘッダー
    echo
    echo -e "${BLUE}===========================================${NC}"
    echo -e "${BLUE}  Infrastructure Tests${NC}"
    echo -e "${BLUE}===========================================${NC}"
    echo
    
    # 前提条件チェック
    if ! check_prerequisites; then
        exit 2
    fi
    
    echo
    
    # モード別実行
    local exit_code=0
    case "$mode" in
        all)
            run_validation_tests || exit_code=1
            run_deployment_tests || exit_code=1
            run_security_tests || exit_code=1
            ;;
        quick)
            run_quick_tests || exit_code=1
            ;;
        category)
            case "$CATEGORY" in
                validation)
                    run_validation_tests || exit_code=1
                    ;;
                deployment)
                    run_deployment_tests || exit_code=1
                    ;;
                security)
                    run_security_tests || exit_code=1
                    ;;
                *)
                    log_error "Unknown category: $CATEGORY"
                    exit 1
                    ;;
            esac
            ;;
        ci)
            run_ci_mode || exit_code=1
            ;;
    esac
    
    # 結果レポート
    generate_test_report
    
    if $generate_report_flag; then
        generate_json_report
    fi
    
    # 終了コード
    if [[ $exit_code -eq 0 ]]; then
        log_info "All tests completed successfully"
        exit 0
    else
        log_error "Some tests failed"
        exit $exit_code
    fi
}

################################################################################
# スクリプト実行
################################################################################

# シグナルハンドラ設定
trap cleanup EXIT
trap handle_signal INT TERM

# メイン関数実行
main "$@"

################################################################################
# End of Script
################################################################################
