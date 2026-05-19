<?php

use CodeIgniter\Router\RouteCollection;

/** @var RouteCollection $routes */

// ── Preflight — must be first ────────────────────────────────
$routes->options('(:any)', static function () {
    return service('response')->setStatusCode(200)->setBody('');
});

// ── Auth ─────────────────────────────────────────────────────
$routes->post('api/auth/login',           'Api\Auth::login');
$routes->post('api/auth/logout',          'Api\Auth::logout');
$routes->get( 'api/auth/me',              'Api\Auth::me');
$routes->post('api/auth/change-password', 'Api\Auth::changePassword');

// ── Dashboard ────────────────────────────────────────────────
$routes->get('api/dashboard', 'Api\Dashboard::overview');

// ── Map ──────────────────────────────────────────────────────
$routes->get('api/map/sites', 'Api\Map::sites');

// ── Assets ───────────────────────────────────────────────────
$routes->get( 'api/assets',                          'Api\Assets::index');
$routes->post('api/assets',                          'Api\Assets::create');
$routes->get( 'api/assets/(:segment)',               'Api\Assets::show/$1');
$routes->put( 'api/assets/(:segment)',               'Api\Assets::update/$1');
$routes->get( 'api/assets/(:segment)/vibration',     'Api\Assets::vibration/$1');
$routes->get( 'api/assets/(:segment)/movements',     'Api\Assets::movements/$1');
$routes->post('api/assets/(:segment)/movements',     'Api\Assets::logMovement/$1');

// ── Alarms ───────────────────────────────────────────────────
$routes->get( 'api/alarms',                          'Api\Alarms::index');
$routes->post('api/alarms',                          'Api\Alarms::create');
$routes->post('api/alarms/(:num)/acknowledge',       'Api\Alarms::acknowledge/$1');
$routes->post('api/alarms/(:num)/resolve',           'Api\Alarms::resolve/$1');

// ── Work orders ──────────────────────────────────────────────
$routes->get( 'api/work-orders',                     'Api\WorkOrders::index');
$routes->post('api/work-orders',                     'Api\WorkOrders::create');
$routes->get( 'api/work-orders/(:num)',              'Api\WorkOrders::show/$1');
$routes->put( 'api/work-orders/(:num)/status',       'Api\WorkOrders::updateStatus/$1');

// ── Reports ──────────────────────────────────────────────────
$routes->get('api/reports/(:segment)', 'Api\Reports::run/$1');

// ── Users (admin only) ───────────────────────────────────────
$routes->get(   'api/users',          'Api\Users::index');
$routes->post(  'api/users',          'Api\Users::create');
$routes->put(   'api/users/(:num)',   'Api\Users::update/$1');
$routes->delete('api/users/(:num)',   'Api\Users::delete/$1');

// ── Settings ─────────────────────────────────────────────────
$routes->get('api/settings/system',       'Api\Settings::system');
$routes->get('api/settings/asset-types',  'Api\Settings::assetTypes');
$routes->get('api/settings/sites',        'Api\Settings::sites');
