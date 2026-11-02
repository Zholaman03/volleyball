<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class Registration extends Model
{
    public const ACTIVE = 'active';
    public const WAITLIST = 'waitlist';
    public const CANCELLED = 'cancelled';

    protected $fillable = [
        'game_id', 'name', 'phone', 'gender', 'paid',
        'status', 'cancel_token', 'cancelled_at',
    ];

    protected $casts = [
        'paid'         => 'boolean',
        'cancelled_at' => 'datetime',
    ];

    protected static function booted(): void
    {
        // Әр жаңа тіркеуге жеке бас тарту сілтемесі беріледі (қолмен қосылғандарға да)
        static::creating(function (self $registration) {
            $registration->cancel_token ??= Str::random(32);
        });
    }

    public function game(): BelongsTo
    {
        return $this->belongsTo(Game::class);
    }
}
