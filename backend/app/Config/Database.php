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

        // Render provides DATABASE_URL for PostgreSQL — parse it first
        $url = env('DATABASE_URL', '');
        if ($url) {
            $p    = parse_url($url);
            $host = $p['host'] ?? 'localhost';
            $port = $p['port'] ?? 5432;
            $user = $p['user'] ?? '';
            $pass = $p['pass'] ?? '';
            $db   = ltrim($p['path'] ?? '/railway', '/');
        } else {
            $host = env('database.default.hostname', 'localhost');
            $port = (int) env('database.default.port', 5432);
            $user = env('database.default.username', '');
            $pass = env('database.default.password', '');
            $db   = env('database.default.database', 'railway');
        }

        $this->default = [
            'DSN'      => "pgsql:host={$host};port={$port};dbname={$db}",
            'hostname' => $host,
            'username' => $user,
            'password' => $pass,
            'database' => $db,
            'DBDriver' => 'PDO',
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
            'options'  => [
                \PDO::ATTR_TIMEOUT  => 10,
                \PDO::ATTR_ERRMODE  => \PDO::ERRMODE_EXCEPTION,
            ],
        ];
    }
}
