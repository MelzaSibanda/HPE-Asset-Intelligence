import { useNavigate } from 'react-router';
import { useApi }     from '../hooks/useApi';
import { getMapData } from '../api/map';
import { Spinner }    from '../components/Shared';

const SITE_POS: Record<string, { cx: number; cy: number }> = {
  HQ:  { cx: 510, cy: 68  },
  MPN: { cx: 95,  cy: 198 },
  TT:  { cx: 215, cy: 228 },
  DRF: { cx: 322, cy: 215 },
  KUS: { cx: 162, cy: 290 },
  KLF: { cx: 150, cy: 108 },
  SD:  { cx: 430, cy: 262 },
};

export function MapPage() {
  const navigate = useNavigate();
  const { data, loading, error } = useApi(getMapData);

  if (loading) return <Spinner />;
  if (error || !data) return <p className="p-8 text-red-600">{error}</p>;

  const { sites, shaft_data } = data;
  const maxCount = Math.max(...sites.map(s => s.asset_count));

  return (
    <div className="max-w-7xl mx-auto px-6 py-6">
      <div className="grid grid-cols-4 gap-4">
        <div className="col-span-3 space-y-4">
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="font-semibold text-sm text-gray-900">Site map — West Rand / Far West Rand</span>
              <span className="text-xs text-gray-500">
                {sites.reduce((s, x) => s + x.asset_count, 0).toLocaleString()} assets across {sites.length} sites
              </span>
            </div>
            <div className="bg-[#EEF2F7] rounded-lg overflow-hidden border border-gray-200">
              <svg viewBox="0 0 720 340" className="w-full">
                <polygon points="60,10 660,12 695,185 640,310 100,315 38,188" fill="#E4EBF5" stroke="#C7D4E8" strokeWidth="1.5" />
                <polygon points="38,188 100,315 640,310 660,345 30,345" fill="#DDE5F0" stroke="#C7D4E8" strokeWidth="1" />
                <text x="580" y="190" fill="#94A3B8" fontSize="13" fontStyle="italic">Gauteng</text>
                <text x="80"  y="338" fill="#94A3B8" fontSize="11" fontStyle="italic">Free State</text>
                <line x1="60" y1="165" x2="680" y2="165" stroke="#D1D5DB" strokeWidth="1" strokeDasharray="3,5" />
                <line x1="300" y1="10" x2="295" y2="315" stroke="#D1D5DB" strokeWidth="1" strokeDasharray="3,5" />

                {sites.map(site => {
                  const pos = SITE_POS[site.code];
                  if (!pos) return null;
                  const r  = site.is_hq ? 17 : Math.round(16 + (site.asset_count / maxCount) * 22);
                  const clickable = !site.is_hq;
                  return (
                    <g
                      key={site.id}
                      onClick={clickable ? () => navigate(`/assets?site=${site.id}`) : undefined}
                      style={{ cursor: clickable ? 'pointer' : 'default' }}
                    >
                      <circle cx={pos.cx} cy={pos.cy} r={r + 6} fill={site.is_hq ? '#3B82F6' : '#1F4E78'} opacity={0.12} />
                      <circle cx={pos.cx} cy={pos.cy} r={r}     fill={site.is_hq ? '#3B82F6' : '#1F4E78'} />
                      <text x={pos.cx} y={pos.cy - 2} textAnchor="middle" fill="white" fontSize={site.is_hq ? 10 : 11} fontWeight="700" style={{ pointerEvents: 'none' }}>
                        {site.is_hq ? 'HQ' : site.name.split(' ')[0]}
                      </text>
                      <text x={pos.cx} y={pos.cy + 10} textAnchor="middle" fill="white" fontSize="9" style={{ pointerEvents: 'none' }}>
                        {site.asset_count.toLocaleString()}
                      </text>
                      {site.critical_count > 0 && (
                        <>
                          <circle cx={pos.cx + r - 4} cy={pos.cy - r + 4} r="6" fill="#EF4444" />
                          <circle cx={pos.cx + r - 4} cy={pos.cy - r + 4} r="3" fill="white" />
                        </>
                      )}
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h3 className="font-semibold text-sm text-gray-900 mb-4">Underground time-in-shaft</h3>
            <div className="space-y-2">
              {shaft_data.map(row => (
                <div key={row.shaft} className="flex items-center gap-3">
                  <div className="w-48 text-xs text-gray-700 shrink-0">{row.shaft}</div>
                  <div className="flex-1 h-6 bg-gray-100 rounded">
                    <div
                      className="h-full bg-[#1F4E78] rounded flex items-center px-2"
                      style={{ width: `${(row.hours / 16) * 100}%` }}
                    >
                      <span className="text-[10px] text-white font-semibold">{row.hours} h/day</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <h4 className="font-semibold text-xs text-gray-900 mb-3">Filters</h4>
            {[['Asset type', ['All', 'Drills', 'Pumps', 'Thrust legs']], ['Status', ['All', 'In service', 'In transit', 'Underground', 'In workshop']]].map(([label, opts]) => (
              <div key={String(label)} className="mb-3">
                <label className="block text-xs font-medium text-gray-600 mb-1">{String(label)}</label>
                <select className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs text-gray-700">
                  {(opts as string[]).map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
            ))}
            <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
              <input type="checkbox" className="rounded" /> Active alarms only
            </label>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <h4 className="font-semibold text-xs text-gray-900 mb-3">Site summary</h4>
            {sites.filter(s => !s.is_hq).map(s => (
              <button
                key={s.id}
                onClick={() => navigate(`/assets?site=${s.id}`)}
                className="w-full flex justify-between text-xs py-1.5 border-b border-gray-50 last:border-0 hover:text-blue-600 transition-colors"
              >
                <span className="text-gray-600">{s.name}</span>
                <span className="font-semibold">{s.asset_count.toLocaleString()}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
