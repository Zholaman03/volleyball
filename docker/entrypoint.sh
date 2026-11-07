#!/bin/sh
# app контейнерінің іске қосылуы: дерекқор, APP_KEY, миграция, кэш, сосын php-fpm
set -e

DATA=/data
mkdir -p "$DATA/backups"
[ -f "$DB_DATABASE" ] || touch "$DB_DATABASE"

# APP_KEY берілмесе, бір рет жасап, томда сақтаймыз (ауыстырсаңыз, барлық токендер жарамсыз болады)
if [ -z "$APP_KEY" ]; then
  if [ ! -s "$DATA/app.key" ]; then
    echo "base64:$(head -c 32 /dev/urandom | base64)" > "$DATA/app.key"
    echo "APP_KEY жасалып, $DATA/app.key файлына сақталды."
  fi
  APP_KEY=$(cat "$DATA/app.key")
  export APP_KEY
fi

chown -R www-data:www-data "$DATA" storage bootstrap/cache

if [ "$1" = "php-fpm" ]; then
  su-exec www-data php artisan migrate --force
  su-exec www-data php artisan optimize
  exec php-fpm
fi

# басқа команда (мысалы, artisan) www-data атынан жүреді
exec su-exec www-data "$@"
