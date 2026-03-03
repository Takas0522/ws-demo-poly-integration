# Azure コスト最適化サマリ（dev 環境）

作成日: 2026-03-03

概要:

- 調査対象: resources/azure-resource/rg-poly-integration-dev.json と resources/azure-usage/usage_2026-02-01_to_2026-02-28.masked.json（数値はマスク）
- 主要リソース: Azure Container Apps (4 apps)、Azure Container Registry (Basic)、Azure Cosmos DB (Serverless)、Log Analytics / Application Insights、Key Vault
- マスク済みの利用データのため、以下のサマリはシナリオ推計に基づく。未マスクの usage または Cost Management の実データ取得で正確化が必要。

主要なコスト削減案（優先度高→低）:

1. Log Analytics / Application Insights のサンプリングと保持期間の短縮（dev は 30 日 or 7 日に短縮を検討）
   - 理由: 取り込みデータ量が多い場合、最も費用対効果が高い
2. ACR の保管ポリシー有効化とイメージの GC（老朽イメージ削除）
   - 理由: 普通はストレージ課金が発生するため不要な画像を削除するだけで月次削減になる
3. Container Apps の autoscale 設定見直し（minReplicas=0 を確認、maxReplicas を dev 用に制限）
   - 理由: スケール・トゥ・ゼロが有効であればアイドル時の課金は最小化される
4. Cosmos DB の利用状況確認後に、Serverless のまま継続するか provisioned/autoscale + 予約へ切替
   - 理由: 継続的で高負荷な場合は provisioned が安くなる
5. バックアップ / スナップショットの保持期間を見直し

概算見積（中間シナリオ）:

- 中シナリオ月額 (推計): 約 $71.8
- 中シナリオ想定削減額 (提案適用): 約 $50.0/月
- 最終想定残額: 約 $21.7/月

次の推奨アクション:

1. 未マスクの usage を用意するか、ライブ Cost Management のクエリを実行して実データで再評価する（必須）
2. 低リスクの改善（Log Analytics のサンプリング、ACR GC、有効化）から順に実施し 30 日後に効果を検証する
3. Cosmos DB は利用状況確定後に予約/Provision 切替等の中長期的施策を検討する

参考: 詳細レポートはセッションステートに保存済み

- /home/XXX/.copilot/session-state/47519133-aa06-45ab-9cb0-9adf732e9833/research/azure-resource-azure-azure-usage-azure-web.md
- /home/XXX/.copilot/session-state/47519133-aa06-45ab-9cb0-9adf732e9833/research/azure-usage-scenario-estimates.md
