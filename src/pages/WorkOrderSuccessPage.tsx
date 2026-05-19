import { useLocation, useNavigate } from 'react-router';
import { CheckCircle } from 'lucide-react';

export function WorkOrderSuccessPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const wo = location.state?.wo ?? {};

  return (
    <div className="min-h-[calc(100vh-56px)] flex items-center justify-center p-6">
      <div className="bg-white border border-gray-200 rounded-2xl shadow-xl p-12 w-full max-w-lg text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-emerald-100 rounded-full mb-6">
          <CheckCircle className="w-10 h-10 text-emerald-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Work order {wo.wo_number ?? 'created'}
        </h1>
        <p className="text-gray-500 mb-8">
          Assigned to {wo.site_name ?? 'workshop'} · spare {wo.model ?? 'unit'} reserved
        </p>

        <div className="bg-gray-50 rounded-xl p-5 text-left mb-8 space-y-2.5">
          {[
            ['Asset ID',          wo.asset_id],
            ['Reason',            wo.reason],
            ['Priority',          wo.priority],
            ['Assigned to',       `${wo.site_name ?? '—'} workshop`],
            ['Replacement unit',  wo.replacement_unit],
            ['Estimated downtime',`${wo.estimated_hours ?? 2} hours`],
          ].map(([k, v]) => (
            <div key={String(k)} className="flex justify-between text-sm">
              <span className="text-gray-500">{k}</span>
              <span className="font-medium text-gray-900 text-right max-w-xs">{String(v ?? '—')}</span>
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => navigate('/assets')}
            className="flex-1 py-3 border border-gray-300 rounded-xl font-medium text-sm hover:bg-gray-50"
          >
            View all assets
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="flex-1 py-3 bg-[#1F4E78] text-white rounded-xl font-medium text-sm hover:bg-[#19406a]"
          >
            Back to overview
          </button>
        </div>
      </div>
    </div>
  );
}
