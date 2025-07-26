#!/bin/bash
# Permanent fix for port conflicts - kill all Node processes on port 5000

echo "Cleaning up existing server processes..."

# Kill processes by name
pkill -f "node.*server" 2>/dev/null || true
pkill -f "tsx.*server" 2>/dev/null || true

# Find and kill processes using port 5000
PORT_PIDS=$(ps aux | grep -E "(node|tsx).*5000" | grep -v grep | awk '{print $2}')
if [ ! -z "$PORT_PIDS" ]; then
    echo "Killing processes on port 5000: $PORT_PIDS"
    echo "$PORT_PIDS" | xargs kill -9 2>/dev/null || true
fi

echo "Cleanup complete!"