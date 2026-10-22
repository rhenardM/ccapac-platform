#!/usr/bin/env bash
# Déploiement d'une version sur le serveur.
#
#   bash infra/scripts/deploy.sh --build                  # manuel : après `git pull`, images
#                                                         # construites sur le serveur
#   bash infra/scripts/deploy.sh --images <registre> <tag>  # CI/CD : images construites et
#                                                         # scannées par GitHub Actions (GHCR)
#
# Le .env du serveur reste la source de vérité des secrets : seules les lignes
# REGISTRY / IMAGE_TAG / FRONTEND_IMAGE_TAG sont mises à jour.
#
#   1. sauvegarde de la configuration courante (.env → .env.previous)
#   2. pull (ou build) des images, démarrage des données, migrations
#   3. démarrage des services + attente des healthchecks
#   4. vérification de bout en bout via Nginx
#   5. en cas d'échec : rollback automatique sur la version précédente
set -euo pipefail

cd "$(dirname "$0")/../.."
MODE=""
case "${1:-}" in
	--build) MODE=build ;;
	--images) MODE=pull; IMG_REGISTRY="${2:?--images <registre> <tag>}"; IMG_TAG="${3:?--images <registre> <tag>}" ;;
	*) echo "Usage : deploy.sh --build | --images <registre> <tag>"; exit 1 ;;
esac
log() { echo "[deploy] $(date -u +%H:%M:%S) $*"; }

# Fichiers montés par compose : doivent exister (sinon Docker crée un dossier).
mkdir -p infra/secrets && chmod 700 infra/secrets
touch infra/secrets/makuta_private.pem infra/secrets/rclone.conf
chmod 444 infra/secrets/makuta_private.pem
chmod 400 infra/secrets/rclone.conf

set_env() { # set_env CLE VALEUR : remplace ou ajoute la ligne dans .env
	if grep -q "^$1=" .env; then
		KEY="$1" VALUE="$2" perl -i -pe 's/^\Q$ENV{KEY}\E=.*/$ENV{KEY}=$ENV{VALUE}/' .env
	else
		printf '%s=%s\n' "$1" "$2" >> .env
	fi
}

[ -f .env ] || { log ".env absent : lancer d'abord infra/scripts/init-env.sh"; exit 1; }
cp .env .env.previous
if [ "${MODE}" = build ]; then
	TAG="$(git rev-parse --short=12 HEAD)"
	set_env REGISTRY ccapac
	set_env IMAGE_TAG "${TAG}"
	set_env FRONTEND_IMAGE_TAG "${TAG}"
else
	set_env REGISTRY "${IMG_REGISTRY}"
	set_env IMAGE_TAG "${IMG_TAG}"
	set_env FRONTEND_IMAGE_TAG "${IMG_TAG}-production"
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

if [ "${MODE}" = build ]; then
	log "build des images sur le serveur (plusieurs minutes pour le frontend)"
	"${COMPOSE[@]}" --profile tools build
else
	log "pull des images"
	"${COMPOSE[@]}" --profile tools pull --quiet
fi

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
