<?php

namespace App\Http\Requests;

use App\Models\Tool;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ToolRequest extends FormRequest
{
    // Всеки влязъл потребител може да изпраща формата (auth:sanctum вече го проверява)
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255', Rule::unique('tools', 'name')->ignore($this->route('tool'))],
            'url' => ['required', 'url', 'max:2048'],
            'documentation_url' => ['nullable', 'url', 'max:2048'],
            'documentation' => ['nullable', 'string', 'max:50000'],
            'description' => ['required', 'string', 'max:5000'],
            'usage' => ['required', 'string', 'max:10000'],
            'examples' => ['nullable', 'string', 'max:10000'],
            'example_links' => ['nullable', 'array', 'max:10'],
            'example_links.*' => ['url', 'max:2048'],
            'video_url' => ['nullable', 'url', 'max:2048'],
            'difficulty' => ['nullable', Rule::in(Tool::DIFFICULTIES)],

            'role_ids' => ['required', 'array', 'min:1'],
            'role_ids.*' => ['integer', 'exists:roles,id'],
            'category_ids' => ['required', 'array', 'min:1'],
            'category_ids.*' => ['integer', 'exists:categories,id'],
            'tags' => ['nullable', 'array', 'max:20'],
            'tags.*' => ['string', 'max:50'],

            'images' => ['nullable', 'array', 'max:5'],
            'images.*' => ['file', 'mimes:jpg,jpeg,png,webp,gif', 'max:2048'], // до 2 MB
            'remove_image_ids' => ['nullable', 'array'],
            'remove_image_ids.*' => ['integer'],
        ];
    }

    public function messages(): array
    {
        return [
            'required' => 'Полето „:attribute“ е задължително.',
            'url' => 'Полето „:attribute“ трябва да е валиден линк (започващ с http:// или https://).',
            'unique' => 'Вече има инструмент с това име.',
            'max' => 'Полето „:attribute“ е твърде дълго или голямо.',
            'min' => 'Изберете поне една стойност за „:attribute“.',
            'mimes' => 'Позволени са само изображения: jpg, png, webp, gif.',
            'exists' => 'Избрана е несъществуваща стойност за „:attribute“.',
        ];
    }

    public function attributes(): array
    {
        return [
            'name' => 'Име',
            'url' => 'Линк',
            'documentation_url' => 'Официална документация',
            'documentation' => 'Документация (markdown)',
            'description' => 'Описание',
            'usage' => 'Как се използва',
            'examples' => 'Реални примери',
            'example_links.*' => 'Линк към пример',
            'video_url' => 'Видео',
            'role_ids' => 'Роли',
            'category_ids' => 'Категории',
            'tags.*' => 'Таг',
            'images' => 'Изображения',
            'images.*' => 'Изображение',
        ];
    }

    // Само полетата, които се записват директно в таблицата tools
    public function toolData(): array
    {
        $data = $this->safe()->only((new Tool)->getFillable());
        $data['example_links'] = array_values(array_filter($data['example_links'] ?? [])) ?: null;

        return $data;
    }
}
