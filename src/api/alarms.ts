import api from '../lib/api';

export async function getAlarms(params?: { status?: string; severity?: string }) {
  const res = await api.get('/alarms', { params });
  return res.data.data as {
    counts: { critical: number; warning: number; info: number; total: number };
    alarms: any[];
  };
}

export async function acknowledgeAlarm(id: number) {
  const res = await api.post(`/alarms/${id}/acknowledge`);
  return res.data;
}
