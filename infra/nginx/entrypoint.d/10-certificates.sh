#!/bin/sh
# Sélectionne le certificat TLS à utiliser :
#  - Let's Encrypt (/etc/letsencrypt/live/$SITE_DOMAIN) s'il a été obtenu ;
#  - sinon un certificat auto-signé couvrant tous les domaines, pour que Nginx
#    démarre (premier déploiement, développement local).
set -eu

LE_DIR="/etc/letsencrypt/live/${SITE_DOMAIN}"
FALLBACK_DIR="/etc/nginx/certs/selfsigned"
CURRENT="/etc/nginx/certs/current"

mkdir -p /etc/nginx/certs /var/www/certbot

if [ -f "${LE_DIR}/fullchain.pem" ]; then
	ln -sfn "${LE_DIR}" "${CURRENT}"
	echo "[certs] Certificat Let's Encrypt utilisé (${LE_DIR})"
	exit 0
fi

if [ ! -f "${FALLBACK_DIR}/fullchain.pem" ]; then
	mkdir -p "${FALLBACK_DIR}"
	openssl req -x509 -nodes -newkey rsa:2048 -days 30 \
		-keyout "${FALLBACK_DIR}/privkey.pem" \
		-out "${FALLBACK_DIR}/fullchain.pem" \
		-subj "/CN=${SITE_DOMAIN}" \
		-addext "subjectAltName=DNS:${SITE_DOMAIN},DNS:www.${SITE_DOMAIN},DNS:${API_DOMAIN},DNS:${NODE_API_DOMAIN}" \
		>/dev/null 2>&1
fi
ln -sfn "${FALLBACK_DIR}" "${CURRENT}"
echo "[certs] ATTENTION : certificat auto-signé (lancer infra/scripts/init-letsencrypt.sh en production)"
