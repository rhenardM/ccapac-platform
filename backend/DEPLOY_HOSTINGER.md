# Déploiement Hostinger mutualisé — `api-fundraising.centreculturel.cd`

Même principe que la Fan Zone : **le code du projet vit hors de `public_html`**, et seul un
petit `index.php` + `.htaccess` est exposé dans le document root du sous-domaine.

## 1. Arborescence cible sur le serveur

```
~/domains/centreculturel.cd/            (ou ~/centreculturel.cd selon ton compte)
├── Event-fally_symfony/                (existant)
├── fundraising-api/            ← UPLOADER tout le projet ICI (hors public_html)
│   ├── bin/  config/  migrations/  public/  src/  var/  vendor/
│   ├── .env
│   └── .env.local                      ← secrets de prod (voir §4)
└── public_html/
    ├── backedfanzone/                  (existant — docroot Fan Zone)
    └── fundraising/                    ← CRÉER — docroot du sous-domaine
        ├── index.php                   (depuis deploy/fundraising-docroot/index.php)
        └── .htaccess                   (depuis deploy/fundraising-docroot/.htaccess)
```

> Le `index.php` de `public_html/fundraising/` pointe vers
> `../../fundraising-api/vendor/autoload_runtime.php`. Si tu nommes le dossier projet
> autrement que `fundraising-api`, adapte cette ligne dans `index.php`.

## 2. Mapping du sous-domaine

Dans hPanel → **Sous-domaines** : crée `api-fundraising`, puis fixe son **Document Root** sur
`public_html/fundraising`. Active le **SSL** (Let's Encrypt) pour ce sous-domaine — Makuta exige HTTPS.

## 3. Upload du code

Deux options :

- **A (recommandée)** : uploader le projet SANS `vendor/`, puis sur le serveur (SSH) :
  ```bash
  cd ~/domains/centreculturel.cd/fundraising-api
  composer install --no-dev --optimize-autoloader
  ```
- **B (si pas de Composer en SSH)** : faire `composer install --no-dev --optimize-autoloader`
  en local, puis uploader le projet **avec** `vendor/`.

Copie ensuite le contenu de `deploy/fundraising-docroot/` dans `public_html/fundraising/`.

## 4. `.env.local` de prod (dans `fundraising-api/`)

```dotenv
APP_ENV=prod
APP_DEBUG=0
APP_SECRET=<générer: php -r "echo bin2hex(random_bytes(16));">

DATABASE_URL="mysql://UTILISATEUR:MOTDEPASSE@127.0.0.1:3306/NOM_BASE?serverVersion=8.0&charset=utf8mb4"

# Frontend Next.js (liens e-mail, retour de paiement)
APP_PUBLIC_URL=https://centreculturel.cd
# Origines autorisées (CORS) — le(s) domaine(s) du site qui appelle l'API
CORS_ALLOW_ORIGIN='^https://(www\.)?centreculturel\.cd$'

# E-mail des recus — Hostinger SMTP (SSL implicite port 465)
# Encoder le @ de l'adresse en %40 dans le DSN !
MAILER_DSN=smtps://munongo.bonkey%40centreculturel.cd:MOT_DE_PASSE@smtp.hostinger.com:465
MAILER_FROM_ADDRESS=munongo.bonkey@centreculturel.cd
MAILER_FROM_NAME="Biblio-Librairie du Grand Tambour"

# Makuta — passer en prod
MAKUTA_ENV=prod
MAKUTA_CLIENT_ID=<fourni par Makuta>
MAKUTA_CLIENT_SECRET=<fourni par Makuta>
MAKUTA_X_EXTENSION=<= "Extension (Internal)" déclaré au formulaire>
MAKUTA_PRIVATE_KEY_PATH=%kernel.project_dir%/config/makuta_private.pem

CAMPAIGN_GOAL_USD=517251
```

> ⚠️ La clé privée `config/makuta_private.pem` doit être en permissions **600**.
> Le callback n'a pas de token dans l'URL (demande Makuta) : la sécurité vient de la
> re-vérification signée côté serveur.

## 5. Base de données

Crée la base + l'utilisateur MySQL dans hPanel, renseigne `DATABASE_URL`, puis :
```bash
php bin/console doctrine:migrations:migrate --no-interaction
```
(ou exécute le SQL de `migrations/Version20260619000001.php` dans phpMyAdmin).

## 6. Permissions & cache de prod

```bash
cd ~/domains/centreculturel.cd/fundraising-api
chmod 600 config/makuta_private.pem
APP_ENV=prod php bin/console cache:clear
APP_ENV=prod php bin/console cache:warmup
chmod -R 775 var          # var/ doit être inscriptible (cache + logs)
```

## 7. Vérifications

```bash
# Connexion Makuta (auth OAuth2) :
php bin/console app:makuta:test
# Doit répondre depuis le navigateur :
#   https://api-fundraising.centreculturel.cd/api/fundraising/campaign/stats
# Doc interactive Swagger (test + partage équipes) :
#   https://api-fundraising.centreculturel.cd/api/doc
```

> Les assets de Swagger UI sont installés automatiquement par `composer install`
> (script `assets:install public`). Sinon : `php bin/console assets:install public`.

## 8. Tâches planifiées (hPanel → Cron Jobs)

```
*/2 * * * *  php ~/domains/centreculturel.cd/fundraising-api/bin/console app:donations:reconcile
*/10 * * * * php ~/domains/centreculturel.cd/fundraising-api/bin/console app:donations:expire
```

## 8bis. Back-office d'administration (EasyAdmin)

Après un déploiement contenant l'admin :
```bash
cd ~/domains/centreculturel.cd/fundraising-api
composer install --no-dev --optimize-autoloader          # installe security-bundle + easyadmin
php bin/console doctrine:migrations:migrate --no-interaction   # crée users + audit_logs + api_tokens
php bin/console cache:clear
# Assets EasyAdmin dans le docroot du sous-domaine (comme Swagger) :
php bin/console assets:install ~/domains/centreculturel.cd/public_html/api-fundraising
# Créer le premier super-administrateur :
php bin/console app:admin:create
```
**UI back-office** : `https://api-fundraising.centreculturel.cd/login` → tableau de bord `/admin`.

Rôles : `ROLE_ADMIN` (dashboard + dons/donateurs) · `ROLE_SUPER_ADMIN` (+ gestion utilisateurs & journal d'audit).

### API admin (JSON, pour un futur dashboard React/Next.js)
Endpoints sous `/api/admin`, authentifiés par **jeton Bearer**. Deux façons d'obtenir un jeton :

1. **Connexion (pour le dashboard)** — endpoint public :
   ```
   POST /api/admin/login   { "email": "...", "password": "..." }
   → { "data": { "token": "...", "expiresAt": "...", "user": {...} } }
   ```
   Le dashboard React/Next.js appelle ça, stocke le `token`, puis l'envoie en `Authorization: Bearer <token>`.
2. **CLI (jeton de service, longue durée)** :
   ```bash
   php bin/console app:admin:token --email=admin@centreculturel.cd --label="Dashboard" --ttl=90
   ```
- `GET /api/admin/stats` — KPIs de la collecte
- `GET /api/admin/donations?status=&operator=&page=&perPage=` — liste paginée/filtrée
- `GET /api/admin/donations/{reference}` — détail (donateur + payload)
- `GET /api/admin/users` · `POST /api/admin/users` · `PATCH /api/admin/users/{id}` — gestion des administrateurs (**super-admin** requis)

Appel : `Authorization: Bearer <token>`. Documentés dans **Swagger** (`/api/doc`, tag « Admin », bouton « Authorize »).

## 8ter. Module contenu (actualités, événements, média, newsletter)

Après un déploiement contenant le module contenu :
```bash
cd ~/domains/centreculturel.cd/fundraising-api
php bin/console doctrine:migrations:migrate --no-interaction   # actualites, events, media_assets, newsletter_subscribers
php bin/console cache:clear
# Le dossier d'upload doit être inscriptible par le process web :
mkdir -p public/uploads/media && chmod -R 775 public/uploads
```
- **Gestion** : dans l'admin `/admin` → section « Contenu » (CRUD actualités/événements/média/abonnés, éditeur WYSIWYG, upload d'images et PDF).
- **Fichiers uploadés** : stockés dans `public/uploads/media/`, servis via `GET /uploads/media/{filename}` (route Symfony, cache 1 an) — aucun réglage de document root nécessaire.
- **API publique (site Next.js)** :
  - `GET /api/content/actualites?type=&page=` · `GET /api/content/actualites/{slug}`
  - `GET /api/content/events?page=` · `GET /api/content/events/{slug}`
  - `GET /api/content/media?page=`
  - `POST /api/content/newsletter/subscribe` `{ email, name? }`
  (Ne renvoie que les contenus **publiés**.)

## 8quater. Import des anciennes données (Strapi → nouvelles tables)

1. Importe ton dump Strapi dans la **base en ligne** (phpMyAdmin ou CLI). Il crée les
   tables brutes `actualite` et `media` (sans conflit avec `actualites`/`media_assets`).
2. Lance l'import (lit ces tables, télécharge les fichiers Strapi Cloud vers `public/uploads/media/`,
   remplit `actualites` + `media_assets`) :
   ```bash
   php bin/console app:content:import --dry-run   # simulation d'abord (rien écrit)
   php bin/console app:content:import             # import réel
   ```
   Options : `--skip-download` (métadonnées seulement, sans récupérer les fichiers).
   La commande est **idempotente** (ignore ce qui existe déjà, par slug/filename).
3. Une fois vérifié, supprime les tables brutes : `DROP TABLE actualite, media;`

## 9. Rappels onboarding Makuta

- Callback URL : `https://api-fundraising.centreculturel.cd/api/fundraising/webhooks/makuta`
- Redirect URL : `https://api-fundraising.centreculturel.cd/api/fundraising/paiement/retour`
- Public IP : celle du serveur Hostinger (la même que la Fan Zone)
- Envoyer `config/makuta_public.pem` à `support@makuta.cash`
