#!/bin/bash
# Sauvegarde chiffrée : bases PostgreSQL + base MySQL transitoire du node-api
# + fichiers uploadés. Chiffrement asymétrique (age) : le serveur ne détient que
# la clé PUBLIQUE ; la clé privée de restauration est conservée hors serveur.
set -euo pipefail

: "${BACKUP_AGE_RECIPIENT:?BACKUP_AGE_RECIPIENT manquant (clé publique age)}"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
DIR="/backups/${STAMP}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-14}"
mkdir -p "${DIR}"

encrypt() { age -r "${BACKUP_AGE_RECIPIENT}" -o "$1.age"; }

echo "[backup] ${STAMP} — début"

export PGPASSWORD="${POSTGRES_PASSWORD:?}"
for db in ccapac_api ccapac_members; do
	pg_dump -h postgres -U "${POSTGRES_USER:-postgres}" -d "${db}" --format=custom --no-owner \
		| encrypt "${DIR}/${db}.dump"
done
unset PGPASSWORD

if [ -n "${NODE_DB_PASSWORD:-}" ]; then
	mysqldump -h node-db -u ccapac_node -p"${NODE_DB_PASSWORD}" \
		--single-transaction --routines --no-tablespaces ccapac_node \
		| gzip | encrypt "${DIR}/ccapac_node.sql.gz"
fi

tar -C /data -czf - . | encrypt "${DIR}/uploads.tar.gz"

( cd "${DIR}" && sha256sum *.age > SHA256SUMS )
echo "[backup] fichiers : $(ls "${DIR}" | tr '\n' ' ')"

# Copie hors serveur (obligatoire en production) : rclone configuré par variables
# RCLONE_CONFIG_<REMOTE>_* — ex. Backblaze B2, S3, Google Drive.
if [ -n "${BACKUP_RCLONE_DEST:-}" ]; then
	rclone copy "${DIR}" "${BACKUP_RCLONE_DEST}/${STAMP}" --quiet
	echo "[backup] copié vers ${BACKUP_RCLONE_DEST}/${STAMP}"
else
	echo "[backup] ATTENTION : BACKUP_RCLONE_DEST vide — sauvegarde uniquement locale"
fi

find /backups -mindepth 1 -maxdepth 1 -type d -mtime "+${RETENTION_DAYS}" -exec rm -rf {} +
echo "[backup] ${STAMP} — terminé (rétention locale ${RETENTION_DAYS} j)"
