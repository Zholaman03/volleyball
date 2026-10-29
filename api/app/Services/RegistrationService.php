<?php

namespace App\Services;

use App\Models\Game;
use Illuminate\Support\Facades\DB;

/**
 * Ойынға қатысушы қосудың бір ортақ логикасы.
 * Қолданушы өзін тіркегенде де, ұйымдастырушы қолмен қосқанда да осы қолданылады.
 */
class RegistrationService
{
    public static function normalizePhone(string $phone): string
    {
        return preg_replace('/[^\d+]/', '', $phone);
    }

    /**
     * @param  array{name: string, phone: string, gender: string}  $data  (phone нормаланған болуы керек)
     * @return array{ok: bool, status: int, message: string, registration?: \App\Models\Registration, registered_count?: int, capacity?: int}
     */
    public function register(Game $game, array $data, bool $paid = false): array
    {
        // Соңғы орынға екі адам бір мезгілде тіркелмеуі үшін транзакция + lock
        return DB::transaction(function () use ($game, $data, $paid) {
            $game = Game::whereKey($game->id)->lockForUpdate()->firstOrFail();

            if ($game->play_date->lt(today())) {
                return $this->fail(422, 'Бұл ойын өтіп кеткен.');
            }

            if ($game->registrations()->where('phone', $data['phone'])->exists()) {
                return $this->fail(409, 'Бұл нөмір осы ойынға тіркелген.');
            }

            $total = $game->registrations()->count();
            if ($total >= $game->capacity) {
                return $this->fail(409, 'Орын қалмады.');
            }

            $limit = $game->genderLimits()[$data['gender']];
            if ($limit !== null) {
                $sameGender = $game->registrations()->where('gender', $data['gender'])->count();
                if ($sameGender >= $limit) {
                    $who = $data['gender'] === 'male' ? 'ұлдарға' : 'қыздарға';
                    return $this->fail(409, "Бұл форматта {$who} арналған орын қалмады.");
                }
            }

            $registration = $game->registrations()->create($data + ['paid' => $paid]);

            return [
                'ok'               => true,
                'status'           => 201,
                'message'          => 'Сәтті тіркелдіңіз!',
                'registration'     => $registration,
                'registered_count' => $total + 1,
                'capacity'         => $game->capacity,
            ];
        });
    }

    private function fail(int $status, string $message): array
    {
        return ['ok' => false, 'status' => $status, 'message' => $message];
    }
}
