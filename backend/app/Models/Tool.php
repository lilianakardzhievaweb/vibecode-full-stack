<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Tool extends Model
{
    public const DIFFICULTIES = ['beginner', 'intermediate', 'advanced'];

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
    ];

    protected function casts(): array
    {
        return [
            'example_links' => 'array',
        ];
    }

    // Потребителят, който е добавил инструмента
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
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
}
