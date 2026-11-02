<?php

namespace App\Http\Controllers;

use App\Models\Tool;
use App\Models\ToolComment;
use App\Services\ActivityLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class ToolCommentController extends Controller
{
    // GET /api/tools/{tool}/comments
    public function index(Request $request, Tool $tool)
    {
        abort_unless($request->user()->can('view', $tool), 404);

        return $tool->comments()->with('user:id,name,role')->latest()->limit(100)->get()
            ->map(fn (ToolComment $comment) => $this->format($comment, $request));
    }

    // POST /api/tools/{tool}/comments
    public function store(Request $request, Tool $tool)
    {
        Gate::authorize('interact', $tool);

        $data = $request->validate(
            ['body' => ['required', 'string', 'max:2000']],
            ['body.required' => 'Напишете коментар.', 'body.max' => 'Коментарът е твърде дълъг (до 2000 символа).']
        );

        $comment = $tool->comments()->create(['user_id' => $request->user()->id, 'body' => trim($data['body'])]);
        ActivityLogger::log('comment.created', $tool, "Коментира инструмента „{$tool->name}“");

        return response()->json($this->format($comment->load('user:id,name,role'), $request), 201);
    }

    // DELETE /api/comments/{comment}
    public function destroy(ToolComment $comment)
    {
        Gate::authorize('delete', $comment);

        $tool = $comment->tool;
        $comment->delete();
        ActivityLogger::log('comment.deleted', $tool, "Изтри коментар към „{$tool?->name}“");

        return response()->noContent();
    }

    private function format(ToolComment $comment, Request $request): array
    {
        return [
            'id' => $comment->id,
            'body' => $comment->body,
            'author' => $comment->user ? ['id' => $comment->user->id, 'name' => $comment->user->name, 'role' => $comment->user->role] : null,
            'can_delete' => $request->user()->can('delete', $comment),
            'created_at' => $comment->created_at,
        ];
    }
}
