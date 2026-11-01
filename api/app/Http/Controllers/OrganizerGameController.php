<?php

namespace App\Http\Controllers;

use App\Http\Resources\OrganizerGameResource;
use App\Http\Resources\RegistrationResource;
use App\Models\Game;
use App\Models\Registration;
use App\Rules\WhatsAppNumber;
use App\Services\RegistrationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class OrganizerGameController extends Controller
{
    /** GET /api/organizer/games — тек өз ойындары */
    public function index(Request $request)
    {
        $games = $request->user()->games()
            ->withCount($this->counts())
            ->orderByDesc('play_date')
            ->orderBy('start_time')
            ->get();

        return OrganizerGameResource::collection($games);
    }

    /** GET /api/organizer/games/{game} — қатысушылар тізімімен */
    public function show(Request $request, Game $game): OrganizerGameResource
    {
        $this->authorizeOwner($request, $game);

        $game->load(['registrations' => fn ($q) => $q->orderBy('created_at')->orderBy('id')])
            ->loadCount($this->counts());

        return new OrganizerGameResource($game);
    }

    /** POST /api/organizer/games */
    public function store(Request $request): JsonResponse
    {
        $data = $this->validated($request);

        $game = $request->user()->games()->create(
            $data + ['organizer_name' => $request->user()->name]
        );
        $game->loadCount($this->counts());

        return (new OrganizerGameResource($game))->response()->setStatusCode(201);
    }

    /** PUT /api/organizer/games/{game} */
    public function update(Request $request, Game $game)
    {
        $this->authorizeOwner($request, $game);

        $data = $this->validated($request, $game);

        $registered = $game->registrations()->count();
        if ($data['capacity'] < $registered) {
            return response()->json([
                'message' => "Тіркелгендер саны ({$registered}) жаңа орын санынан көп.",
            ], 422);
        }

        // Формат өзгерсе, қазіргі қатысушылар жаңа жыныс лимитіне сыя ма — тексереміз
        $game->fill($data);
        $limits = $game->genderLimits();
        foreach (['male' => 'ұлдар', 'female' => 'қыздар'] as $gender => $label) {
            $count = $game->registrations()->where('gender', $gender)->count();
            if ($limits[$gender] !== null && $count > $limits[$gender]) {
                return response()->json([
                    'message' => "Форматты өзгерту мүмкін емес: тіркелген {$label} саны жаңа лимиттен асады.",
                ], 422);
            }
        }

        $game->save();
        $game->loadCount($this->counts());

        return new OrganizerGameResource($game);
    }

    /** DELETE /api/organizer/games/{game} */
    public function destroy(Request $request, Game $game)
    {
        $this->authorizeOwner($request, $game);

        $game->delete(); // registrations cascade арқылы өшеді

        return response()->noContent();
    }

    /** POST /api/organizer/games/{game}/registrations — қолмен қосу */
    public function addRegistration(Request $request, Game $game, RegistrationService $registrations): JsonResponse
    {
        $this->authorizeOwner($request, $game);

        $data = $request->validate([
            'name'   => ['required', 'string', 'max:100'],
            'phone'  => ['required', 'string', new WhatsAppNumber],
            'gender' => ['required', 'in:male,female'],
            'paid'   => ['sometimes', 'boolean'],
        ], [
            'name.required'   => 'Атын жазыңыз.',
            'phone.required'  => 'WhatsApp нөмірін жазыңыз.',
            'gender.required' => 'Жынысын таңдаңыз.',
        ]);

        $paid = (bool) ($data['paid'] ?? false);
        unset($data['paid']);
        $data['phone'] = RegistrationService::normalizePhone($data['phone']);

        $result = $registrations->register($game, $data, $paid);

        if (! $result['ok']) {
            return response()->json(['message' => $result['message']], $result['status']);
        }

        return (new RegistrationResource($result['registration']))->response()->setStatusCode(201);
    }

    /** PATCH /api/organizer/games/{game}/registrations/{registration} — төлем белгісі */
    public function updateRegistration(Request $request, Game $game, Registration $registration): RegistrationResource
    {
        $this->authorizeOwner($request, $game);
        $this->ensureBelongs($game, $registration);

        $data = $request->validate(['paid' => ['required', 'boolean']]);

        $registration->update(['paid' => $data['paid']]);

        return new RegistrationResource($registration);
    }

    /** DELETE /api/organizer/games/{game}/registrations/{registration} */
    public function removeRegistration(Request $request, Game $game, Registration $registration)
    {
        $this->authorizeOwner($request, $game);
        $this->ensureBelongs($game, $registration);

        $registration->delete();

        return response()->noContent();
    }

    private function authorizeOwner(Request $request, Game $game): void
    {
        abort_if($game->user_id !== $request->user()->id, 403, 'Бұл сіздің ойыныңыз емес.');
    }

    private function ensureBelongs(Game $game, Registration $registration): void
    {
        abort_if($registration->game_id !== $game->id, 404);
    }

    private function counts(): array
    {
        return [
            'registrations',
            'registrations as male_count'   => fn ($q) => $q->where('gender', 'male'),
            'registrations as female_count' => fn ($q) => $q->where('gender', 'female'),
            'registrations as paid_count'   => fn ($q) => $q->where('paid', true),
        ];
    }

    private function validated(Request $request, ?Game $game = null): array
    {
        $dateRules = ['required', 'date_format:Y-m-d'];
        if (! $game) {
            $dateRules[] = 'after_or_equal:today'; // жаңа ойын өткен күнге қосылмайды
        }

        $data = $request->validate([
            'format'           => ['required', Rule::in(array_keys(Game::FORMATS))],
            'play_date'        => $dateRules,
            'start_time'       => ['required', 'date_format:H:i'],
            'duration_minutes' => ['required', 'integer', 'min:30', 'max:360'],
            'venue_name'       => ['required', 'string', 'max:120'],
            'venue_address'    => ['required', 'string', 'max:255'],
            'price'            => ['required', 'integer', 'min:0', 'max:1000000'],
            'teams_count'      => ['required', 'integer', 'min:1', 'max:6'],
        ], [
            'required'                 => 'Барлық өрісті толтырыңыз.',
            'play_date.after_or_equal' => 'Өткен күнді таңдауға болмайды.',
            'integer'                  => 'Сан енгізіңіз.',
            'in'                       => 'Формат дұрыс емес.',
        ]);

        $data['start_time'] .= ':00';
        $data['capacity'] = $data['teams_count'] * Game::TEAM_SIZE;

        return $data;
    }
}
