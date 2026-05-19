<?php

namespace App\Controllers\Api;

use App\Models\UserModel;

class Auth extends BaseApiController
{
    public function login()
    {
        helper('jwt');

        $body = $this->body();

        // Validate input
        if ($err = $this->validate2([
            'email'    => 'required|valid_email',
            'password' => 'required|min_length[6]',
        ], $body)) {
            return $err;
        }

        // Rate-limit: max 10 login attempts per minute per IP
        $throttler = \Config\Services::throttler();
        // Sanitize IP — colons in IPv6 are reserved in cache keys
        $key = 'login_' . preg_replace('/[^a-zA-Z0-9_]/', '_', $this->request->getIPAddress());
        if ($throttler->check($key, 10, MINUTE) === false) {
            return $this->respond([
                'status'  => 'error',
                'message' => 'Too many login attempts. Try again in ' . $throttler->getTokenTime() . ' seconds.',
            ], 429);
        }

        $userModel = new UserModel();
        $user      = $userModel->findByEmail($body['email']);

        if (!$user || !$userModel->verifyPassword($body['password'], $user['password_hash'])) {
            return $this->respond(['status' => 'error', 'message' => 'Invalid credentials'], 401);
        }

        $secret  = env('JWT_SECRET', 'hpe-asset-intel-secret-key-2026');
        $now     = time();
        $payload = [
            'sub'      => $user['id'],
            'email'    => $user['email'],
            'name'     => $user['name'],
            'initials' => $user['initials'],
            'role'     => $user['role'],
            'iat'      => $now,
            'exp'      => $now + 60 * 60 * 8,
        ];

        return $this->ok([
            'token' => jwt_encode($payload, $secret),
            'user'  => [
                'id'       => $user['id'],
                'email'    => $user['email'],
                'name'     => $user['name'],
                'initials' => $user['initials'],
                'role'     => $user['role'],
            ],
            'expires_at' => date('Y-m-d H:i:s', $payload['exp']),
        ], 'Login successful');
    }

    public function logout()
    {
        return $this->ok(null, 'Logged out');
    }

    public function me()
    {
        $userId    = $this->userId();
        $userModel = new UserModel();
        $user      = $userModel->find($userId);
        if (!$user) return $this->notFound('User not found');

        unset($user['password_hash']);
        return $this->ok($user);
    }

    public function changePassword()
    {
        $body = $this->body();

        if ($err = $this->validate2([
            'current_password' => 'required',
            'new_password'     => 'required|min_length[8]',
        ], $body)) {
            return $err;
        }

        $userModel = new UserModel();
        $user      = $userModel->find($this->userId());

        if (!$userModel->verifyPassword($body['current_password'], $user['password_hash'])) {
            return $this->bad('Current password is incorrect');
        }

        $userModel->update($this->userId(), [
            'password_hash' => password_hash($body['new_password'], PASSWORD_BCRYPT),
        ]);

        return $this->ok(null, 'Password changed successfully');
    }
}
