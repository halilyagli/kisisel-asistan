import { prisma } from '../../core/database/prisma';
import { eventBus, SystemEvents } from '../../core/events/event-bus';
import {
  CreateAccountInput,
  UpdateAccountInput,
  CreateCategoryInput,
  CreateTransactionInput,
  FilterTransactionInput,
  CreateRecurringBillInput,
  SetBudgetInput,
} from './finance.schema';
import { InstallmentEngine } from './installment.engine';
import { mockTurkishBanksAdapter } from './adapters/mock-turkish-banks.adapter';

export class FinanceService {
  /**
   * Kullanıcının Hesaplarını ve Kredi Kartlarını Listeler (Hesaplanmış Metriklerle)
   */
  public async getAccounts(userId: string) {
    const rawAccounts = await prisma.account.findMany({
      where: { userId, isActive: true },
      orderBy: [{ type: 'asc' }, { createdAt: 'desc' }],
    });

    return rawAccounts.map((acc) => {
      const isCard = acc.type === 'CREDIT_CARD';
      const debt = isCard ? Math.abs(acc.balance) : 0;
      const limit = acc.creditLimit || (isCard ? 50000 : 0);
      const available = isCard ? Math.max(0, limit - debt) : acc.balance;
      const utilizationPercent = isCard && limit > 0 ? Math.min(100, Math.round((debt / limit) * 100)) : 0;

      return {
        ...acc,
        currentDebt: debt,
        calculatedAvailableLimit: available,
        utilizationPercent,
      };
    });
  }

  /**
   * Yeni Hesap veya Kredi Kartı Ekler
   */
  public async createAccount(userId: string, input: CreateAccountInput) {
    // Kredi kartı borcu negatif kaydedilir
    let initialBalance = input.balance;
    if (input.type === 'CREDIT_CARD' && initialBalance > 0) {
      initialBalance = -initialBalance;
    }

    return prisma.account.create({
      data: {
        userId,
        name: input.name,
        type: input.type,
        balance: initialBalance,
        currency: input.currency || 'TRY',
        bankName: input.bankName,
        accountNumberMasked: input.accountNumberMasked,
        iban: input.iban,
        creditLimit: input.creditLimit,
        statementDay: input.statementDay,
        dueDay: input.dueDay,
        color: input.color || '#1e293b',
      },
    });
  }

  /**
   * Hesap veya Kredi Kartı Günceller
   */
  public async updateAccount(userId: string, accountId: string, input: UpdateAccountInput) {
    const existing = await prisma.account.findFirst({
      where: { id: accountId, userId },
    });
    if (!existing) throw new Error('Hesap bulunamadı.');

    let balance = input.balance !== undefined ? input.balance : existing.balance;
    if (existing.type === 'CREDIT_CARD' && balance > 0) {
      balance = -balance;
    }

    return prisma.account.update({
      where: { id: accountId },
      data: {
        ...input,
        balance,
      },
    });
  }

  /**
   * Hesap veya Kart Siler
   */
  public async deleteAccount(userId: string, accountId: string) {
    const existing = await prisma.account.findFirst({
      where: { id: accountId, userId },
    });
    if (!existing) throw new Error('Hesap bulunamadı.');

    return prisma.account.delete({
      where: { id: accountId },
    });
  }

  /**
   * Açık Bankacılık Adaptörü ile Hesapları Senkronize Eder
   */
  public async syncBankAccounts(userId: string) {
    const syncedAccounts = await mockTurkishBanksAdapter.fetchAccounts(userId);

    const savedAccounts = [];
    for (const acc of syncedAccounts) {
      const existing = await prisma.account.findFirst({
        where: {
          userId,
          accountNumberMasked: acc.accountNumberMasked,
        },
      });

      if (existing) {
        const updated = await prisma.account.update({
          where: { id: existing.id },
          data: {
            balance: acc.balance,
            lastSyncedAt: new Date(),
          },
        });
        savedAccounts.push(updated);
      } else {
        const created = await prisma.account.create({
          data: {
            userId,
            name: acc.accountName,
            type: acc.type,
            balance: acc.balance,
            currency: acc.currency,
            bankName: acc.bankName,
            accountNumberMasked: acc.accountNumberMasked,
            provider: 'MOCK_OPEN_BANKING',
            lastSyncedAt: new Date(),
          },
        });
        savedAccounts.push(created);
      }
    }

    return savedAccounts;
  }

  /**
   * Kategorileri Listeler
   */
  public async getCategories(userId: string) {
    return prisma.category.findMany({
      where: {
        OR: [{ userId }, { userId: null }],
      },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Özel Kategori Ekler
   */
  public async createCategory(userId: string, input: CreateCategoryInput) {
    return prisma.category.create({
      data: {
        userId,
        name: input.name,
        type: input.type,
        icon: input.icon,
        color: input.color,
      },
    });
  }

  /**
   * İşlem Ekleme (Harcama / Gelir / Taksitlendirme Mantığı)
   */
  public async createTransaction(userId: string, input: CreateTransactionInput) {
    const account = await prisma.account.findFirst({
      where: { id: input.accountId, userId },
    });
    if (!account) {
      throw new Error('Hesap bulunamadı.');
    }

    const category = await prisma.category.findFirst({
      where: { id: input.categoryId },
    });
    if (!category) {
      throw new Error('Kategori bulunamadı.');
    }

    const txDate = input.date ? new Date(input.date) : new Date();

    // 1. Taksitli Harcama Mantığı
    if (input.isInstallment && input.totalInstallments && input.totalInstallments > 1) {
      const schedule = InstallmentEngine.calculateSchedule(
        input.amount,
        input.totalInstallments,
        txDate,
        input.dueDayOfMonth
      );

      const firstInstallment = schedule[0];
      const remainingInstallmentsCount = input.totalInstallments - 1;

      // Taksit Planı Kaydı Oluştur
      const installmentPlan = await prisma.installmentPlan.create({
        data: {
          userId,
          accountId: account.id,
          categoryId: category.id,
          title: input.description,
          totalAmount: input.amount,
          totalInstallments: input.totalInstallments,
          remainingInstallments: remainingInstallmentsCount,
          installmentAmount: firstInstallment.amount,
          startDate: txDate,
          nextDueDate: schedule.length > 1 ? schedule[1].dueDate : txDate,
          status: 'ACTIVE',
        },
      });

      // İlk taksiti tamamlanmış olarak kaydet
      const firstTx = await prisma.transaction.create({
        data: {
          userId,
          accountId: account.id,
          categoryId: category.id,
          amount: firstInstallment.amount,
          type: input.type,
          date: firstInstallment.dueDate,
          description: `${input.description} (Taksit 1/${input.totalInstallments})`,
          recipientOrSender: input.recipientOrSender,
          installmentPlanId: installmentPlan.id,
          installmentIndex: 1,
          status: 'COMPLETED',
        },
      });

      // Gelecek taksitleri 'PENDING' durumunda oluştur
      for (let i = 1; i < schedule.length; i++) {
        const item = schedule[i];
        await prisma.transaction.create({
          data: {
            userId,
            accountId: account.id,
            categoryId: category.id,
            amount: item.amount,
            type: input.type,
            date: item.dueDate,
            description: `${input.description} (Taksit ${item.installmentNumber}/${input.totalInstallments})`,
            recipientOrSender: input.recipientOrSender,
            installmentPlanId: installmentPlan.id,
            installmentIndex: item.installmentNumber,
            status: 'PENDING',
          },
        });
      }

      // Hesap bakiyesini ilk taksit tutarı kadar güncelle
      const balanceChange = input.type === 'EXPENSE' ? -firstInstallment.amount : firstInstallment.amount;
      await prisma.account.update({
        where: { id: account.id },
        data: { balance: account.balance + balanceChange },
      });

      // Event fırlat (Takvim modülü otomatik senkronize olacak)
      eventBus.publish(SystemEvents.INSTALLMENT_CREATED, {
        userId,
        installmentPlanId: installmentPlan.id,
        title: input.description,
        schedule,
        categoryName: category.name,
      });

      return {
        transaction: firstTx,
        installmentPlan,
        schedule,
      };
    }

    // 2. Standart Tek Çekim Harcama / Gelir
    const transaction = await prisma.transaction.create({
      data: {
        userId,
        accountId: account.id,
        categoryId: category.id,
        amount: input.amount,
        type: input.type,
        date: txDate,
        description: input.description,
        recipientOrSender: input.recipientOrSender,
        status: 'COMPLETED',
      },
    });

    const balanceChange = input.type === 'EXPENSE' ? -input.amount : input.amount;
    await prisma.account.update({
      where: { id: account.id },
      data: { balance: account.balance + balanceChange },
    });

    eventBus.publish(SystemEvents.TRANSACTION_CREATED, {
      userId,
      transactionId: transaction.id,
      amount: input.amount,
      type: input.type,
      description: input.description,
      date: txDate,
    });

    return { transaction };
  }

  /**
   * İşlemleri Filtreleme ve Listeleme
   */
  public async getTransactions(userId: string, filter: FilterTransactionInput) {
    const where: any = { userId };

    if (filter.startDate || filter.endDate) {
      where.date = {};
      if (filter.startDate) where.date.gte = new Date(filter.startDate);
      if (filter.endDate) where.date.lte = new Date(filter.endDate);
    }

    if (filter.accountId) where.accountId = filter.accountId;
    if (filter.categoryId) where.categoryId = filter.categoryId;
    if (filter.type) where.type = filter.type;

    if (filter.search) {
      where.OR = [
        { description: { contains: filter.search } },
        { recipientOrSender: { contains: filter.search } },
      ];
    }

    return prisma.transaction.findMany({
      where,
      include: {
        account: { select: { name: true, type: true, bankName: true } },
        category: { select: { name: true, icon: true, color: true } },
        installmentPlan: { select: { title: true, totalInstallments: true, remainingInstallments: true } },
      },
      orderBy: { date: 'desc' },
    });
  }

  /**
   * Taksit Planlarını Listeler
   */
  public async getInstallmentPlans(userId: string) {
    return prisma.installmentPlan.findMany({
      where: { userId },
      include: {
        account: { select: { name: true, bankName: true } },
        category: { select: { name: true, color: true, icon: true } },
        transactions: {
          select: { id: true, amount: true, date: true, status: true, installmentIndex: true },
          orderBy: { installmentIndex: 'asc' },
        },
      },
      orderBy: { nextDueDate: 'asc' },
    });
  }

  /**
   * Yinelenen Sabit Giderler ve Abonelikler (Recurring Bills)
   */
  public async getRecurringBills(userId: string) {
    return prisma.recurringBill.findMany({
      where: { userId },
      include: {
        account: { select: { name: true, bankName: true } },
        category: { select: { name: true, color: true, icon: true } },
      },
      orderBy: { nextDueDate: 'asc' },
    });
  }

  public async createRecurringBill(userId: string, input: CreateRecurringBillInput) {
    const now = new Date();
    let nextDate = input.nextDueDate ? new Date(input.nextDueDate) : new Date(now.getFullYear(), now.getMonth(), input.billingDay);
    if (nextDate < now) {
      nextDate = new Date(now.getFullYear(), now.getMonth() + 1, input.billingDay);
    }

    const bill = await prisma.recurringBill.create({
      data: {
        userId,
        accountId: input.accountId,
        categoryId: input.categoryId,
        name: input.name,
        amount: input.amount,
        frequency: input.frequency,
        billingDay: input.billingDay,
        nextDueDate: nextDate,
        autoCreateTx: input.autoCreateTx,
      },
      include: { category: true },
    });

    // Takvime de anımsatıcı olarak işle
    await prisma.calendarEvent.create({
      data: {
        userId,
        title: `🔄 Düzenli Fatura: ${bill.name} - ${bill.amount} TL`,
        description: `Sabit Abonelik / Fatura Ödeme Vadesi`,
        startTime: nextDate,
        isAllDay: true,
        color: '#f59e0b',
        sourceModule: 'FINANCE',
        sourceEntityId: bill.id,
        reminderMinutes: 24 * 60,
      }
    });

    return bill;
  }

  public async toggleRecurringBill(userId: string, id: string) {
    const bill = await prisma.recurringBill.findFirst({ where: { id, userId } });
    if (!bill) throw new Error('Abonelik bulunamadı.');

    return prisma.recurringBill.update({
      where: { id },
      data: { isActive: !bill.isActive },
    });
  }

  public async deleteRecurringBill(userId: string, id: string) {
    const bill = await prisma.recurringBill.findFirst({ where: { id, userId } });
    if (!bill) throw new Error('Abonelik bulunamadı.');

    return prisma.recurringBill.delete({ where: { id } });
  }

  /**
   * Kategori Bazlı Bütçeler ve Limit Durumu (Budgets & Spending Limits)
   */
  public async getBudgets(userId: string) {
    const budgets = await prisma.budget.findMany({
      where: { userId },
      include: { category: true },
    });

    // Bu ayki harcamaları hesapla
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const monthExpenses = await prisma.transaction.findMany({
      where: {
        userId,
        type: 'EXPENSE',
        status: 'COMPLETED',
        date: { gte: startOfMonth, lte: endOfMonth },
      },
    });

    return budgets.map((b) => {
      const spent = monthExpenses
        .filter((tx) => tx.categoryId === b.categoryId)
        .reduce((sum, tx) => sum + tx.amount, 0);

      const percent = b.amountLimit > 0 ? Math.round((spent / b.amountLimit) * 100) : 0;
      const remaining = b.amountLimit - spent;

      return {
        ...b,
        spent,
        percent,
        remaining,
        isOverBudget: spent > b.amountLimit,
      };
    });
  }

  public async setBudget(userId: string, input: SetBudgetInput) {
    return prisma.budget.upsert({
      where: {
        userId_categoryId: {
          userId,
          categoryId: input.categoryId,
        },
      },
      update: {
        amountLimit: input.amountLimit,
      },
      create: {
        userId,
        categoryId: input.categoryId,
        amountLimit: input.amountLimit,
      },
      include: { category: true },
    });
  }

  /**
   * Gelecek 6 Aylık Taksit ve Sabit Gider Nakit Akışı Projeksiyonu
   */
  public async getMonthlyProjection(userId: string) {
    const today = new Date();
    const projections = [];

    // Aktif taksitler ve yinelenen faturalar
    const activeInstallments = await prisma.installmentPlan.findMany({
      where: { userId, status: 'ACTIVE' },
    });
    const activeBills = await prisma.recurringBill.findMany({
      where: { userId, isActive: true },
    });

    for (let m = 0; m < 6; m++) {
      const targetDate = new Date(today.getFullYear(), today.getMonth() + m, 1);
      const monthName = targetDate.toLocaleDateString('tr-TR', { month: 'short', year: 'numeric' });

      // Bu aydaki taksit yükü
      let installmentLoad = 0;
      for (const inst of activeInstallments) {
        if (inst.remainingInstallments > m) {
          installmentLoad += inst.installmentAmount;
        }
      }

      // Sabit faturalar
      const billsTotal = activeBills.reduce((acc, b) => acc + b.amount, 0);

      projections.push({
        month: monthName,
        installmentLoad: Math.round(installmentLoad),
        billsTotal: Math.round(billsTotal),
        totalObligation: Math.round(installmentLoad + billsTotal),
      });
    }

    return projections;
  }

  /**
   * Finansal Özet Dashboard İstatistikleri
   */
  public async getFinancialSummary(userId: string) {
    const accounts = await prisma.account.findMany({
      where: { userId, isActive: true },
    });

    const netWorth = accounts.reduce((acc, a) => acc + a.balance, 0);

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const monthTransactions = await prisma.transaction.findMany({
      where: {
        userId,
        status: 'COMPLETED',
        date: { gte: startOfMonth, lte: endOfMonth },
      },
      include: { category: true },
    });

    let totalIncome = 0;
    let totalExpense = 0;
    const categorySpending: Record<string, { name: string; color: string; amount: number }> = {};

    for (const tx of monthTransactions) {
      if (tx.type === 'INCOME') {
        totalIncome += tx.amount;
      } else if (tx.type === 'EXPENSE') {
        totalExpense += tx.amount;
        const catId = tx.categoryId;
        if (!categorySpending[catId]) {
          categorySpending[catId] = {
            name: tx.category.name,
            color: tx.category.color,
            amount: 0,
          };
        }
        categorySpending[catId].amount += tx.amount;
      }
    }

    const activeInstallments = await prisma.installmentPlan.findMany({
      where: { userId, status: 'ACTIVE' },
    });

    const totalRemainingDebt = activeInstallments.reduce(
      (acc, plan) => acc + (plan.installmentAmount * plan.remainingInstallments),
      0
    );

    const activeBills = await prisma.recurringBill.findMany({
      where: { userId, isActive: true },
    });
    const monthlyBillsTotal = activeBills.reduce((acc, b) => acc + b.amount, 0);

    return {
      netWorth,
      monthSummary: {
        totalIncome,
        totalExpense,
        netCashFlow: totalIncome - totalExpense,
      },
      totalRemainingDebt,
      activeInstallmentCount: activeInstallments.length,
      monthlyBillsTotal,
      activeBillsCount: activeBills.length,
      categoryBreakdown: Object.values(categorySpending),
    };
  }

  /**
   * Hesap Hareketlerini CSV Formatında İhraç Etme
   */
  public async exportTransactionsCsv(userId: string): Promise<string> {
    const transactions = await prisma.transaction.findMany({
      where: { userId },
      include: { account: true, category: true },
      orderBy: { date: 'desc' },
    });

    const headers = ['Tarih', 'Tur', 'Tutar', 'Hesap', 'Kategori', 'Aciklama', 'Durum'];
    const rows = transactions.map((t) => [
      t.date.toISOString().split('T')[0],
      t.type,
      t.amount.toString(),
      `"${t.account.name.replace(/"/g, '""')}"`,
      `"${t.category.name.replace(/"/g, '""')}"`,
      `"${t.description.replace(/"/g, '""')}"`,
      t.status,
    ]);

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  }
}

export const financeService = new FinanceService();
