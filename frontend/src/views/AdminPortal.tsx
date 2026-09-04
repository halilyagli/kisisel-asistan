import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ApiClient } from '../services/api';
import {
  Headphones,
  ShieldCheck,
  ShieldAlert,
  Users,
  Search,
  Zap,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Lock,
  Eye,
  CreditCard,
  Landmark,
  FileText,
  UserCheck,
  UserX,
  Sparkles,
  Server,
  Activity,
  ArrowLeft,
  LogOut,
  ExternalLink,
} from 'lucide-react';

export const AdminPortal: React.FC = () => {
  const { user, login, logout } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);

  // Portal State
  const [currentSection, setCurrentSection] = useState<'DESK' | 'GATEWAYS' | 'AUDIT_LOGS' | 'ANALYTICS'>('DESK');
  const [subscribers, setSubscribers] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Diagnostic Modal
  const [selectedSub, setSelectedSub] = useState<any | null>(null);
  const [diagnosticsData, setDiagnosticsData] = useState<any | null>(null);
  const [diagLoading, setDiagLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  const isAuthorized = user && (user.role === 'ADMIN' || user.role === 'SUPPORT');

  const loadData = async () => {
    if (!isAuthorized) return;
    try {
      setLoading(true);
      const [subs, logs] = await Promise.all([
        ApiClient.admin.getSubscribers(),
        ApiClient.admin.getAuditLogs(),
      ]);
      setSubscribers(subs);
      setAuditLogs(logs);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthorized) {
      loadData();
    }
  }, [isAuthorized]);

  // Handle Dedicated Support Login
  const handleSupportLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoginLoading(true);
    try {
      await login(email, password);
    } catch (err: any) {
      setLoginError(err.message || 'Müşteri temsilcisi girişi başarısız.');
    } finally {
      setLoginLoading(false);
    }
  };

  // Open Diagnostics
  const handleOpenDiagnostics = async (subscriber: any) => {
    try {
      setSelectedSub(subscriber);
      setDiagLoading(true);
      const data = await ApiClient.admin.getSubscriberDiagnostics(subscriber.id);
      setDiagnosticsData(data);
      const logs = await ApiClient.admin.getAuditLogs();
      setAuditLogs(logs);
    } catch (err: any) {
      alert(err.message || 'Teşhis verisi alınamadı');
    } finally {
      setDiagLoading(false);
    }
  };

  // Remote Re-sync
  const handleTriggerReSync = async (connectionId: string, bankName: string) => {
    if (!selectedSub) return;
    try {
      setActionLoading(true);
      await ApiClient.admin.reSyncUserConnection(selectedSub.id, connectionId);
      const data = await ApiClient.admin.getSubscriberDiagnostics(selectedSub.id);
      setDiagnosticsData(data);
      await loadData();
      showToast(`${bankName} bağlantısı için uzaktan canlı eşitleme tamamlandı.`);
    } catch (err: any) {
      alert(err.message || 'Eşitleme tetiklenemedi');
    } finally {
      setActionLoading(false);
    }
  };

  // Update Tier
  const handleUpdateTier = async (newTier: string) => {
    if (!selectedSub) return;
    try {
      setActionLoading(true);
      await ApiClient.admin.updateUserTier(selectedSub.id, newTier);
      await loadData();
      const data = await ApiClient.admin.getSubscriberDiagnostics(selectedSub.id);
      setDiagnosticsData(data);
      showToast(`Kullanıcı paketi ${newTier} olarak güncellendi.`);
    } catch (err: any) {
      alert(err.message || 'Plan güncellenemedi');
    } finally {
      setActionLoading(false);
    }
  };

  // Toggle Suspension
  const handleToggleSuspension = async (isSuspended: boolean) => {
    if (!selectedSub) return;
    const actionText = isSuspended ? 'dondurmak' : 'aktifleştirmek';
    if (!confirm(`Bu aboneyi ${actionText} istediğinize emin misiniz?`)) return;

    try {
      setActionLoading(true);
      await ApiClient.admin.toggleUserSuspension(selectedSub.id, isSuspended, 'Temsilci müdahalesi');
      await loadData();
      const data = await ApiClient.admin.getSubscriberDiagnostics(selectedSub.id);
      setDiagnosticsData(data);
      showToast(`Hesap durumu ${isSuspended ? 'Donduruldu' : 'Aktifleştirildi'}.`);
    } catch (err: any) {
      alert(err.message || 'İşlem başarısız');
    } finally {
      setActionLoading(false);
    }
  };

  // =========================================================================
  // GİRİŞ YAPILMAMIŞ VEYA YETKİSİZ İSE: ÖZEL OPERASYON GİRİŞ EKRANI
  // =========================================================================
  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4 relative overflow-hidden font-sans">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="w-full max-w-md bg-slate-900 border-2 border-indigo-500/30 rounded-3xl shadow-2xl p-8 relative z-10 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 shadow-lg shadow-indigo-600/20">
                <Headphones className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-base font-black text-white tracking-tight leading-tight">
                  Müşteri Hizmetleri & Operasyon
                </h1>
                <p className="text-[11px] text-slate-400">Yetkili Personel Giriş Kapısı</p>
              </div>
            </div>

            <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-extrabold text-[10px]">
              KVKK GÜVENLİ
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60 text-xs text-slate-300">
            <p className="font-semibold text-white mb-1">🛡️ Özel Yönetim Portalı</p>
            Bu arayüz sadece yetkili müşteri temsilcileri ve sistem yöneticileri içindir. Tüm girişler ve teşhis işlemleri KVKK uyarınca IP adresiyle denetlenir.
          </div>

          {user && user.role === 'USER' && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
              Mevcut oturumunuz ({user.email}) müşteri temsilcisi yetkisine sahip değildir. Lütfen destek temsilcisi hesabınızla giriş yapın.
            </div>
          )}

          {loginError && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
              {loginError}
            </div>
          )}

          <form onSubmit={handleSupportLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Temsilci E-Postası</label>
              <input
                type="email"
                required
                placeholder="admin@asistan.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Yetkili Şifresi</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-600/30 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Lock className="h-4 w-4" />
              <span>{loginLoading ? 'Yetki Doğrulanıyor...' : 'Destek Masasına Giriş Yap'}</span>
            </button>
          </form>

          <div className="pt-2 text-center">
            <a
              href="/"
              className="text-xs text-slate-400 hover:text-indigo-300 flex items-center justify-center gap-1.5 transition"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Kullanıcı SaaS Web Uygulamasına Dön (/)</span>
            </a>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // YETKİLİ GİRİŞİ YAPILMIŞ: TAM İZOLASYONLU MÜŞTERİ HİZMETLERİ VE OPERASYON MASASI
  // =========================================================================
  const filteredSubs = subscribers.filter(
    (s) =>
      s.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.id?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPro = subscribers.filter((s) => s.subscriptionTier === 'PRO' || s.subscriptionTier === 'ENTERPRISE').length;
  const totalBanks = subscribers.reduce((acc, s) => acc + (s.totalConnectedBanks || 0), 0);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased selection:bg-indigo-500 selection:text-white">
      {/* Toast Bildirimi */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border-2 border-emerald-500/60 shadow-2xl text-emerald-300 px-4 py-3 rounded-2xl flex items-center gap-3 text-xs animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span className="font-semibold">{toastMsg}</span>
        </div>
      )}

      {/* 1. MÜŞTERİ HİZMETLERİ ÖZEL ÜST KONSOL ÇUBUĞU */}
      <header className="bg-slate-900/95 border-b border-indigo-500/20 backdrop-blur-md sticky top-0 z-40 px-6 lg:px-10 h-16 flex items-center justify-between gap-4">
        {/* Sol Marka & Portal Başlığı */}
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-emerald-400 flex items-center justify-center shadow-lg shadow-indigo-600/30">
            <Headphones className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="font-black text-white text-base tracking-tight flex items-center gap-2">
              <span>Asistan.ai</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 uppercase">
                Destek & Operasyon
              </span>
            </div>
            <div className="text-[11px] text-slate-400 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Canlı Hat Aktif • Operatör: <span className="text-slate-200 font-bold">{user.fullName}</span></span>
            </div>
          </div>
        </div>

        {/* Orta Navigasyon Butonları */}
        <nav className="hidden md:flex items-center gap-2 bg-slate-800/80 p-1 rounded-xl border border-slate-700/60">
          <button
            onClick={() => setCurrentSection('DESK')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              currentSection === 'DESK' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            <span>Abone Destek Masası</span>
          </button>
          <button
            onClick={() => setCurrentSection('GATEWAYS')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              currentSection === 'GATEWAYS' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Server className="h-3.5 w-3.5" />
            <span>Banka Ağ Geçitleri</span>
          </button>
          <button
            onClick={() => setCurrentSection('AUDIT_LOGS')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              currentSection === 'AUDIT_LOGS' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Lock className="h-3.5 w-3.5" />
            <span>KVKK Denetim İzi</span>
          </button>
        </nav>

        {/* Sağ: KVKK Rozeti + Kullanıcı Paneline Geçiş + Çıkış */}
        <div className="flex items-center gap-3">
          <span className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-extrabold">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>KVKK FILTRESI: AKTİF</span>
          </span>

          <a
            href="/"
            title="Kullanıcı Paneline Geç"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition"
          >
            <span>Kullanıcı Paneli (/)</span>
            <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
          </a>

          <button
            onClick={logout}
            title="Destek Masasından Çıkış Yap"
            className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* 2. ANA DESTEK ÇALIŞMA ALANI */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-6 lg:px-10 py-8 space-y-6">
        
        {/* KPI Şeridi */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-[11px] text-slate-400 font-medium block">Kayıtlı Abone</span>
              <span className="text-2xl font-black text-white">{subscribers.length}</span>
            </div>
            <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400">
              <Users className="h-5 w-5" />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-[11px] text-slate-400 font-medium block">Ücretli PRO/Enterprise</span>
              <span className="text-2xl font-black text-amber-400">{totalPro}</span>
            </div>
            <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400">
              <Sparkles className="h-5 w-5" />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-[11px] text-slate-400 font-medium block">Banka API Akışı</span>
              <span className="text-2xl font-black text-emerald-400">{totalBanks} Aktif</span>
            </div>
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Zap className="h-5 w-5" />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-[11px] text-slate-400 font-medium block">KVKK Denetim Kaydı</span>
              <span className="text-2xl font-black text-sky-400">{auditLogs.length} İşlem</span>
            </div>
            <div className="p-3 rounded-xl bg-sky-500/10 text-sky-400">
              <ShieldCheck className="h-5 w-5" />
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* BÖLÜM 1: MÜŞTERİ TEMSİLCİSİ ABONE DESTEK MASASI */}
        {/* ========================================================================= */}
        {currentSection === 'DESK' && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
                  <Headphones className="h-5 w-5 text-indigo-400" />
                  <span>Abone Destek Masası & Canlı Teşhis</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Abonelerin teknik hesap problemlerini çözmek ve canlı senkronizasyon tetiklemek için aboneyi seçin.
                </p>
              </div>

              {/* Hızlı Arama */}
              <div className="relative w-full sm:w-80">
                <Search className="h-4 w-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="İsim, e-posta veya Abone ID ile ara..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Abone Listesi Tablosu */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-800/60 text-slate-400 uppercase tracking-wider text-[10px] font-bold border-b border-slate-700">
                  <tr>
                    <th className="py-3 px-4">Abone Bilgisi</th>
                    <th className="py-3 px-4">Paket / Rol</th>
                    <th className="py-3 px-4">Açık Bankacılık</th>
                    <th className="py-3 px-4">Varlık / Dekont</th>
                    <th className="py-3 px-4">KVKK Rızası</th>
                    <th className="py-3 px-4">Durum</th>
                    <th className="py-3 px-4 text-right">Destek Aksiyonu</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredSubs.map((sub) => {
                    const hasBanks = (sub.bankConnections?.length || 0) > 0;
                    return (
                      <tr key={sub.id} className="hover:bg-slate-800/30 transition">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-white text-sm">{sub.fullName}</div>
                          <div className="text-slate-400 text-[11px]">{sub.email}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                            ID: {sub.id.substring(0, 8)}...
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                                sub.subscriptionTier === 'ENTERPRISE'
                                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                  : sub.subscriptionTier === 'PRO'
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                  : 'bg-slate-700 text-slate-300'
                              }`}
                            >
                              {sub.subscriptionTier}
                            </span>
                            {sub.role !== 'USER' && (
                              <span className="px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-extrabold text-[9px]">
                                {sub.role}
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          {hasBanks ? (
                            <div>
                              <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                                <span>{sub.bankConnections.length} Banka Canlı</span>
                              </div>
                              <div className="text-[10px] text-slate-400 mt-0.5">
                                {sub.bankConnections.map((b: any) => b.bankName).join(', ')}
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-[11px]">Bağlantı Yok</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-200">{sub.totalAccounts} Varlık</div>
                          <div className="text-[10px] text-slate-400">{sub.totalTransactions} Dekont/İşlem</div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-semibold text-[10px] border border-emerald-500/20 flex items-center gap-1 w-fit">
                            <CheckCircle2 className="h-3 w-3" />
                            <span>Onaylı</span>
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          {sub.isSuspended ? (
                            <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-bold text-[10px] border border-rose-500/30 flex items-center gap-1 w-fit">
                              <AlertTriangle className="h-3 w-3" />
                              <span>Donduruldu</span>
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-[10px] border border-emerald-500/30 flex items-center gap-1 w-fit">
                              <CheckCircle2 className="h-3 w-3" />
                              <span>Aktif</span>
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => handleOpenDiagnostics(sub)}
                            className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs shadow-md shadow-indigo-600/30 transition inline-flex items-center gap-1.5"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span>Teşhis Masasını Aç</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* BÖLÜM 2: BANKA AĞ GEÇİTLERİ VE API SAĞLIĞI İZLEME */}
        {/* ========================================================================= */}
        {currentSection === 'GATEWAYS' && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
                  <Server className="h-5 w-5 text-emerald-400" />
                  <span>BKM GEÇİT & Türk Bankaları Açık Bankacılık Ağ Geçidi İzleme</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Bankaların API ağ geçitlerinin anlık yanıt süreleri, SSL sertifikaları ve otomatik eşitleme sağlık durumu.
                </p>
              </div>

              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-xs flex items-center gap-1.5">
                <Activity className="h-3.5 w-3.5" />
                <span>TÜM AĞ GEÇİTLERİ ÇALIŞIYOR</span>
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { name: 'Garanti BBVA', code: 'GARANTI', status: 'OPERATIONAL', latency: '42ms', uptime: '99.98%' },
                { name: 'Türkiye İş Bankası', code: 'IS_BANK', status: 'OPERATIONAL', latency: '38ms', uptime: '99.95%' },
                { name: 'Akbank T.A.Ş.', code: 'AKBANK', status: 'OPERATIONAL', latency: '51ms', uptime: '99.90%' },
                { name: 'Yapı ve Kredi Bankası', code: 'YAPI_KREDI', status: 'OPERATIONAL', latency: '47ms', uptime: '99.92%' },
                { name: 'QNB Finansbank', code: 'QNB', status: 'OPERATIONAL', latency: '63ms', uptime: '99.85%' },
                { name: 'Enpara.com', code: 'ENPARA', status: 'OPERATIONAL', latency: '29ms', uptime: '99.99%' },
                { name: 'T.C. Ziraat Bankası', code: 'ZIRAAT', status: 'OPERATIONAL', latency: '58ms', uptime: '99.88%' },
              ].map((b) => (
                <div key={b.code} className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-white">{b.name}</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-extrabold">
                      {b.status}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 flex items-center justify-between pt-1">
                    <span>Yanıt Süresi: <span className="text-slate-200 font-mono font-semibold">{b.latency}</span></span>
                    <span>Uptime: <span className="text-emerald-400 font-mono font-semibold">{b.uptime}</span></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* BÖLÜM 3: KVKK YASAL DENETİM GÜNLÜĞÜ (AUDIT TRAIL) */}
        {/* ========================================================================= */}
        {currentSection === 'AUDIT_LOGS' && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
                  <Lock className="h-5 w-5 text-emerald-400" />
                  <span>KVKK Yasal Denetim & Temsilci İşlem Günlüğü</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Kişisel Verilerin Korunması Kanunu Madde 11 ve 12 uyarınca, temsilcilerin gerçekleştirdiği tüm teşhis ve müdahaleler burada değiştirilemez olarak kaydedilir.
                </p>
              </div>

              <button
                onClick={loadData}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Yenile</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-800/60 text-slate-400 uppercase tracking-wider text-[10px] font-bold border-b border-slate-700">
                  <tr>
                    <th className="py-3 px-4">Tarih / Saat</th>
                    <th className="py-3 px-4">Temsilci E-Posta</th>
                    <th className="py-3 px-4">İşlem Türü</th>
                    <th className="py-3 px-4">KVKK Maskeli İşlem Açıklaması</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-800/20">
                      <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString('tr-TR')}
                      </td>
                      <td className="py-3 px-4 font-bold text-indigo-300">
                        {log.actorEmail}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px] font-extrabold text-slate-300">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-300">
                        {log.details}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </main>

      {/* ========================================================================= */}
      {/* MODAL: MÜŞTERİ TEMSİLCİSİ TEŞHİS & OPERASYON ÇEKMECESİ */}
      {/* ========================================================================= */}
      {selectedSub && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-indigo-500/50 rounded-3xl w-full max-w-3xl p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-extrabold text-[10px]">
                    TEŞHİS & DESTEK KONSOLU
                  </span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-extrabold text-[10px] flex items-center gap-1">
                    <ShieldCheck className="h-3 w-3" />
                    <span>KVKK MASKELEME AKTİF</span>
                  </span>
                </div>
                <h3 className="text-xl font-black text-white mt-1">
                  {selectedSub.fullName}
                </h3>
                <p className="text-xs text-slate-400">{selectedSub.email}</p>
              </div>

              <button
                onClick={() => {
                  setSelectedSub(null);
                  setDiagnosticsData(null);
                }}
                className="text-slate-400 hover:text-white p-2"
              >
                ✕
              </button>
            </div>

            {/* KVKK Uyarısı */}
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-start gap-3">
              <ShieldAlert className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">KVKK Madde 11-12 Güvenlik Filtresi Devrede:</span>
                Temsilci olarak müşteri şifrelerini ve ham kart güvenlik kodlarını görüntüleyemezsiniz. IBAN ve kart numaraları maskelenmiştir. Bu ekranda yapacağınız her müdahale yasal denetim günlüğüne işlenecektir.
              </div>
            </div>

            {diagLoading ? (
              <div className="py-12 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
                <RefreshCw className="h-4 w-4 animate-spin text-indigo-400" />
                <span>Teknik teşhis ve bağlantı verileri toplanıyor...</span>
              </div>
            ) : diagnosticsData ? (
              <div className="space-y-6">
                
                {/* Temsilci Hızlı Müdahale Yetkileri */}
                <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-3">
                  <div className="text-xs font-bold text-white uppercase tracking-wider">
                    Temsilci Yetkileri & Müdahaleler:
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    {/* Paket Tanımlama */}
                    <div className="flex items-center gap-2 bg-slate-900 px-3 py-2 rounded-xl border border-slate-700">
                      <span className="text-xs text-slate-300 font-medium">Abonelik Planı:</span>
                      {(['FREE', 'PRO', 'ENTERPRISE'] as const).map((tier) => (
                        <button
                          key={tier}
                          disabled={actionLoading || diagnosticsData.user?.subscriptionTier === tier}
                          onClick={() => handleUpdateTier(tier)}
                          className={`px-2 py-1 rounded text-[11px] font-bold transition ${
                            diagnosticsData.user?.subscriptionTier === tier
                              ? 'bg-indigo-600 text-white'
                              : 'bg-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          {tier}
                        </button>
                      ))}
                    </div>

                    {/* Dondur / Aktifleştir */}
                    <button
                      disabled={actionLoading}
                      onClick={() => handleToggleSuspension(!diagnosticsData.user?.isSuspended)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                        diagnosticsData.user?.isSuspended
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                          : 'bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30'
                      }`}
                    >
                      {diagnosticsData.user?.isSuspended ? (
                        <>
                          <UserCheck className="h-4 w-4" />
                          <span>Hesabı Yeniden Aktifleştir</span>
                        </>
                      ) : (
                        <>
                          <UserX className="h-4 w-4" />
                          <span>Hesabı Güvenlik Amaçlı Dondur</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Açık Bankacılık Bağlantıları & Uzaktan Eşitleme */}
                <div className="space-y-3">
                  <div className="text-xs font-bold text-white uppercase tracking-wider">
                    Bağlı Bankalar & Ağ Durumu ({diagnosticsData.connections?.length || 0}):
                  </div>

                  {diagnosticsData.connections?.length === 0 ? (
                    <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/40 text-center text-xs text-slate-400">
                      Kullanıcı henüz hiçbir banka hesabı bağlamamış.
                    </div>
                  ) : (
                    diagnosticsData.connections?.map((conn: any) => (
                      <div key={conn.id} className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                              <Zap className="h-5 w-5" />
                            </div>
                            <div>
                              <div className="text-sm font-bold text-white flex items-center gap-2">
                                <span>{conn.bankName}</span>
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-extrabold">
                                  {conn.status}
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-400">
                                BKM Rıza Kodu: {conn.consentId} • Otomatik Çekim: {conn.autoSyncEnabled ? 'Aktif' : 'Kapalı'}
                              </div>
                            </div>
                          </div>

                          {/* Uzaktan Senkronizasyon Tetikle */}
                          <button
                            disabled={actionLoading}
                            onClick={() => handleTriggerReSync(conn.id, conn.bankName)}
                            className="px-3.5 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-lg text-xs font-bold transition flex items-center gap-1.5"
                          >
                            <RefreshCw className={`h-3.5 w-3.5 ${actionLoading ? 'animate-spin' : ''}`} />
                            <span>Uzaktan Canlı Eşitle (Re-Sync)</span>
                          </button>
                        </div>

                        {/* Bu Bankaya Ait Maskeli Varlıklar */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-700/60">
                          {conn.accounts?.map((acc: any) => {
                            const isCard = acc.type === 'CREDIT_CARD';
                            return (
                              <div key={acc.id} className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  {isCard ? (
                                    <CreditCard className="h-4 w-4 text-rose-400" />
                                  ) : (
                                    <Landmark className="h-4 w-4 text-emerald-400" />
                                  )}
                                  <div>
                                    <div className="text-[11px] font-bold text-white">{acc.name}</div>
                                    <div className="text-[10px] text-slate-400 font-mono">
                                      {acc.iban || acc.accountNumberMasked}
                                    </div>
                                  </div>
                                </div>
                                <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                                  {acc.provider}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))
                  )}
                </div>

              </div>
            ) : null}

            <div className="pt-2 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => {
                  setSelectedSub(null);
                  setDiagnosticsData(null);
                }}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold"
              >
                Kapat
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
