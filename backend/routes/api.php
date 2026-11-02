<?php

use App\Http\Controllers\Admin\ActivityLogController;
use App\Http\Controllers\Admin\ToolModerationController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\StatsController;
use App\Http\Controllers\TagController;
use App\Http\Controllers\ToolCommentController;
use App\Http\Controllers\ToolController;
use App\Http\Controllers\ToolRatingController;
use App\Http\Controllers\TwoFactorController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// Всички API маршрути изискват вход (сесия чрез Sanctum)
Route::middleware(['auth:sanctum'])->group(function () {
    Route::get('/user', fn (Request $request) => $request->user());
    Route::put('/profile', [ProfileController::class, 'update']);

    // 2FA (Google Authenticator)
    Route::post('/two-factor', [TwoFactorController::class, 'store']);
    Route::post('/two-factor/confirm', [TwoFactorController::class, 'confirm']);
    Route::delete('/two-factor', [TwoFactorController::class, 'destroy']);

    // Статистики за таблото (кеширани)
    Route::get('/stats', [StatsController::class, 'index']);

    // AI инструменти: index, store, show, update, destroy
    Route::apiResource('tools', ToolController::class);

    // Коментари и рейтинг
    Route::get('/tools/{tool}/comments', [ToolCommentController::class, 'index']);
    Route::post('/tools/{tool}/comments', [ToolCommentController::class, 'store'])->middleware('throttle:20,1');
    Route::delete('/comments/{comment}', [ToolCommentController::class, 'destroy']);
    Route::put('/tools/{tool}/rating', [ToolRatingController::class, 'update']);

    Route::get('/categories', [CategoryController::class, 'index']);
    Route::post('/categories', [CategoryController::class, 'store']);
    Route::get('/roles', [RoleController::class, 'index']);
    Route::get('/tags', [TagController::class, 'index']);

    // Админ панел - само за роля owner (middleware EnsureUserHasRole)
    Route::middleware('role:owner')->prefix('admin')->group(function () {
        Route::get('/tools', [ToolModerationController::class, 'index']);
        Route::post('/tools/{tool}/approve', [ToolModerationController::class, 'approve']);
        Route::post('/tools/{tool}/reject', [ToolModerationController::class, 'reject']);

        Route::get('/users', [UserController::class, 'index']);
        Route::put('/users/{user}/role', [UserController::class, 'updateRole']);

        Route::get('/activity', [ActivityLogController::class, 'index']);
    });
});
