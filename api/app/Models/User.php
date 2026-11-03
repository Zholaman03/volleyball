<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = ['name', 'email', 'password'];

    protected $hidden = ['password', 'remember_token'];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password'          => 'hashed',
            'is_admin'          => 'boolean',
            'approved_at'       => 'datetime',
        ];
    }

    /** Админ бекіткен ұйымдастырушы ғана ойын қоса алады */
    public function isApproved(): bool
    {
        return $this->approved_at !== null;
    }

    /** Осы ұйымдастырушының ойындары */
    public function games(): HasMany
    {
        return $this->hasMany(Game::class);
    }
}
