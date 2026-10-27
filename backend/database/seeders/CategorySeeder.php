<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            'Чат асистенти',
            'Генериране на код',
            'Изображения',
            'Тестване',
            'Документация',
            'Анализ на данни',
        ];

        foreach ($categories as $name) {
            Category::updateOrCreate(['slug' => Str::slug($name)], ['name' => $name]);
        }
    }
}
