<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\ActivityLogger;
use App\Services\TwoFactorAuthenticator;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Validation\ValidationException;

class TwoFactorChallengeController extends Controller
{
    /**
     * Втора стъпка на входа: проверява кода от Google Authenticator или резервен код.
     * Потребителят вече е въвел вярна парола (виж AuthenticatedSessionController@store).
     */
    public function store(Request $request, TwoFactorAuthenticator $twoFactor): Response
    {
        $request->validate([
            'code' => ['nullable', 'string', 'required_without:recovery_code'],
            'recovery_code' => ['nullable', 'string'],
        ], [
            'code.required_without' => 'Въведете кода от приложението.',
        ]);

        $user = User::find($request->session()->get('login.id'));
        if (! $user || ! $user->hasTwoFactorEnabled()) {
            throw ValidationException::withMessages(['code' => 'Сесията за вход изтече. Въведете отново имейл и парола.']);
        }

        // Най-много 5 грешни опита в минута
        $throttleKey = 'two-factor:'.$user->id.'|'.$request->ip();
        if (RateLimiter::tooManyAttempts($throttleKey, 5)) {
            $seconds = RateLimiter::availableIn($throttleKey);
            throw ValidationException::withMessages(['code' => "Твърде много опити. Опитайте след {$seconds} секунди."]);
        }

        if ($request->filled('recovery_code')) {
            $valid = $this->useRecoveryCode($user, trim($request->input('recovery_code')));
            $field = 'recovery_code';
        } else {
            $valid = $twoFactor->verify($user->two_factor_secret, $request->input('code'));
            $field = 'code';
        }

        if (! $valid) {
            RateLimiter::hit($throttleKey);
            throw ValidationException::withMessages([$field => 'Невалиден код. Опитайте отново.']);
        }

        RateLimiter::clear($throttleKey);
        $remember = (bool) $request->session()->pull('login.remember', false);
        $request->session()->forget('login.id');

        Auth::guard('web')->login($user, $remember);
        $request->session()->regenerate();

        ActivityLogger::log('auth.login', $user, 'Влезе в системата с 2FA', ['method' => $field], $user);

        return response()->noContent();
    }

    // Резервен код важи само веднъж - след използване го махаме
    private function useRecoveryCode(User $user, string $code): bool
    {
        $codes = $user->two_factor_recovery_codes ?? [];
        $index = array_search(strtolower($code), $codes, true);

        if ($index === false) {
            return false;
        }

        unset($codes[$index]);
        $user->forceFill(['two_factor_recovery_codes' => array_values($codes)])->save();

        return true;
    }
}
