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

        $this->default = [
            'DSN'      => '',
            'hostname' => env('database.default.hostname', 'localhost'),
            'username' => env('database.default.username', 'root'),
            'password' => env('database.default.password', ''),
            'database' => env('database.default.database', 'hpe_asset_intelligence'),
            'DBDriver' => 'MySQLi',
            'DBPrefix' => '',
            'pConnect' => false,
            'DBDebug'  => (ENVIRONMENT !== 'production'),
            'charset'  => 'utf8mb4',
            'DBCollat' => 'utf8mb4_unicode_ci',
            'swapPre'  => '',
            'compress' => false,
            'strictOn' => false,
            'failover' => [],
            'port'     => (int) env('database.default.port', 3306),

            // Enable SSL without certificate verification for Railway / cloud MySQL
            'encrypt'  => [
                'ssl_verify_server_cert' => false,
            ],
        ];
    }
}
