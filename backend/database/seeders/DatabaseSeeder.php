<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Тестови акаунти - по един за всяка роля. Паролата на всички е "password".
     * Имейлът е <роля>@example.com, напр. owner@example.com (администратор).
     */
    public const TEST_USERS = [
        'owner' => 'Мария Иванова',
        'backend' => 'Георги Петров',
        'frontend' => 'Елена Димитрова',
        'pm' => 'Николай Стоянов',
        'qa' => 'Ивана Георгиева',
        'designer' => 'Петя Николова',
    ];

    public function run(): void
    {
        foreach (self::TEST_USERS as $role => $name) {
            User::updateOrCreate(
                ['email' => "$role@example.com"],
                ['name' => $name, 'password' => 'password', 'role' => $role]
            );
        }

        $this->call([
            RoleSeeder::class,
            CategorySeeder::class,
            ToolSeeder::class,
            FeedbackSeeder::class,
        ]);
    }
}
