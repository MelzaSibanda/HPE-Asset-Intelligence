<?php

namespace App\Models;

use CodeIgniter\Model;

class WorkOrderModel extends Model
{
    protected $table      = 'work_orders';
    protected $primaryKey = 'id';
    protected $allowedFields = [
        'wo_number','asset_id','site_id','reason','replacement_unit',
        'estimated_hours','priority','status','created_by',
    ];
    protected $useTimestamps = true;
    protected $createdField  = 'created_at';
    protected $updatedField  = '';

    public function createOrder(array $data, int $userId): array
    {
        // Generate WO number: WO-XXXXX
        $last = $this->db->query("SELECT MAX(id) AS max_id FROM work_orders")->getRow();
        $nextId = ($last->max_id ?? 30000) + 1;
        $data['wo_number']   = 'WO-' . $nextId;
        $data['created_by']  = $userId;
        $data['status']      = 'open';
        $this->insert($data);
        return $this->detail($data['wo_number']);
    }

    public function detail(string $woNumber): ?array
    {
        return $this->db->query("
            SELECT wo.*, s.name AS site_name, a.model
            FROM   work_orders wo
            JOIN   sites s ON s.id = wo.site_id
            JOIN   assets a ON a.asset_id = wo.asset_id
            WHERE  wo.wo_number = ?
        ", [$woNumber])->getRowArray();
    }
}
