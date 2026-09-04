import React from 'react';
import { 
  LayoutDashboard, 
  Wallet, 
  CalendarDays, 
  StickyNote, 
  Settings, 
  LogOut, 
  ShieldCheck,
  Sparkles 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, setCurrentTab }) => {
  const { user, logout } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Genel Bakış', icon: LayoutDashboard },
    { id: 'finance', label: 'Finans & Hesaplar', icon: Wallet, badge: 'Açık Bankacılık' },
    { id: 'calendar', label: 'Takvim & Vadeler', icon: CalendarDays },
    { id: 'notes', label: 'Notlarım', icon: StickyNote },
    { id: 'settings', label: 'Abonelik & Ayarlar', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between select-none shrink-0 h-screen sticky top-0">
      <div>
        {/* Logo */}
        <div className="p-6 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-sky-400 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-slate-100 text-lg tracking-tight leading-tight">
                Asistan<span className="text-indigo-400">.ai</span>
              </h1>
              <span className="text-[11px] font-medium text-slate-400 tracking-wide uppercase">
                SaaS Kişisel Platform
              </span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
                    isActive ? 'bg-indigo-800 text-indigo-100' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer / User Profile & Plan */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/40">
        <div className="mb-3 p-3 rounded-lg bg-slate-800/50 border border-slate-700/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <div>
              <div className="text-xs font-semibold text-slate-200">
                {user?.subscriptionTier || 'FREE'} Plan
              </div>
              <div className="text-[10px] text-slate-400">Aktif Abonelik</div>
            </div>
          </div>
          <button 
            onClick={() => setCurrentTab('settings')}
            className="text-[11px] text-indigo-400 hover:text-indigo-300 font-medium"
          >
            Yükselt
          </button>
        </div>

        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="h-8 w-8 rounded-full bg-slate-700 text-indigo-400 flex items-center justify-center font-bold text-xs shrink-0">
              {user?.fullName?.charAt(0) || 'U'}
            </div>
            <div className="truncate">
              <div className="text-xs font-semibold text-slate-200 truncate">{user?.fullName}</div>
              <div className="text-[10px] text-slate-500 truncate">{user?.email}</div>
            </div>
          </div>
          <button
            onClick={logout}
            title="Çıkış Yap"
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-md transition-colors"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
