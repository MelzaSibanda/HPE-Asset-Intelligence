import { useState } from 'react';
import { ChevronLeft, Activity, Clock, Wrench, GitBranch, Battery } from 'lucide-react';
import { toast } from 'sonner';
import { runReport, type ReportType } from '../api/reports';
import { Spinner } from '../components/Shared';

const REPORTS = [
  { key: 'utilisation',      icon: <Activity className="w-5 h-5" />,   title: 'Asset utilisation by site',    desc: 'Drill and pump operating hours compared across all six mines, with shift breakdowns.' },
  { key: 'time-in-shaft',    icon: <Clock className="w-5 h-5" />,      title: 'Time-in-shaft analysis',       desc: 'Average underground hours by shaft with statistical outlier flagging and trend lines.' },
  { key: 'maintenance',      icon: <Wrench className="w-5 h-5" />,     title: 'Maintenance forecast',         desc: 'Assets approaching service intervals or showing early wear signatures in sensor data.' },
  { key: 'movement-log',     icon: <GitBranch className="w-5 h-5" />,  title: 'Movement event log',           desc: 'Full audit trail of all seven status transitions per asset, exportable for SQL Server.' },
  { key: 'condition-trends', icon: <Activity className="w-5 h-5" />,   title: 'Condition monitoring trends',  desc: 'Vibration and temperature trends by asset type, with threshold exceedance history.' },
  { key: 'battery-health',   icon: <Battery className="w-5 h-5" />,    title: 'Battery and tag health',       desc: 'Replacement scheduling for Phase 2 condition-monitoring sensor tags across the fleet.' },
] as const;

export function ReportsPage() {
  const [result,     setResult]     = useState<{ title: string; generated_at: string; rows: Record<string, unknown>[] } | null>(null);
  const [loadingKey, setLoadingKey] = useState<string | null>(null);

  async function handleRun(key: ReportType) {
    setLoadingKey(key);
    try {
      const r = await runReport(key);
      setResult(r);
    } catch {
      toast.error('Failed to run report');
    } finally {
      setLoadingKey(null);
    }
  }

  function handleExport() {
    if (!result?.rows.length) return;
    const head  = Object.keys(result.rows[0]).join(',');
    const lines = result.rows.map(r => Object.values(r).map(v => `"${v ?? ''}"`).join(','));
    const blob  = new Blob([[head, ...lines].join('\n')], { type: 'text/csv' });
    const a     = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${result.title.replace(/\s+/g, '_')}.csv`;
    a.click();
    toast.success('Report exported');
  }

  if (result) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{result.title}</h2>
            <p className="text-xs text-gray-400 mt-1">Generated {result.generated_at}</p>
          </div>
          <div className="flex gap-3">
            <button onClick={handleExport} className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
              Export CSV
            </button>
            <button onClick={() => setResult(null)} className="flex items-center gap-1 px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
              <ChevronLeft className="w-4 h-4" /> All reports
            </button>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          {result.rows.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-12">No data returned</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {Object.keys(result.rows[0]).map(k => (
                      <th key={k} className="px-4 py-3 text-left font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                        {k.replace(/_/g, ' ')}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {result.rows.map((row, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      {Object.values(row).map((v, j) => (
                        <td key={j} className="px-4 py-3 text-gray-700 whitespace-nowrap">{String(v ?? '—')}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Reports</h1>
      <div className="grid grid-cols-3 gap-4 mb-4">
        {REPORTS.map(r => (
          <div key={r.key} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-[#1F4E78] mb-4">
              {r.icon}
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">{r.title}</h3>
            <p className="text-sm text-gray-500 mb-4 leading-relaxed">{r.desc}</p>
            <button
              onClick={() => handleRun(r.key)}
              disabled={!!loadingKey}
              className="w-full py-2 bg-[#1F4E78] text-white rounded-lg text-sm font-medium hover:bg-[#19406a] disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loadingKey === r.key ? <><Spinner className="h-4" />Running…</> : 'Run report'}
            </button>
          </div>
        ))}
      </div>
      <div className="bg-white border border-gray-200 rounded-xl p-5 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-gray-900 mb-1">Custom report</h3>
          <p className="text-sm text-gray-500">Direct access to HPE's Microsoft SQL Server via SQL Studio.</p>
        </div>
        <button className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
          Build via SQL Studio →
        </button>
      </div>
    </div>
  );
}
