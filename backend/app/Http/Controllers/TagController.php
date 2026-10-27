<?php

namespace App\Http\Controllers;

use App\Models\Tag;

class TagController extends Controller
{
    // GET /api/tags
    public function index()
    {
        return Tag::orderBy('name')->get(['id', 'name', 'slug']);
    }
}
