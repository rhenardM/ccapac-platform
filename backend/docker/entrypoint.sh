#!/bin/sh
set -e

# Le système de fichiers du conteneur est en lecture seule : var/ est un tmpfs,
# le cache Symfony est donc (re)chauffé à chaque démarrage.
if [ "$1" = "frankenphp" ] || [ "$1" = "php" ]; then
	mkdir -p var/cache var/log public/uploads/media
	php bin/console cache:warmup --no-interaction >/dev/null
fi

exec "$@"
