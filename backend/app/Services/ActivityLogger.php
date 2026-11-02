<?php

namespace App\Services;

use App\Models\ActivityLog;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;

/**
 * Записва действие в одит лога.
 *
 * Пример:
 *   ActivityLogger::log('tool.created', $tool, "Добави инструмента „{$tool->name}“");
 */
class ActivityLogger
{
    public static function log(
        string $action,
        ?Model $subject,
        string $description,
        array $properties = [],
        ?User $user = null,
    ): ActivityLog {
        $user ??= auth()->user();

        return ActivityLog::create([
            'user_id' => $user?->id,
            'action' => $action,
            'subject_type' => $subject?->getMorphClass(),
            'subject_id' => $subject?->getKey(),
            'description' => $description,
            'properties' => $properties ?: null,
            'ip_address' => request()?->ip(),
        ]);
    }
}
