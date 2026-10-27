<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $roles = ['owner', 'backend', 'frontend', 'pm', 'qa', 'designer'];

        foreach ($roles as $role) {
            User::updateOrCreate(
                ['email' => "$role@example.com"],
                ['name' => ucfirst($role), 'password' => 'password', 'role' => $role]
            );
        }

        $this->call([
            RoleSeeder::class,
            CategorySeeder::class,
            ToolSeeder::class,
        ]);
    }
}
