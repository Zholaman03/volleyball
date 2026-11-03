<?php

namespace App\Services;

use App\Models\Game;
use App\Models\Registration;
use App\Support\PhoneNumber;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Ойынға қатысушы қосудың, күту тізімінің және бас тартудың ортақ логикасы.
 * Қолданушы өзін тіркегенде де, ұйымдастырушы қолмен қосқанда да осы қолданылады.
 */
class RegistrationService
{
    /** WhatsApp (E.164) пішімі: +77011234567. Бір нөмір әр түрлі жазылса да бірдей болады. */
    public static function normalizePhone(string $phone): string
    {
        return PhoneNumber::normalize($phone) ?? $phone;
    }

    /**
     * @param  array{name: string, phone: string, gender: string}  $data  (phone нормаланған болуы керек)
     * @param  bool  $waitlist  орын жоқ болса, күту тізіміне жазу (орын бар болса, әдеттегідей тіркейді)
     * @return array{ok: bool, status: int, message: string, full?: bool, registration?: Registration, registered_count?: int, capacity?: int}
     */
    public function register(Game $game, array $data, bool $paid = false, bool $waitlist = false): array
    {
        // Соңғы орынға екі адам бір мезгілде тіркелмеуі үшін транзакция + lock
        return DB::transaction(function () use ($game, $data, $paid, $waitlist) {
            $game = Game::whereKey($game->id)->lockForUpdate()->firstOrFail();

            if ($game->play_date->lt(today())) {
                return $this->fail(422, __('Бұл ойын өтіп кеткен.'));
            }

            // Бір нөмір бір ойында бір ғана жол (unique). Бас тартқан адам қайта тіркелсе, сол жол жаңарады
            $existing = $game->allRegistrations()->where('phone', $data['phone'])->first();

            if ($existing?->status === Registration::ACTIVE) {
                return $this->fail(409, __('Бұл нөмір осы ойынға тіркелген.'));
            }
            if ($existing?->status === Registration::WAITLIST) {
                return $this->fail(409, __('Бұл нөмір күту тізімінде тұр.'));
            }

            $blocked = $this->noSpotReason($game, $data['gender']);
            if ($blocked !== null && ! $waitlist) {
                return $this->fail(409, $blocked) + ['full' => true];
            }

            $attrs = $data + [
                'status'       => $blocked === null ? Registration::ACTIVE : Registration::WAITLIST,
                'cancel_token' => Str::random(32), // қайта тіркелгенде жаңа сілтеме беріледі
                'cancelled_at' => null,
            ];

            if ($existing) {
                // Бұрын төлеген болса, ақша ұйымдастырушыда тұр — белгіні сақтаймыз
                $attrs['paid'] = $existing->paid || $paid;
                $existing->update($attrs);
                $registration = $existing;
            } else {
                $registration = $game->allRegistrations()->create($attrs + ['paid' => $paid]);
            }

            $total = $game->registrations()->count();

            return [
                'ok'               => true,
                'status'           => 201,
                'message'          => $blocked === null ? __('Сәтті тіркелдіңіз!') : __('Күту тізіміне жазылдыңыз.'),
                'registration'     => $registration,
                'registered_count' => $total,
                'capacity'         => $game->capacity,
            ];
        });
    }

    /**
     * Бас тарту (құпия сілтеме бойынша).
     * Белсенді тіркеу: ойынға CANCEL_HOURS_BEFORE сағат қалғанға дейін. Күту тізімі: ойын басталғанға дейін.
     * Жол өшірілмейді, «cancelled» болады (төлемі бар болса, ұйымдастырушы ақшаны қайтарады).
     */
    public function cancel(Registration $registration): array
    {
        return DB::transaction(function () use ($registration) {
            $game = Game::whereKey($registration->game_id)->lockForUpdate()->firstOrFail();
            $registration = Registration::whereKey($registration->id)->firstOrFail();

            if ($registration->status === Registration::CANCELLED) {
                return $this->fail(409, __('Тіркеу бұрын бас тартылған.'));
            }

            if ($registration->status === Registration::ACTIVE && ! $game->canCancel()) {
                $hours = Game::CANCEL_HOURS_BEFORE;
                return $this->fail(422, __('Бас тарту мерзімі өтті: ойынға :hours сағаттан аз қалды. Ұйымдастырушыға (:organizer) WhatsApp-та жазыңыз.', ['hours' => $hours, 'organizer' => $game->organizer_name]));
            }

            if ($game->startsAt()->isPast()) {
                return $this->fail(422, __('Ойын басталып кеткен.'));
            }

            $registration->update([
                'status'       => Registration::CANCELLED,
                'cancelled_at' => now(),
            ]);

            return [
                'ok'           => true,
                'status'       => 200,
                'message'      => $registration->paid
                    ? __('Тіркеуіңіз бас тартылды. Төлем жасаған болсаңыз, ұйымдастырушы сізбен хабарласады.')
                    : __('Тіркеуіңіз бас тартылды.'),
                'registration' => $registration,
            ];
        });
    }

    /** Күту тізімінен ойынға қосу (ұйымдастырушы жасайды): орын бар болса ғана */
    public function promote(Registration $registration): array
    {
        return DB::transaction(function () use ($registration) {
            $game = Game::whereKey($registration->game_id)->lockForUpdate()->firstOrFail();
            $registration = Registration::whereKey($registration->id)->firstOrFail();

            if ($registration->status !== Registration::WAITLIST) {
                return $this->fail(409, __('Бұл адам күту тізімінде емес.'));
            }

            $blocked = $this->noSpotReason($game, $registration->gender);
            if ($blocked !== null) {
                return $this->fail(409, $blocked);
            }

            $registration->update(['status' => Registration::ACTIVE]);

            return ['ok' => true, 'status' => 200, 'message' => __('Ойынға қосылды.'), 'registration' => $registration];
        });
    }

    /** Күту тізіміндегі орны (1-ден бастап). Күтпесе — null */
    public function waitlistPosition(Registration $registration): ?int
    {
        if ($registration->status !== Registration::WAITLIST) {
            return null;
        }

        return Registration::where('game_id', $registration->game_id)
            ->where('status', Registration::WAITLIST)
            ->where('id', '<=', $registration->id)
            ->count();
    }

    /** Орын жоқ болса — себебі (мәтін), бар болса — null. Транзакция ішінде шақырылады */
    private function noSpotReason(Game $game, string $gender): ?string
    {
        if ($game->registrations()->count() >= $game->capacity) {
            return __('Орын қалмады.');
        }

        $limit = $game->genderLimits()[$gender];
        if ($limit !== null && $game->registrations()->where('gender', $gender)->count() >= $limit) {
            $who = $gender === 'male' ? __('ұлдарға') : __('қыздарға');
            return __('Бұл форматта :who арналған орын қалмады.', ['who' => $who]);
        }

        return null;
    }

    private function fail(int $status, string $message): array
    {
        return ['ok' => false, 'status' => $status, 'message' => $message];
    }
}
