# syntax=docker/dockerfile:1.7

FROM node:22-bookworm-slim AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
# OpenSSL est requis par le moteur Prisma.
RUN apt-get update \
	&& apt-get install -y --no-install-recommends openssl ca-certificates \
	&& rm -rf /var/lib/apt/lists/*

############################
# Dépendances (dev incluses : nécessaires au build et à Prisma)
############################
FROM base AS deps
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci --no-audit --no-fund

############################
# Migrations Prisma (conteneur ponctuel lancé au déploiement)
############################
FROM deps AS migrator
USER node
CMD ["npx", "prisma", "migrate", "deploy"]

############################
# Build Next.js
############################
FROM deps AS builder

# Les variables NEXT_PUBLIC_* sont figées dans le bundle au build :
# une image par environnement (staging / production).
ARG NEXT_PUBLIC_CONTENT_API_URL
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_SITE_URL
ARG NEXT_PUBLIC_URL
ARG NEXT_PUBLIC_GOOGLE_CLIENT_ID
ARG NEXT_PUBLIC_PAYMENT_ENABLED=false
ENV NEXT_PUBLIC_CONTENT_API_URL=$NEXT_PUBLIC_CONTENT_API_URL \
	NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL \
	NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL \
	NEXT_PUBLIC_URL=$NEXT_PUBLIC_URL \
	NEXT_PUBLIC_GOOGLE_CLIENT_ID=$NEXT_PUBLIC_GOOGLE_CLIENT_ID \
	NEXT_PUBLIC_PAYMENT_ENABLED=$NEXT_PUBLIC_PAYMENT_ENABLED

COPY . .
RUN npm run build

############################
# Image de production
############################
FROM base AS runner
ENV NODE_ENV=production \
	PORT=3000 \
	HOSTNAME=0.0.0.0

COPY --from=builder --chown=node:node /app/public ./public
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static

USER node
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
	CMD node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server.js"]
