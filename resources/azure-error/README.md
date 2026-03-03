# azure-error raw data (masked)

This directory stores Azure raw artifacts related to the failed deployment investigation for `ca-frontend-dev`.

## Files

- `az-account-masked.json`: Current Azure account context (masked).
- `containerapp-ca-frontend-dev-masked.json`: Container App details (resource ID masked).
- `containerapp-ca-frontend-dev-revisions.json`: Revision list (safe fields only).
- `activity-log-ca-frontend-dev-failed-90d-masked.json`: Failed Activity Log events in the last 90 days (safe fields only, masked identifiers).
- `activity-log-ca-frontend-dev-failed-summary-90d-masked.json`: Focused failure summary for quick review.

## Masking policy applied

- UPN/local-part of email addresses: replaced with `***`.
- GUID-like identifiers (`subscriptionId`, `tenantId`, `correlationId`): partially masked.
- Azure resource IDs: subscription segment replaced with `***`.
- IP addresses: replaced with `***.***.***.***`.

Generated on: 2026-03-03
