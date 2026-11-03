#!/usr/bin/env bash
# Таза Ubuntu 24.04 серверін БІРІНШІ рет бапттайды. root ретінде іске қосыңыз:
#
#   git clone https://github.com/Zholaman03/volleyball.git /tmp/vb && \
#   sudo DOMAIN=sizdin-domen.kz bash /tmp/vb/deploy/setup.sh
#
# Айнымалылар (бәрі міндетті емес):
#   DOMAIN    домен атауы. Бос болса, сайт IP мекенжайымен HTTP арқылы ашылады (HTTPS жоқ!)
#   BRANCH    қай бұтақты қою керек (әдепкі: main)
#   TIMEZONE  ойындар өтетін жердің уақыт белдеуі (әдепкі: Asia/Almaty, Бішкек үшін Asia/Bishkek)
#   REPO_URL  репозиторий (әдепкі: https://github.com/Zholaman03/volleyball.git)
set -euo pipefail

APP_DIR=${APP_DIR:-/var/www/volleyball}
DATA_DIR=${DATA_DIR:-/var/lib/volleyball}
CACHE_DIR=${CACHE_DIR:-/var/cache/volleyball}
REPO_URL=${REPO_URL:-https://github.com/Zholaman03/volleyball.git}
BRANCH=${BRANCH:-main}
DOMAIN=${DOMAIN:-}
TIMEZONE=${TIMEZONE:-Asia/Almaty}

[ "$(id -u)" -eq 0 ] || { echo "root ретінде іске қосыңыз: sudo bash $0"; exit 1; }

. /etc/os-release
if [ "${VERSION_ID:-}" != "24.04" ] && [ "${FORCE:-}" != "1" ]; then
  echo "Бұл скрипт Ubuntu 24.04 үшін жазылған (PHP 8.3 дайын пакет ретінде бар). Сізде: ${PRETTY_NAME:-белгісіз}."
  echo "Бәрібір жалғастырғыңыз келсе: FORCE=1 орнатыңыз (PHP 8.3 өзіңіз қосуыңыз керек)."
  exit 1
fi

echo "==> Пакеттер орнатылуда"
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get install -y nginx git curl unzip ufw sqlite3 \
  php8.3-fpm php8.3-cli php8.3-sqlite3 php8.3-mbstring php8.3-xml php8.3-curl php8.3-zip \
  composer nodejs npm certbot python3-certbot-nginx

echo "==> Желіаралық қалқан: тек SSH және 80/443"
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable

echo "==> Қалталар"
mkdir -p "$DATA_DIR/backups" "$CACHE_DIR/composer" "$CACHE_DIR/npm"
touch "$DATA_DIR/database.sqlite"
chown -R www-data:www-data "$DATA_DIR" "$CACHE_DIR"
chmod 750 "$DATA_DIR"

if [ ! -d "$APP_DIR/.git" ]; then
  echo "==> Код клондалуда ($REPO_URL, бұтақ: $BRANCH)"
  mkdir -p "$(dirname "$APP_DIR")"
  git clone --branch "$BRANCH" "$REPO_URL" "$APP_DIR"
  chown -R www-data:www-data "$APP_DIR"
fi

if [ ! -f "$APP_DIR/api/.env" ]; then
  echo "==> api/.env жасалуда"
  if [ -n "$DOMAIN" ]; then
    APP_URL="http://$DOMAIN"
  else
    APP_URL="http://$(hostname -I | awk '{print $1}')"
  fi
  sed -e "s|__APP_URL__|$APP_URL|" -e "s|__TIMEZONE__|$TIMEZONE|" \
    "$APP_DIR/deploy/env.production.example" > "$APP_DIR/api/.env"
  chown www-data:www-data "$APP_DIR/api/.env"
  chmod 640 "$APP_DIR/api/.env"
fi

echo "==> Nginx бапталуда"
sed "s|__SERVER_NAME__|${DOMAIN:-_}|" "$APP_DIR/deploy/nginx.conf.template" > /etc/nginx/sites-available/volleyball
ln -sf /etc/nginx/sites-available/volleyball /etc/nginx/sites-enabled/volleyball
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl enable --now nginx php8.3-fpm

echo "==> Күнделікті көшірме (03:30)"
chmod +x "$APP_DIR"/deploy/*.sh
echo "30 3 * * * www-data DATA_DIR=$DATA_DIR $APP_DIR/deploy/backup.sh >> $DATA_DIR/backup.log 2>&1" > /etc/cron.d/volleyball-backup

echo "==> Backend пен frontend жиналуда (update.sh)"
APP_DIR="$APP_DIR" CACHE_DIR="$CACHE_DIR" bash "$APP_DIR/deploy/update.sh"
systemctl reload nginx

if [ -n "$DOMAIN" ]; then
  SITE="http://$DOMAIN"
  STEP1="HTTPS қосу:  sudo certbot --nginx -d $DOMAIN"
else
  SITE="http://$(hostname -I | awk '{print $1}')"
  STEP1="Домен жоқ болғандықтан HTTPS жоқ: құпия сөздер ашық жолмен жүреді, тек сынақ үшін қолданыңыз."
fi

cat <<MSG

==================================================================
Дайын. Сайт: $SITE

Келесі қадамдар:
1. $STEP1
2. Сайтта /organizer/login бетінде өз аккаунтыңызды тіркеңіз, сосын админ етіңіз:
     cd $APP_DIR/api && sudo -u www-data php artisan user:make-admin ӨЗ_EMAIL
3. Жаңа код шыққанда: sudo bash $APP_DIR/deploy/update.sh
==================================================================
MSG
