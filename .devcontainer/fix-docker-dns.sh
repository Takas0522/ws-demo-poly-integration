#!/bin/bash
# Fix Docker DNS for WSL2 environment
# This script updates Docker's DNS configuration to use WSL2's DNS server

set -e

WSL_DNS=$(grep nameserver /etc/resolv.conf | head -1 | awk '{print $2}')

if [ -z "$WSL_DNS" ]; then
    echo "Warning: Could not detect WSL2 DNS server"
    exit 0
fi

DAEMON_JSON="/etc/docker/daemon.json"
CURRENT_DNS=""

if [ -f "$DAEMON_JSON" ]; then
    CURRENT_DNS=$(grep -oP '"dns":\s*\["\K[^"]+' "$DAEMON_JSON" 2>/dev/null || true)
fi

if [ "$CURRENT_DNS" != "$WSL_DNS" ]; then
    echo "Updating Docker DNS from '$CURRENT_DNS' to '$WSL_DNS'"
    echo "{\"dns\": [\"$WSL_DNS\"]}" | sudo tee "$DAEMON_JSON" > /dev/null
    sudo systemctl restart docker
    echo "Docker DNS updated and service restarted"
else
    echo "Docker DNS is already configured correctly: $WSL_DNS"
fi
