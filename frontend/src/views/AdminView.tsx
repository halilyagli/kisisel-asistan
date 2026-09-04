import React, { useState, useEffect } from 'react';
import { ApiClient } from '../services/api';
import {
  ShieldAlert,
  Users,
  Search,
  Zap,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Lock,
  Eye,
  ShieldCheck,
  CreditCard,
  Landmark,
  FileText,
  UserCheck,
  UserX,
  Clock,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

export const AdminView: React.FC = () => {
  const [subscribers, setSubscribers] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'SUBSCRIBERS' | 'AUDIT_LOGS'>('SUBSCRIBERS');

  // Müşteri Temsilcisi Teşhis Paneli Seçili Abone
  const [selectedSubscriber, setSelectedSubscriber] = useState<any | null>(null);
  const [diagnosticsData, setDiagnosticsData] = useState<any | null>(null);
  const [diagnosticsLoading, setDiagnosticsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadAdminData = async () => {
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
    loadAdminData();
  }, []);

  // Müşteri Temsilcisi Teşhis Ekranını Aç (KVKK Denetim Kaydı Düşer)
  const handleOpenDiagnostics = async (subscriber: any) => {
    try {
      setSelectedSubscriber(subscriber);
      setDiagnosticsLoading(true);
      const data = await ApiClient.admin.getSubscriberDiagnostics(subscriber.id);
      setDiagnosticsData(data);
      // Audit logları da tazele
      const logs = await ApiClient.admin.getAuditLogs();
      setAuditLogs(logs);
    } catch (err: any) {
      alert(err.message || 'Teşhis verisi alınamadı');
    } finally {
      setDiagnosticsLoading(false);
    }
  };

  // Uzaktan Banka Eşitleme
  const handleTriggerReSync = async (connectionId: string, bankName: string) => {
    if (!selectedSubscriber) return;
    try {
      setActionLoading(true);
      await ApiClient.admin.reSyncUserConnection(selectedSubscriber.id, connectionId);
      // Teşhis verisini güncelle
      const data = await ApiClient.admin.getSubscriberDiagnostics(selectedSubscriber.id);
      setDiagnosticsData(data);
      await loadAdminData();
      showToast(`${bankName} bağlantısı uzaktan başarıyla güncellendi.`);
    } catch (err: any) {
      alert(err.message || 'Eşitleme tetiklenemedi');
    } finally {
      setActionLoading(false);
    }
  };

  // Plan Güncelle
  const handleUpdateTier = async (newTier: string) => {
    if (!selectedSubscriber) return;
    try {
      setActionLoading(true);
      await ApiClient.admin.updateUserTier(selectedSubscriber.id, newTier);
      await loadAdminData();
      const data = await ApiClient.admin.getSubscriberDiagnostics(selectedSubscriber.id);
      setDiagnosticsData(data);
      showToast(`Kullanıcı planı ${newTier} olarak güncellendi.`);
    } catch (err: any) {
      alert(err.message || 'Plan güncellenemedi');
    } finally {
      setActionLoading(false);
    }
  };

  // Askıya Al / Aktifleştir
  const handleToggleSuspension = async (isSuspended: boolean) => {
    if (!selectedSubscriber) return;
    const actionText = isSuspended ? 'askıya almak' : 'aktifleştirmek';
    if (!confirm(`Bu kullanıcının hesabını ${actionText} istediğinize emin misiniz?`)) return;

    try {
      setActionLoading(true);
      await ApiClient.admin.toggleUserSuspension(selectedSubscriber.id, isSuspended, 'Müşteri hizmetleri müdahalesi');
      await loadAdminData();
      const data = await ApiClient.admin.getSubscriberDiagnostics(selectedSubscriber.id);
      setDiagnosticsData(data);
      showToast(`Hesap durumu ${isSuspended ? 'Askıya Alındı' : 'Aktif Edildi'}.`);
    } catch (err: any) {
      alert(err.message || 'Durum değiştirilemedi');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredSubscribers = subscribers.filter(
    (s) =>
      s.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalProSubscribers = subscribers.filter((s) => s.subscriptionTier === 'PRO' || s.subscriptionTier === 'ENTERPRISE').length;
  const totalConnectedBanksCount = subscribers.reduce((acc, s) => acc + (s.totalConnectedBanks || 0), 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Toast Bildirimi */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-emerald-500/50 shadow-2xl shadow-emerald-500/20 text-emerald-300 px-4 py-3 rounded-2xl flex items-center gap-3 text-xs animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span className="font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Üst Yönetici Başlık & KVKK Rozeti */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 font-black text-[10px] tracking-wider uppercase border border-indigo-500/30">
              YÖNETİM & DESTEK KONSOLU
            </span>
            <span className="px-2.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-extrabold text-[10px] tracking-wider uppercase border border-emerald-500/30 flex items-center gap-1">
              <ShieldCheck className="h-3 w-3" />
              <span>KVKK & BDDK UYUMLU</span>
            </span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight mt-2">
            SaaS Abone & Müşteri Hizmetleri Masası
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Kayıtlı abonelerin hesap durumlarını, açık bankacılık bağlantılarını ve teknik problemlerini KVKK veri koruma prensiplerine uygun olarak maskeli şekilde yönetin.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('SUBSCRIBERS')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'SUBSCRIBERS'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Users className="h-4 w-4" />
            <span>Aboneler ({subscribers.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('AUDIT_LOGS')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'AUDIT_LOGS'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <FileText className="h-4 w-4" />
            <span>KVKK Denetim İzi ({auditLogs.length})</span>
          </button>
        </div>
      </div>

      {/* KPI Metrik Kartları */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Toplam Kayıtlı Abone</span>
            <Users className="h-4 w-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-black text-white">{subscribers.length}</div>
          <div className="text-[11px] text-slate-400 mt-1">SaaS Platform Kullanıcısı</div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">PRO & Enterprise Abone</span>
            <Sparkles className="h-4 w-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400">{totalProSubscribers}</div>
          <div className="text-[11px] text-slate-400 mt-1">Ücretli Paket Dönüşümü</div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Aktif Banka Bağlantısı</span>
            <Zap className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">{totalConnectedBanksCount}</div>
          <div className="text-[11px] text-slate-400 mt-1">BKM GEÇİT Canlı API Akışı</div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">KVKK Rıza Uyumu</span>
            <ShieldCheck className="h-4 w-4 text-sky-400" />
          </div>
          <div className="text-2xl font-black text-sky-400">%100</div>
          <div className="text-[11px] text-slate-400 mt-1">Tüm Aboneler Aydınlatıldı</div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SEKME 1: ABONELER VE MÜŞTERİ HİZMETLERİ TABLOSU */}
      {/* ========================================================================= */}
      {activeTab === 'SUBSCRIBERS' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
          {/* Arama ve Filtreler */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-80">
              <Search className="h-4 w-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Abone adı veya e-posta ile ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="text-xs text-slate-400 font-medium">
              Gösterilen: <span className="text-white font-bold">{filteredSubscribers.length}</span> abone
            </div>
          </div>

          {/* Abone Tablosu */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-800/60 text-slate-400 uppercase tracking-wider text-[10px] font-bold border-b border-slate-700">
                <tr>
                  <th className="py-3 px-4">Abone Bilgisi</th>
                  <th className="py-3 px-4">Plan / Rol</th>
                  <th className="py-3 px-4">Açık Bankacılık</th>
                  <th className="py-3 px-4">Hesap / İşlem</th>
                  <th className="py-3 px-4">KVKK Durumu</th>
                  <th className="py-3 px-4">Hesap Statüsü</th>
                  <th className="py-3 px-4 text-right">Destek Aksiyonu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredSubscribers.map((sub) => {
                  const hasBanks = (sub.bankConnections?.length || 0) > 0;
                  return (
                    <tr key={sub.id} className="hover:bg-slate-800/30 transition">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-white text-sm">{sub.fullName}</div>
                        <div className="text-slate-400 text-[11px]">{sub.email}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Kayıt: {new Date(sub.createdAt).toLocaleDateString('tr-TR')}
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
                              <span>{sub.bankConnections.length} Banka Canlı Bağlı</span>
                            </div>
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              {sub.bankConnections.map((b: any) => b.bankName).join(', ')}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Banka Bağlanmamış</span>
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
                            <span>Askıda</span>
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
                          className="px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-lg font-bold text-xs transition inline-flex items-center gap-1.5"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>Destek Masası</span>
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
      {/* SEKME 2: DEĞİŞTİRİLEMEZ KVKK DENETİM İZİ (AUDIT LOGS) */}
      {/* ========================================================================= */}
      {activeTab === 'AUDIT_LOGS' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Lock className="h-4 w-4 text-emerald-400" />
                <span>KVKK Denetim ve Temsilci İşlem Günlüğü</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Müşteri temsilcilerinin aboneler adına gerçekleştirdiği tüm inceleme, eşitleme ve müdahaleler yasal kanıt olarak kayıt altına alınır.
              </p>
            </div>
            <button
              onClick={loadAdminData}
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
                  <th className="py-3 px-4">Temsilci / Aktör</th>
                  <th className="py-3 px-4">İşlem Türü</th>
                  <th className="py-3 px-4">Detay (KVKK Maskeli)</th>
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

      {/* ========================================================================= */}
      {/* MODAL: MÜŞTERİ TEMSİLCİSİ TEŞHİS & DESTEK KONSOLU (KVKK UYUMLU) */}
      {/* ========================================================================= */}
      {selectedSubscriber && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-indigo-500/40 rounded-3xl w-full max-w-3xl p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-extrabold text-[10px]">
                    MÜŞTERİ TEMSİLCİSİ DESTEK EKRANI
                  </span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-extrabold text-[10px] flex items-center gap-1">
                    <ShieldCheck className="h-3 w-3" />
                    <span>KVKK UYUMLU MASKELEME</span>
                  </span>
                </div>
                <h3 className="text-xl font-black text-white mt-1">
                  {selectedSubscriber.fullName}
                </h3>
                <p className="text-xs text-slate-400">{selectedSubscriber.email}</p>
              </div>

              <button
                onClick={() => {
                  setSelectedSubscriber(null);
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
                <span className="font-bold block">KVKK Madde 11-12 Güvenlik Protokolü:</span>
                Kullanıcı şifresi ve ham kart verileri görüntülenemez. IBAN ve kart numaraları maskelenmiştir. Bu ekranda yaptığınız tüm aksiyonlar sistem denetim kaydına işlenmektedir.
              </div>
            </div>

            {diagnosticsLoading ? (
              <div className="py-12 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
                <RefreshCw className="h-4 w-4 animate-spin text-indigo-400" />
                <span>Teknik teşhis ve bağlantı verileri toplanıyor...</span>
              </div>
            ) : diagnosticsData ? (
              <div className="space-y-6">
                
                {/* 1. Müşteri Temsilcisi Hızlı Yetki & Aksiyon Butonları */}
                <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-3">
                  <div className="text-xs font-bold text-white uppercase tracking-wider">
                    Temsilci Müdahale Yetkileri:
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    {/* Plan Yükseltme */}
                    <div className="flex items-center gap-2 bg-slate-900 px-3 py-2 rounded-xl border border-slate-700">
                      <span className="text-xs text-slate-300 font-medium">Plan:</span>
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

                    {/* Askıya Al / Aç */}
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

                {/* 2. Açık Bankacılık Bağlantıları & Uzaktan Eşitleme */}
                <div className="space-y-3">
                  <div className="text-xs font-bold text-white uppercase tracking-wider">
                    Kullanıcının Açık Bankacılık Bağlantıları ({diagnosticsData.connections?.length || 0}):
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
                                Rıza Kodu: {conn.consentId} • Otomatik Çekim: {conn.autoSyncEnabled ? 'Aktif (15 dk)' : 'Kapalı'}
                              </div>
                            </div>
                          </div>

                          {/* Uzaktan Senkronizasyon Tetikle Butonu */}
                          <button
                            disabled={actionLoading}
                            onClick={() => handleTriggerReSync(conn.id, conn.bankName)}
                            className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-lg text-xs font-bold transition flex items-center gap-1.5"
                          >
                            <RefreshCw className={`h-3.5 w-3.5 ${actionLoading ? 'animate-spin' : ''}`} />
                            <span>Uzaktan Eşitle (Re-Sync)</span>
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

            {/* Modal Kapat Butonu */}
            <div className="pt-2 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => {
                  setSelectedSubscriber(null);
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
