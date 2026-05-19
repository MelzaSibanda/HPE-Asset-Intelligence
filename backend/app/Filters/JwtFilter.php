<?php

namespace App\Filters;

use CodeIgniter\Filters\FilterInterface;
use CodeIgniter\HTTP\RequestInterface;
use CodeIgniter\HTTP\ResponseInterface;

class JwtFilter implements FilterInterface
{
    public function before(RequestInterface $request, $arguments = null)
    {
        helper('jwt');

        $header = $request->getHeaderLine('Authorization');
        if (!$header || !str_starts_with($header, 'Bearer ')) {
            return response()
                ->setStatusCode(401)
                ->setJSON(['status' => 'error', 'message' => 'Missing token']);
        }

        $token   = substr($header, 7);
        $secret  = env('JWT_SECRET', 'hpe-asset-intel-secret-key-2026');
        $payload = jwt_decode($token, $secret);

        if (!$payload) {
            return response()
                ->setStatusCode(401)
                ->setJSON(['status' => 'error', 'message' => 'Invalid or expired token']);
        }

        // Attach user info to the request for controllers to read
        $request->user = (object) $payload;
    }

    public function after(RequestInterface $request, ResponseInterface $response, $arguments = null)
    {
        return $response;
    }
}
