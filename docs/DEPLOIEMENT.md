# Déploiement — VPS Hostinger

## 1. Environnements

VPS cible : **srv1976360 — 76.13.2.39 / 2a02:4780:41:762b::1** (Ubuntu 26.04, 2 vCPU, 8 Go),
partagé avec **MOSELINE Pay** servi par **Caddy** (service hôte, ports 80/443).

| | Staging (beta) | Production |
|---|---|---|
| Serveur | srv1976360 | srv1976360 |
| Dossier | `/opt/ccapac/staging` | `/opt/ccapac/production` |
| Projet compose | `ccapac-staging` | `ccapac-production` |
| Nginx (boucle locale) | `127.0.0.1:8081` | `127.0.0.1:8080` |
| Domaines (exemple) | `beta.centreculturel.cd`, `api-beta.…`, `app-api-beta.…` | `centreculturel.cd`, `api.…`, `app-api.…` |
| Déclenchement | auto après la CI sur `main` | après **validation manuelle** du staging |

### Mode « derrière Caddy » (ce VPS)

```
Internet ─443─► Caddy (hôte, TLS auto) ─┬─► 127.0.0.1:5085  MOSELINE Pay (inchangé)
                                        ├─► 127.0.0.1:8081  nginx ccapac-staging
                                        └─► 127.0.0.1:8080  nginx ccapac-production
```

- Caddy garde 80/443 et les certificats ; on **ajoute** un fichier par environnement
  dans `/etc/caddy/conf.d/` (script `infra/scripts/caddy-site.sh`, validation avant rechargement,
  restauration automatique en cas d'erreur). Le bloc MOSELINE n'est pas modifié.
- Nginx (`docker-compose.caddy.yml`) n'est publié que sur `127.0.0.1` : filtrage, limites
  de débit, en-têtes et logs restent appliqués ; certbot est désactivé.
- Dans le `.env` de chaque environnement :
  ```
  COMPOSE_FILE='docker-compose.yml:docker-compose.prod.yml:docker-compose.caddy.yml'
  EDGE_PORT=8081        # 8080 pour la production
  ```

Sur un VPS dédié, laisser `COMPOSE_FILE` / `EDGE_PORT` vides : Nginx publie 80/443 et
`infra/scripts/init-letsencrypt.sh` obtient les certificats.

## 2. Préparation du serveur (une fois)

1. Créer une paire de clés pour la CI : `ssh-keygen -t ed25519 -f ccapac-ci -C ci@ccapac`.
2. **Avant tout**, vérifier qu'une clé SSH root fonctionne (`/root/.ssh/authorized_keys` non vide
   et connexion testée) : le script désactive l'authentification par mot de passe
   (aujourd'hui active à cause de `50-cloud-init.conf`).
3. Sur le VPS (root) : `DEPLOY_PUBKEY="$(cat ccapac-ci.pub)" bash infra/scripts/server-setup.sh`.
   Idempotent et adapté au serveur partagé : swap 4 Go, fusion de `daemon.json` (pools d'adresses
   conservés), utilisateur `deploy`, `/opt/ccapac/{staging,production}`, UFW vérifié (aucune règle
   retirée), SSH par clé uniquement, fail2ban. **Tester `ssh deploy@76.13.2.39` avant de fermer la session root.**
4. hPanel → VPS → Pare-feu : n'autoriser que 22, 80 et 443.
5. DNS : faire pointer les domaines de l'environnement vers 76.13.2.39 (A) et
   2a02:4780:41:762b::1 (AAAA).
6. Après le premier déploiement d'un environnement (root) :
   `bash /opt/ccapac/staging/infra/scripts/caddy-site.sh /opt/ccapac/staging`.
7. Planifier le redémarrage en attente (`*** System restart required ***`) à une heure creuse :
   il coupe aussi MOSELINE Pay quelques instants.

## 3. Configuration GitHub

**Settings → Environments** : créer `staging` et `production` (avec *Required reviewers* sur `production`).

Secrets par environnement :

| Secret | Contenu |
|---|---|
| `SSH_HOST` / `SSH_USER` | IP du VPS / `deploy` |
| `SSH_PRIVATE_KEY` | contenu de `ccapac-ci` |
| `SSH_KNOWN_HOSTS` | sortie de `ssh-keyscan -H <IP>` |
| `DOTENV` | `.env` complet de l'environnement (modèle : `.env.example`, secrets via `openssl rand -hex 32`) |
| `MAKUTA_PRIVATE_KEY` | clé privée RSA Makuta (PEM) |
| `RCLONE_CONF` | config rclone du stockage externe des sauvegardes |

Variables par environnement : `DEPLOY_PATH`, `SITE_DOMAIN`.

Variables du dépôt (build du frontend) : `STAGING_SITE_DOMAIN`, `STAGING_API_DOMAIN`,
`STAGING_NODE_API_DOMAIN`, `PRODUCTION_SITE_DOMAIN`, `PRODUCTION_API_DOMAIN`,
`PRODUCTION_NODE_API_DOMAIN`, `GOOGLE_CLIENT_ID`, `PAYMENT_ENABLED`.

**Settings → Branches** : protéger `main` (PR obligatoire + CI verte).

## 4. Chaîne CI/CD

```
push/PR ──► CI : backend (lint, container, migrations PG, schema, PHPUnit, composer audit)
                 frontend (prisma, lint, tsc, build, npm audit)
                 node-api (syntaxe, npm audit)
                 infra (compose config, build images, nginx -t)
                 sécurité (gitleaks, Trivy)
merge main ──► images → GHCR (scan Trivy) ──► staging ──► validation ──► production
                                                │                        │
                                     deploy.sh : pull → migrations → up --wait
                                                 → health checks → rollback si échec
```

## 5. Premier déploiement d'un environnement

1. Lancer le workflow (merge sur `main` ou *Run workflow*).
2. TLS :
   - **mode Caddy (srv1976360)** : en root, `bash /opt/ccapac/<env>/infra/scripts/caddy-site.sh /opt/ccapac/<env>`
     (Caddy obtient les certificats dès que le DNS pointe vers le VPS) ;
   - VPS dédié : `cd /opt/ccapac/<env> && bash infra/scripts/init-letsencrypt.sh`.
3. Créer le premier administrateur back-office (dans `/opt/ccapac/<env>`, le `.env` fournit `COMPOSE_FILE`) :
   `docker compose exec backend php bin/console app:admin:create`.

## 6. Migration des données existantes

### Symfony : MySQL Hostinger → PostgreSQL

Le schéma PostgreSQL est créé par la migration de base (`backend/migrations/`).
Les anciennes migrations MySQL sont archivées dans `docs/legacy/backend-migrations-mysql/`.

```bash
# 1. Déployer (le schéma PG est créé par les migrations), puis arrêter les écritures :
docker compose -f docker-compose.yml -f docker-compose.prod.yml stop backend worker scheduler
# 2. Copier les DONNÉES uniquement (pgloader), depuis une machine ayant accès aux deux bases :
pgloader --with "data only" --with "truncate" --with "disable triggers" \
  mysql://USER:PASS@HOTE_HOSTINGER/dons_grand_tambour \
  postgresql://ccapac_api:PASS@127.0.0.1:5432/ccapac_api
# 3. Recaler les séquences d'identité, puis redémarrer.
```

Les fichiers uploadés (`public/uploads/media` sur Hostinger) sont à copier dans le
volume `ccapac-<env>_backend_uploads`.

### Frontend (Prisma)

Déjà PostgreSQL : `pg_dump` de la base actuelle → `pg_restore` dans `ccapac_members`.

### node-api

Base MySQL conservée telle quelle (service `node-db`) : `mysqldump` de la base actuelle
→ import dans `node-db`. Portage PostgreSQL : voir `docs/ARCHITECTURE.md`.

## 7. Sauvegardes

- Quotidiennes (`BACKUP_CRON`, 02:30 Kinshasa par défaut) : `ccapac_api`, `ccapac_members`,
  base node-api, uploads. Chiffrées avec **age** (clé publique sur le serveur, clé privée **hors serveur**).
- Copiées vers `BACKUP_RCLONE_DEST` (B2, S3, Drive…) ; rétention locale `BACKUP_RETENTION_DAYS`.
- Sauvegarde manuelle : `docker compose … exec backup backup.sh`.
- **Test de restauration (mensuel)** sans toucher la production :
  ```bash
  docker compose … cp ./age-key.txt backup:/tmp/key.txt
  docker compose … exec -e AGE_IDENTITY=/tmp/key.txt backup \
    restore.sh /backups/<horodatage> ccapac_api --into restore_test
  docker compose … exec backup rm /tmp/key.txt
  ```

## 8. Exploitation courante

```bash
C="docker compose"   # COMPOSE_FILE est lu depuis le .env de l'environnement
$C ps                                   # état + santé
$C logs -f --tail=100 nginx backend     # logs
$C exec backend php bin/console messenger:failed:show   # e-mails en échec
$C exec backend php bin/console messenger:failed:retry
$C exec backend php bin/console debug:scheduler
```

Rollback manuel : `cp .env.previous .env && $C up -d --wait`.
(Les migrations de base de données ne sont pas annulées : elles doivent rester rétrocompatibles.)

## 9. Développement local

```bash
cp .env.example .env
touch infra/secrets/makuta_private.pem infra/secrets/rclone.conf
docker compose up -d --build
docker compose exec backend php bin/console doctrine:migrations:migrate -n
docker compose --profile tools run --rm frontend-migrate
```

- Site : https://localhost, API : https://api.localhost, Node : https://app-api.localhost (certificat auto-signé)
- E-mails : http://localhost:8025 (Mailpit)
