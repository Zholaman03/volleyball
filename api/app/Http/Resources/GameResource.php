<?php

namespace App\Http\Resources;

use App\Models\Game;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Game */
class GameResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $registered = $this->registrations_count ?? $this->registrations()->count();
        $male = $this->male_count ?? $this->registrations()->where('gender', 'male')->count();
        $female = $this->female_count ?? $this->registrations()->where('gender', 'female')->count();
        $limits = $this->genderLimits();

        return [
            'id'               => $this->id,
            'title'            => $this->title,
            'format'           => $this->format,
            'format_label'     => Game::formatLabel($this->format),
            'play_date'        => $this->play_date->toDateString(),
            'start_time'       => substr($this->start_time, 0, 5),
            'end_time'         => $this->endTime(),
            'duration_minutes' => $this->duration_minutes,
            'venue_name'       => $this->venue_name,
            'venue_address'    => $this->venue_address,
            'price'            => $this->price,
            'is_free'          => $this->isFree(),
            'teams_count'      => $this->teams_count,
            'capacity'         => $this->capacity,
            'registered_count' => $registered,
            'is_full'          => $registered >= $this->capacity,
            'waitlist_count'   => $this->waitlist_count ?? $this->waitlist()->count(),
            'male'             => ['registered' => $male, 'limit' => $limits['male']],
            'female'           => ['registered' => $female, 'limit' => $limits['female']],
            'organizer_name'   => $this->organizer_name,
            // Ойын жаңалықтары (бас тартылды, уақыты ауысты) жарияланатын WhatsApp тобы
            'whatsapp_group_url' => $this->organizer?->whatsapp_group_url,
        ];
    }
}
