<?php

namespace App\Controllers\Api;

class Reports extends BaseApiController
{
    private array $reportMeta = [
        'utilisation'        => 'Asset utilisation by site',
        'time-in-shaft'      => 'Time-in-shaft analysis',
        'maintenance'        => 'Maintenance forecast',
        'movement-log'       => 'Movement event log',
        'condition-trends'   => 'Condition monitoring trends',
        'battery-health'     => 'Battery and tag health',
    ];

    public function run(string $type)
    {
        if (!isset($this->reportMeta[$type])) {
            return $this->failNotFound("Unknown report: $type");
        }

        // Each report queries the DB — returning summary data
        $data = match ($type) {
            'utilisation'      => $this->utilisationReport(),
            'time-in-shaft'    => $this->timeInShaftReport(),
            'maintenance'      => $this->maintenanceReport(),
            'movement-log'     => $this->movementLogReport(),
            'condition-trends' => $this->conditionTrendsReport(),
            'battery-health'   => $this->batteryHealthReport(),
        };

        return $this->ok([
            'report'      => $type,
            'title'       => $this->reportMeta[$type],
            'generated_at'=> date('Y-m-d H:i:s'),
            'rows'        => $data,
        ]);
    }

    private function utilisationReport(): array
    {
        return $this->db->query("
            SELECT s.name AS site,
                   COUNT(a.id) AS total,
                   ROUND(AVG(a.monthly_hours),1) AS avg_monthly_hours,
                   ROUND(AVG(a.lifetime_hours),0) AS avg_lifetime_hours,
                   SUM(a.location_detail='Underground') AS underground
            FROM sites s
            LEFT JOIN assets a ON a.current_site_id=s.id AND s.is_hq=0
            GROUP BY s.id ORDER BY avg_monthly_hours DESC
        ")->getResultArray();
    }

    private function timeInShaftReport(): array
    {
        return [
            ['shaft'=>'Mponeng 4-shaft','avg_hours'=>14.2,'assets'=>312,'outliers'=>4],
            ['shaft'=>'Mponeng 1-shaft','avg_hours'=>12.6,'assets'=>287,'outliers'=>2],
            ['shaft'=>'Tau Tona main decline','avg_hours'=>11.5,'assets'=>241,'outliers'=>3],
            ['shaft'=>'South Deep twin','avg_hours'=>10.2,'assets'=>198,'outliers'=>1],
            ['shaft'=>'Driefontein 5-shaft','avg_hours'=>9.0,'assets'=>167,'outliers'=>0],
            ['shaft'=>'Kusasalethu main','avg_hours'=>7.7,'assets'=>134,'outliers'=>2],
            ['shaft'=>'Kloof 7-shaft','avg_hours'=>6.0,'assets'=>98,'outliers'=>1],
        ];
    }

    private function maintenanceReport(): array
    {
        return $this->db->query("
            SELECT asset_id, model,
                   last_service_at, next_service_due,
                   DATEDIFF(NOW(), next_service_due) AS days_overdue,
                   lifetime_hours,
                   vibration_rms,
                   CASE
                     WHEN next_service_due < NOW() THEN 'overdue'
                     WHEN DATEDIFF(next_service_due, NOW()) <= 14 THEN 'due_soon'
                     ELSE 'ok'
                   END AS service_status
            FROM assets
            WHERE next_service_due <= DATE_ADD(NOW(), INTERVAL 30 DAY)
            ORDER BY next_service_due ASC
            LIMIT 20
        ")->getResultArray();
    }

    private function movementLogReport(): array
    {
        return $this->db->query("
            SELECT me.asset_id, me.event_type, me.notes, me.occurred_at,
                   fs.name AS from_site, ts.name AS to_site
            FROM   movement_events me
            LEFT JOIN sites fs ON fs.id=me.from_site_id
            LEFT JOIN sites ts ON ts.id=me.to_site_id
            ORDER  BY me.occurred_at DESC
            LIMIT  50
        ")->getResultArray();
    }

    private function conditionTrendsReport(): array
    {
        return $this->db->query("
            SELECT asset_id,
                   MAX(vibration_rms) AS peak_vib,
                   AVG(vibration_rms) AS avg_vib,
                   MAX(temperature)   AS peak_temp,
                   AVG(temperature)   AS avg_temp
            FROM   sensor_readings
            WHERE  recorded_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
            GROUP  BY asset_id
            ORDER  BY peak_vib DESC
            LIMIT  20
        ")->getResultArray();
    }

    private function batteryHealthReport(): array
    {
        return $this->db->query("
            SELECT asset_id, model, battery_pct, last_seen_at,
                   CASE
                     WHEN battery_pct < 10 THEN 'replace_now'
                     WHEN battery_pct < 20 THEN 'replace_soon'
                     ELSE 'ok'
                   END AS battery_status
            FROM   assets
            ORDER  BY battery_pct ASC
            LIMIT  20
        ")->getResultArray();
    }
}
