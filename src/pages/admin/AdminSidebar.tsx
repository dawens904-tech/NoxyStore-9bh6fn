import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Gamepad2, Box, PlusCircle, LogOut, Joystick } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/lib/supabase';

const BASE = '/secure-dashboard-92x2011';

const navItems = [
  { label: 'Dashboard', path: BASE, icon: LayoutDashboard, exact: true },
  { label: 'Games', path: `${BASE}/games`, icon: Gamepad2 },
  { label: 'Lootbar Games', path: `${BASE}/lootbar-games`, icon: Joystick },
  { label: 'Products', path: `${BASE}/products`, icon: Box },
  { label: 'Add Product', path: `${BASE}/products/add`, icon: PlusCircle },
];

export default function AdminSidebar() {
  const { user } = useAuthStore();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  return (
    <aside className="fixed inset-y-0 left-0 w-64 border-r border-slate-200 bg-white px-5 py-7 flex flex-col shadow-sm z-40">
      {/* Brand */}
      <div className="mb-8 px-1">
        <div className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-400 mb-1">Admin Panel</div>
        <div className="text-xl font-black text-slate-900 leading-tight">NoxyStore</div>
        <div className="text-[10px] text-slate-400 font-mono mt-0.5 truncate">
          {user?.email ?? '—'}
        </div>
      </div>

      {/* Role badge */}
      <div className="mb-6 px-1">
        <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-yellow-100 text-yellow-800 text-xs font-bold uppercase tracking-wide">
          {user?.role ?? 'admin'}
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.exact}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-md'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`
              }
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold text-red-500 hover:bg-red-50 transition-all mt-4"
      >
        <LogOut className="h-4 w-4" />
        Sign Out
      </button>
    </aside>
  );
}
