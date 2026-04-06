#!/usr/bin/env bash
# Usage: ./scripts/deploy-backend.sh
# Expects EC2_HOST and EC2_USER env vars (or edit defaults below).
# SSH key must be available via ssh-agent or EC2_KEY_PATH.

set -euo pipefail

EC2_HOST="${EC2_HOST:?EC2_HOST is required}"
EC2_USER="${EC2_USER:-ec2-user}"
APP_DIR="${APP_DIR:-/home/${EC2_USER}/prod/music-map}"
SSH_OPTS="-o StrictHostKeyChecking=no"

if [[ -n "${EC2_KEY_PATH:-}" ]]; then
  SSH_OPTS="${SSH_OPTS} -i ${EC2_KEY_PATH}"
fi

echo "Deploying backend to ${EC2_USER}@${EC2_HOST}:${APP_DIR}"

ssh ${SSH_OPTS} "${EC2_USER}@${EC2_HOST}" bash <<EOF
  set -euo pipefail
  cd "${APP_DIR}"
  git pull origin main
  cd backend
  npm ci --omit=dev
  # Copy nginx snippet and reload if changed
  sudo cp "${APP_DIR}/nginx/music-map.conf" /etc/nginx/default.d/music-map.conf
  sudo nginx -t && sudo systemctl reload nginx
  pm2 restart music-map-backend || pm2 start src/index.js --name music-map-backend
  pm2 save
EOF

echo "Backend deploy complete."
