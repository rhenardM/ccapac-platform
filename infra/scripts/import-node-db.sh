#!/usr/bin/env bash
# Importe les données de l'ancienne base MySQL du node-api (export table par
# table `site_<table>.sql`, ex. architecture_base_de_donnees.zip) dans le
# service `node-db`. À lancer en utilisateur `deploy`, depuis le dossier de
# l'environnement :
#
#   bash infra/scripts/import-node-db.sh ~/architecture_base_de_donnees.zip
#   bash infra/scripts/import-node-db.sh ~/architecture_base_de_donnees/      # dossier déjà extrait
#
# Déroulé :
#   1. sauvegarde de la base actuelle (retour arrière possible)
#   2. arrêt du node-api (aucune écriture pendant l'import)
#   3. import des seules tables du schéma versionné (node-api/database/schema.sql) ;
#      les tables hors schéma (manifest, sessions, *_backup_*) sont ignorées
#   4. contrôle : nombre de lignes par table, tables du schéma toutes présentes
#   5. redémarrage du node-api + health check
#
# Ré-exécutable : chaque fichier fait DROP TABLE IF EXISTS puis recrée la table.
set -euo pipefail
cd "$(dirname "$0")/../.."

SRC="${1:?Usage : import-node-db.sh <export.zip | dossier>}"
[ -e "${SRC}" ] || { echo "Introuvable : ${SRC}"; exit 1; }

set -a; . ./.env; set +a
export COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.yml:docker-compose.prod.yml}"
STAMP="$(date +%Y%m%d-%H%M%S)"
WORK="$(mktemp -d)"
log() { echo "[import-node] $(date +%H:%M:%S) $*"; }
mysql_root() { docker compose exec -T -e MYSQL_PWD="${NODE_DB_ROOT_PASSWORD:?}" node-db mysql -uroot "$@"; }

cleanup() {
	rm -rf "${WORK}"
	docker compose up -d node-api >/dev/null 2>&1 || true
}
trap cleanup EXIT

# --- Fichiers source ---
if [ -d "${SRC}" ]; then
	DIR="$(realpath "${SRC}")"
else
	python3 - "${SRC}" "${WORK}" <<'PY'
import sys, zipfile, os
src, dest = sys.argv[1], sys.argv[2]
with zipfile.ZipFile(src) as z:
    for name in z.namelist():
        # Sécurité : uniquement des .sql, à plat, sans chemin absolu ni « .. ».
        base = os.path.basename(name)
        if not base.endswith(".sql") or name.startswith("/") or ".." in name.split("/"):
            continue
        with z.open(name) as f, open(os.path.join(dest, base), "wb") as out:
            out.write(f.read())
PY
	DIR="${WORK}"
fi

TABLES=()
while IFS= read -r t; do TABLES+=("${t}"); done \
	< <(grep -oE 'CREATE TABLE IF NOT EXISTS `[a-z_0-9]+`' node-api/database/schema.sql | sed -E 's/.*`([a-z_0-9]+)`/\1/')
log "${#TABLES[@]} tables dans le schéma versionné"

log "1/5 sauvegarde de ccapac_node avant import"
mkdir -p backups-import && chmod 700 backups-import
docker compose exec -T -e MYSQL_PWD="${NODE_DB_ROOT_PASSWORD}" node-db \
	mysqldump -uroot --single-transaction --routines --no-tablespaces ccapac_node \
	| gzip > "backups-import/ccapac_node-avant-import-${STAMP}.sql.gz"
log "    → backups-import/ccapac_node-avant-import-${STAMP}.sql.gz"

log "2/5 arrêt du node-api"
docker compose stop node-api >/dev/null

log "3/5 import des tables"
IMPORTED=0
for table in "${TABLES[@]}"; do
	file="$(ls "${DIR}"/site_"${table}".sql "${DIR}"/"${table}".sql 2>/dev/null | head -1 || true)"
	if [ -z "${file}" ]; then
		log "    ABSENT de l'export : ${table} (table créée vide par le schéma)"
		continue
	fi
	mysql_root ccapac_node < "${file}"
	IMPORTED=$((IMPORTED + 1))
done
for f in "${DIR}"/*.sql; do
	t="$(basename "${f}" .sql)"; t="${t#site_}"
	printf '%s\n' "${TABLES[@]}" | grep -qx "${t}" || log "    ignorée (hors schéma) : ${t}"
done

log "4/5 contrôle"
# Le schéma garantit toutes les tables (y compris celles absentes de l'export).
mysql_root ccapac_node < node-api/database/schema.sql
for table in "${TABLES[@]}"; do
	printf '    %-32s %s lignes\n' "${table}" "$(mysql_root -N ccapac_node -e "SELECT COUNT(*) FROM \`${table}\`")"
done
# Les tables recréées par les dumps appartiennent à root : droits de l'application.
mysql_root -e "GRANT ALL PRIVILEGES ON ccapac_node.* TO 'ccapac_node'@'%'; FLUSH PRIVILEGES;"

log "5/5 redémarrage du node-api"
trap - EXIT
rm -rf "${WORK}"
docker compose up -d --wait --wait-timeout 120 node-api >/dev/null 2>&1
log "terminé : ${IMPORTED}/${#TABLES[@]} tables importées. Retour arrière : gunzip -c backups-import/ccapac_node-avant-import-${STAMP}.sql.gz | mysql"
