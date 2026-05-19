import api from '../lib/api';

export interface CreateWorkOrderPayload {
  asset_id: string;
  site_id: number;
  reason: string;
  priority: 'critical' | 'high' | 'normal' | 'low';
  replacement_unit?: string;
  estimated_hours?: number;
}

export async function createWorkOrder(payload: CreateWorkOrderPayload) {
  const res = await api.post('/work-orders', payload);
  return res.data.data;
}
