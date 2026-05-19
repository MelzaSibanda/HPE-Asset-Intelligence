import { useState } from 'react';
import { toast } from 'sonner';
import { Plus, Trash2, Key, Server } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useApi } from '../hooks/useApi';
import api from '../lib/api';
import { Spinner } from '../components/Shared';

// ── API helpers (settings-specific) ────────────────────────
const getSystem  = () => api.get('/settings/system').then(r => r.data.data);
const getUsers   = () => api.get('/users').then(r => r.data.data as Record<string, string>[]);

export function SettingsPage() {
  const { user: me } = useAuth();
  const [tab, setTab] = useState<'account' | 'users' | 'system'>('account');

  return (
    <div className="max-w-5xl mx-auto px-6 py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
        {([
          { key: 'account', label: 'My account' },
          ...(me?.role === 'admin' ? [
            { key: 'users',   label: 'User management' },
            { key: 'system',  label: 'System status'   },
          ] : []),
        ] as { key: 'account' | 'users' | 'system'; label: string }[]).map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t.key ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'account' && <AccountTab />}
      {tab === 'users'   && <UsersTab />}
      {tab === 'system'  && <SystemTab />}
    </div>
  );
}

// ── Account tab ────────────────────────────────────────────
function AccountTab() {
  const { user: me } = useAuth();
  const [current, setCurrent] = useState('');
  const [next,    setNext]    = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving,  setSaving]  = useState(false);

  async function handlePwChange(e: React.FormEvent) {
    e.preventDefault();
    if (next !== confirm) return toast.error('New passwords do not match');
    if (next.length < 8)  return toast.error('Password must be at least 8 characters');
    setSaving(true);
    try {
      await api.post('/auth/change-password', { current_password: current, new_password: next });
      toast.success('Password changed successfully');
      setCurrent(''); setNext(''); setConfirm('');
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to change password';
      toast.error(msg);
    } finally { setSaving(false); }
  }

  return (
    <div className="grid grid-cols-2 gap-6">
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Profile</h2>
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-full bg-[#1F4E78] text-white flex items-center justify-center text-xl font-bold">
            {me?.initials}
          </div>
          <div>
            <p className="font-semibold text-gray-900">{me?.name}</p>
            <p className="text-sm text-gray-500">{me?.email}</p>
            <span className="inline-flex mt-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 capitalize">
              {me?.role}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Key className="w-4 h-4" /> Change password
        </h2>
        <form onSubmit={handlePwChange} className="space-y-3">
          {[
            ['Current password', current, setCurrent],
            ['New password',     next,    setNext],
            ['Confirm new',      confirm, setConfirm],
          ].map(([label, val, setter]) => (
            <div key={String(label)}>
              <label className="block text-xs font-medium text-gray-600 mb-1">{String(label)}</label>
              <input
                type="password"
                value={String(val)}
                onChange={e => (setter as (v: string) => void)(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1F4E78]"
              />
            </div>
          ))}
          <button type="submit" disabled={saving}
            className="w-full py-2 bg-[#1F4E78] text-white rounded-lg text-sm font-medium hover:bg-[#19406a] disabled:opacity-60">
            {saving ? 'Saving…' : 'Update password'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Users tab (admin only) ─────────────────────────────────
function UsersTab() {
  const { data: users, loading, reload } = useApi(getUsers);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'viewer' });
  const [saving, setSaving] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/users', form);
      toast.success('User created');
      setShowForm(false);
      setForm({ name: '', email: '', password: '', role: 'viewer' });
      reload();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to create user';
      toast.error(msg);
    } finally { setSaving(false); }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete user "${name}"?`)) return;
    try {
      await api.delete(`/users/${id}`);
      toast.success('User deleted');
      reload();
    } catch { toast.error('Failed to delete user'); }
  }

  if (loading) return <Spinner />;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500">{users?.length ?? 0} users</p>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-[#1F4E78] text-white rounded-lg text-sm hover:bg-[#19406a]">
          <Plus className="w-3.5 h-3.5" /> Add user
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white border border-gray-200 rounded-xl p-5 grid grid-cols-2 gap-4">
          <h3 className="col-span-2 font-semibold text-gray-900">New user</h3>
          {[
            ['Full name', 'name',     'text',     form.name],
            ['Email',     'email',    'email',    form.email],
            ['Password',  'password', 'password', form.password],
          ].map(([label, key, type, val]) => (
            <div key={String(key)}>
              <label className="block text-xs font-medium text-gray-600 mb-1">{String(label)}</label>
              <input type={String(type)} value={String(val)} required
                onChange={e => setForm(f => ({ ...f, [String(key)]: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1F4E78]" />
            </div>
          ))}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Role</label>
            <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
              <option value="viewer">Viewer</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="col-span-2 flex gap-3">
            <button type="submit" disabled={saving}
              className="px-4 py-2 bg-[#1F4E78] text-white rounded-lg text-sm disabled:opacity-60">
              {saving ? 'Creating…' : 'Create user'}
            </button>
            <button type="button" onClick={() => setShowForm(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm">
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {['Name', 'Email', 'Role', 'Joined', ''].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users?.map(u => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#1F4E78] text-white flex items-center justify-center text-xs font-bold">
                      {u.initials}
                    </div>
                    {u.name}
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-600 text-xs">{u.email}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                    u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'
                  }`}>{u.role}</span>
                </td>
                <td className="px-4 py-3 text-gray-400 text-xs">{String(u.created_at).substring(0, 10)}</td>
                <td className="px-4 py-3">
                  <button onClick={() => handleDelete(u.id, u.name)}
                    className="text-red-400 hover:text-red-600 p-1 rounded">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── System status tab ──────────────────────────────────────
function SystemTab() {
  const { data, loading } = useApi(getSystem);

  if (loading) return <Spinner />;
  if (!data) return null;

  return (
    <div className="grid grid-cols-2 gap-6">
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Server className="w-4 h-4" /> Environment
        </h2>
        {[
          ['PHP version',   data.php_version],
          ['CodeIgniter',   data.ci_version],
          ['Database',      data.db_version],
          ['Environment',   data.environment],
          ['Server time',   data.server_time],
          ['Timezone',      data.timezone],
        ].map(([k, v]) => (
          <div key={String(k)} className="flex justify-between text-sm py-2 border-b border-gray-50 last:border-0">
            <span className="text-gray-500">{k}</span>
            <span className="font-mono text-xs text-gray-900 font-medium">{String(v)}</span>
          </div>
        ))}
      </div>
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Database summary</h2>
        {[
          ['Total assets',       data.asset_count],
          ['Active alarms',      data.active_alarms],
          ['Open work orders',   data.open_work_orders],
          ['Users',              data.user_count],
        ].map(([k, v]) => (
          <div key={String(k)} className="flex justify-between text-sm py-2 border-b border-gray-50 last:border-0">
            <span className="text-gray-500">{k}</span>
            <span className="font-bold text-gray-900">{String(v)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
