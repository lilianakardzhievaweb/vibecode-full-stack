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

        // Одобрени инструменти, добавени от администратора (owner)
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
            $this->createTool($data, $owner, Tool::STATUS_APPROVED, $owner);
        }

        // Предложения от други потребители - чакат одобрение в админ панела
        $this->createTool([
            'name' => 'v0 by Vercel',
            'url' => 'https://v0.dev',
            'documentation_url' => 'https://v0.dev/docs',
            'description' => 'Генерира React + Tailwind компоненти от текстово описание или скрийншот.',
            'usage' => 'Опишете интерфейса (напр. „табло с карти и графика“) и копирайте генерирания код в проекта.',
            'difficulty' => 'beginner',
            'categories' => ['Генериране на код'],
            'roles' => ['frontend', 'designer'],
            'tags' => ['ui', 'react', 'tailwind'],
        ], User::where('email', 'frontend@example.com')->first(), Tool::STATUS_PENDING);

        $this->createTool([
            'name' => 'Figma AI',
            'url' => 'https://www.figma.com/ai/',
            'documentation_url' => 'https://help.figma.com',
            'description' => 'AI функции във Figma: генериране на макети, преименуване на слоеве и текстове.',
            'usage' => 'Във Figma отворете менюто Actions и изберете AI функцията, която ви трябва.',
            'difficulty' => 'beginner',
            'categories' => ['Изображения'],
            'roles' => ['designer'],
            'tags' => ['дизайн', 'макети'],
        ], User::where('email', 'designer@example.com')->first(), Tool::STATUS_PENDING);

        // Отказано предложение - авторът вижда причината и може да го поправи
        $this->createTool([
            'name' => 'Testim',
            'url' => 'https://www.testim.io',
            'documentation_url' => null,
            'description' => 'Автоматизирани UI тестове.',
            'usage' => 'Записвате сценарий в браузъра.',
            'difficulty' => 'intermediate',
            'categories' => ['Тестване'],
            'roles' => ['qa'],
            'tags' => ['тестове'],
        ], User::where('email', 'qa@example.com')->first(), Tool::STATUS_REJECTED, $owner,
            'Моля, добавете повече подробности в „Как се използва“ и линк към документацията.');
    }

    private function createTool(array $data, ?User $author, string $status, ?User $reviewer = null, ?string $reason = null): void
    {
        $tool = Tool::updateOrCreate(
            ['name' => $data['name']],
            [
                'url' => $data['url'],
                'documentation_url' => $data['documentation_url'],
                'description' => $data['description'],
                'usage' => $data['usage'],
                'difficulty' => $data['difficulty'] ?? null,
                'status' => $status,
                'reviewed_by' => $reviewer?->id,
                'reviewed_at' => $reviewer ? now() : null,
                'rejection_reason' => $reason,
            ]
        );
        $tool->user()->associate($author)->save();

        $tool->categories()->sync(Category::whereIn('name', $data['categories'])->pluck('id'));
        $tool->roles()->sync(Role::whereIn('slug', $data['roles'])->pluck('id'));
        $tool->tags()->sync(collect($data['tags'])->map(
            fn ($name) => Tag::firstOrCreate(['slug' => Str::slug($name)], ['name' => $name])->id
        ));
    }
}
