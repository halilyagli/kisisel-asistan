import { Router } from 'express';
import { financeController } from './finance.controller';
import { authenticateJwt } from '../../core/middleware/auth.middleware';
import { validateRequest } from '../../core/middleware/error.middleware';
import {
  CreateAccountSchema,
  UpdateAccountSchema,
  CreateCategorySchema,
  CreateTransactionSchema,
  CreateRecurringBillSchema,
  SetBudgetSchema,
} from './finance.schema';

const router = Router();

router.use(authenticateJwt);

// Hesaplar ve Kredi Kartları
router.get('/accounts', financeController.getAccounts);
router.post('/accounts', validateRequest(CreateAccountSchema), financeController.createAccount);
router.put('/accounts/:id', validateRequest(UpdateAccountSchema), financeController.updateAccount);
router.delete('/accounts/:id', financeController.deleteAccount);
router.post('/accounts/sync-bank', financeController.syncBankAccounts);

// Açık Bankacılık (Open Banking & Otomatik Entegrasyon)
router.get('/open-banking/banks', financeController.getSupportedBanks);
router.get('/open-banking/connections', financeController.getBankConnections);
router.post('/open-banking/connect', financeController.connectBank);
router.post('/open-banking/sync/:id', financeController.syncBankConnection);
router.post('/open-banking/sync-all', financeController.syncBankAccounts);
router.put('/open-banking/toggle-auto-sync/:id', financeController.toggleBankAutoSync);
router.delete('/open-banking/connections/:id', financeController.disconnectBank);

// Kategoriler
router.get('/categories', financeController.getCategories);
router.post('/categories', validateRequest(CreateCategorySchema), financeController.createCategory);

// İşlemler (Gelir / Gider / Taksit)
router.get('/transactions', financeController.getTransactions);
router.post('/transactions', validateRequest(CreateTransactionSchema), financeController.createTransaction);
router.get('/transactions/export-csv', financeController.exportCsv);

// Taksitler
router.get('/installments', financeController.getInstallments);

// Sabit Abonelikler & Faturalar (Recurring Bills)
router.get('/recurring-bills', financeController.getRecurringBills);
router.post('/recurring-bills', validateRequest(CreateRecurringBillSchema), financeController.createRecurringBill);
router.patch('/recurring-bills/:id/toggle', financeController.toggleRecurringBill);
router.delete('/recurring-bills/:id', financeController.deleteRecurringBill);

// Bütçeler
router.get('/budgets', financeController.getBudgets);
router.post('/budgets', validateRequest(SetBudgetSchema), financeController.setBudget);

// Projeksiyon & İstatistik
router.get('/summary', financeController.getSummary);
router.get('/projection', financeController.getProjection);

export const financeRoutes = router;
