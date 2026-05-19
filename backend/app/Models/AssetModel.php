<?php

namespace App\Models;

use CodeIgniter\Model;

class AssetModel extends Model
{
    protected $table      = 'assets';
    protected $primaryKey = 'id';
    protected $allowedFields = [
        'asset_id','type_id','model','serial_number','epc_tag',
        'current_site_id','status','location_detail',
        'commissioned_at','tagged_at','last_service_at','next_service_due',
        'lifetime_hours','monthly_hours','battery_pct',
        'vibration_rms','temperature','last_seen_at',
    ];
    protected $useTimestamps = true;
    protected $createdField  = 'created_at';
    protected $updatedField  = '';

    /** Paginated list with joined type + site names */
    public function listing(int $page, int $perPage, array $filters = []): array
    {
        $builder = $this->db->table('assets a')
            ->select('a.*, at.name AS type_name, at.prefix, s.name AS site_name')
            ->join('asset_types at', 'at.id = a.type_id')
            ->join('sites s', 's.id = a.current_site_id', 'left');

        if (!empty($filters['type']))   $builder->where('at.prefix', $filters['type']);
        if (!empty($filters['site']))   $builder->where('a.current_site_id', $filters['site']);
        if (!empty($filters['status'])) $builder->where('a.status', $filters['status']);
        if (!empty($filters['search'])) {
            $builder->groupStart()
                ->like('a.asset_id', $filters['search'])
                ->orLike('a.model',  $filters['search'])
                ->groupEnd();
        }

        $total  = $builder->countAllResults(false);
        $offset = ($page - 1) * $perPage;
        $rows   = $builder->limit($perPage, $offset)->get()->getResultArray();

        return ['total' => $total, 'data' => $rows];
    }

    /** Single asset with type + site join */
    public function detail(string $assetId): ?array
    {
        return $this->db->query("
            SELECT a.*, at.name AS type_name, at.prefix, s.name AS site_name
            FROM   assets a
            JOIN   asset_types at ON at.id = a.type_id
            LEFT JOIN sites s     ON s.id  = a.current_site_id
            WHERE  a.asset_id = ?
        ", [$assetId])->getRowArray();
    }

    /** Fleet location summary (for dashboard bar chart) */
    public function fleetLocation(): array
    {
        return $this->db->query("
            SELECT
                SUM(s.is_hq = 1 AND a.location_detail != 'Underground')  AS hq_workshop,
                SUM(a.status = 'transit')                                  AS in_transit,
                SUM(s.is_hq = 0 AND a.location_detail = 'Workshop')       AS mine_workshops,
                SUM(a.location_detail = 'Underground')                     AS underground
            FROM assets a
            LEFT JOIN sites s ON s.id = a.current_site_id
        ")->getRowArray();
    }

    /** Dashboard KPI counts */
    public function kpis(): array
    {
        return $this->db->query("
            SELECT
                COUNT(*)                                AS total_assets,
                SUM(status NOT IN ('maintenance'))      AS in_service,
                SUM(location_detail = 'Underground')    AS underground,
                AVG(monthly_hours)                      AS avg_monthly_hours
            FROM assets
        ")->getRowArray();
    }
}
