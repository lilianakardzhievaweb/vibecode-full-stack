<?php

namespace Tests\Feature;

use App\Models\User;
use App\Services\TwoFactorAuthenticator;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TwoFactorTest extends TestCase
{
    use RefreshDatabase;

    public function test_totp_codes_match_rfc_6238_test_vectors(): void
    {
        $twoFactor = new TwoFactorAuthenticator;
        $secret = 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ'; // "12345678901234567890" в Base32

        $this->assertSame('287082', $twoFactor->currentCode($secret, 59));
        $this->assertSame('081804', $twoFactor->currentCode($secret, 1111111109));
        $this->assertSame('005924', $twoFactor->currentCode($secret, 1234567890));
        $this->assertTrue($twoFactor->verify($secret, '279037', 0, 2000000000));
        $this->assertFalse($twoFactor->verify($secret, '000000', 0, 2000000000));
    }

    public function test_user_can_enable_two_factor(): void
    {
        $user = User::factory()->create();
        $twoFactor = new TwoFactorAuthenticator;

        $secret = $this->actingAs($user)->postJson('/api/two-factor')->assertOk()->json('secret');

        $this->actingAs($user)->postJson('/api/two-factor/confirm', ['code' => '000000'])->assertUnprocessable();

        $this->actingAs($user)->postJson('/api/two-factor/confirm', ['code' => $twoFactor->currentCode($secret)])
            ->assertOk()
            ->assertJsonCount(8, 'recovery_codes');

        $this->assertTrue($user->fresh()->hasTwoFactorEnabled());
    }

    public function test_login_requires_code_when_two_factor_is_enabled(): void
    {
        $twoFactor = new TwoFactorAuthenticator;
        $secret = $twoFactor->generateSecret();
        $user = User::factory()->create();
        $user->forceFill([
            'two_factor_secret' => $secret,
            'two_factor_confirmed_at' => now(),
            'two_factor_recovery_codes' => ['aaaaa-bbbbb'],
        ])->save();

        // 1. Вярна парола - но още не е влязъл
        $this->postJson('/login', ['email' => $user->email, 'password' => 'password'])
            ->assertOk()
            ->assertJson(['two_factor' => true]);
        $this->assertGuest();

        // 2. Грешен код
        $this->postJson('/two-factor-challenge', ['code' => '000000'])->assertUnprocessable();
        $this->assertGuest();

        // 3. Верен код - влиза
        $this->postJson('/two-factor-challenge', ['code' => $twoFactor->currentCode($secret)])->assertNoContent();
        $this->assertAuthenticatedAs($user);
    }

    public function test_recovery_code_works_only_once(): void
    {
        $user = User::factory()->create();
        $user->forceFill([
            'two_factor_secret' => (new TwoFactorAuthenticator)->generateSecret(),
            'two_factor_confirmed_at' => now(),
            'two_factor_recovery_codes' => ['aaaaa-bbbbb'],
        ])->save();

        $this->postJson('/login', ['email' => $user->email, 'password' => 'password']);
        $this->postJson('/two-factor-challenge', ['recovery_code' => 'aaaaa-bbbbb'])->assertNoContent();
        $this->assertSame([], $user->fresh()->two_factor_recovery_codes);
    }

    public function test_user_can_disable_two_factor_with_password(): void
    {
        $user = User::factory()->create();
        $user->forceFill(['two_factor_secret' => 'ABC', 'two_factor_confirmed_at' => now()])->save();

        $this->actingAs($user)->deleteJson('/api/two-factor', ['password' => 'wrong'])->assertUnprocessable();
        $this->actingAs($user)->deleteJson('/api/two-factor', ['password' => 'password'])->assertNoContent();

        $this->assertFalse($user->fresh()->hasTwoFactorEnabled());
    }
}
