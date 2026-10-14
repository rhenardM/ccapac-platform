#!/bin/sh
# Exécuté une seule fois, à la création du volume PostgreSQL.
# Une base + un rôle dédié par application (moindre privilège) :
#   - ccapac_api      → backend Symfony
#   - ccapac_members  → frontend Next.js (Prisma)
set -eu

create_db() {
	db="$1"; role="$2"; password="$3"
	psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname postgres <<-SQL
		CREATE ROLE ${role} LOGIN PASSWORD '${password}';
		CREATE DATABASE ${db} OWNER ${role};
		REVOKE ALL ON DATABASE ${db} FROM PUBLIC;
	SQL
}

create_db ccapac_api     ccapac_api     "${POSTGRES_API_PASSWORD:?}"
create_db ccapac_members ccapac_members "${POSTGRES_MEMBERS_PASSWORD:?}"
