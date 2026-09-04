"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const installment_engine_1 = require("../src/modules/finance/installment.engine");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🌱 Örnek veriler (Seed Data) yükleniyor...');
    // 1. Temizle
    await prisma.calendarEvent.deleteMany();
    await prisma.transaction.deleteMany();
    await prisma.installmentPlan.deleteMany();
    await prisma.category.deleteMany();
    await prisma.account.deleteMany();
    await prisma.refreshToken.deleteMany();
    await prisma.note.deleteMany();
    await prisma.user.deleteMany();
    // 2. Demo Kullanıcı Oluştur
    const passwordHash = await bcryptjs_1.default.hash('Password123!', 10);
    const user = await prisma.user.create({
        data: {
            email: 'demo@asistan.com',
            fullName: 'Ahmet Yılmaz',
            passwordHash,
            subscriptionTier: 'PRO',
            subscriptionStatus: 'ACTIVE',
            subscriptionEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
    });
    console.log(`✅ Demo kullanıcı oluşturuldu: demo@asistan.com (Şifre: Password123!)`);
    // 3. Kategorileri Oluştur
    const catSalary = await prisma.category.create({
        data: { userId: user.id, name: 'Maaş & Gelir', type: 'INCOME', icon: 'Briefcase', color: '#10b981' },
    });
    const catRent = await prisma.category.create({
        data: { userId: user.id, name: 'Kira & Konut', type: 'EXPENSE', icon: 'Home', color: '#ef4444' },
    });
    const catTech = await prisma.category.create({
        data: { userId: user.id, name: 'Teknoloji & Elektronik', type: 'EXPENSE', icon: 'Laptop', color: '#6366f1' },
    });
    const catFood = await prisma.category.create({
        data: { userId: user.id, name: 'Market & Gıda', type: 'EXPENSE', icon: 'ShoppingCart', color: '#f59e0b' },
    });
    const catBills = await prisma.category.create({
        data: { userId: user.id, name: 'Faturalar', type: 'EXPENSE', icon: 'Zap', color: '#ec4899' },
    });
    // 4. Hesapları Oluştur
    const accGaranti = await prisma.account.create({
        data: {
            userId: user.id,
            name: 'Garanti BBVA Vadesiz TL',
            type: 'BANK',
            balance: 74250.00,
            bankName: 'Garanti BBVA',
            accountNumberMasked: 'TR88 **** 4590',
            provider: 'MOCK_OPEN_BANKING',
            lastSyncedAt: new Date(),
        },
    });
    const accCard = await prisma.account.create({
        data: {
            userId: user.id,
            name: 'İş Bankası Maximum Kart',
            type: 'CREDIT_CARD',
            balance: -18500.00,
            bankName: 'Türkiye İş Bankası',
            accountNumberMasked: '4543 **** 9012',
            provider: 'MOCK_OPEN_BANKING',
            lastSyncedAt: new Date(),
        },
    });
    const accCash = await prisma.account.create({
        data: {
            userId: user.id,
            name: 'Nakit Cüzdan',
            type: 'CASH',
            balance: 3200.00,
            provider: 'MANUAL',
        },
    });
    // 5. İşlemler ve Taksit Planı Ekle
    // Maaş
    await prisma.transaction.create({
        data: {
            userId: user.id,
            accountId: accGaranti.id,
            categoryId: catSalary.id,
            amount: 95000.00,
            type: 'INCOME',
            description: 'Aylık Yönetici Maaş Ödemesi',
            status: 'COMPLETED',
            date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        },
    });
    // Kira
    await prisma.transaction.create({
        data: {
            userId: user.id,
            accountId: accGaranti.id,
            categoryId: catRent.id,
            amount: 24000.00,
            type: 'EXPENSE',
            description: 'Aylık Ev Kirası Havalesi',
            status: 'COMPLETED',
            date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        },
    });
    // Taksitli Harcama: MacBook Pro Alımı (6 Taksit, 48.000 TL)
    const totalAmount = 48000;
    const totalInstallments = 6;
    const schedule = installment_engine_1.InstallmentEngine.calculateSchedule(totalAmount, totalInstallments, new Date(), 15);
    const installmentPlan = await prisma.installmentPlan.create({
        data: {
            userId: user.id,
            accountId: accCard.id,
            categoryId: catTech.id,
            title: 'Apple MacBook Pro M3',
            totalAmount,
            totalInstallments,
            remainingInstallments: 5,
            installmentAmount: schedule[0].amount,
            startDate: new Date(),
            nextDueDate: schedule[1].dueDate,
            status: 'ACTIVE',
            notes: 'İş ve yazılım geliştirme için alındı.',
        },
    });
    // 1. taksit tamamlandı
    await prisma.transaction.create({
        data: {
            userId: user.id,
            accountId: accCard.id,
            categoryId: catTech.id,
            amount: schedule[0].amount,
            type: 'EXPENSE',
            date: schedule[0].dueDate,
            description: 'Apple MacBook Pro M3 (Taksit 1/6)',
            installmentPlanId: installmentPlan.id,
            installmentIndex: 1,
            status: 'COMPLETED',
        },
    });
    // Kalan 5 taksiti pending olarak kaydet
    for (let i = 1; i < schedule.length; i++) {
        const item = schedule[i];
        await prisma.transaction.create({
            data: {
                userId: user.id,
                accountId: accCard.id,
                categoryId: catTech.id,
                amount: item.amount,
                type: 'EXPENSE',
                date: item.dueDate,
                description: `Apple MacBook Pro M3 (Taksit ${item.installmentNumber}/6)`,
                installmentPlanId: installmentPlan.id,
                installmentIndex: item.installmentNumber,
                status: 'PENDING',
            },
        });
        // Takvime de ekle
        await prisma.calendarEvent.create({
            data: {
                userId: user.id,
                title: `💳 Taksit: Apple MacBook Pro M3 (${item.installmentNumber}/6) - ${item.amount} TL`,
                description: `Finans Modülü Otomatik Vade Bildirimi.`,
                startTime: item.dueDate,
                isAllDay: true,
                color: '#ef4444',
                sourceModule: 'FINANCE',
                sourceEntityId: installmentPlan.id,
                reminderMinutes: 1440,
            }
        });
    }
    // 6. Takvim Etkinlikleri
    await prisma.calendarEvent.create({
        data: {
            userId: user.id,
            title: 'Yatırımcı & Yönetim Kurulu Değerlendirme Toplantısı',
            description: 'Q3 finansal hedefler ve ürün yol haritası sunumu',
            startTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
            endTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
            color: '#3b82f6',
            reminderMinutes: 60,
            sourceModule: 'CALENDAR',
        },
    });
    // 7. Notlar
    await prisma.note.create({
        data: {
            userId: user.id,
            title: 'SaaS Büyüme & Pazarlama Stratejisi',
            content: '1. LinkedIn üzerinde finansal asistan niş kitleye yönelik içerikler paylaşılacak.\n2. Açık bankacılık entegrasyonu tamamlandığında basın bülteni gönderilecek.\n3. Freemium model ile ilk 1.000 kullanıcıya Pro tier hediye edilecek.',
            tags: 'pazarlama,strateji,saas,onemli',
            isPinned: true,
            color: '#eef2ff',
        },
    });
    await prisma.note.create({
        data: {
            userId: user.id,
            title: 'Yazılımcı Ekibi Devir Kontrol Listesi',
            content: 'Backend REST API standartları dokümante edildi. Modüller arası gevşek bağlılık (EventBus) sağlandı. Veritabanı PostgreSQL ve SQLite ile %100 uyumlu.',
            tags: 'teknik,mimari,ekip',
            isPinned: false,
            color: '#f0fdf4',
        },
    });
    console.log('✅ Örnek veriler başarıyla yüklendi!');
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
