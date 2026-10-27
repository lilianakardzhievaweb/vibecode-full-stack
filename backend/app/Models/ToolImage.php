<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class ToolImage extends Model
{
    protected $fillable = ['path'];

    public function tool(): BelongsTo
    {
        return $this->belongsTo(Tool::class);
    }

    // Пълен адрес на изображението, напр. http://localhost:8201/storage/tools/abc.png
    public function url(): string
    {
        return Storage::disk('public')->url($this->path);
    }
}
