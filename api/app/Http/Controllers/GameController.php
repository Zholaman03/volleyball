<?php

namespace App\Http\Controllers;

use App\Http\Resources\GameResource;
use App\Models\Game;
use App\Rules\WhatsAppNumber;
use App\Services\RegistrationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class GameController extends Controller
{
    /** GET /api/games?date=2026-10-23  (date берілмесе — бүгін) */
    public function index(Request $request)
    {
        $request->validate(['date' => ['nullable', 'date_format:Y-m-d']]);

        $date = $request->query('date', today()->toDateString());

        $games = Game::query()
            ->whereDate('play_date', $date)
            ->withCount([
                'registrations',
                'registrations as male_count'   => fn ($q) => $q->where('gender', 'male'),
                'registrations as female_count' => fn ($q) => $q->where('gender', 'female'),
            ])
            ->orderBy('start_time')
            ->get();

        return GameResource::collection($games);
    }

    /** GET /api/games/{game} */
    public function show(Game $game): GameResource
    {
        $game->loadCount([
            'registrations',
            'registrations as male_count'   => fn ($q) => $q->where('gender', 'male'),
            'registrations as female_count' => fn ($q) => $q->where('gender', 'female'),
        ]);

        return new GameResource($game);
    }

    /** POST /api/games/{game}/register */
    public function register(Request $request, Game $game, RegistrationService $registrations): JsonResponse
    {
        $data = $request->validate([
            'name'   => ['required', 'string', 'max:100'],
            'phone'  => ['required', 'string', new WhatsAppNumber],
            'gender' => ['required', 'in:male,female'],
        ], [
            'name.required'   => 'Атыңызды жазыңыз.',
            'phone.required'  => 'WhatsApp нөміріңізді жазыңыз.',
            'gender.required' => 'Жынысыңызды таңдаңыз.',
        ]);

        $data['phone'] = RegistrationService::normalizePhone($data['phone']);

        $result = $registrations->register($game, $data);

        if (! $result['ok']) {
            return response()->json(['message' => $result['message']], $result['status']);
        }

        return response()->json([
            'message'          => $result['message'],
            'registered_count' => $result['registered_count'],
            'capacity'         => $result['capacity'],
            'payment_info'     => $game->payment_info, // төлем мәліметі тек тіркелгеннен кейін беріледі
        ], 201);
    }
}
