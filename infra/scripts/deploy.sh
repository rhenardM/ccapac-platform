#!/usr/bin/env bash
# Déploiement d'une version sur le serveur (staging ou production).
# Appelé par la CI : la nouvelle configuration est déposée dans .env.next.
#
#   1. sauvegarde de la configuration courante (.env → .env.previous)
#   2. pull des images, démarrage des données, migrations
#   3. démarrage des services + attente des healthchecks
#   4. vérification de bout en bout via Nginx
#   5. en cas d'échec : rollback automatique sur la version précédente
set -euo pipefail

cd "$(dirname "$0")/../.."
log() { echo "[deploy] $(date -u +%H:%M:%S) $*"; }

# Fichiers montés par compose : doivent exister (sinon Docker crée un dossier).
mkdir -p infra/secrets && chmod 700 infra/secrets
touch infra/secrets/makuta_private.pem infra/secrets/rclone.conf
chmod 444 infra/secrets/makuta_private.pem
chmod 400 infra/secrets/rclone.conf

if [ -f .env.next ]; then
	[ -f .env ] && cp .env .env.previous
	mv .env.next .env
fi
chmod 600 .env .env.previous 2>/dev/null || true

set -a; . ./.env; set +a
# Fichiers compose : COMPOSE_FILE du .env (ex. mode Caddy), sinon prod standard.
export COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.yml:docker-compose.prod.yml}"
COMPOSE=(docker compose)
log "version ${IMAGE_TAG} (frontend ${FRONTEND_IMAGE_TAG:-$IMAGE_TAG}) — projet ${COMPOSE_PROJECT_NAME}"

rollback() {
	log "ÉCHEC — rollback"
	"${COMPOSE[@]}" logs --tail=80 || true
	if [ -f .env.previous ]; then
		cp .env .env.failed && cp .env.previous .env
		"${COMPOSE[@]}" up -d --remove-orphans --wait --wait-timeout 180 \
			&& log "rollback effectué vers $(grep '^IMAGE_TAG=' .env | cut -d= -f2)" \
			|| log "ROLLBACK EN ÉCHEC — intervention manuelle requise"
	else
		log "aucune version précédente : pas de rollback possible"
	fi
	exit 1
}
trap rollback ERR

log "pull des images"
"${COMPOSE[@]}" --profile tools pull --quiet

log "démarrage des services de données"
"${COMPOSE[@]}" up -d --wait --wait-timeout 120 postgres redis node-db

log "migrations Symfony (Doctrine)"
"${COMPOSE[@]}" run --rm --no-deps backend \
	php bin/console doctrine:migrations:migrate --no-interaction --allow-no-migration

log "migrations frontend (Prisma)"
"${COMPOSE[@]}" --profile tools run --rm --no-deps frontend-migrate

log "démarrage de la nouvelle version"
"${COMPOSE[@]}" up -d --remove-orphans --wait --wait-timeout 180

log "vérification de bout en bout via Nginx"
check() {
	if [ -n "${EDGE_PORT:-}" ]; then
		# Mode Caddy : Nginx écoute en HTTP sur 127.0.0.1:EDGE_PORT.
		curl -fsS --max-time 5 -H "Host: $1" -H "X-Forwarded-Proto: https" "http://127.0.0.1:${EDGE_PORT}/api/health"
	else
		curl -fsSk --max-time 5 --resolve "$1:443:127.0.0.1" "https://$1/api/health"
	fi
}
for host in "${SITE_DOMAIN}" "${API_DOMAIN}" "${NODE_API_DOMAIN}"; do
	ok=0
	for _ in $(seq 1 10); do
		if check "${host}" >/dev/null; then
			ok=1; break
		fi
		sleep 3
	done
	[ "${ok}" = 1 ] || { log "health check KO : ${host}"; false; }
	log "health check OK : ${host}"
done

trap - ERR
docker image prune -af --filter "until=168h" >/dev/null || true
log "déploiement terminé"
