<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Controllers\StatsController;
use App\Http\Controllers\ToolController;
use App\Http\Resources\ToolResource;
use App\Models\Tool;
use App\Services\ActivityLogger;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/**
 * Админ панел: всички инструменти, одобрение и отказ.
 * Достъпен само за роля owner (middleware "role:owner" в routes/api.php).
 */
class ToolModerationController extends Controller
{
    // GET /api/admin/tools?status=&category=&role=&search=
    public function index(Request $request)
    {
        $request->validate(['status' => ['nullable', Rule::in(Tool::STATUSES)]]);

        $query = Tool::with([...ToolController::RELATIONS, 'reviewer:id,name'])
            ->withRatingInfo($request->user()->id)
            // Чакащите са най-отгоре, после най-новите
            ->orderByRaw('CASE WHEN status = ? THEN 0 ELSE 1 END', [Tool::STATUS_PENDING])
            ->latest();

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }
        if ($request->filled('search')) {
            $query->where('name', 'like', '%'.$request->input('search').'%');
        }
        if ($request->filled('category')) {
            $query->whereHas('categories', fn ($q) => $q->where('slug', $request->input('category')));
        }
        if ($request->filled('role')) {
            $query->whereHas('roles', fn ($q) => $q->where('slug', $request->input('role')));
        }

        return ToolResource::collection($query->paginate(15)->withQueryString())
            ->additional(['counts' => StatsController::cachedStats()['by_status']]);
    }

    // POST /api/admin/tools/{tool}/approve
    public function approve(Request $request, Tool $tool)
    {
        $tool->update([
            'status' => Tool::STATUS_APPROVED,
            'reviewed_by' => $request->user()->id,
            'reviewed_at' => now(),
            'rejection_reason' => null,
        ]);

        ActivityLogger::log('tool.approved', $tool, "Одобри инструмента „{$tool->name}“");

        return new ToolResource($tool->load(ToolController::RELATIONS));
    }

    // POST /api/admin/tools/{tool}/reject  { reason?: string }
    public function reject(Request $request, Tool $tool)
    {
        $data = $request->validate(
            ['reason' => ['nullable', 'string', 'max:500']],
            ['reason.max' => 'Причината е твърде дълга (до 500 символа).']
        );

        $tool->update([
            'status' => Tool::STATUS_REJECTED,
            'reviewed_by' => $request->user()->id,
            'reviewed_at' => now(),
            'rejection_reason' => $data['reason'] ?? null,
        ]);

        ActivityLogger::log('tool.rejected', $tool, "Отказа инструмента „{$tool->name}“", array_filter(['reason' => $data['reason'] ?? null]));

        return new ToolResource($tool->load(ToolController::RELATIONS));
    }
}
