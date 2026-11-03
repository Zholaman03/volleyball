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

    /** Форматтың аты ағымдағы тілде (белгісіз формат болса, кодтың өзі) */
    public static function formatLabel(string $format): string
    {
        return isset(self::FORMATS[$format]) ? __(self::FORMATS[$format]) : $format;
    }

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
        'payment_info',
        'payment_deadline_hours',
        'teams_count',
        'capacity',
        'organizer_name',
    ];

    protected $casts = [
        'play_date'        => 'date',
        'duration_minutes' => 'integer',
        'price'            => 'integer',
        'payment_deadline_hours' => 'integer',
        'teams_count'      => 'integer',
        'capacity'         => 'integer',
    ];

    public function organizer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /** Ойынға қатысатындар (status = active). Орын санының барлық есебі осыны қолданады */
    public function registrations(): HasMany
    {
        return $this->hasMany(Registration::class)->where('status', Registration::ACTIVE);
    }

    /** Күту тізімі: жазылу тәртібімен */
    public function waitlist(): HasMany
    {
        return $this->hasMany(Registration::class)->where('status', Registration::WAITLIST)->orderBy('id');
    }

    /** Бас тартқандар (төлемі бар болса, ақша қайтару үшін сақталған) */
    public function cancelledRegistrations(): HasMany
    {
        return $this->hasMany(Registration::class)->where('status', Registration::CANCELLED)->orderByDesc('cancelled_at');
    }

    /** Кез келген статустағы жазбалар (бір нөмір бір ойында бір ғана жол — unique) */
    public function allRegistrations(): HasMany
    {
        return $this->hasMany(Registration::class);
    }

    /** Ойыншы бас тарта алатын соңғы уақыт: ойын басталуына осынша сағат қалғанға дейін */
    public const CANCEL_HOURS_BEFORE = 3;

    public function cancelDeadline(): Carbon
    {
        return $this->startsAt()->subHours(self::CANCEL_HOURS_BEFORE);
    }

    public function canCancel(): bool
    {
        return now()->lt($this->cancelDeadline());
    }

    /** "2026-11-05 19:00" (қолданбаның уақыт белдеуінде) */
    public function cancelDeadlineString(): string
    {
        return $this->cancelDeadline()->format('Y-m-d H:i');
    }

    /** Тегін ойын: баға 0. Төлем мәліметі мен төлем мерзімі қолданылмайды */
    public function isFree(): bool
    {
        return (int) $this->price === 0;
    }

    /** Ойынның басталу уақыты (қолданбаның уақыт белдеуінде) */
    public function startsAt(): Carbon
    {
        return Carbon::parse($this->play_date->toDateString().' '.$this->start_time);
    }

    /** Төлем мерзімі: ойын басталуына payment_deadline_hours сағат қалғанда. Мерзімсіз не тегін ойында null */
    public function paymentDeadline(): ?Carbon
    {
        if ($this->isFree() || $this->payment_deadline_hours === null) {
            return null;
        }

        return $this->startsAt()->subHours((int) $this->payment_deadline_hours);
    }

    /** API үшін мерзім: "2026-11-05 20:00" (қолданбаның уақыт белдеуінде) */
    public function paymentDeadlineString(): ?string
    {
        return $this->paymentDeadline()?->format('Y-m-d H:i');
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
