<?php

namespace App\Policies;

use App\Models\ToolComment;
use App\Models\User;

class ToolCommentPolicy
{
    // Коментар изтрива авторът му или owner (модерация)
    public function delete(User $user, ToolComment $comment): bool
    {
        return $user->isOwner() || $comment->user_id === $user->id;
    }
}
