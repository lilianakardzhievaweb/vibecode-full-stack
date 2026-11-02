<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Services\ActivityLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Auth;

class AuthenticatedSessionController extends Controller
{
    /**
     * Вход с имейл и парола.
     *
     * - Без 2FA: влиза веднага и връща 204.
     * - С 2FA: запомня потребителя в сесията и връща {"two_factor": true}.
     *   Frontend-ът показва поле за 6-цифрения код и го праща на POST /two-factor-challenge.
     */
    public function store(LoginRequest $request): Response|JsonResponse
    {
        $user = $request->validateCredentials();

        if ($user->hasTwoFactorEnabled()) {
            $request->session()->put([
                'login.id' => $user->id,
                'login.remember' => $request->boolean('remember'),
            ]);

            return response()->json(['two_factor' => true]);
        }

        Auth::guard('web')->login($user, $request->boolean('remember'));
        $request->session()->regenerate();

        ActivityLogger::log('auth.login', $user, 'Влезе в системата', user: $user);

        return response()->noContent();
    }

    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request): Response
    {
        $user = $request->user();
        if ($user) {
            ActivityLogger::log('auth.logout', $user, 'Излезе от системата', user: $user);
        }

        Auth::guard('web')->logout();

        $request->session()->invalidate();

        $request->session()->regenerateToken();

        return response()->noContent();
    }
}
