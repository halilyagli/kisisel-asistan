import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Sistem sıfırlanıyor ve tüm örnek veriler temizleniyor...');

  // 1. Tüm Tabloları Temizle (Tam Sıfırlama)
  await prisma.auditLog.deleteMany();
  await prisma.calendarEvent.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.installmentPlan.deleteMany();
  await prisma.recurringBill.deleteMany();
  await prisma.budget.deleteMany();
  await prisma.category.deleteMany();
  await prisma.account.deleteMany();
  await prisma.bankConnection.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.note.deleteMany();
  await prisma.user.deleteMany();

  console.log('✅ Tüm örnek kullanıcılar, hesaplar ve işlemler silindi.');

  // 2. Yalnızca Sistem Yöneticisi & Müşteri Temsilcisi (Admin) Hesabını Oluştur
  const adminPasswordHash = await bcrypt.hash('AdminPass123!', 10);
  await prisma.user.create({
    data: {
      email: 'admin@asistan.com',
      fullName: 'Sistem Yöneticisi & Müşteri Hizmetleri',
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
      subscriptionTier: 'ENTERPRISE',
      subscriptionStatus: 'ACTIVE',
      kvkkConsent: true,
    },
  });

  console.log('✅ Sistem Yöneticisi hazırlandı: admin@asistan.com (Şifre: AdminPass123!)');
  console.log('🎉 Sistem tamamen sıfırlandı ve gerçek kullanıcı kayıtlarına hazır!');
}

main()
  .catch((e) => {
    console.error('Sıfırlama hatası:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
