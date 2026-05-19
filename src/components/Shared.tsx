import { Loader, AlertCircle } from 'lucide-react';
import { Component, ReactNode } from 'react';

// ── Loading spinner ────────────────────────────────────────────
export function Spinner({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center h-40 ${className}`}>
      <Loader className="w-7 h-7 text-[#1F4E78] animate-spin" />
    </div>
  );
}

// ── Severity pill ──────────────────────────────────────────────
export function SeverityPill({ s }: { s: string }) {
  const cls =
    s === 'critical' ? 'bg-red-600 text-white' :
    s === 'warning'  ? 'bg-amber-500 text-white' :
                       'bg-gray-100 text-gray-700';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${cls}`}>
      {s.toUpperCase()}
    </span>
  );
}

// ── Status pill ───────────────────────────────────────────────
export function StatusPill({ s }: { s: string }) {
  const map: Record<string, string> = {
    alarm:       'bg-red-100 text-red-800',
    warning:     'bg-amber-100 text-amber-800',
    active:      'bg-emerald-100 text-emerald-800',
    maintenance: 'bg-gray-100 text-gray-700',
    transit:     'bg-blue-100 text-blue-800',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${map[s] ?? 'bg-gray-100 text-gray-700'}`}>
      {s.charAt(0).toUpperCase() + s.slice(1)}
    </span>
  );
}

// ── Empty state ───────────────────────────────────────────────
export function Empty({ message = 'No data found' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-40 text-gray-400">
      <AlertCircle className="w-8 h-8 mb-2" />
      <p className="text-sm">{message}</p>
    </div>
  );
}

// ── Error boundary ────────────────────────────────────────────
interface EBState { hasError: boolean; message: string }
export class ErrorBoundary extends Component<{ children: ReactNode }, EBState> {
  state: EBState = { hasError: false, message: '' };

  static getDerivedStateFromError(err: Error): EBState {
    return { hasError: true, message: err.message };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-80 gap-4 text-red-600">
          <AlertCircle className="w-12 h-12" />
          <p className="font-semibold">Something went wrong</p>
          <p className="text-sm text-gray-500">{this.state.message}</p>
          <button
            onClick={() => this.setState({ hasError: false, message: '' })}
            className="px-4 py-2 bg-[#1F4E78] text-white rounded-lg text-sm"
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
