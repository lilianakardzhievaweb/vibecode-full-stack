<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Services\ActivityLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class CategoryController extends Controller
{
    // GET /api/categories - кешира се за 1 час (изчиства се автоматично при нова категория)
    public function index()
    {
        return Cache::remember(Category::CACHE_KEY, now()->addHour(), fn () => Category::orderBy('name')->get(['id', 'name', 'slug'])->toArray());
    }

    // POST /api/categories - добавяне на нова категория директно от формата
    public function store(Request $request)
    {
        $data = $request->validate(
            ['name' => ['required', 'string', 'max:100']],
            ['name.required' => 'Въведете име на категорията.']
        );

        $name = trim($data['name']);
        $slug = Str::slug($name) ?: $name;

        if (Category::where('slug', $slug)->orWhere('name', $name)->exists()) {
            throw ValidationException::withMessages(['name' => 'Тази категория вече съществува.']);
        }

        $category = Category::create(['name' => $name, 'slug' => $slug]);
        ActivityLogger::log('category.created', $category, "Добави категорията „{$name}“");

        return response()->json($category->only(['id', 'name', 'slug']), 201);
    }
}
