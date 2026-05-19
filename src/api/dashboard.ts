import api from '../lib/api';

export async function getDashboard() {
  const res = await api.get('/dashboard');
  return res.data.data as {
    kpis: {
      tagged_assets: number;
      deployed_target: number;
      in_service: number;
      utilisation_pct: number;
      active_alarms: number;
      critical_alarms: number;
      warning_alarms: number;
      avg_monthly_hours: number;
    };
    fleet_location: { label: string; count: number }[];
    duty_profile: { hour: string; drilling: number }[];
    recent_alarms: any[];
  };
}
