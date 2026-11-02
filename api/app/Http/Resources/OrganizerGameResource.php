<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;

/** Ұйымдастырушыға арналған ойын: төленгендер саны және қатысушылар тізімі қосылады */
class OrganizerGameResource extends GameResource
{
    public function toArray(Request $request): array
    {
        $paid = $this->paid_count ?? $this->registrations()->where('paid', true)->count();

        return parent::toArray($request) + [
            'payment_info'  => $this->payment_info, // ойыншыларға ашық тізімде көрсетілмейді
            'paid_count'    => $paid,
            'registrations' => RegistrationResource::collection($this->whenLoaded('registrations')),
        ];
    }
}
