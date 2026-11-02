<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use Illuminate\Http\Request;

class ActivityLogController extends Controller
{
    // GET /api/admin/activity?action=&user_id=
    public function index(Request $request)
    {
        $query = ActivityLog::with('user:id,name,role')->latest('id');

        if ($request->filled('action')) {
            // "tool" намира tool.created, tool.approved и т.н.
            $query->where('action', 'like', $request->input('action').'%');
        }
        if ($request->filled('user_id')) {
            $query->where('user_id', $request->integer('user_id'));
        }

        return $query->paginate(25)->withQueryString()->through(fn (ActivityLog $log) => [
            'id' => $log->id,
            'action' => $log->action,
            'description' => $log->description,
            'properties' => $log->properties,
            'subject_type' => $log->subject_type ? class_basename($log->subject_type) : null,
            'subject_id' => $log->subject_id,
            'user' => $log->user ? ['id' => $log->user->id, 'name' => $log->user->name, 'role' => $log->user->role] : null,
            'ip_address' => $log->ip_address,
            'created_at' => $log->created_at,
        ]);
    }
}
