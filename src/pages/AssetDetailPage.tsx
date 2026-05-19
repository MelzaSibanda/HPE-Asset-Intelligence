import { useParams, useNavigate, Link } from 'react-router';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import {
  ChevronRight, Clock, Calendar, Activity,
  Thermometer, Battery, AlertTriangle, Eye,
} from 'lucide-react';
import { toast } from 'sonner';
import { useApi } from '../hooks/useApi';
import { getAsset, getVibrationTrace } from '../api/assets';
import { acknowledgeAlarm } from '../api/alarms';
import { createWorkOrder } from '../api/workOrders';
import { Spinner, SeverityPill } from '../components/Shared';

const MOVEMENT_LABEL: Record<string, string> = {
  dispatched_hq: 'Dispatched HQ', in_transit: 'In transit',
  received_mine: 'Received at mine', dispatched_ug: 'Dispatched UG',
  returned_ug: 'Returned from UG', dispatched_hq_return: 'Dispatched to HQ',
  received_hq: 'Received at HQ',
};

export function AssetDetailPage() {
  const { assetId } = useParams<{ assetId: string }>();
  const navigate    = useNavigate();

  const { data, loading, error, reload } = useApi(() => getAsset(assetId!), [assetId]);
  const { data: vibData, loading: vibLoading } = useApi(() => getVibrationTrace(assetId!), [assetId]);

  async function handleAcknowledge() {
    if (!data?.alarm) return;
    try {
      await acknowledgeAlarm(Number(data.alarm.id));
      toast.success('Alarm acknowledged');
      reload();
      navigate('/alarms');
    } catch { toast.error('Failed to acknowledge alarm'); }
  }

  async function handleCreateWO() {
    if (!data) return;
    try {
      const wo = await createWorkOrder({
        asset_id: data.asset.asset_id,
        site_id:  Number(data.asset.current_site_id),
        reason:   `Critical vibration alarm — chuck bearing wear (${data.asset.vibration_rms} g)`,
        priority: 'critical',
        replacement_unit: `${data.asset.model} spare, workshop slot 14`,
        estimated_hours: 2,
      });
      toast.success(`Work order ${wo.wo_number} created`);
      navigate(`/work-orders/${wo.wo_number}`);
    } catch { toast.error('Failed to create work order'); }
  }

  if (loading) return <Spinner />;
  if (error || !data) return <p className="p-8 text-red-600">{error ?? 'Asset not found'}</p>;

  const { asset, alarm, movements } = data;
  const isOverdue = asset.next_service_due && new Date(asset.next_service_due) < new Date();

  return (
    <div className="max-w-7xl mx-auto px-6 py-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-xs mb-4">
        <Link to="/assets" className="text-blue-600 hover:underline">Assets</Link>
        <ChevronRight className="w-3 h-3 text-gray-400" />
        <span className="text-gray-700 font-medium">{asset.asset_id}</span>
      </div>

      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-4">
        <div className="flex items-start justify-between mb-5 flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1.5 flex-wrap">
              <h1 className="text-2xl font-bold text-gray-900">{asset.asset_id}</h1>
              {alarm && <SeverityPill s={alarm.severity} />}
              <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                {asset.location_detail}
              </span>
            </div>
            <p className="text-sm text-gray-500">
              {asset.type_name} · HPE model {asset.model} · serial {asset.serial_number} · {asset.site_name}
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            {alarm && (
              <button onClick={handleAcknowledge}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
                Acknowledge alarm
              </button>
            )}
            <button onClick={handleCreateWO}
              className="px-4 py-2 bg-[#1F4E78] text-white rounded-lg text-sm hover:bg-[#19406a]">
              Create work order
            </button>
          </div>
        </div>

        {/* KPI mini-cards */}
        <div className="grid grid-cols-5 gap-3">
          {[
            { icon: <Clock className="w-3.5 h-3.5" />,       label: 'Lifetime hours',  value: Number(asset.lifetime_hours).toLocaleString(), red: false },
            { icon: <Calendar className="w-3.5 h-3.5" />,    label: 'Hours this month', value: String(asset.monthly_hours),                  red: false },
            { icon: <Activity className="w-3.5 h-3.5" />,    label: 'Vibration RMS',   value: `${asset.vibration_rms} g`,                   red: Number(asset.vibration_rms) > 3.5 },
            { icon: <Thermometer className="w-3.5 h-3.5" />, label: 'Temperature',     value: `${asset.temperature} °C`,                    red: Number(asset.temperature) > 90 },
            { icon: <Battery className="w-3.5 h-3.5" />,     label: 'Battery',         value: `${asset.battery_pct ?? '—'}%`,               red: Number(asset.battery_pct) < 15 },
          ].map(k => (
            <div key={k.label} className={`rounded-lg p-3 ${k.red ? 'bg-red-50 border border-red-200' : 'bg-gray-50'}`}>
              <div className={`flex items-center gap-1.5 mb-1 text-xs ${k.red ? 'text-red-600' : 'text-gray-500'}`}>
                {k.icon}{k.label}
              </div>
              <div className={`text-xl font-bold ${k.red ? 'text-red-600' : 'text-gray-900'}`}>{k.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div
          className="col-span-2 bg-white border border-gray-200 rounded-xl p-5 cursor-pointer hover:border-blue-400 transition-colors"
          onClick={() => navigate(`/assets/${assetId}/vibration`)}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold text-sm text-gray-900">Vibration trace, last 30 days</span>
            <span className="text-xs text-blue-600 flex items-center gap-1">
              <Eye className="w-3 h-3" /> Drill into physics
            </span>
          </div>
          {vibLoading ? <Spinner /> : vibData && (
            <div style={{ height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={vibData.readings}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                  <XAxis dataKey="day" tick={{ fontSize: 9, fill: '#9CA3AF' }} tickFormatter={v => String(v).substring(5)} />
                  <YAxis domain={[0, 5]} tick={{ fontSize: 11, fill: '#6B7280' }} tickFormatter={v => `${v}g`} />
                  <Tooltip formatter={(v: number) => [`${v} g`, 'Vibration RMS']} />
                  <ReferenceLine y={2.5} stroke="#F59E0B" strokeDasharray="5 4" label={{ value: 'Warning', position: 'right', fontSize: 10, fill: '#F59E0B' }} />
                  <ReferenceLine y={3.5} stroke="#EF4444" strokeDasharray="5 4" label={{ value: 'Alarm', position: 'right', fontSize: 10, fill: '#EF4444' }} />
                  <Line type="monotone" dataKey="vibration_rms" stroke="#1F4E78" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h3 className="font-semibold text-sm text-gray-900 mb-4">Asset registry</h3>
          {[
            ['Asset ID', asset.asset_id, true],
            ['EPC tag',  asset.epc_tag,  true],
            ['Type',     asset.type_name],
            ['Model',    asset.model],
            ['Commissioned', asset.commissioned_at],
            ['Tagged',       asset.tagged_at],
            ['Current site', asset.site_name],
            ['Last service', asset.last_service_at],
            ['Next due',     isOverdue ? 'overdue' : asset.next_service_due, false, isOverdue],
          ].map(([k, v, mono, overdue]) => (
            <div key={String(k)} className="flex justify-between items-center py-1.5 border-b border-gray-50 last:border-0 text-xs">
              <span className="text-gray-500">{k}</span>
              <span className={`font-medium ${overdue ? 'text-red-600 font-bold' : 'text-gray-900'} ${mono ? 'font-mono text-[11px]' : ''}`}>
                {String(v ?? '—')}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Timeline + Diagnostics */}
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 bg-white border border-gray-200 rounded-xl p-5">
          <h3 className="font-semibold text-sm text-gray-900 mb-4">Lifecycle timeline</h3>
          {[
            ...(alarm ? [{
              color: 'bg-red-500',
              time: String(alarm.raised_at).substring(0, 16).replace('T', ' '),
              label: 'critical', text: alarm.description,
            }] : []),
            ...movements.map((m: Record<string, string>) => ({
              color: 'bg-indigo-500',
              time: String(m.occurred_at).substring(0, 16).replace('T', ' '),
              label: MOVEMENT_LABEL[m.event_type] ?? m.event_type,
              text: m.notes ?? '',
            })),
          ].map((ev, i, arr) => (
            <div key={i} className="flex gap-3">
              <div className="flex flex-col items-center w-3">
                <div className={`w-2.5 h-2.5 rounded-full mt-1 shrink-0 ${ev.color}`} />
                {i < arr.length - 1 && <div className="w-0.5 bg-gray-200 flex-1 mt-1" />}
              </div>
              <div className="pb-4 flex-1">
                <div className="text-[10px] text-gray-400">{ev.time}</div>
                <div className="text-xs text-gray-900">
                  <span className="inline-flex px-1.5 py-0.5 rounded text-[10px] bg-indigo-100 text-indigo-700 font-medium mr-1.5">
                    {ev.label}
                  </span>
                  {ev.text}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h3 className="font-semibold text-sm text-gray-900 mb-4">Diagnostic snapshot</h3>
          {[
            ['Vibration RMS',  `${asset.vibration_rms} g`, Number(asset.vibration_rms) > 3.5],
            ['Temperature',    `${asset.temperature} °C`,  Number(asset.temperature) > 90],
            ['Battery',        `${asset.battery_pct ?? '—'}%`, Number(asset.battery_pct) < 15],
            ['Lifetime hours', Number(asset.lifetime_hours).toLocaleString(), false],
            ['Monthly hours',  String(asset.monthly_hours), false],
          ].map(([k, v, red]) => (
            <div key={String(k)} className="flex justify-between text-xs py-1.5 border-b border-gray-50 last:border-0">
              <span className="text-gray-500">{k}</span>
              <span className={`font-semibold ${red ? 'text-red-600' : 'text-gray-900'}`}>{String(v)}</span>
            </div>
          ))}
          {alarm && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-1.5 mb-1.5 text-red-800 text-xs font-semibold">
                <AlertTriangle className="w-3.5 h-3.5" /> Recommended action
              </div>
              <p className="text-[11px] text-red-700 leading-relaxed">
                Recall to surface this shift. Vibration signature consistent with chuck bearing wear.
                Spare {asset.model} available at {asset.site_name} workshop, slot 14.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
