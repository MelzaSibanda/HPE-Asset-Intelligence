<?php

namespace App\Controllers\Api;

use App\Models\WorkOrderModel;
use App\Models\AssetModel;

class WorkOrders extends BaseApiController
{
    public function index()
    {
        $status = $this->request->getGet('status') ?? '';
        $builder = $this->db->table('work_orders wo')
            ->select('wo.*, s.name AS site_name, a.model')
            ->join('sites s', 's.id = wo.site_id')
            ->join('assets a', 'a.asset_id = wo.asset_id')
            ->orderBy('wo.created_at', 'DESC');

        if ($status) $builder->where('wo.status', $status);

        return $this->ok($builder->get()->getResultArray());
    }

    public function create()
    {
        $body = $this->body();

        if ($err = $this->validate2([
            'asset_id' => 'required',
            'site_id'  => 'required|integer',
            'reason'   => 'required|max_length[255]',
            'priority' => 'required|in_list[critical,high,normal,low]',
        ], $body)) {
            return $err;
        }

        if (!(new AssetModel())->detail($body['asset_id'])) {
            return $this->notFound("Asset {$body['asset_id']} not found");
        }

        $model = new WorkOrderModel();
        $wo    = $model->createOrder([
            'asset_id'         => $body['asset_id'],
            'site_id'          => (int) $body['site_id'],
            'reason'           => $body['reason'],
            'priority'         => $body['priority'],
            'replacement_unit' => $body['replacement_unit'] ?? null,
            'estimated_hours'  => (float) ($body['estimated_hours'] ?? 2),
        ], $this->userId());

        return $this->created($wo, 'Work order created');
    }

    public function show($id = null)
    {
        $wo = $this->db->query(
            "SELECT wo.*, s.name AS site_name, a.model
             FROM work_orders wo
             JOIN sites s ON s.id = wo.site_id
             JOIN assets a ON a.asset_id = wo.asset_id
             WHERE wo.id = ?",
            [(int) $id]
        )->getRowArray();

        if (!$wo) return $this->notFound("Work order $id not found");
        return $this->ok($wo);
    }

    public function updateStatus($id = null)
    {
        $body = $this->body();

        if ($err = $this->validate2([
            'status' => 'required|in_list[open,in_progress,completed,cancelled]',
        ], $body)) {
            return $err;
        }

        $wo = $this->db->table('work_orders')->where('id', (int) $id)->get()->getRowArray();
        if (!$wo) return $this->notFound("Work order $id not found");

        $update = ['status' => $body['status']];
        if ($body['status'] === 'completed') {
            $update['completed_at'] = date('Y-m-d H:i:s');
        }

        $this->db->table('work_orders')->where('id', (int) $id)->update($update);
        return $this->ok(['id' => $id, 'status' => $body['status']], 'Work order updated');
    }
}
