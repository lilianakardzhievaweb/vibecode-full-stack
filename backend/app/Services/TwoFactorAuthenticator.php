<?php

namespace App\Services;

use Illuminate\Support\Str;

/**
 * Двуфакторна автентикация по стандарта TOTP (RFC 6238) - същият, който използва Google Authenticator.
 *
 * Как работи:
 * 1. Сървърът генерира таен ключ (secret) и го показва като QR код.
 * 2. Потребителят го сканира с Google Authenticator (или Microsoft Authenticator, Authy...).
 * 3. Приложението и сървърът изчисляват един и същ 6-цифрен код от ключа и текущото време
 *    (сменя се на всеки 30 секунди). При вход сървърът сравнява кода, който въвежда потребителят.
 */
class TwoFactorAuthenticator
{
    private const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    private const PERIOD = 30;  // секунди за един код
    private const DIGITS = 6;

    // Таен ключ: 20 случайни байта (160 бита), записани в Base32 (32 символа)
    public function generateSecret(): string
    {
        return $this->base32Encode(random_bytes(20));
    }

    // Адресът, който се кодира в QR кода. Authenticator приложенията го разпознават.
    public function otpauthUrl(string $issuer, string $accountName, string $secret): string
    {
        $label = rawurlencode($issuer).':'.rawurlencode($accountName);

        return 'otpauth://totp/'.$label.'?'.http_build_query([
            'secret' => $secret,
            'issuer' => $issuer,
            'algorithm' => 'SHA1',
            'digits' => self::DIGITS,
            'period' => self::PERIOD,
        ], '', '&', PHP_QUERY_RFC3986);
    }

    // Кодът за даден момент (по подразбиране - сега)
    public function currentCode(string $secret, ?int $timestamp = null): string
    {
        return $this->codeForCounter($secret, intdiv($timestamp ?? time(), self::PERIOD));
    }

    /**
     * Проверява 6-цифрения код. $window = 1 приема и предишния/следващия код,
     * за да не пречи малка разлика в часовника на телефона.
     */
    public function verify(string $secret, string $code, int $window = 1, ?int $timestamp = null): bool
    {
        $code = preg_replace('/\s+/', '', $code);
        if (! preg_match('/^\d{'.self::DIGITS.'}$/', $code)) {
            return false;
        }

        $counter = intdiv($timestamp ?? time(), self::PERIOD);
        for ($i = -$window; $i <= $window; $i++) {
            if (hash_equals($this->codeForCounter($secret, $counter + $i), $code)) {
                return true;
            }
        }

        return false;
    }

    // Резервни кодове за вход, ако потребителят загуби телефона си (всеки важи веднъж)
    public function generateRecoveryCodes(int $count = 8): array
    {
        return collect(range(1, $count))
            ->map(fn () => Str::lower(Str::random(5).'-'.Str::random(5)))
            ->all();
    }

    // HOTP (RFC 4226): HMAC-SHA1 от брояча, "динамично отрязване" и последните 6 цифри
    private function codeForCounter(string $secret, int $counter): string
    {
        $key = $this->base32Decode($secret);
        $binaryCounter = pack('N*', 0, $counter); // 8 байта, big-endian
        $hash = hash_hmac('sha1', $binaryCounter, $key, true);

        $offset = ord($hash[19]) & 0x0F;
        $value = ((ord($hash[$offset]) & 0x7F) << 24)
            | ((ord($hash[$offset + 1]) & 0xFF) << 16)
            | ((ord($hash[$offset + 2]) & 0xFF) << 8)
            | (ord($hash[$offset + 3]) & 0xFF);

        return str_pad((string) ($value % (10 ** self::DIGITS)), self::DIGITS, '0', STR_PAD_LEFT);
    }

    private function base32Encode(string $bytes): string
    {
        $bits = '';
        foreach (str_split($bytes) as $char) {
            $bits .= str_pad(decbin(ord($char)), 8, '0', STR_PAD_LEFT);
        }

        $result = '';
        foreach (str_split($bits, 5) as $chunk) {
            $result .= self::BASE32_ALPHABET[bindec(str_pad($chunk, 5, '0'))];
        }

        return $result;
    }

    private function base32Decode(string $secret): string
    {
        $secret = strtoupper(preg_replace('/[\s=]+/', '', $secret));
        $bits = '';
        foreach (str_split($secret) as $char) {
            $position = strpos(self::BASE32_ALPHABET, $char);
            if ($position === false) {
                continue;
            }
            $bits .= str_pad(decbin($position), 5, '0', STR_PAD_LEFT);
        }

        $bytes = '';
        foreach (str_split($bits, 8) as $byte) {
            if (strlen($byte) === 8) {
                $bytes .= chr(bindec($byte));
            }
        }

        return $bytes;
    }
}
