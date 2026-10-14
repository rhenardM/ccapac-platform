# Onboarding technique CCAPAC

Ce document donne une vue d'ensemble technique du projet CCAPAC pour aider un nouveau developpeur a comprendre rapidement comment le systeme est organise, comment les donnees circulent, ou se trouvent les responsabilites principales, et quelles precautions prendre avant de modifier le code.

## 0. Contexte non technique

CCAPAC signifie **Centre Culturel et Artistique pour les Pays d'Afrique Centrale**. Le projet est le site web officiel du centre. Il sert a presenter l'institution, ses programmes culturels, ses evenements, ses espaces, ses medias, ses newsletters et son espace membre.

L'objectif du site est double:

1. **Informer le public**
   - presenter le centre et sa mission;
   - publier les programmes, evenements et actualites;
   - mettre en avant les activites culturelles, artistiques et educatives;
   - donner les informations pratiques: adresse, horaires, contact, acces.

2. **Gerer une communaute de membres**
   - permettre aux utilisateurs de creer un compte;
   - donner acces a un espace membre;
   - permettre l'inscription a certains evenements;
   - suivre les activites des membres;
   - fournir un espace admin pour consulter les membres, les evenements et les statistiques.

Le projet combine donc un **site vitrine culturel**, un **agenda d'evenements**, une **galerie media**, une **newsletter**, et une **plateforme membre**. Le contenu editorial est gere dans Strapi pour que l'equipe puisse le mettre a jour sans passer par un developpeur, tandis que les fonctionnalites membres sont gerees dans l'application Next.js.

## 1. Vue d'ensemble

Le produit est compose de deux applications distinctes:

```text
D:\ccapac-website
├── backend   # CMS Strapi: contenus editoriaux, medias, evenements, newsletters
└── frontend  # Site public + espace membre/admin Next.js
```

En local, les deux applications sont placees dans le meme dossier parent pour faciliter le developpement. Cote GitHub, elles sont gerees comme des projets separes: ce document est destine au projet frontend, tout en donnant assez de contexte sur le backend pour comprendre l'ensemble.

## 2. Architecture globale

Le projet repose sur trois blocs fonctionnels:

1. **Strapi CMS**
   - Gere les contenus administrables: evenements, slides hero, medias, programmes, newsletters, pages globales.
   - Expose une API REST consommee par le frontend.
   - Stocke ses propres donnees CMS dans une base Strapi, SQLite en local par defaut.

2. **Next.js frontend**
   - Affiche le site public CCAPAC.
   - Gere l'espace membre, l'espace admin, les inscriptions aux evenements, les newsletters et les formulaires.
   - Consomme Strapi pour les contenus editoriaux.
   - Utilise Prisma + PostgreSQL pour les donnees applicatives liees aux utilisateurs.

3. **Base applicative Prisma**
   - Gere les utilisateurs, sessions, comptes OAuth, inscriptions aux evenements, activites membres.
   - Sert de base a Better Auth.
   - N'est pas la meme base que celle de Strapi.

Schema simplifie:

```text
Utilisateur
   |
   v
Next.js frontend
   |              \
   |               \__ Prisma/PostgreSQL: users, sessions, registrations
   |
   \__ Strapi REST API: events, programmes, media, newsletters, hero slides
```

## 3. Backend Strapi

### Stack

Le backend est une application Strapi 5:

- `@strapi/strapi`: `5.23.4`
- TypeScript
- `better-sqlite3` pour la base locale par defaut
- `@strapi/plugin-users-permissions`
- `@strapi/plugin-cloud`

Fichier principal:

```text
backend/package.json
```

Commandes utiles:

```powershell
cd D:\ccapac-website\backend
npm run develop
npm run build
npm run start
```

### Structure importante

```text
backend
├── config
│   ├── admin.ts
│   ├── api.ts
│   ├── database.ts
│   ├── middlewares.ts
│   ├── plugins.ts
│   └── server.ts
├── src
│   ├── api
│   │   ├── about
│   │   ├── article
│   │   ├── author
│   │   ├── category
│   │   ├── event
│   │   ├── global
│   │   ├── hero-slide
│   │   ├── media-gallery
│   │   ├── newsletter
│   │   └── programme
│   └── components
│       └── shared
├── public
├── data
├── scripts
└── types
```

Chaque dossier dans `src/api/*` suit le pattern Strapi:

```text
content-types/<type>/schema.json
controllers/<type>.ts
routes/<type>.ts
services/<type>.ts
```

La plupart des controllers/routes/services sont generes par Strapi. Les schemas JSON sont les fichiers les plus importants pour comprendre le modele de contenu.

### Base de donnees Strapi

La configuration est dans:

```text
backend/config/database.ts
```

Par defaut, Strapi utilise SQLite:

```text
DATABASE_CLIENT=sqlite
DATABASE_FILENAME=.tmp/data.db
```

La configuration supporte aussi MySQL et PostgreSQL via variables d'environnement.

Point important: cette base sert au CMS. Elle ne remplace pas la base Prisma du frontend.

### Contenus Strapi principaux

Les collections les plus importantes pour le frontend sont:

- `event`: evenements affiches dans l'agenda et les pages detail.
- `hero-slide`: slides dynamiques de la page d'accueil.
- `media-gallery`: galerie media.
- `newsletter`: newsletters avec PDF et image de couverture.
- `programme`: contenus lies aux programmes.
- `global`, `about`, `article`, `author`, `category`: contenus plus generiques ou editoriaux.

### Points d'attention backend

- Le dossier `dist/` est un build genere.
- Le dossier `node_modules/` ne doit pas etre modifie manuellement.
- Le dossier `.tmp/` contient la base SQLite locale.
- Le backend est un projet separe du frontend. Ne pas melanger les changements backend et frontend dans une meme livraison sans objectif clair.

## 4. Frontend Next.js

### Stack

Le frontend est l'application principale exposee aux utilisateurs:

- Next.js `15.5.x`
- React `19.1`
- App Router
- TypeScript
- Tailwind CSS 4
- Radix UI pour certains composants d'interface
- Lucide React et React Icons pour les icones
- TanStack Query pour certaines donnees cote client
- Prisma `6.18`
- Better Auth
- Nodemailer
- PWA via `@ducanh2912/next-pwa`

Fichier principal:

```text
frontend/package.json
```

Commandes utiles:

```powershell
cd D:\ccapac-website\frontend
npm run dev
npm run lint
npm run build
npm run start
```

Le build execute d'abord:

```powershell
prisma generate
```

puis:

```powershell
next build --turbopack
```

### Structure importante

```text
frontend
├── prisma
│   ├── schema.prisma
│   └── migrations
├── public
│   ├── images
│   ├── icons
│   └── manifest.json
└── src
    ├── actions
    ├── app
    │   ├── api
    │   ├── agenda
    │   ├── auth
    │   ├── components
    │   ├── espace-membre
    │   ├── evenement
    │   ├── grand-tambour
    │   ├── infos
    │   ├── media
    │   ├── newsletter
    │   └── programmes
    ├── components
    ├── data
    ├── hooks
    ├── lib
    ├── services
    └── types
```

### App Router

Les pages sont dans:

```text
frontend/src/app
```

Les routes principales:

- `/`: page d'accueil.
- `/agenda`: calendrier et liste d'evenements.
- `/evenement/[slug]`: detail d'un evenement.
- `/programmes`: listing des programmes.
- `/programmes/[category]`: programmes par categorie.
- `/programmes/[category]/[slug]`: detail programme.
- `/media`: galerie media.
- `/newsletter`: newsletters.
- `/infos`: informations pratiques et contact.
- `/grand-tambour/*`: pages de presentation, espaces, equipe/gouvernance.
- `/auth/*`: login, inscription, mot de passe oublie, verification email.
- `/espace-membre`: dashboard membre.
- `/espace-membre/admin`: espace admin.

Le layout global est:

```text
frontend/src/app/layout.tsx
```

Il configure:

- la police Poppins;
- les metadata;
- les parametres viewport/PWA;
- le provider React Query;
- le top loader;
- le toaster;
- Google Tag Manager.

Google Tag Manager est charge globalement dans ce layout avec l'ID:

```text
GTM-TM76Z944
```

Cela garantit un chargement unique pour toute l'application.

## 5. Flux de donnees Strapi vers frontend

Le client Strapi central est:

```text
frontend/src/lib/strapi.ts
```

Les constantes de connexion sont dans:

```text
frontend/src/lib/constant.ts
```

Elles utilisent:

```text
NEXT_PUBLIC_STRAPI_URL
NEXT_PUBLIC_STRAPI_TOKEN
```

Valeur par defaut:

```text
http://localhost:1337
```

Le pattern courant est:

1. un service construit une query Strapi;
2. `fetchFromStrapi()` appelle l'API REST;
3. une fonction `transformStrapi*()` adapte la reponse Strapi vers un type frontend;
4. les pages ou hooks consomment ce type frontend.

Exemple pour les evenements:

```text
services/eventService.ts
  -> lib/strapi.ts
    -> /api/events Strapi
      -> types/events.ts
```

Services Strapi principaux:

```text
frontend/src/services/eventService.ts
frontend/src/services/heroSlideService.ts
frontend/src/services/mediaService.ts
frontend/src/services/newsletterService.ts
```

Types associes:

```text
frontend/src/types/events.ts
frontend/src/types/hero-slide.ts
frontend/src/types/media.ts
frontend/src/types/newsletter.ts
```

### Images distantes

Next autorise explicitement certains hosts d'images dans:

```text
frontend/next.config.ts
```

Il faut ajouter un host ici si Strapi ou un CDN media change.

## 6. Donnees applicatives Prisma

Le schema Prisma est:

```text
frontend/prisma/schema.prisma
```

Provider:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

Modeles principaux:

- `User`: utilisateur applicatif.
- `Session`: session Better Auth.
- `Account`: compte OAuth ou credentials.
- `Verification`: tokens de verification.
- `ApprovalToken`: ancien/possible mecanisme d'approbation.
- `EventRegistration`: inscription d'un utilisateur a un evenement Strapi.
- `MemberActivity`: journal d'activite membre.

Enums:

- `Role`: `MEMBER` ou `ADMIN`.
- `RegistrationStatus`: `PENDING`, `CONFIRMED`, `CANCELLED`.
- `ActivityType`: inscription, login, update profil, inscription evenement, annulation, action admin, telechargement newsletter.

Point cle: `EventRegistration.eventId` reference l'ID de l'evenement cote Strapi. Il n'y a pas de relation SQL directe entre Prisma et Strapi.

## 7. Authentification et espace membre

L'auth est geree par Better Auth:

```text
frontend/src/lib/auth.ts
```

La route API Better Auth est:

```text
frontend/src/app/api/auth/[...all]/route.ts
```

Elle expose:

```ts
export const { POST, GET } = toNextJsHandler(auth);
```

Better Auth utilise Prisma via:

```text
better-auth/adapters/prisma
```

Fonctionnalites actives:

- email/password;
- verification email obligatoire;
- reset password;
- Google OAuth;
- cookies Next.js via `nextCookies()`;
- champs utilisateurs supplementaires: `isApproved`, `phone`.

Les helpers serveur sont dans:

```text
frontend/src/lib/auth-server.ts
```

Ils fournissent:

- `getSession()`
- `getUser()`
- `isAdmin()`

L'espace membre utilise ces helpers pour proteger les pages et rediriger:

- non connecte -> `/auth/login`
- admin -> `/espace-membre/admin`

## 8. Routes API Next.js

Les routes API du frontend vivent dans:

```text
frontend/src/app/api
```

Routes importantes:

```text
api/auth/[...all]/route.ts
api/admin/events/route.ts
api/admin/members/route.ts
api/admin/stats/route.ts
api/members/initialize/route.ts
api/newsletter/[id]/download/route.ts
```

Responsabilites probables:

- `auth`: endpoints Better Auth.
- `admin/events`: recuperation/aggregation d'evenements avec inscriptions.
- `admin/members`: gestion/lecture des membres.
- `admin/stats`: statistiques dashboard admin.
- `members/initialize`: initialisation ou synchronisation des donnees membre.
- `newsletter/[id]/download`: telechargement newsletter + activite membre.

Avant de modifier ces routes, verifier systematiquement:

- l'authentification;
- le role admin si necessaire;
- les acces Prisma;
- le format de retour attendu par les hooks/services.

## 9. UI, composants et conventions frontend

Il existe deux zones de composants UI:

```text
frontend/src/app/components
frontend/src/components
```

Le projet contient notamment:

- composants de home dans `src/app/components/home`;
- composants agenda dans `src/app/components/agenda`;
- composants auth dans `src/app/components/auth`;
- composants event dans `src/app/components/events`;
- composants media dans `src/app/components/media`;
- composants newsletter dans `src/app/components/newsletter`;
- composants UI generiques dans `src/components/ui` et `src/app/components/ui`.

La presence de deux dossiers UI implique une vigilance:

- verifier l'import existant avant d'ajouter un nouveau composant;
- eviter de dupliquer un composant deja disponible;
- respecter le style local du dossier touche.

La page d'accueil assemble:

```text
frontend/src/app/page.tsx
```

Avec:

- `MainLayout`
- `HeroSlider`
- `Programmes`
- `DirectorMessage`
- `QuickAgenda`
- `VideoFocus`
- `Partners`

## 10. Donnees statiques et assets

Les assets publics sont dans:

```text
frontend/public
```

Sous-dossiers importants:

- `images/events`
- `images/media`
- `images/members`
- `images/partners`
- `icons`

Des donnees statiques complementaires existent dans:

```text
frontend/src/data
```

Exemples:

- `departments.ts`
- `espaces.ts`
- `events.ts`
- `member.ts`
- `missions.ts`

Ces donnees peuvent coexister avec Strapi. Avant de migrer ou modifier une source de donnees, verifier quelle page consomme quoi.

## 11. Emails

Les emails applicatifs passent par:

```text
frontend/src/services/mailServices.ts
```

Ils sont utilises par Better Auth pour:

- verification email;
- reset password.

Les variables SMTP sont dans l'environnement du frontend. Ne jamais hardcoder de secrets dans le code.

## 12. PWA et tracking

La PWA est configuree dans:

```text
frontend/next.config.ts
frontend/public/manifest.json
```

Le plugin utilise:

```text
@ducanh2912/next-pwa
```

Google Tag Manager est configure dans:

```text
frontend/src/app/layout.tsx
```

ID:

```text
GTM-TM76Z944
```


## 13. Variables d'environnement

### Backend

Fichiers:

```text
backend/.env
backend/.env.example
```

Variables typiques Strapi:

- `HOST`
- `PORT`
- `APP_KEYS`
- `API_TOKEN_SALT`
- `ADMIN_JWT_SECRET`
- `TRANSFER_TOKEN_SALT`
- `JWT_SECRET`
- `DATABASE_CLIENT`
- `DATABASE_FILENAME`
- `DATABASE_URL` si PostgreSQL

### Frontend

Fichier:

```text
frontend/.env
```

Variables importantes:

- `DATABASE_URL`: base PostgreSQL Prisma.
- `NEXT_PUBLIC_STRAPI_URL`: URL Strapi.
- `NEXT_PUBLIC_STRAPI_TOKEN`: token lecture Strapi si necessaire.
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- variables Better Auth.
- variables SMTP/Nodemailer.

Ne jamais commiter de secrets reels.

## 14. Workflow local recommande

### Demarrer le backend

```powershell
cd D:\ccapac-website\backend
npm run develop
```

Strapi demarre generalement sur:

```text
http://localhost:1337
```

### Demarrer le frontend

```powershell
cd D:\ccapac-website\frontend
npm run dev
```

Next demarre generalement sur:

```text
http://localhost:3000
```

### Verifier le frontend

```powershell
cd D:\ccapac-website\frontend
npm run lint
npm run build
```

### Prisma

Apres modification de `prisma/schema.prisma`:

```powershell
cd D:\ccapac-website\frontend
npx prisma generate
```

Pour une migration:

```powershell
npx prisma migrate dev
```

Verifier la strategie de migration avant toute intervention sur une base partagee.

## 15. Git et remotes frontend

Le projet frontend a plusieurs remotes:

```text
origin   -> https://github.com/Teflon0193/caapac.git
origin2  -> https://github.com/Go-freelance/ccapac.git
origin3  -> https://github.com/DanielMwamba/ccapac.git
```

Au moment de cette documentation, la branche active de travail est:

```text
feat/clean-modif
```

La branche `main` de reference recente est sur:

```text
origin/main
```

La branche `feat/clean-modif` a ete alignee avec `origin/main` via un merge, puis poussee vers:

```text
origin2/feat/clean-modif
origin3/feat/clean-modif
```

Recommandations:

- Toujours faire `git status --short --branch` avant de modifier.
- Toujours verifier la remote cible avant de pousser.
- Eviter les `push --force` sauf decision explicite.
- Pour integrer `origin/main` dans `feat/clean-modif`, preferer un merge si la branche conserve l'historique de `feat/auth-member-space`.

Le backend est gere dans un projet GitHub separe. Pour toute modification backend, travailler dans son projet dedie et verifier la strategie de branchement de ce projet.

## 16. Regles de modification importantes

### Quand modifier Strapi

Modifier le backend Strapi si:

- un nouveau type de contenu doit etre editable dans le CMS;
- un champ Strapi manque;
- une relation CMS doit etre exposee;
- une permission Strapi ou un endpoint CMS pose probleme.

Apres modification d'un schema Strapi, verifier:

- l'admin Strapi;
- les permissions publiques/API token;
- les transforms frontend;
- les types TypeScript frontend si necessaire.

### Quand modifier Prisma

Modifier Prisma si:

- la donnee concerne les utilisateurs;
- la donnee concerne les sessions/auth;
- la donnee concerne les inscriptions aux evenements;
- la donnee est applicative et non editoriale.

Apres modification:

- creer une migration;
- regenerer le client;
- verifier les routes API et dashboards.

### Quand modifier le frontend seulement

Modifier uniquement Next.js si:

- le changement est purement UI;
- le mapping des donnees existantes change;
- une page consomme autrement une donnee deja exposee;
- une interaction client evolue sans changer le modele.

## 17. Points de vigilance connus

1. **Deux sources de donnees**
   - Strapi pour le contenu.
   - Prisma pour les utilisateurs et donnees applicatives.
   - Ne pas melanger les responsabilites.

2. **IDs evenements**
   - Les inscriptions Prisma referencent les evenements Strapi par `eventId`.
   - Si un evenement Strapi est supprime ou recrée, verifier l'impact sur les inscriptions.

3. **Images Strapi**
   - Les hosts distants doivent etre declares dans `next.config.ts`.
   - Sinon `next/image` peut bloquer l'affichage.

4. **Auth**
   - Les pages serveur doivent utiliser `getUser()` ou `isAdmin()` plutot que lire directement les cookies.
   - Les routes admin doivent verifier le role.


## 18. Parcours d'un exemple: affichage d'un evenement

1. Un redacteur cree un evenement dans Strapi (`event`).
2. Strapi expose cet evenement via `/api/events`.
3. Le frontend appelle `getEvents()`, `getUpcomingEvents()` ou `getEventBySlug()` dans `eventService.ts`.
4. `buildStrapiQuery()` construit les filtres.
5. `fetchFromStrapi()` appelle l'API.
6. `transformStrapiEvent()` convertit le format Strapi vers le type `Event`.
7. Une page ou un composant affiche l'evenement.
8. Si l'utilisateur s'inscrit, l'inscription est stockee dans Prisma via `EventRegistration`.

## 19. Parcours d'un exemple: connexion membre

1. L'utilisateur passe par une page `/auth/*`.
2. Les formulaires appellent Better Auth.
3. Better Auth lit/ecrit dans PostgreSQL via Prisma.
4. Les sessions sont stockees dans les tables Prisma.
5. Les pages protegees utilisent `getUser()`.
6. Si l'utilisateur est admin, il est redirige vers `/espace-membre/admin`.
7. Les actions importantes peuvent etre journalisees dans `MemberActivity`.

## 20. Checklist pour un nouveau dev

Avant de coder:

```powershell
cd D:\ccapac-website\frontend
git status --short --branch
git remote -v
```

Puis:

```powershell
cd D:\ccapac-website\backend
git status --short --branch
```

Cette verification backend sert uniquement si la tache touche aussi Strapi. Pour une tache frontend pure, rester dans le projet frontend.

Comprendre la demande:

- Est-ce du contenu CMS? Regarder Strapi.
- Est-ce une donnee utilisateur ou inscription? Regarder Prisma.
- Est-ce de l'affichage? Regarder Next.js.
- Est-ce une route serveur? Regarder `src/app/api`.

Avant de livrer:

```powershell
cd D:\ccapac-website\frontend
npm run lint
npm run build
```

Si le backend a ete modifie:

```powershell
cd D:\ccapac-website\backend
npm run build
```

## 21. Fichiers a lire en priorite

Pour comprendre le frontend:

```text
frontend/src/app/layout.tsx
frontend/src/app/page.tsx
frontend/src/lib/strapi.ts
frontend/src/lib/auth.ts
frontend/src/lib/auth-server.ts
frontend/src/lib/prisma.ts
frontend/prisma/schema.prisma
frontend/src/services/eventService.ts
frontend/src/services/newsletterService.ts
frontend/src/app/espace-membre/layout.tsx
frontend/src/app/espace-membre/page.tsx
frontend/src/app/espace-membre/admin/page.tsx
```

Pour comprendre le backend:

```text
backend/config/database.ts
backend/config/server.ts
backend/src/api/event/content-types/event/schema.json
backend/src/api/hero-slide/content-types/hero-slide/schema.json
backend/src/api/media-gallery/content-types/media-gallery/schema.json
backend/src/api/newsletter/content-types/newsletter/schema.json
backend/src/api/programme/content-types/programme/schema.json
```

## 22. Resume mental

Si tu dois retenir une seule chose:

```text
Strapi = contenu administrable
Next.js = experience utilisateur et routes applicatives
Prisma/PostgreSQL = utilisateurs, auth, inscriptions, activites
```
