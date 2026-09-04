import { IBankAdapter, SyncedAccount, SyncedTransaction } from './bank-adapter.interface';

/**
 * Türk Bankaları Simülatör Adaptörü (Mock Open Banking Adapter)
 * 
 * Garanti BBVA, İş Bankası ve Akbank gibi kurumların API çıktılarını simüle eder.
 * Demo, test ve geliştirme aşamasında sistemin gerçek bir açık bankacılık
 * entegrasyonu varmış gibi canlı çalışmasını sağlar.
 */
export class MockTurkishBanksAdapter implements IBankAdapter {
  public readonly providerId = 'MOCK_TURKISH_BANKS';
  public readonly providerName = 'Türkiye Açık Bankacılık Simülatörü';

  public async fetchAccounts(userId: string): Promise<SyncedAccount[]> {
    // Simüle edilen gecikme (network latency)
    await new Promise(resolve => setTimeout(resolve, 600));

    return [
      {
        accountName: 'Garanti BBVA - Vadesiz TL',
        bankName: 'Garanti BBVA',
        type: 'BANK',
        balance: 48550.75,
        currency: 'TRY',
        accountNumberMasked: 'TR88 **** **** **** 4590',
      },
      {
        accountName: 'İş Bankası - Maximum Kart',
        bankName: 'Türkiye İş Bankası',
        type: 'CREDIT_CARD',
        balance: -14200.50, // Kredi kartı güncel borç
        currency: 'TRY',
        accountNumberMasked: '4543 **** **** 9012',
      },
      {
        accountName: 'Akbank - Vadeli Birikim',
        bankName: 'Akbank',
        type: 'BANK',
        balance: 125000.00,
        currency: 'TRY',
        accountNumberMasked: 'TR12 **** **** **** 8821',
      },
    ];
  }

  public async fetchTransactions(userId: string, accountNumberMasked: string): Promise<SyncedTransaction[]> {
    await new Promise(resolve => setTimeout(resolve, 400));

    const today = new Date();
    const daysAgo = (days: number) => new Date(today.getTime() - days * 24 * 60 * 60 * 1000);

    return [
      {
        date: daysAgo(1),
        amount: 285.50,
        type: 'EXPENSE',
        description: 'MİGROS TİCARET A.Ş. İSTANBUL',
        categoryNameGuess: 'Market & Gıda',
      },
      {
        date: daysAgo(2),
        amount: 145.00,
        type: 'EXPENSE',
        description: 'STARBUCKS COFFEE KADIKÖY',
        categoryNameGuess: 'Eğlence & Sosyal',
      },
      {
        date: daysAgo(3),
        amount: 320.00,
        type: 'EXPENSE',
        description: 'TURKCELL İLETİŞİM HİZMETLERİ FATURA',
        categoryNameGuess: 'Faturalar',
      },
      {
        date: daysAgo(5),
        amount: 85000.00,
        type: 'INCOME',
        description: 'XYZ TEKNOLOJİ A.Ş. MAAŞ ÖDEMESİ',
        categoryNameGuess: 'Maaş / Gelir',
      },
      {
        date: daysAgo(6),
        amount: 229.90,
        type: 'EXPENSE',
        description: 'NETFLIX AYLIK ABONELİK',
        categoryNameGuess: 'Abonelikler',
      }
    ];
  }
}

export const mockTurkishBanksAdapter = new MockTurkishBanksAdapter();
