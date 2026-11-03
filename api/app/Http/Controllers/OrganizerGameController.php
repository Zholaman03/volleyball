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
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
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

        $game->load([
            'registrations' => fn ($q) => $q->orderBy('created_at')->orderBy('id'),
            'waitlist',
            'cancelledRegistrations',
        ])->loadCount($this->counts());

        return new OrganizerGameResource($game);
    }

    /**
     * POST /api/organizer/games
     *
     * `repeat_weeks` (0–12, міндетті емес): сол ойынды қосымша қанша апта қайталап қосу.
     * Мысалы 3 болса, күні + 7, +14, +21 күнге де ойын жасалады (барлығы 4).
     * Бәрі бір транзакцияда: не бәрі қосылады, не ешқайсысы.
     * Жауап: бірінші ойын (`data`) және `meta.created` — қосылған ойын саны.
     */
    public function store(Request $request): JsonResponse
    {
        $data = $this->validated($request);
        $repeat = (int) $request->input('repeat_weeks', 0); // validated() тексерген

        $games = DB::transaction(function () use ($request, $data, $repeat) {
            $created = [];

            for ($week = 0; $week <= $repeat; $week++) {
                $created[] = $request->user()->games()->create([
                    ...$data,
                    'play_date'      => Carbon::parse($data['play_date'])->addWeeks($week)->toDateString(),
                    'organizer_name' => $request->user()->name,
                ]);
            }

            return $created;
        });

        $first = $games[0]->loadCount($this->counts());

        return (new OrganizerGameResource($first))
            ->additional(['meta' => ['created' => count($games)]])
            ->response()
            ->setStatusCode(201);
    }

    /** PUT /api/organizer/games/{game} */
    public function update(Request $request, Game $game)
    {
        $this->authorizeOwner($request, $game);

        $data = $this->validated($request, $game);

        $registered = $game->registrations()->count();
        if ($data['capacity'] < $registered) {
            return response()->json([
                'message' => __('Тіркелгендер саны (:count) жаңа орын санынан көп.', ['count' => $registered]),
            ], 422);
        }

        // Формат өзгерсе, қазіргі қатысушылар жаңа жыныс лимитіне сыя ма — тексереміз
        $game->fill($data);
        $limits = $game->genderLimits();
        foreach (['male' => __('ұлдар'), 'female' => __('қыздар')] as $gender => $label) {
            $count = $game->registrations()->where('gender', $gender)->count();
            if ($limits[$gender] !== null && $count > $limits[$gender]) {
                return response()->json([
                    'message' => __('Форматты өзгерту мүмкін емес: тіркелген :who саны жаңа лимиттен асады.', ['who' => $label]),
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
            'name.required'   => __('Атын жазыңыз.'),
            'phone.required'  => __('WhatsApp нөмірін жазыңыз.'),
            'gender.required' => __('Жынысын таңдаңыз.'),
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

    /** POST /api/organizer/games/{game}/registrations/{registration}/promote — күту тізімінен ойынға қосу */
    public function promoteRegistration(
        Request $request,
        Game $game,
        Registration $registration,
        RegistrationService $registrations
    ): JsonResponse {
        $this->authorizeOwner($request, $game);
        $this->ensureBelongs($game, $registration);

        $result = $registrations->promote($registration);

        if (! $result['ok']) {
            return response()->json(['message' => $result['message']], $result['status']);
        }

        return (new RegistrationResource($result['registration']))->response();
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
        abort_if($game->user_id !== $request->user()->id, 403, __('Бұл сіздің ойыныңыз емес.'));
    }

    private function ensureBelongs(Game $game, Registration $registration): void
    {
        abort_if($registration->game_id !== $game->id, 404);
    }

    private function counts(): array
    {
        return [
            'registrations',
            'waitlist',
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
            'repeat_weeks'     => ['nullable', 'integer', 'min:0', 'max:12'], // тек жаңа ойын қосқанда қолданылады
            'payment_info'     => ['nullable', 'string', 'max:255'],
            'payment_deadline_hours' => ['nullable', 'integer', 'min:1', 'max:168'], // ойынға N сағат қалғанға дейін (≤ 7 күн)
        ], [
            'required'                 => __('Барлық өрісті толтырыңыз.'),
            'play_date.after_or_equal' => __('Өткен күнді таңдауға болмайды.'),
            'integer'                  => __('Сан енгізіңіз.'),
            'in'                       => __('Формат дұрыс емес.'),
            'repeat_weeks.max'         => __('Ең көбі 12 апта қайталауға болады.'),
            'repeat_weeks.min'         => __('Қайталау саны теріс болмауы керек.'),
            'payment_info.max'         => __('Төлем мәліметі 255 таңбадан аспауы керек.'),
            'payment_deadline_hours.min' => __('Төлем мерзімі кемінде 1 сағат болуы керек.'),
            'payment_deadline_hours.max' => __('Төлем мерзімі ең көбі 168 сағат (7 күн).'),
        ]);

        unset($data['repeat_weeks']); // ойынның өрісі емес

        // Тегін ойында (баға 0) төлем мәліметі мен мерзімі болмайды
        if ((int) $data['price'] === 0) {
            $data['payment_info'] = null;
            $data['payment_deadline_hours'] = null;
        }

        $data['start_time'] .= ':00';
        $data['capacity'] = $data['teams_count'] * Game::TEAM_SIZE;

        return $data;
    }
}
