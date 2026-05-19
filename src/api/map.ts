import api from '../lib/api';

export async function getMapData() {
  const res = await api.get('/map/sites');
  return res.data.data as {
    sites: {
      id: number;
      name: string;
      code: string;
      is_hq: number;
      lat: number;
      lng: number;
      asset_count: number;
      alarm_count: number;
      critical_count: number;
      ug_count: number;
    }[];
    shaft_data: { shaft: string; hours: number }[];
  };
}
