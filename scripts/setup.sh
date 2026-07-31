#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "==> SINet project setup"

if ! command -v node >/dev/null 2>&1; then
  echo "Error: Node.js is required (v20+). Install from https://nodejs.org or use nvm."
  exit 1
fi

NODE_MAJOR="$(node -e "console.log(process.versions.node.split('.')[0])")"
if [ "$NODE_MAJOR" -lt 20 ]; then
  echo "Warning: Node.js 20+ recommended (found v$(node -v))"
fi

echo "==> Installing dependencies"
npm install

if [ ! -f .env.local ] && [ ! -f .env ]; then
  echo "==> Creating .env.local from .env.example"
  cp .env.example .env.local
  echo "    Edit .env.local with your credentials before testing forms."
elif [ -f .env.local ]; then
  echo "==> .env.local already exists (skipping copy)"
else
  echo "==> .env already exists (skipping copy)"
fi

echo "==> Checking environment"
npm run check:env || true

echo ""
echo "Setup complete. Next steps:"
echo "  1. Edit .env.local with your API keys"
echo "  2. (Optional) docker compose up -d   # local MongoDB"
echo "  3. npm run dev                        # start dev server"
echo ""
echo "See docs/development.md for the full guide."
