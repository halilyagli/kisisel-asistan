import { Request, Response } from 'express';
import { financeService } from './finance.service';
import { openBankingService } from './open-banking/open-banking.service';
import { ResponseHelper } from '../../core/utils/response.util';

export class FinanceController {
  public async getAccounts(req: Request, res: Response) {
    try {
      const accounts = await financeService.getAccounts(req.user!.userId);
      return ResponseHelper.success(res, accounts);
    } catch (err: any) {
      return ResponseHelper.error(res, err.message, 400);
    }
  }

  public async createAccount(req: Request, res: Response) {
    try {
      const account = await financeService.createAccount(req.user!.userId, req.body);
      return ResponseHelper.success(res, account, 'Hesap başarıyla oluşturuldu.', 201);
    } catch (err: any) {
      return ResponseHelper.error(res, err.message, 400);
    }
  }

  public async updateAccount(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const account = await financeService.updateAccount(req.user!.userId, id, req.body);
      return ResponseHelper.success(res, account, 'Hesap güncellendi.');
    } catch (err: any) {
      return ResponseHelper.error(res, err.message, 400);
    }
  }

  public async deleteAccount(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await financeService.deleteAccount(req.user!.userId, id);
      return ResponseHelper.success(res, null, 'Hesap silindi.');
    } catch (err: any) {
      return ResponseHelper.error(res, err.message, 400);
    }
  }

  public async syncBankAccounts(req: Request, res: Response) {
    try {
      const synced = await openBankingService.syncAllUserConnections(req.user!.userId);
      return ResponseHelper.success(res, synced, 'Tüm bağlı bankalar başarıyla senkronize edildi.');
    } catch (err: any) {
      return ResponseHelper.error(res, err.message, 400);
    }
  }

  // Açık Bankacılık (Open Banking)
  public async getSupportedBanks(_req: Request, res: Response) {
    try {
      const banks = openBankingService.getSupportedBanks();
      return ResponseHelper.success(res, banks);
    } catch (err: any) {
      return ResponseHelper.error(res, err.message, 400);
    }
  }

  public async getBankConnections(req: Request, res: Response) {
    try {
      const connections = await openBankingService.getConnections(req.user!.userId);
      return ResponseHelper.success(res, connections);
    } catch (err: any) {
      return ResponseHelper.error(res, err.message, 400);
    }
  }

  public async connectBank(req: Request, res: Response) {
    try {
      const { bankCode } = req.body;
      if (!bankCode) return ResponseHelper.error(res, 'bankCode gereklidir', 400);
      const connection = await openBankingService.connectBank(req.user!.userId, bankCode);
      return ResponseHelper.success(res, connection, 'Banka başarıyla bağlandı ve veriler anlık olarak çekildi.', 201);
    } catch (err: any) {
      return ResponseHelper.error(res, err.message, 400);
    }
  }

  public async syncBankConnection(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await openBankingService.syncConnection(req.user!.userId, id);
      return ResponseHelper.success(res, result, 'Banka verileri anlık olarak güncellendi.');
    } catch (err: any) {
      return ResponseHelper.error(res, err.message, 400);
    }
  }

  public async toggleBankAutoSync(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { autoSyncEnabled } = req.body;
      await openBankingService.toggleAutoSync(req.user!.userId, id, Boolean(autoSyncEnabled));
      return ResponseHelper.success(res, null, 'Otomatik senkronizasyon ayarı güncellendi.');
    } catch (err: any) {
      return ResponseHelper.error(res, err.message, 400);
    }
  }

  public async disconnectBank(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await openBankingService.disconnectBank(req.user!.userId, id);
      return ResponseHelper.success(res, null, 'Banka bağlantısı ve rıza kaydı sonlandırıldı.');
    } catch (err: any) {
      return ResponseHelper.error(res, err.message, 400);
    }
  }

  public async getCategories(req: Request, res: Response) {
    try {
      const categories = await financeService.getCategories(req.user!.userId);
      return ResponseHelper.success(res, categories);
    } catch (err: any) {
      return ResponseHelper.error(res, err.message, 400);
    }
  }

  public async createCategory(req: Request, res: Response) {
    try {
      const category = await financeService.createCategory(req.user!.userId, req.body);
      return ResponseHelper.success(res, category, 'Kategori oluşturuldu.', 201);
    } catch (err: any) {
      return ResponseHelper.error(res, err.message, 400);
    }
  }

  public async createTransaction(req: Request, res: Response) {
    try {
      const result = await financeService.createTransaction(req.user!.userId, req.body);
      return ResponseHelper.success(res, result, 'İşlem başarıyla kaydedildi.', 201);
    } catch (err: any) {
      return ResponseHelper.error(res, err.message, 400);
    }
  }

  public async getTransactions(req: Request, res: Response) {
    try {
      const transactions = await financeService.getTransactions(req.user!.userId, req.query as any);
      return ResponseHelper.success(res, transactions);
    } catch (err: any) {
      return ResponseHelper.error(res, err.message, 400);
    }
  }

  public async getInstallments(req: Request, res: Response) {
    try {
      const installments = await financeService.getInstallmentPlans(req.user!.userId);
      return ResponseHelper.success(res, installments);
    } catch (err: any) {
      return ResponseHelper.error(res, err.message, 400);
    }
  }

  public async getSummary(req: Request, res: Response) {
    try {
      const summary = await financeService.getFinancialSummary(req.user!.userId);
      return ResponseHelper.success(res, summary);
    } catch (err: any) {
      return ResponseHelper.error(res, err.message, 400);
    }
  }

  // Yinelenen Sabit Faturalar
  public async getRecurringBills(req: Request, res: Response) {
    try {
      const bills = await financeService.getRecurringBills(req.user!.userId);
      return ResponseHelper.success(res, bills);
    } catch (err: any) {
      return ResponseHelper.error(res, err.message, 400);
    }
  }

  public async createRecurringBill(req: Request, res: Response) {
    try {
      const bill = await financeService.createRecurringBill(req.user!.userId, req.body);
      return ResponseHelper.success(res, bill, 'Sabit abonelik / fatura kaydedildi.', 201);
    } catch (err: any) {
      return ResponseHelper.error(res, err.message, 400);
    }
  }

  public async toggleRecurringBill(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const bill = await financeService.toggleRecurringBill(req.user!.userId, id);
      return ResponseHelper.success(res, bill, 'Abonelik durumu güncellendi.');
    } catch (err: any) {
      return ResponseHelper.error(res, err.message, 400);
    }
  }

  public async deleteRecurringBill(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await financeService.deleteRecurringBill(req.user!.userId, id);
      return ResponseHelper.success(res, null, 'Abonelik silindi.');
    } catch (err: any) {
      return ResponseHelper.error(res, err.message, 400);
    }
  }

  // Bütçeler
  public async getBudgets(req: Request, res: Response) {
    try {
      const budgets = await financeService.getBudgets(req.user!.userId);
      return ResponseHelper.success(res, budgets);
    } catch (err: any) {
      return ResponseHelper.error(res, err.message, 400);
    }
  }

  public async setBudget(req: Request, res: Response) {
    try {
      const budget = await financeService.setBudget(req.user!.userId, req.body);
      return ResponseHelper.success(res, budget, 'Kategori bütçesi güncellendi.');
    } catch (err: any) {
      return ResponseHelper.error(res, err.message, 400);
    }
  }

  // Projeksiyon & Analitik
  public async getProjection(req: Request, res: Response) {
    try {
      const projection = await financeService.getMonthlyProjection(req.user!.userId);
      return ResponseHelper.success(res, projection);
    } catch (err: any) {
      return ResponseHelper.error(res, err.message, 400);
    }
  }

  // CSV İhracı
  public async exportCsv(req: Request, res: Response) {
    try {
      const csv = await financeService.exportTransactionsCsv(req.user!.userId);
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="hesap-hareketleri.csv"');
      return res.status(200).send(csv);
    } catch (err: any) {
      return ResponseHelper.error(res, err.message, 400);
    }
  }
}

export const financeController = new FinanceController();
