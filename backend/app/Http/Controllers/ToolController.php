<?php

namespace App\Http\Controllers;

use App\Http\Requests\ToolRequest;
use App\Http\Resources\ToolResource;
use App\Models\Tag;
use App\Models\Tool;
use App\Services\ActivityLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ToolController extends Controller
{
    public const RELATIONS = ['user', 'categories', 'roles', 'tags', 'images'];

    // GET /api/tools?search=&role=&category=&tag=&sort=&mine=1
    public function index(Request $request)
    {
        $user = $request->user();

        $query = Tool::with(self::RELATIONS)
            ->visibleTo($user)
            ->withRatingInfo($user->id);

        // mine=1 - само моите инструменти (за страницата „Профил“), с всички статуси
        if ($request->boolean('mine')) {
            $query->where('user_id', $user->id);
        } else {
            // В общия списък показваме само одобрените инструменти
            $query->where('status', Tool::STATUS_APPROVED);
        }

        if ($request->filled('search')) {
            $search = '%'.$request->input('search').'%';
            $query->where(fn ($q) => $q->where('name', 'like', $search)->orWhere('description', 'like', $search));
        }
        if ($request->filled('role')) {
            $query->whereHas('roles', fn ($q) => $q->where('slug', $request->input('role')));
        }
        if ($request->filled('category')) {
            $query->whereHas('categories', fn ($q) => $q->where('slug', $request->input('category')));
        }
        if ($request->filled('tag')) {
            $query->whereHas('tags', fn ($q) => $q->where('slug', $request->input('tag')));
        }

        match ($request->input('sort')) {
            'rating' => $query->orderByDesc('ratings_avg_rating')->orderByDesc('ratings_count'),
            'name' => $query->orderBy('name'),
            default => $query->latest(),
        };

        $perPage = min(max((int) $request->input('per_page', 12), 1), 50);

        return ToolResource::collection($query->paginate($perPage)->withQueryString());
    }

    // POST /api/tools
    public function store(ToolRequest $request)
    {
        $user = $request->user();

        $tool = DB::transaction(function () use ($request, $user) {
            $data = $request->toolData();

            // Инструментите от owner се публикуват веднага, останалите чакат одобрение
            if ($user->isOwner()) {
                $data += ['status' => Tool::STATUS_APPROVED, 'reviewed_by' => $user->id, 'reviewed_at' => now()];
            } else {
                $data['status'] = Tool::STATUS_PENDING;
            }

            $tool = $user->tools()->create($data);
            $this->saveRelations($tool, $request);

            return $tool;
        });

        Tool::flushStatsCache();
        ActivityLogger::log('tool.created', $tool, "Добави инструмента „{$tool->name}“", ['status' => $tool->status]);

        return (new ToolResource($this->loadTool($tool, $user->id)))->response()->setStatusCode(201);
    }

    // GET /api/tools/{tool}
    public function show(Request $request, Tool $tool)
    {
        // Чакащ или отказан инструмент виждат само авторът и owner. Останалите получават 404.
        abort_unless($request->user()->can('view', $tool), 404, 'Инструментът не е намерен.');

        return new ToolResource($this->loadTool($tool, $request->user()->id));
    }

    // PUT /api/tools/{tool} (при качване на файлове: POST с _method=PUT)
    public function update(ToolRequest $request, Tool $tool)
    {
        Gate::authorize('update', $tool);

        DB::transaction(function () use ($request, $tool) {
            $data = $request->toolData();

            // Отказан инструмент, който авторът е поправил, се изпраща отново за одобрение
            if ($tool->status === Tool::STATUS_REJECTED && ! $request->user()->isOwner()) {
                $data += ['status' => Tool::STATUS_PENDING, 'rejection_reason' => null, 'reviewed_by' => null, 'reviewed_at' => null];
            }

            $tool->update($data);
            $this->saveRelations($tool, $request);
        });

        Tool::flushStatsCache();
        ActivityLogger::log('tool.updated', $tool, "Редактира инструмента „{$tool->name}“");

        return new ToolResource($this->loadTool($tool, $request->user()->id));
    }

    // DELETE /api/tools/{tool}
    public function destroy(Tool $tool)
    {
        Gate::authorize('delete', $tool);

        foreach ($tool->images as $image) {
            Storage::disk('public')->delete($image->path);
        }
        $tool->delete();

        ActivityLogger::log('tool.deleted', $tool, "Изтри инструмента „{$tool->name}“", ['name' => $tool->name]);

        return response()->noContent();
    }

    // Зарежда инструмента наново с всички връзки, рейтинга и броя коментари
    private function loadTool(Tool $tool, int $userId): Tool
    {
        return Tool::with(self::RELATIONS)->withRatingInfo($userId)->findOrFail($tool->id);
    }

    // Записва категориите, ролите, таговете и изображенията на инструмента
    private function saveRelations(Tool $tool, ToolRequest $request): void
    {
        $tool->categories()->sync($request->input('category_ids', []));
        $tool->roles()->sync($request->input('role_ids', []));
        $tool->tags()->sync($this->tagIds($request->input('tags', [])));

        // Премахване на избраните стари изображения
        $toRemove = $tool->images()->whereIn('id', $request->input('remove_image_ids', []))->get();
        foreach ($toRemove as $image) {
            Storage::disk('public')->delete($image->path);
            $image->delete();
        }

        // Качване на новите изображения в storage/app/public/tools
        foreach ($request->file('images', []) as $file) {
            $tool->images()->create(['path' => $file->store('tools', 'public')]);
        }
    }

    // Превръща имената на таговете в ID-та, като създава липсващите
    private function tagIds(array $names): array
    {
        return collect($names)
            ->map(fn ($name) => trim($name))
            ->filter()
            ->unique(fn ($name) => Str::slug($name) ?: $name)
            ->map(fn ($name) => Tag::firstOrCreate(['slug' => Str::slug($name) ?: $name], ['name' => $name])->id)
            ->values()
            ->all();
    }
}
