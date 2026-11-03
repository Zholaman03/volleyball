#!/usr/bin/env bash
# Жаңа код шыққанда серверде іске қосыңыз:  sudo bash /var/www/volleyball/deploy/update.sh
# Дерекқорды өшірмейді (тек `migrate`, `migrate:fresh` емес) және APP_KEY-ді өзгертпейді.
set -euo pipefail

APP_DIR=${APP_DIR:-/var/www/volleyball}
CACHE_DIR=${CACHE_DIR:-/var/cache/volleyball}

[ "$(id -u)" -eq 0 ] || { echo "root ретінде іске қосыңыз: sudo bash $0"; exit 1; }

# Барлық команда www-data атынан жүреді (файлдарға сол иелік етеді)
as_app() {
  sudo -u www-data -H env \
    COMPOSER_HOME="$CACHE_DIR/composer" \
    npm_config_cache="$CACHE_DIR/npm" \
    "$@"
}

echo "==> Код жаңартылуда (git pull)"
as_app git -C "$APP_DIR" pull --ff-only

echo "==> Backend: тәуелділіктер, миграция, кэш"
cd "$APP_DIR/api"
as_app composer install --no-dev --optimize-autoloader --no-interaction
if ! grep -q '^APP_KEY=.\+' .env; then
  as_app php artisan key:generate --force
fi
as_app php artisan migrate --force
as_app php artisan optimize

echo "==> Frontend: build (API мекенжайы — /api)"
cd "$APP_DIR/frontend"
as_app npm ci --no-audit --no-fund
as_app env VITE_API_URL=/api npm run build

echo "==> PHP-FPM қайта жүктеледі (opcache жаңару үшін)"
systemctl reload php8.3-fpm

echo "==> Дайын. Нұсқа: $(as_app git -C "$APP_DIR" log --oneline -1)"
