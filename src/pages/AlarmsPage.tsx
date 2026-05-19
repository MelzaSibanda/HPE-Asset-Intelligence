import { useState } from 'react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { useApi } from '../hooks/useApi';
import { usePolling } from '../hooks/usePolling';
import { getAlarms, acknowledgeAlarm } from '../api/alarms';
import { Spinner, SeverityPill } from '../components/Shared';

export function AlarmsPage() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all');

  const severity = ['critical', 'warning', 'info'].includes(filter) ? filter : '';
  const status   = filter === 'acknowledged' ? 'acknowledged' : 'active';

  const { data, loading, error, reload } = useApi(
    () => getAlarms({ status, severity }),
    [filter]
  );

  // Auto-refresh every 60 seconds
  usePolling(reload, 60_000);

  async function handleAcknowledge(id: number, assetId: string) {
    try {
      await acknowledgeAlarm(id);
      toast.success(`Alarm for ${assetId} acknowledged`);
      reload();
    } catch {
      toast.error('Failed to acknowledge alarm');
    }
  }

  const filterBtns = [
    { key: 'all',          label: `All ${data ? `(${data.counts.total})` : ''}`,            cls: 'bg-[#1F4E78] text-white' },
    { key: 'critical',     label: `Critical ${data ? `(${data.counts.critical})` : ''}`,   cls: 'bg-red-50 text-red-700 hover:bg-red-100' },
    { key: 'warning',      label: `Warning ${data ? `(${data.counts.warning})` : ''}`,     cls: 'bg-amber-50 text-amber-700 hover:bg-amber-100' },
    { key: 'acknowledged', label: 'Acknowledged',                                           cls: 'bg-gray-100 text-gray-700 hover:bg-gray-200' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-6 py-6">
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-gray-900">
          Active alarms{' '}
          {data && <span className="text-gray-400 font-normal text-xl">({data.counts.total})</span>}
        </h1>
        <div className="flex gap-2 flex-wrap">
          {filterBtns.map(({ key, label, cls }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border border-transparent ${
                filter === key ? 'bg-[#1F4E78] text-white' : cls
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {loading && !data ? <Spinner /> : error ? <p className="text-red-600">{error}</p> : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Severity', 'Asset ID', 'Description', 'Site', 'Raised', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data!.alarms.map((a: Record<string, string>) => (
                <tr key={a.id} className={`hover:bg-gray-50 ${a.severity === 'critical' ? 'border-l-4 border-l-red-500' : ''}`}>
                  <td className="px-4 py-3"><SeverityPill s={a.severity} /></td>
                  <td className="px-4 py-3 font-mono font-semibold text-xs">{a.asset_id}</td>
                  <td className="px-4 py-3 text-gray-700 max-w-xs">{a.description}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{a.site_name}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{String(a.raised_at).substring(11, 16)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                      a.status === 'acknowledged' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      {a.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => navigate(`/assets/${a.asset_id}`)}
                        className="text-blue-600 hover:underline text-xs"
                      >
                        View asset
                      </button>
                      {a.status === 'active' && (
                        <button
                          onClick={() => handleAcknowledge(Number(a.id), a.asset_id)}
                          className="text-gray-500 hover:text-gray-800 text-xs"
                        >
                          Acknowledge
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {data!.alarms.length === 0 && (
            <p className="text-center text-gray-400 text-sm py-12">No alarms in this category</p>
          )}
        </div>
      )}
    </div>
  );
}
