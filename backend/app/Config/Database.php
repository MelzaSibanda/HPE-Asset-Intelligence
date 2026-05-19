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

        $host = env('database.default.hostname', 'localhost');
        $port = (int) env('database.default.port', 3306);
        $db   = env('database.default.database', 'hpe_asset_intelligence');
        $user = env('database.default.username', 'root');
        $pass = env('database.default.password', '');

        $this->default = [
            'DSN'      => "mysql:host={$host};port={$port};dbname={$db};charset=utf8mb4",
            'hostname' => $host,
            'username' => $user,
            'password' => $pass,
            'database' => $db,
            'DBDriver' => 'PDO',
            'DBPrefix' => '',
            'pConnect' => false,
            'DBDebug'  => false,
            'charset'  => 'utf8mb4',
            'DBCollat' => 'utf8mb4_unicode_ci',
            'swapPre'  => '',
            'compress' => false,
            'strictOn' => false,
            'failover' => [],
            'port'     => $port,
            'options'  => [
                \PDO::ATTR_TIMEOUT      => 10,
                \PDO::MYSQL_ATTR_SSL_CA => '/etc/ssl/certs/ca-certificates.crt',
                1014                    => false, // PDO::MYSQL_ATTR_SSL_VERIFY_SERVER_CERT
            ],
        ];
    }
}
