#!/usr/bin/env bash
# Certificats HTTPS locaux reconnus par le navigateur (plus d'avertissement,
# et les appels du site vers https://api.localhost / https://app-api.localhost
# ne sont plus bloqués). À lancer une fois sur le poste de développement :
#
#   brew install mkcert            # macOS (Linux : voir https://github.com/FiloSottile/mkcert)
#   bash infra/scripts/dev-certs.sh
#   docker compose up -d --force-recreate nginx
#
# `mkcert -install` ajoute une autorité locale au trousseau (mot de passe demandé).
set -euo pipefail
cd "$(dirname "$0")/../.."
command -v mkcert >/dev/null || { echo "mkcert absent : brew install mkcert"; exit 1; }

mkcert -install
mkcert -cert-file infra/dev-certs/fullchain.pem -key-file infra/dev-certs/privkey.pem \
	localhost www.localhost api.localhost app-api.localhost 127.0.0.1 ::1
chmod 644 infra/dev-certs/*.pem
echo "Certificats créés dans infra/dev-certs/. Relancer : docker compose up -d --force-recreate nginx"
