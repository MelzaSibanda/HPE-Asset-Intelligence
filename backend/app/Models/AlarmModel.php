<?php

namespace App\Models;

use CodeIgniter\Model;

class AlarmModel extends Model
{
    protected $table      = 'alarms';
    protected $primaryKey = 'id';
    protected $allowedFields = [
        'asset_id','severity','description','status',
        'raised_at','acknowledged_at','acknowledged_by','resolved_at',
    ];
    protected $useTimestamps = false;

    /** List alarms with asset type + site info */
    public function listing(string $status = 'active', string $severity = ''): array
    {
        $builder = $this->db->table('alarms al')
            ->select('al.*, a.current_site_id, s.name AS site_name, at.name AS type_name')
            ->join('assets a',      'a.asset_id = al.asset_id')
            ->join('sites s',       's.id = a.current_site_id', 'left')
            ->join('asset_types at','at.id = a.type_id')
            ->where('al.status', $status)
            ->orderBy("CASE al.severity WHEN 'critical' THEN 1 WHEN 'warning' THEN 2 ELSE 3 END", '', false)
            ->orderBy('al.raised_at', 'DESC');

        if ($severity) $builder->where('al.severity', $severity);

        return $builder->get()->getResultArray();
    }

    public function acknowledge(int $id, int $userId): bool
    {
        return $this->db->table('alarms')
            ->where('id', $id)
            ->update([
                'status'          => 'acknowledged',
                'acknowledged_at' => date('Y-m-d H:i:s'),
                'acknowledged_by' => $userId,
            ]);
    }

    /** Count active alarms by severity for dashboard KPI */
    public function countActive(): array
    {
        $rows = $this->db->query("
            SELECT severity, COUNT(*) AS cnt
            FROM   alarms
            WHERE  status = 'active'
            GROUP  BY severity
        ")->getResultArray();

        $out = ['critical' => 0, 'warning' => 0, 'info' => 0, 'total' => 0];
        foreach ($rows as $r) {
            $out[$r['severity']] = (int) $r['cnt'];
            $out['total']       += (int) $r['cnt'];
        }
        return $out;
    }
}
