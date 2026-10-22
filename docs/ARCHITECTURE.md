# Architecture CCAPAC Platform

Adaptée de l'architecture de référence (`docs/architecture-reference.pdf`) : mêmes
principes, appliqués à trois applications (Next.js, Symfony, Node) au lieu d'un
monolithe Laravel.

## Principes

- **Nginx est l'unique point d'entrée public** (80 → 301 HTTPS, 443).
- **Aucun port applicatif, PostgreSQL, MySQL ou Redis publié** sur l'hôte en staging/production.
- **Défense en profondeur** : pare-feu Hostinger + UFW sur l'hôte, puis réseaux Docker isolés.
- **Staging et production strictement séparés** : serveur, `.env`, secrets, volumes, certificats.
- **Images construites et scannées par la CI** (GHCR), jamais sur le serveur.
- **Secrets hors du dépôt et hors des images** : `.env` + clé Makuta écrits au déploiement.

## Vue d'ensemble

```
Internet ──► Pare-feu (Hostinger + UFW : 22, 80, 443)
                │
                ▼
        ┌──────────────┐  TLS (Let's Encrypt), HTTP→HTTPS, en-têtes de sécurité,
        │    nginx     │  limites de débit, taille max des requêtes, logs JSON
        └──────┬───────┘
   réseau      │ frontend
   ┌───────────┼──────────────────────┐
   ▼           ▼                      ▼
frontend    backend (+worker,       node-api
Next.js     +scheduler) Symfony     Express
   │           │                      │
   └───────────┴──── réseau backend (internal: aucune route Internet) ────┐
               ▼                      ▼                                   ▼
          PostgreSQL 16             Redis 7                       MySQL 8 (transitoire)
     ccapac_api / ccapac_members   cache, sessions,               base du node-api
                                   rate-limit, Messenger
               │
               ▼
        backup (quotidien, chiffré age) ──► stockage externe (rclone)
```

| Domaine | Service | Rôle |
|---|---|---|
| `SITE_DOMAIN` (+ `www.` → 301) | `frontend` | Site public, espace membre, routes API Next |
| `API_DOMAIN` | `backend` | API contenu / dons Makuta / cinémathèque / espaces, back-office EasyAdmin, médias |
| `NODE_API_DOMAIN` | `node-api` | Auth membres et équipe (JWT), workflow des demandes, propositions |

## Services

| Service | Image | Réseaux | Notes |
|---|---|---|---|
| `nginx` | `infra/nginx` | frontend | Seul service avec des ports publiés |
| `certbot` | certbot/certbot | frontend | Renouvellement toutes les 12 h, Nginx recharge toutes les 6 h |
| `frontend` | `frontend` (standalone) | frontend, backend | Non-root, FS en lecture seule |
| `backend` | `backend` (FrankenPHP) | frontend, backend | Non-root, FS en lecture seule, `var/` en tmpfs |
| `worker` | `backend` | frontend, backend | `messenger:consume async` : e-mails rejoués en cas d'échec SMTP |
| `scheduler` | `backend` | frontend, backend | `messenger:consume scheduler_default` : remplace les cron hPanel |
| `node-api` | `node-api` | frontend, backend | Non-root, FS en lecture seule |
| `postgres` | postgres:16 | backend | 1 base + 1 rôle par application |
| `redis` | redis:7.4 | backend | Mot de passe, AOF, `noeviction` (protège la file Messenger) |
| `node-db` | mysql:8.4 | backend | **Transitoire**, voir plus bas |
| `backup` | `infra/backup` | frontend, backend | pg_dump + mysqldump + uploads, chiffrés, copiés hors serveur |

Le réseau `frontend` sert aussi de sortie Internet aux services qui en ont besoin
(Makuta, SMTP, Cloudinary, stockage des sauvegardes). Le réseau `backend` est
`internal` : les bases n'ont ni entrée ni sortie Internet.

## Tâches planifiées (Symfony Scheduler)

Définies dans `backend/src/Schedule.php` (mêmes fréquences que les cron hPanel) :

| Tâche | Fréquence |
|---|---|
| `app:donations:reconcile` | toutes les 2 min |
| `app:donations:expire` | toutes les 10 min |

L'état du scheduler est stocké dans Redis (pas de rafale après un redémarrage).

## Sécurité applicative ajoutée

- Symfony : `trusted_proxies` (vraie IP client derrière Nginx → rate-limiters corrects),
  sessions dans Redis, CORS `^/api/` restreint aux domaines du site (était `*`).
- Node : `trust proxy`, origines `*.vercel.app` uniquement si `CORS_ALLOW_VERCEL_PREVIEWS=true`.
- Mots de passe en clair retirés des scripts de seed (`node-api/createUser.js`,
  `createProgrammeTeamUsers.js`).
- Dépendances corrigées : EasyAdmin 4.29.16 (CVE-2026-81892), phpseclib 3.0.57.

## Dette connue / prochaines étapes

1. **node-api → PostgreSQL.** ~225 requêtes SQL MySQL brutes (`NOW()`, `DATE_FORMAT`,
   `insertId`, `GROUP_CONCAT`, `ON DUPLICATE KEY`…). Le schéma est désormais versionné
   (`node-api/database/schema.sql`, 18 tables, 25 clés étrangères) : reste le portage
   des requêtes vers `pg`, puis la suppression de `node-db`.
2. **CSP** (Content-Security-Policy) à définir avec les domaines tiers réels
   (Stripe, Google, Cloudinary, tuiles Leaflet, gtag).
3. **Centralisation des logs** (Loki/Grafana ou équivalent) : les logs sont déjà en
   JSON et tournés par Docker (10 Mo × 5 par conteneur).
4. **Images du site (≈470 Mo dans `frontend/public/images`)** : à compresser ou
   déplacer vers Cloudinary/CDN, ce qui allégera l'image Docker et le dépôt.
5. Réunifier à terme l'authentification (JWT node-api) et les deux circuits de dons
   (Makuta via Symfony, Aksessify via Next).
