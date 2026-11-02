<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Tool;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class StatsController extends Controller
{
    // GET /api/stats - числата за таблото. Общите бройки са кеширани (Redis), личните - не.
    public function index(Request $request)
    {
        $user = $request->user();
        $stats = self::cachedStats();

        return [
            'tools_total' => $stats['by_status'][Tool::STATUS_APPROVED],
            'categories_total' => $stats['categories_total'],
            'top_categories' => $stats['top_categories'],
            // Колко чакат одобрение виждат само администраторите
            'pending_total' => $user->isOwner() ? $stats['by_status'][Tool::STATUS_PENDING] : null,
            'my_tools_total' => $user->tools()->count(),
            'cached_at' => $stats['cached_at'],
        ];
    }

    /**
     * Брой инструменти по статус и по категория. Кешира се за 10 минути и се изчиства
     * автоматично при всяка промяна на инструмент (виж Tool::flushStatsCache).
     */
    public static function cachedStats(): array
    {
        return Cache::remember(Tool::STATS_CACHE_KEY, now()->addMinutes(10), function () {
            $byStatus = Tool::query()
                ->selectRaw('status, count(*) as total')
                ->groupBy('status')
                ->pluck('total', 'status');

            return [
                'by_status' => collect(Tool::STATUSES)->mapWithKeys(fn ($s) => [$s => (int) ($byStatus[$s] ?? 0)])->all(),
                'categories_total' => Category::count(),
                'top_categories' => Category::withCount(['tools' => fn ($q) => $q->where('status', Tool::STATUS_APPROVED)])
                    ->orderByDesc('tools_count')
                    ->limit(5)
                    ->get(['id', 'name', 'slug'])
                    ->map(fn ($c) => ['id' => $c->id, 'name' => $c->name, 'slug' => $c->slug, 'tools_count' => $c->tools_count])
                    ->all(),
                'cached_at' => now()->toIso8601String(),
            ];
        });
    }
}
