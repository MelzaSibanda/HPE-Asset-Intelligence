<?php

namespace App\Controllers\Api;

use App\Models\AssetModel;
use App\Models\AlarmModel;
use App\Models\SensorReadingModel;

class Dashboard extends BaseApiController
{
    public function overview()
    {
        $assetModel   = new AssetModel();
        $alarmModel   = new AlarmModel();
        $sensorModel  = new SensorReadingModel();

        $kpis         = $assetModel->kpis();
        $alarmCounts  = $alarmModel->countActive();
        $fleetLoc     = $assetModel->fleetLocation();
        $dutyProfile  = $sensorModel->dutyProfile();
        $recentAlarms = $alarmModel->listing('active');

        $inService = (int) $kpis['in_service'];
        $total     = (int) $kpis['total_assets'];

        return $this->ok([
            'kpis' => [
                'tagged_assets'     => $total,
                'deployed_target'   => 7500,
                'in_service'        => $inService,
                'utilisation_pct'   => $total > 0 ? round($inService / $total * 100, 1) : 0,
                'active_alarms'     => $alarmCounts['total'],
                'critical_alarms'   => $alarmCounts['critical'],
                'warning_alarms'    => $alarmCounts['warning'],
                'avg_monthly_hours' => round((float) $kpis['avg_monthly_hours'], 1),
            ],
            'fleet_location' => [
                ['label' => 'HQ workshop',    'count' => (int) $fleetLoc['hq_workshop']],
                ['label' => 'In transit',     'count' => (int) $fleetLoc['in_transit']],
                ['label' => 'Mine workshops', 'count' => (int) $fleetLoc['mine_workshops']],
                ['label' => 'Underground',    'count' => (int) $fleetLoc['underground']],
            ],
            'duty_profile' => $dutyProfile,
            'recent_alarms' => array_slice($recentAlarms, 0, 5),
        ]);
    }
}
