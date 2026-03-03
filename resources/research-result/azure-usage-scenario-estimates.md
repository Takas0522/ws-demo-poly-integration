# Azure usage — シナリオ別推計レポート (マスク済みデータに基づく)

作成日時: 2026-03-03T11:05:02Z

注意: リポジトリ内の usage ファイルは数値がマスクされているため、本レポートは「低/中/高」の3シナリオでの仮定に基づく推計です。正確な請求額と最終的な削減見積は、未マスクの usage または Cost Management の実データ取得で確定してください。

前提・単価（JA East 小数点切捨てした代表値）:
- Container Apps: vCPU Active = $0.000024 / sec, Memory Active = $0.000003 / GiB-sec, Requests = $0.40 / 1M req
- Cosmos DB (serverless): 1M RU = $0.285
- Cosmos DB storage: $0.2825 / GB-month
- Log Analytics ingestion: $3.34 / GB; retention storage: $0.15 / GB-month
- ACR Data Stored: $0.10 / GB-month
- 月は 28 日 (2,419,200 秒) を利用

リソース要約（テンプレートに基づく）:
- Container Apps: auth, frontend, service-setting, tenant (合計4アプリ)、各コンテナ resources: cpu=0.25, memory=0.5Gi
- Cosmos DB: serverless
- Log Analytics + Application Insights
- ACR: Basic

シナリオ定義:
- 低 (dev-light): 各アプリ稼働 1h/日, req/app=0.1M/月, Cosmos=1M RU/月, Log=1GB/月, ACR=10GB, Backup=20GB
- 中 (dev-typical): 各アプリ稼働 4h/日, req/app=1M/月, Cosmos=10M RU/月, Log=10GB/月, ACR=50GB, Backup=100GB
- 高 (stress/test): 各アプリ稼働 8h/日, req/app=5M/月, Cosmos=100M RU/月, Log=50GB/月, ACR=100GB, Backup=200GB

計算（代表的な項目のみ、小数点2桁で四捨五入）:
- Container Apps (1アプリあたり):
  - 1h/day: CPU=0.6048, Mem=0.1512 -> 0.76 USD
  - 4h/day: CPU=2.4192, Mem=0.6048 -> 3.02 USD
  - 8h/day: CPU=4.8384, Mem=1.2096 -> 6.05 USD
  - 4アプリ合計: 低=3.02 / 中=12.10 / 高=24.19
- Requests (全アプリ合計): 低(0.4M)=0.16 USD, 中(4M)=1.60 USD, 高(20M)=8.00 USD
- Cosmos DB (RUのみ): 低=0.29 USD, 中=2.85 USD, 高=28.50 USD
- Cosmos Storage: 低(5GB)=1.41, 中(10GB)=2.83, 高(50GB)=14.13
- Log Analytics (ingest + retention):
  - 低: ingest 1GB=3.34 + retention 0.15 = 3.49
  - 中: ingest 10GB=33.40 + retention 1.50 = 34.90
  - 高: ingest 50GB=167.00 + retention 7.50 = 174.50
- ACR storage: 低=1.00, 中=5.00, 高=10.00
- Backup storage (例: periodic LRS @ $0.125/GB): 低(20GB)=2.50, 中(100GB)=12.50, 高(200GB)=25.00

合計（シナリオ別推定月額コスト）:
- 低合計 ≒ $11.87 /月
- 中合計 ≒ $71.77 /月
- 高合計 ≒ $284.32 /月

提案アクションと推定削減（中シナリオをベースに、複数施策同時適用を想定）:
1) Container Apps: minReplicas=0確認・autoscale/冷却調整・maxReplicas縮小 -> 稼働を4h→1hへ削減想定
   - 削減効果: 4アプリ合計で約 $12.10 → $3.02、削減 ≒ $9.07/月
2) Requests(キャッシュ/レート制御): 70%削減想定 -> 削減 ≒ $1.12/月
3) Log Analytics: サンプリング/診断削減/retention短縮(90→30/7日) -> 70%削減想定
   - 削減 ≒ $24.43/月
4) ACR: 画像削除・retention有効化 (50GB→10GB) -> 削減 ≒ $4.00/月
5) Cosmos DB: RU最適化（キャッシュ or 一時負荷対策）、backup retention削減 (100GB→20GB) -> RU 50%削減で ≒ $1.43、backup削減で ≒ $10.00/月

中シナリオ合計削減見積 (上の合算): ≒ $50.05/月
- 中シナリオ最終概算コスト: $71.77 - $50.05 ≒ $21.72/月

結論・推奨順序:
1. まず Log Analytics のサンプリングと App Insights のretention短縮（dev）を実施（最も効果大、低リスク）。
2. ACRの retention/GC を有効化しイメージ削除を実行（低リスク）。
3. Container Apps の autoscale パラメータを厳格化（minReplicas=0 を確認、maxReplicas見直し）。
4. Cosmos は実稼働RUを確認してから（未マスクデータで分岐）プロビジョニング/予約の検討。

次のアクション:
- この推計を確定するには未マスクの usage または Cost Management の実データを取得するのが必須です（予約購入や長期契約検討前に必須）。

--
(詳細な計算と中間出力はこのファイルに記録しました。正確化が必要なら未マスクデータを提供するか、ライブ Cost Management クエリを実行してください。)
