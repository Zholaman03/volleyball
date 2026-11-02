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
            'payment_info'  => $this->isFree() ? null : $this->payment_info, // ойыншыларға ашық тізімде көрсетілмейді
            'payment_deadline_hours' => $this->isFree() ? null : $this->payment_deadline_hours,
            'payment_deadline'       => $this->paymentDeadlineString(),
            'payment_overdue'        => $this->paymentDeadline()?->isPast() ?? false, // мерзім өтті ме (сервер уақытымен)
            'paid_count'    => $paid,
            'registrations' => RegistrationResource::collection($this->whenLoaded('registrations')),
            'waitlist'      => RegistrationResource::collection($this->whenLoaded('waitlist')),
            'cancelled'     => RegistrationResource::collection($this->whenLoaded('cancelledRegistrations')),
        ];
    }
}
