FROM mcr.microsoft.com/devcontainers/python:1-3.11-bookworm

# Install Node.js 20.x
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && npm install -g npm@latest

# Workaround: ensure Yarn APT repo GPG key is up-to-date so feature installs don't fail
RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
    && apt-get install -y --no-install-recommends gnupg dirmngr apt-transport-https ca-certificates \
    && mkdir -p /usr/share/keyrings \
    && curl -fsSL https://dl.yarnpkg.com/debian/pubkey.gpg | gpg --dearmor --batch --yes -o /usr/share/keyrings/yarn-archive-keyring.gpg \
    && echo "deb [signed-by=/usr/share/keyrings/yarn-archive-keyring.gpg] https://dl.yarnpkg.com/debian stable main" > /etc/apt/sources.list.d/yarn.list \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install additional system dependencies
RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
    && apt-get -y install --no-install-recommends \
    curl \
    wget \
    git \
    ca-certificates \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Ensure vscode user exists and has proper permissions
RUN if ! id -u vscode > /dev/null 2>&1; then \
    groupadd --gid 1000 vscode && \
    useradd --uid 1000 --gid 1000 -m -s /bin/bash vscode && \
    echo "vscode ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers; \
    fi

# Set working directory
WORKDIR /workspace

# Ensure vscode user owns the workspace
RUN chown -R vscode:vscode /workspace
