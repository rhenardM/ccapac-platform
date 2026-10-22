# Déploiement — VPS Hostinger

## 1. Environnements

VPS cible : **srv1976360 — 76.13.2.39 / 2a02:4780:41:762b::1** (Ubuntu 26.04, 2 vCPU, 8 Go),
partagé avec **MOSELINE Pay** servi par **Caddy** (service hôte, ports 80/443).

Un seul environnement : **production** (pas de staging), dans `/opt/ccapac/production`,
projet compose `ccapac-production`, Nginx sur `127.0.0.1:8080`.

| Phase | Domaines |
|---|---|
| 1. Validation sur IP | `76-13-2-39.sslip.io`, `api.76-13-2-39.sslip.io`, `app-api.76-13-2-39.sslip.io` (résolution automatique vers l'IP, HTTPS réel via Caddy, aucun DNS à configurer) |
| 2. Mise en service | domaines définitifs (`centreculturel.cd`, …) : changer le `.env`, redéployer, relancer `caddy-site.sh` |

### Mode « derrière Caddy » (ce VPS)

```
Internet ─443─► Caddy (hôte, TLS auto) ─┬─► 127.0.0.1:5085  MOSELINE Pay (inchangé)
                                        └─► 127.0.0.1:8080  nginx ccapac-production
```

- Caddy garde 80/443 et les certificats ; on **ajoute** un fichier par environnement
  dans `/etc/caddy/conf.d/` (script `infra/scripts/caddy-site.sh`, validation avant rechargement,
  restauration automatique en cas d'erreur). Le bloc MOSELINE n'est pas modifié.
- Nginx (`docker-compose.caddy.yml`) n'est publié que sur `127.0.0.1` : filtrage, limites
  de débit, en-têtes et logs restent appliqués ; certbot est désactivé.
- Dans le `.env` (écrit par `infra/scripts/init-env.sh`) :
  ```
  COMPOSE_FILE='docker-compose.yml:docker-compose.prod.yml:docker-compose.caddy.yml'
  EDGE_PORT=8080
  ```

Sur un VPS dédié, laisser `COMPOSE_FILE` / `EDGE_PORT` vides : Nginx publie 80/443 et
`infra/scripts/init-letsencrypt.sh` obtient les certificats.

## Déploiement manuel (phase actuelle)

Rien ne part sur le serveur lors d'un `git push` : le workflow *Deploy* ne se lance
que manuellement. Pour l'instant, le déploiement se fait sur le VPS :

```bash
# Première fois (utilisateur deploy, après server-setup.sh)
git clone -b architecture/docker https://github.com/rhenardM/ccapac-platform.git /opt/ccapac/production
cd /opt/ccapac/production
bash infra/scripts/init-env.sh            # .env + secrets aléatoires, domaines sslip.io
bash infra/scripts/deploy.sh --build      # build sur le serveur, migrations, health checks
# puis EN ROOT, une seule fois : brancher Caddy
bash /opt/ccapac/production/infra/scripts/caddy-site.sh /opt/ccapac/production

# Mises à jour suivantes (sans CI/CD)
cd /opt/ccapac/production && git checkout main && git pull && bash infra/scripts/deploy.sh --build
```

`deploy.sh --build` étiquette les images avec le commit : en cas d'échec des health
checks, il revient automatiquement à la version précédente.

## 2. Préparation du serveur (une fois)

1. Créer une paire de clés pour la CI : `ssh-keygen -t ed25519 -f ccapac-ci -C ci@ccapac`.
2. **Avant tout**, vérifier qu'une clé SSH root fonctionne (`/root/.ssh/authorized_keys` non vide
   et connexion testée) : le script désactive l'authentification par mot de passe
   (aujourd'hui active à cause de `50-cloud-init.conf`).
3. Sur le VPS (root) : `DEPLOY_PUBKEY="$(cat ccapac-ci.pub)" bash infra/scripts/server-setup.sh`.
   Idempotent et adapté au serveur partagé : swap 4 Go, fusion de `daemon.json` (pools d'adresses
   conservés), utilisateur `deploy`, `/opt/ccapac/production`, UFW vérifié (aucune règle
   retirée), SSH par clé uniquement, fail2ban. **Tester `ssh deploy@76.13.2.39` avant de fermer la session root.**
4. hPanel → VPS → Pare-feu : n'autoriser que 22, 80 et 443.
5. DNS : faire pointer les domaines de l'environnement vers 76.13.2.39 (A) et
   2a02:4780:41:762b::1 (AAAA).
6. Après le premier déploiement d'un environnement (root) :
   `bash /opt/ccapac/production/infra/scripts/caddy-site.sh /opt/ccapac/production`.
7. Planifier le redémarrage en attente (`*** System restart required ***`) à une heure creuse :
   il coupe aussi MOSELINE Pay quelques instants.

## 3. Configuration GitHub (CI/CD)

Le serveur est un **clone git** du dépôt et son `.env` (généré par `init-env.sh`)
reste la **seule source des secrets** : GitHub n'a besoin que d'un accès SSH.

**Clé SSH dédiée à la CI** (sur ton poste) :
```bash
ssh-keygen -t ed25519 -f ccapac-ci -C ci@ccapac -N ""
ssh-copy-id -i ccapac-ci.pub deploy@76.13.2.39     # ou ajout dans ~deploy/.ssh/authorized_keys
ssh-keyscan -H 76.13.2.39 > known_hosts.txt
```

**Settings → Environments → New environment `production`** (*Required reviewers*
optionnel, pour valider chaque mise en production à la main) :

| Type | Nom | Valeur |
|---|---|---|
| Secret | `SSH_HOST` | `76.13.2.39` |
| Secret | `SSH_USER` | `deploy` |
| Secret | `SSH_PRIVATE_KEY` | contenu de `ccapac-ci` (clé privée) |
| Secret | `SSH_KNOWN_HOSTS` | contenu de `known_hosts.txt` |
| Variable | `DEPLOY_PATH` | `/opt/ccapac/production` |
| Variable | `SITE_DOMAIN` | `76-13-2-39.sslip.io` (puis le domaine définitif) |

**Settings → Secrets and variables → Actions → Variables** (dépôt, figées dans le
build du frontend) :

| Variable | Valeur (phase IP) |
|---|---|
| `PRODUCTION_SITE_DOMAIN` | `76-13-2-39.sslip.io` |
| `PRODUCTION_API_DOMAIN` | `api.76-13-2-39.sslip.io` |
| `PRODUCTION_NODE_API_DOMAIN` | `app-api.76-13-2-39.sslip.io` |
| `GOOGLE_CLIENT_ID` | identifiant OAuth Google (optionnel) |
| `PAYMENT_ENABLED` | `false` / `true` (optionnel) |

**Settings → Branches** : protéger `main` (PR obligatoire + CI verte) recommandé.

## 4. Chaîne CI/CD

```
PR / push ──► CI : backend (lint, container, migrations PG, schéma, PHPUnit, composer audit)
                   frontend (prisma, lint, tsc, build, npm audit)
                   node-api (syntaxe, npm audit)
                   infra (compose, build images, nginx -t, caddy validate)
                   sécurité (gitleaks, Trivy)
push main ──► CI ──► images → GHCR (scan Trivy CRITICAL bloquant)
                          ──► SSH : git checkout du commit exact
                          ──► deploy.sh --images : pull → migrations → up --wait
                              → health checks → rollback automatique si échec
                          ──► health check public
```

Le déploiement manuel (`git pull && deploy.sh --build`) reste possible à tout moment.

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

Le schéma PostgreSQL est créé par la migration de base (`backend/migrations/`) ; les
anciennes migrations MySQL sont archivées dans `docs/legacy/backend-migrations-mysql/`.
Un export phpMyAdmin de la base Hostinger s'importe avec un seul script :

```bash
# sur le VPS, en deploy, après avoir copié le dump (et les médias) dans ~
cd /opt/ccapac/production
bash infra/scripts/import-mysql-dump.sh ~/u852632793_site_db.sql ~/uploads-media
```

Le script sauvegarde d'abord `ccapac_api` (`backups-import/`), arrête backend/worker/
scheduler, charge le dump dans un MariaDB jetable, copie les **données** avec pgloader,
recale les séquences d'identité, compare le nombre de lignes de chaque table, copie les
médias dans le volume `backend_uploads`, puis redémarre. Ré-exécutable (les tables sont
vidées avant import). Les tables `actualite`, `event`, `media` (node-api) sont ignorées.

Les médias sont référencés par nom de fichier : copier le dossier
`public/uploads/media` de l'ancien backend Hostinger (2e argument du script).

### Frontend (Prisma)

Déjà PostgreSQL : `pg_dump` de la base actuelle → `pg_restore` dans `ccapac_members`.

### node-api (MySQL transitoire)

Le schéma est versionné dans `node-api/database/schema.sql` (18 tables, structure
seule) et appliqué automatiquement à la création du volume `node_db_data`.
Les données s'importent depuis l'export table par table (`site_<table>.sql`) :

```bash
# sur le VPS, en deploy, après avoir copié l'export dans ~
cd /opt/ccapac/production
bash infra/scripts/import-node-db.sh ~/architecture_base_de_donnees.zip
```

Le script sauvegarde d'abord `ccapac_node` (`backups-import/`), arrête le node-api,
importe uniquement les tables du schéma (ignore `manifest`, `sessions`,
`*_backup_*`), recrée les tables manquantes, affiche le nombre de lignes par table,
rétablit les droits de l'utilisateur applicatif puis redémarre le node-api.
Ré-exécutable. Les mots de passe (hachés bcrypt) sont conservés tels quels.

Portage PostgreSQL : voir `docs/ARCHITECTURE.md`.

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
