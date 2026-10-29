<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\GameController;
use App\Http\Controllers\OrganizerGameController;
use Illuminate\Support\Facades\Route;

// ---- Қонақтарға арналған (аккаунтсыз) ----
Route::get('/games', [GameController::class, 'index']);
Route::get('/games/{game}', [GameController::class, 'show']);
Route::post('/games/{game}/register', [GameController::class, 'register'])
    ->middleware('throttle:20,1');

// ---- Ұйымдастырушы аккаунты ----
Route::post('/auth/register', [AuthController::class, 'register'])->middleware('throttle:10,1');
Route::post('/auth/login', [AuthController::class, 'login'])->middleware('throttle:10,1');

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);

    Route::prefix('organizer')->group(function () {
        Route::get('/games', [OrganizerGameController::class, 'index']);
        Route::post('/games', [OrganizerGameController::class, 'store']);
        Route::get('/games/{game}', [OrganizerGameController::class, 'show']);
        Route::put('/games/{game}', [OrganizerGameController::class, 'update']);
        Route::delete('/games/{game}', [OrganizerGameController::class, 'destroy']);

        Route::post('/games/{game}/registrations', [OrganizerGameController::class, 'addRegistration']);
        Route::patch('/games/{game}/registrations/{registration}', [OrganizerGameController::class, 'updateRegistration']);
        Route::delete('/games/{game}/registrations/{registration}', [OrganizerGameController::class, 'removeRegistration']);
    });
});
