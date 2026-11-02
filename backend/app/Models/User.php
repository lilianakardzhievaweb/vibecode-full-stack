<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    // Ролите, които може да има потребител. owner е администраторът на системата.
    public const ROLES = ['owner', 'backend', 'frontend', 'pm', 'qa', 'designer'];

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
        'two_factor_secret',
        'two_factor_recovery_codes',
    ];

    // Добавя се към JSON отговора на /api/user, за да знае frontend-ът дали 2FA е включена
    protected $appends = ['two_factor_enabled'];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            // Криптирани с APP_KEY в базата
            'two_factor_secret' => 'encrypted',
            'two_factor_recovery_codes' => 'encrypted:array',
            'two_factor_confirmed_at' => 'datetime',
        ];
    }

    // AI инструментите, които потребителят е добавил
    public function tools(): HasMany
    {
        return $this->hasMany(Tool::class);
    }

    public function isOwner(): bool
    {
        return $this->role === 'owner';
    }

    public function hasRole(string ...$roles): bool
    {
        return in_array($this->role, $roles, true);
    }

    // 2FA е активна едва след като потребителят е потвърдил кода от приложението
    public function hasTwoFactorEnabled(): bool
    {
        return $this->two_factor_secret !== null && $this->two_factor_confirmed_at !== null;
    }

    public function getTwoFactorEnabledAttribute(): bool
    {
        return $this->hasTwoFactorEnabled();
    }
}
