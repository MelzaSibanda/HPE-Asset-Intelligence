import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Search, Filter, Download, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useApi } from '../hooks/useApi';
import { getAssets } from '../api/assets';
import { Spinner, StatusPill } from '../components/Shared';

export function AssetsPage() {
  const navigate  = useNavigate();
  const [page, setPage]     = useState(1);
  const [search, setSearch] = useState('');
  const [dSearch, setDS]    = useState('');

  useEffect(() => {
    const t = setTimeout(() => { setDS(search); setPage(1); }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const { data, loading, error } = useApi(
    () => getAssets({ page, per_page: 12, search: dSearch }),
    [page, dSearch]
  );

  async function handleExport() {
    if (!data) return;
    const rows  = data.data;
    const head  = ['Asset ID', 'Type', 'Model', 'Site', 'Location', 'Status', 'Lifetime Hours', 'Battery %'];
    const lines = [
      head.join(','),
      ...rows.map((r: Record<string, unknown>) =>
        [r.asset_id, r.type_name, r.model, r.site_name, r.location_detail,
         r.status, r.lifetime_hours, r.battery_pct].join(',')
      ),
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = 'hpe_assets.csv'; a.click();
    URL.revokeObjectURL(url);
    toast.success('Export complete');
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-6">
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Assets</h1>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by ID or model…"
              className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm w-56 focus:outline-none focus:ring-2 focus:ring-[#1F4E78]"
            />
          </div>
          <button className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
            <Filter className="w-3.5 h-3.5" /> Filters
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
          >
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
          <button
            onClick={() => navigate('/assets/new')}
            className="flex items-center gap-2 px-4 py-2 bg-[#1F4E78] text-white rounded-lg text-sm hover:bg-[#19406a]"
          >
            <Plus className="w-3.5 h-3.5" /> Add asset
          </button>
        </div>
      </div>

      {loading && !data ? <Spinner /> : error ? <p className="text-red-600">{error}</p> : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Asset ID', 'Type', 'Model', 'Location', 'Status', 'Last seen', 'Lifetime hrs', 'Battery'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data!.data.map((a: Record<string, unknown>) => (
                <tr
                  key={String(a.id)}
                  onClick={() => navigate(`/assets/${a.asset_id}`)}
                  className="hover:bg-gray-50 cursor-pointer"
                >
                  <td className="px-4 py-3 font-mono font-semibold text-xs">{String(a.asset_id)}</td>
                  <td className="px-4 py-3 text-gray-700">{String(a.type_name)}</td>
                  <td className="px-4 py-3 text-gray-700">{String(a.model)}</td>
                  <td className="px-4 py-3 text-gray-600 text-xs">{String(a.site_name)} · {String(a.location_detail)}</td>
                  <td className="px-4 py-3"><StatusPill s={String(a.status)} /></td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {a.last_seen_at
                      ? new Date(String(a.last_seen_at)).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })
                      : '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-700">{Number(a.lifetime_hours).toLocaleString()}</td>
                  <td className="px-4 py-3 text-gray-700">{a.battery_pct != null ? `${a.battery_pct}%` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
            <span className="text-xs text-gray-500">
              {data!.total > 0
                ? `Showing ${((page - 1) * 12) + 1}–${Math.min(page * 12, data!.total)} of ${data!.total.toLocaleString()}`
                : 'No assets found'}
            </span>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-3 py-1 border border-gray-300 rounded text-xs hover:bg-gray-100 disabled:opacity-40">
                Previous
              </button>
              <button onClick={() => setPage(p => Math.min(data!.last_page, p + 1))} disabled={page >= data!.last_page}
                className="px-3 py-1 border border-gray-300 rounded text-xs hover:bg-gray-100 disabled:opacity-40">
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
