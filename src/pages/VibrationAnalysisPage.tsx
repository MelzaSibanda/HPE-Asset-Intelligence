import { useParams, Link } from 'react-router';
import { ChevronRight, CheckCircle } from 'lucide-react';
import { useApi }             from '../hooks/useApi';
import { getVibrationTrace }  from '../api/assets';
import { Spinner }            from '../components/Shared';

export function VibrationAnalysisPage() {
  const { assetId } = useParams<{ assetId: string }>();
  const { data, loading } = useApi(() => getVibrationTrace(assetId!), [assetId]);

  return (
    <div className="max-w-7xl mx-auto px-6 py-6">
      <div className="flex items-center gap-1.5 text-xs mb-4">
        <Link to="/assets"               className="text-blue-600 hover:underline">Assets</Link>
        <ChevronRight className="w-3 h-3 text-gray-400" />
        <Link to={`/assets/${assetId}`}  className="text-blue-600 hover:underline">{assetId}</Link>
        <ChevronRight className="w-3 h-3 text-gray-400" />
        <span className="text-gray-700">Vibration analysis</span>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-8">
        <h1 className="text-xl font-bold text-gray-900 mb-2">Pump signature separation</h1>
        <p className="text-sm text-gray-600 mb-8">How we tell adjacent pumps apart on a shared power-pack frame.</p>

        {/* Diagram */}
        <div className="bg-gray-50 rounded-xl border border-gray-200 mb-8 overflow-hidden">
          <svg viewBox="0 0 760 200" className="w-full">
            <rect x="20" y="155" width="720" height="22" rx="3" fill="#64748B" />
            <text x="380" y="169" textAnchor="middle" fill="white" fontSize="11" fontWeight="600">Steel power-pack frame</text>
            <path d="M 285 120 Q 380 50 475 120" stroke="#EF4444" strokeWidth="2" strokeDasharray="6,4" fill="none" />
            <text x="380" y="44" textAnchor="middle" fill="#EF4444" fontSize="11" fontWeight="500">Cross-talk through frame</text>
            <rect x="60"  y="88" width="220" height="70" rx="8" fill="#EFF6FF" stroke="#3B82F6" strokeWidth="2" />
            <text x="170" y="118" textAnchor="middle" fill="#1E40AF" fontSize="13" fontWeight="700">Pump A — Target</text>
            <text x="170" y="136" textAnchor="middle" fill="#3B82F6" fontSize="12">Running 49 Hz</text>
            <circle cx="240" cy="100" r="7" fill="#3B82F6" stroke="white" strokeWidth="2" />
            <text x="255" y="96" fill="#374151" fontSize="10">accelerometer</text>
            <rect x="480" y="88" width="220" height="70" rx="8" fill="#FFF7ED" stroke="#F59E0B" strokeWidth="1.5" strokeDasharray="5,3" />
            <text x="590" y="118" textAnchor="middle" fill="#92400E" fontSize="13" fontWeight="700">Pump B — Adjacent</text>
            <text x="590" y="136" textAnchor="middle" fill="#D97706" fontSize="12">Running 47 Hz</text>
          </svg>
        </div>

        <div className="grid grid-cols-4 gap-6">
          <div className="col-span-3 space-y-6">
            {/* FFT before */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">FFT spectrum — before filtering</p>
              <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
                <svg viewBox="0 0 600 180" className="w-full">
                  <line x1="45" y1="150" x2="575" y2="150" stroke="#E5E7EB" strokeWidth="2" />
                  <line x1="45" y1="150" x2="45"  y2="20"  stroke="#E5E7EB" strokeWidth="2" />
                  <rect x="148" y="82"  width="24" height="68"  fill="#F59E0B" opacity=".7" />
                  <text x="160" y="164" textAnchor="middle" fill="#D97706" fontSize="10" fontWeight="600">47 Hz</text>
                  <rect x="183" y="35"  width="28" height="115" fill="#3B82F6" />
                  <text x="197" y="164" textAnchor="middle" fill="#1E40AF" fontSize="10" fontWeight="700">49 Hz</text>
                  <rect x="340" y="105" width="18" height="45"  fill="#3B82F6" opacity=".45" />
                  <text x="349" y="164" textAnchor="middle" fill="#6B7280" fontSize="9">~98 Hz</text>
                  <rect x="490" y="122" width="14" height="28"  fill="#3B82F6" opacity=".25" />
                  <text x="497" y="164" textAnchor="middle" fill="#6B7280" fontSize="9">~147 Hz</text>
                  <rect x="175" y="22"  width="50" height="136" fill="none" stroke="#10B981" strokeWidth="2" strokeDasharray="4,3" rx="2" />
                  <text x="200" y="17"  textAnchor="middle" fill="#10B981" fontSize="9" fontWeight="600">Narrow-band filter</text>
                </svg>
              </div>
            </div>
            {/* FFT after */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">After filtering — Pump A isolated</p>
              <div className="bg-emerald-50 rounded-lg border border-emerald-200 overflow-hidden">
                <svg viewBox="0 0 600 130" className="w-full">
                  <line x1="45" y1="108" x2="575" y2="108" stroke="#D1FAE5" strokeWidth="2" />
                  <line x1="45" y1="108" x2="45"  y2="20"  stroke="#D1FAE5" strokeWidth="2" />
                  <rect x="183" y="22"  width="28" height="86" fill="#3B82F6" />
                  <text x="197" y="122" textAnchor="middle" fill="#1E40AF" fontSize="10" fontWeight="700">49 Hz</text>
                  <rect x="340" y="70"  width="18" height="38" fill="#3B82F6" opacity=".45" />
                  <rect x="490" y="88"  width="14" height="20" fill="#3B82F6" opacity=".25" />
                </svg>
              </div>
            </div>

            {/* Actual sensor data */}
            {loading ? <Spinner /> : data && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Live vibration data — last {data.days} days ({data.readings.length} readings)
                </p>
                <div className="bg-blue-50 rounded-lg border border-blue-200 p-4 text-xs text-blue-800">
                  <div className="grid grid-cols-3 gap-4">
                    <div><span className="text-blue-500">Latest RMS</span><br /><strong className="text-lg">{data.readings.at(-1)?.vibration_rms ?? '—'} g</strong></div>
                    <div><span className="text-blue-500">Warning threshold</span><br /><strong className="text-lg">{data.thresholds.warning} g</strong></div>
                    <div><span className="text-blue-500">Alarm threshold</span><br /><strong className="text-lg">{data.thresholds.alarm} g</strong></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
              <h4 className="text-xs font-semibold text-gray-700 mb-4">Signal processing controls</h4>
              {[['Frequency separation', '2 Hz', 0, 10, 2], ['Cross-talk strength', '30%', 0, 100, 30]].map(([l, v, min, max, val]) => (
                <div key={String(l)} className="mb-4">
                  <label className="block text-xs font-medium text-gray-600 mb-1">{String(l)}</label>
                  <input type="range" min={Number(min)} max={Number(max)} defaultValue={Number(val)} className="w-full accent-[#1F4E78]" />
                  <div className="text-xs text-gray-500 mt-1">{String(v)}</div>
                </div>
              ))}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Calibration baseline</label>
                <select className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs">
                  <option>Fresh — captured at commissioning</option>
                  <option>90-day rolling average</option>
                </select>
              </div>
            </div>

            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span className="text-sm font-bold text-emerald-800">Separation: 92%</span>
              </div>
              <p className="text-xs text-emerald-700 leading-relaxed">
                Pump A signature isolated with 4% residual cross-talk. Operating hours and vibration
                severity attributable to Pump A only.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
