<?php

namespace App\Controllers\Api;

use CodeIgniter\Controller;

class Health extends Controller
{
    public function index()
    {
        $host = env('database.default.hostname', 'NOT SET');
        $port = (int) env('database.default.port', 3306);
        $user = env('database.default.username', 'NOT SET');
        $pass = env('database.default.password', '');
        $db   = env('database.default.database',  'NOT SET');

        $results = [];

        // Test 1 — no SSL
        try {
            $dsn = "mysql:host={$host};port={$port};dbname={$db};charset=utf8mb4";
            new \PDO($dsn, $user, $pass, [\PDO::ATTR_TIMEOUT => 5]);
            $results['no_ssl'] = 'connected';
        } catch (\Throwable $e) {
            $results['no_ssl'] = $e->getMessage();
        }

        // Test 2 — SSL with system CA bundle, verify off (constant 1014)
        try {
            $dsn = "mysql:host={$host};port={$port};dbname={$db};charset=utf8mb4";
            new \PDO($dsn, $user, $pass, [
                \PDO::ATTR_TIMEOUT        => 5,
                \PDO::MYSQL_ATTR_SSL_CA   => '/etc/ssl/certs/ca-certificates.crt',
                1014                      => false, // MYSQL_ATTR_SSL_VERIFY_SERVER_CERT
            ]);
            $results['ssl_no_verify'] = 'connected';
        } catch (\Throwable $e) {
            $results['ssl_no_verify'] = $e->getMessage();
        }

        // Test 3 — SSL with system CA bundle, verify on
        try {
            $dsn = "mysql:host={$host};port={$port};dbname={$db};charset=utf8mb4";
            new \PDO($dsn, $user, $pass, [
                \PDO::ATTR_TIMEOUT      => 5,
                \PDO::MYSQL_ATTR_SSL_CA => '/etc/ssl/certs/ca-certificates.crt',
            ]);
            $results['ssl_verify'] = 'connected';
        } catch (\Throwable $e) {
            $results['ssl_verify'] = $e->getMessage();
        }

        return $this->response->setJSON([
            'php'     => PHP_VERSION,
            'host'    => $host,
            'port'    => $port,
            'results' => $results,
        ]);
    }
}
