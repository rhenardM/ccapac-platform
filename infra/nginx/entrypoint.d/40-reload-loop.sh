#!/bin/sh
# Recharge Nginx toutes les 6 h pour prendre en compte les certificats renouvelés
# par le conteneur certbot (et rebascule sur Let's Encrypt dès qu'il est disponible).
(
	while :; do
		sleep 6h
		/docker-entrypoint.d/10-certificates.sh >/dev/null 2>&1 || true
		nginx -s reload >/dev/null 2>&1 || true
	done
) &
