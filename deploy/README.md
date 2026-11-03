# Деплой: бір VPS серверіне (Ubuntu 24.04)

Сайт пен API бір доменде жұмыс істейді: `/` — React (статикалық файлдар), `/api/` — Laravel (PHP-FPM). Тізбек: **Nginx → PHP-FPM → Laravel → SQLite**. Бөлек CORS баптау керек емес.

> Скрипттер нақты серверде әлі сыналған жоқ (Nginx конфигі мен shell-синтаксис ғана тексерілген). Алғаш рет жасағанда қадамдарды асықпай орындап, қате шықса, мәтінін жіберіңіз.

## 1. Не керек

| Не | Қайдан |
|----|--------|
| VPS: Ubuntu **24.04**, 1 vCPU, 1 ГБ RAM, 10+ ГБ диск | Hetzner, DigitalOcean, Vultr немесе қазақстандық хостер (ps.kz, hoster.kz және т.б.). Айына шамамен 4–6 доллар |
| SSH арқылы кіру | Хостер берген IP, `root` және құпия сөз/кілт |
| Домен (HTTPS үшін) | Төменде, 2-бөлім |

## 2. Домен және HTTPS

Сайтқа ұйымдастырушылар құпия сөзбен кіреді, ойыншылар телефон нөмірін енгізеді. HTTPS болмаса, олар интернетте ашық жүреді. Сондықтан нақты қолданысқа HTTPS қажет, ал ол үшін домен керек.

- **Ең жақсы:** домен сатып алу (`.kz` немесе `.com`, жылына бірнеше мың теңге). Домен панелінде **A жазбасын** серверіңіздің IP мекенжайына бағыттаңыз (`@` және қаласаңыз `www`). Өзгеріс бірнеше минуттан бірнеше сағатқа дейін таралады.
- **Сынақ үшін тегін:** [duckdns.org](https://www.duckdns.org) беретін тегін ішкі домен (мысалы `volley.duckdns.org`), оны да серверіңіздің IP-іне бағыттайсыз. Let's Encrypt әдетте онымен де жұмыс істейді.
- **Домен болмаса:** сайт `http://IP` арқылы ашылады, бірақ HTTPS жоқ. Тек сынақ үшін қолданыңыз, нақты құпия сөздер мен нөмірлер енгізбеңіз.

## 3. Бірінші орнату

SSH арқылы серверге кіріңіз (`ssh root@СЕРВЕР_IP`) да:

```bash
git clone https://github.com/Zholaman03/volleyball.git /tmp/vb
sudo DOMAIN=sizdin-domen.kz bash /tmp/vb/deploy/setup.sh
```

Домен жоқ болса, `DOMAIN=...` жолын алып тастаңыз. Қосымша айнымалылар:

| Айнымалы | Мағынасы | Әдепкі |
|----------|----------|--------|
| `DOMAIN` | домен атауы | бос (IP бойынша HTTP) |
| `BRANCH` | қай бұтақты қою керек | `main` |
| `TIMEZONE` | ойындар өтетін жердің уақыт белдеуі | `Asia/Almaty` (Бішкек үшін `Asia/Bishkek`) |

Скрипт істейтіні: пакеттерді орнатады (Nginx, PHP 8.3, Composer, Node, Certbot), желіаралық қалқанды қосады (SSH және 80/443 ғана), кодты `/var/www/volleyball` қалтасына клондайды, `api/.env` жасайды, Nginx баптайды, миграцияны жүргізеді, frontend-ті жинайды, күнделікті көшірмені қосады.

> `BRANCH` әдепкі `main` болғандықтан, алдымен өзгерістер `main`-ге қосылған болуы керек (төменде 8-бөлімді қараңыз). Қосылмаса: `sudo BRANCH=feature/responsive-design DOMAIN=... bash /tmp/vb/deploy/setup.sh`.

## 4. HTTPS қосу (домен болса)

```bash
sudo certbot --nginx -d sizdin-domen.kz
```

Certbot Nginx конфигін өзі өзгертіп, сертификатты өздігінен жаңартып тұрады. Содан кейін `/var/www/volleyball/api/.env` ішіндегі `APP_URL` мәнін `https://...` етіп, кэшті жаңартыңыз: `sudo bash /var/www/volleyball/deploy/update.sh`.

## 5. Бірінші админ

1. Сайтта `/organizer/login` бетін ашып, «Аккаунт жоқ па? Тіркелу» арқылы өз аккаунтыңызды жасаңыз.
2. Серверде өзіңізді админ етіңіз:

```bash
cd /var/www/volleyball/api
sudo -u www-data php artisan user:make-admin sizdin@email.com
```

Одан кейін сайттағы «Админ» бетінде басқа ұйымдастырушыларды бекітесіз. Демо seeder өндіріске қосылмайды, сондықтан сайт бос болып басталады.

## 6. Жаңарту

Код GitHub-қа шыққан соң, серверде:

```bash
sudo bash /var/www/volleyball/deploy/update.sh
```

Ол `git pull`, `composer install`, `migrate` (дерекқорды **өшірмейді**), кэш жаңарту және frontend build жасайды. Серверде файлдарды қолмен өзгертпеңіз, әйтпесе `git pull` тоқтайды.

## 7. Көшірме және қалпына келтіру

Күнделікті 03:30-да `sqlite3 .backup` арқылы көшірме жасалып, `/var/lib/volleyball/backups/` ішінде 14 күн сақталады. **Көшірме сол серверде тұр:** сервер жойылса, көшірме де жоғалады. Аптасына бір рет оны өз компьютеріңізге көшіріңіз:

```bash
scp "root@СЕРВЕР_IP:/var/lib/volleyball/backups/database-*.sqlite.gz" ./backup/
```

Хостердің серверлік снапшот (snapshot) қызметін қосу да жақсы қосымша қорғаныс.

Қалпына келтіру:

```bash
sudo systemctl stop php8.3-fpm
gunzip -c /var/lib/volleyball/backups/database-ДАТА.sqlite.gz | sudo tee /var/lib/volleyball/database.sqlite > /dev/null
sudo chown www-data:www-data /var/lib/volleyball/database.sqlite
sudo systemctl start php8.3-fpm
```

## 8. Кодты `main`-ге қосу

PR тізбегі (#1 → … → #11) әр PR алдыңғысының үстіне қойылған, сондықтан соңғы бұтақта бәрі бар. Ең оңайы: GitHub-та соңғы бұтақтан `main`-ге **бір** PR ашып қосу, ескілерін жабу (бәрінің мазмұны сонда).

## 9. Қате болса

| Белгі | Қайда қарау |
|-------|-------------|
| Сайт ашылмайды | `sudo nginx -t`, `sudo systemctl status nginx`, `sudo tail /var/log/nginx/error.log` |
| `/api/...` 500 қатесі | `sudo tail -50 /var/www/volleyball/api/storage/logs/laravel.log` |
| `/api/...` 502 қатесі | `sudo systemctl status php8.3-fpm` |
| Бетте ескі нұсқа | `update.sh` қайта іске қосыңыз; браузерде Ctrl+Shift+R |
| Ойындар «басқа күнге» ауысады | `api/.env` ішіндегі `APP_TIMEZONE` дұрыс па, сосын `update.sh` |
| `.env` өзгерткен соң әсер етпейді | Конфиг кэштелген: `update.sh` қайта іске қосыңыз |

## 10. Қауіпсіздік тізімі

- Серверде тек SSH және 80/443 порттары ашық (`ufw status`).
- `APP_DEBUG=false` (әдепкі). `api/.env` және `APP_KEY` git-ке түспейді: оларды ешкімге жібермеңіз, `APP_KEY`-ді өзгертпеңіз.
- SSH-ты құпия сөзбен емес, кілтпен кіретін етіңіз (`PasswordAuthentication no` — `/etc/ssh/sshd_config`) және `root` орнына жеке пайдаланушы жасаңыз.
- Ойыншылардың телефон нөмірлері жеке деректер: дерекқор мен көшірмелерді басқаға бермеңіз.
- Серверді жаңартып тұрыңыз: `sudo apt update && sudo apt upgrade` (айына бір рет), `unattended-upgrades` қосуға болады.

## Файлдар

| Файл | Не үшін |
|------|---------|
| `setup.sh` | Серверді бірінші рет баптайды |
| `update.sh` | Жаңа кодты қояды (git pull, composer, migrate, build) |
| `backup.sh` | SQLite көшірмесі (cron шақырады) |
| `nginx.conf.template` | Nginx баптауы: `/` — React, `/api/` — Laravel |
| `env.production.example` | `api/.env` үлгісі өндіріс үшін |
