<?php

namespace App\Http\Controllers;

use App\Models\Registration;
use App\Services\RegistrationService;
use Illuminate\Http\JsonResponse;

/**
 * Аккаунтсыз ойыншының өз тіркеуі: тіркелгенде берілген құпия сілтеме (cancel_token) арқылы.
 * Токенді білген адам ғана көре алады және бас тарта алады.
 */
class RegistrationController extends Controller
{
    /** GET /api/registrations/{token} */
    public function show(string $token, RegistrationService $service): JsonResponse
    {
        return response()->json(['data' => $this->payload($this->find($token), $service)]);
    }

    /** POST /api/registrations/{token}/cancel */
    public function cancel(string $token, RegistrationService $service): JsonResponse
    {
        $result = $service->cancel($this->find($token));

        if (! $result['ok']) {
            return response()->json(['message' => $result['message']], $result['status']);
        }

        return response()->json([
            'message' => $result['message'],
            'data'    => $this->payload($result['registration'], $service),
        ]);
    }

    private function find(string $token): Registration
    {
        return Registration::with('game')->where('cancel_token', $token)->firstOrFail();
    }

    private function payload(Registration $registration, RegistrationService $service): array
    {
        $game = $registration->game;
        $status = $registration->status;

        $canCancel = match ($status) {
            Registration::ACTIVE   => $game->canCancel(),
            Registration::WAITLIST => ! $game->startsAt()->isPast(),
            default                => false,
        };

        return [
            'name'              => $registration->name,
            'status'            => $status,
            'paid'              => (bool) $registration->paid,
            'waitlist_position' => $service->waitlistPosition($registration),
            'can_cancel'        => $canCancel,
            'cancel_deadline'   => $game->cancelDeadlineString(),
            'game'              => [
                'id'             => $game->id,
                'format_label'   => \App\Models\Game::formatLabel($game->format),
                'play_date'      => $game->play_date->toDateString(),
                'start_time'     => substr($game->start_time, 0, 5),
                'end_time'       => $game->endTime(),
                'venue_name'     => $game->venue_name,
                'venue_address'  => $game->venue_address,
                'organizer_name' => $game->organizer_name,
            ],
        ];
    }
}
