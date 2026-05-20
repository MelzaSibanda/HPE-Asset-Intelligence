import { useState, useEffect, FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, Save, Loader } from 'lucide-react';
import { toast } from 'sonner';
import { createAsset, getAssetTypes, getSites } from '../api/assets';

interface AssetType { id: number; name: string; prefix: string }
interface Site      { id: number; name: string; code: string; is_hq: number }

const STATUSES   = ['active', 'maintenance', 'transit'] as const;
const LOCATIONS  = ['Workshop', 'Underground'] as const;

export function AddAssetPage() {
  const navigate = useNavigate();

  const [types, setTypes] = useState<AssetType[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    asset_id:        '',
    type_id:         '',
    model:           '',
    serial_number:   '',
    epc_tag:         '',
    site_id:         '',
    location_detail: 'Workshop',
    status:          'active',
    commissioned_at: new Date().toISOString().slice(0, 10),
    battery_pct:     '100',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    Promise.all([getAssetTypes(), getSites()])
      .then(([t, s]) => { setTypes(t); setSites(s); })
      .catch(() => toast.error('Failed to load form options'))
      .finally(() => setLoadingMeta(false));
  }, []);

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }));
    setErrors(e => { const n = { ...e }; delete n[field]; return n; });
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!form.asset_id.trim())  e.asset_id  = 'Asset ID is required';
    else if (!/^[A-Z]{2,5}-\d{4,6}$/.test(form.asset_id.toUpperCase()))
      e.asset_id = 'Format must be PREFIX-NNNNN (e.g. DRL-04217)';
    if (!form.type_id)          e.type_id   = 'Type is required';
    if (!form.model.trim())     e.model     = 'Model is required';
    if (!form.site_id)          e.site_id   = 'Site is required';
    return e;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setSaving(true);
    try {
      const payload = {
        ...form,
        asset_id:    form.asset_id.toUpperCase().trim(),
        type_id:     Number(form.type_id),
        site_id:     Number(form.site_id),
        battery_pct: form.battery_pct ? Number(form.battery_pct) : null,
      };
      const created = await createAsset(payload);
      toast.success(`Asset ${created.asset.asset_id} created`);
      navigate(`/assets/${created.asset.asset_id}`);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message ?? 'Failed to create asset';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  if (loadingMeta) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-6">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/assets')}
          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Add Asset</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-xl p-6 space-y-5">

        {/* Asset ID */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Asset ID <span className="text-red-500">*</span>
          </label>
          <input
            value={form.asset_id}
            onChange={e => set('asset_id', e.target.value.toUpperCase())}
            placeholder="e.g. DRL-04999"
            className={`w-full px-3 py-2 border rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#1F4E78] ${
              errors.asset_id ? 'border-red-400' : 'border-gray-300'
            }`}
          />
          {errors.asset_id && <p className="mt-1 text-xs text-red-600">{errors.asset_id}</p>}
          <p className="mt-1 text-xs text-gray-400">Format: PREFIX-NNNNN (e.g. DRL-04217, PMP-00521)</p>
        </div>

        {/* Type + Model */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type <span className="text-red-500">*</span>
            </label>
            <select
              value={form.type_id}
              onChange={e => set('type_id', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1F4E78] ${
                errors.type_id ? 'border-red-400' : 'border-gray-300'
              }`}
            >
              <option value="">Select type…</option>
              {types.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            {errors.type_id && <p className="mt-1 text-xs text-red-600">{errors.type_id}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Model <span className="text-red-500">*</span>
            </label>
            <input
              value={form.model}
              onChange={e => set('model', e.target.value)}
              placeholder="e.g. RD-9000"
              className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1F4E78] ${
                errors.model ? 'border-red-400' : 'border-gray-300'
              }`}
            />
            {errors.model && <p className="mt-1 text-xs text-red-600">{errors.model}</p>}
          </div>
        </div>

        {/* Serial + EPC */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Serial Number</label>
            <input
              value={form.serial_number}
              onChange={e => set('serial_number', e.target.value)}
              placeholder="e.g. RD9-2026-04999"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1F4E78]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">EPC Tag</label>
            <input
              value={form.epc_tag}
              onChange={e => set('epc_tag', e.target.value)}
              placeholder="e.g. E280689400005099999"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1F4E78]"
            />
          </div>
        </div>

        {/* Site + Location */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Site <span className="text-red-500">*</span>
            </label>
            <select
              value={form.site_id}
              onChange={e => set('site_id', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1F4E78] ${
                errors.site_id ? 'border-red-400' : 'border-gray-300'
              }`}
            >
              <option value="">Select site…</option>
              {sites.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name}{s.is_hq ? ' (HQ)' : ''}
                </option>
              ))}
            </select>
            {errors.site_id && <p className="mt-1 text-xs text-red-600">{errors.site_id}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
            <select
              value={form.location_detail}
              onChange={e => set('location_detail', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1F4E78]"
            >
              {LOCATIONS.map(l => <option key={l}>{l}</option>)}
            </select>
          </div>
        </div>

        {/* Status + Commissioned + Battery */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={form.status}
              onChange={e => set('status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1F4E78]"
            >
              {STATUSES.map(s => (
                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Commissioned</label>
            <input
              type="date"
              value={form.commissioned_at}
              onChange={e => set('commissioned_at', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1F4E78]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Battery %</label>
            <input
              type="number"
              min="0" max="100"
              value={form.battery_pct}
              onChange={e => set('battery_pct', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1F4E78]"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
          <button
            type="button"
            onClick={() => navigate('/assets')}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-[#1F4E78] text-white rounded-lg text-sm hover:bg-[#19406a] disabled:opacity-60"
          >
            {saving ? <Loader className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            {saving ? 'Saving…' : 'Create Asset'}
          </button>
        </div>
      </form>
    </div>
  );
}
