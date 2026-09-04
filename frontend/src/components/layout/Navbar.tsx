import React from 'react';
import { 
  LayoutDashboard, 
  Wallet, 
  CalendarDays, 
  StickyNote, 
  Settings, 
  LogOut, 
  ShieldCheck,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  onRefresh?: () => void;
  isSyncing?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  currentTab, 
  setCurrentTab, 
  onRefresh, 
  isSyncing = false 
}) => {
  const { user, logout } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Genel Bakış', icon: LayoutDashboard },
    { id: 'finance', label: 'Finans', icon: Wallet, highlight: true },
    { id: 'calendar', label: 'Takvim & Vadeler', icon: CalendarDays },
    { id: 'notes', label: 'Notlarım', icon: StickyNote },
    { id: 'settings', label: 'Abonelik & Ayarlar', icon: Settings },
  ];

  return (
    <header className="w-full bg-slate-900/90 border-b border-slate-800 backdrop-blur-md sticky top-0 z-40">
      <div className="w-full px-6 lg:px-10 h-16 flex items-center justify-between gap-4">
        {/* Logo & Brand */}
        <div className="flex items-center gap-8 shrink-0">
          <button 
            onClick={() => setCurrentTab('dashboard')}
            className="flex items-center gap-3 text-left group"
          >
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-sky-400 flex items-center justify-center shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="font-extrabold text-white text-lg tracking-tight leading-tight flex items-center gap-1">
                <span>Asistan</span><span className="text-indigo-400">.ai</span>
              </div>
              <div className="text-[10px] font-semibold text-slate-400 tracking-wider uppercase">
                SaaS Kişisel Platform
              </div>
            </div>
          </button>

          {/* Top Primary Navigation (Full Width Header Menüsü) */}
          <nav className="hidden md:flex items-center gap-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentTab(item.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
                  } ${item.highlight && !isActive ? 'text-indigo-300 font-bold' : ''}`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? 'text-white' : item.highlight ? 'text-indigo-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Right Actions & User Profile */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Bank Sync Quick Action */}
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isSyncing}
              title="Açık Bankacılık Verilerini Yenile"
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700/80 transition disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin text-indigo-400' : 'text-slate-400'}`} />
              <span className="hidden sm:inline">{isSyncing ? 'Eşitleniyor...' : 'Banka Sync'}</span>
            </button>
          )}

          {/* Active Subscription Badge */}
          <button
            onClick={() => setCurrentTab('settings')}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold hover:bg-indigo-500/20 transition"
          >
            <ShieldCheck className="h-3.5 w-3.5 text-indigo-400" />
            <span>{user?.subscriptionTier || 'FREE'}</span>
          </button>

          {/* User Avatar & Logout */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
            <div className="h-8 w-8 rounded-full bg-slate-800 border border-slate-700 text-indigo-400 font-bold text-xs flex items-center justify-center">
              {user?.fullName?.charAt(0) || 'U'}
            </div>
            <div className="hidden lg:block text-left">
              <div className="text-xs font-semibold text-slate-200 leading-tight">{user?.fullName}</div>
              <div className="text-[10px] text-slate-400">{user?.email}</div>
            </div>
            <button
              onClick={logout}
              title="Çıkış Yap"
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Sub-Navigation for small screens */}
      <div className="md:hidden flex items-center justify-around px-2 py-2 border-t border-slate-800/80 bg-slate-950/40">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={`flex flex-col items-center gap-1 p-2 rounded-lg text-[10px] font-medium ${
                isActive ? 'text-indigo-400 font-bold' : 'text-slate-400'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
};
