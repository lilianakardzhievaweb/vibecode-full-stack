<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ToolResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'url' => $this->url,
            'documentation_url' => $this->documentation_url,
            'documentation' => $this->documentation,
            'description' => $this->description,
            'usage' => $this->usage,
            'examples' => $this->examples,
            'example_links' => $this->example_links ?? [],
            'video_url' => $this->video_url,
            'difficulty' => $this->difficulty,
            'author' => $this->user ? ['id' => $this->user->id, 'name' => $this->user->name] : null,
            'categories' => $this->categories->map->only(['id', 'name', 'slug']),
            'roles' => $this->roles->map->only(['id', 'name', 'slug']),
            'tags' => $this->tags->map->only(['id', 'name', 'slug']),
            'images' => $this->images->map(fn ($image) => ['id' => $image->id, 'url' => $image->url()]),
            // Дали текущият потребител може да редактира/изтрива (за бутоните във фронтенда)
            'can_edit' => (bool) $request->user()?->can('update', $this->resource),
            'created_at' => $this->created_at,
        ];
    }
}
