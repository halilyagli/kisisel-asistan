/**
 * Banka Entegrasyonu Soyutlama Katmanı (Adapter Pattern Interface)
 * 
 * Bu arayüz sayesinde sistem belirli bir bankanın API formatına bağımlı kalmaz.
 * İleride gerçek Open Banking (Açık Bankacılık BKM / APIPortal vb.) entegrasyonu
 * eklendiğinde tek yapılması gereken bu arayüzü uygulayan (implement eden)
 * yeni bir adaptör sınıfı yazmaktır.
 */

export interface SyncedAccount {
  accountName: string;
  bankName: string;
  type: 'BANK' | 'CREDIT_CARD';
  balance: number;
  currency: string;
  accountNumberMasked: string;
}

export interface SyncedTransaction {
  date: Date;
  amount: number;
  type: 'EXPENSE' | 'INCOME';
  description: string;
  categoryNameGuess: string;
}

export interface IBankAdapter {
  readonly providerId: string;
  readonly providerName: string;

  /**
   * Kullanıcının bankadaki hesaplarını çeker / senkronize eder
   */
  fetchAccounts(userId: string): Promise<SyncedAccount[]>;

  /**
   * Belirtilen hesabın son hesap hareketlerini çeker
   */
  fetchTransactions(userId: string, accountNumberMasked: string): Promise<SyncedTransaction[]>;
}
