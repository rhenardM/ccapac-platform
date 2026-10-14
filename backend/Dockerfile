# syntax=docker/dockerfile:1.7

############################
# Base : PHP 8.3 + FrankenPHP
############################
FROM dunglas/frankenphp:1-php8.3-alpine AS base

WORKDIR /app

RUN apk add --no-cache libcap && setcap -r /usr/local/bin/frankenphp && apk del libcap \
	&& install-php-extensions \
		apcu \
		gd \
		intl \
		opcache \
		pdo_pgsql \
		redis \
		zip \
	&& apk add --no-cache curl

COPY docker/php.ini $PHP_INI_DIR/conf.d/zz-ccapac.ini
COPY docker/Caddyfile /etc/frankenphp/Caddyfile
COPY --chmod=755 docker/entrypoint.sh /usr/local/bin/docker-entrypoint

ENV APP_ENV=prod \
	APP_DEBUG=0 \
	SERVER_NAME=:8080 \
	XDG_CONFIG_HOME=/tmp/caddy-config \
	XDG_DATA_HOME=/tmp/caddy-data

############################
# Dépendances Composer
############################
FROM base AS vendor

COPY --from=composer/composer:2-bin /composer /usr/bin/composer
COPY composer.json composer.lock symfony.lock ./
RUN composer install --no-dev --no-scripts --no-autoloader --prefer-dist --no-interaction --no-progress

############################
# Image de production
############################
FROM base AS prod

COPY --from=vendor /app/vendor ./vendor
COPY . .
COPY --from=composer/composer:2-bin /composer /usr/bin/composer

# Autoloader optimisé + assets (EasyAdmin, Swagger UI) figés dans l'image.
# Aucun secret n'est requis au build : .env ne contient que des valeurs par défaut.
RUN composer dump-autoload --no-dev --classmap-authoritative \
	&& php bin/console assets:install public --no-interaction \
	&& rm -rf var/* /usr/bin/composer \
	&& mkdir -p var public/uploads/media \
	&& chown -R www-data:www-data var public/uploads

USER www-data

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
	CMD curl -fsS http://127.0.0.1:8080/api/health || exit 1

ENTRYPOINT ["docker-entrypoint"]
CMD ["frankenphp", "run", "--config", "/etc/frankenphp/Caddyfile"]
