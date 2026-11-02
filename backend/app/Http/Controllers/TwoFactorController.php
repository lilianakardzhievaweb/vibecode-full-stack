<?php

namespace App\Http\Controllers;

use App\Services\ActivityLogger;
use App\Services\TwoFactorAuthenticator;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

/**
 * Включване и изключване на 2FA от страницата „Профил“.
 *
 * 1. POST   /api/two-factor          - генерира таен ключ и връща адреса за QR кода
 * 2. POST   /api/two-factor/confirm  - потребителят въвежда първия код, 2FA се активира
 * 3. DELETE /api/two-factor          - изключване (изисква паролата)
 */
class TwoFactorController extends Controller
{
    public function __construct(private TwoFactorAuthenticator $twoFactor)
    {
    }

    public function store(Request $request)
    {
        $user = $request->user();

        if ($user->hasTwoFactorEnabled()) {
            throw ValidationException::withMessages(['code' => '2FA вече е включена.']);
        }

        $secret = $this->twoFactor->generateSecret();
        $user->forceFill([
            'two_factor_secret' => $secret,
            'two_factor_confirmed_at' => null,
            'two_factor_recovery_codes' => null,
        ])->save();

        return [
            'secret' => $secret,
            'otpauth_url' => $this->twoFactor->otpauthUrl(config('app.name'), $user->email, $secret),
        ];
    }

    public function confirm(Request $request)
    {
        $request->validate(['code' => ['required', 'string']], ['code.required' => 'Въведете кода от приложението.']);
        $user = $request->user();

        if (! $user->two_factor_secret || $user->hasTwoFactorEnabled()) {
            throw ValidationException::withMessages(['code' => 'Първо започнете включването на 2FA.']);
        }

        if (! $this->twoFactor->verify($user->two_factor_secret, $request->input('code'))) {
            throw ValidationException::withMessages(['code' => 'Невалиден код. Проверете часа на телефона и опитайте отново.']);
        }

        $recoveryCodes = $this->twoFactor->generateRecoveryCodes();
        $user->forceFill([
            'two_factor_confirmed_at' => now(),
            'two_factor_recovery_codes' => $recoveryCodes,
        ])->save();

        ActivityLogger::log('two_factor.enabled', $user, 'Включи двуфакторна автентикация (2FA)');

        // Показват се само веднъж - потребителят трябва да ги запази
        return ['recovery_codes' => $recoveryCodes];
    }

    public function destroy(Request $request)
    {
        $request->validate(
            ['password' => ['required', 'current_password']],
            ['password.required' => 'Въведете паролата си.', 'password.current_password' => 'Грешна парола.']
        );

        $request->user()->forceFill([
            'two_factor_secret' => null,
            'two_factor_confirmed_at' => null,
            'two_factor_recovery_codes' => null,
        ])->save();

        ActivityLogger::log('two_factor.disabled', $request->user(), 'Изключи двуфакторна автентикация (2FA)');

        return response()->noContent();
    }
}
