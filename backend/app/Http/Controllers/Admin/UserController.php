<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\ActivityLogger;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class UserController extends Controller
{
    // GET /api/admin/users
    public function index()
    {
        return User::withCount('tools')->orderBy('id')->get()->map(fn (User $user) => [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role,
            'two_factor_enabled' => $user->hasTwoFactorEnabled(),
            'tools_count' => $user->tools_count,
            'created_at' => $user->created_at,
        ]);
    }

    // PUT /api/admin/users/{user}/role  { role: "qa" }
    public function updateRole(Request $request, User $user)
    {
        $data = $request->validate(
            ['role' => ['required', Rule::in(User::ROLES)]],
            ['role.*' => 'Изберете валидна роля.']
        );

        // Защита: администраторът не може сам да си махне правата
        if ($user->is($request->user()) && $data['role'] !== 'owner') {
            throw ValidationException::withMessages(['role' => 'Не можете да смените собствената си роля.']);
        }

        $oldRole = $user->role;
        $user->update(['role' => $data['role']]);

        ActivityLogger::log('user.role_changed', $user, "Смени ролята на {$user->name}: {$oldRole} → {$data['role']}", [
            'from' => $oldRole,
            'to' => $data['role'],
        ]);

        return ['id' => $user->id, 'role' => $user->role];
    }
}
