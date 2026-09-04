import { z } from 'zod';

export const CreateAccountSchema = z.object({
  name: z.string().min(2, 'Hesap adı en az 2 karakter olmalıdır.'),
  type: z.enum(['BANK', 'CREDIT_CARD', 'CASH', 'INVESTMENT']).default('BANK'),
  balance: z.number().default(0),
  currency: z.string().default('TRY'),
  bankName: z.string().optional(),
  accountNumberMasked: z.string().optional(),
  iban: z.string().optional(),
  creditLimit: z.number().optional(),
  statementDay: z.number().int().min(1).max(31).optional(),
  dueDay: z.number().int().min(1).max(31).optional(),
  color: z.string().optional().default('#1e293b'),
});

export const UpdateAccountSchema = CreateAccountSchema.partial();

export const CreateCategorySchema = z.object({
  name: z.string().min(2, 'Kategori adı en az 2 karakter olmalıdır.'),
  type: z.enum(['EXPENSE', 'INCOME']).default('EXPENSE'),
  icon: z.string().default('Tag'),
  color: z.string().default('#6366f1'),
});

export const CreateTransactionSchema = z.object({
  accountId: z.string().uuid('Geçerli bir hesap seçiniz.'),
  categoryId: z.string().uuid('Geçerli bir kategori seçiniz.'),
  amount: z.number().positive('Tutar 0 dan büyük olmalıdır.'),
  type: z.enum(['EXPENSE', 'INCOME', 'TRANSFER']).default('EXPENSE'),
  date: z.string().datetime().or(z.string()).optional(),
  description: z.string().min(1, 'Açıklama giriniz.'),
  recipientOrSender: z.string().optional(),

  // Taksitlendirme Seçenekleri (İsteğe Bağlı)
  isInstallment: z.boolean().optional(),
  totalInstallments: z.number().int().min(2).max(60).optional(),
  dueDayOfMonth: z.number().int().min(1).max(31).optional(),
});

export const FilterTransactionSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  accountId: z.string().optional(),
  categoryId: z.string().optional(),
  type: z.enum(['EXPENSE', 'INCOME', 'TRANSFER']).optional(),
  search: z.string().optional(),
});

export const CreateRecurringBillSchema = z.object({
  accountId: z.string().uuid('Geçerli bir hesap seçiniz.'),
  categoryId: z.string().uuid('Geçerli bir kategori seçiniz.'),
  name: z.string().min(2, 'Abonelik veya fatura adı giriniz.'),
  amount: z.number().positive('Tutar pozitif olmalıdır.'),
  frequency: z.enum(['MONTHLY', 'YEARLY', 'WEEKLY']).default('MONTHLY'),
  billingDay: z.number().int().min(1).max(31).default(1),
  nextDueDate: z.string().datetime().or(z.string()).optional(),
  autoCreateTx: z.boolean().default(true),
});

export const SetBudgetSchema = z.object({
  categoryId: z.string().uuid('Kategori seçiniz.'),
  amountLimit: z.number().positive('Bütçe limiti pozitif olmalıdır.'),
});

export type CreateAccountInput = z.infer<typeof CreateAccountSchema>;
export type UpdateAccountInput = z.infer<typeof UpdateAccountSchema>;
export type CreateCategoryInput = z.infer<typeof CreateCategorySchema>;
export type CreateTransactionInput = z.infer<typeof CreateTransactionSchema>;
export type FilterTransactionInput = z.infer<typeof FilterTransactionSchema>;
export type CreateRecurringBillInput = z.infer<typeof CreateRecurringBillSchema>;
export type SetBudgetInput = z.infer<typeof SetBudgetSchema>;
