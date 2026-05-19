import { useNavigate } from 'react-router';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Package, Activity, AlertCircle, Clock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useApi } from '../hooks/useApi';
import { usePolling } from '../hooks/usePolling';
import { getDashboard } from '../api/dashboard';
import { Spinner, SeverityPill } from '../components/Shared';

export function DashboardPage() {
  const { user }   = useAuth();
  const navigate   = useNavigate();
  const { data, loading, error, reload } = useApi(getDashboard);

  // Auto-refresh every 30 seconds
  usePolling(reload, 30_000);

  if (loading && !data) return <Spinner />;
  if (error) return <p className="p-8 text-red-600">{error}</p>;
  if (!data) return null;

  const { kpis, fleet_location, duty_profile, recent_alarms } = data;

  return (
    <div className="max-w-7xl mx-auto px-6 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Good morning, {user?.name?.split(' ')[0] ?? 'Werner'}
        </h1>
        <p className="text-sm text-gray-500">Monday, 11 May 2026 · 09:42 SAST</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-2">
            <Package className="w-3.5 h-3.5" /> Tagged assets
          </div>
          <div className="text-3xl font-bold text-gray-900">{kpis.tagged_assets.toLocaleString()}</div>
          <div className="text-xs text-gray-500 mt-1">of {kpis.deployed_target.toLocaleString()} deployed</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-2">
            <Activity className="w-3.5 h-3.5" /> In service today
          </div>
          <div className="text-3xl font-bold text-gray-900">{kpis.in_service.toLocaleString()}</div>
          <div className="text-xs text-emerald-600 mt-1 font-medium">{kpis.utilisation_pct}% utilisation</div>
        </div>
        <div className="bg-white border border-l-4 border-l-red-500 border-gray-200 rounded-xl p-5">
          <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-2">
            <AlertCircle className="w-3.5 h-3.5 text-red-500" /> Active alarms
          </div>
          <div className="text-3xl font-bold text-red-600">{kpis.active_alarms}</div>
          <div className="text-xs text-gray-500 mt-1">
            {kpis.critical_alarms} critical · {kpis.warning_alarms} warning
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-2">
            <Clock className="w-3.5 h-3.5" /> Avg drill duty 24h
          </div>
          <div className="text-3xl font-bold text-gray-900">{kpis.avg_monthly_hours} h</div>
          <div className="text-xs text-emerald-600 mt-1 font-medium">within spec</div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h3 className="font-semibold text-sm text-gray-900 mb-4">Fleet location</h3>
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={fleet_location} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#6B7280' }} />
                <YAxis type="category" dataKey="label" width={110} tick={{ fontSize: 12, fill: '#374151' }} />
                <Tooltip formatter={(v: number) => [v.toLocaleString(), 'assets']} />
                <Bar dataKey="count" fill="#1F4E78" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h3 className="font-semibold text-sm text-gray-900 mb-1">Drill duty profile, last 24 hours</h3>
          <p className="text-xs text-gray-500 mb-3">Currently 3,142 drilling</p>
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={duty_profile}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis dataKey="hour" tick={{ fontSize: 10, fill: '#6B7280' }} />
                <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} />
                <Tooltip formatter={(v: number) => [v.toLocaleString(), 'drilling']} />
                <Line type="monotone" dataKey="drilling" stroke="#1F4E78" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Alarms table */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-sm text-gray-900">Active alarms</h3>
          <button onClick={() => navigate('/alarms')} className="text-xs text-blue-600 hover:underline">
            View all {kpis.active_alarms}
          </button>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-gray-500 uppercase tracking-wide border-b border-gray-100">
              {['Severity', 'Asset', 'Description', 'Site', 'Raised', ''].map(h => (
                <th key={h} className="text-left pb-2 font-semibold">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {recent_alarms.map((a: Record<string, string>, i: number) => (
              <tr key={a.id} className={`border-b border-gray-50 hover:bg-gray-50 ${a.severity === 'critical' ? 'border-l-4 border-l-red-500' : ''}`}>
                <td className="py-3 pr-3"><SeverityPill s={a.severity} /></td>
                <td className="py-3 pr-3 font-mono font-semibold text-xs">{a.asset_id}</td>
                <td className="py-3 pr-3 text-gray-700">{a.description}</td>
                <td className="py-3 pr-3 text-gray-500 text-xs">{a.site_name}</td>
                <td className="py-3 pr-3 text-gray-400 text-xs">{String(a.raised_at).substring(11, 16)}</td>
                <td className="py-3">
                  {i === 0 && (
                    <button
                      onClick={() => navigate(`/assets/${a.asset_id}`)}
                      className="px-3 py-1 bg-[#1F4E78] text-white rounded text-xs hover:bg-[#19406a]"
                    >
                      View
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
