import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/layout/Navbar';
import { AuthView } from './views/AuthView';
import { DashboardView } from './views/DashboardView';
import { FinanceView } from './views/FinanceView';
import { CalendarView } from './views/CalendarView';
import { NotesView } from './views/NotesView';
import { SettingsView } from './views/SettingsView';
import { AdminPortal } from './views/AdminPortal';
import { ApiClient } from './services/api';

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [isSyncing, setIsSyncing] = useState(false);
  const [pathname, setPathname] = useState(window.location.pathname);

  // Global Modal States
  const [isFinanceModalOpen, setIsFinanceModalOpen] = useState(false);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);

  useEffect(() => {
    const handleLocationChange = () => setPathname(window.location.pathname);
    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  // =========================================================================
  // 1. AYRI LİNK & İZOLASYON: /admin (MÜŞTERİ HİZMETLERİ & OPERASYON PORTALI)
  // =========================================================================
  if (pathname.startsWith('/admin')) {
    return <AdminPortal />;
  }

  // =========================================================================
  // 2. KULLANICI UYGULAMASI (/)
  // =========================================================================
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-indigo-400 text-sm font-semibold">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <span>Kişisel Asistan Yükleniyor...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthView />;
  }

  const handleGlobalSync = async () => {
    try {
      setIsSyncing(true);
      await ApiClient.finance.syncBank();
      window.location.reload();
    } catch (err: any) {
      alert(err.message || 'Senkronizasyon hatası');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col w-full antialiased selection:bg-indigo-500 selection:text-white">
      {/* 1. ÜST FULL-WIDTH NAVİGASYON (Sadece Kullanıcı Menüleri) */}
      <Navbar 
        currentTab={currentTab} 
        setCurrentTab={setCurrentTab} 
        onRefresh={handleGlobalSync}
        isSyncing={isSyncing}
      />

      {/* 2. FULL-WIDTH ANA İÇERİK ALANI */}
      <main className="flex-1 w-full pb-16">
        {currentTab === 'dashboard' && (
          <DashboardView 
            onNavigate={setCurrentTab}
            onOpenTransactionModal={() => {
              setCurrentTab('finance');
              setIsFinanceModalOpen(true);
            }}
            onOpenNoteModal={() => {
              setCurrentTab('notes');
              setIsNoteModalOpen(true);
            }}
          />
        )}

        {/* Finans Modülü: Sol Menüleşmiş Detay Yapısı ile */}
        {currentTab === 'finance' && (
          <FinanceView 
            isModalOpen={isFinanceModalOpen}
            setIsModalOpen={setIsFinanceModalOpen}
          />
        )}

        {currentTab === 'calendar' && <CalendarView />}

        {currentTab === 'notes' && (
          <NotesView 
            isModalOpen={isNoteModalOpen}
            setIsModalOpen={setIsNoteModalOpen}
          />
        )}

        {currentTab === 'settings' && <SettingsView />}
      </main>
    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
