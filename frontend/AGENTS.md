# AGENTS.md

Instructions pour les agents de codage IA travaillant sur le frontend CCAPAC.
Ce fichier doit rester court, specifique et verifiable. Ne pas y ajouter de
regles generales qui ne sont pas propres a ce repo.

## Objectif Produit

CCAPAC est le site officiel du Centre Culturel et Artistique pour les Pays
d'Afrique Centrale. Le frontend combine:

- site vitrine institutionnel et culturel;
- agenda d'evenements;
- galerie media;
- newsletters;
- espace membre avec authentification;
- espace admin pour membres, evenements, suggestions et statistiques.

Les contenus editoriaux viennent principalement du backend Strapi. Les donnees
applicatives de l'espace membre viennent de Prisma/PostgreSQL dans ce repo.

## Stack Et Commandes

```powershell
cd D:\ccapac-website\frontend
npm run dev
npm run lint
npm run build
```

Stack principale:

- Next.js 15 App Router, React 19, TypeScript;
- Tailwind CSS 4;
- Radix UI, lucide-react, react-icons;
- TanStack Query;
- Prisma 6 avec PostgreSQL;
- Better Auth;
- Nodemailer;
- PWA via `@ducanh2912/next-pwa`.

Le build lance `prisma generate` puis `next build --turbopack`.
Pour une modification TypeScript/React, executer au minimum `npm run lint`.
Executer `npm run build` si la surface touche les routes, auth, Prisma,
metadata, services de donnees ou rendu global.

## Architecture A Respecter

- `src/app` contient les routes App Router, pages, layouts, actions et routes
  API Next.js.
- `src/app/components` contient les composants lies aux pages publiques et aux
  sections applicatives.
- `src/components/ui` contient les primitives UI reutilisables.
- `src/services` contient les services comme Strapi, mail, events, medias,
  newsletters.
- `src/lib/strapi.ts` centralise les requetes et transformations de donnees
  Strapi. Verifier ce fichier avant de modifier les pages qui affichent
  evenements, hero slides ou medias.
- `src/lib/auth.ts`, `src/lib/auth-client.ts` et `src/lib/auth-server.ts`
  cadrent Better Auth. Ne pas modifier un parcours auth sans verifier les pages
  `src/app/auth/*` et `src/app/espace-membre/*`.
- `prisma/schema.prisma` definit les donnees applicatives: users, sessions,
  event registrations, member activities, member suggestions.
- `public/images`, `public/icons` et `public/logos*` contiennent les assets
  reels du site. Les conserver avant d'introduire de nouveaux visuels.

## Flux De Donnees

- Strapi REST fournit les contenus publics: events, hero-slide, media-gallery,
  newsletter, programme, global/about/article/category.
- `NEXT_PUBLIC_STRAPI_URL` pointe vers Strapi; fallback local:
  `http://localhost:1337`.
- `NEXT_PUBLIC_STRAPI_TOKEN` peut etre ajoute aux requetes Strapi.
- Next.js transforme les donnees Strapi en types applicatifs avant affichage.
- Better Auth + Prisma gerent les comptes, sessions, verification email,
  Google auth et champs membre.
- Les inscriptions aux evenements utilisent l'ID de l'evenement cote Strapi
  stocke dans `EventRegistration.eventId`.
- Ne pas confondre la base CMS Strapi avec la base applicative Prisma.

## Regles De Changement

- Faire des changements chirurgicaux: toucher seulement les fichiers lies a la
  demande.
- Ne pas refactorer une zone adjacente sans raison directement liee au bug ou a
  la fonctionnalite.
- Preserver le style existant: TypeScript, App Router, imports avec alias `@/`,
  composants fonctionnels React, Tailwind.
- Pour les formulaires, conserver les validations Zod/React Hook Form quand
  elles existent deja.
- Pour les icones UI, preferer `lucide-react` ou les bibliotheques deja
  presentes plutot que des SVG faits main.
- Pour les contenus client-facing, ecrire en francais clair, pret a partager,
  et ancrer les formulations dans les capacites reelles du projet.
- Ne pas afficher de langage trop technique sur les pages publiques sauf demande
  explicite.

## Verification Attendue

Avant de considerer une modification terminee:

- verifier le chemin reel touche par la demande, pas seulement le fichier visible;
- executer `npm run lint` apres une modification TypeScript/React;
- executer `npm run build` pour les changements de routes, auth, Prisma,
  services de donnees, metadata ou rendu global;
- si une commande ne peut pas etre lancee, expliquer clairement pourquoi et quel
  risque reste.

## Points D'Attention Connus

- Lire `ONBOARDING_TECHNIQUE.md` pour une vue plus detaillee avant les gros
  changements.
- La langue principale du produit est le francais.
- Le dossier parent `D:\ccapac-website` contient aussi `backend`, une application
  Strapi 5. Ne pas melanger les changements frontend et backend sans objectif
  explicite.
- La racine `D:\ccapac-website` n'est pas le repo Git principal; verifier le
  statut Git dans `D:\ccapac-website\frontend`.

## Quand Demander Une Clarification

Demander avant d'implementer si:

- la demande peut viser Strapi ou Prisma et le chemin attendu n'est pas clair;
- le changement affecte un parcours membre/admin ou une donnee persistante;
- une nouvelle dependance serait necessaire;
- le besoin est client-facing mais la formulation ou la priorite metier est
  ambigue.

Sinon, faire une hypothese prudente, l'annoncer brievement, implementer, puis
verifier.
