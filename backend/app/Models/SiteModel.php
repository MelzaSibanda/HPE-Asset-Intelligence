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
                   COUNT(a.id)                                                             AS asset_count,
                   SUM(CASE WHEN a.status IN ('alarm','warning') THEN 1 ELSE 0 END)       AS alarm_count,
                   SUM(CASE WHEN a.status = 'alarm' THEN 1 ELSE 0 END)                    AS critical_count,
                   SUM(CASE WHEN a.location_detail = 'Underground' THEN 1 ELSE 0 END)     AS ug_count
            FROM   sites s
            LEFT JOIN assets a ON a.current_site_id = s.id
            GROUP  BY s.id, s.name, s.code, s.is_hq, s.lat, s.lng
            ORDER  BY s.is_hq DESC, COUNT(a.id) DESC
        ")->getResultArray();
    }
}
