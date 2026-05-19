<?php

namespace App\Controllers\Api;

use CodeIgniter\Controller;

class Health extends Controller
{
    public function index()
    {
        $dbUrl  = env('DATABASE_URL', 'not set');
        $status = 'not tested';
        $error  = null;

        try {
            $conn = \Config\Database::connect();
            $conn->connect();
            $ver    = $conn->getVersion();
            $status = 'connected — ' . $ver;
        } catch (\Throwable $e) {
            $status = 'failed';
            $error  = $e->getMessage();
        }

        return $this->response->setJSON([
            'php'        => PHP_VERSION,
            'db_url_set' => $dbUrl !== 'not set',
            'db_status'  => $status,
            'db_error'   => $error,
        ]);
    }
}
