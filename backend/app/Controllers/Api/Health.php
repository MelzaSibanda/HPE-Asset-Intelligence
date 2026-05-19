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

        // Test 1 — raw TCP to confirm the port is reachable
        $sock    = @fsockopen($host, $port, $errno, $errstr, 5);
        $tcpOk   = $sock !== false;
        $tcpInfo = $tcpOk ? 'reachable' : "unreachable ($errno: $errstr)";
        if ($sock) fclose($sock);

        // Test 2 — direct mysqli with explicit SSL (no cert verification)
        $mysqliStatus = 'not tested';
        $mysqliError  = null;
        if ($tcpOk) {
            $m = mysqli_init();
            $m->ssl_set('', '', '', null, null);
            $ok = @$m->real_connect(
                $host, $user, $pass, $db, $port,
                null,
                MYSQLI_CLIENT_SSL | MYSQLI_CLIENT_SSL_DONT_VERIFY_SERVER_CERT
            );
            if ($ok) {
                $mysqliStatus = 'connected';
                $m->close();
            } else {
                $mysqliStatus = 'failed';
                $mysqliError  = $m->connect_error ?: mysqli_connect_error();
            }
        }

        // Test 3 — PDO
        $pdoStatus = 'not tested';
        $pdoError  = null;
        if ($tcpOk) {
            try {
                $dsn = "mysql:host={$host};port={$port};dbname={$db};charset=utf8mb4";
                $pdo = new \PDO($dsn, $user, $pass, [
                    \PDO::MYSQL_ATTR_SSL_VERIFY_SERVER_CERT => false,
                    \PDO::ATTR_TIMEOUT                      => 5,
                ]);
                $pdoStatus = 'connected';
            } catch (\Throwable $e) {
                $pdoStatus = 'failed';
                $pdoError  = $e->getMessage();
            }
        }

        return $this->response->setJSON([
            'host'   => $host,
            'port'   => $port,
            'db'     => $db,
            'tcp'    => $tcpInfo,
            'mysqli' => ['status' => $mysqliStatus, 'error' => $mysqliError],
            'pdo'    => ['status' => $pdoStatus,    'error' => $pdoError],
        ]);
    }
}
