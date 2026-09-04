import { prisma } from '../database/prisma';
import { openBankingService } from '../../modules/finance/open-banking/open-banking.service';

/**
 * Otomatik Açık Bankacılık Arka Plan Senkronizasyon Motoru
 * Her 2 dakikada bir çalışarak 'autoSyncEnabled = true' olan tüm banka bağlantılarını
 * otomatik olarak günceller ve anlık hareketleri sisteme işler.
 */
export class BankingSyncJob {
  private static intervalTimer: NodeJS.Timeout | null = null;
  private static isRunning = false;

  public static start(intervalMs = 120000) { // 2 dakika
    if (this.intervalTimer) return;

    console.log('🔄 [Açık Bankacılık] Otomatik arka plan senkronizasyon motoru başlatıldı.');

    this.intervalTimer = setInterval(async () => {
      await this.runSyncCycle();
    }, intervalMs);
  }

  public static stop() {
    if (this.intervalTimer) {
      clearInterval(this.intervalTimer);
      this.intervalTimer = null;
      console.log('🛑 [Açık Bankacılık] Otomatik senkronizasyon motoru durduruldu.');
    }
  }

  public static async runSyncCycle() {
    if (this.isRunning) return;
    this.isRunning = true;

    try {
      const activeConnections = await prisma.bankConnection.findMany({
        where: {
          status: 'CONNECTED',
          autoSyncEnabled: true,
        },
      });

      for (const conn of activeConnections) {
        // Rıza süresi kontrolü
        if (new Date(conn.consentExpiresAt) <= new Date()) {
          await prisma.bankConnection.update({
            where: { id: conn.id },
            data: { status: 'EXPIRED' },
          });
          continue;
        }

        try {
          await openBankingService.syncConnection(conn.userId, conn.id);
        } catch (err: any) {
          console.error(`Banka sync hatası (${conn.bankName}):`, err.message);
        }
      }
    } catch (err: any) {
      console.error('[Açık Bankacılık Arka Plan Hatası]:', err.message);
    } finally {
      this.isRunning = false;
    }
  }
}
