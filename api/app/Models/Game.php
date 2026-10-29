<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Game extends Model
{
    public const FORMATS = [
        'mixed' => 'Аралас (қыз-бала)',
        'girls' => 'Тек қыздар',
        'boys'  => 'Тек ұлдар',
        '4_2'   => '4/2 (4 ұл, 2 қыз)',
        '2_4'   => '2/4 (2 ұл, 4 қыз)',
    ];

    /** Бір командадағы ойыншы саны */
    public const TEAM_SIZE = 6;

    protected $fillable = [
        'user_id',
        'title',
        'format',
        'play_date',
        'start_time',
        'duration_minutes',
        'venue_name',
        'venue_address',
        'price',
        'teams_count',
        'capacity',
        'organizer_name',
    ];

    protected $casts = [
        'play_date'        => 'date',
        'duration_minutes' => 'integer',
        'price'            => 'integer',
        'teams_count'      => 'integer',
        'capacity'         => 'integer',
    ];

    public function organizer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function registrations(): HasMany
    {
        return $this->hasMany(Registration::class);
    }

    /** Ойын аяқталатын уақыт, мысалы 22:00 + 120 минут = 00:00 */
    public function endTime(): string
    {
        return Carbon::parse($this->start_time)
            ->addMinutes($this->duration_minutes)
            ->format('H:i');
    }

    /**
     * Формат бойынша жыныс лимиттері.
     * null — шектеу жоқ (аралас формат).
     *
     * @return array{male: int|null, female: int|null}
     */
    public function genderLimits(): array
    {
        return match ($this->format) {
            'boys'  => ['male' => $this->capacity, 'female' => 0],
            'girls' => ['male' => 0, 'female' => $this->capacity],
            '4_2'   => ['male' => $this->teams_count * 4, 'female' => $this->teams_count * 2],
            '2_4'   => ['male' => $this->teams_count * 2, 'female' => $this->teams_count * 4],
            default => ['male' => null, 'female' => null],
        };
    }
}
