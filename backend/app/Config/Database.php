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

        // Use DATABASE_URL if set in environment, otherwise fall back to
        // the Render-internal PostgreSQL URL (only reachable within Render)
        $url = env('DATABASE_URL', '')
            ?: 'postgresql://hpe_asset_intelligence_user:xHzU4TTMjZkjbZOAUxw9HueO6cfSKCyP@dpg-d86f5dbbc2fs73bs38o0-a/hpe_asset_intelligence';

        $p    = parse_url($url);
        $host = $p['host'] ?? 'localhost';
        $port = $p['port'] ?? 5432;
        $user = $p['user'] ?? '';
        $pass = isset($p['pass']) ? urldecode($p['pass']) : '';
        $db   = ltrim($p['path'] ?? '/', '/');

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
