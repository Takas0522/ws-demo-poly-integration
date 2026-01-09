# Azure App Service Configuration Guide

This guide provides step-by-step instructions for configuring environment variables in Azure App Service for staging and production deployments.

## 📋 Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Configuration Methods](#configuration-methods)
- [Setting Up Azure Key Vault](#setting-up-azure-key-vault)
- [Configuring Application Settings](#configuring-application-settings)
- [Service-Specific Configuration](#service-specific-configuration)
- [Best Practices](#best-practices)
- [Monitoring and Troubleshooting](#monitoring-and-troubleshooting)

## 🎯 Overview

Azure App Service provides multiple ways to configure environment variables:
1. **Application Settings**: Key-value pairs set in the Azure Portal or via CLI
2. **Azure Key Vault References**: Secure storage for sensitive values
3. **Connection Strings**: Special settings for database connections
4. **ARM Templates**: Infrastructure as Code for repeatable deployments

## 🔧 Prerequisites

Before configuring Azure App Service, ensure you have:

- Azure subscription with appropriate permissions
- Azure CLI installed (`az --version` to verify)
- Resource group created for your application
- App Service Plan created
- App Service instances created for each service

### Azure CLI Installation

```bash
# macOS (Homebrew)
brew install azure-cli

# Windows (via MSI)
# Download from: https://aka.ms/installazurecliwindows

# Linux (via script)
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash
```

### Login to Azure

```bash
az login
az account set --subscription <subscription-id>
```

## 🔐 Setting Up Azure Key Vault

Azure Key Vault provides secure storage for secrets, keys, and certificates.

### 1. Create Key Vault

```bash
# Set variables
RESOURCE_GROUP="saas-management-rg"
KEYVAULT_NAME="saas-mgmt-kv-prod"  # Must be globally unique
LOCATION="eastus"

# Create Key Vault
az keyvault create \
  --name $KEYVAULT_NAME \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION \
  --enable-rbac-authorization false
```

### 2. Store Secrets in Key Vault

```bash
# Generate a strong JWT secret
JWT_SECRET=$(openssl rand -base64 64)

# Store JWT secret
az keyvault secret set \
  --vault-name $KEYVAULT_NAME \
  --name jwt-secret \
  --value "$JWT_SECRET"

# Store CosmosDB key (retrieve from CosmosDB account)
COSMOSDB_KEY=$(az cosmosdb keys list \
  --name <cosmosdb-account-name> \
  --resource-group $RESOURCE_GROUP \
  --query primaryMasterKey -o tsv)

az keyvault secret set \
  --vault-name $KEYVAULT_NAME \
  --name cosmosdb-key \
  --value "$COSMOSDB_KEY"
```

### 3. Grant App Service Access to Key Vault

```bash
# Enable managed identity for App Service
APP_NAME="saas-auth-service-prod"

az webapp identity assign \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP

# Get the principal ID
PRINCIPAL_ID=$(az webapp identity show \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --query principalId -o tsv)

# Grant access to Key Vault
az keyvault set-policy \
  --name $KEYVAULT_NAME \
  --object-id $PRINCIPAL_ID \
  --secret-permissions get list
```

## ⚙️ Configuring Application Settings

### Method 1: Azure Portal

1. **Navigate to App Service**:
   - Go to [Azure Portal](https://portal.azure.com)
   - Select your App Service

2. **Open Configuration**:
   - In the left menu, select **Configuration**
   - Click **Application settings** tab

3. **Add New Setting**:
   - Click **+ New application setting**
   - Enter **Name** and **Value**
   - Click **OK**

4. **Reference Key Vault Secret**:
   - For sensitive values, use Key Vault reference:
   ```
   @Microsoft.KeyVault(SecretUri=https://your-keyvault.vault.azure.net/secrets/jwt-secret/)
   ```

5. **Save Changes**:
   - Click **Save** at the top
   - App Service will restart automatically

### Method 2: Azure CLI

```bash
# Set common variables
APP_NAME="saas-auth-service-prod"
RESOURCE_GROUP="saas-management-rg"

# Set multiple application settings
az webapp config appsettings set \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --settings \
    NODE_ENV="production" \
    COSMOSDB_ENDPOINT="https://your-cosmosdb.documents.azure.com:443/" \
    COSMOSDB_DATABASE="saas-management-prod" \
    JWT_EXPIRES_IN="8h" \
    JWT_REFRESH_EXPIRES_IN="7d" \
    LOG_LEVEL="warn" \
    LOG_FORMAT="json" \
    ENABLE_API_DOCS="false" \
    ENABLE_DETAILED_ERRORS="false"
```

### Method 3: Azure CLI with Key Vault References

```bash
# Get Key Vault URI
KEYVAULT_URI=$(az keyvault show \
  --name $KEYVAULT_NAME \
  --resource-group $RESOURCE_GROUP \
  --query properties.vaultUri -o tsv)

# Set settings with Key Vault references
az webapp config appsettings set \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --settings \
    JWT_SECRET="@Microsoft.KeyVault(SecretUri=${KEYVAULT_URI}secrets/jwt-secret/)" \
    COSMOSDB_KEY="@Microsoft.KeyVault(SecretUri=${KEYVAULT_URI}secrets/cosmosdb-key/)"
```

### Method 4: ARM Template

Create an ARM template for repeatable deployments:

```json
{
  "$schema": "https://schema.management.azure.com/schemas/2019-04-01/deploymentTemplate.json#",
  "contentVersion": "1.0.0.0",
  "parameters": {
    "appServiceName": {
      "type": "string"
    },
    "keyVaultName": {
      "type": "string"
    }
  },
  "resources": [
    {
      "type": "Microsoft.Web/sites/config",
      "apiVersion": "2021-02-01",
      "name": "[concat(parameters('appServiceName'), '/appsettings')]",
      "properties": {
        "NODE_ENV": "production",
        "COSMOSDB_ENDPOINT": "[parameters('cosmosDbEndpoint')]",
        "COSMOSDB_KEY": "[concat('@Microsoft.KeyVault(SecretUri=https://', parameters('keyVaultName'), '.vault.azure.net/secrets/cosmosdb-key/)')]",
        "JWT_SECRET": "[concat('@Microsoft.KeyVault(SecretUri=https://', parameters('keyVaultName'), '.vault.azure.net/secrets/jwt-secret/)')]",
        "JWT_EXPIRES_IN": "8h",
        "LOG_LEVEL": "warn",
        "ENABLE_API_DOCS": "false"
      }
    }
  ]
}
```

## 🚀 Service-Specific Configuration

### Frontend Application

```bash
APP_NAME="saas-frontend-prod"

az webapp config appsettings set \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --settings \
    NODE_ENV="production" \
    VITE_AUTH_SERVICE_URL="https://saas-auth-service-prod.azurewebsites.net" \
    VITE_USER_MANAGEMENT_URL="https://saas-user-mgmt-prod.azurewebsites.net" \
    VITE_SERVICE_SETTINGS_URL="https://saas-service-settings-prod.azurewebsites.net" \
    VITE_FEATURE_USER_CREATE="enabled" \
    VITE_FEATURE_USER_EDIT="enabled" \
    VITE_FEATURE_USER_DELETE="enabled"
```

### Auth Service

```bash
APP_NAME="saas-auth-service-prod"
KEYVAULT_URI="https://saas-mgmt-kv-prod.vault.azure.net/"

az webapp config appsettings set \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --settings \
    NODE_ENV="production" \
    COSMOSDB_ENDPOINT="https://your-cosmosdb.documents.azure.com:443/" \
    COSMOSDB_KEY="@Microsoft.KeyVault(SecretUri=${KEYVAULT_URI}secrets/cosmosdb-key/)" \
    COSMOSDB_DATABASE="saas-management-prod" \
    JWT_SECRET="@Microsoft.KeyVault(SecretUri=${KEYVAULT_URI}secrets/jwt-secret/)" \
    JWT_EXPIRES_IN="8h" \
    JWT_REFRESH_EXPIRES_IN="7d" \
    CORS_ORIGINS="https://saas-frontend-prod.azurewebsites.net" \
    LOG_LEVEL="warn" \
    FEATURE_PASSWORD_RESET="enabled" \
    FEATURE_TWO_FACTOR_AUTH="enabled"
```

### User Management Service

```bash
APP_NAME="saas-user-mgmt-prod"

az webapp config appsettings set \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --settings \
    NODE_ENV="production" \
    COSMOSDB_ENDPOINT="https://your-cosmosdb.documents.azure.com:443/" \
    COSMOSDB_KEY="@Microsoft.KeyVault(SecretUri=${KEYVAULT_URI}secrets/cosmosdb-key/)" \
    COSMOSDB_DATABASE="saas-management-prod" \
    AUTH_SERVICE_URL="https://saas-auth-service-prod.azurewebsites.net" \
    JWT_SECRET="@Microsoft.KeyVault(SecretUri=${KEYVAULT_URI}secrets/jwt-secret/)" \
    CORS_ORIGINS="https://saas-frontend-prod.azurewebsites.net" \
    FEATURE_USER_CREATE="enabled" \
    FEATURE_USER_EDIT="enabled" \
    FEATURE_USER_DELETE="enabled" \
    FEATURE_USER_ROLE_ASSIGN="enabled"
```

### Service Settings Service

```bash
APP_NAME="saas-service-settings-prod"

az webapp config appsettings set \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --settings \
    NODE_ENV="production" \
    COSMOSDB_ENDPOINT="https://your-cosmosdb.documents.azure.com:443/" \
    COSMOSDB_KEY="@Microsoft.KeyVault(SecretUri=${KEYVAULT_URI}secrets/cosmosdb-key/)" \
    COSMOSDB_DATABASE="saas-management-prod" \
    AUTH_SERVICE_URL="https://saas-auth-service-prod.azurewebsites.net" \
    JWT_SECRET="@Microsoft.KeyVault(SecretUri=${KEYVAULT_URI}secrets/jwt-secret/)" \
    FEATURE_SERVICE_CREATE="enabled" \
    FEATURE_SERVICE_EDIT="enabled" \
    FEATURE_SERVICE_DELETE="enabled"
```

## 📊 Feature Flags Configuration

Configure feature flags differently for staging vs production:

### Staging (Test All Features)

```bash
az webapp config appsettings set \
  --name saas-auth-service-staging \
  --resource-group $RESOURCE_GROUP \
  --settings \
    FEATURE_USER_CREATE="enabled" \
    FEATURE_USER_EDIT="enabled" \
    FEATURE_USER_DELETE="enabled" \
    FEATURE_USER_ROLE_ASSIGN="enabled" \
    FEATURE_SERVICE_CREATE="enabled" \
    FEATURE_SERVICE_EDIT="enabled" \
    FEATURE_SERVICE_DELETE="enabled" \
    FEATURE_PASSWORD_RESET="enabled" \
    FEATURE_EMAIL_VERIFICATION="enabled" \
    FEATURE_TWO_FACTOR_AUTH="enabled" \
    FEATURE_ANALYTICS="enabled" \
    FEATURE_AUDIT_LOGGING="enabled" \
    FEATURE_RATE_LIMITING="enabled"
```

### Production (Conservative Approach)

```bash
az webapp config appsettings set \
  --name saas-auth-service-prod \
  --resource-group $RESOURCE_GROUP \
  --settings \
    FEATURE_USER_CREATE="enabled" \
    FEATURE_USER_EDIT="enabled" \
    FEATURE_USER_DELETE="enabled" \
    FEATURE_PASSWORD_RESET="enabled" \
    FEATURE_TWO_FACTOR_AUTH="enabled" \
    FEATURE_ANALYTICS="enabled" \
    FEATURE_AUDIT_LOGGING="enabled" \
    FEATURE_RATE_LIMITING="enabled"
```

## 🔍 Best Practices

### 1. Use Deployment Slots

Configure settings per slot for safe deployments:

```bash
# Create staging slot
az webapp deployment slot create \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --slot staging

# Configure staging-specific settings
az webapp config appsettings set \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --slot staging \
  --settings NODE_ENV="staging"

# Mark settings as "slot settings" (don't swap)
az webapp config appsettings set \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --slot-settings NODE_ENV COSMOSDB_DATABASE
```

### 2. Environment-Specific Key Vaults

Use separate Key Vaults for each environment:

- `saas-mgmt-kv-dev` for development
- `saas-mgmt-kv-staging` for staging
- `saas-mgmt-kv-prod` for production

### 3. Naming Conventions

Follow consistent naming:
- App Services: `{service-name}-{environment}` (e.g., `saas-auth-service-prod`)
- Key Vaults: `{app-name}-kv-{env}` (e.g., `saas-mgmt-kv-prod`)
- Secrets: `{purpose}-{resource}` (e.g., `jwt-secret`, `cosmosdb-key`)

### 4. Access Control

Use Azure RBAC and Managed Identities:

```bash
# Assign role-based access
az role assignment create \
  --assignee <user-or-group-id> \
  --role "Key Vault Secrets User" \
  --scope "/subscriptions/<sub-id>/resourceGroups/<rg>/providers/Microsoft.KeyVault/vaults/<kv-name>"
```

### 5. Secret Rotation

Implement regular secret rotation:

```bash
# Generate new secret
NEW_JWT_SECRET=$(openssl rand -base64 64)

# Store as new version (automatic versioning)
az keyvault secret set \
  --vault-name $KEYVAULT_NAME \
  --name jwt-secret \
  --value "$NEW_JWT_SECRET"

# App Service automatically uses latest version
# Test, then deactivate old versions after rotation period
```

## 📈 Monitoring and Troubleshooting

### Enable Application Insights

```bash
# Create Application Insights
az monitor app-insights component create \
  --app saas-auth-service-prod-insights \
  --location $LOCATION \
  --resource-group $RESOURCE_GROUP

# Get instrumentation key
APPINSIGHTS_KEY=$(az monitor app-insights component show \
  --app saas-auth-service-prod-insights \
  --resource-group $RESOURCE_GROUP \
  --query instrumentationKey -o tsv)

# Configure in App Service
az webapp config appsettings set \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --settings APPINSIGHTS_INSTRUMENTATIONKEY="$APPINSIGHTS_KEY"
```

### View Application Logs

```bash
# Stream logs in real-time
az webapp log tail \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP

# Download logs
az webapp log download \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --log-file app-logs.zip
```

### Verify Configuration

```bash
# List all application settings
az webapp config appsettings list \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP

# Test a specific setting
az webapp config appsettings list \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --query "[?name=='NODE_ENV'].value" -o tsv
```

### Common Issues

**Issue**: Key Vault reference not resolving

**Solution**:
```bash
# Verify managed identity is enabled
az webapp identity show --name $APP_NAME --resource-group $RESOURCE_GROUP

# Verify Key Vault access policy
az keyvault show --name $KEYVAULT_NAME --resource-group $RESOURCE_GROUP

# Check secret URI format
# Correct: @Microsoft.KeyVault(SecretUri=https://kv.vault.azure.net/secrets/name/)
# Note the trailing slash
```

**Issue**: App Service not restarting after configuration change

**Solution**:
```bash
# Manually restart
az webapp restart --name $APP_NAME --resource-group $RESOURCE_GROUP
```

## 🔄 CI/CD Integration

Configure environment variables in GitHub Actions:

```yaml
# .github/workflows/deploy-production.yml
- name: Set Azure App Service Settings
  uses: azure/appservice-settings@v1
  with:
    app-name: ${{ secrets.AZURE_APP_NAME }}
    app-settings-json: |
      [
        {
          "name": "NODE_ENV",
          "value": "production",
          "slotSetting": false
        },
        {
          "name": "JWT_SECRET",
          "value": "@Microsoft.KeyVault(SecretUri=${{ secrets.KV_JWT_SECRET_URI }})",
          "slotSetting": false
        }
      ]
```

## 📚 Additional Resources

- [Azure App Service Configuration](https://docs.microsoft.com/azure/app-service/configure-common)
- [Key Vault References](https://docs.microsoft.com/azure/app-service/app-service-key-vault-references)
- [Managed Identities](https://docs.microsoft.com/azure/app-service/overview-managed-identity)
- [Application Insights](https://docs.microsoft.com/azure/azure-monitor/app/app-insights-overview)

---

**Last Updated**: 2026-01-09
