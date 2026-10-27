<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Role;
use App\Models\Tag;
use App\Models\Tool;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class ToolSeeder extends Seeder
{
    public function run(): void
    {
        $owner = User::where('email', 'owner@example.com')->first();

        $tools = [
            [
                'name' => 'Claude',
                'url' => 'https://claude.ai',
                'documentation_url' => 'https://docs.anthropic.com',
                'description' => 'AI асистент за писане, анализ и програмиране.',
                'usage' => 'Пишете въпрос или задача в чата. Може да прикачвате файлове и код.',
                'categories' => ['Чат асистенти', 'Генериране на код'],
                'roles' => ['backend', 'frontend', 'pm', 'qa', 'designer', 'data-scientist'],
                'tags' => ['chat', 'код', 'анализ'],
            ],
            [
                'name' => 'GitHub Copilot',
                'url' => 'https://github.com/features/copilot',
                'documentation_url' => 'https://docs.github.com/copilot',
                'description' => 'AI помощник за код директно в редактора.',
                'usage' => 'Инсталирайте разширението във VS Code и пишете код - Copilot предлага довършване.',
                'categories' => ['Генериране на код'],
                'roles' => ['backend', 'frontend'],
                'tags' => ['код', 'vscode'],
            ],
            [
                'name' => 'ChatGPT',
                'url' => 'https://chatgpt.com',
                'documentation_url' => 'https://platform.openai.com/docs',
                'description' => 'Чат асистент за общи въпроси, текстове и идеи.',
                'usage' => 'Задайте въпрос в чата и уточнявайте с допълнителни съобщения.',
                'categories' => ['Чат асистенти'],
                'roles' => ['pm', 'qa', 'designer'],
                'tags' => ['chat', 'текст'],
            ],
            [
                'name' => 'Midjourney',
                'url' => 'https://www.midjourney.com',
                'documentation_url' => 'https://docs.midjourney.com',
                'description' => 'Генериране на изображения от текстово описание.',
                'usage' => 'Опишете желаното изображение с думи (prompt) и изберете от вариантите.',
                'categories' => ['Изображения'],
                'roles' => ['designer'],
                'tags' => ['изображения', 'дизайн'],
            ],
            [
                'name' => 'Julius AI',
                'url' => 'https://julius.ai',
                'documentation_url' => null,
                'description' => 'Анализ на данни и графики от таблици с помощта на AI.',
                'usage' => 'Качете CSV или Excel файл и задайте въпрос за данните.',
                'categories' => ['Анализ на данни'],
                'roles' => ['data-scientist', 'pm'],
                'tags' => ['данни', 'графики'],
            ],
        ];

        foreach ($tools as $data) {
            $tool = Tool::updateOrCreate(
                ['name' => $data['name']],
                [
                    'url' => $data['url'],
                    'documentation_url' => $data['documentation_url'],
                    'description' => $data['description'],
                    'usage' => $data['usage'],
                ]
            );
            $tool->user()->associate($owner)->save();

            $tool->categories()->sync(Category::whereIn('name', $data['categories'])->pluck('id'));
            $tool->roles()->sync(Role::whereIn('slug', $data['roles'])->pluck('id'));
            $tool->tags()->sync(collect($data['tags'])->map(
                fn ($name) => Tag::firstOrCreate(['slug' => Str::slug($name)], ['name' => $name])->id
            ));
        }
    }
}
