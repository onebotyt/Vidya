#!/usr/bin/env bash
# =============================================================================
# VidyaOS Server-Room & VPS Auto-Updater (GitOps)
# Usage: ./deploy/update.sh
# =============================================================================

set -e

echo "=========================================================="
echo " 🎓 VidyaOS Server Auto-Update Process Starting..."
echo "=========================================================="

# 1. Fetch latest commits from GitHub
echo "[1/3] Fetching latest code from GitHub repository..."
git pull origin main

# 2. Build and restart Docker containers in background
echo "[2/3] Rebuilding Docker containers with persistent volumes..."
docker compose up -d --build

# 3. Prune dangling images
echo "[3/3] Cleaning up old Docker images..."
docker image prune -f

echo "=========================================================="
echo " ✅ VidyaOS is successfully updated and running!"
echo " 🌐 Web Portal: http://localhost:3000"
echo "=========================================================="
