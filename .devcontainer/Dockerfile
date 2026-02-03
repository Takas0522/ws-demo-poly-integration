FROM mcr.microsoft.com/devcontainers/python:3.11

# Node.js 18.x インストール
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs

# Azure CLI インストール
RUN curl -sL https://aka.ms/InstallAzureCLIDeb | bash

# Python開発ツール
RUN pip install --upgrade pip \
    && pip install black pylint pytest pytest-asyncio httpx

# グローバルツール
RUN npm install -g npm@latest

WORKDIR /workspace
