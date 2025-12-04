#!/bin/bash
echo "===================="
echo "📦 Dev Environment Report"
echo "===================="

echo ""
echo "🖥️ System Info"
uname -a
lsb_release -a 2>/dev/null

echo ""
echo "📦 Installed Packages (core)"
echo "Node: $(node -v 2>/dev/null)"
echo "npm: $(npm -v 2>/dev/null)"
echo "pnpm: $(pnpm -v 2>/dev/null)"
echo "yarn: $(yarn -v 2>/dev/null)"
echo "Vite: $(npx vite -v 2>/dev/null)"

echo ""
echo "🐳 Docker Info"
docker --version 2>/dev/null
docker info --format '{{.ServerVersion}}' 2>/dev/null
echo "Containers:"
docker ps -a --format "table {{.Names}}\t{{.Status}}" 2>/dev/null
echo "Images:"
docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}" 2>/dev/null

echo ""
echo "🔗 Git Info"
git --version 2>/dev/null
git config --list | grep -E 'user.name|user.email' 2>/dev/null

echo ""
echo "📂 Project Snapshot"
echo "Current directory: $(pwd)"
ls -la | head -20

