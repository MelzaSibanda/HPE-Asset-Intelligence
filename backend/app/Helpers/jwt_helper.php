<?php
// app/Helpers/jwt_helper.php — pure-PHP JWT (no Composer dependency needed)

if (!function_exists('base64url_encode')) {
    function base64url_encode(string $data): string {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }
    function base64url_decode(string $data): string {
        return base64_decode(strtr($data, '-_', '+/'));
    }
}

if (!function_exists('jwt_encode')) {
    function jwt_encode(array $payload, string $secret): string {
        $header  = base64url_encode(json_encode(['alg' => 'HS256', 'typ' => 'JWT']));
        $payload = base64url_encode(json_encode($payload));
        $sig     = base64url_encode(hash_hmac('sha256', "$header.$payload", $secret, true));
        return "$header.$payload.$sig";
    }
}

if (!function_exists('jwt_decode')) {
    function jwt_decode(string $token, string $secret): ?array {
        $parts = explode('.', $token);
        if (count($parts) !== 3) return null;
        [$header, $payload, $sig] = $parts;
        $expected = base64url_encode(hash_hmac('sha256', "$header.$payload", $secret, true));
        if (!hash_equals($expected, $sig)) return null;
        $data = json_decode(base64url_decode($payload), true);
        if (!$data) return null;
        if (isset($data['exp']) && $data['exp'] < time()) return null;
        return $data;
    }
}
