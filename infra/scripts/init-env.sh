#!/usr/bin/env bash
# Génère le .env de production sur le serveur, avec des secrets aléatoires.
# Ne remplace jamais un .env existant.
#
#   bash infra/scripts/init-env.sh                     # domaines sslip.io dérivés de l'IP
#   bash infra/scripts/init-env.sh centreculturel.cd api.centreculturel.cd app-api.centreculturel.cd
#
# Phase « IP » : <ip>.sslip.io résout automatiquement vers l'IP (aucun DNS à
# configurer) et Caddy obtient de vrais certificats HTTPS pour ces noms.
# Passage aux vrais domaines : changer SITE_DOMAIN / API_DOMAIN / NODE_API_DOMAIN /
# BACKEND_CORS_ALLOW_ORIGIN dans .env, puis redéployer et relancer caddy-site.sh.
set -euo pipefail
cd "$(dirname "$0")/../.."

[ -f .env ] && { echo ".env existe déjà : rien n'est modifié."; exit 1; }

IP="${SERVER_IP:-$(curl -4 -fsS https://ifconfig.me)}"
BASE="${IP//./-}.sslip.io"
SITE="${1:-${BASE}}"
API="${2:-api.${BASE}}"
NODE="${3:-app-api.${BASE}}"

secret() { openssl rand -hex 32; }
# Regex CORS : points échappés, www optionnel.
CORS="^https://(www\\.)?${SITE//./\\.}\$"

cp .env.example .env
chmod 600 .env

set_env() { # remplace la ligne CLE=… (ou l'ajoute)
	local key="$1" value="$2"
	if grep -q "^${key}=" .env; then
		KEY="${key}" VALUE="${value}" perl -i -pe 's/^\Q$ENV{KEY}\E=.*/$ENV{KEY}=$ENV{VALUE}/' .env
	else
		printf '%s=%s\n' "${key}" "${value}" >> .env
	fi
}

set_env COMPOSE_PROJECT_NAME ccapac-production
set_env COMPOSE_FILE "'docker-compose.yml:docker-compose.prod.yml:docker-compose.caddy.yml'"
set_env EDGE_PORT 8080
set_env CADDY_INCLUDE_WWW false
set_env SITE_DOMAIN "${SITE}"
set_env API_DOMAIN "${API}"
set_env NODE_API_DOMAIN "${NODE}"
set_env BACKEND_CORS_ALLOW_ORIGIN "'${CORS}'"

for key in POSTGRES_PASSWORD POSTGRES_API_PASSWORD POSTGRES_MEMBERS_PASSWORD \
	NODE_DB_PASSWORD NODE_DB_ROOT_PASSWORD REDIS_PASSWORD JWT_SECRET \
	EMAIL_RELAY_SECRET INTERNAL_API_KEY BACKEND_APP_SECRET; do
	set_env "${key}" "$(secret)"
done

echo ".env créé (chmod 600) :"
echo "  site     https://${SITE}"
echo "  API      https://${API}"
echo "  node-api https://${NODE}"
echo "À compléter avant la mise en service réelle : Makuta, SMTP, Google, Cloudinary, sauvegardes."
echo "Les secrets générés ne sont affichés nulle part : conserver une copie chiffrée du .env."
