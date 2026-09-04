export interface InstallmentScheduleItem {
  installmentNumber: number;
  dueDate: Date;
  amount: number;
}

export class InstallmentEngine {
  /**
   * Taksit Ödeme Planı (Amortisman / Vade Dağılımı) Hesaplar
   * Kuruş farklarını son taksite ekleyerek kuruşu kuruşuna tam tutarlılık sağlar.
   */
  public static calculateSchedule(
    totalAmount: number,
    totalInstallments: number,
    startDate: Date = new Date(),
    dueDayOfMonth?: number
  ): InstallmentScheduleItem[] {
    if (totalInstallments <= 0) {
      throw new Error('Taksit sayısı 1 veya daha büyük olmalıdır.');
    }
    if (totalAmount <= 0) {
      throw new Error('Toplam tutar 0 dan büyük olmalıdır.');
    }

    const baseAmount = Math.floor((totalAmount / totalInstallments) * 100) / 100;
    const remainder = Math.round((totalAmount - (baseAmount * totalInstallments)) * 100) / 100;

    const schedule: InstallmentScheduleItem[] = [];
    const targetDay = dueDayOfMonth || startDate.getDate();

    for (let i = 0; i < totalInstallments; i++) {
      const dueDate = new Date(startDate);
      // Ayları artır
      dueDate.setMonth(dueDate.getMonth() + i);

      // Ay sonu gün taşması kontrolü (Örn: 31 çeken aydan 28 çeken şubata geçiş)
      const maxDaysInTargetMonth = new Date(dueDate.getFullYear(), dueDate.getMonth() + 1, 0).getDate();
      dueDate.setDate(Math.min(targetDay, maxDaysInTargetMonth));

      // Son takside kuruş artıklarını ekle
      const amount = i === totalInstallments - 1 ? Number((baseAmount + remainder).toFixed(2)) : baseAmount;

      schedule.push({
        installmentNumber: i + 1,
        dueDate,
        amount,
      });
    }

    return schedule;
  }
}
