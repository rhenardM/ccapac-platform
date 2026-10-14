#!/usr/bin/env bash
# Obtention initiale du certificat Let's Encrypt (une fois par environnement,
# après que les DNS pointent vers le VPS). Le renouvellement est ensuite
# automatique (conteneur certbot + rechargement Nginx toutes les 6 h).
#   infra/scripts/init-letsencrypt.sh            # certificat réel
#   infra/scripts/init-letsencrypt.sh --staging  # test (CA de test Let's Encrypt)
set -euo pipefail
cd "$(dirname "$0")/../.."
COMPOSE=(docker compose -f docker-compose.yml -f docker-compose.prod.yml)
set -a; . ./.env; set +a
: "${LETSENCRYPT_EMAIL:?LETSENCRYPT_EMAIL manquant dans .env}"

EXTRA=()
[ "${1:-}" = "--staging" ] && EXTRA+=(--staging)

"${COMPOSE[@]}" run --rm --entrypoint certbot certbot certonly \
	--webroot -w /var/www/certbot \
	--cert-name "${SITE_DOMAIN}" \
	-d "${SITE_DOMAIN}" -d "www.${SITE_DOMAIN}" -d "${API_DOMAIN}" -d "${NODE_API_DOMAIN}" \
	--email "${LETSENCRYPT_EMAIL}" --agree-tos --no-eff-email --non-interactive \
	"${EXTRA[@]}"

"${COMPOSE[@]}" exec nginx /docker-entrypoint.d/10-certificates.sh
"${COMPOSE[@]}" exec nginx nginx -s reload
echo "Certificat installé pour ${SITE_DOMAIN}, ${API_DOMAIN}, ${NODE_API_DOMAIN}."
