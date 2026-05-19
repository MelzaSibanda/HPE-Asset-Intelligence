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
        $db   = env('database.default.database',  'NOT SET');

        // TCP reachability test
        $sock  = @fsockopen($host, $port, $errno, $errstr, 5);
        $tcp   = $sock !== false ? 'reachable' : "unreachable: {$errstr} (errno {$errno})";
        if ($sock) fclose($sock);

        // PDO connection test (no SSL constant dependency)
        $pdoStatus = 'not tested';
        $pdoError  = null;
        if ($sock !== false || $errno === 0) {
            try {
                $pass = env('database.default.password', '');
                $dsn  = "mysql:host={$host};port={$port};dbname={$db};charset=utf8mb4";
                $pdo = new \PDO($dsn, $user, $pass, [\PDO::ATTR_TIMEOUT => 5]);
                $pdoStatus = 'connected (server: ' . $pdo->getAttribute(\PDO::ATTR_SERVER_VERSION) . ')';
            } catch (\Throwable $e) {
                $pdoStatus = 'failed';
                $pdoError  = $e->getMessage();
            }
        }

        return $this->response->setJSON([
            'php'  => PHP_VERSION,
            'host' => $host,
            'port' => $port,
            'user' => $user,
            'db'   => $db,
            'tcp'  => $tcp,
            'pdo'  => ['status' => $pdoStatus, 'error' => $pdoError],
        ]);
    }
}
