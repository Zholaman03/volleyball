<?php

namespace App\Http\Controllers;

use App\Http\Resources\GameResource;
use App\Models\Game;
use App\Models\Registration;
use App\Rules\WhatsAppNumber;
use App\Services\RegistrationService;
use App\Support\DisplayName;
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
                'waitlist',
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
            'waitlist',
            'registrations as male_count'   => fn ($q) => $q->where('gender', 'male'),
            'registrations as female_count' => fn ($q) => $q->where('gender', 'female'),
        ]);

        return new GameResource($game);
    }

    /**
     * GET /api/games/{game}/participants — ойыншыларға арналған ашық тізім.
     * Тек қысқартылған аты («Айдос Н.») және жынысы; телефон мен төлем статусы ЕШҚАШАН берілмейді.
     * Бас тартқандар көрінбейді.
     */
    public function participants(Game $game): JsonResponse
    {
        $list = fn ($relation) => $game->{$relation}()
            ->orderBy('id')
            ->get(['id', 'name', 'gender'])
            ->values()
            ->map(fn ($r, $i) => [
                'position' => $i + 1,
                'name'     => DisplayName::short($r->name),
                'gender'   => $r->gender,
            ]);

        return response()->json(['data' => [
            'registered' => $list('registrations'),
            'waitlist'   => $list('waitlist'),
            'capacity'   => $game->capacity,
        ]]);
    }

    /** POST /api/games/{game}/register */
    public function register(Request $request, Game $game, RegistrationService $registrations): JsonResponse
    {
        $data = $request->validate([
            'name'   => ['required', 'string', 'max:100'],
            'phone'  => ['required', 'string', new WhatsAppNumber],
            'gender' => ['required', 'in:male,female'],
            'waitlist' => ['sometimes', 'boolean'], // орын жоқ болса, күту тізіміне жазылу
        ], [
            'name.required'   => __('Атыңызды жазыңыз.'),
            'phone.required'  => __('WhatsApp нөміріңізді жазыңыз.'),
            'gender.required' => __('Жынысыңызды таңдаңыз.'),
        ]);

        $waitlist = (bool) ($data['waitlist'] ?? false);
        unset($data['waitlist']);
        $data['phone'] = RegistrationService::normalizePhone($data['phone']);

        $result = $registrations->register($game, $data, false, $waitlist);

        if (! $result['ok']) {
            return response()->json(
                ['message' => $result['message'], 'full' => $result['full'] ?? false],
                $result['status']
            );
        }

        $registration = $result['registration'];
        $onWaitlist = $registration->status === Registration::WAITLIST;

        return response()->json([
            'message'          => $result['message'],
            'status'           => $registration->status, // active | waitlist
            'waitlist_position' => $registrations->waitlistPosition($registration),
            'cancel_token'     => $registration->cancel_token, // жеке бас тарту сілтемесі: /cancel/<token>
            'cancel_deadline'  => $game->cancelDeadlineString(),
            'registered_count' => $result['registered_count'],
            'capacity'         => $result['capacity'],
            'is_free'          => $game->isFree(),
            // Төлем мәліметі тек ойынға тіркелгенде беріледі (күту тізімінде — орын босағанша емес)
            'payment_info'     => ($game->isFree() || $onWaitlist) ? null : $game->payment_info,
            'payment_deadline' => $onWaitlist ? null : $game->paymentDeadlineString(), // "2026-11-05 20:00" немесе null
        ], 201);
    }
}
