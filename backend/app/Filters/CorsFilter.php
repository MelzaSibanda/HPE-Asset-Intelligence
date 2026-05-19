<?php

namespace App\Filters;

use CodeIgniter\Filters\FilterInterface;
use CodeIgniter\HTTP\RequestInterface;
use CodeIgniter\HTTP\ResponseInterface;

class CorsFilter implements FilterInterface
{
    private function headers(): array
    {
        return [
            'Access-Control-Allow-Origin'      => env('CORS_ORIGIN', 'http://localhost:5173'),
            'Access-Control-Allow-Headers'     => 'Content-Type, Authorization, X-Requested-With',
            'Access-Control-Allow-Methods'     => 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
            'Access-Control-Allow-Credentials' => 'true',
            'Access-Control-Max-Age'           => '3600',
        ];
    }

    public function before(RequestInterface $request, $arguments = null)
    {
        $headers = $this->headers();

        foreach ($headers as $key => $value) {
            header("$key: $value");
        }

        if (strtoupper($request->getMethod()) === 'OPTIONS') {
            $response = service('response');
            foreach ($headers as $key => $value) {
                $response->setHeader($key, $value);
            }
            return $response->setStatusCode(200)->setBody('');
        }
    }

    public function after(RequestInterface $request, ResponseInterface $response, $arguments = null)
    {
        foreach ($this->headers() as $key => $value) {
            $response->setHeader($key, $value);
        }
        return $response;
    }
}
