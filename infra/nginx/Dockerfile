FROM nginx:1.27-alpine

RUN apk add --no-cache openssl \
	&& rm /etc/nginx/conf.d/default.conf

COPY nginx.conf /etc/nginx/nginx.conf
COPY snippets/ /etc/nginx/snippets/
COPY templates/ /etc/nginx/templates/
COPY --chmod=755 entrypoint.d/ /docker-entrypoint.d/

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
	CMD wget -q --spider http://127.0.0.1/nginx-health || exit 1
