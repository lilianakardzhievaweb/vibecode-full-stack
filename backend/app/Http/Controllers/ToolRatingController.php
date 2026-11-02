<?php

namespace App\Http\Controllers;

use App\Models\Tool;
use App\Services\ActivityLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class ToolRatingController extends Controller
{
    // PUT /api/tools/{tool}/rating - създава или променя оценката на текущия потребител (1-5)
    public function update(Request $request, Tool $tool)
    {
        Gate::authorize('interact', $tool);

        $data = $request->validate(
            ['rating' => ['required', 'integer', 'between:1,5']],
            ['rating.*' => 'Оценката трябва да е между 1 и 5 звезди.']
        );

        $tool->ratings()->updateOrCreate(
            ['user_id' => $request->user()->id],
            ['rating' => $data['rating']]
        );

        ActivityLogger::log('tool.rated', $tool, "Оцени „{$tool->name}“ с {$data['rating']} ★", ['rating' => $data['rating']]);

        return [
            'average_rating' => round((float) $tool->ratings()->avg('rating'), 1),
            'ratings_count' => $tool->ratings()->count(),
            'my_rating' => (int) $data['rating'],
        ];
    }
}
