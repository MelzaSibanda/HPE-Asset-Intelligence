<?php

namespace App\Models;

use CodeIgniter\Model;

class SensorReadingModel extends Model
{
    protected $table      = 'sensor_readings';
    protected $primaryKey = 'id';
    protected $allowedFields = ['asset_id','vibration_rms','temperature','battery_pct','recorded_at'];
    protected $useTimestamps = false;

    /** Last N days of vibration readings for an asset */
    public function vibrationTrace(string $assetId, int $days = 30): array
    {
        return $this->db->query("
            SELECT DATE(recorded_at) AS day,
                   ROUND(AVG(vibration_rms), 3) AS vibration_rms,
                   ROUND(AVG(temperature),  2)  AS temperature
            FROM   sensor_readings
            WHERE  asset_id   = ?
              AND  recorded_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
            GROUP  BY DATE(recorded_at)
            ORDER  BY day ASC
        ", [$assetId, $days])->getResultArray();
    }

    /** Duty profile: drilling counts by 2-hour bucket for last 24h */
    public function dutyProfile(): array
    {
        // Simulated from asset underground counts bucketed by hour
        // In a real system this would come from RFID reader events
        return [
            ['hour' => '00:00', 'drilling' => 420],
            ['hour' => '02:00', 'drilling' => 380],
            ['hour' => '04:00', 'drilling' => 450],
            ['hour' => '06:00', 'drilling' => 2840],
            ['hour' => '08:00', 'drilling' => 3100],
            ['hour' => '10:00', 'drilling' => 2650],
            ['hour' => '12:00', 'drilling' => 1850],
            ['hour' => '14:00', 'drilling' => 3200],
            ['hour' => '16:00', 'drilling' => 2980],
            ['hour' => '18:00', 'drilling' => 1420],
            ['hour' => '20:00', 'drilling' => 680],
            ['hour' => '22:00', 'drilling' => 520],
        ];
    }
}
