import { NavLink, useNavigate } from 'react-router';
import { Radio, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const NAV = [
  { to: '/dashboard', label: 'Overview'  },
  { to: '/map',       label: 'Live map'  },
  { to: '/alarms',    label: 'Alarms'    },
  { to: '/assets',    label: 'Assets'    },
  { to: '/reports',   label: 'Reports'   },
  { to: '/settings',  label: 'Settings'  },
];

export function Nav() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/');
  }

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-[#1F4E78]" />
            <span className="font-bold text-sm text-gray-900 whitespace-nowrap">HPE Asset Intelligence</span>
          </div>
          <div className="flex items-center gap-1">
            {NAV.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-[#1F4E78] text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleLogout}
            className="text-xs text-gray-500 hover:text-gray-800 flex items-center gap-1"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign out
          </button>
          <div className="w-9 h-9 rounded-full bg-[#1F4E78] text-white flex items-center justify-center font-bold text-sm select-none">
            {user?.initials ?? 'WN'}
          </div>
        </div>
      </div>
    </nav>
  );
}
