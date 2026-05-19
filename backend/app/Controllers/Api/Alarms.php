<?php

namespace App\Controllers\Api;

use App\Models\AlarmModel;

class Alarms extends BaseApiController
{
    public function index()
    {
        $model    = new AlarmModel();
        $status   = $this->request->getGet('status')   ?? 'active';
        $severity = $this->request->getGet('severity') ?? '';

        return $this->ok([
            'counts' => $model->countActive(),
            'alarms' => $model->listing($status, $severity),
        ]);
    }

    public function acknowledge($id = null)
    {
        $model = new AlarmModel();
        $alarm = $model->find((int) $id);
        if (!$alarm) return $this->notFound("Alarm $id not found");
        if ($alarm['status'] !== 'active') {
            return $this->bad("Alarm is already {$alarm['status']}");
        }

        $model->acknowledge((int) $id, $this->userId());
        return $this->ok(['id' => $id, 'status' => 'acknowledged'], 'Alarm acknowledged');
    }

    public function resolve($id = null)
    {
        $model = new AlarmModel();
        $alarm = $model->find((int) $id);
        if (!$alarm) return $this->notFound("Alarm $id not found");

        $this->db->table('alarms')->where('id', (int) $id)->update([
            'status'      => 'resolved',
            'resolved_at' => date('Y-m-d H:i:s'),
        ]);

        return $this->ok(['id' => $id, 'status' => 'resolved'], 'Alarm resolved');
    }

    public function create()
    {
        $body = $this->body();

        if ($err = $this->validate2([
            'asset_id'    => 'required',
            'severity'    => 'required|in_list[critical,warning,info]',
            'description' => 'required|max_length[255]',
        ], $body)) {
            return $err;
        }

        $id = $this->db->table('alarms')->insert([
            'asset_id'    => $body['asset_id'],
            'severity'    => $body['severity'],
            'description' => $body['description'],
            'status'      => 'active',
            'raised_at'   => date('Y-m-d H:i:s'),
        ]);

        // Update asset status
        $statusMap = ['critical' => 'alarm', 'warning' => 'warning', 'info' => 'active'];
        $this->db->table('assets')
            ->where('asset_id', $body['asset_id'])
            ->update(['status' => $statusMap[$body['severity']]]);

        return $this->created(
            $this->db->table('alarms')->where('id', $this->db->insertID())->get()->getRowArray(),
            'Alarm raised'
        );
    }
}
