<?php

// Бұл жоба тек API (routes/api.php). Сайттың беттерін React береді (Nginx /api/ емес барлық сұранысты
// frontend/dist-ке жібереді). Мұнда Closure маршрут болмауы керек, әйтпесе `php artisan route:cache`
// (деплойдағы `artisan optimize`) қатемен тоқтайды.
