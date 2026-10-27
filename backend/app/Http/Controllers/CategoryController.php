<?php

namespace App\Http\Controllers;

use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class CategoryController extends Controller
{
    // GET /api/categories
    public function index()
    {
        return Category::orderBy('name')->get(['id', 'name', 'slug']);
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

        return response()->json(Category::create(['name' => $name, 'slug' => $slug])->only(['id', 'name', 'slug']), 201);
    }
}
