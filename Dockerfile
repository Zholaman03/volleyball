# syntax=docker/dockerfile:1
# Екі образ бір файлда: `app` (Laravel + PHP-FPM) және `web` (Caddy: React + HTTPS + /api → app).

# ---------- Frontend жинау ----------
FROM node:20-alpine AS frontend
WORKDIR /build
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
# Сайт пен API бір адресте тұр, сондықтан API жолы салыстырмалы
RUN VITE_API_URL=/api npm run build

# ---------- Composer тәуелділіктері ----------
FROM composer:2 AS vendor
WORKDIR /app
COPY api/composer.json api/composer.lock ./
RUN composer install --no-dev --no-scripts --no-autoloader --prefer-dist --no-interaction
COPY api/ ./
RUN composer dump-autoload --no-dev --optimize --no-scripts

# ---------- app: Laravel + PHP-FPM ----------
FROM php:8.3-fpm-alpine AS app
RUN apk add --no-cache sqlite su-exec
WORKDIR /var/www/html
COPY --from=vendor /app ./
RUN mkdir -p storage/logs storage/framework/cache/data storage/framework/sessions storage/framework/views bootstrap/cache \
    && chown -R www-data:www-data storage bootstrap/cache \
    && su-exec www-data php artisan package:discover --ansi
COPY docker/entrypoint.sh /usr/local/bin/entrypoint
COPY docker/backup.sh /usr/local/bin/backup
RUN chmod +x /usr/local/bin/entrypoint /usr/local/bin/backup

ENV APP_ENV=production \
    APP_DEBUG=false \
    APP_NAME="Волейбол" \
    APP_LOCALE=kk \
    APP_FALLBACK_LOCALE=kk \
    DB_CONNECTION=sqlite \
    DB_DATABASE=/data/database.sqlite \
    SESSION_DRIVER=file \
    CACHE_STORE=file \
    QUEUE_CONNECTION=sync \
    LOG_CHANNEL=stderr \
    LOG_LEVEL=warning \
    MAIL_MAILER=log
VOLUME /data
ENTRYPOINT ["entrypoint"]
CMD ["php-fpm"]

# ---------- web: Caddy ----------
FROM caddy:2-alpine AS web
COPY docker/Caddyfile /etc/caddy/Caddyfile
COPY --from=frontend /build/dist /srv/www
# php_fastcgi файлдың бар-жоғын тексеру үшін public қалтасы осында да керек (app ішіндегі жолмен бірдей)
COPY --from=vendor /app/public /var/www/html/public
