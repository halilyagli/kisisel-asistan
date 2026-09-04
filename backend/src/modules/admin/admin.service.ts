import { prisma } from '../../core/database/prisma';
import { openBankingService } from '../finance/open-banking/open-banking.service';

export class AdminService {
  /**
   * Tüm Kayıtlı SaaS Abonelerini Listeler (KVKK Uyumlu Özet)
   */
  public async getSubscribers() {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        subscriptionTier: true,
        subscriptionStatus: true,
        isSuspended: true,
        kvkkConsent: true,
        createdAt: true,
        bankConnections: {
          select: {
            id: true,
            bankCode: true,
            bankName: true,
            status: true,
            consentExpiresAt: true,
            autoSyncEnabled: true,
            lastSyncedAt: true,
            accountsCount: true,
          },
        },
        _count: {
          select: {
            accounts: true,
            transactions: true,
            bankConnections: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return users.map((u) => ({
      ...u,
      totalConnectedBanks: u._count.bankConnections,
      totalAccounts: u._count.accounts,
      totalTransactions: u._count.transactions,
    }));
  }

  /**
   * Müşteri Temsilcisi İçin KVKK Uyumlu Teşhis & Destek Konsolu
   * Temsilci bu ekranda kullanıcının şifresini veya kart güvenlik kodunu ASLA göremez.
   * IBAN ve Kart numaraları maskeli gösterilir. Her görüntüleme KVKK loguna işlenir.
   */
  public async getSubscriberDiagnostics(actorId: string, actorEmail: string, targetUserId: string) {
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        subscriptionTier: true,
        subscriptionStatus: true,
        isSuspended: true,
        kvkkConsent: true,
        createdAt: true,
        bankConnections: {
          include: {
            accounts: {
              select: {
                id: true,
                name: true,
                type: true,
                balance: true,
                bankName: true,
                accountNumberMasked: true,
                iban: true,
                creditLimit: true,
                statementDay: true,
                dueDay: true,
                provider: true,
                lastSyncedAt: true,
              },
            },
          },
        },
      },
    });

    if (!targetUser) {
      throw new Error('Abone bulunamadı.');
    }

    // KVKK Uyarınca Denetim Kaydı (Audit Log) Oluştur
    await prisma.auditLog.create({
      data: {
        actorId,
        actorEmail,
        targetUserId,
        action: 'DIAGNOSTIC_VIEWED',
        details: `Müşteri temsilcisi (${actorEmail}), ${targetUser.email} kullanıcısının teknik bağlantı teşhis ekranını inceledi.`,
      },
    });

    // KVKK Maskeleme: IBAN ve Kart Numaralarını güvenlik için sıkılaştır
    const sanitizedConnections = targetUser.bankConnections.map((conn) => ({
      ...conn,
      accounts: conn.accounts.map((acc) => ({
        ...acc,
        // IBAN maskeleme (sadece son 4 hane açık)
        iban: acc.iban ? `TR** **** **** **** ${acc.iban.slice(-4)}` : null,
        // Kart numarası maskeleme
        accountNumberMasked: acc.accountNumberMasked || '•••• 1234',
      })),
    }));

    return {
      user: {
        id: targetUser.id,
        fullName: targetUser.fullName,
        email: targetUser.email,
        subscriptionTier: targetUser.subscriptionTier,
        isSuspended: targetUser.isSuspended,
        kvkkConsent: targetUser.kvkkConsent,
        createdAt: targetUser.createdAt,
      },
      connections: sanitizedConnections,
      kvkkNotice: 'KVKK Madde 11 ve 12 uyarınca tüm hassas finansal veriler maskelenmiştir. İşlemler denetim kaydına tabidir.',
    };
  }

  /**
   * Müşteri Temsilcisi Yetkisi: Sorunlu Banka Bağlantısını Sıfırla ve Canlı Eşitle
   */
  public async reSyncUserConnection(actorId: string, actorEmail: string, targetUserId: string, connectionId: string) {
    const result = await openBankingService.syncConnection(targetUserId, connectionId);

    // KVKK Denetim Kaydı
    await prisma.auditLog.create({
      data: {
        actorId,
        actorEmail,
        targetUserId,
        action: 'SYNC_RETRY',
        details: `Temsilci (${actorEmail}), ${connectionId} nolu banka bağlantısı için uzaktan canlı senkronizasyon tetikledi.`,
      },
    });

    return result;
  }

  /**
   * Müşteri Temsilcisi / Admin Yetkisi: Abonelik Paketini Değiştir
   */
  public async updateUserTier(actorId: string, actorEmail: string, targetUserId: string, newTier: string) {
    const updated = await prisma.user.update({
      where: { id: targetUserId },
      data: { subscriptionTier: newTier },
      select: { id: true, email: true, subscriptionTier: true },
    });

    // KVKK Denetim Kaydı
    await prisma.auditLog.create({
      data: {
        actorId,
        actorEmail,
        targetUserId,
        action: 'TIER_CHANGED',
        details: `Temsilci/Admin (${actorEmail}), kullanıcının planını [${newTier}] olarak güncelledi.`,
      },
    });

    return updated;
  }

  /**
   * Müşteri Temsilcisi / Admin Yetkisi: Hesabı Askıya Al veya Aktifleştir
   */
  public async toggleUserSuspension(actorId: string, actorEmail: string, targetUserId: string, isSuspended: boolean, reason?: string) {
    const updated = await prisma.user.update({
      where: { id: targetUserId },
      data: { isSuspended },
      select: { id: true, email: true, isSuspended: true },
    });

    // KVKK Denetim Kaydı
    await prisma.auditLog.create({
      data: {
        actorId,
        actorEmail,
        targetUserId,
        action: 'STATUS_TOGGLED',
        details: `Hesap durumu değiştirildi: ${isSuspended ? 'ASKIYA ALINDI' : 'AKTİFLEŞTİRİLDİ'}. Gerekçe: ${reason || 'Destek talebi'}`,
      },
    });

    return updated;
  }

  /**
   * KVKK Denetim Geçmişini (Audit Logs) Döner
   */
  public async getAuditLogs() {
    return prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }
}

export const adminService = new AdminService();
