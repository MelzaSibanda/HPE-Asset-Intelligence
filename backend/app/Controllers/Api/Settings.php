<?php

namespace App\Controllers\Api;

class Settings extends BaseApiController
{
    public function system()
    {
        if ($err = $this->requireAdmin()) return $err;

        $dbVersion = $this->db->query('SELECT VERSION() AS v')->getRow()->v ?? 'unknown';
        $assetCount = $this->db->query('SELECT COUNT(*) AS c FROM assets')->getRow()->c;
        $alarmCount = $this->db->query("SELECT COUNT(*) AS c FROM alarms WHERE status='active'")->getRow()->c;
        $woCount    = $this->db->query("SELECT COUNT(*) AS c FROM work_orders WHERE status='open'")->getRow()->c;
        $userCount  = $this->db->query('SELECT COUNT(*) AS c FROM users')->getRow()->c;

        return $this->ok([
            'ci_version'       => defined('\CodeIgniter\CodeIgniter::CI_VERSION') ? \CodeIgniter\CodeIgniter::CI_VERSION : '4.x',
            'php_version'      => PHP_VERSION,
            'db_version'       => $dbVersion,
            'environment'      => env('CI_ENVIRONMENT', 'production'),
            'asset_count'      => (int) $assetCount,
            'active_alarms'    => (int) $alarmCount,
            'open_work_orders' => (int) $woCount,
            'user_count'       => (int) $userCount,
            'server_time'      => date('Y-m-d H:i:s'),
            'timezone'         => date_default_timezone_get(),
        ]);
    }

    public function assetTypes()
    {
        return $this->ok(
            $this->db->query('SELECT * FROM asset_types ORDER BY name')->getResultArray()
        );
    }

    public function sites()
    {
        return $this->ok(
            $this->db->query('SELECT * FROM sites ORDER BY is_hq DESC, name')->getResultArray()
        );
    }
}
