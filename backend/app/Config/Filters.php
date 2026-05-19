<?php

namespace Config;

use App\Filters\CorsFilter;
use App\Filters\JwtFilter;
use App\Filters\SecurityFilter;
use CodeIgniter\Config\BaseConfig;

class Filters extends BaseConfig
{
    public array $aliases = [
        'csrf'     => \CodeIgniter\Filters\CSRF::class,
        'toolbar'  => \CodeIgniter\Filters\DebugToolbar::class,
        'honeypot' => \CodeIgniter\Filters\Honeypot::class,
        'cors'     => CorsFilter::class,
        'jwt'      => JwtFilter::class,
        'security' => SecurityFilter::class,
    ];

    public array $globals = [
        'before' => ['cors'],
        'after'  => ['security'],
    ];

    public array $methods = [];

    public array $filters = [
        'jwt' => [
            'before' => [
                'api/auth/me',
                'api/auth/change-password',
                'api/dashboard*',
                'api/assets*',
                'api/alarms*',
                'api/work-orders*',
                'api/reports*',
                'api/map*',
                'api/users*',
                'api/settings*',
            ],
        ],
    ];
}
