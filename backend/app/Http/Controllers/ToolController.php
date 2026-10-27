<?php

namespace App\Http\Controllers;

use App\Http\Requests\ToolRequest;
use App\Http\Resources\ToolResource;
use App\Models\Tag;
use App\Models\Tool;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ToolController extends Controller
{
    private const RELATIONS = ['user', 'categories', 'roles', 'tags', 'images'];

    // GET /api/tools?search=&role=&category=&tag=
    public function index(Request $request)
    {
        $query = Tool::with(self::RELATIONS)->latest();

        if ($request->filled('search')) {
            $query->where('name', 'like', '%'.$request->input('search').'%');
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

        return ToolResource::collection($query->paginate(12)->withQueryString());
    }

    // POST /api/tools
    public function store(ToolRequest $request)
    {
        $tool = DB::transaction(function () use ($request) {
            $tool = $request->user()->tools()->create($request->toolData());
            $this->saveRelations($tool, $request);

            return $tool;
        });

        return (new ToolResource($tool->load(self::RELATIONS)))->response()->setStatusCode(201);
    }

    // GET /api/tools/{tool}
    public function show(Tool $tool)
    {
        return new ToolResource($tool->load(self::RELATIONS));
    }

    // PUT /api/tools/{tool} (при качване на файлове: POST с _method=PUT)
    public function update(ToolRequest $request, Tool $tool)
    {
        Gate::authorize('update', $tool);

        DB::transaction(function () use ($request, $tool) {
            $tool->update($request->toolData());
            $this->saveRelations($tool, $request);
        });

        return new ToolResource($tool->load(self::RELATIONS));
    }

    // DELETE /api/tools/{tool}
    public function destroy(Tool $tool)
    {
        Gate::authorize('delete', $tool);

        foreach ($tool->images as $image) {
            Storage::disk('public')->delete($image->path);
        }
        $tool->delete();

        return response()->noContent();
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
