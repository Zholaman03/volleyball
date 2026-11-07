# Docker арқылы деплой

Бір VPS-те екі контейнер жұмыс істейді:

| Контейнер | Не істейді |
|-----------|-----------|
| `web` | Caddy: `/` — React, `/api/*` — Laravel-ге бағыттайды. **HTTPS сертификатты өзі алады және жаңартады** (домен болса) |
| `app` | Laravel + PHP-FPM. Іске қосылғанда миграцияны өзі жүргізеді |

SQLite файлы, `APP_KEY` және көшірмелер `volleyball_data` томында тұрады: контейнерді қайта жинағанда жоғалмайды.

> Бұл файлдар нақты Docker-де әлі іске қосылып көрілмеген. Тексерілгені: Caddyfile дұрыс (Caddy-мен), `/api` PHP-FPM-ге дұрыс жетеді (`REQUEST_URI` және клиент IP сақталады), React мен кэш тақырыптары жұмыс істейді. Образды жинау (`docker build`) мен Laravel-дің контейнерде көтерілуі тексерілмеген. Қате шықса, мәтінін жіберіңіз.

## 1. Серверді дайындау

Ubuntu 24.04 VPS-ке SSH-пен кіріп, Docker орнатыңыз:

```bash
curl -fsSL https://get.docker.com | sh
```

Хостердің панелінде 80 және 443 порттары ашық болуы керек. Docker өзі желіаралық қалқанды (`ufw`) айналып өтетінін ескеріңіз, сондықтан порттарды хостер деңгейінде басқарған дұрыс.

## 2. Домен

HTTPS үшін домен керек (немесе тегін DuckDNS ішкі домені). Доменнің **A жазбасын** сервердің IP мекенжайына бағыттаңыз да, келесі қадамға көшпес бұрын таралғанша күтіңіз. Домен болмаса, `DOMAIN` бос қалады, сайт `http://IP` арқылы ашылады (тек сынақ үшін).

## 3. Іске қосу

```bash
git clone https://github.com/Zholaman03/volleyball.git
cd volleyball
git checkout feature/docker      # main-ге қосылғаннан кейін бұл қажет емес
cp .env.docker.example .env
nano .env                        # DOMAIN, APP_URL, TIMEZONE
docker compose up -d --build
```

`.env` мысалы:

```
DOMAIN=volley.example.com
APP_URL=https://volley.example.com
TIMEZONE=Asia/Almaty
APP_KEY=
```

Бірінші жинау бірнеше минут алады. Күйін қарау: `docker compose ps`, журнал: `docker compose logs -f`.

## 4. Бірінші админ

Сайтта `/organizer/login` арқылы өз аккаунтыңызды тіркеп, сосын:

```bash
docker compose exec app php artisan user:make-admin sizdin@email.com
```

## 5. Жаңарту

```bash
cd volleyball
git pull
docker compose up -d --build
```

Дерекқор томда тұрғандықтан өшпейді, жаңа миграциялар өздігінен жүреді.

## 6. Көшірме

```bash
docker compose exec app backup
```

Файл томның `backups/` қалтасына жазылады, 14 күн сақталады. Күнделікті автоматты жасау үшін серверде `crontab -e` ішіне қосыңыз:

```
30 3 * * * cd /root/volleyball && docker compose exec -T app backup
```

Көшірмені өз компьютеріңізге алу:

```bash
docker compose cp app:/data/backups ./backups
```

Көшірме сол серверде тұрады, сондықтан оны аптасына бір рет өзіңізге көшіріңіз.

Қалпына келтіру:

```bash
docker compose stop app
docker compose run --rm --no-deps -v "$PWD/backups:/restore" app sh -c 'gunzip -c /restore/database-ДАТА.sqlite.gz > /data/database.sqlite'
docker compose up -d app
```

## 7. Қате болса

| Белгі | Не істеу |
|-------|----------|
| Сайт ашылмайды | `docker compose ps`; `docker compose logs web` |
| HTTPS сертификат алынбайды | Домен A жазбасы осы IP-ге қарай ма, 80/443 порттары ашық па; `docker compose logs web` |
| `/api` 502 қатесі | `docker compose logs app` |
| `/api` 500 қатесі | `docker compose logs app` (Laravel қателері осында шығады) |
| `.env` өзгерткен соң әсер етпейді | `docker compose up -d` қайта іске қосыңыз |

## Қауіпсіздік

- `APP_KEY` сақталған `app.key` файлын (`volleyball_data` томында) ешкімге бермеңіз және өзгертпеңіз.
- Телефон нөмірлері жеке деректер: дерекқор көшірмелерін басқаға бермеңіз.
- SSH-ты кілтпен кіретін етіп баптаңыз, серверді жаңартып тұрыңыз (`apt update && apt upgrade`).
