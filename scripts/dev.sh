#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
if [ ! -d .venv ]; then
  python3 -m venv .venv
  .venv/bin/pip install -r services/api/requirements.lock
fi
if [ ! -d node_modules ]; then npm ci; fi
exec .venv/bin/python scripts/dev.py
