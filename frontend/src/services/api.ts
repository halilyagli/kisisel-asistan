/**
 * Merkezi API İstemcisi
 */

const envApi = (import.meta as any).env?.VITE_API_URL;
const API_BASE = envApi ? (envApi.endsWith('/api') ? envApi : `${envApi}/api`) : '/api';

export class ApiClient {
  private static getToken(): string | null {
    return localStorage.getItem('asistan_token');
  }

  public static setToken(token: string): void {
    localStorage.setItem('asistan_token', token);
  }

  public static clearToken(): void {
    localStorage.removeItem('asistan_token');
  }

  public static async request<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || data.error || 'İşlem sırasında bir hata oluştu');
    }

    return data.data;
  }

  // Auth
  static auth = {
    register: (body: any) => ApiClient.request('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
    login: (body: any) => ApiClient.request('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
    logout: () => ApiClient.request('/auth/logout', { method: 'POST' }),
    me: () => ApiClient.request('/auth/me'),
    changeTier: (tier: string) => ApiClient.request('/auth/subscription', { method: 'POST', body: JSON.stringify({ tier }) }),
  };

  // Finance
  static finance = {
    getSummary: () => ApiClient.request('/finance/summary'),
    getAccounts: () => ApiClient.request('/finance/accounts'),
    createAccount: (body: any) => ApiClient.request('/finance/accounts', { method: 'POST', body: JSON.stringify(body) }),
    updateAccount: (id: string, body: any) => ApiClient.request(`/finance/accounts/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    deleteAccount: (id: string) => ApiClient.request(`/finance/accounts/${id}`, { method: 'DELETE' }),
    syncBank: () => ApiClient.request('/finance/accounts/sync-bank', { method: 'POST' }),
    // Açık Bankacılık (Open Banking)
    getSupportedBanks: () => ApiClient.request('/finance/open-banking/banks'),
    getBankConnections: () => ApiClient.request('/finance/open-banking/connections'),
    connectBank: (bankCode: string) => ApiClient.request('/finance/open-banking/connect', { method: 'POST', body: JSON.stringify({ bankCode }) }),
    syncBankConnection: (id: string) => ApiClient.request(`/finance/open-banking/sync/${id}`, { method: 'POST' }),
    syncAllBankConnections: () => ApiClient.request('/finance/open-banking/sync-all', { method: 'POST' }),
    toggleBankAutoSync: (id: string, autoSyncEnabled: boolean) => ApiClient.request(`/finance/open-banking/toggle-auto-sync/${id}`, { method: 'PUT', body: JSON.stringify({ autoSyncEnabled }) }),
    disconnectBank: (id: string) => ApiClient.request(`/finance/open-banking/connections/${id}`, { method: 'DELETE' }),
    getCategories: () => ApiClient.request('/finance/categories'),
    createCategory: (body: any) => ApiClient.request('/finance/categories', { method: 'POST', body: JSON.stringify(body) }),
    getTransactions: (params?: any) => {
      const q = new URLSearchParams(params || {}).toString();
      return ApiClient.request(`/finance/transactions${q ? `?${q}` : ''}`);
    },
    createTransaction: (body: any) => ApiClient.request('/finance/transactions', { method: 'POST', body: JSON.stringify(body) }),
    getInstallments: () => ApiClient.request('/finance/installments'),
    
    // Recurring Bills (Abonelikler & Sabit Faturalar)
    getRecurringBills: () => ApiClient.request('/finance/recurring-bills'),
    createRecurringBill: (body: any) => ApiClient.request('/finance/recurring-bills', { method: 'POST', body: JSON.stringify(body) }),
    toggleRecurringBill: (id: string) => ApiClient.request(`/finance/recurring-bills/${id}/toggle`, { method: 'PATCH' }),
    deleteRecurringBill: (id: string) => ApiClient.request(`/finance/recurring-bills/${id}`, { method: 'DELETE' }),

    // Budgets (Kategori Bütçeleri)
    getBudgets: () => ApiClient.request('/finance/budgets'),
    setBudget: (body: any) => ApiClient.request('/finance/budgets', { method: 'POST', body: JSON.stringify(body) }),

    // Projeksiyon & Analitik
    getProjection: () => ApiClient.request('/finance/projection'),

    // CSV İndirme
    downloadCsv: async () => {
      const token = ApiClient.getToken();
      const res = await fetch(`${API_BASE}/finance/transactions/export-csv`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `hesap-hareketleri-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    },
  };

  // Calendar
  static calendar = {
    getEvents: (params?: any) => {
      const q = new URLSearchParams(params || {}).toString();
      return ApiClient.request(`/calendar/events${q ? `?${q}` : ''}`);
    },
    createEvent: (body: any) => ApiClient.request('/calendar/events', { method: 'POST', body: JSON.stringify(body) }),
    deleteEvent: (id: string) => ApiClient.request(`/calendar/events/${id}`, { method: 'DELETE' }),
  };

  // Notes
  static notes = {
    getNotes: (params?: any) => {
      const q = new URLSearchParams(params || {}).toString();
      return ApiClient.request(`/notes${q ? `?${q}` : ''}`);
    },
    getTags: () => ApiClient.request('/notes/tags'),
    createNote: (body: any) => ApiClient.request('/notes', { method: 'POST', body: JSON.stringify(body) }),
    updateNote: (id: string, body: any) => ApiClient.request(`/notes/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    deleteNote: (id: string) => ApiClient.request(`/notes/${id}`, { method: 'DELETE' }),
  };

  // Admin & Müşteri Hizmetleri Destek Masası (KVKK Uyumlu)
  static admin = {
    getSubscribers: () => ApiClient.request('/admin/subscribers'),
    getSubscriberDiagnostics: (id: string) => ApiClient.request(`/admin/subscribers/${id}/diagnostics`),
    reSyncUserConnection: (id: string, connectionId: string) =>
      ApiClient.request(`/admin/subscribers/${id}/sync/${connectionId}`, { method: 'POST' }),
    updateUserTier: (id: string, tier: string) =>
      ApiClient.request(`/admin/subscribers/${id}/tier`, { method: 'PUT', body: JSON.stringify({ tier }) }),
    toggleUserSuspension: (id: string, isSuspended: boolean, reason?: string) =>
      ApiClient.request(`/admin/subscribers/${id}/suspension`, { method: 'PUT', body: JSON.stringify({ isSuspended, reason }) }),
    getAuditLogs: () => ApiClient.request('/admin/audit-logs'),
  };
}
