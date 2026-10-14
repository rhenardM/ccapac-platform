# CCAPAC Platform

Monorepo de la plateforme web du **Centre Culturel et Artistique pour les Pays d'Afrique Centrale**.

| Dossier | Application | Origine (historique conservé là-bas) |
|---|---|---|
| `frontend/` | Site public + espace membre (Next.js) | `Teflon0193/caapac` @ `4afff41` |
| `backend/` | API contenu, dons, cinémathèque, back-office (Symfony) | `Centre-culturel-Grand-Tamboour/website_backend-api` @ `fa2b480` |
| `node-api/` | Auth membres/équipe + workflow des demandes (Express) | `Teflon0193/New-site-backend` @ `92b590d` |

Ce dépôt repart d'un historique neuf. Les dépôts d'origine restent intacts et font foi pour l'historique antérieur.

## Architecture

Conteneurisée (Docker Compose), Nginx unique point d'entrée, PostgreSQL + Redis
sur un réseau interne, Symfony Messenger/Scheduler, CI/CD GitHub Actions → GHCR →
staging → production. Détails : [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Démarrage rapide (local)

```bash
cp .env.example .env
touch infra/secrets/makuta_private.pem infra/secrets/rclone.conf
docker compose up -d --build
docker compose exec backend php bin/console doctrine:migrations:migrate -n
docker compose --profile tools run --rm frontend-migrate
```

Site https://localhost · API https://api.localhost · Node https://app-api.localhost · Mailpit http://localhost:8025

Déploiement VPS, secrets, sauvegardes, migration des données : [docs/DEPLOIEMENT.md](docs/DEPLOIEMENT.md).
