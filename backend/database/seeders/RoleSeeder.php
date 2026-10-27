<?php

namespace Database\Seeders;

use App\Models\Role;
use Illuminate\Database\Seeder;

class RoleSeeder extends Seeder
{
    public function run(): void
    {
        // slug съвпада с колоната role на потребителите
        $roles = [
            'owner' => 'Owner',
            'backend' => 'Backend Developer',
            'frontend' => 'Frontend Developer',
            'pm' => 'Product Manager',
            'qa' => 'QA',
            'designer' => 'Designer',
            'data-scientist' => 'Data Scientist',
        ];

        foreach ($roles as $slug => $name) {
            Role::updateOrCreate(['slug' => $slug], ['name' => $name]);
        }
    }
}
