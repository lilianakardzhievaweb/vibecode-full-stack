<?php

namespace App\Http\Controllers;

use App\Models\Role;

class RoleController extends Controller
{
    // GET /api/roles
    public function index()
    {
        return Role::orderBy('id')->get(['id', 'name', 'slug']);
    }
}
