import React, { useState, useEffect } from 'react';
import { 
  Wallet, 
  CreditCard, 
  Building2, 
  Plus, 
  RefreshCw, 
  Search, 
  Download, 
  Clock, 
  Layers, 
  ArrowDownRight, 
  ArrowUpRight, 
  Repeat, 
  Target, 
  Trash2, 
  BarChart3, 
  FileText, 
  Copy, 
  Check, 
  Edit2, 
  TrendingUp, 
  ShieldCheck, 
  Coins, 
  Landmark,
  Banknote,
  CalendarClock,
  Zap,
  Lock,
  CheckCircle2,
  ExternalLink,
  Power,
  AlertTriangle
} from 'lucide-react';
import { ApiClient } from '../services/api';

interface FinanceViewProps {
  isModalOpen: boolean;
  setIsModalOpen: (open: boolean) => void;
}

type FinanceSubTab = 'ACCOUNTS_AND_CARDS' | 'OPEN_BANKING' | 'TRANSACTIONS' | 'INSTALLMENTS' | 'BILLS' | 'BUDGETS' | 'PROJECTION';
type AccountFilterType = 'ALL' | 'CREDIT_CARD' | 'BANK' | 'CASH';

export const FinanceView: React.FC<FinanceViewProps> = ({ isModalOpen, setIsModalOpen }) => {
  const [subTab, setSubTab] = useState<FinanceSubTab>('ACCOUNTS_AND_CARDS');
  const [accountFilter, setAccountFilter] = useState<AccountFilterType>('ALL');

  const [accounts, setAccounts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [installments, setInstallments] = useState<any[]>([]);
  const [bills, setBills] = useState<any[]>([]);
  const [budgets, setBudgets] = useState<any[]>([]);
  const [projections, setProjections] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);

  // Açık Bankacılık (Open Banking) State
  const [supportedBanks, setSupportedBanks] = useState<any[]>([]);
  const [bankConnections, setBankConnections] = useState<any[]>([]);
  const [selectedBankToConnect, setSelectedBankToConnect] = useState<any | null>(null);
  const [isConsentModalOpen, setIsConsentModalOpen] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [syncingConnId, setSyncingConnId] = useState<string | null>(null);
  const [syncStatusToast, setSyncStatusToast] = useState<string | null>(null);

  // Otomatik Portföy Keşif Sonuç Modalı
  const [discoveryResult, setDiscoveryResult] = useState<any | null>(null);
  const [isDiscoverySuccessModalOpen, setIsDiscoverySuccessModalOpen] = useState(false);

  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [copiedIban, setCopiedIban] = useState<string | null>(null);

  // Modallar
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isBillModalOpen, setIsBillModalOpen] = useState(false);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);

  // Form State: Hesap / Kart Tanımlama
  const [newAccType, setNewAccType] = useState<'BANK' | 'CREDIT_CARD' | 'INVESTMENT' | 'CASH'>('BANK');
  const [newAccName, setNewAccName] = useState('');
  const [newAccBank, setNewAccBank] = useState('Garanti BBVA');
  const [newAccBalance, setNewAccBalance] = useState('');
  const [newAccIban, setNewAccIban] = useState('');
  const [newAccCardNo, setNewAccCardNo] = useState('');
  const [newAccLimit, setNewAccLimit] = useState('');
  const [newAccStatementDay, setNewAccStatementDay] = useState(15);
  const [newAccDueDay, setNewAccDueDay] = useState(25);
  const [newAccColor, setNewAccColor] = useState('#1e3a8a');

  // Form State: İşlem / Taksit
  const [txAccountId, setTxAccountId] = useState('');
  const [txCategoryId, setTxCategoryId] = useState('');
  const [txAmount, setTxAmount] = useState('');
  const [txType, setTxType] = useState<'EXPENSE' | 'INCOME'>('EXPENSE');
  const [txDescription, setTxDescription] = useState('');
  const [txIsInstallment, setTxIsInstallment] = useState(false);
  const [txTotalInstallments, setTxTotalInstallments] = useState(6);
  const [txDueDayOfMonth, setTxDueDayOfMonth] = useState(15);
  const [txFormError, setTxFormError] = useState<string | null>(null);

  // Form State: Sabit Fatura
  const [billName, setBillName] = useState('');
  const [billAmount, setBillAmount] = useState('');
  const [billDay, setBillDay] = useState(1);

  // Form State: Bütçe
  const [budgetCatId, setBudgetCatId] = useState('');
  const [budgetLimit, setBudgetLimit] = useState('');

  // Filtreler
  const [search, setSearch] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('ALL');

  const loadFinanceData = async () => {
    try {
      setLoading(true);
      const [accs, cats, txs, insts, bls, bdgs, proj, sum, banks, conns] = await Promise.all([
        ApiClient.finance.getAccounts(),
        ApiClient.finance.getCategories(),
        ApiClient.finance.getTransactions(),
        ApiClient.finance.getInstallments(),
        ApiClient.finance.getRecurringBills(),
        ApiClient.finance.getBudgets(),
        ApiClient.finance.getProjection(),
        ApiClient.finance.getSummary(),
        ApiClient.finance.getSupportedBanks(),
        ApiClient.finance.getBankConnections(),
      ]);
      setAccounts(accs);
      setCategories(cats);
      setTransactions(txs);
      setInstallments(insts);
      setBills(bls);
      setBudgets(bdgs);
      setProjections(proj);
      setSummary(sum);
      setSupportedBanks(banks);
      setBankConnections(conns);

      if (accs.length > 0 && !txAccountId) setTxAccountId(accs[0].id);
      if (cats.length > 0 && !txCategoryId) setTxCategoryId(cats[0].id);
      if (cats.length > 0 && !budgetCatId) setBudgetCatId(cats[0].id);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFinanceData();
  }, []);

  // Global Bank Sync (Tüm Bankaları Eşitle)
  const handleSyncAllBanks = async () => {
    try {
      setSyncing(true);
      const res: any = await ApiClient.finance.syncAllBankConnections();
      await loadFinanceData();
      showToast(`Tüm bankalar eşitlendi. ${res.totalSyncedAccounts} hesap/kart güncellendi.`);
    } catch (err: any) {
      alert(err.message || 'Senkronizasyon hatası');
    } finally {
      setSyncing(false);
    }
  };

  // Tekil Banka Anlık Eşitleme
  const handleSyncSingleConnection = async (connId: string, bankName: string) => {
    try {
      setSyncingConnId(connId);
      const res: any = await ApiClient.finance.syncBankConnection(connId);
      await loadFinanceData();
      showToast(`${bankName} anlık eşitlendi. ${res.newTransactionsCount > 0 ? `${res.newTransactionsCount} yeni işlem çekildi.` : 'Bakiyeler güncellendi.'}`);
    } catch (err: any) {
      alert(err.message || 'Eşitleme hatası');
    } finally {
      setSyncingConnId(null);
    }
  };

  // Otomatik Senkronizasyon Anahtarını Değiştir
  const handleToggleAutoSync = async (connId: string, currentVal: boolean) => {
    try {
      await ApiClient.finance.toggleBankAutoSync(connId, !currentVal);
      await loadFinanceData();
      showToast(!currentVal ? 'Otomatik arka plan çekimi aktif edildi.' : 'Otomatik çekim durduruldu.');
    } catch (err: any) {
      alert(err.message || 'Ayar güncellenemedi');
    }
  };

  // Açık Bankacılık Rıza Onayı ve Bağlantı Kurma (Tüm Portföyü Otomatik Kopyalama)
  const handleAuthorizeAndConnect = async () => {
    if (!selectedBankToConnect) return;
    try {
      setIsConnecting(true);
      const res: any = await ApiClient.finance.connectBank(selectedBankToConnect.code);
      setIsConsentModalOpen(false);
      setDiscoveryResult(res);
      setIsDiscoverySuccessModalOpen(true);
      setSelectedBankToConnect(null);
      await loadFinanceData();
      showToast(`${res.discoveredProducts?.length || 4} finansal ürününüz başarıyla keşfedildi ve aktarıldı!`);
    } catch (err: any) {
      alert(err.message || 'Bağlantı kurulamadı');
    } finally {
      setIsConnecting(false);
    }
  };

  // Banka Bağlantısını Kes
  const handleDisconnectBank = async (connId: string, bankName: string) => {
    if (!confirm(`${bankName} bağlantısını kesmek ve açık bankacılık rızasını iptal etmek istediğinize emin misiniz?`)) return;
    try {
      await ApiClient.finance.disconnectBank(connId);
      await loadFinanceData();
      showToast(`${bankName} bağlantısı ve veri akışı sonlandırıldı.`);
    } catch (err: any) {
      alert(err.message || 'Bağlantı kesilemedi');
    }
  };

  const showToast = (msg: string) => {
    setSyncStatusToast(msg);
    setTimeout(() => setSyncStatusToast(null), 4000);
  };

  const handleExportCsv = async () => {
    try {
      await ApiClient.finance.downloadCsv();
    } catch (err: any) {
      alert(err.message || 'CSV indirme hatası');
    }
  };

  const handleCopyIban = (iban: string) => {
    navigator.clipboard.writeText(iban);
    setCopiedIban(iban);
    setTimeout(() => setCopiedIban(null), 2000);
  };

  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: any = {
        name: newAccName,
        type: newAccType,
        bankName: newAccType === 'CASH' ? 'Nakit Kasa' : newAccBank,
        color: newAccColor,
        balance: parseFloat(newAccBalance || '0'),
        currency: 'TRY',
      };

      if (newAccType === 'CREDIT_CARD') {
        payload.creditLimit = parseFloat(newAccLimit || '50000');
        payload.statementDay = Number(newAccStatementDay);
        payload.dueDay = Number(newAccDueDay);
        payload.accountNumberMasked = newAccCardNo ? `•••• •••• •••• ${newAccCardNo.slice(-4)}` : '•••• 1234';
      } else {
        payload.iban = newAccIban;
        payload.accountNumberMasked = newAccIban ? `TR** ${newAccIban.slice(-4)}` : undefined;
      }

      if (editingAccountId) {
        await ApiClient.finance.updateAccount(editingAccountId, payload);
      } else {
        await ApiClient.finance.createAccount(payload);
      }

      setIsAccountModalOpen(false);
      setEditingAccountId(null);
      resetAccountForm();
      await loadFinanceData();
    } catch (err: any) {
      alert(err.message || 'Hesap kaydedilemedi');
    }
  };

  const handleDeleteAccount = async (id: string, name: string) => {
    if (!confirm(`"${name}" hesabını silmek istediğinize emin misiniz?`)) return;
    try {
      await ApiClient.finance.deleteAccount(id);
      await loadFinanceData();
    } catch (err: any) {
      alert(err.message || 'Hesap silinemedi');
    }
  };

  const openEditAccountModal = (acc: any) => {
    setEditingAccountId(acc.id);
    setNewAccType(acc.type);
    setNewAccName(acc.name);
    setNewAccBank(acc.bankName || 'Garanti BBVA');
    setNewAccBalance(Math.abs(acc.balance).toString());
    setNewAccIban(acc.iban || '');
    setNewAccCardNo(acc.accountNumberMasked || '');
    setNewAccLimit(acc.creditLimit ? acc.creditLimit.toString() : '50000');
    setNewAccStatementDay(acc.statementDay || 15);
    setNewAccDueDay(acc.dueDay || 25);
    setNewAccColor(acc.color || '#1e3a8a');
    setIsAccountModalOpen(true);
  };

  const resetAccountForm = () => {
    setNewAccName('');
    setNewAccBalance('');
    setNewAccIban('');
    setNewAccCardNo('');
    setNewAccLimit('');
  };

  const handleCreateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    setTxFormError(null);
    try {
      await ApiClient.finance.createTransaction({
        accountId: txAccountId,
        categoryId: txCategoryId,
        amount: parseFloat(txAmount),
        type: txType,
        description: txDescription,
        isInstallment: txIsInstallment,
        totalInstallments: txIsInstallment ? Number(txTotalInstallments) : undefined,
        dueDayOfMonth: txIsInstallment ? Number(txDueDayOfMonth) : undefined,
      });

      setIsModalOpen(false);
      setTxAmount('');
      setTxDescription('');
      setTxIsInstallment(false);
      await loadFinanceData();
    } catch (err: any) {
      setTxFormError(err.message || 'İşlem kaydedilemedi');
    }
  };

  const handleCreateBill = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await ApiClient.finance.createRecurringBill({
        accountId: txAccountId,
        categoryId: txCategoryId,
        name: billName,
        amount: parseFloat(billAmount),
        billingDay: Number(billDay),
      });
      setIsBillModalOpen(false);
      setBillName('');
      setBillAmount('');
      await loadFinanceData();
    } catch (err: any) {
      alert(err.message || 'Fatura eklenemedi');
    }
  };

  const handleToggleBill = async (id: string) => {
    try {
      await ApiClient.finance.toggleRecurringBill(id);
      await loadFinanceData();
    } catch (err: any) {
      alert(err.message || 'Durum değiştirilemedi');
    }
  };

  const handleDeleteBill = async (id: string) => {
    if (!confirm('Bu faturayı silmek istediğinize emin misiniz?')) return;
    try {
      await ApiClient.finance.deleteRecurringBill(id);
      await loadFinanceData();
    } catch (err: any) {
      alert(err.message || 'Silinemedi');
    }
  };

  const handleSetBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await ApiClient.finance.setBudget({
        categoryId: budgetCatId,
        amountLimit: parseFloat(budgetLimit),
      });
      setIsBudgetModalOpen(false);
      setBudgetLimit('');
      await loadFinanceData();
    } catch (err: any) {
      alert(err.message || 'Bütçe belirlenemedi');
    }
  };

  const formatTL = (val: number = 0) => {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(val);
  };

  // Hesap ve Kart Grupları
  const creditCards = accounts.filter(a => a.type === 'CREDIT_CARD');
  const depositAccounts = accounts.filter(a => a.type === 'BANK' || a.type === 'INVESTMENT');
  const cashAccounts = accounts.filter(a => a.type === 'CASH');

  const totalDepositBalance = accounts
    .filter(a => a.type !== 'CREDIT_CARD')
    .reduce((sum, a) => sum + (a.balance > 0 ? a.balance : 0), 0);

  const totalCardDebt = creditCards.reduce((sum, c) => sum + (c.currentDebt || Math.abs(c.balance)), 0);
  const totalCardLimit = creditCards.reduce((sum, c) => sum + (c.creditLimit || 50000), 0);
  const totalAvailableCardLimit = Math.max(0, totalCardLimit - totalCardDebt);

  const filteredTransactions = transactions.filter((tx) => {
    const matchesSearch = tx.description.toLowerCase().includes(search.toLowerCase()) ||
      tx.category?.name.toLowerCase().includes(search.toLowerCase());
    const matchesType = selectedTypeFilter === 'ALL' || tx.type === selectedTypeFilter;
    return matchesSearch && matchesType;
  });

  const subMenuItems = [
    { id: 'ACCOUNTS_AND_CARDS', label: 'Banka Hesapları & Kartlar', icon: Landmark, count: accounts.length, highlight: true },
    { id: 'OPEN_BANKING', label: 'Açık Bankacılık (Otomatik Bağlantı)', icon: Zap, count: bankConnections.length, highlight: true },
    { id: 'TRANSACTIONS', label: 'Hesap Hareketleri', icon: FileText, count: transactions.length },
    { id: 'INSTALLMENTS', label: 'Taksitlendirme Motoru', icon: Layers, count: installments.length },
    { id: 'BILLS', label: 'Sabit Abonelikler & Fatura', icon: Repeat, count: bills.length },
    { id: 'BUDGETS', label: 'Kategori Bütçe Limitleri', icon: Target, count: budgets.length },
    { id: 'PROJECTION', label: '6 Aylık Nakit Akışı', icon: BarChart3 },
  ];

  const bankOptions = [
    'Garanti BBVA',
    'Türkiye İş Bankası',
    'Akbank T.A.Ş.',
    'Yapı Kredi',
    'QNB Finansbank',
    'Ziraat Bankası',
    'VakıfBank',
    'DenizBank',
    'Enpara.com',
    'Diğer / Özel'
  ];

  return (
    <div className="w-full px-6 lg:px-10 py-6 space-y-6">
      
      {/* Canlı Eşitleme Bildirimi (Toast) */}
      {syncStatusToast && (
        <div className="fixed top-20 right-8 z-50 bg-emerald-500 text-slate-950 px-4 py-3 rounded-xl shadow-2xl font-bold text-xs flex items-center gap-2.5 animate-bounce">
          <CheckCircle2 className="h-4 w-4 text-slate-950" />
          <span>{syncStatusToast}</span>
        </div>
      )}

      {/* Finans Üst Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Landmark className="h-4 w-4" />
            <span>Finans Yönetim Merkezi</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
            Finans & Varlık Yönetimi
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Açık bankacılık canlı veri akışı, kredi kartları, taksit motoru, periyodik faturalar ve bütçe limitleri
          </p>
        </div>

        {/* Hızlı Aksiyonlar */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setSubTab('OPEN_BANKING')}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/30 transition"
          >
            <Zap className="h-4 w-4 text-amber-300" />
            <span>Bankayı Otomatik Bağla</span>
          </button>

          <button
            onClick={handleSyncAllBanks}
            disabled={syncing}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin text-indigo-400' : 'text-slate-400'}`} />
            <span>{syncing ? 'Tüm Bankalar Eşitleniyor...' : 'Anlık Veri Çek (Sync)'}</span>
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition"
          >
            <Plus className="h-4 w-4 text-indigo-400" />
            <span>Harcama / Taksit</span>
          </button>
        </div>
      </div>

      {/* Ana Gövde: Sol Menüleşmiş Detaylar & Sağ İçerik Alanı */}
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        
        {/* SOL DETAY MENÜSÜ */}
        <aside className="w-full lg:w-72 bg-slate-900 border border-slate-800 rounded-2xl p-4 shrink-0 space-y-3 sticky top-24">
          <div className="px-3 py-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 flex items-center justify-between">
            <span>Finans Detay Menüsü</span>
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" title="Canlı Açık Bankacılık Bağlantısı Aktif"></span>
          </div>

          <nav className="space-y-1">
            {subMenuItems.map((item) => {
              const Icon = item.icon;
              const isActive = subTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setSubTab(item.id as FinanceSubTab)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`h-4 w-4 ${isActive ? 'text-white' : item.id === 'OPEN_BANKING' ? 'text-amber-400' : item.highlight ? 'text-indigo-400' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>

                  {item.count !== undefined && (
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      isActive ? 'bg-indigo-800 text-white' : item.id === 'OPEN_BANKING' ? 'bg-indigo-500/20 text-indigo-300' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Sol Menü Hızlı Aksiyon Kutusu */}
          <div className="pt-3 border-t border-slate-800 space-y-2">
            <button
              onClick={() => setSubTab('OPEN_BANKING')}
              className="w-full py-2.5 bg-gradient-to-r from-indigo-500/10 to-indigo-600/20 hover:from-indigo-500/20 hover:to-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition"
            >
              <Zap className="h-3.5 w-3.5 text-amber-300" />
              <span>Otomatik Banka Ekle</span>
            </button>

            <button
              onClick={handleExportCsv}
              className="w-full py-2 bg-slate-800/60 hover:bg-slate-700/80 text-slate-400 hover:text-white border border-slate-700/60 rounded-xl text-xs font-medium flex items-center justify-center gap-2 transition"
            >
              <Download className="h-3.5 w-3.5 text-emerald-400" />
              <span>Döküm İndir (Excel/CSV)</span>
            </button>
          </div>
        </aside>

        {/* SAĞ İÇERİK ALANI */}
        <div className="flex-1 w-full min-w-0">

          {/* ========================================================================= */}
          {/* YENİ MODÜL: AÇIK BANKACILIK OTOMATİK ENTEGRASYON HUB'I */}
          {/* ========================================================================= */}
          {subTab === 'OPEN_BANKING' && (
            <div className="space-y-8">
              
              {/* Açık Bankacılık Tanıtım ve Güvenlik Standartları Banner'ı */}
              <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/30 shadow-2xl relative overflow-hidden">
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
                  <div className="space-y-2 max-w-2xl">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 text-xs font-bold">
                      <Zap className="h-3.5 w-3.5 text-amber-300" />
                      <span>BKM AÇIK BANKACILIK GEÇİT ENTEGRASYONU</span>
                    </div>
                    <h2 className="text-2xl font-extrabold text-white tracking-tight">
                      Manuel Girişlere Son: Bankanızı Bağlayın, Veriler Anlık Aksın
                    </h2>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Bankanızı tek tıkla sisteme bağlayarak vadesiz bakiyelerinizi, kredi kartı borç/limitlerinizi ve harcama dekontlarınızı otomatik olarak sisteme çekin. Arka plan motorumuz her 15 dakikada bir verilerinizi günceller.
                    </p>
                  </div>

                  <button
                    onClick={handleSyncAllBanks}
                    disabled={syncing}
                    className="shrink-0 flex items-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-xs font-bold shadow-lg shadow-indigo-600/30 transition disabled:opacity-50"
                  >
                    <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
                    <span>{syncing ? 'Tüm Bankalar Eşitleniyor...' : 'Tüm Bağlı Bankaları Şimdi Eşitle'}</span>
                  </button>
                </div>
              </div>

              {/* 1. AKTİF BANKA BAĞLANTILARI (CANLI VERİ ÇEKENLER) */}
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                    <h3 className="text-base font-extrabold text-white">
                      Aktif Banka Bağlantıları ({bankConnections.length})
                    </h3>
                  </div>
                  <span className="text-xs text-slate-400">Canlı API & Rıza Durumu</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {bankConnections.map((conn) => (
                    <div 
                      key={conn.id} 
                      className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-lg hover:border-slate-700 transition"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-black text-indigo-400 text-sm">
                            {conn.bankName.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <h4 className="text-sm font-extrabold text-white">{conn.bankName}</h4>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold flex items-center gap-1">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                                <span>CANLI BAĞLI</span>
                              </span>
                              <span className="text-[10px] text-slate-400">
                                {conn.accountsCount} Hesap & Kart Aktif
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Anlık Eşitleme Butonu */}
                        <button
                          onClick={() => handleSyncSingleConnection(conn.id, conn.bankName)}
                          disabled={syncingConnId === conn.id}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold transition disabled:opacity-50"
                        >
                          <RefreshCw className={`h-3.5 w-3.5 ${syncingConnId === conn.id ? 'animate-spin text-indigo-400' : 'text-slate-400'}`} />
                          <span>{syncingConnId === conn.id ? 'Çekiliyor...' : 'Şimdi Eşitle'}</span>
                        </button>
                      </div>

                      {/* Rıza Süresi ve Otomatik Çekim Toggle */}
                      <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between text-xs">
                        <div className="space-y-0.5">
                          <div className="text-[10px] text-slate-400 font-semibold uppercase">Rıza Geçerlilik Durumu</div>
                          <div className="text-slate-200 font-bold flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5 text-amber-400" />
                            <span>{conn.daysRemaining} gün kaldı</span>
                            <span className="text-[10px] text-slate-400 font-normal">({conn.consentId})</span>
                          </div>
                        </div>

                        {/* Otomatik Çekim Anahtarı */}
                        <div className="text-right">
                          <div className="text-[10px] text-slate-400 font-semibold uppercase mb-1">Otomatik Çekim</div>
                          <button
                            onClick={() => handleToggleAutoSync(conn.id, conn.autoSyncEnabled)}
                            className={`text-xs px-2.5 py-1 rounded-lg font-bold transition ${
                              conn.autoSyncEnabled
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : 'bg-slate-700 text-slate-400'
                            }`}
                          >
                            {conn.autoSyncEnabled ? 'Her 15 Dk (Aktif)' : 'Devre Dışı'}
                          </button>
                        </div>
                      </div>

                      {/* Alt Bar: Son Çekim & Bağlantıyı Kes */}
                      <div className="pt-2 flex items-center justify-between text-[11px] text-slate-400">
                        <span>Son Çekim: {conn.lastSyncedAt ? new Date(conn.lastSyncedAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'Az önce'}</span>
                        <button
                          onClick={() => handleDisconnectBank(conn.id, conn.bankName)}
                          className="text-slate-500 hover:text-rose-400 transition"
                        >
                          Bağlantıyı Kes
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 2. TÜRKİYE BANKALARI KATALOĞU (YENİ BANKA BAĞLA) */}
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div>
                    <h3 className="text-base font-extrabold text-white">Desteklenen Bankalar (Tek Tıkla Bağlanın)</h3>
                    <p className="text-xs text-slate-400">BKM Açık Bankacılık GEÇİT altyapısı ile doğrudan entegre bankalar</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {supportedBanks.map((bank) => {
                    const isAlreadyConnected = bankConnections.some(c => c.bankCode === bank.code);

                    return (
                      <div 
                        key={bank.code}
                        className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-indigo-500/40 transition flex flex-col justify-between space-y-4"
                      >
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <div className="h-10 w-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-black text-indigo-400 text-sm">
                              {bank.name.slice(0, 2).toUpperCase()}
                            </div>

                            {isAlreadyConnected ? (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">
                                ✓ BAĞLI
                              </span>
                            ) : (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 font-semibold border border-indigo-500/20">
                                BKM UYUMLU
                              </span>
                            )}
                          </div>

                          <h4 className="text-sm font-extrabold text-white">{bank.name}</h4>
                          <p className="text-[11px] text-slate-400 mt-1">{bank.securityStandard}</p>
                        </div>

                        <div className="pt-3 border-t border-slate-800 space-y-2">
                          <div className="text-[10px] text-slate-500 flex items-center justify-between">
                            <span>Kredi Kartı Desteği:</span>
                            <span className="text-emerald-400 font-semibold">Aktif</span>
                          </div>

                          {isAlreadyConnected ? (
                            <button
                              disabled
                              className="w-full py-2 bg-slate-800/80 text-slate-400 rounded-xl text-xs font-semibold cursor-default"
                            >
                              Bağlantı Aktif
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setSelectedBankToConnect(bank);
                                setIsConsentModalOpen(true);
                              }}
                              className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/30 transition flex items-center justify-center gap-1.5"
                            >
                              <Zap className="h-3.5 w-3.5 text-amber-300" />
                              <span>Bankayı Bağla</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          )}

          {/* ========================================================================= */}
          {/* 1. BANKA HESAPLARI & KREDİ KARTLARI (RENK & SEMBOLLERLE BELİRGİNLEŞTİRİLMİŞ DÜZEN) */}
          {/* ========================================================================= */}
          {subTab === 'ACCOUNTS_AND_CARDS' && (
            <div className="space-y-8">
              
              {/* Açık Bankacılık Canlı Durum İhbar Çubuğu */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 shrink-0">
                    <Zap className="h-5 w-5 text-emerald-400" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-2">
                      <span>Açık Bankacılık Otomatik Veri Akışı Aktif</span>
                      <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {bankConnections.length} banka bağlı. Hesap hareketleri ve kart limitleri arka planda her 15 dakikada bir otomatik güncellenir.
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={handleSyncAllBanks}
                    disabled={syncing}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold transition"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${syncing ? 'animate-spin text-indigo-400' : 'text-slate-400'}`} />
                    <span>Şimdi Eşitle</span>
                  </button>

                  <button
                    onClick={() => setSubTab('OPEN_BANKING')}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-sm transition"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Banka Bağla</span>
                  </button>
                </div>
              </div>

              {/* RENK & SEMBOLLERLE NET AYRIŞTIRILMIŞ 4 MAKRO FİNANSAL KART */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                
                {/* 1. Varlıklar (Zümrüt Yeşili - Banka Mevduatı) */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-emerald-950/30 border border-emerald-500/30 shadow-lg shadow-emerald-950/20">
                  <div className="flex items-center justify-between text-xs mb-1.5 font-bold text-emerald-400">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-emerald-500/20">
                        <Landmark className="h-4 w-4 text-emerald-400" />
                      </div>
                      <span className="uppercase tracking-wider">Mevduat & Nakit</span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-extrabold">ARTIDA</span>
                  </div>
                  <div className="text-2xl font-black text-white tracking-tight">
                    {formatTL(totalDepositBalance)}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">Banka vadesiz, vadeli & nakit</div>
                </div>

                {/* 2. Borçlar (Gül Kurusu / Bordo Kırmızı - Kredi Kartı Borcu) */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-rose-950/30 border border-rose-500/30 shadow-lg shadow-rose-950/20">
                  <div className="flex items-center justify-between text-xs mb-1.5 font-bold text-rose-400">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-rose-500/20">
                        <CreditCard className="h-4 w-4 text-rose-400" />
                      </div>
                      <span className="uppercase tracking-wider">Kart Borçları</span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-extrabold">{creditCards.length} KART</span>
                  </div>
                  <div className="text-2xl font-black text-rose-400 tracking-tight">
                    {formatTL(totalCardDebt)}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">Dönem içi toplam kart borcu</div>
                </div>

                {/* 3. Kart Limitleri (Derin Mor / İndigo - Kullanılabilir Limit) */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-indigo-950/30 border border-indigo-500/30 shadow-lg shadow-indigo-950/20">
                  <div className="flex items-center justify-between text-xs mb-1.5 font-bold text-indigo-400">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-indigo-500/20">
                        <ShieldCheck className="h-4 w-4 text-indigo-400" />
                      </div>
                      <span className="uppercase tracking-wider">Kalan Kart Limiti</span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-extrabold">BOŞTA</span>
                  </div>
                  <div className="text-2xl font-black text-indigo-300 tracking-tight">
                    {formatTL(totalAvailableCardLimit)}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">Toplam Limit: {formatTL(totalCardLimit)}</div>
                </div>

                {/* 4. Net Likidite (Mavi / Beyaz - Net Finansal Durum) */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-sky-950/30 border border-sky-500/30 shadow-lg shadow-sky-950/20">
                  <div className="flex items-center justify-between text-xs mb-1.5 font-bold text-sky-400">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-sky-500/20">
                        <Coins className="h-4 w-4 text-sky-400" />
                      </div>
                      <span className="uppercase tracking-wider">Net Likit Durum</span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 font-extrabold">NET</span>
                  </div>
                  <div className="text-2xl font-black text-white tracking-tight">
                    {formatTL(totalDepositBalance - totalCardDebt)}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">Varlıklar eksi kart borçları</div>
                </div>
              </div>

              {/* HIZLI FİLTRELEME ÇUBUĞU */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/90 p-3 rounded-2xl border border-slate-800">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setAccountFilter('ALL')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                      accountFilter === 'ALL'
                        ? 'bg-slate-100 text-slate-950 shadow-md'
                        : 'text-slate-400 hover:text-white bg-slate-800/60'
                    }`}
                  >
                    Tüm Varlıklar & Kartlar ({accounts.length})
                  </button>

                  <button
                    onClick={() => setAccountFilter('CREDIT_CARD')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                      accountFilter === 'CREDIT_CARD'
                        ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                        : 'text-rose-400 hover:bg-rose-500/10 border border-rose-500/20'
                    }`}
                  >
                    <CreditCard className="h-3.5 w-3.5" />
                    <span>Kredi Kartları ({creditCards.length})</span>
                  </button>

                  <button
                    onClick={() => setAccountFilter('BANK')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                      accountFilter === 'BANK'
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                        : 'text-emerald-400 hover:bg-emerald-500/10 border border-emerald-500/20'
                    }`}
                  >
                    <Landmark className="h-3.5 w-3.5" />
                    <span>Banka Mevduat ({depositAccounts.length})</span>
                  </button>

                  <button
                    onClick={() => setAccountFilter('CASH')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                      accountFilter === 'CASH'
                        ? 'bg-amber-600 text-white shadow-md'
                        : 'text-amber-400 hover:bg-amber-500/10 border border-amber-500/20'
                    }`}
                  >
                    <Banknote className="h-3.5 w-3.5" />
                    <span>Nakit Kasa ({cashAccounts.length})</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSubTab('OPEN_BANKING')}
                    className="flex items-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/25 transition"
                  >
                    <Zap className="h-4 w-4 text-amber-300" />
                    <span>Otomatik Banka Bağla</span>
                  </button>

                  <button
                    onClick={() => {
                      setEditingAccountId(null);
                      resetAccountForm();
                      setIsAccountModalOpen(true);
                    }}
                    className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl text-xs font-semibold transition"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Manuel Ekle</span>
                  </button>
                </div>
              </div>

              {/* SIFIR BAŞLANGIÇ: HESAP YOKSA TEMİZ HOŞGELDİN EKRANI */}
              {accounts.length === 0 && (
                <div className="p-10 text-center rounded-3xl bg-slate-900 border border-slate-800 space-y-4 max-w-lg mx-auto my-6">
                  <div className="p-4 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 w-16 h-16 mx-auto flex items-center justify-center shadow-lg shadow-indigo-500/10">
                    <Landmark className="h-8 w-8 text-indigo-400" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-lg font-black text-white">Henüz Tanımlı Bir Hesap veya Kartınız Bulunmuyor</h3>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto">
                      Sistem tamamen sıfırdan sizin için hazırlandı. Varlıklarınızı ve kartlarınızı otomatik içeri aktarmak için bankanızı bağlayabilirsiniz.
                    </p>
                  </div>
                  <div className="flex items-center justify-center gap-3 pt-2">
                    <button
                      onClick={() => setSubTab('OPEN_BANKING')}
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/30 transition flex items-center gap-2"
                    >
                      <Zap className="h-4 w-4 text-amber-300" />
                      <span>Banka Hesabını Otomatik Bağla</span>
                    </button>
                    <button
                      onClick={() => {
                        setEditingAccountId(null);
                        resetAccountForm();
                        setIsAccountModalOpen(true);
                      }}
                      className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl text-xs font-semibold transition"
                    >
                      <span>Manuel Ekle</span>
                    </button>
                  </div>
                </div>
              )}

              {/* ========================================================= */}
              {/* BÖLÜM 1: KREDİ KARTLARI */}
              {/* ========================================================= */}
              {(accountFilter === 'ALL' || accountFilter === 'CREDIT_CARD') && creditCards.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-rose-500/20">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-rose-500/15 text-rose-400 border border-rose-500/30">
                        <CreditCard className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-base font-extrabold text-white">Kredi Kartları & Borç Takibi</h2>
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30">
                            BORÇ / LİMİT MODELİ
                          </span>
                        </div>
                        <p className="text-xs text-slate-400">Limit doluluk oranı, hesap kesim günü ve son ödeme vadeleri</p>
                      </div>
                    </div>

                    <div className="text-right hidden sm:block">
                      <span className="text-xs text-slate-400 block">Toplam Kart Borcu</span>
                      <span className="text-base font-bold text-rose-400">{formatTL(totalCardDebt)}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {creditCards.map((card) => {
                      const debt = card.currentDebt || Math.abs(card.balance);
                      const limit = card.creditLimit || 50000;
                      const available = card.calculatedAvailableLimit || Math.max(0, limit - debt);
                      const percent = card.utilizationPercent || 0;

                      return (
                        <div 
                          key={card.id}
                          className="rounded-3xl p-6 relative overflow-hidden flex flex-col justify-between shadow-2xl border-2 border-slate-700/60 transition-all hover:scale-[1.02] group"
                          style={{
                            background: `linear-gradient(145deg, ${card.color || '#1e3a8a'} 0%, #090d16 100%)`,
                          }}
                        >
                          <div>
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-black uppercase tracking-widest text-slate-100">
                                  {card.bankName || 'Banka'}
                                </span>
                                {card.bankConnectionId ? (
                                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold tracking-wider flex items-center gap-1">
                                    <span className="h-1 w-1 rounded-full bg-emerald-400 animate-pulse"></span>
                                    <span>CANLI API</span>
                                  </span>
                                ) : (
                                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/10 text-white/90 font-bold tracking-wider">
                                    KREDİ KARTI
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-1.5 opacity-90 group-hover:opacity-100 transition">
                                <button 
                                  onClick={() => openEditAccountModal(card)}
                                  className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/15 transition"
                                  title="Kartı Düzenle"
                                >
                                  <Edit2 className="h-3.5 w-3.5" />
                                </button>
                                <button 
                                  onClick={() => handleDeleteAccount(card.id, card.name)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-white/15 transition"
                                  title="Kartı Sil"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>

                            <div className="flex items-center gap-3 mb-5">
                              <div className="w-11 h-8 rounded-lg bg-gradient-to-tr from-amber-400 via-amber-300 to-amber-200 border border-amber-500/50 flex items-center justify-center shadow-md">
                                <div className="w-7 h-5 border border-amber-700/40 rounded-sm"></div>
                              </div>
                              <span className="text-white/50 font-mono text-[10px] tracking-widest font-semibold">
                                ))) TEMASSIZ
                              </span>
                            </div>

                            <div className="text-xl font-mono font-bold text-white tracking-widest mb-1 shadow-sm">
                              {card.accountNumberMasked || '•••• •••• •••• 4590'}
                            </div>
                            <div className="text-xs text-slate-300 font-semibold mb-4">
                              {card.name}
                            </div>
                          </div>

                          <div className="space-y-3 pt-3 border-t border-white/15">
                            <div className="flex items-center justify-between">
                              <div>
                                <span className="text-[10px] uppercase font-bold text-slate-300 block">Güncel Borç</span>
                                <span className="text-xl font-black text-rose-400 tracking-tight">{formatTL(debt)}</span>
                              </div>
                              <div className="text-right">
                                <span className="text-[10px] uppercase font-bold text-slate-300 block">Kullanılabilir Limit</span>
                                <span className="text-sm font-extrabold text-emerald-300">{formatTL(available)}</span>
                              </div>
                            </div>

                            <div>
                              <div className="flex items-center justify-between text-[10px] text-slate-300 mb-1">
                                <span>Kart Limiti: {formatTL(limit)}</span>
                                <span className="font-extrabold text-white">%{percent} Dolu</span>
                              </div>
                              <div className="w-full h-2.5 bg-black/50 rounded-full overflow-hidden p-0.5 border border-white/10">
                                <div 
                                  className={`h-full rounded-full transition-all duration-500 ${
                                    percent > 75 ? 'bg-rose-500' : percent > 40 ? 'bg-amber-400' : 'bg-emerald-400'
                                  }`}
                                  style={{ width: `${Math.min(percent, 100)}%` }}
                                ></div>
                              </div>
                            </div>

                            <div className="flex items-center justify-between text-[11px] text-slate-200 pt-2 border-t border-white/10">
                              <div className="flex items-center gap-1.5">
                                <Clock className="h-3.5 w-3.5 text-amber-300" />
                                <span>Kesim: <strong>{card.statementDay || 15}</strong>'i</span>
                              </div>
                              <div className="flex items-center gap-1.5 text-rose-300 font-semibold">
                                <CalendarClock className="h-3.5 w-3.5" />
                                <span>Son Ödeme: <strong>{card.dueDay || 25}</strong>'i</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ========================================================= */}
              {/* BÖLÜM 2: BANKA HESAPLARI & MEVDUATLAR */}
              {/* ========================================================= */}
              {(accountFilter === 'ALL' || accountFilter === 'BANK') && depositAccounts.length > 0 && (
                <div className="space-y-4 pt-2">
                  <div className="flex items-center justify-between pb-2 border-b border-emerald-500/20">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                        <Landmark className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-base font-extrabold text-white">Banka & Mevduat Hesapları</h2>
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                            POZİTİF MEVDUAT
                          </span>
                        </div>
                        <p className="text-xs text-slate-400">Vadesiz TL, döviz ve vadeli birikim hesapları</p>
                      </div>
                    </div>

                    <div className="text-right hidden sm:block">
                      <span className="text-xs text-slate-400 block">Toplam Mevduat</span>
                      <span className="text-base font-bold text-emerald-400">{formatTL(totalDepositBalance)}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {depositAccounts.map((acc) => (
                      <div 
                        key={acc.id}
                        className="p-5 rounded-2xl bg-slate-900 border-2 border-slate-800/80 hover:border-emerald-500/40 transition-all flex flex-col justify-between space-y-4 group shadow-lg"
                      >
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2.5">
                              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                <Building2 className="h-5 w-5" />
                              </div>
                              <div>
                                <span className="text-sm font-bold text-white block">{acc.bankName || acc.name}</span>
                                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                                  {acc.type === 'INVESTMENT' ? 'Vadeli Birikim / Portföy' : 'Vadesiz Mevduat'}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-1">
                              <button 
                                onClick={() => openEditAccountModal(acc)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                                title="Düzenle"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>
                              <button 
                                onClick={() => handleDeleteAccount(acc.id, acc.name)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
                                title="Sil"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>

                          <div className="text-xs text-slate-300 font-medium mb-1">{acc.name}</div>
                          <div className="text-2xl font-black text-white tracking-tight flex items-baseline gap-2">
                            <span>{formatTL(acc.balance)}</span>
                            <span className="text-xs font-semibold text-emerald-400">Aktif Bakiye</span>
                          </div>
                        </div>

                        <div className="pt-3 border-t border-slate-800/80 space-y-2">
                          {acc.iban ? (
                            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60 text-xs">
                              <span className="font-mono text-slate-200 text-[11px] truncate mr-2 font-medium">{acc.iban}</span>
                              <button 
                                onClick={() => handleCopyIban(acc.iban)}
                                className="text-indigo-400 hover:text-indigo-300 shrink-0 p-1 rounded-md hover:bg-slate-700 transition"
                                title="IBAN Kopyala"
                              >
                                {copiedIban === acc.iban ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                              </button>
                            </div>
                          ) : (
                            <div className="text-xs text-slate-500">Hesap No: {acc.accountNumberMasked || 'Manuel'}</div>
                          )}

                          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                            <span className="flex items-center gap-1.5">
                              <span className={`h-1.5 w-1.5 rounded-full ${acc.bankConnectionId ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`}></span>
                              <span>{acc.bankConnectionId ? 'Açık Bankacılık (Canlı)' : 'Manuel Giriş'}</span>
                            </span>
                            <span>{acc.lastSyncedAt ? `Sync: ${new Date(acc.lastSyncedAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}` : 'Yerel'}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ========================================================= */}
              {/* BÖLÜM 3: NAKİT CÜZDAN & KASA */}
              {/* ========================================================= */}
              {(accountFilter === 'ALL' || accountFilter === 'CASH') && cashAccounts.length > 0 && (
                <div className="space-y-4 pt-2">
                  <div className="flex items-center justify-between pb-2 border-b border-amber-500/20">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
                        <Banknote className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-base font-extrabold text-white">Nakit Cüzdan & Kasa</h2>
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                            FİZİKSEL LİKİDİTE
                          </span>
                        </div>
                        <p className="text-xs text-slate-400">Cüzdandaki nakit para ve acil durum birikimi</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {cashAccounts.map((cash) => (
                      <div 
                        key={cash.id}
                        className="p-5 rounded-2xl bg-slate-900 border-2 border-slate-800/80 hover:border-amber-500/40 transition-all flex flex-col justify-between space-y-4 shadow-lg"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400">
                              <Wallet className="h-5 w-5" />
                            </div>
                            <div>
                              <span className="text-sm font-bold text-white block">{cash.name}</span>
                              <span className="text-[10px] text-slate-400 font-medium">Fiziksel Nakit</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1">
                            <button 
                              onClick={() => openEditAccountModal(cash)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button 
                              onClick={() => handleDeleteAccount(cash.id, cash.name)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>

                        <div className="text-2xl font-black text-amber-300 tracking-tight">
                          {formatTL(cash.balance)}
                        </div>

                        <div className="pt-2 text-[11px] text-slate-500 border-t border-slate-800">
                          Manuel Yönetim • Günlük Harcamalar
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}

          {/* ========================================================================= */}
          {/* 2. HESAP HAREKETLERİ */}
          {/* ========================================================================= */}
          {subTab === 'TRANSACTIONS' && (
            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-white">Hesap Hareketleri & Geçmiş</h2>
                  <p className="text-xs text-slate-400">Tüm harcama, gelir ve taksit kayıtları</p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="h-3.5 w-3.5 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Hareketlerde ara..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-8 pr-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <select
                    value={selectedTypeFilter}
                    onChange={(e) => setSelectedTypeFilter(e.target.value)}
                    className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
                  >
                    <option value="ALL">Tümü</option>
                    <option value="EXPENSE">Giderler</option>
                    <option value="INCOME">Gelirler</option>
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                      <th className="pb-3">Açıklama</th>
                      <th className="pb-3">Kategori</th>
                      <th className="pb-3">Hesap</th>
                      <th className="pb-3">Tarih</th>
                      <th className="pb-3">Durum</th>
                      <th className="pb-3 text-right">Tutar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredTransactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-800/40 transition group">
                        <td className="py-3.5 font-medium text-slate-200 flex items-center gap-2">
                          <div className={`p-1.5 rounded-lg ${
                            tx.type === 'INCOME' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                          }`}>
                            {tx.type === 'INCOME' ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                          </div>
                          <div>
                            <div>{tx.description}</div>
                            {tx.externalTxId && (
                              <div className="text-[10px] text-slate-500 font-mono">Banka Dekont No: {tx.externalTxId}</div>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5">
                          <span 
                            className="px-2 py-0.5 rounded text-[11px] font-medium"
                            style={{ backgroundColor: `${tx.category?.color || '#6366f1'}15`, color: tx.category?.color || '#6366f1' }}
                          >
                            {tx.category?.name}
                          </span>
                        </td>
                        <td className="py-3.5 text-slate-400">{tx.account?.name}</td>
                        <td className="py-3.5 text-slate-400">
                          {new Date(tx.date).toLocaleDateString('tr-TR')}
                        </td>
                        <td className="py-3.5">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                            tx.status === 'COMPLETED' 
                              ? 'bg-emerald-500/10 text-emerald-400' 
                              : 'bg-amber-500/10 text-amber-400'
                          }`}>
                            {tx.status === 'COMPLETED' ? 'Tamamlandı' : 'Bekleyen Vade'}
                          </span>
                        </td>
                        <td className={`py-3.5 text-right font-bold ${
                          tx.type === 'INCOME' ? 'text-emerald-400' : 'text-slate-200'
                        }`}>
                          {tx.type === 'INCOME' ? '+' : '-'}{formatTL(tx.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 3. TAKSİTLENDİRME MOTORU */}
          {/* ========================================================================= */}
          {subTab === 'INSTALLMENTS' && (
            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-white">Aktif Taksitlendirme Planları</h2>
                  <p className="text-xs text-slate-400">
                    Aylara bölünen vadeler, amortisman planı ve takvimle otomatik eşitlenen kalan taksitler
                  </p>
                </div>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold"
                >
                  + Yeni Taksit Ekle
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {installments.map((plan) => {
                  const paidInstallments = plan.totalInstallments - plan.remainingInstallments;
                  const progress = Math.round((paidInstallments / plan.totalInstallments) * 100);
                  return (
                    <div key={plan.id} className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/60 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="text-sm font-bold text-white">{plan.title}</div>
                          <div className="text-xs text-slate-400 mt-0.5">
                            Hesap: {plan.account?.name} • Kategori: {plan.category?.name}
                          </div>
                        </div>
                        <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                          {plan.remainingInstallments} Taksit Kaldı
                        </span>
                      </div>

                      <div>
                        <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                          <span>İlerleme ({paidInstallments}/{plan.totalInstallments} Ödendi)</span>
                          <span>%{progress}</span>
                        </div>
                        <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 rounded-full transition-all duration-500"
                            style={{ width: `${progress}%` }}
                          ></div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-700/50 text-xs">
                        <div>
                          <span className="text-slate-500 text-[11px]">Aylık Taksit: </span>
                          <span className="font-bold text-slate-200">{formatTL(plan.installmentAmount)}</span>
                        </div>
                        <div className="flex items-center gap-1 text-slate-400">
                          <Clock className="h-3 w-3 text-indigo-400" />
                          <span>Sonraki Vade: {new Date(plan.nextDueDate).toLocaleDateString('tr-TR')}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 4. SABİT ABONELİKLER & FATURALAR */}
          {/* ========================================================================= */}
          {subTab === 'BILLS' && (
            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-white">Sabit Abonelikler & Düzenli Faturalar</h2>
                  <p className="text-xs text-slate-400">
                    Netflix, Spotify, ev kirası, elektrik ve aidat gibi aylık yinelenen ödemeler
                  </p>
                </div>
                <button
                  onClick={() => setIsBillModalOpen(true)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Yeni Fatura / Abonelik Ekle</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {bills.map((bill) => (
                  <div key={bill.id} className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-3 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="text-sm font-bold text-white">{bill.name}</h4>
                          <p className="text-xs text-slate-400 mt-0.5">{bill.category?.name} • {bill.account?.name}</p>
                        </div>
                        <button
                          onClick={() => handleToggleBill(bill.id)}
                          className={`text-[10px] px-2 py-0.5 rounded font-semibold transition ${
                            bill.isActive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-700 text-slate-400'
                          }`}
                        >
                          {bill.isActive ? 'Aktif' : 'Pasif'}
                        </button>
                      </div>

                      <div className="text-xl font-bold text-white mt-3">
                        {formatTL(bill.amount)} <span className="text-xs font-normal text-slate-400">/ ay</span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-700/60 flex items-center justify-between text-xs text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-amber-400" />
                        <span>Her ayın {bill.billingDay}. günü</span>
                      </div>
                      <button
                        onClick={() => handleDeleteBill(bill.id)}
                        className="text-slate-500 hover:text-rose-400 p-1"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 5. KATEGORİ BÜTÇE LİMİTLERİ */}
          {/* ========================================================================= */}
          {subTab === 'BUDGETS' && (
            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-white">Kategori Harcama Limitleri & Bütçeler</h2>
                  <p className="text-xs text-slate-400">
                    Harcama hedefleri belirleyin, bütçe aşıldığında sistem sizi uyarsın
                  </p>
                </div>
                <button
                  onClick={() => setIsBudgetModalOpen(true)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Bütçe Limiti Belirle</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {budgets.map((b) => (
                  <div key={b.id} className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-sm font-bold text-white">{b.category?.name}</h4>
                        <p className="text-xs text-slate-400 mt-0.5">Aylık Harcama Limiti</p>
                      </div>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                        b.isOverBudget ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-emerald-500/10 text-emerald-400'
                      }`}>
                        {b.isOverBudget ? 'Bütçe Aşıldı' : `%${b.percent} Kullanıldı`}
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center justify-between text-xs text-slate-300 mb-1.5">
                        <span>Harcama: {formatTL(b.spent)}</span>
                        <span>Hedef: {formatTL(b.amountLimit)}</span>
                      </div>
                      <div className="w-full h-2.5 bg-slate-700 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${
                            b.isOverBudget ? 'bg-rose-500' : b.percent > 80 ? 'bg-amber-500' : 'bg-emerald-400'
                          }`}
                          style={{ width: `${Math.min(b.percent, 100)}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1">
                      <span>{b.remaining > 0 ? `Kalan Limit: ${formatTL(b.remaining)}` : `Aşılan Tutar: ${formatTL(Math.abs(b.remaining))}`}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 6. 6 AYLIK NAKİT AKIŞI PROJEKSİYONU */}
          {/* ========================================================================= */}
          {subTab === 'PROJECTION' && (
            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 space-y-6">
              <div>
                <h2 className="text-lg font-bold text-white">Gelecek 6 Aylık Zorunlu Ödeme Yükü Projeksiyonu</h2>
                <p className="text-xs text-slate-400">
                  Taksit vadeleri ve sabit aboneliklerin önümüzdeki 6 ay boyunca yaratacağı zorunlu nakit çıkışı
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 pt-4 border-t border-slate-800">
                {projections.map((p, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/60 text-center space-y-2">
                    <div className="text-xs font-semibold text-indigo-400 capitalize">{p.month}</div>
                    <div className="text-lg font-bold text-white">{formatTL(p.totalObligation)}</div>
                    
                    <div className="pt-2 border-t border-slate-700/40 text-[11px] space-y-1 text-left">
                      <div className="flex items-center justify-between text-amber-400">
                        <span>Taksitler:</span>
                        <span>{formatTL(p.installmentLoad)}</span>
                      </div>
                      <div className="flex items-center justify-between text-sky-400">
                        <span>Faturalar:</span>
                        <span>{formatTL(p.billsTotal)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODALLAR */}
      {/* ========================================================================= */}

      {/* BKM AÇIK BANKACILIK RIZA VE YETKİLENDİRME MODALI */}
      {isConsentModalOpen && selectedBankToConnect && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-indigo-500/40 rounded-3xl w-full max-w-lg p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center font-bold text-indigo-400">
                  <Lock className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">BKM Açık Bankacılık Rıza Onayı</h3>
                  <p className="text-[11px] text-slate-400">T.C. Merkez Bankası & BKM GEÇİT Sistemi</p>
                </div>
              </div>
              <button onClick={() => setIsConsentModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            {/* Banka ve İzin Açıklaması */}
            <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-black text-white text-sm">
                  {selectedBankToConnect.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">{selectedBankToConnect.name}</h4>
                  <span className="text-[11px] text-emerald-400 font-medium">Doğrulanmış Banka API Entegrasyonu</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-700/50 text-xs text-slate-300 space-y-2">
                <div className="font-semibold text-white">Erişilecek Bilgiler (HBH Kapsamı):</div>
                <ul className="space-y-1 text-[11px] text-slate-300">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                    <span>Vadesiz TL/Döviz hesap bakiyeleri ve IBAN numaraları</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                    <span>Kredi kartı dönem borçları, toplam limitler ve ekstre tarihleri</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                    <span>Son 90 günlük hesap hareketleri ve harcama dekontları</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Güvenlik Notu */}
            <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-[11px] text-indigo-300 flex items-start gap-2">
              <ShieldCheck className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5" />
              <span>
                Yetkilendirme <strong>180 gün</strong> boyunca geçerlidir. İstediğiniz zaman tek tıkla rızanızı iptal edebilir ve veri akışını durdurabilirsiniz. Şifreniz asla kaydedilmez.
              </span>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsConsentModalOpen(false)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-700"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={handleAuthorizeAndConnect}
                disabled={isConnecting}
                className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/30 transition disabled:opacity-50"
              >
                {isConnecting ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    <span>Yetkilendiriliyor & Veriler Çekiliyor...</span>
                  </>
                ) : (
                  <>
                    <Zap className="h-3.5 w-3.5 text-amber-300" />
                    <span>Yetkilendir ve Otomatik Bağla</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: HESAP VEYA KREDİ KARTI TANIMLAMA / DÜZENLEME (MANUEL) */}
      {isAccountModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-lg font-bold text-white">
                  {editingAccountId ? 'Hesap / Kartı Düzenle' : 'Manuel Banka Hesabı veya Kredi Kartı Ekle'}
                </h3>
                <p className="text-xs text-slate-400">Otomatik bağlanamayan yerel veya özel hesaplar için</p>
              </div>
              <button onClick={() => setIsAccountModalOpen(false)} className="text-slate-400 hover:text-white text-sm">✕</button>
            </div>

            <form onSubmit={handleSaveAccount} className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-800/80 p-1.5 rounded-xl">
                <button
                  type="button"
                  onClick={() => setNewAccType('CREDIT_CARD')}
                  className={`py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                    newAccType === 'CREDIT_CARD' ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <CreditCard className="h-3.5 w-3.5" />
                  <span>Kredi Kartı</span>
                </button>
                <button
                  type="button"
                  onClick={() => setNewAccType('BANK')}
                  className={`py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                    newAccType === 'BANK' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Landmark className="h-3.5 w-3.5" />
                  <span>Banka Vadesiz</span>
                </button>
                <button
                  type="button"
                  onClick={() => setNewAccType('INVESTMENT')}
                  className={`py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                    newAccType === 'INVESTMENT' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <TrendingUp className="h-3.5 w-3.5" />
                  <span>Yatırım/Vadeli</span>
                </button>
                <button
                  type="button"
                  onClick={() => setNewAccType('CASH')}
                  className={`py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                    newAccType === 'CASH' ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Banknote className="h-3.5 w-3.5" />
                  <span>Nakit</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {newAccType !== 'CASH' && (
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Banka Adı</label>
                    <select
                      value={newAccBank}
                      onChange={(e) => setNewAccBank(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white"
                    >
                      {bankOptions.map((b) => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div className={newAccType === 'CASH' ? 'col-span-2' : ''}>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Hesap / Kart Etiketi</label>
                  <input
                    type="text"
                    required
                    placeholder={newAccType === 'CREDIT_CARD' ? 'Örn: Maximum Platinum Kart' : 'Örn: Şirket Maaş Hesabım'}
                    value={newAccName}
                    onChange={(e) => setNewAccName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white"
                  />
                </div>
              </div>

              {newAccType === 'CREDIT_CARD' ? (
                <div className="space-y-3 p-3.5 bg-slate-800/50 rounded-xl border border-rose-500/20">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-300 mb-1">Toplam Kart Limiti (TL)</label>
                      <input
                        type="number"
                        step="100"
                        required
                        placeholder="100000"
                        value={newAccLimit}
                        onChange={(e) => setNewAccLimit(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-300 mb-1">Güncel Dönem Borcu (TL)</label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="15000"
                        value={newAccBalance}
                        onChange={(e) => setNewAccBalance(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-300 mb-1">Hesap Kesim Günü</label>
                      <input
                        type="number"
                        min="1"
                        max="31"
                        required
                        value={newAccStatementDay}
                        onChange={(e) => setNewAccStatementDay(Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-300 mb-1">Son Ödeme Günü</label>
                      <input
                        type="number"
                        min="1"
                        max="31"
                        required
                        value={newAccDueDay}
                        onChange={(e) => setNewAccDueDay(Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-300 mb-1">Kart No (Son 4)</label>
                      <input
                        type="text"
                        maxLength={4}
                        placeholder="4590"
                        value={newAccCardNo}
                        onChange={(e) => setNewAccCardNo(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-300 mb-1">Kartvizit Rengi</label>
                    <div className="flex items-center gap-2">
                      {[
                        { name: 'Lacivert', hex: '#1e3a8a' },
                        { name: 'Zümrüt', hex: '#047857' },
                        { name: 'Bordo', hex: '#881337' },
                        { name: 'Titanyum', hex: '#1e293b' },
                        { name: 'Altın', hex: '#b45309' },
                      ].map((col) => (
                        <button
                          key={col.hex}
                          type="button"
                          onClick={() => setNewAccColor(col.hex)}
                          className={`h-7 w-7 rounded-full border-2 transition ${
                            newAccColor === col.hex ? 'border-white scale-110 shadow-lg' : 'border-transparent'
                          }`}
                          style={{ backgroundColor: col.hex }}
                          title={col.name}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 p-3.5 bg-slate-800/50 rounded-xl border border-emerald-500/20">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-300 mb-1">Mevcut Bakiye (TL)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder="75000.00"
                      value={newAccBalance}
                      onChange={(e) => setNewAccBalance(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white"
                    />
                  </div>

                  {newAccType !== 'CASH' && (
                    <div>
                      <label className="block text-[11px] font-medium text-slate-300 mb-1">IBAN Numarası</label>
                      <input
                        type="text"
                        placeholder="TR00 0000 0000 0000 0000 0000 00"
                        value={newAccIban}
                        onChange={(e) => setNewAccIban(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs font-mono text-white"
                      />
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAccountModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-xs font-semibold hover:bg-slate-700"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-lg shadow-emerald-600/30"
                >
                  {editingAccountId ? 'Güncellemeleri Kaydet' : 'Hesabı Tanımla'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: YENİ İŞLEM / TAKSİT GİRİŞİ */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white">Yeni Gelir / Harcama / Taksit Girişi</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white text-sm">✕</button>
            </div>

            {txFormError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs rounded-lg">
                {txFormError}
              </div>
            )}

            <form onSubmit={handleCreateTransaction} className="space-y-4">
              <div className="grid grid-cols-2 gap-2 bg-slate-800/80 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setTxType('EXPENSE')}
                  className={`py-2 rounded-lg text-xs font-semibold transition ${
                    txType === 'EXPENSE' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Gider (Harcama)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTxType('INCOME');
                    setTxIsInstallment(false);
                  }}
                  className={`py-2 rounded-lg text-xs font-semibold transition ${
                    txType === 'INCOME' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Gelir
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Tutar (TL)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={txAmount}
                    onChange={(e) => setTxAmount(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Açıklama</label>
                  <input
                    type="text"
                    required
                    placeholder="Örn: Telefon / Laptop Alımı"
                    value={txDescription}
                    onChange={(e) => setTxDescription(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Hesap / Kart Seçimi</label>
                  <select
                    value={txAccountId}
                    onChange={(e) => setTxAccountId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white"
                  >
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>{a.name} ({formatTL(a.balance)})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Kategori</label>
                  <select
                    value={txCategoryId}
                    onChange={(e) => setTxCategoryId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {txType === 'EXPENSE' && (
                <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-3">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={txIsInstallment}
                      onChange={(e) => setTxIsInstallment(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-700 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-xs font-semibold text-slate-200">
                      Bu harcamayı taksitlendir (Aylara böl & Takvime işle)
                    </span>
                  </label>

                  {txIsInstallment && (
                    <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-700/40">
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">Taksit Sayısı (Ay)</label>
                        <select
                          value={txTotalInstallments}
                          onChange={(e) => setTxTotalInstallments(Number(e.target.value))}
                          className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white"
                        >
                          <option value="2">2 Taksit</option>
                          <option value="3">3 Taksit</option>
                          <option value="4">4 Taksit</option>
                          <option value="6">6 Taksit</option>
                          <option value="9">9 Taksit</option>
                          <option value="12">12 Taksit</option>
                          <option value="24">24 Taksit</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">Her Ayın Günü (Vade)</label>
                        <input
                          type="number"
                          min="1"
                          max="31"
                          value={txDueDayOfMonth}
                          onChange={(e) => setTxDueDayOfMonth(Number(e.target.value))}
                          className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-xs font-semibold hover:bg-slate-700"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-lg shadow-indigo-600/30"
                >
                  Kaydet ve İşle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: SABİT FATURA EKLE */}
      {isBillModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Yeni Sabit Fatura / Abonelik</h3>
              <button onClick={() => setIsBillModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateBill} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Abonelik / Fatura Adı</label>
                <input
                  type="text"
                  required
                  placeholder="Örn: Netflix Premium / Ev Kirası"
                  value={billName}
                  onChange={(e) => setBillName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Aylık Tutar (TL)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="299.90"
                    value={billAmount}
                    onChange={(e) => setBillAmount(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Ayın Kaçıncı Günü?</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    required
                    value={billDay}
                    onChange={(e) => setBillDay(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Ödeme Hesabı / Kartı</label>
                  <select
                    value={txAccountId}
                    onChange={(e) => setTxAccountId(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white"
                  >
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Kategori</label>
                  <select
                    value={txCategoryId}
                    onChange={(e) => setTxCategoryId(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsBillModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-xs font-semibold hover:bg-slate-700"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-lg shadow-indigo-600/30"
                >
                  Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: BÜTÇE LİMİTİ BELİRLE */}
      {isBudgetModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Kategori Harcama Limiti Belirle</h3>
              <button onClick={() => setIsBudgetModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSetBudget} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Kategori</label>
                <select
                  value={budgetCatId}
                  onChange={(e) => setBudgetCatId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white"
                >
                  {categories.filter(c => c.type === 'EXPENSE').map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Aylık Harcama Limiti (TL)</label>
                <input
                  type="number"
                  step="100"
                  required
                  placeholder="10000"
                  value={budgetLimit}
                  onChange={(e) => setBudgetLimit(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsBudgetModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-xs font-semibold hover:bg-slate-700"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-lg shadow-indigo-600/30"
                >
                  Bütçeyi Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: OTOMATİK KEŞFEDİLEN PORTFÖY BAŞARI EKRANI */}
      {isDiscoverySuccessModalOpen && discoveryResult && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-emerald-500/50 rounded-3xl w-full max-w-xl p-6 shadow-2xl space-y-5">
            {/* Modal Üst Başlık */}
            <div className="text-center space-y-2">
              <div className="inline-flex p-3 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-lg shadow-emerald-500/20 mb-1">
                <CheckCircle2 className="h-8 w-8 text-emerald-400" />
              </div>
              <h3 className="text-xl font-black text-white tracking-tight">
                {discoveryResult.connection?.bankName} Varlıkları Otomatik Aktarıldı!
              </h3>
              <p className="text-xs text-slate-300 max-w-md mx-auto">
                Banka sisteminiz taranarak adınıza kayıtlı tüm hesaplar, kredi kartları ve birikim portföyü sisteme otomatik olarak kopyalandı.
              </p>
            </div>

            {/* Keşfedilen Özet Göstergeler */}
            <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-800/80 border border-slate-700/60 text-center">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Aktarılan Ürün</span>
                <span className="text-lg font-black text-white">{discoveryResult.totalDiscovered} Adet</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Mevduat & Yatırım</span>
                <span className="text-lg font-black text-emerald-400">{formatTL(discoveryResult.totalAssetsDiscovered)}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Tanımlı Kart Limiti</span>
                <span className="text-lg font-black text-indigo-300">{formatTL(discoveryResult.totalCreditLimitDiscovered)}</span>
              </div>
            </div>

            {/* Keşfedilen Ürünlerin Listesi */}
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
                İçeri Aktarılan Kart ve Hesaplar:
              </div>
              {discoveryResult.discoveredProducts?.map((p: any, idx: number) => {
                const isCard = p.type === 'CREDIT_CARD';
                return (
                  <div key={idx} className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/60 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${isCard ? 'bg-rose-500/10 text-rose-400' : p.type === 'INVESTMENT' ? 'bg-amber-500/10 text-amber-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                        {isCard ? <CreditCard className="h-4 w-4" /> : p.type === 'INVESTMENT' ? <TrendingUp className="h-4 w-4" /> : <Landmark className="h-4 w-4" />}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">{p.name}</div>
                        <div className="text-[10px] text-slate-400">
                          {isCard ? `${p.accountNumberMasked} • Kart Limiti: ${formatTL(p.creditLimit)}` : p.iban || p.accountNumberMasked || 'Vadesiz Hesap'}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className={`text-xs font-extrabold ${isCard ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {formatTL(isCard ? Math.abs(p.balance) : p.balance)}
                      </div>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold">
                        ✓ BAĞLANDI
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Aksiyon Butonu */}
            <div className="pt-2">
              <button
                onClick={() => {
                  setIsDiscoverySuccessModalOpen(false);
                  setSubTab('ACCOUNTS_AND_CARDS');
                }}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/30 transition flex items-center justify-center gap-2"
              >
                <span>Yeni Varlıklarımı ve Kartlarımı İncele</span>
                <ArrowDownRight className="h-4 w-4 rotate-[-45deg]" />
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
