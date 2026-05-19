<?php

namespace App\Models;

use CodeIgniter\Model;

class SiteModel extends Model
{
    protected $table      = 'sites';
    protected $primaryKey = 'id';
    protected $allowedFields = ['name','code','is_hq','lat','lng'];

    /** Return all sites with live asset counts from the assets table */
    public function withCounts(): array
    {
        return $this->db->query("
            SELECT s.*,
                   COUNT(a.id)                                              AS asset_count,
                   SUM(a.status IN ('alarm','warning'))                     AS alarm_count,
                   SUM(a.status = 'alarm')                                  AS critical_count,
                   SUM(a.location_detail = 'Underground')                   AS ug_count
            FROM   sites s
            LEFT JOIN assets a ON a.current_site_id = s.id
            GROUP  BY s.id
            ORDER  BY s.is_hq DESC, asset_count DESC
        ")->getResultArray();
    }
}
