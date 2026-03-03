# Azure cost-optimization research (azure-resource / azure-usage)

Date: 2026-03-03

## Executive summary

- The repository defines a dev environment with 4 Container Apps (auth, frontend, service-setting, tenant) each configured with cpu=0.25 and memory=0.5Gi, a Container Registry (ACR Basic), an Azure Cosmos DB account in Serverless mode, an Application Insights component that sends data to a Log Analytics workspace (PerGB2018), and a Log Analytics workspace with 30-day retention. These resource definitions are in the deployed Bicep/ARM template inspected here[^app-1][^acr-1][^cosmos-1][^log-1][^appi-1].
- Public Azure pricing (retail API + pricing pages) shows Container Apps are billed per-second by vCPU-second and GiB-second (JA East: vCPU active = $0.000024 / sec, memory active = $0.000003 / GiB-sec; first-month free grant applies) and Cosmos DB serverless is billed per RU consumed (JA East: $0.285 per 1M RU); Log Analytics ingestion & retention have material costs (JA East: ingestion ~ $3.34/GB, retention ~$0.15/GB/month). Price sources are cited below[^containerapps-pricing][^containerapps-vcpu-ja][^containerapps-mem-ja][^cosmos-serverless-ja][^log-analytics-ja].
- Because the usage export in the repository is masked (no numeric costs/quantities present), concrete savings must be presented as a set of plausible scenarios with clear assumptions. Under reasonable dev assumptions (28-day month, apps active ~8h/day baseline, optimization to 2h/day), container compute+memory savings ~ $18–20/month; combined with realistic log-ingestion and registry cleanup actions, an illustrative monthly saving of ~ $40–60 is achievable. Exact savings depend on real RU and GB ingestion numbers and therefore require unmasked usage or live billing queries to finalize. Detailed breakdown and recommended actions follow.

## Observed resources (evidence)

- Container Apps managed environment: Microsoft.App/managedEnvironments (location: Japan East).[^env-1]
- Container Apps (4 apps): auth-service, frontend, service-setting, tenant-service — each container resources block shows `cpu: 0.25` and `memory: "0.5Gi"` and scale rules with `minReplicas: 0` and `maxReplicas: 3`.[^auth-cpu][^frontend-cpu][^service-cpu][^tenant-cpu][^scale-cpu]
- Azure Container Registry: SKU Basic (admin user enabled), retentionPolicy.soft/retention disabled in template (no automated GC configured).[^acr-1][^acr-retention]
- Azure Cosmos DB account: `capacityMode: "Serverless"` and `backupPolicy: Continuous` set to Continuous30Days in template. `enableFreeTier` is false.[^cosmos-1][^cosmos-backup]
- Log Analytics workspace: SKU `PerGB2018`, `retentionInDays: 30` (workspace); Application Insights component uses ingestion mode `LogAnalytics` with `RetentionInDays: 90` (Application Insights config).[^log-1][^appi-1]
- Key Vault: SKU standard (present but low monthly cost in dev).[^kv-1]
- Usage export present but masked: the usage JSON contains product labels (e.g., Cosmos DB RUs, Container Registry, Microsoft.Storage, Microsoft.Security) but numeric `pretaxCost` and `usageQuantity` are redacted (`"None"`). This prevents direct, exact bill reconciliation from repository artifacts alone. See usage file entries for product names and tags[^usage-sample].


## Primary cost drivers (from template + retail prices)

- Container Apps (compute + memory + requests): charged per vCPU-second and GiB-second and per million requests; Container Apps pricing page documents the billing model and free grant; retail prices API provides JA East unit prices used in calculations below[^containerapps-pricing][^containerapps-vcpu-ja][^containerapps-mem-ja][^containerapps-requests-ja].
- Azure Cosmos DB (serverless): billed per RU consumed (serverless = $ per 1M RU). Storage is billed per GB/month. Retail prices API (JA East) gives serverless meter `1M RUs = $0.285` and storage per GB/month ~ $0.2825 (JA East) — used in the scenarios below[^cosmos-serverless-ja][^cosmos-storage-ja].
- Log Analytics / Application Insights: ingestion (per GB) and retention (per GB/month) can dominate for telemetry-heavy apps; retail API (JA East) shows ingestion and retention meters used below[^log-analytics-ja].
- Container Registry (ACR Basic) data stored: ~ $0.10/GB-month in JA East (retail API). Cleaning up images reduces this storage charge[^acr-pricing-ja].


## Recommended cost-reduction actions, impact, pros/cons, estimated savings

Note: each recommendation includes the estimated monthly savings under explicit assumptions. All estimates are illustrative (masked usage prevents exact calculation); for a precise plan run a live billing export or Cost Management query.

1) Enforce scale-to-zero and tighten autoscaling targets for Container Apps (low effort)

- What to change: confirm `minReplicas: 0` (already set in template[^scale-cpu]) and ensure platform autoscaling rules (CPU/request thresholds) are tuned to avoid unnecessary warm replicas; reduce `maxReplicas` for dev apps if not required (e.g., set `maxReplicas: 1` or 2). Also enable the Container Apps free grant awareness in cost model.
- Impact / scope: affects all 4 Container Apps (auth, frontend, service-setting, tenant). See template CPU/memory entries[^auth-cpu][^frontend-cpu][^service-cpu][^tenant-cpu].
- Pros: immediate reduction of billed vCPU/GiB-seconds when apps are idle; very low operational risk for dev environment; no infra changes required.
- Cons: may increase cold-start latency for inbound requests; reducing maxReplicas can cause request throttling under load if real traffic spikes.
- Est. savings (example scenario): assume Feb (28 days), baseline: apps active 8h/day with 1 replica during active time; optimized: average active 2h/day per app. Using JA East retail prices (vCPU active = $0.000024/sec, memory active = $0.000003 GiB-sec)[^containerapps-vcpu-ja][^containerapps-mem-ja]:
  - Month seconds = 28 * 24 * 3600 = 2,419,200 s; active_seconds(8h/day) = 806,400 s; active_seconds(2h/day) = 201,600 s.
  - Per app baseline cost: vCPU = 0.25 * 806,400 * 0.000024 = $4.8384; memory = 0.5 * 806,400 * 0.000003 = $1.2096; total ≈ $6.05/app/month.
  - Per app optimized: ≈ $1.51/app/month. For 4 apps baseline ≈ $24.19 → optimized ≈ $6.05 → savings ≈ $18.14/month (compute+memory only). Add request-cost improvements (requests JA East = $0.4 per 1M req[^containerapps-requests-ja]) and typical reductions give ≈ $1–$2 additional savings.
- References: template resources for CPU/memory and scale settings[^auth-cpu][^scale-cpu]; Container Apps pricing and free grant[^containerapps-pricing][^containerapps-vcpu-ja][^containerapps-mem-ja].

2) Reduce Application Insights / Log Analytics ingestion and retention in dev

- What to change: Application Insights `IngestionMode: LogAnalytics` is in use (App Insights forwards to the workspace)[^appi-1]; reduce telemetry level/sampling for dev, enable adaptive sampling, reduce retention from 90->30 days for App Insights (or 30->7 if acceptable), and add query-based data collection limits. Turn off verbose diagnostics and reduce retention of logs forwarded to Log Analytics.
- Impact / scope: reduces visibility for historical dev telemetry and slows root-cause investigations for older incidents; affects all telemetry consumers and monitoring runbooks.
- Pros: biggest single-dollar opportunity for dev/test environments because ingestion price is high; low risk for dev purposes.
- Cons: losing long-term traces increases time to debug historical issues; must coordinate with SRE/Dev owners.
- Est. savings (illustrative): retail API JA East shows ingestion ~ $3.34/GB and retention ~$0.15/GB/month[^log-analytics-ja]. Example—if the dev workspace currently ingests 10 GB/month: ingestion = 10 * $3.34 = $33.4; retention (90d ≈ 3x monthly stored) storage ≈ 30 GB * $0.15 = $4.5. If sampling reduces ingestion by 70% (10→3 GB), ingestion cost drops to $10.02; retention storage approximates 9 GB * $0.15 = $1.35; combined saving ≈ $26.5/month.
- References: Log Analytics retail meters (ingestion/retention) and workspace template[^log-analytics-ja][^log-1][^appi-1].

3) Clean up ACR images and enable retention/soft-delete policies (low effort)

- What to change: enable `retentionPolicy` and `softDeletePolicy` in ACR properties and run garbage-collection on unreferenced images (template shows retention policy currently disabled)[^acr-retention]; remove old CI build images.
- Impact / scope: ACR storage and tasks; may affect CI/CD pipelines if old tags are referenced; low risk if you keep current tags and garbage-collect untagged images.
- Pros: straightforward small-dollar recurring savings (storage $0.10/GB/month in JA East for Basic)[^acr-pricing-ja]; operational benefit of less storage and faster registry operations.
- Cons: need to ensure CI/CD doesn't depend on old tags; must coordinate with dev teams.
- Est. savings (illustrative): assume 50 GB of images now -> $5/month; prune to 10 GB -> $1/month → savings ≈ $4/month.

4) Re-evaluate Cosmos DB serverless settings (medium effort depending on usage)

- What to change: because template sets `capacityMode: Serverless` and `backupPolicy` continuous with 30 days retention[^cosmos-1][^cosmos-backup], consider:
  - If cosmic traffic is very low (few million RU/month), serverless is likely optimal.
  - If there is sustained high RU consumption, evaluate provisioned throughput with autoscale or reserved capacity to reduce unit cost (reserved capacity can reduce cost if workloads are steady).
  - Reduce continuous backup retention or switch to periodic backups for dev to lower backup storage charges if acceptable.
- Impact / scope: affects database latency guarantees and scaling model; switching to provisioned throughput requires migration planning and careful capacity sizing.
- Pros: potential large savings for steady high-load databases by using provisioned throughput + reservations; smaller dev accounts benefit from serverless’ pay-per-request.
- Cons: capacity planning overhead; switching compute model can cause transient performance effects.
- Est. scenarios (serverless retail JA East: $0.285 / 1M RU[^cosmos-serverless-ja], storage ~$0.2825/GB-month[^cosmos-storage-ja]):
  - Low usage: 0.5M RU/month → $0.14/month (serverless) — keep serverless.
  - Moderate usage: 10M RU/month → $2.85/month.
  - High usage: 100M RU/month → $28.5/month — evaluate provisioned throughput/reserved capacity; reserved capacity can deliver 20–30% savings on predictable loads.
- References: Cosmos DB template and serverless pricing[^cosmos-1][^cosmos-serverless-ja][^cosmos-storage-ja].

5) Reduce backups / snapshots retention where not required (low-medium effort)

- What to change: Cosmos DB continuous backups `Continuous30Days` increase backup storage; switching to periodic or reducing retention reduces stored GB and backup charges (template shows `continuousModeProperties.tier: Continuous30Days`)[^cosmos-backup].
- Impact / scope: reduces point-in-time restore window; impacts DR/restore SLAs.
- Pros: easy storage and cost reduction.
- Cons: reduced restore window and increased risk in case of data loss.
- Est. savings: backup storage meters for periodic/continuous are in the Cosmos DB retail API (Periodic Backup LRS ~ $0.125/GB-month; continuous backup >30days shows meter entries) — example: reducing backup storage by 100 GB yields ≈ $12.5/month saved (LRS example). See retail API cited below[^cosmos-storage-ja].


## Step-by-step actions to implement (quick checklist)

1. Verify live billing/usage (unmask export or query Cost Management) to replace assumptions with exact numbers (required to finalize savings). This is mandatory before committing to reserved capacity or savings plans.
2. Tune Container Apps autoscale rules and confirm `minReplicas=0` in production/dev where acceptable; consider reducing `maxReplicas` in dev templates. (Low risk)
3. Enable ACR retention policy and soft-delete; run registry GC and delete old images. (Low risk)
4. Apply Application Insights sampling / reduce retention to 30 days for dev workspaces; reduce diagnostic/trace logging level in dev. (Low risk, coordinate with devs)
5. Review Cosmos DB metrics (RU consumption per day) to evaluate serverless vs provisioned throughput/reservations and adjust backup retention. (Medium risk)
6. Re-run cost model with exact usage (Cost Management query) and decide on reservations or savings plan for compute (Container Apps / Azure VMs) only after verifying steady usage levels.


## Confidence assessment

- Certain: resource types and configuration are present in the ARM/Bicep template (Container Apps, ACR Basic, Cosmos DB serverless, App Insights → Log Analytics, Log Analytics workspace). Evidence: the template lines cited in footnotes[^auth-cpu][^acr-1][^cosmos-1][^appi-1][^log-1].
- Inferred / Assumed: actual runtime usage (hours active, RU consumed, GB ingested) because the provided usage export is masked (cost/quantity fields are "None") and therefore exact bill/usage numbers are not available in the repository (see usage file entries). All numeric savings are scenario-based estimates and must be validated against real billing metrics. See usage sample evidence[^usage-sample].


## Next steps (recommended, prioritized)

1. Unmask or run a live Cost Management query for the last 30–90 days to get real RU, vCPU-sec, GB ingestion numbers (required to produce precise savings). (Blocker for exact numbers)
2. Implement low-risk changes first: enable ACR retention, set sampling in App Insights, reduce App Insights retention for dev, confirm Container Apps minReplicas=0 and tune autoscaling. Re-run cost model after 30 days. (High ROI / low risk)
3. If sustained high Cosmos RU usage found, evaluate reserved capacity / provisioned throughput and calculate 1- and 3-year reserved savings using Azure portal. (Medium ROI / medium complexity)


## Footnotes

[^env-1]: Managed environment resource in template: `/home/tohkawa/source/ws-demo-poly-integration/resources/azure-resource/rg-poly-integration-dev.json:44-76`.
[^auth-cpu]: auth-service container resources: `/home/tohkawa/source/ws-demo-poly-integration/resources/azure-resource/rg-poly-integration-dev.json:401-407`.
[^frontend-cpu]: frontend container resources: `/home/tohkawa/source/ws-demo-poly-integration/resources/azure-resource/rg-poly-integration-dev.json:521-527`.
[^service-cpu]: service-setting container resources: `/home/tohkawa/source/ws-demo-poly-integration/resources/azure-resource/rg-poly-integration-dev.json:651-657`.
[^tenant-cpu]: tenant-service container resources: `/home/tohkawa/source/ws-demo-poly-integration/resources/azure-resource/rg-poly-integration-dev.json:781-787`.
[^scale-cpu]: example scale settings (min/max replicas): `/home/tohkawa/source/ws-demo-poly-integration/resources/azure-resource/rg-poly-integration-dev.json:410-414` (auth) and analogous blocks for other apps `/home/tohkawa/source/ws-demo-poly-integration/resources/azure-resource/rg-poly-integration-dev.json:530-534`, `/home/tohkawa/source/ws-demo-poly-integration/resources/azure-resource/rg-poly-integration-dev.json:660-664`, `/home/tohkawa/source/ws-demo-poly-integration/resources/azure-resource/rg-poly-integration-dev.json:790-794`.
[^acr-1]: ACR Basic SKU and adminUserEnabled in template: `/home/tohkawa/source/ws-demo-poly-integration/resources/azure-resource/rg-poly-integration-dev.json:79-86` and SKU block `/home/tohkawa/source/ws-demo-poly-integration/resources/azure-resource/rg-poly-integration-dev.json:120-123`.
[^acr-retention]: ACR retention/softDelete/retentionPolicy in template showing retention policy disabled: `/home/tohkawa/source/ws-demo-poly-integration/resources/azure-resource/rg-poly-integration-dev.json:101-110`.
[^cosmos-1]: Cosmos DB `capacityMode: "Serverless"` in template: `/home/tohkawa/source/ws-demo-poly-integration/resources/azure-resource/rg-poly-integration-dev.json:149-156`.
[^cosmos-backup]: Cosmos DB backupPolicy continuous settings: `/home/tohkawa/source/ws-demo-poly-integration/resources/azure-resource/rg-poly-integration-dev.json:143-147`.
[^log-1]: Log Analytics workspace SKU and retention: `/home/tohkawa/source/ws-demo-poly-integration/resources/azure-resource/rg-poly-integration-dev.json:267-279`.
[^appi-1]: Application Insights component using LogAnalytics and `RetentionInDays: 90`: `/home/tohkawa/source/ws-demo-poly-integration/resources/azure-resource/rg-poly-integration-dev.json:1250-1256`.
[^kv-1]: Key Vault SKU standard in template: `/home/tohkawa/source/ws-demo-poly-integration/resources/azure-resource/rg-poly-integration-dev.json:249-253`.
[^usage-sample]: Usage export (masked) showing product labels (e.g., Cosmos DB - RUs, Container Registry) with `pretaxCost`/`usageQuantity` redacted: `/home/tohkawa/source/ws-demo-poly-integration/resources/azure-usage/usage_2026-02-01_to_2026-02-28.masked.json:200-216` and multiple entries throughout usage file.

Pricing / Web sources (retail API and Microsoft pages):

[^containerapps-pricing]: Azure Container Apps pricing page (consumption model, free grant): https://azure.microsoft.com/en-us/pricing/details/container-apps/ (viewed 2026-03-03).
[^containerapps-vcpu-ja]: Retail prices API — Container Apps Standard vCPU Active Usage (JA East): https://prices.azure.com/api/retail/prices?$filter=serviceName%20eq%20%27Azure%20Container%20Apps%27%20and%20armRegionName%20eq%20%27japaneast%27%20and%20meterName%20eq%20%27Standard%20vCPU%20Active%20Usage%27 (returned `unitPrice`: 0.000024 USD per second).
[^containerapps-mem-ja]: Retail prices API — Container Apps Standard Memory Active Usage (JA East): https://prices.azure.com/api/retail/prices?$filter=serviceName%20eq%20%27Azure%20Container%20Apps%27%20and%20armRegionName%20eq%20%27japaneast%27%20and%20meterName%20eq%20%27Standard%20Memory%20Active%20Usage%27 (returned `unitPrice`: 0.000003 USD per GiB-second).
[^containerapps-requests-ja]: Retail prices API — Container Apps Standard Requests (JA East): https://prices.azure.com/api/retail/prices?$filter=serviceName%20eq%20%27Azure%20Container%20Apps%27%20and%20armRegionName%20eq%20%27japaneast%27%20and%20meterName%20eq%20%27Standard%20Requests%27 (returned `unitPrice`: 0.4 USD / 1M requests).
[^cosmos-serverless-ja]: Retail prices API — Azure Cosmos DB serverless `1M RUs` (JA East): https://prices.azure.com/api/retail/prices?$filter=serviceName%20eq%20%27Azure%20Cosmos%20DB%27%20and%20armRegionName%20eq%20%27japaneast%27%20and%20contains(meterName,%20%271M%27)&$top=100 (returned `productName`: "Azure Cosmos DB serverless" `meterName`: "1M RUs" `retailPrice`: 0.285 USD).
[^cosmos-storage-ja]: Retail prices API — Azure Cosmos DB data stored / snapshot meters (JA East): https://prices.azure.com/api/retail/prices?$filter=serviceName%20eq%20%27Azure%20Cosmos%20DB%27%20and%20armRegionName%20eq%20%27japaneast%27&$top=100 (contains `Data Stored` and `Periodic Backup` meters; examples: `Data Stored` ~ 0.2825 USD/GB-month, `Periodic Backup - LRS` ~ 0.125 USD/GB-month in returned dataset).
[^log-analytics-ja]: Retail prices API — Log Analytics (JA East) ingestion and retention meters: https://prices.azure.com/api/retail/prices?$filter=serviceName%20eq%20%27Log%20Analytics%27%20and%20armRegionName%20eq%20%27japaneast%27&$top=100 (returned `Analytics Logs Data Ingestion` and `Analytics Logs Data Retention` entries; ingestion ~ 3.34 USD/GB, retention ~ 0.15 USD/GB-month in JA East entries).
[^acr-pricing-ja]: Retail prices API — Container Registry (JA East) Data Stored meter: https://prices.azure.com/api/retail/prices?$filter=serviceName%20eq%20%27Container%20Registry%27%20and%20armRegionName%20eq%20%27japaneast%27&$top=100 (returned `Data Stored` = 0.10 USD/GB-month for Basic SKU entries).

---

Saved research file in repository session path: `/home/tohkawa/.copilot/session-state/47519133-aa06-45ab-9cb0-9adf732e9833/research/azure-resource-azure-azure-usage-azure-web.md`.

If desired, next step is to run a live Cost Management query (example Kusto or REST) to unmask actual RU/GB and vCPU-sec usage and then replace the assumed scenarios with exact monthly-savings calculations. 
