# Spécifications du Dashboard Administrateur — Grand Tambour

> **Document de référence produit** destiné aux équipes UX/UI et Frontend.
> Il décrit l'intégralité du périmètre administrable du backend Symfony
> `Fundraising-integration` (Centre Culturel du Grand Tambour) et spécifie le
> Dashboard Admin à concevoir, en complément de l'interface EasyAdmin existante.
>
> | | |
> |---|---|
> | **Version** | 1.0 |
> | **Date** | 8 août 2026 |
> | **Backend audité** | Symfony 7.4 · PHP 8.2 · Doctrine ORM 3.6 · EasyAdmin 4.24 |
> | **Branche** | `develop` |
> | **Portée** | 32 entités Doctrine · 28 contrôleurs CRUD · 14 contrôleurs API · 7 rôles |
> | **Statut** | Spécification initiale — à valider par le Product Owner |

---

## Table des matières

1. [Présentation générale](#1-présentation-générale)
2. [Architecture du Dashboard](#2-architecture-du-dashboard)
3. [Gestion des rôles et permissions](#3-gestion-des-rôles-et-permissions)
4. [Dashboard principal](#4-dashboard-principal)
5. [Module Articles (Presse)](#5-module-articles-presse)
6. [Module Médias](#6-module-médias)
7. [Module Audio](#7-module-audio)
8. [Module Cinémathèque](#8-module-cinémathèque)
9. [Module Événements](#9-module-événements)
10. [Module Réservations & Inscriptions](#10-module-réservations--inscriptions)
11. [Module Newsletter & Communication](#11-module-newsletter--communication)
12. [Module Utilisateurs](#12-module-utilisateurs)
13. [Module SEO](#13-module-seo)
14. [Module Paramètres](#14-module-paramètres)
15. [Module Statistiques Globales](#15-module-statistiques-globales)
16. [Design System du Dashboard](#16-design-system-du-dashboard)
17. [Pages Frontend à développer](#17-pages-frontend-à-développer)
18. [Modules complémentaires existants](#18-modules-complémentaires-existants)
19. [Annexes techniques](#19-annexes-techniques)

---

# 1. Présentation générale

## 1.1 Objectif du Dashboard

Le backend actuel est administré via **EasyAdmin 4** (`/admin`), une interface
générée automatiquement à partir des entités Doctrine. Elle est fonctionnelle,
sécurisée et complète sur le plan CRUD, mais elle atteint ses limites dès qu'il
s'agit de :

- **piloter** (KPI transverses, tendances, comparaisons période à période) ;
- **produire du contenu confortablement** (éditeur riche, prévisualisation,
  gestion visuelle des médias, drag & drop d'ordre d'affichage) ;
- **exploiter la donnée** (statistiques croisées, exports, rapports) ;
- **offrir une expérience moderne** (recherche globale, notifications,
  responsive mobile/tablette, mode sombre, raccourcis clavier).

Le **Dashboard Admin** est une application front autonome (Next.js / React
recommandé, cohérent avec le site public) qui consomme une **API JSON
d'administration** et couvre ces besoins, sans supprimer EasyAdmin.

### Objectifs mesurables

| Objectif | Indicateur cible |
|---|---|
| Réduire le temps de publication d'un article | −50 % vs EasyAdmin |
| Donner une vision consolidée en < 5 s | 1 écran d'accueil, 0 clic |
| Permettre l'administration mobile | 100 % des pages responsive ≥ 375 px |
| Autonomiser les responsables de section | 0 recours au super-admin pour les tâches courantes |
| Traçabilité | 100 % des actions sensibles journalisées (audit) |

## 1.2 EasyAdmin vs Dashboard : répartition des responsabilités

| Critère | EasyAdmin (`/admin`) | Dashboard Admin (à construire) |
|---|---|---|
| **Nature** | Interface Symfony/Twig générée | SPA React/Next.js |
| **Authentification** | Session + formulaire de login (CSRF) | Jeton **Bearer** opaque (`POST /api/admin/login`) |
| **Public visé** | Super-admin, opérations techniques, correctifs | Équipes éditoriales, communication, direction |
| **Points forts** | CRUD exhaustif, filtres, sécurité par rôle, zéro maintenance front | Ergonomie, dataviz, workflows métier, mobile |
| **Rôle cible** | **Back-office de secours et d'administration technique** | **Outil de travail quotidien** |
| **Reste maître de** | Journal d'audit, jetons API, entités rares (catégories, galeries) | Contenus, planning, statistiques, réservations |
| **Statut** | ✅ En production | 🔨 À développer |

> **Règle d'or :** aucune donnée ne doit exister uniquement dans le Dashboard.
> Toute écriture passe par l'API et reste visible/corrigeable dans EasyAdmin.

## 1.3 Vision globale du système

```
┌──────────────────────────┐        ┌───────────────────────────┐
│  Site public Next.js     │        │  Dashboard Admin (à faire)│
│  centreculturel.cd       │        │  admin.centreculturel.cd  │
└───────────┬──────────────┘        └─────────────┬─────────────┘
            │ GET/POST publics                     │ Bearer token
            │ /api/content · /api/cinematheque     │ /api/admin/**
            │ /api/espaces · /api/fundraising      │
            ▼                                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND SYMFONY 7.4                          │
│                                                                 │
│  Firewalls : main (session, /admin) · admin_api (Bearer)        │
│  ──────────────────────────────────────────────────────────     │
│  Contrôleurs API (14)   │  EasyAdmin (/admin, 28 CRUD)          │
│  Services : Makuta · Newsletter · Audit · Receipt                │
│  Doctrine ORM — 32 entités — MySQL                              │
│  Uploads : public/uploads/media (20 Mo max, image + PDF)        │
└───────────────────────┬─────────────────────────────────────────┘
                        │ HTTPS signé (RSA)
                        ▼
              ┌────────────────────┐
              │  Makuta Cash       │  Passerelle de paiement
              │  (Mobile Money,    │  Mobile Money / Carte
              │   Visa CNP…)       │
              └────────────────────┘
```

## 1.4 Principaux modules du projet

| # | Module | Entités principales | Rôle requis | Maturité backend |
|---|---|---|---|---|
| 1 | **Collecte / Dons** | `Donation`, `Donor` | `ROLE_ADMIN` | ✅ Complet (+ API admin) |
| 2 | **Contenu général** | `HomeHeroSlide`, `Actualite`, `Event`, `MediaAsset`, `Partner`, `ContactMessage`, `NewsletterSubscriber` | `ROLE_CONTENT` | ✅ CRUD · ❌ API admin |
| 3 | **Action culturelle** | `Program`, `ProgramCategory`, `ProgramGalleryImage`, `ProgramRegistration` | `ROLE_ACTION_CULTURELLE` | ✅ CRUD · ❌ API admin |
| 4 | **Actualités / Presse** | `Article`, `ArticleCategory`, `Comment`, `ArticleView` | `ROLE_ACTUALITES` | ✅ CRUD + stats · ❌ API admin |
| 5 | **Cinémathèque** | `Film`, `FilmCategory`, `FilmGalleryImage`, `Screening`, `ScreeningRegistration`, `FilmView`, `ScreeningView`, `CinemathequeSettings` | `ROLE_CINEMATHEQUE` | ✅ CRUD + stats · ❌ API admin |
| 6 | **Espaces** | `Space`, `SpaceCategory`, `SpaceGalleryImage`, `SpacesPageSettings` | `ROLE_ESPACES` | ✅ CRUD · ❌ API admin |
| 7 | **Administration** | `User`, `AuditLog`, `ApiToken` | `ROLE_SUPER_ADMIN` | ✅ CRUD + API partielle |
| 8 | **Audio** | — | — | ❌ **Inexistant** (à créer) |
| 9 | **SEO** | — | — | ❌ **Inexistant** (à créer) |
| 10 | **Paramètres globaux** | `CinemathequeSettings`, `SpacesPageSettings` uniquement | par section | ⚠️ Très partiel |

### Constat d'audit majeur

> L'API d'administration (`/api/admin`) ne couvre aujourd'hui que **4 endpoints** :
> `stats`, `donations`, `donations/{reference}`, `users` (list/create/update).
> **Aucun module éditorial n'est exposé en écriture via API.**
> Le développement du Dashboard implique donc un **chantier backend
> significatif** : ~60 endpoints REST à créer. Voir [§19.3](#193-endpoints-api-à-créer).

---

# 2. Architecture du Dashboard

## 2.1 Layout général

```
┌────────────────────────────────────────────────────────────────────────┐
│  TOPBAR  (h 64px, sticky)                                              │
│  ☰  Grand Tambour   [🔍 Recherche globale…]   🌐 🔔³  ❓  👤 Rhenard ▾ │
├──────────────┬─────────────────────────────────────────────────────────┤
│              │  BREADCRUMB : Accueil › Cinémathèque › Films › Éditer   │
│   SIDEBAR    ├─────────────────────────────────────────────────────────┤
│   (w 260px)  │                                                         │
│   collapse   │                  ZONE DE CONTENU                        │
│   → 72px     │      (max-width 1440px, padding 24px, scroll propre)    │
│              │                                                         │
│  ▸ Pilotage  │   ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐      │
│  ▸ Contenu   │   │  KPI 1  │ │  KPI 2  │ │  KPI 3  │ │  KPI 4  │      │
│  ▸ Action c. │   └─────────┘ └─────────┘ └─────────┘ └─────────┘      │
│  ▸ Presse    │                                                         │
│  ▸ Cinéma    │   ┌───────────────────────────┐ ┌───────────────────┐  │
│  ▸ Espaces   │   │      Graphique            │ │  Activité récente │  │
│  ▸ Collecte  │   └───────────────────────────┘ └───────────────────┘  │
│  ▸ Système   │                                                         │
│              │                                                         │
│  ─────────   ├─────────────────────────────────────────────────────────┤
│  ⚙ Réglages  │  FOOTER : v1.0 · API ✅ · Dernière synchro 12:04        │
└──────────────┴─────────────────────────────────────────────────────────┘
```

**Comportements responsive**

| Breakpoint | Sidebar | Topbar | Grille KPI |
|---|---|---|---|
| ≥ 1280 px (desktop) | Fixe, 260 px, dépliée | Complète | 4 colonnes |
| 1024–1279 px | Fixe, 72 px (icônes + tooltip) | Complète | 3 colonnes |
| 768–1023 px (tablette) | Drawer sur ☰ | Recherche en icône | 2 colonnes |
| < 768 px (mobile) | Drawer plein écran | Logo + ☰ + 👤 | 1 colonne |

## 2.2 Sidebar

### Structure

- **En-tête** : logo Grand Tambour + nom du back-office, cliquable → `/`
- **Groupes de navigation** : accordéons, un seul ouvert par défaut (celui de la
  page courante), état mémorisé en `localStorage`
- **Filtrage par rôle** : un groupe entier est masqué si l'utilisateur n'a pas le
  rôle correspondant (miroir de `configureMenuItems()` de `DashboardController`)
- **Badges de comptage** en temps réel sur les entrées à traiter :
  messages non lus, inscriptions non lues, commentaires masqués, dons `pending`
- **Pied de sidebar** : bouton « Réduire », lien « Voir le site », lien
  « EasyAdmin » (ouverture nouvel onglet), lien « Documentation API »

### Spécification des groupes

| Groupe | Icône | Rôle requis | Entrées |
|---|---|---|---|
| **Pilotage** | `chart-line` | `ROLE_STAFF` | Vue d'ensemble · Statistiques globales · Activité |
| **Collecte** | `hand-holding-heart` | `ROLE_ADMIN` | Tableau de bord dons · Dons · Donateurs · Rapports |
| **Contenu** | `layer-group` | `ROLE_CONTENT` | Hero d'accueil · Newsletters/Actualités · Événements · Bibliothèque média · Partenaires · Messages de contact · Abonnés newsletter |
| **Action culturelle** | `masks-theater` | `ROLE_ACTION_CULTURELLE` | Programmes internes · Programmes externes · Rubriques · Galeries · Inscriptions |
| **Presse** | `newspaper` | `ROLE_ACTUALITES` | Articles · Catégories · Commentaires · Audios · Statistiques de lecture |
| **Cinémathèque** | `film` | `ROLE_CINEMATHEQUE` | Films · Genres · Projections · Calendrier · Inscriptions · Galeries · Statistiques · Réglages billetterie |
| **Espaces** | `door-open` | `ROLE_ESPACES` | Espaces · Types d'espaces · Galeries · Réglages page |
| **Système** | `shield-halved` | `ROLE_SUPER_ADMIN` | Utilisateurs · Rôles & permissions · Jetons API · Journal d'audit · Paramètres · SEO |

## 2.3 Topbar

| Zone | Composant | Comportement |
|---|---|---|
| Gauche | Bouton ☰ | Réduit/déplie la sidebar (drawer en mobile) |
| Gauche | Fil d'Ariane compact (mobile uniquement) | Page courante seule |
| Centre | **Recherche globale** | Champ large, placeholder « Rechercher un contenu, un film, un don… », raccourci `⌘K` / `Ctrl+K` |
| Droite | Sélecteur de période | `Aujourd'hui · 7 j · 30 j · 12 mois · Personnalisé` — global, propagé aux widgets stats |
| Droite | 🔔 **Notifications** | Badge du nombre non lu, popover liste + « Tout marquer comme lu » |
| Droite | ❓ **Centre d'aide** | Popover : guides, raccourcis, changelog, contact support |
| Droite | 🌓 Thème | Clair / Sombre / Système |
| Droite | 👤 **Profil** | Avatar + nom, menu déroulant |

## 2.4 Navigation & Breadcrumbs

**Règles de fil d'Ariane**

- Toujours présent sauf sur la page d'accueil du dashboard.
- Format : `Accueil › {Module} › {Sous-module} › {Action|Entité}`
- Le dernier segment n'est pas cliquable et affiche le titre de l'entité
  (ex. `Accueil › Cinémathèque › Films › Le Damier`).
- En mode création : dernier segment = « Nouveau ».
- Sur mobile : seuls les 2 derniers segments, précédés de « … ».

**Navigation contextuelle**

- Onglets internes sur les pages riches (ex. fiche Film : *Informations ·
  Médias · Casting · Projections · Statistiques*).
- Boutons « ← Précédent / Suivant → » sur les pages de détail pour parcourir
  la liste sans y revenir.
- Conservation de l'état de liste (filtres, tri, page) dans l'URL en
  query-string, pour retour arrière fidèle et partage de lien.

## 2.5 Recherche globale

**Déclenchement :** `⌘K` / `Ctrl+K`, ou clic sur le champ.

**Comportement :** palette de commandes modale, recherche débouncée à 250 ms,
minimum 2 caractères, résultats groupés par type, navigation clavier
(`↑ ↓ Entrée Échap`).

**Périmètre indexé** (filtré par les rôles de l'utilisateur)

| Type | Champs recherchés |
|---|---|
| Article | `title`, `slug`, `excerpt`, `author` |
| Actualité / Newsletter | `title`, `slug`, `summary` |
| Événement | `title`, `slug`, `location`, `organizer` |
| Programme | `title`, `slug`, `slogan`, `organizer` |
| Film | `title`, `slug`, `director`, `synopsis` |
| Projection | `venue`, `description`, titre du film |
| Espace | `name`, `slug`, `shortDescription` |
| Média | `name`, `alt`, `caption`, `filename` |
| Don | `reference`, `makutaTransactionId` |
| Donateur | `name`, `email`, `phone` |
| Utilisateur | `name`, `email` |
| Inscription / Message | `firstName`, `lastName`, `email` |

**Actions rapides** (préfixe `>` dans la palette) : « Nouvel article »,
« Nouveau film », « Programmer une projection », « Envoyer une campagne »,
« Exporter les abonnés », « Voir le journal d'audit ».

**Endpoint requis :** `GET /api/admin/search?q={terme}&types[]=article&limit=20`

## 2.6 Notifications

**Types de notifications**

| Type | Déclencheur | Destinataires | Sévérité |
|---|---|---|---|
| `contact.received` | Nouveau `ContactMessage` | `ROLE_CONTENT` | info |
| `registration.program` | Nouvelle `ProgramRegistration` | `ROLE_ACTION_CULTURELLE` | info |
| `registration.screening` | Nouvelle `ScreeningRegistration` | `ROLE_CINEMATHEQUE` | info |
| `comment.posted` | Nouveau `Comment` | `ROLE_ACTUALITES` | info |
| `newsletter.subscribed` | Nouvel abonné | `ROLE_CONTENT` | info (agrégé/jour) |
| `donation.paid` | Don passé à `paid` | `ROLE_ADMIN` | succès |
| `donation.failed` | Don `failed`/`expired` | `ROLE_ADMIN` | avertissement |
| `screening.capacity` | `capacityTaken` ≥ 90 % de `capacityTotal` | `ROLE_CINEMATHEQUE` | avertissement |
| `screening.tomorrow` | Projection J-1 | `ROLE_CINEMATHEQUE` | info |
| `content.scheduled` | Publication planifiée effectuée | Auteur + section | info |
| `campaign.sent` | Campagne newsletter terminée | `ROLE_CONTENT` | succès |
| `system.error` | Échec webhook Makuta, échec mailer | `ROLE_SUPER_ADMIN` | erreur |

**UI :** popover 400 px, onglets *Toutes / Non lues*, groupement par jour,
lien profond vers l'objet concerné, action « Marquer comme lu », lien
« Voir toutes les notifications » vers `/notifications`.

**Backend à créer :** entité `Notification` (type, titre, message, lien,
`targetRole`, `readAt`, `createdAt`, `entityType`, `entityId`) + endpoints
`GET /api/admin/notifications`, `PATCH /api/admin/notifications/{id}/read`,
`POST /api/admin/notifications/read-all`. Transport temps réel optionnel
(Mercure ou polling 60 s en v1).

## 2.7 Profil utilisateur

Menu déroulant : nom, e-mail, badges de rôles, puis :

| Entrée | Destination |
|---|---|
| Mon profil | `/profil` — nom, e-mail (lecture seule), rôles, date de création, dernière connexion |
| Changer mon mot de passe | `/profil/securite` — min. 8 caractères (règle backend actuelle) |
| Mes sessions & jetons | `/profil/securite` — liste des `ApiToken` (label, créé le, dernière utilisation, expiration) + révocation |
| Mon activité | `/profil/activite` — extrait du journal d'audit filtré sur `performedBy` |
| Préférences | `/profil/preferences` — thème, langue, densité, page d'accueil par défaut |
| Déconnexion | Révoque le jeton courant et redirige vers `/login` |

> ⚠️ **Contraintes backend actuelles** : un utilisateur ne peut pas modifier ses
> propres rôles ni se désactiver (`UserApiController::update`). L'auto-édition du
> nom et du mot de passe n'est pas encore exposée pour un non-super-admin :
> endpoint `PATCH /api/admin/me` à créer.

## 2.8 Centre d'aide

- **Guides contextuels** : panneau latéral avec le mode d'emploi de la page
  courante (rédigé en Markdown, versionné dans le repo).
- **Raccourcis clavier** : modale listant `⌘K`, `G puis A` (aller aux articles),
  `N` (nouveau), `S` (enregistrer), `Échap` (fermer), `?` (aide).
- **Changelog produit** : liste des évolutions du dashboard.
- **Glossaire métier** : palier de don, opérateur, scope de programme
  (interne/externe), statut de contenu, séance en vedette…
- **Support** : bouton « Signaler un problème » (pré-remplit type de page, URL,
  navigateur, ID utilisateur).

## 2.9 Sitemap complet du Dashboard

```
/                                        Vue d'ensemble (accueil)
├── /login                               Connexion (jeton Bearer)
├── /mot-de-passe-oublie                 Réinitialisation (à créer côté backend)
│
├── /pilotage
│   ├── /pilotage/statistiques           Statistiques globales
│   ├── /pilotage/activite               Flux d'activité (audit + contenus)
│   └── /pilotage/rapports               Générateur de rapports / exports
│
├── /collecte                            [ROLE_ADMIN]
│   ├── /collecte                        Tableau de bord de la collecte
│   ├── /collecte/dons                   Liste des dons
│   ├── /collecte/dons/:reference        Détail d'un don (+ payload callback)
│   ├── /collecte/donateurs              Liste des donateurs
│   ├── /collecte/donateurs/:id          Fiche donateur + historique
│   └── /collecte/rapports               Exports comptables
│
├── /contenu                             [ROLE_CONTENT]
│   ├── /contenu/hero                    Diapositives d'accueil (drag & drop)
│   ├── /contenu/hero/nouveau
│   ├── /contenu/hero/:id
│   ├── /contenu/actualites              Actualités & newsletters PDF
│   ├── /contenu/actualites/nouveau
│   ├── /contenu/actualites/:id
│   ├── /contenu/evenements              Événements
│   ├── /contenu/evenements/nouveau
│   ├── /contenu/evenements/:id
│   ├── /contenu/evenements/calendrier   Vue calendrier
│   ├── /contenu/medias                  Bibliothèque média
│   ├── /contenu/medias/:id              Détail / édition d'un média
│   ├── /contenu/partenaires             Partenaires
│   ├── /contenu/partenaires/:id
│   ├── /contenu/messages                Messages de contact
│   └── /contenu/messages/:id
│
├── /action-culturelle                   [ROLE_ACTION_CULTURELLE]
│   ├── /action-culturelle/programmes            Internes + externes (onglets)
│   ├── /action-culturelle/programmes/nouveau
│   ├── /action-culturelle/programmes/:id        (onglets : Infos·Galerie·Inscriptions)
│   ├── /action-culturelle/rubriques
│   ├── /action-culturelle/rubriques/:id
│   └── /action-culturelle/inscriptions
│
├── /presse                              [ROLE_ACTUALITES]
│   ├── /presse/articles
│   ├── /presse/articles/nouveau
│   ├── /presse/articles/:id             (onglets : Contenu·Média·Audio·SEO·Stats)
│   ├── /presse/articles/:id/apercu      Prévisualisation
│   ├── /presse/categories
│   ├── /presse/commentaires             Modération
│   ├── /presse/audios                   Bibliothèque audio (à créer)
│   ├── /presse/audios/nouveau
│   ├── /presse/audios/:id
│   └── /presse/statistiques             Statistiques de lecture
│
├── /cinematheque                        [ROLE_CINEMATHEQUE]
│   ├── /cinematheque/films
│   ├── /cinematheque/films/nouveau
│   ├── /cinematheque/films/:id          (onglets : Infos·Médias·Casting·Séances·Stats)
│   ├── /cinematheque/genres
│   ├── /cinematheque/projections        Liste
│   ├── /cinematheque/projections/calendrier   Vue mois/semaine
│   ├── /cinematheque/projections/nouveau
│   ├── /cinematheque/projections/:id
│   ├── /cinematheque/inscriptions
│   ├── /cinematheque/statistiques
│   └── /cinematheque/reglages           Billetterie
│
├── /espaces                             [ROLE_ESPACES]
│   ├── /espaces/liste
│   ├── /espaces/liste/nouveau
│   ├── /espaces/liste/:id               (onglets : Infos·Équipements·Galerie·Contact)
│   ├── /espaces/types
│   └── /espaces/reglages                Hero de la page Espaces
│
├── /newsletter                          [ROLE_CONTENT]
│   ├── /newsletter/abonnes
│   ├── /newsletter/import               Import CSV
│   ├── /newsletter/campagnes            Historique des campagnes
│   └── /newsletter/campagnes/nouvelle   Composition + envoi
│
├── /seo                                 [ROLE_SUPER_ADMIN]
│   ├── /seo/vue-ensemble
│   ├── /seo/metadonnees                 Par type de contenu
│   ├── /seo/redirections
│   └── /seo/sitemap
│
├── /parametres                          [ROLE_SUPER_ADMIN]
│   ├── /parametres/general              Identité du site, contacts, fuseau
│   ├── /parametres/reseaux-sociaux
│   ├── /parametres/menus                Menu principal & footer
│   ├── /parametres/pages-systeme        Mentions, CGU, confidentialité, 404
│   ├── /parametres/emails               Expéditeur, gabarits, notifications
│   └── /parametres/integrations         Makuta, analytics, Mercure
│
├── /systeme                             [ROLE_SUPER_ADMIN]
│   ├── /systeme/utilisateurs
│   ├── /systeme/utilisateurs/nouveau
│   ├── /systeme/utilisateurs/:id
│   ├── /systeme/roles                   Matrice des permissions (lecture)
│   ├── /systeme/jetons-api
│   ├── /systeme/audit                   Journal d'audit
│   └── /systeme/sante                   État API, mailer, Makuta, stockage
│
├── /notifications                       Toutes les notifications
├── /profil                              Mon profil
│   ├── /profil/securite
│   ├── /profil/activite
│   └── /profil/preferences
├── /aide                                Centre d'aide
├── /403                                 Accès refusé
├── /404                                 Introuvable
└── /500                                 Erreur serveur
```

**Total : 84 routes** dont 62 pages fonctionnelles distinctes.

---

# 3. Gestion des rôles et permissions

## 3.1 Hiérarchie des rôles (état réel du backend)

Source : `config/packages/security.yaml` et `src/Entity/User.php`.

```
ROLE_SUPER_ADMIN
   └── ROLE_ADMIN
          ├── ROLE_STAFF
          ├── ROLE_CONTENT ────────────┐
          ├── ROLE_ACTION_CULTURELLE ──┤
          ├── ROLE_ACTUALITES ─────────┼──► ROLE_STAFF
          ├── ROLE_CINEMATHEQUE ───────┤
          └── ROLE_ESPACES ────────────┘
```

**Règles d'accès (`access_control`, la première règle qui matche s'applique) :**

| Chemin | Accès |
|---|---|
| `^/login` | Public |
| `^/uploads` | Public |
| `^/api/admin/login` | Public |
| `^/api/admin` | `ROLE_ADMIN` + jeton Bearer |
| `^/api` | Public |
| `^/admin` | `ROLE_STAFF` (cloisonnement par rôle sur menu + CRUD) |

## 3.2 Fiches de rôles

### `ROLE_STAFF` — Membre du personnel

- **Description** : rôle socle, attribué implicitement à tout rôle de section.
  Ne donne à lui seul accès à aucun contenu.
- **Permissions** : accès au shell `/admin` et au shell du Dashboard.
- **Pages accessibles** : Connexion, Profil, Centre d'aide, page d'atterrissage.
- **Actions** : consulter son profil, changer son mot de passe, se déconnecter.
- **Comportement notable** : un utilisateur `ROLE_STAFF` seul, sans rôle de
  section, arrive sur `/admin` sans redirection utile — **cas à traiter dans le
  Dashboard par un écran « Aucune section ne vous est attribuée »**.

### `ROLE_CONTENT` — Gestionnaire de contenu

- **Description** : responsable du contenu éditorial général du site public.
- **Permissions** : CRUD complet sur `HomeHeroSlide`, `Actualite`, `Event`,
  `MediaAsset`, `NewsletterSubscriber`, `Partner` ; lecture + marquage lu sur
  `ContactMessage` (création désactivée) ; outils newsletter (import CSV, export
  CSV, envoi de campagne).
- **Pages accessibles** : groupe *Contenu* + groupe *Newsletter* + Pilotage
  (périmètre restreint).
- **Actions autorisées** : créer/modifier/supprimer/publier/dépublier, uploader
  des médias, réordonner le hero, importer et exporter des abonnés, envoyer une
  campagne.
- **Interdit** : dons, films, programmes, espaces, utilisateurs, audit.

### `ROLE_ACTION_CULTURELLE` — Action culturelle

- **Description** : programmation culturelle interne et partenariats externes.
- **Permissions** : CRUD sur `Program` (via deux vues filtrées :
  `InternalProgramCrudController` sur `scope = interne`,
  `ExternalProgramCrudController` sur `scope = externe`), `ProgramCategory`,
  `ProgramGalleryImage` ; lecture + marquage lu sur `ProgramRegistration`.
- **Pages accessibles** : groupe *Action culturelle*.
- **Actions autorisées** : programmer, publier, rattacher un espace, gérer les
  galeries, consulter et exporter les inscriptions.
- **Interdit** : création manuelle d'une inscription.

### `ROLE_ACTUALITES` — Presse / Actualités

- **Description** : rédaction et modération de la presse du Grand Tambour.
- **Permissions** : CRUD sur `Article`, `ArticleCategory`, `Comment` ; accès aux
  statistiques de lecture (`/admin/article-stats`).
- **Pages accessibles** : groupe *Presse*.
- **Actions autorisées** : rédiger, publier, mettre à la une, modérer
  (masquer/afficher un commentaire, répondre en tant que rédaction via le rôle
  `CommentAuthorRole`), consulter les vues.
- **À venir** : gestion des audios associés aux articles (module inexistant).

### `ROLE_CINEMATHEQUE` — Cinémathèque

- **Description** : catalogue de films et programmation des projections.
- **Permissions** : CRUD sur `Film`, `FilmCategory`, `FilmGalleryImage`,
  `Screening` ; lecture + marquage lu sur `ScreeningRegistration` ; accès aux
  statistiques (`/admin/cinematheque-stats`) et aux réglages billetterie
  (`/admin/cinematheque-settings`).
- **Pages accessibles** : groupe *Cinémathèque*.
- **Actions autorisées** : cataloguer, archiver, programmer, annuler une séance,
  masquer une séance, définir la vedette, fixer capacité et tarif, configurer
  l'URL de billetterie externe.

### `ROLE_ESPACES` — Espaces du Grand Tambour

- **Description** : présentation et mise à disposition des espaces.
- **Permissions** : CRUD sur `Space`, `SpaceCategory`, `SpaceGalleryImage` ;
  réglages de la page Espaces (`/admin/espaces-settings`, upload du visuel hero).
- **Pages accessibles** : groupe *Espaces*.
- **Actions autorisées** : décrire un espace, renseigner équipements et
  capacités, activer/désactiver, définir les URL de réservation et de devis,
  gérer la galerie et le hero de page.

### `ROLE_ADMIN` — Administrateur

- **Description** : vision transverse + pilotage de la collecte de dons.
- **Permissions** : hérite de toutes les sections + `Donation` et `Donor`
  (lecture seule : `NEW`, `EDIT`, `DELETE`, `BATCH_DELETE` sont désactivés sur
  `DonationCrudController` ; `NEW`, `DELETE`, `BATCH_DELETE` désactivés sur
  `DonorCrudController`) ; seul rôle autorisé sur `/api/admin`.
- **Pages accessibles** : toutes sauf le groupe *Système*.
- **Actions autorisées** : tout ce que font les rôles de section, plus consulter
  les dons, les donateurs, les statistiques de collecte et le payload de
  callback Makuta (audit paiement).
- **Interdit** : gérer les utilisateurs, consulter le journal d'audit.

### `ROLE_SUPER_ADMIN` — Super administrateur

- **Description** : administration technique et gouvernance.
- **Permissions** : tout `ROLE_ADMIN` + CRUD sur `User` + lecture du journal
  d'audit (`AuditLogCrudController` : `NEW`/`EDIT`/`DELETE` désactivés, détail
  seul) + API `/api/admin/users`.
- **Pages accessibles** : toutes, y compris *Système*, *Paramètres*, *SEO*.
- **Actions autorisées** : créer/modifier/désactiver un compte, attribuer les
  rôles, révoquer un jeton API, consulter l'audit, configurer le site.
- **Garde-fous existants** : ne peut ni modifier ses propres rôles ni désactiver
  son propre compte (`UserApiController::update`).

## 3.3 Matrice des permissions

Légende : **C** créer · **L** lire · **M** modifier · **S** supprimer · **—** aucun accès

| Ressource | STAFF | CONTENT | ACTION_C. | ACTUALITES | CINEMA. | ESPACES | ADMIN | SUPER_ADMIN |
|---|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| HomeHeroSlide | — | CLMS | — | — | — | — | CLMS | CLMS |
| Actualite | — | CLMS | — | — | — | — | CLMS | CLMS |
| Event | — | CLMS | — | — | — | — | CLMS | CLMS |
| MediaAsset | — | CLMS | — | — | — | — | CLMS | CLMS |
| Partner | — | CLMS | — | — | — | — | CLMS | CLMS |
| NewsletterSubscriber | — | CLMS | — | — | — | — | CLMS | CLMS |
| ContactMessage | — | LM S | — | — | — | — | LM S | LM S |
| Program (interne/externe) | — | — | CLMS | — | — | — | CLMS | CLMS |
| ProgramCategory | — | — | CLMS | — | — | — | CLMS | CLMS |
| ProgramGalleryImage | — | — | CLMS | — | — | — | CLMS | CLMS |
| ProgramRegistration | — | — | LM S | — | — | — | LM S | LM S |
| Article | — | — | — | CLMS | — | — | CLMS | CLMS |
| ArticleCategory | — | — | — | CLMS | — | — | CLMS | CLMS |
| Comment | — | — | — | CLMS | — | — | CLMS | CLMS |
| Statistiques de lecture | — | — | — | L | — | — | L | L |
| Film / FilmCategory / Galerie | — | — | — | — | CLMS | — | CLMS | CLMS |
| Screening | — | — | — | — | CLMS | — | CLMS | CLMS |
| ScreeningRegistration | — | — | — | — | LM S | — | LM S | LM S |
| CinemathequeSettings | — | — | — | — | LM | — | LM | LM |
| Space / SpaceCategory / Galerie | — | — | — | — | — | CLMS | CLMS | CLMS |
| SpacesPageSettings | — | — | — | — | — | LM | LM | LM |
| Donation | — | — | — | — | — | — | L | L |
| Donor | — | — | — | — | — | — | LM | LM |
| API `/api/admin/*` | — | — | — | — | — | — | L | CLM |
| User | — | — | — | — | — | — | — | CLMS |
| AuditLog | — | — | — | — | — | — | — | L |
| ApiToken | — | — | — | — | — | — | — | CLS |

## 3.4 Rôles futurs à prévoir

| Rôle proposé | Besoin métier | Permissions | Priorité |
|---|---|---|---|
| `ROLE_EDITOR` | Rédacteur sans droit de publication : rédige, soumet, ne publie pas | `Article`/`Actualite` : C, L, M sur ses propres contenus en `DRAFT` uniquement | 🔴 Haute |
| `ROLE_REVIEWER` | Valide et publie les contenus soumis | Passage `DRAFT → PUBLISHED`, rejet avec commentaire | 🔴 Haute |
| `ROLE_MODERATOR` | Modération des commentaires seule, sans droit sur les articles | `Comment` : L, M (masquer), S | 🟠 Moyenne |
| `ROLE_ANALYST` | Direction / bailleurs : consultation des statistiques uniquement | Lecture seule de tous les modules Statistiques + exports | 🟠 Moyenne |
| `ROLE_ACCOUNTANT` | Comptabilité de la collecte | `Donation`/`Donor` en lecture + exports comptables, sans accès éditorial | 🟠 Moyenne |
| `ROLE_BILLETTERIE` | Contrôle d'accès aux séances | `ScreeningRegistration` : L, M (pointage présence), scan QR | 🟡 Basse |
| `ROLE_TRANSLATOR` | Multilingue (FR / EN / LN) | Édition des seuls champs de traduction | 🟡 Basse |

### Évolutions du modèle de permission

1. **Rôles de section attribuables via API** — `UserApiController::ALLOWED_ROLES`
   ne contient aujourd'hui que `ROLE_ADMIN` et `ROLE_SUPER_ADMIN` : les rôles de
   section ne sont attribuables que via EasyAdmin ou la commande
   `app:admin:create`. **À corriger** avant la mise en service du Dashboard.
2. **Notion de propriété** — aucune entité de contenu ne porte d'auteur
   (`Article.author` est un champ texte libre, pas une relation `User`).
   Prérequis à `ROLE_EDITOR`. Ajouter `createdBy: ManyToOne(User)` et
   `updatedBy` sur les entités éditoriales.
3. **Permissions granulaires** — passer à un système de Voters Symfony
   (`ARTICLE_PUBLISH`, `SCREENING_CANCEL`, `DONATION_EXPORT`…) plutôt qu'à des
   rôles monolithiques.
4. **Workflow de publication** — `ContentStatus` ne contient aujourd'hui que
   `DRAFT`/`PUBLISHED` : ajouter `PENDING_REVIEW`, `SCHEDULED`, `ARCHIVED`.

---

# 4. Dashboard principal

## 4.1 Principes

La page d'accueil (`/`) est **adaptative selon le rôle** : chaque utilisateur
voit en priorité les indicateurs de ses sections. Le sélecteur de période de la
topbar (`Aujourd'hui · 7 j · 30 j · 12 mois · Personnalisé`) pilote tous les
widgets à l'exception des compteurs de volumétrie (« total »).

**Composition par rôle**

| Rôle | Contenu de l'accueil |
|---|---|
| `ROLE_SUPER_ADMIN` / `ROLE_ADMIN` | Vue complète : KPI transverses + collecte + graphiques + activité + alertes |
| `ROLE_CONTENT` | KPI contenu, publications récentes, messages non lus, abonnés newsletter |
| `ROLE_ACTION_CULTURELLE` | KPI programmes, prochains événements, inscriptions non lues |
| `ROLE_ACTUALITES` | KPI articles, vues, top articles, commentaires à modérer |
| `ROLE_CINEMATHEQUE` | KPI films/séances, prochaines projections, remplissage, inscriptions |
| `ROLE_ESPACES` | KPI espaces, espaces inactifs, demandes reçues |

## 4.2 Cartes KPI

Chaque carte affiche : **libellé**, **valeur principale**, **variation vs période
précédente** (flèche + %), **sparkline** 14 points, et devient un lien vers la
liste filtrée correspondante.

### KPI Contenus

| KPI | Source de données | Détail secondaire | Disponibilité |
|---|---|---|---|
| **Articles** | `COUNT(articles)` | dont X publiés / Y brouillons | ✅ Donnée présente |
| **Actualités & newsletters** | `COUNT(actualites)` | dont X newsletters PDF | ✅ |
| **Événements** | `COUNT(events)` | dont X à venir | ✅ |
| **Programmes** | `COUNT(programs)` | X internes / Y externes | ✅ |
| **Films** | `COUNT(films)` | dont X archivés | ✅ |
| **Projections** | `COUNT(screenings)` | dont X à venir, Y annulées | ✅ |
| **Espaces** | `COUNT(spaces)` | dont X actifs | ✅ |
| **Médias** | `COUNT(media_assets)` | volume total (`SUM(size)`) | ✅ (`size` renseigné) |
| **Audios** | — | durée cumulée | ❌ **Entité à créer** |
| **Partenaires** | `COUNT(partners WHERE is_active)` | | ✅ |
| **Diapositives hero** | `COUNT(home_hero_slides)` | dont X publiées | ✅ |

### KPI Audience

| KPI | Source | Remarque |
|---|---|---|
| **Vues articles** | `SUM(articles.view_count)` + `article_views` | ✅ Dédoublonné par IP hashée / 30 min |
| **Vues films** | `SUM(films.view_count)` + `film_views` | ✅ |
| **Vues projections** | `SUM(screenings.view_count)` + `screening_views` | ✅ |
| **Vues totales** | Somme des trois | ✅ |
| **Vues aujourd'hui / 7 j** | `countSince()` des trois repositories | ✅ |
| **Vues événements / programmes / espaces** | — | ❌ **Traçage à créer** (pas de table de vues) |
| **Temps de lecture moyen** | — | ❌ À créer (voir §5.3) |

### KPI Engagement & relation

| KPI | Source | Détail |
|---|---|---|
| **Commentaires** | `COUNT(comments)` | dont X masqués, Y en attente de réponse |
| **Messages de contact** | `COUNT(contact_messages)` | dont X non lus (badge rouge) |
| **Inscriptions programmes** | `COUNT(program_registrations)` | dont X non lues |
| **Inscriptions projections** | `COUNT(screening_registrations)` | dont X non lues |
| **Réservations totales** | Somme des deux | + total de places (`SUM(number_of_seats)`) |
| **Abonnés newsletter** | `COUNT(newsletter_subscribers WHERE is_active)` | + désabonnés, + taux de croissance |

### KPI Collecte (`ROLE_ADMIN`)

| KPI | Source | Détail |
|---|---|---|
| **Montant collecté** | `DonationRepository::campaignStats()` | en USD |
| **Objectif** | Paramètre `campaign.goal_usd` | barre de progression + % |
| **Nombre de dons** | `statusBreakdown()` | ventilation `pending`/`paid`/`failed`/`expired` |
| **Taux de succès** | `paid / (paid + failed + expired)` | en % |
| **Don moyen** | `collected / paidCount` | ✅ calculable |
| **Donateurs uniques** | `COUNT(donors)` | + % de donateurs récurrents |
| **Répartition par opérateur** | `paidByOperator()` | M-Pesa, Airtel, Orange, Visa CNP… |

### KPI Système (`ROLE_SUPER_ADMIN`)

| KPI | Source |
|---|---|
| **Utilisateurs** | `COUNT(users)` — dont X actifs, ventilation par rôle |
| **Connexions (7 j)** | `audit_logs` où `action IN ('login.api','login')` |
| **Actions journalisées** | `COUNT(audit_logs)` sur la période |
| **Jetons API actifs** | `COUNT(api_tokens WHERE expires_at > NOW())` |
| **Espace disque médias** | `SUM(media_assets.size)` + taille du dossier `public/uploads/media` |

## 4.3 Graphiques

| # | Widget | Type | Données | Disponibilité backend |
|---|---|---|---|---|
| G1 | **Trafic global** | Courbes multi-séries (articles / films / projections) | `dailyCounts(n)` des 3 repositories de vues | ✅ Sur 14 j — **à étendre à 30/90/365 j** |
| G2 | **Évolution des publications** | Barres empilées par mois et par type | `COUNT(*) GROUP BY MONTH(published_at)` | ⚠️ Requête à créer |
| G3 | **Évolution des consultations** | Aire cumulée | Tables `*_views` | ✅ |
| G4 | **Activité des utilisateurs** | Barres par utilisateur / heatmap calendaire | `audit_logs` groupés par `performed_by` et par jour | ⚠️ Requête à créer |
| G5 | **Progression de la collecte** | Jauge + courbe cumulée | `campaignStats()` + `donations.confirmed_at` | ⚠️ Série temporelle à créer |
| G6 | **Répartition par opérateur** | Donut | `paidByOperator()` | ✅ |
| G7 | **Répartition par statut de don** | Donut | `statusBreakdown()` | ✅ |
| G8 | **Top 10 contenus** | Barres horizontales | `findMostViewed(10)` (articles, films, projections) | ✅ |
| G9 | **Remplissage des séances** | Barres de progression | `capacity_taken / capacity_total` | ✅ |
| G10 | **Croissance des abonnés** | Courbe cumulée | `newsletter_subscribers.created_at` | ⚠️ Requête à créer |
| G11 | **Répartition des contenus par statut** | Donut | `GROUP BY status` sur chaque entité | ⚠️ Requête à créer |
| G12 | **Calendrier de programmation** | Heatmap mensuelle | `screenings.scheduled_date` + `programs.starts_at` + `events.starts_at` | ⚠️ Agrégat à créer |

**Interactions attendues sur tous les graphiques** : tooltip au survol,
légende cliquable (masquer/afficher une série), zoom par sélection sur les
séries temporelles, export PNG/CSV, état vide explicite, état de chargement
en squelette.

## 4.4 Activité récente

Flux unifié, paginé (20 par page, chargement infini), alimenté par le **journal
d'audit** (`audit_logs`) et par les **horodatages des entités**
(`created_at` / `updated_at` / `published_at`).

**Format d'une ligne**

```
[avatar]  Rhenard Munongo  a publié l'article  « Le Grand Tambour ouvre sa cinémathèque »
          il y a 12 minutes · Presse · IP 41.243.x.x            [Voir] [Annuler*]
```

**Types d'événements**

| Événement | Icône | Couleur | Source |
|---|---|---|---|
| **Création** | `plus-circle` | vert | `created_at` / audit `*.create` |
| **Modification** | `pen` | bleu | `updated_at` / audit `*.update` |
| **Publication** | `globe` | violet | passage `status → PUBLISHED` |
| **Dépublication** | `eye-slash` | gris | passage `status → DRAFT` |
| **Suppression** | `trash` | rouge | audit `*.delete` |
| **Connexion** | `right-to-bracket` | gris | audit `login.api` |
| **Échec de connexion** | `triangle-exclamation` | orange | audit `login.api.failed` |
| **Import / Export** | `file-import` | bleu | audit `newsletter.import` |
| **Campagne envoyée** | `paper-plane` | vert | audit `newsletter.campaign` |
| **Don confirmé** | `hand-holding-heart` | vert | `donations.confirmed_at` |

**Filtres** : par type d'action, par utilisateur, par module, par période.
**Actions** : « Voir l'élément », « Voir dans le journal d'audit », « Copier l'ID ».

> ⚠️ **Limite actuelle** : `AuditLogger` n'est appelé que pour les utilisateurs,
> les connexions API et la newsletter. Les créations/modifications de contenus
> **ne sont pas journalisées**. Un `EntityListener` Doctrine global est à
> ajouter pour alimenter correctement ce flux. Voir [§19.4](#194-dette-technique-identifiée).

## 4.5 Alertes & tâches à traiter

Bandeau ou colonne « À traiter », visible en haut de l'accueil quand ≥ 1 élément :

| Alerte | Condition | Action |
|---|---|---|
| Messages de contact non lus | `contact_messages.is_read = 0` | → Liste filtrée |
| Inscriptions non lues | `*_registrations.is_read = 0` | → Liste filtrée |
| Commentaires à modérer | `comments` créés < 24 h et non traités | → Modération |
| Dons bloqués en attente | `donations.status = 'pending'` depuis > 60 min | → Liste + relance |
| Séances presque complètes | `capacity_taken ≥ 0.9 × capacity_total` | → Fiche séance |
| Séances sans film à venir | Séance dont le film est `DRAFT` ou `archived` | → Correction |
| Brouillons anciens | `status = DRAFT` et `updated_at` > 30 j | → Liste |
| Contenus sans image | `cover_image IS NULL` sur contenu publié | → Liste |
| Contenus sans métadonnées SEO | (après création du module SEO) | → SEO |
| Comptes inactifs | `users.last_login_at` > 90 j | → Utilisateurs |
| Jetons API expirés | `api_tokens.expires_at < NOW()` | → Jetons |

---

# 5. Module Articles (Presse)

> Section « Presse du Grand Tambour » · Rôle `ROLE_ACTUALITES`
> Entités : `Article`, `ArticleCategory`, `ArticleView`, `Comment`

## 5.1 Modèle de données existant

### `Article` (table `articles`)

| Champ | Type | Contraintes | Usage dashboard |
|---|---|---|---|
| `id` | int | PK | — |
| `slug` | string(255) | unique, généré depuis `title` | URL publique, champ éditable avec verrou |
| `title` | string(255) | requis | Titre principal |
| `excerpt` | text | nullable | Chapô / résumé |
| `content` | text | nullable | Corps de l'article (éditeur riche) |
| `author` | string(255) | nullable | **Texte libre** — pas de relation `User` |
| `category` | `ArticleCategory` | nullable, `SET NULL` | Rubrique |
| `image` | string(255) | nullable | Vignette de liste |
| `coverImage` | string(255) | nullable | Image de couverture (détail) |
| `readingTime` | int | défaut 3 | Minutes — **saisi manuellement** |
| `featured` | bool | défaut false | Mise à la une |
| `status` | enum `ContentStatus` | `DRAFT` \| `PUBLISHED` | Statut |
| `publishedAt` | datetime | nullable | Date de publication |
| `createdAt` / `updatedAt` | datetime | auto | Horodatage |
| `viewCount` | int | défaut 0 | Compteur dénormalisé |

### `ArticleCategory` (table `article_categories`)

`id`, `slug` (unique), `name`, `position` (ordre), `createdAt`, `updatedAt`,
relation `OneToMany` vers `Article`.

### `ArticleView` (table `article_views`)

`id`, `article` (FK CASCADE), `ipHash` (SHA-256 de l'IP + `APP_SECRET`),
`viewedAt`. Dédoublonnage : 1 vue par IP et par article toutes les **30 min**
(`ArticleViewApiController::DEDUP_WINDOW_MINUTES`), avec limiteur de débit
(`limiter.article_view_limiter`).

## 5.2 Fonctionnalités existantes

| Fonctionnalité | Où | Détail |
|---|---|---|
| CRUD complet | `ArticleCrudController` | Liste, création, édition, détail, suppression, suppression par lot |
| Éditeur riche | `TextEditorField` | WYSIWYG basique (EasyAdmin) |
| Slug auto | `SlugField` | Dérivé de `title`, modifiable |
| Upload d'images | `ImageField` ×2 | `image` + `coverImage` → `public/uploads/media`, motif `[slug]-[timestamp].[extension]`, max 20 Mo, JPG/PNG/WebP |
| Catégorisation | `AssociationField` | + action globale « Ajouter une catégorie » |
| Mise à la une | `BooleanField` | `featured` |
| Statut & planification | `ChoiceField` + `DateTimeField` | `DRAFT`/`PUBLISHED` + `publishedAt` |
| Compteur de vues | Lecture seule dans le formulaire | |
| Recherche | `setSearchFields` | Titre, slug, contenu |
| Statistiques de lecture | `/admin/article-stats` | Vues totales, aujourd'hui, 7 j, top 10, série 14 j |
| Comptage public | `POST /api/content/articles/{slug}/view` | Dédoublonné |
| API publique | `GET /api/content/articles`, `/articles/{slug}`, `/article-categories` | Filtres `category`, `featured` |
| Commentaires | `CommentCrudController` + `/api/content/articles/{slug}/comments` | Fil à 2 niveaux (commentaire + réponses) |

## 5.3 Fonctionnalités manquantes

| # | Manque | Impact | Priorité |
|---|---|---|---|
| M1 | **Aucune API admin** pour les articles (lecture ni écriture) | Bloquant pour le Dashboard | 🔴 P0 |
| M2 | Prévisualisation avant publication | Erreurs de mise en forme en production | 🔴 P0 |
| M3 | Publication planifiée (`SCHEDULED` + tâche cron) | Publication manuelle nocturne | 🔴 P0 |
| M4 | Auteur = relation `User` (aujourd'hui texte libre) | Pas d'attribution fiable, bloque `ROLE_EDITOR` | 🔴 P0 |
| M5 | Temps de lecture calculé automatiquement | Saisie manuelle, incohérente | 🟠 P1 |
| M6 | Champs SEO (meta title/description, OG, canonical) | Référencement dégradé | 🟠 P1 |
| M7 | Audios associés à l'article | Fonctionnalité attendue, inexistante | 🟠 P1 |
| M8 | Historique des versions / restauration | Perte de contenu irréversible | 🟠 P1 |
| M9 | Statistiques de partage social | Pas de mesure de viralité | 🟠 P1 |
| M10 | Tags libres (en plus des catégories) | Navigation transversale limitée | 🟡 P2 |
| M11 | Articles liés / suggestions | Engagement | 🟡 P2 |
| M12 | Duplication d'un article | Productivité | 🟡 P2 |
| M13 | Import/export (Markdown, CSV) | Migration, sauvegarde | 🟡 P2 |
| M14 | Multilingue (FR/EN/LN) | Rayonnement international | 🟡 P2 |
| M15 | Workflow de relecture | Qualité éditoriale | 🟡 P2 |
| M16 | Galerie d'images par article (comme films/programmes) | Richesse éditoriale | 🟡 P2 |
| M17 | Commentaires : réponse depuis le dashboard en un clic | Réactivité de modération | 🟠 P1 |

## 5.4 Statistiques du module

### Disponibles

| Métrique | Source | Granularité |
|---|---|---|
| Vues totales | `SUM(articles.view_count)` | Global |
| Vues aujourd'hui | `ArticleViewRepository::countSince(today)` | Jour |
| Vues 7 jours | `countSince(-7 days)` | Semaine |
| Série quotidienne | `dailyCounts(14)` | 14 jours |
| Top 10 articles | `findMostViewed(10)` | Global |
| Vues par article | `articles.view_count` | Par article |
| Visiteurs uniques (approx.) | `COUNT(DISTINCT ip_hash)` sur `article_views` | Toute période |
| Commentaires par article | `COUNT(comments)` | Par article |

### À créer

| Métrique | Implémentation proposée |
|---|---|
| **Partages** | Table `article_shares(article_id, network, shared_at, ip_hash)` + endpoint `POST /api/content/articles/{slug}/share` appelé par les boutons de partage du site |
| **Temps de lecture réel** | Ajouter `dwell_seconds` sur `article_views`, envoyé au `beforeunload` du front |
| **Temps de lecture estimé** | Calcul auto : `ceil(nb_mots / 200)` à la sauvegarde |
| **Taux de complétion** | Profondeur de scroll (25/50/75/100 %) envoyée par le front |
| **Écoutes audio** | Après création du module Audio (§7) |
| **Sources de trafic** | Stocker le `Referer` sur `article_views` |
| **Appareil / navigateur** | Parser le `User-Agent` (stockage anonymisé) |
| **Comparaison période à période** | Requêtes `dailyCounts` paramétrées sur 2 fenêtres |

## 5.5 Pages frontend nécessaires

### `/presse/articles` — Liste

- **En-tête** : titre, compteur, bouton primaire « Nouvel article », menu
  « ⋯ » (Importer, Exporter CSV, Gérer les catégories).
- **Barre de filtres** : recherche plein texte, statut (Tous/Publiés/Brouillons),
  catégorie, auteur, à la une (oui/non), période de publication, tri
  (Récents / Plus vus / Alphabétique).
- **Vues** : bascule Tableau ⇄ Grille de cartes.
- **Colonnes du tableau** : ☑ · Vignette · Titre + slug · Catégorie (badge) ·
  Statut (badge) · Auteur · Publié le · Vues · Commentaires · Actions.
- **Actions par ligne** : Éditer · Prévisualiser · Dupliquer · Statistiques ·
  Publier/Dépublier · Mettre à la une · Supprimer.
- **Actions groupées** : Publier · Dépublier · Changer de catégorie · Supprimer ·
  Exporter la sélection.
- **Pagination** : 25/50/100 par page, position mémorisée dans l'URL.
- **États** : chargement (squelette de 5 lignes), vide (illustration + CTA),
  erreur (message + « Réessayer »).

### `/presse/articles/nouveau` et `/presse/articles/:id` — Création / Édition

Layout à 2 colonnes : **contenu principal (2/3)** + **panneau latéral (1/3)**.

**Onglet « Contenu »**
- Titre (grand champ, autofocus)
- Slug (auto-généré, dépliable, avec bouton de verrouillage et vérification
  d'unicité en direct)
- Chapô / résumé (textarea, compteur de caractères, cible 160)
- Corps : éditeur riche — gras, italique, souligné, H2/H3/H4, listes, citation,
  lien, image (via bibliothèque média), tableau, séparateur, bloc de code,
  intégration YouTube/Vimeo, plein écran, annuler/rétablir, mode Markdown

**Onglet « Média »**
- Vignette (`image`) : dépose ou sélection dans la bibliothèque, recadrage 16/9
- Couverture (`coverImage`) : idem, recadrage 21/9
- Aperçu du rendu en carte de liste et en tête d'article

**Onglet « Audio »** *(après création du module §7)*
- Liste des audios liés (titre, durée, lecteur), ajout, réordonnement, retrait

**Onglet « SEO »** *(après création du module §13)*
- Meta title (60), meta description (160), mots-clés, image OG, URL canonique,
  `noindex`, aperçu Google + aperçu carte sociale

**Onglet « Statistiques »** *(en édition uniquement)*
- Vues totales, courbe 30 j, visiteurs uniques, partages, temps de lecture,
  commentaires

**Panneau latéral (toujours visible)**
- Bloc *Publication* : statut, date de publication, bouton primaire contextuel
  (« Enregistrer le brouillon » / « Publier » / « Mettre à jour »), lien
  « Prévisualiser », « Dépublier »
- Bloc *Organisation* : catégorie, auteur (autocomplete `User` après M4), tags
- Bloc *Options* : à la une, temps de lecture (auto + surcharge manuelle),
  autoriser les commentaires
- Bloc *Informations* : créé le, modifié le, par qui, ID, historique des versions

**Comportements**
- **Brouillon automatique** toutes les 30 s si le formulaire est sale
- **Avertissement de sortie** en cas de modifications non enregistrées
- **Raccourcis** : `⌘S` enregistrer, `⌘⇧P` prévisualiser
- **Validation** : titre requis, slug unique, `publishedAt` requis si `PUBLISHED`
- **Verrouillage d'édition concurrente** : bandeau « Rhenard édite cet article
  depuis 3 min » (nécessite un endpoint de lock côté backend)

### `/presse/articles/:id/apercu` — Prévisualisation

Rendu fidèle au site public dans une iframe, sélecteur de largeur
(mobile 375 / tablette 768 / desktop 1440), bouton « Publier » et
« Retour à l'édition ». Nécessite un endpoint de preview signé côté Next.js.

### `/presse/categories` — Catégories

Tableau simple : Nom · Slug · Nombre d'articles · Ordre (poignée de
glisser-déposer) · Actions. Création/édition en modale.
Suppression bloquée si des articles sont rattachés (proposer une réaffectation).

### `/presse/commentaires` — Modération

- Filtres : article, statut (visible/masqué), rôle de l'auteur (visiteur /
  rédaction), période, avec/sans réponse
- Affichage en fil : commentaire parent + réponses indentées
- Actions : Masquer/Afficher · Répondre en tant que rédaction · Supprimer ·
  Voir l'article · Signaler comme spam
- Actions groupées : masquer, supprimer
- Badge de comptage dans la sidebar sur les commentaires des dernières 24 h

### `/presse/statistiques` — Statistiques de lecture

- 4 cartes KPI : vues totales, aujourd'hui, 7 jours, visiteurs uniques
- Graphique de trafic (période configurable, comparaison N-1)
- Top 10 des articles (barres horizontales, cliquables)
- Tableau détaillé : Article · Vues · Uniques · Partages · Temps moyen ·
  Commentaires · Publié le — triable, exportable CSV/Excel/PDF
- Répartition par catégorie (donut)
- Répartition par jour de la semaine et par heure (heatmap) — aide à la
  planification des publications

## 5.6 Composants UI nécessaires

| Composant | Description | Réutilisé par |
|---|---|---|
| `DataTable` | Tableau : tri, sélection multiple, colonnes configurables, pagination, densité | Tous les modules |
| `FilterBar` | Barre de filtres combinables, synchronisée avec l'URL, « Réinitialiser » | Tous |
| `RichTextEditor` | Éditeur WYSIWYG + Markdown, insertion média | Articles, Actualités, Événements, Programmes |
| `SlugInput` | Génération auto, verrouillage, vérification d'unicité | Tous les contenus |
| `MediaPicker` | Modale de sélection dans la bibliothèque + upload direct | Tous |
| `ImageUploader` | Dépose, recadrage par ratio, aperçu, barre de progression, suppression | Tous |
| `StatusBadge` | Pastille colorée (Publié/Brouillon/Planifié/Archivé) | Tous |
| `PublishPanel` | Bloc de publication du panneau latéral | Contenus |
| `TabsNav` | Onglets de formulaire avec indicateur d'erreur par onglet | Formulaires riches |
| `StatCard` | Carte KPI (valeur, variation, sparkline) | Tous |
| `LineChart` / `BarChart` / `DonutChart` | Graphiques (période, légende, export) | Statistiques |
| `ActivityFeed` | Flux d'activité paginé | Accueil, Audit |
| `CommentThread` | Fil de commentaires avec réponses | Modération |
| `ConfirmDialog` | Confirmation destructive (saisie du nom pour les suppressions critiques) | Tous |
| `EmptyState` | Illustration + message + CTA | Tous |
| `SkeletonLoader` | Squelettes de tableau, carte, formulaire | Tous |
| `Toast` | Notifications éphémères succès/erreur, avec « Annuler » | Tous |
| `UnsavedChangesGuard` | Blocage de navigation si formulaire sale | Formulaires |
| `AutoSaveIndicator` | « Enregistré il y a 12 s » | Formulaires |

---

# 6. Module Médias

> Section « Bibliothèque média » · Rôle `ROLE_CONTENT`
> Entité : `MediaAsset` + galeries dédiées `FilmGalleryImage`,
> `ProgramGalleryImage`, `SpaceGalleryImage`

## 6.1 État des lieux

### `MediaAsset` (table `media_assets`)

| Champ | Type | Remarque |
|---|---|---|
| `id` | int | PK |
| `name` | string(255) | Nom d'affichage |
| `filename` | string(255) | Nom du fichier sur disque |
| `alt` | string(255) | Texte alternatif (accessibilité/SEO) |
| `caption` | text | Légende |
| `mime` | string(100) | Type MIME |
| `size` | int | Taille en octets |
| `createdAt` | datetime | Date d'ajout |

### Stockage et distribution

- **Répertoire unique** : `public/uploads/media/` — tous les uploads du projet y
  atterrissent (images d'articles, affiches de films, logos de partenaires,
  PDF de newsletters, visuels hero…).
- **Nommage** : motif EasyAdmin `[slug]-[timestamp].[extension]` (ou
  `[slug]-cover-[timestamp].[extension]`, `[slug]-poster-…`, etc. selon le champ).
- **Distribution** : `MediaFileController` sert `/uploads/media/{filename}` en
  `BinaryFileResponse`, cache public immuable 1 an. La route restreint le nom de
  fichier à `[A-Za-z0-9._-]+` (pas de traversée de répertoire). Le chemin
  `^/uploads` est en accès public dans `security.yaml`.
- **Contraintes** (`UploadConstraints`) : **20 Mo maximum**, images (JPG, PNG,
  WebP via la contrainte `Image`) ou **PDF** (`application/pdf`) selon le champ.

### Galeries spécialisées

| Entité | Rattachée à | Champs |
|---|---|---|
| `FilmGalleryImage` | `Film` (CASCADE, `orphanRemoval`) | `image`, `caption`, `position` |
| `ProgramGalleryImage` | `Program` (CASCADE, `orphanRemoval`) | `image`, `caption`, `position` |
| `SpaceGalleryImage` | `Space` (CASCADE, `orphanRemoval`) | `image`, `caption`, `position` |

Ces galeries sont administrées par des CRUD **séparés** dans EasyAdmin, avec une
simple action globale « Ajouter une image de galerie » depuis la fiche parente —
ergonomie à repenser entièrement dans le Dashboard (gestion inline).

### API publique

`GET /api/content/media` — pagination fixe de 24 éléments, retourne
`name`, `url`, `alt`, `caption`. Pas de filtre, pas de recherche, pas de total.

## 6.2 Fonctionnalités manquantes

| # | Manque | Priorité |
|---|---|---|
| N1 | **Aucune API admin média** (upload, liste, suppression) | 🔴 P0 |
| N2 | Upload multiple / par glisser-déposer | 🔴 P0 |
| N3 | Dossiers ou collections | 🔴 P0 |
| N4 | Recherche et filtres (type, taille, date, dimensions, usage) | 🔴 P0 |
| N5 | Prévisualisation plein écran (lightbox) | 🔴 P0 |
| N6 | Gestion inline des galeries (film/programme/espace) | 🔴 P0 |
| N7 | Variantes/miniatures (thumb, medium, large, WebP) | 🟠 P1 |
| N8 | Recadrage & retouche basique (rotation, recadrage, compression) | 🟠 P1 |
| N9 | Détection des doublons (hash du fichier) | 🟠 P1 |
| N10 | Traçabilité d'usage (« utilisé par 3 articles ») + blocage de suppression | 🟠 P1 |
| N11 | Nettoyage des orphelins (fichiers sur disque non référencés) | 🟠 P1 |
| N12 | Stockage des dimensions (`width`, `height`) | 🟠 P1 |
| N13 | Tags et métadonnées libres | 🟡 P2 |
| N14 | Support vidéo (MP4) et audio (MP3) | 🟡 P2 |
| N15 | Quota d'espace et alerte | 🟡 P2 |
| N16 | CDN / stockage objet (S3) | 🟡 P2 |
| N17 | Génération automatique du texte alternatif | 🟡 P2 |

> **Écart structurant** : les champs image des entités stockent un **nom de
> fichier en texte**, sans relation vers `MediaAsset`. La bibliothèque média est
> donc aujourd'hui **déconnectée** des contenus qui l'utilisent. Deux stratégies :
> (a) migrer progressivement vers `ManyToOne(MediaAsset)` ; (b) conserver le nom
> de fichier et reconstituer l'usage par jointure sur `filename`. La solution (a)
> est recommandée à moyen terme, la (b) permet de livrer le Dashboard v1.

## 6.3 Spécification de la bibliothèque média

### `/contenu/medias` — Bibliothèque

**Layout**

```
┌───────────────────────────────────────────────────────────────────┐
│  Bibliothèque média          [⬆ Téléverser]  [+ Nouveau dossier]  │
├──────────────┬────────────────────────────────────────────────────┤
│ DOSSIERS     │  [🔍 Rechercher]  [Type ▾][Date ▾][Taille ▾][Tri ▾]│
│              │  ▦ Grille  ☰ Liste            1 248 fichiers · 3,2 Go│
│ 📁 Tous      ├────────────────────────────────────────────────────┤
│ 📁 Articles  │  ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐        │
│ 📁 Films     │  │ ☑  │ │    │ │    │ │    │ │    │ │    │        │
│ 📁 Événements│  └────┘ └────┘ └────┘ └────┘ └────┘ └────┘        │
│ 📁 Espaces   │  nom.jpg  …                                        │
│ 📁 Partenaires│                                                    │
│ 📁 Newsletters│  ⟨ zone de dépôt : glissez vos fichiers ici ⟩     │
│ 🗑 Orphelins  │                                                    │
└──────────────┴────────────────────────────────────────────────────┘
```

**Filtres**

| Filtre | Valeurs |
|---|---|
| Type | Image · PDF · Audio · Vidéo · Autre |
| Format | JPG · PNG · WebP · SVG · PDF · MP3 · MP4 |
| Taille | < 100 Ko · 100 Ko–1 Mo · 1–5 Mo · > 5 Mo |
| Dimensions | Portrait · Paysage · Carré · > 1920 px |
| Date | Aujourd'hui · 7 j · 30 j · Personnalisé |
| Usage | Utilisé · Non utilisé (orphelin) |
| Sans texte alternatif | Booléen (accessibilité) |
| Dossier | Arborescence |

**Tri** : Plus récent · Plus ancien · Nom A→Z · Taille ↓ · Plus utilisé

**Vue grille** : cartes 180×180, vignette, nom tronqué, badge de type,
case à cocher au survol, menu « ⋯ ».
**Vue liste** : Aperçu · Nom · Type · Dimensions · Taille · Ajouté le ·
Utilisé par · Actions.

**Actions groupées** : Déplacer vers un dossier · Ajouter des tags ·
Télécharger (ZIP) · Supprimer (avec avertissement d'usage).

**Zone de téléversement** : glisser-déposer global sur la page, sélecteur de
fichiers, coller depuis le presse-papiers ; file d'attente avec progression
individuelle, annulation, reprise ; validation client (type, 20 Mo) alignée sur
`UploadConstraints` ; compression automatique optionnelle au-delà de 2 Mo.

### `/contenu/medias/:id` — Détail

Modale ou panneau latéral : aperçu grand format, métadonnées (nom de fichier,
type MIME, taille, dimensions, date), champs éditables (nom, texte alternatif,
légende, tags, dossier), URL publique avec bouton de copie, liste des contenus
utilisant ce média, actions (Télécharger, Remplacer le fichier, Recadrer,
Supprimer). Navigation `←` `→` entre médias.

### `MediaPicker` — Modale de sélection

Invoquée depuis tous les champs image du dashboard. Deux onglets :
« Bibliothèque » (grille filtrable, sélection simple ou multiple) et
« Téléverser » (dépose directe). Boutons « Annuler » / « Sélectionner ».
Doit retourner le `filename` (compatibilité avec le stockage actuel) **et**
l'`id` du `MediaAsset` (pour la future migration relationnelle).

### `GalleryManager` — Gestion inline des galeries

Composant embarqué dans les fiches Film / Programme / Espace :
grille d'images réordonnable par glisser-déposer (met à jour `position`),
légende éditable en ligne, ajout multiple via `MediaPicker`, suppression avec
confirmation, aperçu en lightbox.

---

# 7. Module Audio

> ⚠️ **Ce module n'existe pas dans le backend.** Aucune entité, aucun champ,
> aucun endpoint, aucune contrainte d'upload audio. La spécification ci-dessous
> décrit une création complète : backend **et** frontend.

## 7.1 Analyse de l'existant

| Recherche | Résultat |
|---|---|
| Entité `Audio`, `Podcast`, `Track` | ❌ Absente |
| Champ `audio*` dans les 32 entités | ❌ Absent |
| MIME audio dans `UploadConstraints` | ❌ Absent (images + `application/pdf` uniquement) |
| Endpoint audio | ❌ Absent |
| Répertoire de stockage audio | ❌ Absent (`public/uploads/media` seul) |

**Conclusion** : chantier greenfield. Estimation backend : 3 à 5 jours
(entité, migration, CRUD EasyAdmin, API admin, API publique, contraintes
d'upload, extraction de durée).

## 7.2 Modèle de données proposé

### Entité `AudioTrack` (table `audio_tracks`)

| Champ | Type | Contraintes | Description |
|---|---|---|---|
| `id` | int | PK | |
| `title` | string(255) | requis | Titre de la piste |
| `slug` | string(255) | unique | URL publique |
| `description` | text | nullable | Description |
| `filename` | string(255) | requis | Fichier dans `public/uploads/audio` |
| `mime` | string(100) | | `audio/mpeg`, `audio/mp4`, `audio/ogg`, `audio/wav` |
| `size` | int | | Octets |
| `duration` | int | nullable | Durée en secondes (extraite à l'upload) |
| `coverImage` | string(255) | nullable | Pochette |
| `transcript` | text | nullable | Transcription (accessibilité + SEO) |
| `speaker` | string(255) | nullable | Intervenant / narrateur |
| `recordedAt` | date | nullable | Date d'enregistrement |
| `category` | `AudioCategory` | nullable | Rubrique (podcast, lecture, conférence…) |
| `status` | enum `ContentStatus` | `DRAFT`/`PUBLISHED` | Statut |
| `publishedAt` | datetime | nullable | |
| `playCount` | int | défaut 0 | Compteur dénormalisé |
| `completionCount` | int | défaut 0 | Écoutes complètes |
| `position` | int | défaut 0 | Ordre |
| `createdAt` / `updatedAt` | datetime | auto | |

### Entité `ArticleAudio` (table `article_audios`) — liaison

`id`, `article` (FK CASCADE), `audioTrack` (FK CASCADE), `position`, `label`
(ex. « Version audio de l'article », « Interview complémentaire »).

> Alternative plus simple pour la v1 : relation `ManyToOne` directe
> `Article.audioTrack`. La table de liaison est préférable si un article peut
> porter plusieurs audios (cas envisagé dans la demande initiale).

### Entité `AudioCategory` (table `audio_categories`)

`id`, `slug` (unique), `name`, `position`, `createdAt`, `updatedAt`.

### Entité `AudioPlay` (table `audio_plays`) — statistiques

`id`, `audioTrack` (FK CASCADE), `ipHash` (SHA-256 + `APP_SECRET`),
`playedAt`, `listenedSeconds`, `completed` (bool), `source`
(`article` | `library` | `player`). Même stratégie de dédoublonnage que
`ArticleView` : 1 écoute par IP et par piste / 30 min.

## 7.3 Contraintes d'upload à ajouter

```php
// src/EasyAdmin/UploadConstraints.php
public const MAX_AUDIO_SIZE = '100M';

/** @return File[] */
public static function audio(): array
{
    return [new File(
        maxSize: self::MAX_AUDIO_SIZE,
        mimeTypes: ['audio/mpeg', 'audio/mp4', 'audio/ogg', 'audio/wav', 'audio/x-m4a'],
    )];
}
```

Répertoire dédié `public/uploads/audio/`, servi par un contrôleur analogue à
`MediaFileController` **avec support des requêtes `Range`** (indispensable au
scrubbing du lecteur HTML5) : `BinaryFileResponse` + `Accept-Ranges: bytes`.

Extraction de durée : `getID3` (PHP pur, pas d'extension système requise) ou
`ffprobe` si disponible sur l'hébergement. À défaut, saisie manuelle avec
avertissement.

## 7.4 Endpoints à créer

| Méthode | Route | Accès | Description |
|---|---|---|---|
| GET | `/api/admin/audio` | `ROLE_ACTUALITES` | Liste paginée + filtres |
| POST | `/api/admin/audio` | `ROLE_ACTUALITES` | Upload multipart + métadonnées |
| GET | `/api/admin/audio/{id}` | `ROLE_ACTUALITES` | Détail |
| PATCH | `/api/admin/audio/{id}` | `ROLE_ACTUALITES` | Édition |
| DELETE | `/api/admin/audio/{id}` | `ROLE_ACTUALITES` | Suppression |
| GET | `/api/admin/audio/{id}/stats` | `ROLE_ACTUALITES` | Statistiques d'écoute |
| POST | `/api/admin/articles/{id}/audio` | `ROLE_ACTUALITES` | Associer une piste |
| DELETE | `/api/admin/articles/{id}/audio/{audioId}` | `ROLE_ACTUALITES` | Dissocier |
| GET | `/api/content/audio` | Public | Pistes publiées |
| GET | `/api/content/audio/{slug}` | Public | Détail |
| POST | `/api/content/audio/{slug}/play` | Public | Comptabilise une écoute |
| POST | `/api/content/audio/{slug}/progress` | Public | Progression (secondes, complété) |

## 7.5 Pages frontend

### `/presse/audios` — Liste

- KPI : nombre de pistes · durée totale · écoutes totales · écoutes 7 j
- Filtres : recherche, catégorie, statut, durée (< 5 min / 5–20 / > 20),
  associé à un article (oui/non), période
- Vue liste : ▶ (lecture en place) · Titre · Catégorie · Durée · Écoutes ·
  Taux de complétion · Statut · Publié le · Actions
- Lecteur persistant en bas d'écran (mini-player) qui survit à la navigation
- Actions groupées : publier, dépublier, changer de catégorie, supprimer

### `/presse/audios/nouveau` — Téléversement

- Zone de dépôt (fichiers multiples), file d'attente avec progression
- Formulaire par piste : titre (pré-rempli depuis le nom de fichier), slug,
  description, intervenant, date d'enregistrement, catégorie, pochette,
  transcription, statut
- Forme d'onde générée côté client (Web Audio API) pour repérage visuel
- Durée détectée automatiquement, modifiable
- Association immédiate à un article (autocomplete)

### `/presse/audios/:id` — Détail / Édition

- Lecteur complet : forme d'onde, vitesse (0,75× / 1× / 1,25× / 1,5× / 2×),
  saut ±15 s, volume, téléchargement
- Onglets : Informations · Transcription · Articles liés · Statistiques
- Transcription : éditeur texte avec horodatages optionnels, import SRT/VTT
- Statistiques : écoutes totales, auditeurs uniques, taux de complétion,
  **courbe d'abandon** (à quel moment les auditeurs décrochent), écoutes par
  source (article / bibliothèque), courbe 30 jours

### `/presse/audios/statistiques` — Statistiques d'écoute

- KPI : écoutes totales · durée écoutée cumulée · complétion moyenne ·
  auditeurs uniques
- Top 10 des pistes les plus écoutées
- Courbe d'écoutes quotidiennes
- Tableau détaillé exportable

### Composants UI spécifiques

| Composant | Description |
|---|---|
| `AudioPlayer` | Lecteur complet : forme d'onde, contrôles, vitesse, chapitres |
| `MiniPlayer` | Barre persistante en pied de dashboard |
| `WaveformViewer` | Rendu de forme d'onde (canvas) |
| `AudioUploadQueue` | File d'attente d'upload avec progression et annulation |
| `DurationInput` | Saisie/affichage `mm:ss` |
| `TranscriptEditor` | Éditeur de transcription avec horodatages |
| `DropOffChart` | Courbe d'abandon d'écoute |

---

# 8. Module Cinémathèque

> Section « Cinémathèque » · Rôle `ROLE_CINEMATHEQUE`
> Entités : `Film`, `FilmCategory`, `FilmGalleryImage`, `FilmView`,
> `Screening`, `ScreeningRegistration`, `ScreeningView`, `CinemathequeSettings`

## 8.1 Films

### Modèle de données

| Champ | Type | Usage |
|---|---|---|
| `slug` | string, unique | URL, auto depuis `title` |
| `title` | string | Titre |
| `synopsis` | text | Résumé |
| `director` | string | Réalisateur |
| `country` | string | Pays de production |
| `year` | int | Année |
| `duration` | int | Durée en minutes |
| `language` | string | Langue |
| `ageRating` | string(50) | Classification d'âge |
| `trailerUrl` | string(500) | Bande-annonce (YouTube/Vimeo) |
| `cast` | **json** | Casting — tableau de chaînes |
| `poster` | string | Affiche (`[slug]-poster-[timestamp]`) |
| `backdrop` | string | Image de fond (`[slug]-backdrop-[timestamp]`) |
| `status` | enum | `DRAFT`/`PUBLISHED` |
| `archived` | bool | Retiré du catalogue actif |
| `viewCount` | int | Vues (dédoublonnées 30 min) |
| `categories` | `ManyToMany(FilmCategory)` | Genres |
| `galleryImages` | `OneToMany(FilmGalleryImage)` | Photos, `orphanRemoval` |
| `screenings` | `OneToMany(Screening)` | Séances |

### Fonctionnalités existantes

- CRUD complet (`FilmCrudController`), recherche sur titre/réalisateur/synopsis
- Upload d'affiche et d'image de fond (20 Mo max)
- Casting via `ArrayField` (liste de chaînes, saisie ligne par ligne)
- Genres multiples via `AssociationField`
- Archivage (`archived`) distinct de la dépublication (`status`)
- Action globale « Ajouter une image de galerie » → CRUD séparé
- API publique : `GET /api/cinematheque/films`, `/films/{slug}`, `/categories`,
  `POST /films/{slug}/view`

### Manques

| # | Manque | Priorité |
|---|---|---|
| F1 | API admin films | 🔴 P0 |
| F2 | Casting structuré (nom + rôle + photo) plutôt qu'un tableau plat | 🟠 P1 |
| F3 | Prévisualisation de la bande-annonce dans le formulaire | 🟠 P1 |
| F4 | Gestion inline de la galerie | 🔴 P0 |
| F5 | Recadrage guidé de l'affiche (2:3) et du backdrop (16:9) | 🟠 P1 |
| F6 | Import depuis TMDb / IMDb (pré-remplissage) | 🟡 P2 |
| F7 | Équipe technique (producteur, scénariste, chef opérateur) | 🟡 P2 |
| F8 | Distinctions et sélections en festival | 🟡 P2 |
| F9 | Sous-titres disponibles | 🟡 P2 |
| F10 | Champs SEO | 🟠 P1 |

## 8.2 Projections

### Modèle de données

| Champ | Type | Usage |
|---|---|---|
| `film` | `ManyToOne(Film)` requis, CASCADE | Film projeté |
| `scheduledDate` | date | Date de la séance |
| `startTime` | time | Heure de début |
| `endTime` | time, nullable | Heure de fin |
| `venue` | string | Lieu |
| `description` | text | Description de la séance |
| `isVisible` | bool (défaut true) | Masquer sans supprimer |
| `isCancelled` | bool (défaut false) | Séance annulée |
| `featured` | bool | En vedette (la prochaine séance l'est déjà automatiquement) |
| `position` | int, nullable | Ordre manuel |
| `capacityTotal` | int, nullable | Places totales |
| `capacityTaken` | int, nullable | Places prises |
| `isFree` | bool (défaut true) | Gratuit → formulaire d'inscription ; payant → billetterie |
| `price` | int, nullable | Prix en francs congolais |
| `viewCount` | int | Vues |

### Fonctionnalités existantes

- CRUD (`ScreeningCrudController`), tri par date décroissante
- Statut calculé (`statusLabel`, enum `ScreeningStatus`) affiché en lecture seule
- Distinction gratuit/payant pilotant le comportement du site public
- Capacité totale et prise (saisie manuelle)
- API publique : `GET /api/cinematheque/screenings?upcoming=…`,
  `POST /screenings/{id}/view`, `POST /screenings/{id}/register`
- Inscriptions gratuites : `ScreeningRegistration` + notification e-mail
- Réglages billetterie : `CinemathequeSettings.bookingUrl` (URL externe unique)

### Manques

| # | Manque | Priorité |
|---|---|---|
| P1 | API admin projections | 🔴 P0 |
| P2 | **Vue calendrier** (mois/semaine) avec création par clic | 🔴 P0 |
| P3 | Séances récurrentes (tous les samedis à 18 h, sur N semaines) | 🟠 P1 |
| P4 | Détection de conflit d'horaire sur un même lieu | 🟠 P1 |
| P5 | `capacityTaken` alimenté automatiquement depuis les inscriptions | 🔴 P0 |
| P6 | Notification automatique aux inscrits en cas d'annulation | 🟠 P1 |
| P7 | Liste d'attente quand la séance est complète | 🟠 P1 |
| P8 | Billets / QR codes et pointage à l'entrée | 🟡 P2 |
| P9 | Archivage automatique des séances passées | 🟠 P1 |
| P10 | Duplication d'une séance | 🟠 P1 |
| P11 | Gestion de plusieurs salles/lieux comme entité (`venue` est un texte libre) | 🟡 P2 |
| P12 | Billetterie interne (aujourd'hui : simple redirection externe) | 🟡 P2 |

## 8.3 Statistiques cinémathèque

### Disponibles (`/admin/cinematheque-stats`)

| Métrique | Source |
|---|---|
| Vues totales (films + projections) | `SUM(view_count)` |
| Vues aujourd'hui | `countSince(today)` × 2 repositories |
| Vues 7 jours | `countSince(-7 days)` × 2 |
| Série 14 jours combinée | `dailyCounts(14)` fusionnés |
| Top 10 films | `FilmRepository::findMostViewed(10)` |
| Top 10 projections | `ScreeningRepository::findMostViewed(10)` |

### À créer

| Métrique | Implémentation |
|---|---|
| Inscriptions par séance | `COUNT(screening_registrations GROUP BY screening_id)` |
| Places réservées | `SUM(number_of_seats)` |
| **Taux de remplissage** | `capacity_taken / capacity_total` par séance et moyenne |
| Films les plus programmés | `COUNT(screenings GROUP BY film_id)` |
| Fréquentation par jour de semaine | `GROUP BY DAYOFWEEK(scheduled_date)` |
| Fréquentation par créneau horaire | `GROUP BY HOUR(start_time)` |
| Popularité par genre | Jointure `films_categories` + vues |
| Taux d'annulation | `is_cancelled / total` |
| Vues → inscriptions (conversion) | `registrations / screening_views` |
| Recettes estimées | `SUM(price × capacity_taken)` sur séances payantes |
| Comparaison mensuelle | Séries `dailyCounts` sur 2 fenêtres |

## 8.4 Interfaces frontend

### `/cinematheque/films` — Catalogue

- KPI : films au catalogue · publiés · archivés · vues totales
- Filtres : recherche, genre (multi), statut, archivé, année (plage),
  pays, durée, avec/sans séance programmée
- **Vue grille d'affiches** par défaut (format 2:3, titre + année + badges),
  bascule vers vue tableau
- Tableau : Affiche · Titre · Réalisateur · Année · Durée · Genres · Statut ·
  Séances · Vues · Actions
- Actions par ligne : Éditer · Programmer une séance · Voir les séances ·
  Statistiques · Archiver · Supprimer
- Actions groupées : publier, archiver, changer de genre, supprimer

### `/cinematheque/films/:id` — Fiche film

**Onglet « Informations »** : titre, slug, synopsis, réalisateur, pays, année,
durée, langue, classification d'âge, genres (multi-sélection avec création à la
volée), statut, archivé.

**Onglet « Médias »** : affiche (recadrage 2:3), image de fond (16:9),
bande-annonce (URL + aperçu embarqué), galerie inline réordonnable.

**Onglet « Casting »** : liste réordonnable — nom, rôle, photo (après F2) ;
en v1, liste simple de chaînes conforme au champ `cast` json.

**Onglet « Séances »** : liste des projections du film (passées et à venir),
bouton « Programmer une séance » qui pré-remplit le film, statut et remplissage
de chaque séance.

**Onglet « Statistiques »** : vues, courbe 30 j, séances programmées, total
d'inscriptions, taux de remplissage moyen, position dans le top.

### `/cinematheque/projections/calendrier` — Calendrier ⭐

Interface centrale du module.

```
┌─────────────────────────────────────────────────────────────────┐
│  ‹ Août 2026 ›     [Mois][Semaine][Jour][Liste]   [+ Programmer]│
│  Filtres : [Lieu ▾] [Genre ▾] [Statut ▾]                        │
├──────┬──────┬──────┬──────┬──────┬──────┬──────┐               │
│ Lun  │ Mar  │ Mer  │ Jeu  │ Ven  │ Sam  │ Dim  │               │
├──────┼──────┼──────┼──────┼──────┼──────┼──────┤               │
│      │      │      │      │      │  1   │  2   │               │
│      │      │      │      │      │▌18:00│▌16:00│               │
│      │      │      │      │      │ Damier│ Viva │               │
│      │      │      │      │      │ 45/60 │ 12/60│               │
├──────┼──────┼──────┼──────┼──────┼──────┼──────┤               │
│  3   │  4   │  5   │  6   │  7   │  8   │  9   │               │
│      │      │▌19:00│      │      │▌18:00│      │               │
│      │      │ Kin…  │      │      │ COMPLET│     │               │
└──────┴──────┴──────┴──────┴──────┴──────┴──────┘               │
   ▌ vert = à venir   ▌ gris = passée   ▌ rouge = annulée         │
```

- Clic sur une case vide → modale de création pré-remplie (date)
- Clic sur une séance → panneau latéral de détail avec édition rapide
- Glisser-déposer d'une séance pour la replanifier (avec confirmation)
- Badge de remplissage sur chaque séance (`x/y` ou « COMPLET »)
- Export ICS du planning

### `/cinematheque/projections` — Liste

Filtres : film, période, lieu, statut (à venir / passée / annulée / masquée),
gratuit/payant, remplissage. Colonnes : Date · Heure · Film · Lieu · Type ·
Places · Remplissage (barre) · Inscriptions · Statut · Actions.
Actions : Éditer · Dupliquer · Voir les inscrits · Annuler · Masquer · Supprimer.

### `/cinematheque/projections/:id` — Fiche séance

Informations (film en autocomplete avec affiche, date, heures, lieu,
description), Billetterie (gratuit/payant, prix, capacité totale, places prises
en lecture seule calculée), Visibilité (visible, en vedette, annulée avec motif),
Inscriptions (tableau des inscrits, export CSV, envoi d'un e-mail groupé),
Statistiques (vues, conversion vue → inscription).

### `/cinematheque/genres`, `/cinematheque/inscriptions`, `/cinematheque/statistiques`, `/cinematheque/reglages`

- **Genres** : tableau réordonnable, création en modale, comptage de films.
- **Inscriptions** : voir [§10](#10-module-réservations--inscriptions).
- **Statistiques** : KPI, courbes, top films, top séances, remplissage moyen,
  fréquentation par jour/créneau, exports.
- **Réglages** : URL de billetterie externe (`CinemathequeSettings.bookingUrl`),
  avec aide contextuelle expliquant le comportement gratuit/payant du site.

---

# 9. Module Événements

> ⚠️ Le projet comporte **deux notions d'événement distinctes** :
> `Event` (section *Contenu*, `ROLE_CONTENT`) et `Program`
> (section *Action culturelle*, `ROLE_ACTION_CULTURELLE`).
> Le Dashboard doit les présenter clairement pour éviter la confusion des
> utilisateurs — un rapprochement des deux modèles est à envisager (§19.4).

## 9.1 `Event` — Événements de la page Contenu

### Modèle

`slug` (unique), `title`, `description` (text), `coverImage`, `location`,
`category` (**string libre**, pas d'entité), `organizer`, `startTime` /
`endTime` (**chaînes**, pas des heures typées), `featured`, `startsAt` /
`endsAt` (datetime), `status`, `publishedAt`, `createdAt`, `updatedAt`.

### Existant

- CRUD `EventCrudController`, tri par `startsAt` décroissant
- Upload de l'image de couverture
- API publique : `GET /api/content/events`, `GET /api/content/events/{slug}`
  (pagination 12 par page)

### Manques

| # | Manque | Priorité |
|---|---|---|
| E1 | API admin | 🔴 P0 |
| E2 | **Catégories d'événements en entité** (aujourd'hui texte libre → doublons et fautes de frappe) | 🔴 P0 |
| E3 | Heures typées (`startTime`/`endTime` sont des `string`) | 🟠 P1 |
| E4 | **Aucune inscription/réservation possible** sur `Event` (contrairement à `Program`) | 🔴 P0 |
| E5 | Vue calendrier | 🟠 P1 |
| E6 | Comptage des vues (pas de table `event_views`) | 🟠 P1 |
| E7 | Événements récurrents | 🟡 P2 |
| E8 | Galerie d'images | 🟡 P2 |
| E9 | Rattachement à un `Space` (comme `Program`) | 🟠 P1 |
| E10 | Champs SEO | 🟠 P1 |
| E11 | Export ICS / ajout au calendrier | 🟡 P2 |

## 9.2 `Program` — Programmes de l'action culturelle

### Modèle

`slug`, `title`, `category` (`ProgramCategory`), `organizer`, `externalUrl`,
`slogan`, `description`, `objectif`, `publicVise`, `impact`, `coverImage`,
`discipline`, `period`, `location`, `startsAt` / `endsAt`, `isFree`,
`space` (`ManyToOne(Space)`), `featured`, `scope` (enum `ProgramScope` :
`interne` / `externe`), `position`, `status`, `publishedAt`, galerie
(`ProgramGalleryImage`).

`ProgramCategory` : `slug`, `title`, `description`, `coverImage`,
`colorGradient` (classe Tailwind), `position`, `status`.

### Existant

- **Deux CRUD filtrés** sur la même entité : `InternalProgramCrudController`
  (`scope = interne`) et `ExternalProgramCrudController` (`scope = externe`)
- Galerie via CRUD séparé + action globale
- **Inscriptions gratuites** : `POST /api/content/programs/{slug}/register`
  → `ProgramRegistration` + notification e-mail à l'adresse du centre
  (refus 400 si le programme est payant)
- API publique : `GET /api/content/programs` (filtres `category`, `featured`,
  `scope`), `/programs/{slug}`, `/program-categories`

### Manques

| # | Manque | Priorité |
|---|---|---|
| G1 | API admin | 🔴 P0 |
| G2 | Gestion inline de la galerie | 🔴 P0 |
| G3 | Capacité maximale et clôture automatique des inscriptions | 🟠 P1 |
| G4 | E-mail de confirmation **à l'inscrit** (seul le centre est notifié) | 🔴 P0 |
| G5 | Vue calendrier | 🟠 P1 |
| G6 | Comptage des vues | 🟠 P1 |
| G7 | Programmes récurrents / sessions multiples | 🟡 P2 |
| G8 | Réordonnancement par glisser-déposer (`position`) | 🟠 P1 |
| G9 | Champs SEO | 🟠 P1 |

## 9.3 Pages frontend

### `/contenu/evenements` — Liste des événements

Filtres : recherche, statut, catégorie, période (à venir / passés /
personnalisée), à la une, lieu. Colonnes : Image · Titre · Catégorie ·
Date & heure · Lieu · Organisateur · Statut · À la une · Actions.
Bascule vers `/contenu/evenements/calendrier` (vue mois avec les événements et,
en superposition optionnelle, les programmes et projections).

### `/contenu/evenements/:id` — Fiche événement

Onglets : *Informations* (titre, slug, description riche, catégorie, lieu,
organisateur, espace) · *Dates* (début, fin, heures, journée entière,
récurrence) · *Média* (couverture, galerie) · *Inscriptions* (après E4) ·
*SEO*. Panneau latéral : publication, à la une, aperçu.

### `/action-culturelle/programmes` — Liste des programmes

Onglets « Internes » / « Externes » / « Tous » (filtre sur `scope`).
Filtres : recherche, rubrique, discipline, période, gratuit/payant, espace,
à la une, statut. Colonnes : Image · Titre · Rubrique · Scope · Période ·
Lieu/Espace · Gratuit · Inscriptions · Statut · Ordre (glisser-déposer) ·
Actions.

### `/action-culturelle/programmes/:id` — Fiche programme

Onglets : *Informations* (titre, slug, slogan, rubrique, discipline,
organisateur, URL externe, scope) · *Contenu* (description, objectif, public
visé, impact — tous en éditeur riche) · *Planification* (période texte, dates,
lieu, espace rattaché) · *Média* (couverture + galerie inline) ·
*Inscriptions* (tableau, export, e-mail groupé) · *SEO*.

### `/action-culturelle/rubriques` — Rubriques

Tableau réordonnable : Image · Titre · Slug · Dégradé (aperçu du gradient
Tailwind) · Programmes · Statut · Ordre · Actions. Sélecteur visuel de dégradé.

---

# 10. Module Réservations & Inscriptions

## 10.1 État des lieux

Le backend ne comporte **pas de système de réservation payante**. Il gère deux
types d'inscriptions gratuites, structurellement identiques, plus une
redirection vers une billetterie externe.

| Cas | Entité | Endpoint public | Comportement |
|---|---|---|---|
| Événement culturel gratuit | `ProgramRegistration` | `POST /api/content/programs/{slug}/register` | Refusé (400) si `isFree = false` |
| Séance de cinéma gratuite | `ScreeningRegistration` | `POST /api/cinematheque/screenings/{id}/register` | Formulaire d'inscription |
| Séance de cinéma payante | — | — | Redirection vers `CinemathequeSettings.bookingUrl` (site tiers) |
| Réservation d'espace | — | — | Redirection vers `Space.bookingUrl` / `Space.quoteRequestUrl` |
| Don | `Donation` | `POST /api/fundraising/donations` | Paiement Makuta (module distinct) |

### Modèle commun des inscriptions

| Champ | Type | Notes |
|---|---|---|
| `program` / `screening` | FK requise, CASCADE | Objet concerné |
| `firstName`, `lastName` | string(120) | Requis |
| `email` | string(180) | Requis, mis en minuscules |
| `phone` | string(40), nullable | |
| `numberOfSeats` | int, nullable | Nombre de places |
| `message` | text, nullable | Message libre |
| `isRead` | bool | Marqueur de traitement |
| `createdAt` | datetime | |

**Traitement actuel** : validation Symfony, persistance, envoi d'un e-mail de
notification **au centre** (`MAILER_FROM_ADDRESS`) avec `Reply-To` sur
l'inscrit. En cas d'échec d'envoi, l'inscription est conservée et un
avertissement est journalisé. Administration : `ProgramRegistrationCrudController`
et `ScreeningRegistrationCrudController`, en **lecture + marquage lu**
(création manuelle désactivée).

## 10.2 Manques

| # | Manque | Impact | Priorité |
|---|---|---|---|
| R1 | API admin des inscriptions | Bloquant | 🔴 P0 |
| R2 | **E-mail de confirmation à l'inscrit** | L'inscrit n'a aucune trace | 🔴 P0 |
| R3 | Décrément/incrément automatique de `capacityTaken` | Compteur manuel, faux | 🔴 P0 |
| R4 | Statut d'inscription (`pending`/`confirmed`/`cancelled`/`attended`/`no_show`) | Pas de cycle de vie | 🔴 P0 |
| R5 | Contrôle de capacité au moment de l'inscription | Surbooking possible | 🔴 P0 |
| R6 | Anti-doublon (même e-mail sur la même séance) | Données polluées | 🟠 P1 |
| R7 | Annulation par l'inscrit (lien signé) | Charge administrative | 🟠 P1 |
| R8 | Liste d'attente | Perte d'opportunité | 🟠 P1 |
| R9 | Rappel automatique J-1 | Taux de présence | 🟠 P1 |
| R10 | Export CSV/Excel des inscrits | Feuille d'émargement | 🔴 P0 |
| R11 | Pointage des présences | Mesure de fréquentation réelle | 🟠 P1 |
| R12 | Billet + QR code | Contrôle d'accès | 🟡 P2 |
| R13 | Inscription pour `Event` | Fonctionnalité absente | 🔴 P0 |
| R14 | Demande de réservation d'espace en interne | Aujourd'hui : lien externe | 🟡 P2 |
| R15 | Billetterie payante intégrée | Aujourd'hui : redirection | 🟡 P2 |
| R16 | Consentement RGPD et durée de conservation | Conformité | 🟠 P1 |

## 10.3 Gestion

### `/reservations` — Vue unifiée (proposée)

Page transverse regroupant toutes les inscriptions, avec filtre par type
(programme / séance / événement). Accessible aux rôles concernés, chacun ne
voyant que son périmètre.

- **KPI** : inscriptions totales · non lues · places réservées · à venir 7 j ·
  taux de présence
- **Filtres** : type, objet concerné (autocomplete), période d'inscription,
  période de l'événement, statut, lu/non lu, recherche (nom, e-mail, téléphone)
- **Colonnes** : ☑ · Reçue le · Type (badge) · Objet · Nom · E-mail ·
  Téléphone · Places · Statut · Lu · Actions
- **Actions par ligne** : Voir le détail · Confirmer · Annuler · Marquer présent ·
  Marquer lu/non lu · Envoyer un e-mail · Supprimer
- **Actions groupées** : marquer lu · confirmer · annuler · exporter · envoyer
  un e-mail groupé
- **Lignes surlignées** : non lues en gras avec pastille

### `/reservations/:id` — Détail

Panneau latéral : coordonnées complètes, objet (avec lien vers la fiche),
nombre de places, message, historique des statuts, journal des e-mails envoyés.
Actions : confirmer, annuler (avec motif et e-mail automatique), marquer présent,
répondre par e-mail (gabarit pré-rempli).

### Validation & workflow cible

```
   [Inscription en ligne]
            │
            ▼
      ┌───────────┐   capacité disponible ?
      │ pending   │──── non ──► [liste d'attente]
      └─────┬─────┘
            │ oui (auto ou manuel selon réglage)
            ▼
      ┌───────────┐   e-mail de confirmation + billet
      │ confirmed │
      └─────┬─────┘
            │
    ┌───────┴────────┐
    ▼                ▼
┌─────────┐    ┌───────────┐
│attended │    │ no_show   │   (pointage le jour J)
└─────────┘    └───────────┘
       ▲
       │ annulation (inscrit ou admin) → cancelled
       │ → libère une place → promotion depuis la liste d'attente
```

### Historique et statistiques

- **Historique** : conservation de toutes les inscriptions, archivage au-delà de
  la date de l'événement, purge configurable (RGPD, ex. 24 mois).
- **Statistiques** :
  - inscriptions par période (courbe), par objet (top 10)
  - taux de remplissage moyen par séance / programme
  - taux de présence (`attended / confirmed`)
  - taux d'annulation et de no-show
  - délai moyen entre l'inscription et l'événement
  - nombre moyen de places par inscription
  - récurrence des participants (mêmes e-mails sur plusieurs événements)
  - conversion vue → inscription (croisement avec `screening_views`)
- **Exports** : CSV, Excel, PDF (feuille d'émargement avec cases à cocher et
  espace de signature).

---

# 11. Module Newsletter & Communication

> Section absente du cahier des charges initial mais **présente et active dans le
> backend** : elle doit figurer au Dashboard. Rôle `ROLE_CONTENT`.
> Entités : `NewsletterSubscriber`, `Actualite` · Services : `NewsletterImporter`,
> `NewsletterMailer`

## 11.1 Existant

### Abonnés (`newsletter_subscribers`)

`email` (180), `name` (120, nullable), `isActive` (bool), `source` (50 :
`site`, `import`…), `createdAt`, `unsubscribedAt`.

- CRUD `NewsletterSubscriberCrudController` avec 3 actions globales :
  **Importer CSV**, **Exporter (CSV/Excel)**, **Envoyer une campagne**
- Inscription publique idempotente : `POST /api/content/newsletter/subscribe`
  (réactive un abonné désinscrit)
- **Import CSV** : `/admin/newsletter/import` — CSRF, retour
  `créés / mis à jour / ignorés`, journalisé (`newsletter.import`)
- **Export CSV** : `/admin/newsletter/export` — `StreamedResponse`, séparateur
  `;`, BOM UTF-8 (compatibilité Excel), colonnes
  `email, nom, actif, source, inscrit_le`
- **Campagne** : `/admin/newsletter/campaign` — sujet + corps, envoi à tous les
  abonnés actifs, retour `envoyés / échecs / total`, journalisé
  (`newsletter.campaign`)

### Newsletters publiées (`actualites`)

`Actualite` porte un enum `ActualiteType` (`ARTICLE` / `NEWSLETTER`), un
`coverImage`, un **`pdf`** (upload PDF 20 Mo max), `mois`, `annee`, `summary`,
`content`, `isFeatured`, `status`, `publishedAt`. Exposée publiquement par
`GET /api/content/actualites?type=NEWSLETTER`.

## 11.2 Manques

| # | Manque | Priorité |
|---|---|---|
| C1 | API admin newsletter | 🔴 P0 |
| C2 | **Historique des campagnes** (aucune entité `Campaign` — seul l'audit garde une trace) | 🔴 P0 |
| C3 | Gabarits d'e-mail réutilisables | 🟠 P1 |
| C4 | Éditeur d'e-mail visuel (aujourd'hui : texte brut dans un formulaire) | 🟠 P1 |
| C5 | Envoi de test à soi-même avant campagne | 🔴 P0 |
| C6 | Statistiques d'ouverture et de clic | 🟠 P1 |
| C7 | Lien de désabonnement dans les e-mails + endpoint public | 🔴 P0 (conformité) |
| C8 | Segmentation (par source, par date, par intérêt) | 🟠 P1 |
| C9 | Planification d'envoi | 🟠 P1 |
| C10 | Envoi par lots avec file d'attente (risque de timeout sur grand volume) | 🟠 P1 |
| C11 | Double opt-in | 🟡 P2 |
| C12 | Gestion des rebonds (bounces) | 🟡 P2 |

## 11.3 Pages frontend

| Page | Contenu |
|---|---|
| `/newsletter/abonnes` | KPI (actifs, désinscrits, croissance 30 j, taux de désabonnement) · Filtres (statut, source, période) · Tableau (E-mail, Nom, Statut, Source, Inscrit le, Actions) · Actions groupées (désactiver, réactiver, exporter, supprimer) · Boutons Importer / Exporter / Nouvelle campagne |
| `/newsletter/import` | Zone de dépôt CSV · Aperçu des 10 premières lignes · Mappage des colonnes · Options (mise à jour des existants, source à appliquer) · Résultat détaillé (créés/mis à jour/ignorés + lignes en erreur téléchargeables) |
| `/newsletter/campagnes` | Historique : Sujet · Envoyée le · Destinataires · Envoyés · Échecs · Taux d'ouverture · Actions (Voir, Dupliquer) |
| `/newsletter/campagnes/nouvelle` | Éditeur en 3 étapes : **1. Destinataires** (tous les actifs / segment / sélection) → **2. Contenu** (sujet, gabarit, éditeur riche, aperçu desktop/mobile, envoi de test) → **3. Récapitulatif & envoi** (nombre de destinataires, envoi immédiat ou planifié, confirmation) |

---

# 12. Module Utilisateurs

> Rôle `ROLE_SUPER_ADMIN` · Entités : `User`, `ApiToken`, `AuditLog`

## 12.1 Existant

### `User` (table `users`)

| Champ | Type | Notes |
|---|---|---|
| `id` | int | PK |
| `email` | string(180) | Identifiant de connexion |
| `name` | string(100) | Nom affiché |
| `roles` | json | Tableau de rôles |
| `password` | string | Haché (`auto` → bcrypt/argon2) |
| `isActive` | bool | Compte actif |
| `createdBy` | string(180), nullable | E-mail du créateur |
| `createdAt` | datetime | |
| `lastLoginAt` | datetime, nullable | Mis à jour par `LoginListener` et à la connexion API |
| `plainPassword` | non mappé | Saisie de formulaire |

### `ApiToken` (table `api_tokens`)

`user` (FK CASCADE), `tokenHash` (64, unique — **le jeton en clair n'est jamais
stocké**), `label`, `createdAt`, `lastUsedAt`, `expiresAt`. Créé par
`ApiToken::createFor()`, validé par `ApiTokenHandler` (firewall `admin_api`).
TTL par défaut à la connexion : **7 jours**.

### `AuditLog` (table `audit_logs`)

`action` (80), `performedBy` (180), `entityType`, `entityId`, `summary`,
`details` (json), `ip` (45), `createdAt`. Écrit par `AuditLogger`, qui
**n'échoue jamais** l'action métier appelante. Consultable en lecture seule
(`AuditLogCrudController`), filtres sur action / auteur / date.

### Fonctionnalités

| Fonctionnalité | Où |
|---|---|
| CRUD utilisateurs | `UserCrudController` (super-admin) |
| Attribution des rôles | Cases à cocher multiples, rendues en badges |
| Hachage du mot de passe | `persistEntity` / `updateEntity` |
| Journalisation | `user.create`, `user.update` |
| Connexion web | Formulaire `/login`, CSRF, session |
| Connexion API | `POST /api/admin/login` → jeton Bearer 7 j, **limiteur de débit** (`limiter.login_limiter`), message d'erreur générique, échecs journalisés (`login.api.failed`) |
| API utilisateurs | `GET/POST /api/admin/users`, `PATCH /api/admin/users/{id}` (super-admin) |
| Garde-fous | Interdiction de modifier ses propres rôles / de se désactiver |
| Création en ligne de commande | `php bin/console app:admin:create --role=…` |
| Génération de jeton | `php bin/console app:admin:token` |

## 12.2 Manques

| # | Manque | Priorité |
|---|---|---|
| U1 | **Rôles de section non attribuables via API** (`ALLOWED_ROLES` limité à `ADMIN`/`SUPER_ADMIN`) | 🔴 P0 |
| U2 | Endpoint `PATCH /api/admin/me` (édition de son propre profil) | 🔴 P0 |
| U3 | Réinitialisation de mot de passe par e-mail | 🔴 P0 |
| U4 | Gestion des jetons API depuis l'interface (liste, création, révocation) | 🔴 P0 |
| U5 | Avatar / photo de profil | 🟠 P1 |
| U6 | Politique de mot de passe renforcée (aujourd'hui : 8 caractères minimum) | 🟠 P1 |
| U7 | Authentification à deux facteurs (TOTP) | 🟠 P1 |
| U8 | Invitation par e-mail (plutôt que mot de passe défini par l'admin) | 🟠 P1 |
| U9 | Historique de connexion détaillé (IP, appareil, localisation) | 🟠 P1 |
| U10 | Verrouillage après N échecs de connexion | 🟠 P1 |
| U11 | Suppression logique (`deletedAt`) au lieu de la suppression physique | 🟠 P1 |
| U12 | Notifications par e-mail configurables par utilisateur | 🟡 P2 |
| U13 | Export du journal d'audit (CSV/PDF) | 🟠 P1 |
| U14 | Purge/rotation du journal d'audit | 🟡 P2 |

## 12.3 Pages frontend

### `/systeme/utilisateurs` — Liste

KPI : comptes totaux · actifs · connectés 7 j · jetons actifs.
Filtres : recherche (nom, e-mail), rôle, statut, dernière connexion.
Colonnes : Avatar · Nom · E-mail · Rôles (badges) · Statut · Dernière connexion ·
Créé le · Créé par · Actions.
Actions : Éditer · Voir l'activité · Réinitialiser le mot de passe · Désactiver ·
Supprimer. Ligne grisée si `isActive = false`.

### `/systeme/utilisateurs/:id` — Fiche

Onglets :
- **Profil** : nom, e-mail, statut, mot de passe (réinitialisation)
- **Rôles & permissions** : sélection des rôles avec description de chacun et
  **aperçu en direct des sections accessibles** (rendu de la matrice §3.3)
- **Activité** : journal d'audit filtré sur cet utilisateur, connexions récentes
- **Jetons API** : liste (label, créé le, dernière utilisation, expiration),
  création (le jeton en clair n'est montré **qu'une fois**), révocation

### `/systeme/roles` — Matrice des permissions

Tableau lecture seule reprenant §3.3, avec la hiérarchie affichée en arbre, le
nombre d'utilisateurs par rôle, et un simulateur « Que voit un
`ROLE_CINEMATHEQUE` ? » qui grise les entrées de menu inaccessibles.

### `/systeme/audit` — Journal d'audit

Filtres : action (liste des valeurs distinctes), auteur, type d'entité, période,
IP, recherche plein texte sur le résumé.
Colonnes : Date · Action (badge coloré) · Auteur · Résumé · Type · ID cible · IP.
Détail en panneau latéral avec le JSON `details` mis en forme.
Exports CSV/PDF. Graphique d'activité par jour et par utilisateur.

### `/systeme/jetons-api` — Jetons

Tableau : Label · Utilisateur · Créé le · Dernière utilisation · Expire le ·
Statut (actif / expiré). Création (choix de l'utilisateur, label, durée) et
révocation. Alerte sur les jetons inutilisés depuis 90 jours.

---

# 13. Module SEO

> ⚠️ **Aucun champ SEO n'existe dans le backend.** Ni `metaTitle`, ni
> `metaDescription`, ni Open Graph, ni sitemap, ni `robots.txt` généré, ni
> redirections. Ce module est intégralement à créer.

## 13.1 État des lieux

| Élément SEO | État actuel |
|---|---|
| Slugs propres | ✅ Présents sur tous les contenus (uniques, générés depuis le titre) |
| Titres | ✅ `title` / `name` exploitables comme titre par défaut |
| Descriptions | ⚠️ `excerpt`, `summary`, `shortDescription` réutilisables par défaut |
| Images de couverture | ✅ Présentes (réutilisables en `og:image`) |
| Meta title / description dédiés | ❌ |
| Open Graph / Twitter Cards | ❌ |
| URL canonique | ❌ |
| `noindex` / `nofollow` | ❌ |
| Sitemap XML | ❌ |
| `robots.txt` | ❌ |
| Données structurées (JSON-LD) | ❌ |
| Redirections 301 | ❌ (changer un slug casse l'URL existante) |
| Suivi des 404 | ❌ |

## 13.2 Modèle proposé

### Trait / embeddable `SeoMetadata`

À appliquer à `Article`, `Actualite`, `Event`, `Program`, `ProgramCategory`,
`Film`, `Space`, `AudioTrack` :

| Champ | Type | Défaut |
|---|---|---|
| `metaTitle` | string(70), nullable | `title` |
| `metaDescription` | string(180), nullable | `excerpt` / `summary` tronqué |
| `metaKeywords` | string(255), nullable | — |
| `ogTitle` | string(95), nullable | `metaTitle` |
| `ogDescription` | string(200), nullable | `metaDescription` |
| `ogImage` | string(255), nullable | `coverImage` |
| `canonicalUrl` | string(500), nullable | URL calculée |
| `noIndex` | bool | `false` |
| `noFollow` | bool | `false` |
| `structuredData` | json, nullable | JSON-LD personnalisé |

### Entité `Redirect` (table `redirects`)

`id`, `source` (500, unique), `destination` (500), `statusCode` (301/302/410),
`isActive`, `hitCount`, `lastHitAt`, `createdAt`, `note`.

### Entité `SeoSettings` (singleton, table `seo_settings`)

`siteName`, `titleTemplate` (ex. `%s | Grand Tambour`), `defaultDescription`,
`defaultOgImage`, `twitterHandle`, `facebookAppId`, `googleSiteVerification`,
`bingSiteVerification`, `robotsTxt` (text), `sitemapEnabled`,
`sitemapChangeFreq`, `analyticsId`.

### Endpoints à créer

| Méthode | Route | Description |
|---|---|---|
| GET | `/sitemap.xml` | Sitemap principal (index) |
| GET | `/sitemap-{type}.xml` | Sitemaps par type (articles, films, événements…) |
| GET | `/robots.txt` | Généré depuis `SeoSettings` |
| GET | `/api/admin/seo/overview` | Score global, contenus incomplets |
| GET/PATCH | `/api/admin/seo/settings` | Réglages globaux |
| GET/POST/PATCH/DELETE | `/api/admin/seo/redirects` | Redirections |
| GET | `/api/admin/seo/audit` | Analyse : titres trop longs, descriptions manquantes, doublons, images sans `alt` |

## 13.3 Pages frontend

### `/seo/vue-ensemble`

- **Score SEO global** (jauge 0–100) : % de contenus publiés disposant d'un meta
  title, d'une meta description, d'une image OG et d'un `alt` sur les images
- Cartes de problèmes : « 23 contenus sans meta description », « 8 titres > 70
  caractères », « 12 descriptions dupliquées », « 45 images sans texte
  alternatif », « 5 slugs modifiés sans redirection »
- Chaque carte mène à la liste filtrée des contenus concernés

### `/seo/metadonnees`

Tableau transverse tous types confondus : Type · Titre · URL · Meta title
(longueur avec code couleur) · Meta description (longueur) · Image OG · Indexé ·
Score. Édition en ligne ou en panneau latéral, avec **aperçu Google** et
**aperçu carte sociale** en direct. Actions groupées : générer automatiquement
les métadonnées manquantes depuis le contenu.

### `/seo/redirections`

Tableau : Source · Destination · Code · Actif · Hits · Dernier hit · Actions.
Création manuelle, import CSV, **détection automatique** (proposer une
redirection quand un slug publié est modifié), test d'une URL.

### `/seo/sitemap`

Liste des sitemaps générés (type, nombre d'URL, dernière génération), bouton
« Régénérer », inclusion/exclusion par type, fréquence de changement et priorité
par type, éditeur de `robots.txt` avec validation, liens de soumission vers
Google Search Console et Bing Webmaster.

### Composant `SeoPanel`

Onglet réutilisable dans **tous** les formulaires de contenu : champs SEO,
compteurs de caractères colorés (vert/orange/rouge), aperçu Google, aperçu
Facebook/Twitter, bouton « Générer automatiquement », alerte de doublon.

---

# 14. Module Paramètres

> ⚠️ Le backend ne dispose que de **deux entités de réglages**, toutes deux
> spécifiques à une page : `CinemathequeSettings` (1 champ) et
> `SpacesPageSettings` (4 champs). **Aucun paramètre global** n'existe : le nom
> du site, les coordonnées, les réseaux sociaux, les menus et le footer sont
> codés en dur dans le frontend Next.js.

## 14.1 Existant

### `CinemathequeSettings` (singleton, `id = 1`)

| Champ | Usage |
|---|---|
| `bookingUrl` (500) | URL de billetterie externe pour les séances payantes |

Administré via `/admin/cinematheque-settings` (formulaire Symfony,
`ROLE_CINEMATHEQUE`), pattern `getOrCreate()` garantissant l'existence de la
ligne.

### `SpacesPageSettings` (singleton, `id = 1`)

| Champ | Usage |
|---|---|
| `heroKicker` | Sur-titre du hero |
| `heroTitle` | Titre (défaut « Les Espaces du Grand Tambour ») |
| `introText` | Texte d'introduction |
| `heroBackgroundImage` | Visuel de fond (upload `hero-espaces-{timestamp}.{ext}`) |

Administré via `/admin/espaces-settings` (`ROLE_ESPACES`), exposé par
`GET /api/espaces/settings`.

### Paramètres hors base de données

| Paramètre | Emplacement | Remarque |
|---|---|---|
| Objectif de collecte | `CAMPAIGN_GOAL_USD` (`.env`) → `campaign.goal_usd` | Modifiable uniquement par déploiement |
| Expéditeur des e-mails | `MAILER_FROM_ADDRESS`, `MAILER_FROM_NAME` | idem |
| DSN mailer | `MAILER_DSN` | idem |
| Origines CORS | `CORS_ALLOW_ORIGIN` | idem |
| URL publique | `APP_PUBLIC_URL`, `DEFAULT_URI` | idem |
| Identifiants Makuta | `MAKUTA_*` (5 variables + clé privée RSA) | Sensible |
| Lien « Voir le site » | Codé en dur (`https://centreculturel.cd/`) dans `DashboardController` | À externaliser |

## 14.2 Modèle proposé

### Entité `SiteSettings` (singleton) ou table clé/valeur `settings`

> **Recommandation** : table clé/valeur typée
> (`key`, `value` json, `group`, `type`, `label`, `description`, `isPublic`)
> plutôt qu'une entité à 40 colonnes — plus souple et extensible.

**Groupe « Général »** : `site.name`, `site.tagline`, `site.description`,
`site.logo`, `site.logoDark`, `site.favicon`, `site.url`, `site.timezone`
(`Africa/Kinshasa`), `site.locale`, `site.currency`, `site.maintenanceMode`,
`site.maintenanceMessage`.

**Groupe « Contact »** : `contact.email`, `contact.phone`, `contact.address`,
`contact.city`, `contact.country`, `contact.mapLat`, `contact.mapLng`,
`contact.openingHours` (json).

**Groupe « Réseaux sociaux »** : `social.facebook`, `social.instagram`,
`social.twitter`, `social.youtube`, `social.linkedin`, `social.tiktok`,
`social.whatsapp`, `social.showInHeader`, `social.showInFooter`.

**Groupe « Collecte »** : `campaign.goalUsd` (migration depuis `.env`),
`campaign.isActive`, `campaign.endDate`, `campaign.showProgress`,
`campaign.thankYouMessage`.

**Groupe « E-mails »** : `mail.fromName`, `mail.fromAddress`, `mail.replyTo`,
`mail.notificationRecipients` (json), `mail.footerText`, `mail.logoUrl`.

**Groupe « Intégrations »** : `analytics.googleId`, `analytics.matomoUrl`,
`integrations.mercureEnabled`, `integrations.recaptchaSiteKey`.

### Entité `MenuItem` (table `menu_items`)

`id`, `menu` (enum : `header` / `footer_col1` / `footer_col2` / `footer_col3` /
`mobile`), `label`, `url`, `target` (`_self`/`_blank`), `icon`, `parent`
(auto-référence pour les sous-menus), `position`, `isActive`, `requiresRole`
(nullable), `entityType` + `entityId` (lien dynamique vers un contenu).

### Entité `SystemPage` (table `system_pages`)

`slug` (unique : `mentions-legales`, `politique-confidentialite`,
`conditions-utilisation`, `a-propos`, `faq`, `404`, `500`, `maintenance`),
`title`, `content` (text riche), `status`, `metaTitle`, `metaDescription`,
`updatedAt`, `updatedBy`.

## 14.3 Pages frontend

| Page | Contenu |
|---|---|
| `/parametres/general` | Identité (nom, slogan, description, logo clair/sombre, favicon), localisation (fuseau, langue, devise), mode maintenance (interrupteur + message + IP autorisées) |
| `/parametres/contact` | E-mail, téléphone, adresse, carte (sélecteur de coordonnées), horaires d'ouverture (grille par jour) |
| `/parametres/reseaux-sociaux` | Un champ URL par réseau avec icône et validation de format, aperçu de la barre sociale, options d'affichage header/footer |
| `/parametres/menus` | Deux colonnes : liste des menus disponibles à gauche, éditeur d'arborescence par glisser-déposer à droite (2 niveaux), ajout d'un lien libre ou d'un lien vers un contenu existant (autocomplete), aperçu du rendu |
| `/parametres/footer` | Colonnes du footer (titre + liens), texte de copyright, logos partenaires, bloc newsletter (activation + texte) |
| `/parametres/pages-systeme` | Liste des pages système, édition en éditeur riche, aperçu, statut, dernière modification |
| `/parametres/emails` | Expéditeur, destinataires de notification, gabarits (réinitialisation de mot de passe, confirmation d'inscription, reçu de don, campagne), variables disponibles, envoi de test |
| `/parametres/collecte` | Objectif, devise, dates de campagne, affichage de la progression, message de remerciement, paliers de contribution |
| `/parametres/integrations` | Makuta (environnement, identifiants masqués, test de connexion), analytics, reCAPTCHA, Mercure |
| `/parametres/cinematheque` | URL de billetterie (existant) |
| `/parametres/espaces` | Hero de la page Espaces (existant) |

**Comportements transverses** : enregistrement par section (pas de « tout ou
rien »), bandeau « Modifications non enregistrées », bouton « Réinitialiser aux
valeurs par défaut » par section, journalisation de chaque changement dans
l'audit (`settings.update` avec l'ancienne et la nouvelle valeur), masquage des
secrets (affichage `••••`, révélation sur action explicite, jamais renvoyés en
clair par l'API).

---

# 15. Module Statistiques Globales

## 15.1 Architecture de reporting proposée

```
┌──────────────────────────────────────────────────────────────┐
│  SÉLECTEUR GLOBAL                                            │
│  Période : [Aujourd'hui][7 j][30 j][12 mois][Personnalisé]   │
│  Comparaison : [Période précédente ▾]   Granularité : [Jour ▾]│
├──────────────────────────────────────────────────────────────┤
│  ONGLETS : Vue d'ensemble · Trafic · Contenus · Cinémathèque │
│            · Événements · Collecte · Utilisateurs            │
└──────────────────────────────────────────────────────────────┘
```

Toute page de statistiques expose : export **CSV / Excel / PDF**, impression,
et un lien de partage conservant les filtres.

## 15.2 Trafic

### Vues par période

| Granularité | Source | Disponibilité |
|---|---|---|
| **Jour** | `ArticleViewRepository::dailyCounts(n)`, idem films et projections | ✅ (limité à `n` jours passés en paramètre) |
| **Semaine** | Agrégation `YEARWEEK(viewed_at)` | ⚠️ Requête à créer |
| **Mois** | Agrégation `DATE_FORMAT(viewed_at, '%Y-%m')` | ⚠️ Requête à créer |
| **Année** | Agrégation `YEAR(viewed_at)` | ⚠️ Requête à créer |

### Indicateurs

| Indicateur | Calcul | Disponibilité |
|---|---|---|
| Vues totales | Somme des trois tables `*_views` | ✅ |
| Visiteurs uniques | `COUNT(DISTINCT ip_hash)` | ✅ (donnée présente, requête à écrire) |
| Vues par visiteur | Vues / uniques | ✅ |
| Nouveaux vs récurrents | Première apparition d'un `ip_hash` | ⚠️ Requête à créer |
| Pic d'affluence | `MAX` par heure | ⚠️ Requête à créer |
| Répartition horaire | `GROUP BY HOUR(viewed_at)` | ⚠️ |
| Répartition par jour de semaine | `GROUP BY DAYOFWEEK(viewed_at)` | ⚠️ |
| Sources de trafic | — | ❌ `referer` non stocké |
| Appareils / navigateurs | — | ❌ `user_agent` non stocké |
| Géolocalisation | — | ❌ (IP hachée, non réversible — nécessiterait de stocker le pays au moment de la vue) |

> **Note de conformité** : le hachage des IP (`SHA-256(ip + APP_SECRET)`) est une
> bonne pratique RGPD. Toute extension (referer, user-agent, pays) doit rester
> anonyme et être documentée dans la politique de confidentialité.

### Widgets

- Courbe multi-séries avec comparaison à la période précédente (trait pointillé)
- Cartes KPI avec variation en %
- Heatmap jour × heure
- Tableau des pages les plus consultées, tous types confondus

## 15.3 Contenus

| Widget | Description | Source |
|---|---|---|
| **Contenus les plus consultés** | Top 20 tous types, avec type, vues, évolution | `findMostViewed()` × 3 |
| **Contenus les plus populaires** | Score composite : vues + commentaires + partages + inscriptions | Calcul à créer |
| **Production éditoriale** | Publications par mois et par type (barres empilées) | `GROUP BY MONTH(published_at)` |
| **Répartition par statut** | Publiés / brouillons par type (donut) | `GROUP BY status` |
| **Performance par catégorie** | Vues moyennes par rubrique | Jointures |
| **Performance par auteur** | Articles publiés et vues par auteur | Nécessite M4 (auteur relationnel) |
| **Contenus dormants** | Publiés depuis > 90 j avec < 10 vues | Requête à créer |
| **Meilleur moment de publication** | Vues moyennes selon le jour/heure de publication | Requête à créer |
| **Vitesse d'acquisition** | Vues cumulées J+1, J+7, J+30 après publication | Requête à créer |

## 15.4 Cinémathèque

| Widget | Description | Disponibilité |
|---|---|---|
| Fréquentation (inscriptions) | Courbe des inscriptions par période | ⚠️ À créer |
| Places réservées | `SUM(number_of_seats)` par période | ⚠️ |
| Taux de remplissage moyen | `AVG(capacity_taken / capacity_total)` | ⚠️ (dépend de R3) |
| Popularité des films | Top 10 par vues, par séances programmées, par inscriptions | ✅ / ⚠️ |
| Popularité par genre | Vues et inscriptions agrégées par `FilmCategory` | ⚠️ |
| Séances par mois | Barres | ⚠️ |
| Meilleurs créneaux | Remplissage moyen par jour de semaine et par heure | ⚠️ |
| Taux d'annulation | `is_cancelled / total` | ⚠️ |
| Conversion vue → inscription | `registrations / screening_views` | ⚠️ |
| Recettes estimées | `SUM(price × capacity_taken)` | ⚠️ |
| Films jamais programmés | Films publiés sans `Screening` | ⚠️ |

## 15.5 Événements & programmes

| Widget | Description |
|---|---|
| Participation | Inscriptions par événement / programme (top 10) |
| Places réservées | Total et moyenne par inscription |
| Taux de présence | `attended / confirmed` (après R4/R11) |
| Événements par rubrique | Répartition |
| Événements par scope | Interne vs externe |
| Calendrier de charge | Heatmap du nombre d'événements par jour |
| Participants récurrents | E-mails présents sur ≥ 2 événements |
| Délai moyen d'inscription | Jours entre inscription et événement |
| Taux d'annulation | Après R4 |

## 15.6 Collecte

| Widget | Source | Disponibilité |
|---|---|---|
| Montant collecté / objectif | `campaignStats()` + `campaign.goal_usd` | ✅ |
| Progression cumulée | Série sur `confirmed_at` | ⚠️ |
| Nombre de dons par statut | `statusBreakdown()` | ✅ |
| Taux de succès | Calculé | ✅ |
| Don moyen / médian | Calcul sur `amount` | ⚠️ |
| Répartition par opérateur | `paidByOperator()` | ✅ |
| Répartition par palier | `GROUP BY tier` | ⚠️ |
| Donateurs uniques / récurrents | `COUNT(donors)`, dons par donateur | ⚠️ |
| Dons en l'honneur d'un tiers | `donor_type != 'self'` | ⚠️ |
| Délai moyen de confirmation | `confirmed_at - created_at` | ⚠️ |
| Taux d'échec par opérateur | Croisement statut × opérateur | ⚠️ |
| Dons bloqués | `pending` depuis > 60 min | ✅ (`findStalePending`) |

## 15.7 Utilisateurs & système

| Widget | Source |
|---|---|
| Connexions par jour | `audit_logs` action `login.api` |
| Utilisateurs actifs | `last_login_at` sur la période |
| Actions par utilisateur | `audit_logs GROUP BY performed_by` |
| Répartition des actions | `GROUP BY action` |
| Échecs de connexion | `login.api.failed` — **alerte de sécurité si pic** |
| Comptes inactifs | `last_login_at` > 90 j |
| Volume de stockage | `SUM(media_assets.size)` + croissance mensuelle |

## 15.8 Générateur de rapports

Page `/pilotage/rapports` permettant de composer un rapport personnalisé :

1. **Choix des modules** (cases à cocher : trafic, contenus, cinémathèque,
   événements, collecte)
2. **Période** et comparaison
3. **Format** : PDF (mis en page, avec logo et graphiques), Excel (une feuille
   par module), CSV (données brutes)
4. **Options** : inclure les graphiques, inclure les tableaux détaillés,
   commentaire libre d'introduction
5. **Envoi** : téléchargement immédiat ou envoi par e-mail
6. **Récurrence** (v2) : rapport mensuel automatique envoyé à une liste de
   destinataires — utile pour les bailleurs et le conseil d'administration

### Endpoints de statistiques à créer

| Méthode | Route | Description |
|---|---|---|
| GET | `/api/admin/stats/overview?from&to&compare` | KPI transverses |
| GET | `/api/admin/stats/traffic?from&to&granularity&types[]` | Séries de trafic |
| GET | `/api/admin/stats/content?from&to` | Statistiques de contenus |
| GET | `/api/admin/stats/cinematheque?from&to` | Cinémathèque |
| GET | `/api/admin/stats/events?from&to` | Événements et programmes |
| GET | `/api/admin/stats/donations?from&to` | Collecte |
| GET | `/api/admin/stats/users?from&to` | Utilisateurs |
| GET | `/api/admin/stats/top?type&metric&limit` | Classements |
| POST | `/api/admin/reports` | Génération d'un rapport |
| GET | `/api/admin/reports/{id}/download` | Téléchargement |

**Performance** : ces requêtes agrègent des tables de vues qui grossissent vite.
Prévoir des index (`viewed_at`, `article_id + viewed_at`), un cache applicatif
(Redis est disponible : `ext-redis` déclaré dans `composer.json`) avec TTL de
5 à 15 min, et à terme une table d'agrégats quotidiens
(`daily_stats(date, type, entity_id, views, uniques)`) alimentée par une tâche
planifiée.

---

# 16. Design System du Dashboard

## 16.1 Fondations

### Palette

La couleur d'accent du projet est le **cuivre `#CD935B`**, déjà utilisée dans les
e-mails transactionnels (`ContentApiController::contactEmailHtml`). Le design
system la reprend comme couleur primaire.

| Jeton | Clair | Sombre | Usage |
|---|---|---|---|
| `--color-primary` | `#CD935B` | `#D9A876` | Actions principales, accent |
| `--color-primary-hover` | `#B87F49` | `#E0B68C` | Survol |
| `--color-primary-subtle` | `#FAF3EC` | `#3A2E22` | Fonds d'accent |
| `--color-bg` | `#FFFFFF` | `#0F1115` | Fond de page |
| `--color-surface` | `#FFFFFF` | `#181B21` | Cartes, panneaux |
| `--color-surface-alt` | `#F7F8FA` | `#1F232B` | Fonds secondaires, en-têtes de tableau |
| `--color-border` | `#E4E7EC` | `#2C313A` | Bordures, séparateurs |
| `--color-text` | `#101828` | `#ECEFF4` | Texte principal |
| `--color-text-muted` | `#667085` | `#98A2B3` | Texte secondaire |
| `--color-success` | `#12B76A` | `#32D583` | Publié, confirmé, don payé |
| `--color-warning` | `#F79009` | `#FDB022` | En attente, alerte |
| `--color-danger` | `#F04438` | `#F97066` | Erreur, suppression, annulation |
| `--color-info` | `#2E90FA` | `#53B1FD` | Information, brouillon |

Contraste minimum **AA (4.5:1)** pour le texte, **3:1** pour les éléments
d'interface. Ne jamais coder l'information par la couleur seule : toujours
associer une icône ou un libellé.

### Typographie

| Rôle | Police | Taille / interlignage | Graisse |
|---|---|---|---|
| Display | Inter | 32 / 40 | 600 |
| H1 (titre de page) | Inter | 24 / 32 | 600 |
| H2 (section) | Inter | 20 / 28 | 600 |
| H3 (carte) | Inter | 16 / 24 | 600 |
| Corps | Inter | 14 / 20 | 400 |
| Petit / légende | Inter | 12 / 16 | 400 |
| Chiffres KPI | Inter (tabular-nums) | 30 / 38 | 700 |
| Monospace | JetBrains Mono | 13 / 20 | 400 |

### Espacement, rayons, ombres

- Grille de base **4 px** : `4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48 · 64`
- Rayons : `sm 4px` (badges) · `md 8px` (boutons, champs) · `lg 12px` (cartes) ·
  `xl 16px` (modales) · `full` (pastilles, avatars)
- Ombres : `sm` (cartes au repos) · `md` (survol, popovers) · `lg` (modales,
  drawers) — jamais d'ombre en thème sombre, préférer un fond plus clair
- Densité : mode **confortable** (lignes 56 px) et **compact** (lignes 40 px),
  au choix de l'utilisateur

### Grille & conteneurs

- Conteneur maximal : 1440 px, centré, padding latéral 24 px (16 px en mobile)
- Grille 12 colonnes, gouttière 24 px
- KPI : 4 colonnes (desktop) / 3 / 2 / 1
- Formulaire riche : 8 colonnes de contenu + 4 colonnes de panneau latéral

## 16.2 Cartes KPI

```
┌──────────────────────────────────┐
│ 📄 Articles publiés          ⋯  │   ← libellé + icône + menu
│                                  │
│  128        ▲ 12,5 %             │   ← valeur + variation
│             vs 30 j préc.        │
│  ╱‾╲╱‾‾╲╱╲__╱‾╲                 │   ← sparkline 14 points
└──────────────────────────────────┘
```

**Variantes** : neutre · succès (vert) · alerte (orange) · danger (rouge) ·
avec objectif (barre de progression) · comparative (2 valeurs).
**États** : chargement (squelette animé) · vide (« — » + « Aucune donnée ») ·
erreur (icône + « Indisponible »).
**Interaction** : la carte entière est cliquable vers la liste filtrée
correspondante ; le menu « ⋯ » permet « Voir le détail », « Exporter »,
« Épingler à l'accueil ».

## 16.3 Tableaux

**Anatomie** : barre d'outils (recherche, filtres, actions groupées, sélecteur
de colonnes, densité, export) → en-tête collant → lignes → pied (pagination,
compteur).

| Caractéristique | Spécification |
|---|---|
| Tri | Clic sur l'en-tête, indicateur ▲▼, tri multiple avec `⇧` |
| Sélection | Case en première colonne, « tout sélectionner » avec état indéterminé, barre d'actions groupées flottante indiquant le nombre sélectionné |
| Colonnes | Réordonnables, masquables, largeur ajustable, préférences persistées |
| Première colonne | Collante en défilement horizontal |
| Ligne | Survol coloré, clic → détail, double-clic → édition |
| Actions | 2 actions rapides en icône + menu « ⋯ » pour le reste |
| Pagination | 25/50/100, saut à une page, total affiché |
| États | Chargement (5 lignes squelettes) · Vide (illustration + CTA) · Erreur (message + réessayer) · Filtré sans résultat (« Aucun résultat pour ces filtres » + « Réinitialiser ») |
| Mobile | Bascule automatique en cartes empilées (libellé + valeur) |
| Accessibilité | `<table>` sémantique, `scope`, navigation clavier, annonce du tri |

## 16.4 Graphiques

| Type | Usage | Règles |
|---|---|---|
| **Courbe** | Séries temporelles (trafic, publications, collecte) | Max 4 séries, points au survol, ligne de comparaison en pointillé |
| **Aire** | Volume cumulé | Dégradé subtil, une seule série de préférence |
| **Barres verticales** | Comparaison par période | Espacement 40 % de la largeur de barre |
| **Barres empilées** | Composition par période | Max 5 segments, ordre stable |
| **Barres horizontales** | Classements (top 10) | Libellés à gauche, valeurs à droite |
| **Donut** | Répartition | Max 6 segments (+ « Autres »), total au centre |
| **Jauge** | Progression vers un objectif | Valeur, objectif, % |
| **Heatmap** | Densité jour × heure | Échelle séquentielle monochrome |
| **Sparkline** | Tendance dans une carte | Sans axes, sans légende |
| **Barre de progression** | Remplissage d'une séance | Couleur selon le seuil (vert < 70 %, orange < 90 %, rouge ≥ 90 %) |

**Règles transverses** : palette catégorielle de 6 teintes distinctes en clair et
en sombre, valeurs formatées selon la locale `fr-FR`, axes allégés (pas de
quadrillage vertical), légende cliquable, tooltip riche (date, série, valeur,
variation), état vide explicite, export PNG/SVG/CSV, animation d'entrée ≤ 400 ms
et désactivée si `prefers-reduced-motion`.

## 16.5 Filtres

| Composant | Usage |
|---|---|
| `SearchInput` | Recherche débouncée 300 ms, bouton d'effacement, icône de chargement |
| `SelectFilter` | Liste déroulante simple, avec « Tous » |
| `MultiSelectFilter` | Sélection multiple avec pastilles et compteur |
| `DateRangeFilter` | Raccourcis (Aujourd'hui, 7 j, 30 j, Ce mois, Mois dernier, 12 mois) + calendrier double |
| `StatusFilter` | Groupe de boutons segmentés |
| `ToggleFilter` | Interrupteur (À la une, Non lus, Archivés) |
| `FilterChips` | Filtres actifs affichés en pastilles supprimables |
| `SavedFilters` | Enregistrement d'une combinaison de filtres sous un nom |

**Comportements** : synchronisation systématique avec l'URL (query string),
bouton « Réinitialiser » dès qu'un filtre est actif, compteur de résultats mis à
jour en direct, filtres repliés dans un drawer en mobile.

## 16.6 Calendriers

| Composant | Usage |
|---|---|
| `CalendarMonth` | Vue mois — projections, événements, programmes |
| `CalendarWeek` | Vue semaine avec créneaux horaires |
| `CalendarDay` | Vue jour détaillée |
| `CalendarAgenda` | Liste chronologique (par défaut en mobile) |
| `DatePicker` | Sélection de date unique |
| `DateTimePicker` | Date + heure |
| `DateRangePicker` | Plage de dates |
| `TimePicker` | Heure seule (`widget: single_text` côté Symfony) |

**Spécifications de la vue calendrier** : navigation ‹ › + « Aujourd'hui »,
sélecteur de vue, filtres superposables (type d'événement, lieu, statut), code
couleur par type, badge de remplissage, création par clic sur une case,
replanification par glisser-déposer avec confirmation, panneau latéral de
détail, export ICS, impression.

## 16.7 Widgets du tableau de bord

| Widget | Description |
|---|---|
| `KpiGrid` | Grille de cartes KPI responsive |
| `ChartCard` | Carte contenant un graphique, avec titre, sélecteur de période et menu d'export |
| `ActivityFeed` | Flux d'activité avec avatars, groupement par jour, chargement infini |
| `TaskList` | Liste « À traiter » avec compteurs et liens profonds |
| `UpcomingList` | Prochains événements / séances avec date, image et remplissage |
| `TopList` | Classement (rang, libellé, valeur, barre de progression relative) |
| `QuickActions` | Grille de boutons d'accès rapide (Nouvel article, Programmer une séance…) |
| `HealthStatus` | État des services (API, base, mailer, Makuta, stockage) avec pastilles |
| `WelcomeCard` | Message d'accueil personnalisé + raccourcis du rôle |

**Personnalisation (v2)** : réorganisation des widgets par glisser-déposer,
masquage, disposition mémorisée par utilisateur.

## 16.8 Modales, drawers et notifications

| Composant | Usage | Règles |
|---|---|---|
| `Modal` | Formulaire court, confirmation | Largeurs sm 400 / md 560 / lg 720 / xl 960 px, fermeture par `Échap` et clic sur l'arrière-plan (sauf formulaire sale), focus piégé, restitution du focus à la fermeture |
| `Drawer` | Détail contextuel, filtres mobiles | Latéral droit 480 px, superposition en mobile |
| `ConfirmDialog` | Action destructive | Titre explicite, conséquences détaillées, bouton danger, saisie du nom exigée pour les suppressions critiques |
| `Toast` | Retour d'action | Position bas-droite, durée 4 s (erreurs persistantes), max 3 empilés, action « Annuler » sur les suppressions |
| `Banner` | Message global | Maintenance, quota atteint, version disponible |
| `InlineAlert` | Message contextuel dans un formulaire | 4 sévérités |
| `Popover` | Notifications, profil, aide | Ancré, fermeture au clic extérieur |
| `Tooltip` | Aide brève | Délai 400 ms, jamais porteur d'information essentielle |

## 16.9 Formulaires

- **Disposition** : une colonne par défaut, libellé au-dessus du champ, aide en
  dessous, message d'erreur en remplacement de l'aide.
- **Champs obligatoires** marqués `*`, champs optionnels explicitement indiqués
  lorsque la majorité est obligatoire.
- **Validation** : à la sortie du champ (blur) puis à la soumission ; résumé des
  erreurs en haut avec ancres cliquables ; onglets porteurs d'erreur signalés
  par une pastille rouge.
- **Actions** : barre collante en bas (« Annuler » secondaire, action primaire à
  droite), désactivée pendant l'envoi avec indicateur de chargement.
- **Enregistrement automatique** des brouillons toutes les 30 s, avec indicateur.
- **Contraintes reprises du backend** : upload 20 Mo max, images JPG/PNG/WebP,
  PDF `application/pdf`, mot de passe ≥ 8 caractères, e-mail normalisé en
  minuscules, slugs uniques.

## 16.10 Iconographie et illustrations

- Bibliothèque cohérente avec l'existant EasyAdmin (**Font Awesome 6** ou
  équivalent Lucide), trait 1,5 px, taille 16/20/24 px.
- Icônes de modules réutilisant celles du menu Symfony : `chart-line`,
  `hand-holding-heart`, `users`, `images`, `envelope-open-text`,
  `calendar-days`, `photo-film`, `handshake`, `inbox`, `masks-theater`,
  `layer-group`, `user-check`, `newspaper`, `tags`, `comments`,
  `chart-column`, `film`, `clapperboard`, `gear`, `door-open`,
  `user-shield`, `clipboard-list`.
- Illustrations d'états vides : jeu cohérent, ton sobre, une par grande famille
  (contenu, recherche, erreur, accès refusé).

## 16.11 Accessibilité et internationalisation

- **WCAG 2.1 niveau AA** visé : contrastes, navigation clavier complète,
  focus visible (anneau 2 px), rôles ARIA, annonces des changements dynamiques
  (`aria-live`), libellés de formulaire associés.
- **Cible clavier/tactile** : 44 × 44 px minimum.
- **Mouvement réduit** respecté (`prefers-reduced-motion`).
- **Langue** : français par défaut (`translation.yaml` fixe la locale `fr`).
  Prévoir dès la conception l'externalisation des chaînes (i18n) pour un
  éventuel anglais/lingala.
- **Formats** : dates `dd/MM/yyyy`, heures 24 h, décimales à la virgule,
  séparateur de milliers = espace insécable, devises `USD` (dons) et `FC`
  (billetterie cinéma), fuseau `Africa/Kinshasa`.

---

# 17. Pages Frontend à développer

## 17.1 Légende

**Priorité** — 🔴 **P0** : indispensable au lancement (MVP) · 🟠 **P1** :
version 1.1 · 🟡 **P2** : évolution ultérieure
**Statut** — ❌ À créer · ⚠️ Backend partiel (endpoint à développer) ·
✅ Backend prêt

## 17.2 Tableau récapitulatif

| Module | Page | Priorité | Statut |
|---|---|---|---|
| **Transverse** | `/login` — Connexion (jeton Bearer) | 🔴 P0 | ✅ `POST /api/admin/login` |
| Transverse | `/mot-de-passe-oublie` — Réinitialisation | 🟠 P1 | ❌ Backend à créer |
| Transverse | `/` — Vue d'ensemble (accueil adaptatif) | 🔴 P0 | ⚠️ Stats collecte seules |
| Transverse | Shell (sidebar, topbar, breadcrumbs) | 🔴 P0 | ✅ |
| Transverse | Recherche globale `⌘K` | 🟠 P1 | ❌ Endpoint à créer |
| Transverse | `/notifications` — Centre de notifications | 🟠 P1 | ❌ Entité + endpoints |
| Transverse | `/aide` — Centre d'aide | 🟡 P2 | ✅ (statique) |
| Transverse | `/403`, `/404`, `/500` — Pages d'erreur | 🔴 P0 | ✅ |
| **Profil** | `/profil` — Mon profil | 🔴 P0 | ⚠️ `PATCH /api/admin/me` à créer |
| Profil | `/profil/securite` — Mot de passe & jetons | 🟠 P1 | ⚠️ Endpoints jetons à créer |
| Profil | `/profil/activite` — Mon activité | 🟡 P2 | ⚠️ Filtre audit à exposer |
| Profil | `/profil/preferences` — Préférences | 🟡 P2 | ❌ Stockage à créer |
| **Pilotage** | `/pilotage/statistiques` — Statistiques globales | 🟠 P1 | ⚠️ Endpoints stats à créer |
| Pilotage | `/pilotage/activite` — Flux d'activité | 🟠 P1 | ⚠️ Audit incomplet |
| Pilotage | `/pilotage/rapports` — Générateur de rapports | 🟡 P2 | ❌ |
| **Collecte** | `/collecte` — Tableau de bord de la collecte | 🔴 P0 | ✅ `GET /api/admin/stats` |
| Collecte | `/collecte/dons` — Liste des dons | 🔴 P0 | ✅ `GET /api/admin/donations` |
| Collecte | `/collecte/dons/:reference` — Détail d'un don | 🔴 P0 | ✅ `GET /api/admin/donations/{ref}` |
| Collecte | `/collecte/donateurs` — Liste des donateurs | 🟠 P1 | ❌ Endpoint à créer |
| Collecte | `/collecte/donateurs/:id` — Fiche donateur | 🟠 P1 | ❌ |
| Collecte | `/collecte/rapports` — Exports comptables | 🟠 P1 | ❌ |
| **Contenu** | `/contenu/hero` — Diapositives d'accueil | 🔴 P0 | ❌ API admin |
| Contenu | `/contenu/hero/nouveau` · `/:id` | 🔴 P0 | ❌ |
| Contenu | `/contenu/actualites` — Actualités & newsletters | 🔴 P0 | ❌ |
| Contenu | `/contenu/actualites/nouveau` · `/:id` | 🔴 P0 | ❌ |
| Contenu | `/contenu/evenements` — Événements | 🔴 P0 | ❌ |
| Contenu | `/contenu/evenements/nouveau` · `/:id` | 🔴 P0 | ❌ |
| Contenu | `/contenu/evenements/calendrier` | 🟠 P1 | ❌ |
| Contenu | `/contenu/medias` — Bibliothèque média | 🔴 P0 | ❌ API upload/liste |
| Contenu | `/contenu/medias/:id` — Détail d'un média | 🔴 P0 | ❌ |
| Contenu | `/contenu/partenaires` · `/:id` | 🟠 P1 | ❌ |
| Contenu | `/contenu/messages` — Messages de contact | 🔴 P0 | ❌ |
| Contenu | `/contenu/messages/:id` — Détail | 🔴 P0 | ❌ |
| **Action culturelle** | `/action-culturelle/programmes` — Liste (onglets interne/externe) | 🔴 P0 | ❌ |
| Action culturelle | `/action-culturelle/programmes/nouveau` · `/:id` | 🔴 P0 | ❌ |
| Action culturelle | `/action-culturelle/rubriques` · `/:id` | 🟠 P1 | ❌ |
| Action culturelle | `/action-culturelle/inscriptions` | 🔴 P0 | ❌ |
| **Presse** | `/presse/articles` — Liste | 🔴 P0 | ❌ |
| Presse | `/presse/articles/nouveau` · `/:id` | 🔴 P0 | ❌ |
| Presse | `/presse/articles/:id/apercu` — Prévisualisation | 🟠 P1 | ❌ Preview signée |
| Presse | `/presse/categories` | 🟠 P1 | ❌ |
| Presse | `/presse/commentaires` — Modération | 🔴 P0 | ❌ |
| Presse | `/presse/audios` — Bibliothèque audio | 🟠 P1 | ❌ **Module entier** |
| Presse | `/presse/audios/nouveau` — Upload | 🟠 P1 | ❌ |
| Presse | `/presse/audios/:id` — Détail | 🟠 P1 | ❌ |
| Presse | `/presse/audios/statistiques` | 🟡 P2 | ❌ |
| Presse | `/presse/statistiques` — Statistiques de lecture | 🟠 P1 | ⚠️ Données présentes, API à exposer |
| **Cinémathèque** | `/cinematheque/films` — Catalogue | 🔴 P0 | ❌ |
| Cinémathèque | `/cinematheque/films/nouveau` · `/:id` | 🔴 P0 | ❌ |
| Cinémathèque | `/cinematheque/genres` | 🟠 P1 | ❌ |
| Cinémathèque | `/cinematheque/projections` — Liste | 🔴 P0 | ❌ |
| Cinémathèque | `/cinematheque/projections/calendrier` ⭐ | 🔴 P0 | ❌ |
| Cinémathèque | `/cinematheque/projections/nouveau` · `/:id` | 🔴 P0 | ❌ |
| Cinémathèque | `/cinematheque/inscriptions` | 🔴 P0 | ❌ |
| Cinémathèque | `/cinematheque/statistiques` | 🟠 P1 | ⚠️ Données présentes |
| Cinémathèque | `/cinematheque/reglages` — Billetterie | 🟠 P1 | ⚠️ Formulaire Symfony existant |
| **Espaces** | `/espaces/liste` · `/nouveau` · `/:id` | 🟠 P1 | ❌ |
| Espaces | `/espaces/types` | 🟡 P2 | ❌ |
| Espaces | `/espaces/reglages` — Hero de page | 🟡 P2 | ⚠️ Formulaire Symfony existant |
| **Newsletter** | `/newsletter/abonnes` | 🔴 P0 | ❌ |
| Newsletter | `/newsletter/import` — Import CSV | 🟠 P1 | ⚠️ Route Symfony existante |
| Newsletter | `/newsletter/campagnes` — Historique | 🟠 P1 | ❌ Entité `Campaign` à créer |
| Newsletter | `/newsletter/campagnes/nouvelle` — Composition | 🟠 P1 | ⚠️ Envoi existant, éditeur à créer |
| **Réservations** | `/reservations` — Vue unifiée | 🟠 P1 | ❌ |
| Réservations | `/reservations/:id` — Détail | 🟠 P1 | ❌ |
| **SEO** | `/seo/vue-ensemble` | 🟡 P2 | ❌ **Module entier** |
| SEO | `/seo/metadonnees` | 🟡 P2 | ❌ |
| SEO | `/seo/redirections` | 🟡 P2 | ❌ |
| SEO | `/seo/sitemap` | 🟡 P2 | ❌ |
| **Paramètres** | `/parametres/general` | 🟠 P1 | ❌ |
| Paramètres | `/parametres/contact` | 🟠 P1 | ❌ |
| Paramètres | `/parametres/reseaux-sociaux` | 🟠 P1 | ❌ |
| Paramètres | `/parametres/menus` | 🟡 P2 | ❌ |
| Paramètres | `/parametres/footer` | 🟡 P2 | ❌ |
| Paramètres | `/parametres/pages-systeme` | 🟡 P2 | ❌ |
| Paramètres | `/parametres/emails` | 🟡 P2 | ❌ |
| Paramètres | `/parametres/collecte` | 🟠 P1 | ⚠️ Aujourd'hui dans `.env` |
| Paramètres | `/parametres/integrations` | 🟡 P2 | ❌ |
| **Système** | `/systeme/utilisateurs` — Liste | 🔴 P0 | ✅ `GET /api/admin/users` |
| Système | `/systeme/utilisateurs/nouveau` | 🔴 P0 | ✅ `POST /api/admin/users` |
| Système | `/systeme/utilisateurs/:id` — Fiche | 🔴 P0 | ⚠️ `PATCH` OK, rôles de section bloqués |
| Système | `/systeme/roles` — Matrice des permissions | 🟡 P2 | ✅ (statique) |
| Système | `/systeme/jetons-api` | 🟠 P1 | ❌ |
| Système | `/systeme/audit` — Journal d'audit | 🟠 P1 | ❌ Endpoint à créer |
| Système | `/systeme/sante` — État des services | 🟡 P2 | ❌ |

### Synthèse

| Priorité | Nombre de pages | Backend prêt | Backend partiel | Backend à créer |
|---|---|---|---|---|
| 🔴 **P0** | **34** | 6 | 4 | 24 |
| 🟠 **P1** | **28** | 1 | 6 | 21 |
| 🟡 **P2** | **20** | 2 | 1 | 17 |
| **Total** | **82** | **9** | **11** | **62** |

## 17.3 Lotissement proposé

| Lot | Contenu | Prérequis backend | Durée estimée |
|---|---|---|---|
| **Lot 0 — Socle** | Shell, authentification, routage, design system, composants de base (`DataTable`, `FilterBar`, `StatCard`, `MediaPicker`) | Aucun (API login existante) | 3 semaines |
| **Lot 1 — Collecte & Utilisateurs** | Tableau de bord collecte, dons, donateurs, utilisateurs | Endpoints donateurs + rôles de section via API | 2 semaines |
| **Lot 2 — API admin éditoriale** | *(backend)* CRUD JSON pour articles, actualités, événements, programmes, films, projections, médias | — | 4 semaines |
| **Lot 3 — Contenu & Presse** | Articles, catégories, commentaires, actualités, événements, hero, médias, messages | Lot 2 | 4 semaines |
| **Lot 4 — Cinémathèque** | Films, genres, projections, **calendrier**, inscriptions, réglages | Lot 2 + capacité auto | 3 semaines |
| **Lot 5 — Action culturelle & Espaces** | Programmes, rubriques, inscriptions, espaces, galeries inline | Lot 2 | 2 semaines |
| **Lot 6 — Statistiques** | Endpoints d'agrégation, pages de statistiques, exports | Requêtes + cache Redis | 3 semaines |
| **Lot 7 — Audio** | Entités, upload, lecteur, statistiques d'écoute | Module backend complet | 2 semaines |
| **Lot 8 — Newsletter & Réservations** | Campagnes, historique, vue unifiée des inscriptions | Entité `Campaign`, statuts d'inscription | 2 semaines |
| **Lot 9 — Paramètres & SEO** | Réglages globaux, menus, pages système, SEO, sitemap | Entités `Setting`, `MenuItem`, `SystemPage`, `Redirect` | 3 semaines |

---

# 18. Modules complémentaires existants

Ces modules ne figuraient pas dans le cahier des charges initial mais sont
**actifs en production** et doivent être couverts par le Dashboard.

## 18.1 Module Collecte de dons (Makuta)

Cœur historique du projet, seul module déjà doté d'une API admin.

### Modèle

**`Donation`** : `donor` (FK `RESTRICT`), `reference` (unique, format
`GT-DON-2026-XXXXXX`), `makutaTransactionId`, `tier` (enum `ContributionTier`),
`operator` (enum `PaymentOperator`), `amount` (decimal 12,2), `currency`
(`USD`), `status` (`pending` / `paid` / `failed` / `expired`), `redirectUrl`,
`callbackPayload` (json — audit du webhook), `message`, `donorType`
(`self` / autre), `beneficiaryName` / `beneficiaryEmail` /
`beneficiaryMessage` (don en l'honneur d'un tiers), `createdAt`, `confirmedAt`.

**`Donor`** : `name`, `email` (unique), `phone`, `createdAt`, dons associés.

### Services et flux

- `MakutaClient` : dialogue HTTP avec la passerelle (environnement, identifiants,
  extension)
- `MakutaSignatureService` : signature RSA des requêtes (clé privée via chemin
  ou PEM en variable d'environnement)
- `DonationService` : orchestration de la création et du suivi
- `DonationReferenceGenerator` : génération de la référence
- `ReceiptMailer` : reçu de don + e-mail « en l'honneur de »
  (`templates/emails/donation_receipt.html.twig`, `donation_honor.html.twig`)
- `WebhookController` : `POST /api/fundraising/webhooks/makuta`
- `PaymentReturnController` : `/api/fundraising/paiement/retour`
- Commandes : `app:donations:expire`, `app:donations:reconcile`,
  `app:donations:receipt`, `app:makuta:test`

### Interfaces dashboard

| Page | Contenu |
|---|---|
| `/collecte` | Jauge objectif/collecté, KPI (collecté, dons, taux de succès, don moyen), courbe cumulée, donuts (statut, opérateur), 10 derniers dons, alertes (dons bloqués) |
| `/collecte/dons` | Filtres (statut, opérateur, palier, période, montant, recherche par référence/e-mail), colonnes (Référence, Date, Donateur, Montant, Palier, Opérateur, Statut, Confirmé le), exports |
| `/collecte/dons/:reference` | Détail complet, chronologie du paiement, coordonnées du donateur, bénéficiaire éventuel, payload de callback en JSON formaté, actions (renvoyer le reçu, réconcilier, marquer expiré) |
| `/collecte/donateurs` | Liste avec nombre de dons et total cumulé, recherche |
| `/collecte/donateurs/:id` | Fiche + historique des dons + total + segment (ponctuel/récurrent) |
| `/collecte/rapports` | Export comptable par période, ventilation par opérateur et palier, format PDF/Excel |

> **Contrainte** : `DonationCrudController` désactive création, édition et
> suppression — le Dashboard doit rester **en lecture seule** sur les dons, sauf
> actions métier explicites (renvoi de reçu, réconciliation) exposées par des
> endpoints dédiés.

## 18.2 Module Espaces

`Space` : `slug`, `name`, `shortDescription`, `fullDescription`, `category`
(`SpaceCategory`), `coverImage`, `capacity`, `surfaceM2`, `seatedCapacity`,
`standingCapacity`, 6 booléens d'équipement (`hasPmrAccess`,
`hasAirConditioning`, `hasSoundSystem`, `hasProfessionalLighting`, `hasWifi`,
`hasParking`), `usageConditions`, `isBookable`, `bookingUrl`,
`quoteRequestUrl`, `contactName` / `contactEmail` / `contactPhone`, `isActive`,
`position`, galerie.

`SpaceCategory` : `slug`, `name`, `icon` (défaut `building`), `position`.
`SpacesPageSettings` : hero de la page (voir §14.1).

API publique : `GET /api/espaces/spaces`, `/spaces/{slug}`, `/categories`,
`/settings`.

**Pages** : liste (grille de cartes avec photo, capacité, équipements en
icônes), fiche à onglets (*Informations · Équipements & capacités · Galerie ·
Réservation & contact*), types d'espaces, réglages de page.
**Manques** : API admin, galerie inline, demandes de réservation internes,
planning d'occupation croisé avec les programmes rattachés (`Program.space`).

## 18.3 Module Partenaires

`Partner` : `name`, `logo`, `url`, `position`, `isActive`.
API publique : `GET /api/content/partners`.
**Page** : grille de logos réordonnable par glisser-déposer, activation en un
clic, édition en modale. Simple mais à ne pas oublier.

## 18.4 Module Messages de contact

`ContactMessage` : `firstName`, `lastName`, `email`, `phone`, `subject`,
`message`, `isRead`, `createdAt`.
Réception : `POST /api/content/contact` → persistance + e-mail au centre avec
`Reply-To` sur l'expéditeur (HTML aux couleurs du site).
**Page** : boîte de réception (liste + panneau de lecture), filtres (lu/non lu,
sujet, période), actions (marquer lu, répondre par e-mail, archiver, supprimer),
badge de non-lus dans la sidebar.
**Manques** : API admin, réponse depuis l'interface avec historique, catégories
de sujet, assignation à un membre de l'équipe, statut de traitement.

## 18.5 Module Hero de la page d'accueil

`HomeHeroSlide` : `title`, `subtitle`, `description`, `buttonText`,
`buttonLink`, `image`, `position`, `status`, `publishedAt`.
API publique : `GET /api/content/home-hero-slides`.
**Page** : liste réordonnable par glisser-déposer avec **aperçu en direct** du
rendu du carrousel, édition en panneau latéral, publication/dépublication en un
clic. Recadrage guidé (format large 21:9 recommandé).

---

# 19. Annexes techniques

## 19.1 Inventaire des entités

| # | Entité | Table | Module | Administrée |
|---|---|---|---|---|
| 1 | `Actualite` | `actualites` | Contenu | ✅ CRUD |
| 2 | `ApiToken` | `api_tokens` | Système | ❌ CLI seulement |
| 3 | `Article` | `articles` | Presse | ✅ CRUD |
| 4 | `ArticleCategory` | `article_categories` | Presse | ✅ CRUD |
| 5 | `ArticleView` | `article_views` | Presse (stats) | ❌ automatique |
| 6 | `AuditLog` | `audit_logs` | Système | ✅ lecture seule |
| 7 | `CinemathequeSettings` | `cinematheque_settings` | Cinémathèque | ✅ formulaire |
| 8 | `Comment` | `comments` | Presse | ✅ CRUD |
| 9 | `ContactMessage` | `contact_messages` | Contenu | ✅ lecture + lu |
| 10 | `Donation` | `donations` | Collecte | ✅ lecture seule |
| 11 | `Donor` | `donors` | Collecte | ✅ lecture + édition |
| 12 | `Event` | `events` | Contenu | ✅ CRUD |
| 13 | `Film` | `films` | Cinémathèque | ✅ CRUD |
| 14 | `FilmCategory` | `film_categories` | Cinémathèque | ✅ CRUD |
| 15 | `FilmGalleryImage` | `film_gallery_images` | Cinémathèque | ✅ CRUD séparé |
| 16 | `FilmView` | `film_views` | Cinémathèque (stats) | ❌ automatique |
| 17 | `HomeHeroSlide` | `home_hero_slides` | Contenu | ✅ CRUD |
| 18 | `MediaAsset` | `media_assets` | Contenu | ✅ CRUD |
| 19 | `NewsletterSubscriber` | `newsletter_subscribers` | Contenu | ✅ CRUD + outils |
| 20 | `Partner` | `partners` | Contenu | ✅ CRUD |
| 21 | `Program` | `programs` | Action culturelle | ✅ 2 CRUD filtrés |
| 22 | `ProgramCategory` | `program_categories` | Action culturelle | ✅ CRUD |
| 23 | `ProgramGalleryImage` | `program_gallery_images` | Action culturelle | ✅ CRUD séparé |
| 24 | `ProgramRegistration` | `program_registrations` | Action culturelle | ✅ lecture + lu |
| 25 | `Screening` | `screenings` | Cinémathèque | ✅ CRUD |
| 26 | `ScreeningRegistration` | `screening_registrations` | Cinémathèque | ✅ lecture + lu |
| 27 | `ScreeningView` | `screening_views` | Cinémathèque (stats) | ❌ automatique |
| 28 | `Space` | `spaces` | Espaces | ✅ CRUD |
| 29 | `SpaceCategory` | `space_categories` | Espaces | ✅ CRUD |
| 30 | `SpaceGalleryImage` | `space_gallery_images` | Espaces | ✅ CRUD séparé |
| 31 | `SpacesPageSettings` | `spaces_page_settings` | Espaces | ✅ formulaire |
| 32 | `User` | `users` | Système | ✅ CRUD |

### Énumérations

| Enum | Valeurs | Utilisée par |
|---|---|---|
| `ContentStatus` | `DRAFT`, `PUBLISHED` | Article, Actualite, Event, Program, ProgramCategory, Film, HomeHeroSlide |
| `ActualiteType` | `ARTICLE`, `NEWSLETTER` | Actualite |
| `ProgramScope` | `interne`, `externe` | Program |
| `ScreeningStatus` | statut calculé de la séance | Screening |
| `CommentAuthorRole` | `VISITOR`, rédaction | Comment |
| `ContributionTier` | paliers de don | Donation |
| `PaymentOperator` | `DRC_MPESA`, `DRC_VISA_CNP`, … | Donation |

## 19.2 Endpoints existants

### API publique — Contenu (`/api/content`)

| Méthode | Route |
|---|---|
| GET | `/actualites` · `/actualites/{slug}` |
| GET | `/events` · `/events/{slug}` |
| GET | `/media` |
| GET | `/programs` · `/programs/{slug}` · `/program-categories` |
| POST | `/programs/{slug}/register` |
| GET | `/articles` · `/articles/{slug}` · `/article-categories` |
| POST | `/articles/{slug}/view` |
| GET | `/articles/{slug}/comments` |
| POST | `/articles/{slug}/comments` · `/comments/{id}/replies` |
| GET | `/partners` · `/home-hero-slides` |
| POST | `/contact` · `/newsletter/subscribe` |

### API publique — Cinémathèque (`/api/cinematheque`)

`GET /films` · `GET /films/{slug}` · `GET /categories` ·
`POST /films/{slug}/view` · `GET /screenings` ·
`POST /screenings/{id}/view` · `POST /screenings/{id}/register`

### API publique — Espaces (`/api/espaces`)

`GET /spaces` · `GET /spaces/{slug}` · `GET /categories` · `GET /settings`

### API publique — Collecte (`/api/fundraising`)

`POST /donations` · `POST /donations/{reference}/confirm-otp` ·
`GET /donations/status/{reference}` · `GET /campaign/stats` ·
`POST /webhooks/makuta` · `GET|POST /paiement/retour`

### API admin (`/api/admin`, Bearer + `ROLE_ADMIN`)

| Méthode | Route | Rôle |
|---|---|---|
| POST | `/login` | public |
| GET | `/stats` | `ROLE_ADMIN` |
| GET | `/donations` | `ROLE_ADMIN` |
| GET | `/donations/{reference}` | `ROLE_ADMIN` |
| GET | `/users` | `ROLE_SUPER_ADMIN` |
| POST | `/users` | `ROLE_SUPER_ADMIN` |
| PATCH | `/users/{id}` | `ROLE_SUPER_ADMIN` |

### Autres

`GET /uploads/media/{filename}` (public, cache 1 an) ·
`GET /api/doc` et `/api/doc.json` (Swagger UI / OpenAPI) ·
`/login`, `/logout` (back-office HTML)

## 19.3 Endpoints API à créer

Convention proposée : préfixe `/api/admin`, jeton Bearer, réponses enveloppées
`{ "data": … }` / `{ "error": … }`, pagination `{ "meta": { total, page,
perPage, pages } }` — conforme à l'existant.

| Ressource | Endpoints | Rôle |
|---|---|---|
| **Profil** | `GET /me` · `PATCH /me` · `POST /me/password` | `ROLE_STAFF` |
| **Recherche** | `GET /search?q&types[]` | `ROLE_STAFF` |
| **Notifications** | `GET /notifications` · `PATCH /notifications/{id}/read` · `POST /notifications/read-all` | `ROLE_STAFF` |
| **Médias** | `GET /media` · `POST /media` (multipart) · `GET|PATCH|DELETE /media/{id}` · `GET /media/{id}/usage` | `ROLE_CONTENT` |
| **Articles** | `GET|POST /articles` · `GET|PATCH|DELETE /articles/{id}` · `POST /articles/{id}/publish` · `POST /articles/{id}/duplicate` · `GET /articles/{id}/stats` | `ROLE_ACTUALITES` |
| **Catégories d'articles** | `GET|POST /article-categories` · `PATCH|DELETE /{id}` · `POST /reorder` | `ROLE_ACTUALITES` |
| **Commentaires** | `GET /comments` · `PATCH /comments/{id}` · `DELETE /comments/{id}` · `POST /comments/{id}/reply` | `ROLE_ACTUALITES` |
| **Actualités** | `GET|POST /actualites` · `GET|PATCH|DELETE /actualites/{id}` | `ROLE_CONTENT` |
| **Événements** | `GET|POST /events` · `GET|PATCH|DELETE /events/{id}` · `GET /events/calendar?from&to` | `ROLE_CONTENT` |
| **Hero** | `GET|POST /hero-slides` · `PATCH|DELETE /{id}` · `POST /reorder` | `ROLE_CONTENT` |
| **Partenaires** | `GET|POST /partners` · `PATCH|DELETE /{id}` · `POST /reorder` | `ROLE_CONTENT` |
| **Messages** | `GET /contact-messages` · `GET|PATCH|DELETE /{id}` · `POST /{id}/reply` | `ROLE_CONTENT` |
| **Newsletter** | `GET /subscribers` · `POST /subscribers/import` · `GET /subscribers/export` · `GET|POST /campaigns` · `POST /campaigns/{id}/test` · `POST /campaigns/{id}/send` | `ROLE_CONTENT` |
| **Programmes** | `GET|POST /programs` · `GET|PATCH|DELETE /programs/{id}` · `POST /programs/{id}/gallery` · `DELETE /programs/{id}/gallery/{imgId}` · `POST /programs/reorder` | `ROLE_ACTION_CULTURELLE` |
| **Rubriques** | `GET|POST /program-categories` · `PATCH|DELETE /{id}` · `POST /reorder` | `ROLE_ACTION_CULTURELLE` |
| **Films** | `GET|POST /films` · `GET|PATCH|DELETE /films/{id}` · `POST /films/{id}/gallery` · `DELETE /films/{id}/gallery/{imgId}` · `POST /films/{id}/archive` | `ROLE_CINEMATHEQUE` |
| **Genres** | `GET|POST /film-categories` · `PATCH|DELETE /{id}` · `POST /reorder` | `ROLE_CINEMATHEQUE` |
| **Projections** | `GET|POST /screenings` · `GET|PATCH|DELETE /screenings/{id}` · `GET /screenings/calendar?from&to` · `POST /screenings/{id}/cancel` · `POST /screenings/{id}/duplicate` · `POST /screenings/bulk` (récurrence) | `ROLE_CINEMATHEQUE` |
| **Inscriptions** | `GET /registrations?type=` · `GET|PATCH|DELETE /registrations/{id}` · `POST /registrations/{id}/confirm` · `POST /registrations/{id}/cancel` · `POST /registrations/{id}/attend` · `GET /registrations/export` · `POST /registrations/email` | par section |
| **Espaces** | `GET|POST /spaces` · `GET|PATCH|DELETE /spaces/{id}` · `POST /spaces/{id}/gallery` · `GET|POST /space-categories` | `ROLE_ESPACES` |
| **Donateurs** | `GET /donors` · `GET /donors/{id}` · `PATCH /donors/{id}` | `ROLE_ADMIN` |
| **Dons (actions)** | `POST /donations/{ref}/resend-receipt` · `POST /donations/{ref}/reconcile` · `GET /donations/export` | `ROLE_ADMIN` |
| **Statistiques** | voir [§15.8](#158-générateur-de-rapports) | selon section |
| **Audit** | `GET /audit-logs` · `GET /audit-logs/export` | `ROLE_SUPER_ADMIN` |
| **Jetons** | `GET|POST /tokens` · `DELETE /tokens/{id}` | `ROLE_SUPER_ADMIN` |
| **Paramètres** | `GET|PATCH /settings` · `GET|POST /menu-items` · `GET|PATCH /system-pages/{slug}` | `ROLE_SUPER_ADMIN` |
| **SEO** | `GET /seo/overview` · `GET|PATCH /seo/settings` · CRUD `/seo/redirects` · `GET /seo/audit` | `ROLE_SUPER_ADMIN` |
| **Audio** | voir [§7.4](#74-endpoints-à-créer) | `ROLE_ACTUALITES` |
| **Santé** | `GET /health` | `ROLE_SUPER_ADMIN` |

**Volumétrie estimée : ~110 endpoints**, dont **~60 indispensables au MVP**.

### Points d'attention API

1. **Sécurité par rôle** — le firewall `admin_api` exige aujourd'hui
   `ROLE_ADMIN` sur tout `^/api/admin`. Les rôles de section (`ROLE_CONTENT`,
   `ROLE_CINEMATHEQUE`…) **n'y ont pas accès**. Il faut abaisser la règle
   `access_control` à `ROLE_STAFF` et porter le contrôle fin sur chaque
   contrôleur via `#[IsGranted]`.
2. **Upload via API** — les uploads passent aujourd'hui exclusivement par les
   formulaires EasyAdmin. Un contrôleur d'upload `multipart/form-data`
   réutilisant `UploadConstraints` est à créer.
3. **CORS** — `nelmio_cors` autorise `*` sur `^/api/` en `GET, POST, OPTIONS`
   uniquement, sans identifiants. `PATCH`, `PUT` et `DELETE` doivent être
   ajoutés pour l'origine du dashboard, avec une règle dédiée à `^/api/admin/`
   restreinte au domaine du dashboard.
4. **Durée du jeton** — 7 jours, sans rafraîchissement. Prévoir un endpoint de
   renouvellement ou un mécanisme de refresh token.
5. **Pagination** — homogénéiser : plusieurs endpoints publics
   (`/programs`, `/articles`, `/films`) renvoient des listes complètes sans
   pagination ; les listes admin doivent toutes être paginées.
6. **Limitation de débit** — deux limiteurs existent
   (`limiter.login_limiter`, `limiter.article_view_limiter`). En ajouter un sur
   les endpoints d'écriture admin.

## 19.4 Dette technique identifiée

| # | Constat | Conséquence pour le Dashboard | Effort |
|---|---|---|---|
| D1 | Aucune API admin éditoriale | Chantier backend préalable indispensable | 🔴 Élevé |
| D2 | Rôles de section interdits sur `/api/admin` | Le cloisonnement par section est impossible côté API | 🟠 Moyen |
| D3 | `UserApiController::ALLOWED_ROLES` limité à admin/super-admin | Impossible de créer un gestionnaire de section via l'API | 🟢 Faible |
| D4 | Champs image stockés en texte, sans relation vers `MediaAsset` | Bibliothèque média déconnectée des contenus, usage non traçable | 🟠 Moyen |
| D5 | `AuditLogger` appelé uniquement pour users/login/newsletter | Flux d'activité incomplet | 🟢 Faible (`EntityListener` global) |
| D6 | Pas de `createdBy`/`updatedBy` sur les contenus | Pas d'attribution, bloque `ROLE_EDITOR` | 🟠 Moyen |
| D7 | `Event.category` et `Screening.venue` sont des chaînes libres | Doublons, filtres peu fiables | 🟠 Moyen |
| D8 | `Event.startTime`/`endTime` sont des `string` | Impossible de trier ou de calculer une durée | 🟢 Faible |
| D9 | `Screening.capacityTaken` saisi manuellement | Taux de remplissage faux | 🟢 Faible |
| D10 | Deux modèles d'événement (`Event` et `Program`) | Confusion utilisateur, duplication de code | 🔴 Élevé (refonte) |
| D11 | `Event` ne permet aucune inscription | Incohérence fonctionnelle avec `Program` | 🟠 Moyen |
| D12 | Aucun e-mail de confirmation à l'inscrit | Expérience utilisateur dégradée | 🟢 Faible |
| D13 | Pas de lien de désabonnement newsletter | Risque de conformité | 🟢 Faible |
| D14 | Campagnes newsletter envoyées en synchrone | Timeout probable au-delà de quelques centaines d'abonnés | 🟠 Moyen |
| D15 | Aucun champ SEO | Référencement dégradé | 🟠 Moyen |
| D16 | Aucun paramètre global en base | Modifications par déploiement | 🟠 Moyen |
| D17 | Pas de statut `SCHEDULED` ni de publication planifiée | Publication manuelle | 🟢 Faible |
| D18 | Tables de vues sans index composite ni agrégats | Dégradation des statistiques à la montée en charge | 🟠 Moyen |
| D19 | Pas de suppression logique | Suppression irréversible | 🟢 Faible |
| D20 | Module Audio inexistant | Fonctionnalité attendue à créer intégralement | 🔴 Élevé |

## 19.5 Contraintes d'environnement

| Contrainte | Valeur | Impact |
|---|---|---|
| PHP serveur | **8.2.30** (plateforme verrouillée dans `composer.json`) | Ne pas exiger PHP 8.3/8.4 dans le code backend |
| Symfony | **7.4.\*** | — |
| Base de données | MySQL (`DATABASE_URL`) | — |
| Cache | Redis disponible (`ext-redis: 6.1`) | Exploitable pour le cache des statistiques |
| Hébergement | Hostinger (voir `DEPLOY_HOSTINGER.md`) | Vérifier la disponibilité de `ffprobe` pour le module Audio ; à défaut, `getID3` |
| Stockage | Système de fichiers local `public/uploads/media` | Pas de CDN, prévoir la sauvegarde du dossier |
| Taille d'upload | 20 Mo (`UploadConstraints::MAX_SIZE`) | Vérifier `upload_max_filesize` et `post_max_size` PHP ; le module Audio demandera 100 Mo |
| Locale | `fr` par défaut (`translation.yaml`) | Messages de validation déjà traduits |
| Fuseau | `Africa/Kinshasa` (UTC+1) | À fixer explicitement côté dashboard |
| Devises | `USD` (dons) · `FC` (billetterie cinéma) | Deux formats de montant à gérer |

## 19.6 Recommandations de mise en œuvre

1. **Commencer par l'API, pas par l'écran.** Le Lot 2 (API admin éditoriale)
   conditionne 80 % des pages. Le figer et le documenter dans Swagger
   (`nelmio_api_doc` est déjà en place) avant d'attaquer le front.
2. **Livrer d'abord ce qui est prêt.** Le tableau de bord de la collecte et la
   gestion des utilisateurs sont exploitables immédiatement : ils valident le
   socle technique (authentification Bearer, shell, design system) sur un
   périmètre réduit.
3. **Ne pas dupliquer EasyAdmin.** Les entités rarement modifiées (catégories,
   galeries isolées, jetons) peuvent rester sur EasyAdmin en v1, avec un lien
   depuis le Dashboard.
4. **Traiter la dette bloquante en parallèle** : D2, D3, D9, D12 sont des
   correctifs de faible effort avec un fort impact fonctionnel.
5. **Prévoir la montée en charge des statistiques** dès la conception : index,
   cache Redis, table d'agrégats quotidiens.
6. **Conserver le principe de l'audit** : toute écriture depuis le Dashboard doit
   alimenter `audit_logs` — c'est le socle du flux d'activité et de la
   traçabilité.
7. **Valider l'ergonomie du calendrier des projections** en premier avec les
   équipes : c'est la page à plus forte valeur d'usage et la plus éloignée de ce
   que propose EasyAdmin.

---

*Document généré à partir de l'audit du dépôt `Fundraising-integration`
(branche `develop`), le 8 août 2026.*
