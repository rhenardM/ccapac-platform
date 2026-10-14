#!/bin/bash
# Restauration / test de restauration d'une sauvegarde.
# Usage (dans le conteneur backup, clé privée montée temporairement) :
#   AGE_IDENTITY=/tmp/key.txt restore.sh <dossier> <base> [--into <base_cible>]
# Exemple de test régulier (ne touche pas la production) :
#   restore.sh /backups/20261014T023000Z ccapac_api --into restore_test
set -euo pipefail

DIR="$1"; DB="$2"; TARGET="${DB}"
[ "${3:-}" = "--into" ] && TARGET="$4"
: "${AGE_IDENTITY:?AGE_IDENTITY (chemin de la clé privée age) requis}"

( cd "${DIR}" && sha256sum -c SHA256SUMS )

export PGPASSWORD="${POSTGRES_PASSWORD:?}"
PSQL=(psql -h postgres -U "${POSTGRES_USER:-postgres}" -v ON_ERROR_STOP=1)

if [ "${TARGET}" != "${DB}" ]; then
	"${PSQL[@]}" -d postgres -c "DROP DATABASE IF EXISTS ${TARGET};" -c "CREATE DATABASE ${TARGET};"
fi

age -d -i "${AGE_IDENTITY}" "${DIR}/${DB}.dump.age" \
	| pg_restore -h postgres -U "${POSTGRES_USER:-postgres}" -d "${TARGET}" --no-owner --clean --if-exists

TABLES=$("${PSQL[@]}" -d "${TARGET}" -tAc "SELECT count(*) FROM information_schema.tables WHERE table_schema='public'")
echo "[restore] ${DB} → ${TARGET} : ${TABLES} tables restaurées"
