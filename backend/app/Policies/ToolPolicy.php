<?php

namespace App\Policies;

use App\Models\Tool;
use App\Models\User;

class ToolPolicy
{
    // Редактира само авторът на инструмента или потребител с роля owner
    public function update(User $user, Tool $tool): bool
    {
        return $user->role === 'owner' || $tool->user_id === $user->id;
    }

    public function delete(User $user, Tool $tool): bool
    {
        return $this->update($user, $tool);
    }
}
