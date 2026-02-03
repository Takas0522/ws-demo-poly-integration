FROM mcr.microsoft.com/devcontainers/python:3.11

# 必要なシステムパッケージのインストール
RUN apt-get update && apt-get install -y \
    curl \
    openssl \
    && rm -rf /var/lib/apt/lists/*

# Node.js 18.x インストール
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs

# Azure CLI インストール
RUN curl -sL https://aka.ms/InstallAzureCLIDeb | bash

# Python開発ツール + Azure SDK
RUN pip install --upgrade pip \
    && pip install black pylint pytest pytest-asyncio httpx \
    && pip install azure-cosmos azure-identity

WORKDIR /workspace
