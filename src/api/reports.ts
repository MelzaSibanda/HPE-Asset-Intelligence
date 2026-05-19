import api from '../lib/api';

export type ReportType =
  | 'utilisation'
  | 'time-in-shaft'
  | 'maintenance'
  | 'movement-log'
  | 'condition-trends'
  | 'battery-health';

export async function runReport(type: ReportType) {
  const res = await api.get(`/reports/${type}`);
  return res.data.data as {
    report: string;
    title: string;
    generated_at: string;
    rows: any[];
  };
}
