#!/usr/bin/env bash
# Importe un dump MySQL/MariaDB de l'ancien backend Symfony (Hostinger) dans la
# base PostgreSQL `ccapac_api`, puis (optionnel) les fichiers uploadés.
# À lancer en utilisateur `deploy`, depuis le dossier de l'environnement :
#
#   bash infra/scripts/import-mysql-dump.sh ~/u852632793_site_db.sql [~/uploads/media]
#
# Déroulé :
#   1. sauvegarde de la base PostgreSQL actuelle (retour arrière possible)
#   2. arrêt de backend / worker / scheduler (aucune écriture pendant l'import)
#   3. dump chargé dans un MariaDB temporaire (réseau interne, jetable)
#   4. pgloader : DONNÉES uniquement, dans le schéma créé par les migrations
#   5. recalage des séquences d'identité, contrôle des volumes par table
#   6. copie des médias dans le volume, redémarrage, suppression du temporaire
#
# Tables ignorées : `actualite`, `event`, `media` (lues par le node-api, pas par
# Symfony) et `doctrine_migration_versions` (gérée par les migrations PostgreSQL).
set -euo pipefail
cd "$(dirname "$0")/../.."

DUMP="$(realpath "${1:?Usage : import-mysql-dump.sh <dump.sql> [dossier_medias]}")"
MEDIA_DIR="${2:-}"
[ -f "${DUMP}" ] || { echo "Dump introuvable : ${DUMP}"; exit 1; }
[ -z "${MEDIA_DIR}" ] || [ -d "${MEDIA_DIR}" ] || { echo "Dossier médias introuvable : ${MEDIA_DIR}"; exit 1; }

set -a; . ./.env; set +a
export COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.yml:docker-compose.prod.yml}"
PROJECT="${COMPOSE_PROJECT_NAME:?}"
NET="${PROJECT}_backend"
TMP_DB="${PROJECT}-legacy-mysql"
TMP_PW="$(openssl rand -hex 16)"
STAMP="$(date +%Y%m%d-%H%M%S)"
WORK="$(mktemp -d)"
log() { echo "[import] $(date +%H:%M:%S) $*"; }
psql_api() { docker compose exec -T postgres psql -U postgres -d ccapac_api -v ON_ERROR_STOP=1 "$@"; }

cleanup() {
	docker rm -f "${TMP_DB}" >/dev/null 2>&1 || true
	rm -rf "${WORK}"
	docker compose up -d backend worker scheduler >/dev/null 2>&1 || true
}
trap cleanup EXIT

log "1/6 sauvegarde de ccapac_api avant import"
mkdir -p backups-import && chmod 700 backups-import
docker compose exec -T postgres pg_dump -U postgres -d ccapac_api --format=custom \
	> "backups-import/ccapac_api-avant-import-${STAMP}.dump"
log "    → backups-import/ccapac_api-avant-import-${STAMP}.dump"

log "2/6 arrêt de backend, worker, scheduler"
docker compose stop backend worker scheduler >/dev/null

log "3/6 chargement du dump dans un MariaDB temporaire"
docker run -d --name "${TMP_DB}" --network "${NET}" \
	-e MARIADB_ROOT_PASSWORD="${TMP_PW}" -e MARIADB_DATABASE=legacy \
	mariadb:11.8 >/dev/null
for _ in $(seq 1 60); do
	docker exec "${TMP_DB}" mariadb -uroot -p"${TMP_PW}" -e 'SELECT 1' >/dev/null 2>&1 && break
	sleep 2
done
docker exec -i "${TMP_DB}" mariadb -uroot -p"${TMP_PW}" legacy < "${DUMP}"

log "4/6 pgloader (données uniquement)"
cat > "${WORK}/import.load" <<EOF
LOAD DATABASE
  FROM mysql://root:${TMP_PW}@${TMP_DB}/legacy
  INTO postgresql://postgres:${POSTGRES_PASSWORD}@postgres/ccapac_api

WITH data only, truncate, disable triggers, reset sequences,
     create no tables, create no indexes, no foreign keys

CAST type datetime to timestamp drop default drop not null using zero-dates-to-null,
     type date drop not null drop default using zero-dates-to-null

EXCLUDING TABLE NAMES MATCHING 'actualite', 'event', 'media', 'doctrine_migration_versions'

ALTER SCHEMA 'legacy' RENAME TO 'public';
EOF
docker run --rm --network "${NET}" -v "${WORK}:/work:ro" dimitri/pgloader:latest \
	pgloader /work/import.load 2>&1 | grep -E "^\s+(public\.|Total)|ERROR|KABOOM" || true

log "5/6 recalage des séquences et contrôle"
{ echo "SET client_min_messages = warning;"; cat infra/migration/reset-identity-sequences.sql; } | psql_api -q >/dev/null
MISMATCH=0
while read -r table; do
	src=$(docker exec "${TMP_DB}" mariadb -uroot -p"${TMP_PW}" legacy -N -e "SELECT COUNT(*) FROM \`${table}\`")
	dst=$(psql_api -tAc "SELECT COUNT(*) FROM \"${table}\"")
	if [ "${src}" != "${dst}" ]; then
		echo "    ÉCART ${table} : MySQL=${src} PostgreSQL=${dst}"; MISMATCH=1
	fi
done < <(psql_api -tAc "SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE' AND table_name <> 'doctrine_migration_versions' AND table_name NOT LIKE 'messenger%'")
[ "${MISMATCH}" = 0 ] && log "    toutes les tables ont le même nombre de lignes qu'à la source"

if [ -n "${MEDIA_DIR}" ]; then
	log "6/6 copie des médias dans le volume ${PROJECT}_backend_uploads"
	docker run --rm -v "${PROJECT}_backend_uploads:/uploads" -v "$(realpath "${MEDIA_DIR}"):/src:ro" alpine:3.20 \
		sh -c 'mkdir -p /uploads/media && cp -a /src/. /uploads/media/ && chown -R 82:82 /uploads && ls /uploads/media | wc -l' \
		| sed 's/^/    fichiers dans uploads\/media : /'
else
	log "6/6 médias non fournis (2e argument) — les images renverront 404 tant qu'ils ne sont pas copiés"
fi

log "redémarrage des services"
trap - EXIT
cleanup
docker compose up -d --wait --wait-timeout 120 backend worker scheduler >/dev/null 2>&1
[ "${MISMATCH}" = 0 ] || { log "TERMINÉ AVEC ÉCARTS — vérifier ci-dessus (sauvegarde : backups-import/)"; exit 1; }
log "terminé. Retour arrière : pg_restore --clean de backups-import/ccapac_api-avant-import-${STAMP}.dump"
