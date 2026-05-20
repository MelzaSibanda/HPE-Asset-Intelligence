<?php

namespace Config;

use CodeIgniter\Database\Config;

class Database extends Config
{
    public string $defaultGroup = 'default';
    public array  $default      = [];

    public function __construct()
    {
        parent::__construct();

        // Render injects DATABASE_URL for PostgreSQL — parse it here
        $url = env('DATABASE_URL', '');
        if ($url) {
            $p    = parse_url($url);
            $host = $p['host'] ?? 'localhost';
            $port = $p['port'] ?? 5432;
            $user = $p['user'] ?? '';
            $pass = isset($p['pass']) ? urldecode($p['pass']) : '';
            $db   = ltrim($p['path'] ?? '/', '/');
        } else {
            $host = env('DB_HOSTNAME', 'localhost');
            $port = (int) env('DB_PORT', 5432);
            $user = env('DB_USERNAME', '');
            $pass = env('DB_PASSWORD', '');
            $db   = env('DB_DATABASE', 'hpe_asset_intelligence');
        }

        $this->default = [
            'hostname' => $host,
            'username' => $user,
            'password' => $pass,
            'database' => $db,
            'DBDriver' => 'Postgre',
            'DBPrefix' => '',
            'pConnect' => false,
            'DBDebug'  => false,
            'charset'  => 'utf8',
            'DBCollat' => '',
            'swapPre'  => '',
            'compress' => false,
            'strictOn' => false,
            'failover' => [],
            'port'     => (int) $port,
        ];
    }
}
