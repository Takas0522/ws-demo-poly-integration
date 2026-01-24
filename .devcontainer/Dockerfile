# Base image with Node.js
FROM mcr.microsoft.com/devcontainers/javascript-node:1-20-bullseye

# Install Python 3.11 and related tools
RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
    && apt-get -y install --no-install-recommends \
    python3.11 \
    python3.11-venv \
    python3-pip \
    python3.11-dev \
    build-essential \
    libssl-dev \
    libffi-dev \
    && apt-get clean -y && rm -rf /var/lib/apt/lists/*

# Set Python 3.11 as default
RUN update-alternatives --install /usr/bin/python3 python3 /usr/bin/python3.11 1 \
    && update-alternatives --install /usr/bin/python python /usr/bin/python3.11 1

# Upgrade pip
RUN python3 -m pip install --upgrade pip setuptools wheel

# Install Python development tools
RUN pip3 install --no-cache-dir \
    black \
    pylint \
    pytest \
    pytest-cov \
    pytest-asyncio \
    mypy \
    flake8

# Install Azure CLI
RUN curl -sL https://aka.ms/InstallAzureCLIDeb | bash

# Install FastAPI and related tools
RUN pip3 install --no-cache-dir \
    fastapi \
    uvicorn[standard] \
    python-multipart \
    python-jose[cryptography] \
    passlib[bcrypt] \
    azure-cosmos \
    pydantic \
    pydantic-settings

# Install global npm packages
RUN npm install -g \
    typescript \
    @types/node \
    tsx \
    prettier \
    eslint

# Create workspace directory
RUN mkdir -p /workspace && chown -R node:node /workspace

# Set working directory
WORKDIR /workspace

# Switch to node user
USER node
