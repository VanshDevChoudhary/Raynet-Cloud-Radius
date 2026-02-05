#!/bin/bash
# CloudRadius Health Check

echo "=== CloudRadius Health Check ==="
echo "Date: $(date)"
echo ""

# Check PM2 processes
echo "--- PM2 Processes ---"
pm2 jlist 2>/dev/null | python3 -c "
import sys, json
data = json.load(sys.stdin)
for p in data:
    mem = p['monit']['memory'] // 1024 // 1024
    print(f\"  {p['name']}: {p['pm2_env']['status']} (pid: {p['pid']}, memory: {mem}MB, restarts: {p['pm2_env']['restart_time']})\")" 2>/dev/null || pm2 status
echo ""

# Check Docker containers
echo "--- Docker Containers ---"
docker ps --format "  {{.Names}}: {{.Status}}" 2>/dev/null
echo ""

# Check FreeRADIUS
echo "--- FreeRADIUS ---"
if systemctl is-active --quiet freeradius; then
    echo "  Status: RUNNING"
else
    echo "  Status: DOWN"
fi
echo ""

# Check Nginx
echo "--- Nginx ---"
if systemctl is-active --quiet nginx; then
    echo "  Status: RUNNING"
else
    echo "  Status: DOWN"
fi
echo ""

# Check ports
echo "--- Ports ---"
echo "  TCP 443 (HTTPS):  $(ss -tlnp 2>/dev/null | grep -q ':443' && echo 'LISTENING' || echo 'NOT LISTENING')"
echo "  TCP 3000 (Next):  $(ss -tlnp 2>/dev/null | grep -q ':3000' && echo 'LISTENING' || echo 'NOT LISTENING')"
echo "  UDP 1812 (Auth):  $(ss -ulnp 2>/dev/null | grep -q ':1812' && echo 'LISTENING' || echo 'NOT LISTENING')"
echo "  UDP 1813 (Acct):  $(ss -ulnp 2>/dev/null | grep -q ':1813' && echo 'LISTENING' || echo 'NOT LISTENING')"
echo ""

# Disk usage
echo "--- Disk ---"
df -h / | tail -1 | awk '{print "  Used: "$3"/"$2" ("$5")"}'
echo ""

# Memory
echo "--- Memory ---"
free -h | grep Mem | awk '{print "  Used: "$3"/"$2" (Available: "$7")"}'
echo ""

echo "=== End Health Check ==="
