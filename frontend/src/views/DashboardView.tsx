import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  CreditCard, 
  Calendar, 
  ArrowUpRight, 
  ArrowDownRight, 
  Clock, 
  Plus, 
  RefreshCw, 
  Sparkles,
  BarChart3,
  Download,
  Repeat,
  PieChart
} from 'lucide-react';
import { ApiClient } from '../services/api';

interface DashboardViewProps {
  onNavigate: (tab: string) => void;
  onOpenTransactionModal: () => void;
  onOpenNoteModal: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ 
  onNavigate, 
  onOpenTransactionModal, 
  onOpenNoteModal 
}) => {
  const [summary, setSummary] = useState<any>(null);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [projections, setProjections] = useState<any[]>([]);
  const [budgets, setBudgets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [sum, txs, evts, proj, bdg] = await Promise.all([
        ApiClient.finance.getSummary(),
        ApiClient.finance.getTransactions(),
        ApiClient.calendar.getEvents(),
        ApiClient.finance.getProjection(),
        ApiClient.finance.getBudgets(),
      ]);
      setSummary(sum);
      setRecentTransactions(txs.slice(0, 5));
      setUpcomingEvents(evts.slice(0, 5));
      setProjections(proj);
      setBudgets(bdg);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleBankSync = async () => {
    try {
      setSyncing(true);
      await ApiClient.finance.syncBank();
      await loadDashboardData();
    } catch (err: any) {
      alert(err.message || 'Senkronizasyon hatası');
    } finally {
      setSyncing(false);
    }
  };

  const handleExportCsv = async () => {
    try {
      await ApiClient.finance.downloadCsv();
    } catch (err: any) {
      alert(err.message || 'CSV indirme hatası');
    }
  };

  const formatTL = (amount: number = 0) => {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(amount);
  };

  // Find max value in projection for relative bar height scaling
  const maxProjectionVal = projections.length > 0 
    ? Math.max(...projections.map(p => p.totalObligation), 1000)
    : 1000;

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Welcome & Fast Actions Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 p-6 rounded-2xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Kişisel Finans ve Akıllı Asistan Paneli</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Finansal Durum & Ajanda Özeti</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Banka hesaplarınız, yaklaşan taksit vadeleriniz ve notlarınız senkronize.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={onOpenTransactionModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/30 transition"
          >
            <Plus className="h-4 w-4" />
            <span>Harcama / Taksit Ekle</span>
          </button>

          <button
            onClick={handleBankSync}
            disabled={syncing}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin text-indigo-400' : 'text-slate-400'}`} />
            <span>{syncing ? 'Eşitleniyor...' : 'Banka Senkronizasyonu'}</span>
          </button>

          <button
            onClick={handleExportCsv}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl text-xs font-semibold transition"
          >
            <Download className="h-4 w-4 text-emerald-400" />
            <span>Excel/CSV</span>
          </button>
        </div>
      </div>

      {/* 4 Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Net Worth */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-medium uppercase tracking-wider">Toplam Net Varlık</span>
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
              <Wallet className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">
            {formatTL(summary?.netWorth || 0)}
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-400">
            <TrendingUp className="h-3.5 w-3.5" />
            <span>Tüm hesaplar senkronize</span>
          </div>
        </div>

        {/* Bu Ay Gelir */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-medium uppercase tracking-wider">Bu Ayki Gelir</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <ArrowUpRight className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-400 tracking-tight">
            {formatTL(summary?.monthSummary?.totalIncome || 0)}
          </div>
          <div className="mt-2 text-xs text-slate-400">Cari dönem tahsilatı</div>
        </div>

        {/* Bu Ay Gider */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-medium uppercase tracking-wider">Bu Ayki Gider</span>
            <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400">
              <ArrowDownRight className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-rose-400 tracking-tight">
            {formatTL(summary?.monthSummary?.totalExpense || 0)}
          </div>
          <div className="mt-2 text-xs text-slate-400">Harcamalar ve taksitler</div>
        </div>

        {/* Kalan Taksit Borçları */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-medium uppercase tracking-wider">Kalan Taksit Borcu</span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
              <CreditCard className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-400 tracking-tight">
            {formatTL(summary?.totalRemainingDebt || 0)}
          </div>
          <div className="mt-2 flex items-center gap-1 text-xs text-slate-400">
            <span className="font-semibold text-slate-200">{summary?.activeInstallmentCount || 0}</span> taksit planı aktif
          </div>
        </div>
      </div>

      {/* Gelecek 6 Aylık Taksit & Sabit Fatura Yükü (Cashflow Projection Bar Chart) */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
              <BarChart3 className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Gelecek 6 Aylık Zorunlu Ödeme Yükü Projeksiyonu</h3>
              <p className="text-xs text-slate-400">
                Taksit vadeleri ve sabit aboneliklerin/faturaların aylık nakit akışına etkisi
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded bg-amber-500"></span>
              <span className="text-slate-400">Taksitler</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded bg-sky-500"></span>
              <span className="text-slate-400">Sabit Faturalar</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-6 gap-3 sm:gap-6 pt-4 border-t border-slate-800/80">
          {projections.map((p, idx) => {
            const heightPercent = Math.max(Math.round((p.totalObligation / maxProjectionVal) * 100), 12);
            return (
              <div key={idx} className="flex flex-col items-center justify-end h-48 space-y-2 group">
                <div className="text-[11px] font-bold text-slate-200 group-hover:text-indigo-400 transition">
                  {formatTL(p.totalObligation)}
                </div>

                {/* Stacked visual bar */}
                <div className="w-full max-w-[48px] bg-slate-800 rounded-xl overflow-hidden flex flex-col justify-end p-1 transition-all group-hover:bg-slate-700"
                     style={{ height: `${heightPercent}%`, minHeight: '36px' }}>
                  {p.installmentLoad > 0 && (
                    <div 
                      className="w-full bg-amber-500 rounded-lg mb-1"
                      style={{ height: `${(p.installmentLoad / p.totalObligation) * 100}%`, minHeight: '12px' }}
                      title={`Taksitler: ${formatTL(p.installmentLoad)}`}
                    ></div>
                  )}
                  {p.billsTotal > 0 && (
                    <div 
                      className="w-full bg-sky-500 rounded-lg"
                      style={{ height: `${(p.billsTotal / p.totalObligation) * 100}%`, minHeight: '12px' }}
                      title={`Sabit Faturalar: ${formatTL(p.billsTotal)}`}
                    ></div>
                  )}
                </div>

                <div className="text-xs font-semibold text-slate-400 capitalize">{p.month}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Grid: Recent Transactions & Budgets / Upcoming Dues */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Son İşlemler */}
        <div className="lg:col-span-2 bg-slate-900 rounded-2xl border border-slate-800 p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-base font-bold text-white">Son Hesap Hareketleri</h3>
              <p className="text-xs text-slate-400">Hesaplarınıza ait en son gelir ve harcamalar</p>
            </div>
            <button
              onClick={() => onNavigate('finance')}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
            >
              Tümünü Gör →
            </button>
          </div>

          <div className="divide-y divide-slate-800/60">
            {recentTransactions.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                Henüz kayıtlı bir hesap hareketi bulunmuyor.
              </div>
            ) : (
              recentTransactions.map((tx) => (
                <div key={tx.id} className="py-3.5 flex items-center justify-between group">
                  <div className="flex items-center gap-3.5">
                    <div 
                      className="h-10 w-10 rounded-xl flex items-center justify-center font-bold text-xs shrink-0"
                      style={{ backgroundColor: `${tx.category?.color || '#6366f1'}20`, color: tx.category?.color || '#6366f1' }}
                    >
                      {tx.type === 'INCOME' ? '+' : '-'}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-200 group-hover:text-indigo-400 transition">
                        {tx.description}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                        <span>{tx.account?.name}</span>
                        <span>•</span>
                        <span style={{ color: tx.category?.color }}>{tx.category?.name}</span>
                        <span>•</span>
                        <span>{new Date(tx.date).toLocaleDateString('tr-TR')}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className={`text-sm font-bold ${
                      tx.type === 'INCOME' ? 'text-emerald-400' : 'text-slate-200'
                    }`}>
                      {tx.type === 'INCOME' ? '+' : '-'}{formatTL(tx.amount)}
                    </div>
                    {tx.installmentPlan && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium">
                        Taksitli
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right 1 Col: Bütçeler ve Yaklaşan Vadeler */}
        <div className="space-y-6">
          {/* Bütçe Takibi */}
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white">Aylık Bütçe Takibi</h3>
              <button
                onClick={() => onNavigate('finance')}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
              >
                Yönet →
              </button>
            </div>

            <div className="space-y-3.5">
              {budgets.length === 0 ? (
                <div className="text-xs text-slate-500 py-2">Henüz bir kategori bütçesi tanımlanmadı.</div>
              ) : (
                budgets.map((b) => (
                  <div key={b.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-300">{b.category?.name}</span>
                      <span className={`font-bold ${b.isOverBudget ? 'text-rose-400' : 'text-slate-400'}`}>
                        {formatTL(b.spent)} / {formatTL(b.amountLimit)}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          b.isOverBudget ? 'bg-rose-500' : b.percent > 80 ? 'bg-amber-500' : 'bg-emerald-400'
                        }`}
                        style={{ width: `${Math.min(b.percent, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Yaklaşan Vadeler */}
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white">Yaklaşan Vadeler</h3>
              <button
                onClick={() => onNavigate('calendar')}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
              >
                Ajanda →
              </button>
            </div>

            <div className="space-y-3">
              {upcomingEvents.length === 0 ? (
                <div className="py-4 text-center text-xs text-slate-500">
                  Yaklaşan bir vade bulunmuyor.
                </div>
              ) : (
                upcomingEvents.map((evt) => {
                  const isFinance = evt.sourceModule === 'FINANCE';
                  return (
                    <div 
                      key={evt.id} 
                      className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-start gap-3 hover:border-slate-600 transition"
                    >
                      <div className={`p-2 rounded-lg shrink-0 ${
                        isFinance ? 'bg-rose-500/10 text-rose-400' : 'bg-indigo-500/10 text-indigo-400'
                      }`}>
                        {isFinance ? <CreditCard className="h-4 w-4" /> : <Calendar className="h-4 w-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold text-slate-200 truncate">
                          {evt.title}
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                          <Clock className="h-3 w-3" />
                          <span>{new Date(evt.startTime).toLocaleDateString('tr-TR')}</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
