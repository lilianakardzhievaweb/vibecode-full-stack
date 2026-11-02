<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Пуска заявката само ако влезлият потребител има една от изброените роли.
 *
 * Употреба в routes: ->middleware('role:owner') или ->middleware('role:owner,pm')
 */
class EnsureUserHasRole
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if (! $user) {
            abort(401, 'Моля, влезте в профила си.');
        }

        if (! $user->hasRole(...$roles)) {
            abort(403, 'Нямате достъп до тази секция.');
        }

        return $next($request);
    }
}
