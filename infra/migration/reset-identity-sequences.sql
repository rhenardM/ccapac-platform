-- Recale toutes les séquences d'identité du schéma public sur max(id) + 1.
-- À exécuter après tout import de données en masse (pgloader, COPY…).
DO $$
DECLARE
	r record;
	next_id bigint;
BEGIN
	FOR r IN
		SELECT c.table_name, c.column_name, pg_get_serial_sequence(format('%I', c.table_name), c.column_name) AS seq
		FROM information_schema.columns c
		WHERE c.table_schema = 'public'
		  AND (c.is_identity = 'YES' OR c.column_default LIKE 'nextval(%')
	LOOP
		CONTINUE WHEN r.seq IS NULL;
		EXECUTE format('SELECT coalesce(max(%I), 0) + 1 FROM %I', r.column_name, r.table_name) INTO next_id;
		PERFORM setval(r.seq, next_id, false);
		RAISE NOTICE '% → prochain id %', r.table_name, next_id;
	END LOOP;
END $$;
