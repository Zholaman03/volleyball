# Волейбол ойындарына онлайн тіркелу

Laravel API (backend) + React/Vite (frontend).

## Құрылым

```
backend/    Laravel-ге қосылатын файлдар (модель, контроллер, миграция, seeder, маршрут)
frontend/   React (Vite) қосымшасы
```

## 1. Backend (Laravel)

Таза Laravel жобасын жасаңыз да, `backend/` ішіндегі файлдарды сол жобаға көшіріңіз (бірдей аттағы файлдарды ауыстырыңыз).

```bash
composer create-project laravel/laravel api
cd api
php artisan install:api          # routes/api.php жасайды, Sanctum қосады

# backend/ ішіндегі файлдарды осы api/ папкасына көшіріңіз:
#   app/Models/Game.php, Registration.php
#   app/Http/Controllers/GameController.php
#   app/Http/Resources/GameResource.php
#   database/migrations/2026_10_23_000001_create_games_table.php
#   database/seeders/GameSeeder.php, DatabaseSeeder.php
#   routes/api.php   (бар файлды ауыстырыңыз)
```

`.env` ішінде уақыт белдеуін қойыңыз (бүгінгі ойындар дұрыс күнмен шығуы үшін):

```
APP_TIMEZONE=Asia/Almaty
```

Содан кейін:

```bash
php artisan migrate --seed       # кестелер + 4 үлгі ойын
php artisan serve                # http://localhost:8000
```

Тексеру: http://localhost:8000/api/games

## 2. Frontend (React)

```bash
cd frontend
npm install
npm run dev                      # http://localhost:5173
```

API мекенжайы `frontend/.env` ішінде: `VITE_API_URL=http://localhost:8000/api`

## API

| Әдіс | URL | Сипаттама |
|------|-----|-----------|
| GET  | `/api/games` | Бүгінгі ойындар (`?date=YYYY-MM-DD` — басқа күн) |
| GET  | `/api/games/{id}` | Бір ойын |
| POST | `/api/games/{id}/register` | Тіркелу: `name`, `phone`, `gender` (`male`/`female`) |

## Ойын форматтары

| Мән | Мағынасы | Жыныс лимиті |
|-----|----------|--------------|
| `mixed` | Аралас | шектеу жоқ |
| `girls` | Тек қыздар | тек қыз |
| `boys`  | Тек ұлдар | тек ұл |
| `4_2`   | 4 ұл / 2 қыз | әр командаға 4 ұл, 2 қыз |
| `2_4`   | 2 ұл / 4 қыз | әр командаға 2 ұл, 4 қыз |

Орын саны = `capacity` (3 команда = 18, 2 команда = 12). Бір телефон нөмірі бір ойынға бір рет қана тіркеледі; соңғы орынға екі адам бірдей тіркелмеуі үшін транзакция мен `lockForUpdate` қолданылған.

## Әлі жасалмаған (келесі қадам)

- Ұйымдастырушының жеке аккаунты (Sanctum) және ойын қосу беті
- Онлайн төлем (Kaspi / карта)
- Тіркелуді болдырмау
