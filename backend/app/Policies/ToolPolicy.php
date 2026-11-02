<?php

namespace App\Policies;

use App\Models\Tool;
use App\Models\User;

class ToolPolicy
{
    // Одобрените инструменти се виждат от всички. Чакащите и отказаните - само от автора и owner.
    public function view(User $user, Tool $tool): bool
    {
        return $tool->isApproved() || $this->update($user, $tool);
    }

    // Редактира само авторът на инструмента или потребител с роля owner
    public function update(User $user, Tool $tool): bool
    {
        return $user->isOwner() || $tool->user_id === $user->id;
    }

    public function delete(User $user, Tool $tool): bool
    {
        return $this->update($user, $tool);
    }

    // Коментари и оценки се пишат само за одобрени инструменти
    public function interact(User $user, Tool $tool): bool
    {
        return $tool->isApproved();
    }
}
