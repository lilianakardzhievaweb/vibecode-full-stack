<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Support\Facades\Cache;

class Category extends Model
{
    // Ключ в кеша (Redis) за списъка с категории
    public const CACHE_KEY = 'categories.all';

    protected $fillable = ['name', 'slug'];

    // Списъкът се кешира, затова го изчистваме при всяка промяна
    protected static function booted(): void
    {
        static::saved(fn () => Cache::forget(self::CACHE_KEY));
        static::deleted(fn () => Cache::forget(self::CACHE_KEY));
    }

    public function tools(): BelongsToMany
    {
        return $this->belongsToMany(Tool::class);
    }
}
