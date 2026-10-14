#!/bin/sh
# Planifie la sauvegarde quotidienne (BACKUP_CRON, défaut 02:30) via crond.
set -eu
echo "${BACKUP_CRON:-30 2 * * *} /usr/local/bin/backup.sh >> /proc/1/fd/1 2>&1" > /etc/crontabs/root
echo "[backup] planifié : ${BACKUP_CRON:-30 2 * * *} (TZ=${TZ:-UTC})"
exec crond -f -l 8
