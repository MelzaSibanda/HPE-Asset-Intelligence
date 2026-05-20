<?php

namespace App\Controllers\Api;

use App\Models\AssetModel;
use App\Models\SensorReadingModel;

class Assets extends BaseApiController
{
    public function index()
    {
        $model   = new AssetModel();
        $page    = max(1, (int) ($this->request->getGet('page') ?? 1));
        $perPage = min(100, max(1, (int) ($this->request->getGet('per_page') ?? 12)));

        $filters = array_filter([
            'type'   => $this->request->getGet('type'),
            'site'   => $this->request->getGet('site'),
            'status' => $this->request->getGet('status'),
            'search' => $this->request->getGet('search'),
        ]);

        $result = $model->listing($page, $perPage, $filters);
        return $this->ok($this->paginateResult($result, $page, $perPage));
    }

    public function show($assetId = null)
    {
        $model = new AssetModel();
        $asset = $model->detail((string) $assetId);

        if (!$asset) return $this->notFound("Asset $assetId not found");

        $alarm = $this->db->query(
            "SELECT * FROM alarms WHERE asset_id = ? AND status = 'active'
             ORDER BY CASE severity WHEN 'critical' THEN 1 WHEN 'warning' THEN 2 ELSE 3 END,
             raised_at DESC LIMIT 1",
            [$assetId]
        )->getRowArray();

        $movements = $this->db->query(
            "SELECT me.*, fs.name AS from_site, ts.name AS to_site
             FROM movement_events me
             LEFT JOIN sites fs ON fs.id = me.from_site_id
             LEFT JOIN sites ts ON ts.id = me.to_site_id
             WHERE me.asset_id = ?
             ORDER BY me.occurred_at DESC LIMIT 20",
            [$assetId]
        )->getResultArray();

        return $this->ok(compact('asset', 'alarm', 'movements'));
    }

    public function create()
    {
        $body = $this->body();

        // Basic presence / type validation (no is_unique — handled below)
        if ($err = $this->validate2([
            'asset_id' => 'required|min_length[3]|max_length[20]',
            'type_id'  => 'required',
            'model'    => 'required|max_length[50]',
            'site_id'  => 'required',
        ], $body)) {
            return $err;
        }

        $assetId = strtoupper(trim($body['asset_id']));

        // Check uniqueness manually (is_unique has issues with the Postgre driver)
        $exists = $this->db->table('assets')->where('asset_id', $assetId)->countAllResults();
        if ($exists) {
            return $this->bad('Validation failed', ['asset_id' => "Asset ID {$assetId} already exists"]);
        }

        try {
            $model = new AssetModel();
            $model->insert([
                'asset_id'        => $assetId,
                'type_id'         => (int) $body['type_id'],
                'model'           => $body['model'],
                'serial_number'   => $body['serial_number']   ?: null,
                'epc_tag'         => $body['epc_tag']         ?: null,
                'current_site_id' => (int) $body['site_id'],
                'status'          => $body['status']          ?? 'active',
                'location_detail' => $body['location_detail'] ?? 'Workshop',
                'commissioned_at' => $body['commissioned_at'] ?? date('Y-m-d'),
                'tagged_at'       => $body['tagged_at']       ?: null,
                'lifetime_hours'  => 0,
                'monthly_hours'   => 0,
                'battery_pct'     => isset($body['battery_pct']) ? (int) $body['battery_pct'] : 100,
            ]);
        } catch (\Throwable $e) {
            return $this->bad('Could not save asset: ' . $e->getMessage());
        }

        return $this->created(['asset' => $model->detail($assetId)], 'Asset created');
    }

    public function update($assetId = null)
    {
        $model = new AssetModel();
        if (!$model->detail((string) $assetId)) {
            return $this->notFound("Asset $assetId not found");
        }

        $body    = $this->body();
        $allowed = [
            'status', 'location_detail', 'current_site_id',
            'last_service_at', 'next_service_due',
            'battery_pct', 'vibration_rms', 'temperature',
        ];

        $update = array_intersect_key($body, array_flip($allowed));
        if (empty($update)) return $this->bad('No updatable fields provided');

        $model->where('asset_id', $assetId)->set($update)->update();
        return $this->ok($model->detail((string) $assetId), 'Asset updated');
    }

    public function logMovement($assetId = null)
    {
        $asset = (new AssetModel())->detail((string) $assetId);
        if (!$asset) return $this->notFound("Asset $assetId not found");

        $body = $this->body();

        if ($err = $this->validate2([
            'event_type' => 'required|in_list[dispatched_hq,in_transit,received_mine,dispatched_ug,returned_ug,dispatched_hq_return,received_hq]',
        ], $body)) {
            return $err;
        }

        $this->db->table('movement_events')->insert([
            'asset_id'     => $assetId,
            'event_type'   => $body['event_type'],
            'from_site_id' => $body['from_site_id'] ?? $asset['current_site_id'],
            'to_site_id'   => $body['to_site_id']   ?? $asset['current_site_id'],
            'notes'        => $body['notes']         ?? null,
            'occurred_at'  => date('Y-m-d H:i:s'),
        ]);

        // Update asset status to reflect movement
        $statusMap = [
            'dispatched_hq'        => 'transit',
            'in_transit'           => 'transit',
            'received_mine'        => 'active',
            'dispatched_ug'        => 'active',
            'returned_ug'          => 'active',
            'dispatched_hq_return' => 'transit',
            'received_hq'          => 'active',
        ];

        $locationMap = [
            'dispatched_ug' => 'Underground',
            'returned_ug'   => 'Workshop',
            'received_mine' => 'Workshop',
            'received_hq'   => 'Workshop',
        ];

        $update = ['status' => $statusMap[$body['event_type']] ?? 'active'];
        if (isset($locationMap[$body['event_type']])) {
            $update['location_detail'] = $locationMap[$body['event_type']];
        }
        if (!empty($body['to_site_id'])) {
            $update['current_site_id'] = (int) $body['to_site_id'];
        }

        (new AssetModel())->where('asset_id', $assetId)->set($update)->update();

        return $this->ok(null, 'Movement event recorded');
    }

    public function vibration($assetId = null)
    {
        $days     = min(365, max(1, (int) ($this->request->getGet('days') ?? 30)));
        $readings = (new SensorReadingModel())->vibrationTrace((string) $assetId, $days);

        return $this->ok([
            'asset_id'   => $assetId,
            'days'       => $days,
            'thresholds' => ['warning' => 2.5, 'alarm' => 3.5],
            'readings'   => $readings,
        ]);
    }

    public function movements($assetId = null)
    {
        $rows = $this->db->query(
            "SELECT me.*, fs.name AS from_site, ts.name AS to_site
             FROM movement_events me
             LEFT JOIN sites fs ON fs.id = me.from_site_id
             LEFT JOIN sites ts ON ts.id = me.to_site_id
             WHERE me.asset_id = ?
             ORDER BY me.occurred_at DESC",
            [$assetId]
        )->getResultArray();

        return $this->ok($rows);
    }
}
