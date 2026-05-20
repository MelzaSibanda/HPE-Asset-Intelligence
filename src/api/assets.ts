import api from '../lib/api';

export interface Asset {
  id: number;
  asset_id: string;
  type_name: string;
  prefix: string;
  model: string;
  serial_number: string;
  epc_tag: string;
  site_name: string;
  current_site_id: number;
  status: string;
  location_detail: string;
  commissioned_at: string;
  tagged_at: string;
  last_service_at: string;
  next_service_due: string;
  lifetime_hours: number;
  monthly_hours: number;
  battery_pct: number;
  vibration_rms: number;
  temperature: number;
  last_seen_at: string;
}

export async function getAssets(params?: Record<string, string | number>) {
  const res = await api.get('/assets', { params });
  return res.data.data as {
    data: Asset[];
    total: number;
    page: number;
    per_page: number;
    last_page: number;
  };
}

export async function getAsset(assetId: string) {
  const res = await api.get(`/assets/${assetId}`);
  return res.data.data as {
    asset: Asset;
    alarm: any | null;
    movements: any[];
  };
}

export async function createAsset(payload: Record<string, unknown>) {
  // Send as form-encoded so PHP reads it from $_POST (more reliable than php://input through mod_rewrite)
  const form = new URLSearchParams();
  for (const [k, v] of Object.entries(payload)) {
    if (v !== null && v !== undefined && v !== '') form.append(k, String(v));
  }
  const res = await api.post('/assets', form, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });
  return res.data.data;
}

export async function getAssetTypes() {
  const res = await api.get('/settings/asset-types');
  return res.data.data as { id: number; name: string; prefix: string }[];
}

export async function getSites() {
  const res = await api.get('/settings/sites');
  return res.data.data as { id: number; name: string; code: string; is_hq: number }[];
}

export async function getVibrationTrace(assetId: string, days = 30) {
  const res = await api.get(`/assets/${assetId}/vibration`, { params: { days } });
  return res.data.data as {
    asset_id: string;
    thresholds: { warning: number; alarm: number };
    readings: { day: string; vibration_rms: number; temperature: number }[];
  };
}
