#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

# Use the Node version pinned in .nvmrc when nvm is available.
if [ -s "${NVM_DIR:-$HOME/.nvm}/nvm.sh" ]; then
  # shellcheck disable=SC1091
  . "${NVM_DIR:-$HOME/.nvm}/nvm.sh"
  nvm use >/dev/null
fi

# npm 10 crashes resolving this dependency tree (arborist #loadPeerSet), so installs run on npm 11.
if [ -f package-lock.json ]; then
  INSTALL_CMD=(npx -y npm@11 ci)
else
  INSTALL_CMD=(npx -y npm@11 install)
fi
VERIFY_CMD=(npm run verify)
START_CMD=(npm run dev)

echo "==> Working directory: $PWD"
echo "==> Node: $(node -v)"
echo "==> Syncing dependencies"
"${INSTALL_CMD[@]}"

echo "==> Running baseline verification"
"${VERIFY_CMD[@]}"

echo "==> Startup command"
printf '    %q' "${START_CMD[@]}"
printf '\n'

if [ "${RUN_START_COMMAND:-0}" = "1" ]; then
  echo "==> Starting the app"
  exec "${START_CMD[@]}"
fi

echo "Set RUN_START_COMMAND=1 if you want init.sh to launch the app directly."
