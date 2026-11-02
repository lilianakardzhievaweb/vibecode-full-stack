<?php

namespace Database\Seeders;

use App\Models\Tool;
use App\Models\User;
use Illuminate\Database\Seeder;

// Примерни оценки и коментари, за да не е празна страницата на инструмента
class FeedbackSeeder extends Seeder
{
    public function run(): void
    {
        $users = User::pluck('id', 'role');

        $feedback = [
            'Claude' => [
                ['backend', 5, 'Използвам го за ревю на Laravel код и за писане на тестове. Спестява много време.'],
                ['pm', 5, 'Чудесен е за обобщения на срещи и за писане на спецификации.'],
                ['qa', 4, 'Помага да измисля тестови сценарии, но резултата винаги го проверявам.'],
            ],
            'GitHub Copilot' => [
                ['frontend', 4, 'Много добро довършване на React компоненти.'],
                ['backend', 4, null],
            ],
            'Midjourney' => [
                ['designer', 5, 'Идеален за moodboard-и и бързи визуални идеи.'],
            ],
            'ChatGPT' => [
                ['designer', 4, null],
                ['pm', 3, 'Добър за идеи, но понякога измисля факти - проверявайте.'],
            ],
        ];

        foreach ($feedback as $toolName => $entries) {
            $tool = Tool::where('name', $toolName)->first();
            if (! $tool) {
                continue;
            }

            foreach ($entries as [$role, $rating, $comment]) {
                $userId = $users[$role] ?? null;
                if (! $userId) {
                    continue;
                }

                $tool->ratings()->updateOrCreate(['user_id' => $userId], ['rating' => $rating]);
                if ($comment) {
                    $tool->comments()->firstOrCreate(['user_id' => $userId, 'body' => $comment]);
                }
            }
        }
    }
}
