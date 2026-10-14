# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

CCAPAC is the frontend for the *Centre Culturel et Artistique pour les Pays d'Afrique Centrale*: an institutional showcase site plus an event agenda, media gallery, newsletters, a member space with auth, an admin space, and a Stripe-based fundraising flow. **The product language is French** — all user-facing copy is in French.

`AGENTS.md` is the authoritative, detailed contributor guide (architecture, data flow, change rules, when to ask for clarification). Read it before non-trivial work. This file is the quick-start; where they overlap, AGENTS.md wins. Note that AGENTS.md references a Windows path (`D:\ccapac-website\frontend`) and a sibling Strapi `backend` — this checkout lives on Linux at the repo root, and the Strapi backend is a separate, remote service here.

## Commands

```bash
npm run dev      # next dev --turbopack
npm run build    # prisma generate && next build --turbopack
npm run lint     # eslint
npm start        # next start (after build)
```

There is no test suite. Verification = lint + build:
- Run `npm run lint` after any TypeScript/React change.
- Run `npm run build` when touching routes, auth, Prisma, data services, metadata, or global rendering (the build runs `prisma generate` first).

After editing `prisma/schema.prisma`, run `npx prisma generate`; for schema changes use `npx prisma migrate dev` (migrations live in `prisma/migrations/`).

## Stack

Next.js 15 (App Router) · React 19 · TypeScript (strict) · Tailwind CSS 4 · Radix UI primitives (`src/components/ui`) · TanStack Query · Prisma 6 / PostgreSQL · Better Auth · Stripe · Cloudinary · Nodemailer · PWA via `@ducanh2912/next-pwa`. Import alias: `@/*` → `src/*`.

## Two distinct data sources — do not conflate them

1. **Strapi (remote CMS)** — all public editorial content: events, hero slides, media gallery, newsletters, programmes, articles. Accessed via `src/lib/strapi.ts` (centralizes fetching + transforming Strapi responses into app types) and the `src/services/*` services. Configured by `NEXT_PUBLIC_STRAPI_URL` (fallback `http://localhost:1337`) and optional `NEXT_PUBLIC_STRAPI_TOKEN`. Check `src/lib/strapi.ts` before changing any page that renders events, hero slides, or media. `next.config.ts` whitelists the Strapi image hostnames — add new remote image hosts there.

2. **Prisma / PostgreSQL (this repo's app DB)** — member-space application data. Models: `User`, `Session`, `Account`, `Verification`, `ApprovalToken`, `EventRegistration`, `MemberActivity`, `MemberSuggestion`, `FundraisingDonationNotification`. Event registrations store the Strapi event ID in `EventRegistration.eventId` — the bridge between the two systems. Always import the singleton from `src/lib/prisma.ts` (never `new PrismaClient()` directly).

## Auth

Better Auth is split across `src/lib/auth.ts` (server config), `src/lib/auth-server.ts`, and `src/lib/auth-client.ts`. It backs accounts, sessions, email verification, Google sign-in, and member fields, persisted via Prisma. Do not change an auth flow without also checking `src/app/auth/*` and `src/app/espace-membre/*`.

## Layout

- `src/app/` — App Router routes, layouts, server actions, and Next API routes under `src/app/api/` (`admin`, `auth`, `members`, `newsletter`, `actualites`, `fundraising`).
- `src/app/components/` — page/section components for public and app areas.
- `src/components/ui/` — reusable UI primitives (shadcn-style, configured via `components.json`).
- `src/services/` — data services (Strapi content, mail, events, media, newsletter, admin).
- `src/lib/` — cross-cutting helpers (strapi, auth, prisma, utils, date/media/slug utils, constants).
- `src/actions/`, `src/hooks/`, `src/data/`, `src/types/` — server actions, React Query hooks, static data, shared types.

The **fundraising/donation** flow spans `src/app/api/fundraising/*` (campaign, donations, donation verify by id), the `src/app/grand-tambour` and `src/app/don-merci` pages (the latter verifies the donation), Stripe (`@stripe/*`), and the `FundraisingDonationNotification` Prisma model.

## Conventions

- Make surgical changes; don't refactor adjacent code without a reason tied to the task.
- Keep existing form validation: Zod + React Hook Form (`@hookform/resolvers`) where already present.
- For icons prefer `lucide-react` / `react-icons` over hand-rolled SVG.
- `serverActions.bodySizeLimit` is raised to `6mb` (file/photo uploads) in `next.config.ts`.
- Env files (`.env*`) and the generated Prisma client (`src/generated/prisma`) are gitignored.
