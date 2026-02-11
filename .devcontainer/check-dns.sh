#!/bin/bash
# DNS connectivity check script

echo "=== DNS Configuration Check ==="
echo ""

echo "1. Checking /etc/resolv.conf:"
cat /etc/resolv.conf
echo ""

echo "2. Testing DNS resolution with multiple servers:"
for dns in 8.8.8.8 1.1.1.1 8.8.4.4; do
    echo "Testing DNS server: $dns"
    if command -v nslookup &> /dev/null; then
        nslookup github.com $dns 2>&1 | head -5 || echo "nslookup to $dns failed"
    elif command -v dig &> /dev/null; then
        dig @$dns github.com +short +time=5 2>&1 || echo "dig to $dns failed"
    else
        echo "No DNS tools available"
    fi
    echo ""
done

echo "3. Testing connectivity to package repositories:"
for host in deb.debian.org dl.yarnpkg.com archive.ubuntu.com; do
    echo "Testing connection to $host:"
    if command -v nc &> /dev/null; then
        timeout 5 nc -z $host 80 2>&1 && echo "$host:80 is reachable" || echo "$host:80 is NOT reachable"
    else
        curl -I --connect-timeout 5 --max-time 10 http://$host 2>&1 | head -3
    fi
    echo ""
done

echo "4. Network interfaces and routing:"
ip addr show | grep -E "inet |mtu" | head -10
echo ""
ip route | head -5
echo ""

echo "=== End of DNS Check ==="
