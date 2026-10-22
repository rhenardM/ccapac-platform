#!/usr/bin/env bash
# Ajoute (ou met à jour) les domaines d'un environnement CCAPAC dans Caddy,
# SANS modifier les autres sites (ex. MOSELINE Pay). À lancer en root :
#   bash infra/scripts/caddy-site.sh /opt/ccapac/staging
#
# - lit SITE_DOMAIN, API_DOMAIN, NODE_API_DOMAIN, EDGE_PORT dans <dossier>/.env
# - écrit /etc/caddy/conf.d/ccapac-<env>.caddy
# - ajoute une seule fois `import /etc/caddy/conf.d/*.caddy` au Caddyfile
# - valide la configuration AVANT de recharger ; restaure tout en cas d'erreur
set -euo pipefail

DIR="${1:?Usage : caddy-site.sh <dossier_environnement>}"
[ "$(id -u)" = 0 ] || { echo "À lancer en root."; exit 1; }
set -a; . "${DIR}/.env"; set +a
: "${SITE_DOMAIN:?}" "${API_DOMAIN:?}" "${NODE_API_DOMAIN:?}" "${EDGE_PORT:?}"

ENVIRONMENT="${COMPOSE_PROJECT_NAME#ccapac-}"
CADDYFILE=/etc/caddy/Caddyfile
CONF_DIR=/etc/caddy/conf.d
TARGET="${CONF_DIR}/ccapac-${ENVIRONMENT}.caddy"
STAMP="$(date +%Y%m%d%H%M%S)"

HOSTS="${SITE_DOMAIN}, ${API_DOMAIN}, ${NODE_API_DOMAIN}"
# www.<domaine> uniquement s'il existe dans le DNS (sinon Caddy échoue à émettre le certificat).
if [ "${CADDY_INCLUDE_WWW:-false}" = "true" ]; then
	HOSTS="${SITE_DOMAIN}, www.${SITE_DOMAIN}, ${API_DOMAIN}, ${NODE_API_DOMAIN}"
fi

# Autres noms de l'API (API_DOMAIN_ALIASES, séparés par des espaces).
for alias in ${API_DOMAIN_ALIASES:-}; do HOSTS="${HOSTS}, ${alias}"; done

mkdir -p "${CONF_DIR}" /var/log/caddy
chown caddy:caddy /var/log/caddy 2>/dev/null || true
cp "${CADDYFILE}" "${CADDYFILE}.bak-${STAMP}"
[ -f "${TARGET}" ] && cp "${TARGET}" "${TARGET}.bak-${STAMP}"

restore() {
	echo "Configuration invalide : restauration."
	cp "${CADDYFILE}.bak-${STAMP}" "${CADDYFILE}"
	if [ -f "${TARGET}.bak-${STAMP}" ]; then cp "${TARGET}.bak-${STAMP}" "${TARGET}"; else rm -f "${TARGET}"; fi
	exit 1
}

grep -q '^import /etc/caddy/conf.d/\*.caddy' "${CADDYFILE}" \
	|| printf '\n# Sites additionnels (un fichier par application)\nimport /etc/caddy/conf.d/*.caddy\n' >> "${CADDYFILE}"

ENVIRONMENT="${ENVIRONMENT}" EDGE_PORT="${EDGE_PORT}" CADDY_HOSTS="${HOSTS}" \
	envsubst '${ENVIRONMENT} ${EDGE_PORT} ${CADDY_HOSTS}' \
	< "$(dirname "$0")/../caddy/ccapac.caddy.template" > "${TARGET}"

caddy validate --config "${CADDYFILE}" --adapter caddyfile || restore
systemctl reload caddy || restore
echo "Caddy rechargé : ${HOSTS} → 127.0.0.1:${EDGE_PORT}"
