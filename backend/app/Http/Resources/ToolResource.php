<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ToolResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $user = $request->user();
        $canEdit = (bool) $user?->can('update', $this->resource);

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
            'status' => $this->status,
            // Причината за отказ виждат само авторът и администраторът
            'rejection_reason' => $canEdit ? $this->rejection_reason : null,
            'reviewed_at' => $this->reviewed_at,
            'author' => $this->user ? ['id' => $this->user->id, 'name' => $this->user->name] : null,
            'categories' => $this->categories->map->only(['id', 'name', 'slug']),
            'roles' => $this->roles->map->only(['id', 'name', 'slug']),
            'tags' => $this->tags->map->only(['id', 'name', 'slug']),
            'images' => $this->images->map(fn ($image) => ['id' => $image->id, 'url' => $image->url()]),
            // Рейтинг и коментари (зареждат се със scope withRatingInfo)
            'average_rating' => $this->ratings_avg_rating !== null ? round((float) $this->ratings_avg_rating, 1) : null,
            'ratings_count' => (int) ($this->ratings_count ?? 0),
            'comments_count' => (int) ($this->comments_count ?? 0),
            'my_rating' => $this->my_rating !== null ? (int) $this->my_rating : null,
            // Дали текущият потребител може да редактира/изтрива (за бутоните във фронтенда)
            'can_edit' => $canEdit,
            'created_at' => $this->created_at,
        ];
    }
}
