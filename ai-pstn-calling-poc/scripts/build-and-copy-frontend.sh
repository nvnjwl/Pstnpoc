#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FRONTEND_DIR="$ROOT_DIR/frontend"
BACKEND_PUBLIC_DIR="$ROOT_DIR/backend/public"

cd "$FRONTEND_DIR"
npm install
npm run build

rm -rf "$BACKEND_PUBLIC_DIR"
mkdir -p "$BACKEND_PUBLIC_DIR"
cp -R "$FRONTEND_DIR/dist/"* "$BACKEND_PUBLIC_DIR"

printf "Frontend built and copied to backend/public\n"
