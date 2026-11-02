<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Cache;

class Tool extends Model
{
    public const DIFFICULTIES = ['beginner', 'intermediate', 'advanced'];

    // Статуси при одобрението от администратор
    public const STATUS_PENDING = 'pending';
    public const STATUS_APPROVED = 'approved';
    public const STATUS_REJECTED = 'rejected';
    public const STATUSES = [self::STATUS_PENDING, self::STATUS_APPROVED, self::STATUS_REJECTED];

    // Ключ в кеша (Redis) за статистиките на таблото и админ панела
    public const STATS_CACHE_KEY = 'tools.stats';

    protected $fillable = [
        'name',
        'url',
        'documentation_url',
        'documentation',
        'description',
        'usage',
        'examples',
        'example_links',
        'video_url',
        'difficulty',
        'status',
        'reviewed_by',
        'reviewed_at',
        'rejection_reason',
    ];

    protected function casts(): array
    {
        return [
            'example_links' => 'array',
            'reviewed_at' => 'datetime',
        ];
    }

    // При всяка промяна на инструмент изчистваме кешираните бройки
    protected static function booted(): void
    {
        static::saved(fn () => self::flushStatsCache());
        static::deleted(fn () => self::flushStatsCache());
    }

    public static function flushStatsCache(): void
    {
        Cache::forget(self::STATS_CACHE_KEY);
    }

    // Потребителят, който е добавил инструмента
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    // Администраторът, който е одобрил/отказал инструмента
    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    public function categories(): BelongsToMany
    {
        return $this->belongsToMany(Category::class);
    }

    // Препоръчителни роли, за които инструментът е подходящ
    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(Role::class);
    }

    public function tags(): BelongsToMany
    {
        return $this->belongsToMany(Tag::class);
    }

    public function images(): HasMany
    {
        return $this->hasMany(ToolImage::class);
    }

    public function comments(): HasMany
    {
        return $this->hasMany(ToolComment::class);
    }

    public function ratings(): HasMany
    {
        return $this->hasMany(ToolRating::class);
    }

    public function isApproved(): bool
    {
        return $this->status === self::STATUS_APPROVED;
    }

    // Какво вижда потребителят: owner вижда всичко, останалите - одобрените и своите собствени.
    public function scopeVisibleTo(Builder $query, User $user): Builder
    {
        if ($user->isOwner()) {
            return $query;
        }

        return $query->where(function (Builder $q) use ($user) {
            $q->where('status', self::STATUS_APPROVED)->orWhere('user_id', $user->id);
        });
    }

    // Добавя среден рейтинг, брой оценки, брой коментари и оценката на текущия потребител.
    public function scopeWithRatingInfo(Builder $query, ?int $userId): Builder
    {
        return $query
            ->withAvg('ratings', 'rating')
            ->withCount(['ratings', 'comments'])
            ->addSelect([
                'my_rating' => ToolRating::select('rating')
                    ->whereColumn('tool_id', 'tools.id')
                    ->where('user_id', $userId)
                    ->limit(1),
            ]);
    }
}
