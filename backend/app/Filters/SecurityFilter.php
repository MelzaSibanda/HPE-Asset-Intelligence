<?php

namespace App\Filters;

use CodeIgniter\Filters\FilterInterface;
use CodeIgniter\HTTP\RequestInterface;
use CodeIgniter\HTTP\ResponseInterface;

/**
 * Adds production-grade security headers to every response.
 * Also handles simple request logging.
 */
class SecurityFilter implements FilterInterface
{
    public function before(RequestInterface $request, $arguments = null) {}

    public function after(RequestInterface $request, ResponseInterface $response, $arguments = null)
    {
        return $response
            ->setHeader('X-Content-Type-Options',  'nosniff')
            ->setHeader('X-Frame-Options',          'DENY')
            ->setHeader('X-XSS-Protection',         '1; mode=block')
            ->setHeader('Referrer-Policy',          'strict-origin-when-cross-origin')
            ->setHeader('Permissions-Policy',       'camera=(), microphone=(), geolocation=()')
            ->setHeader('Cache-Control',            'no-store, no-cache, must-revalidate');
    }
}
