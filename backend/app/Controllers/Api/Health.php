<?php

namespace App\Controllers\Api;

use CodeIgniter\Controller;

class Health extends Controller
{
    public function index()
    {
        $host   = env('database.default.hostname', 'NOT SET');
        $db     = env('database.default.database',  'NOT SET');
        $user   = env('database.default.username',  'NOT SET');
        $port   = env('database.default.port',      'NOT SET');
        $driver = env('database.default.DBDriver',  'NOT SET');

        $dbStatus = 'not tested';
        $dbError  = null;

        try {
            $conn = \Config\Database::connect();
            $conn->connect();
            $dbStatus = 'connected';
        } catch (\Throwable $e) {
            $dbStatus = 'failed';
            $dbError  = $e->getMessage();
        }

        return $this->response->setJSON([
            'status' => 'ok',
            'db' => [
                'host'   => $host,
                'port'   => $port,
                'name'   => $db,
                'user'   => $user,
                'driver' => $driver,
                'status' => $dbStatus,
                'error'  => $dbError,
            ],
        ]);
    }
}
