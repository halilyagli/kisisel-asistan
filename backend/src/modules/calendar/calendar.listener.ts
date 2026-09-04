import { eventBus, SystemEvents } from '../../core/events/event-bus';
import { calendarService } from './calendar.service';

/**
 * Takvim Modülü Event Dinleyicisi
 * 
 * Finans modülünden fırlatılan taksit/fatura eventlerini dinler
 * ve kullanıcının takvimine otomatik hatırlatıcı etkinlikler ekler.
 */
export function registerCalendarListeners(): void {
  eventBus.subscribe(SystemEvents.INSTALLMENT_CREATED, async (payload) => {
    try {
      const { userId, installmentPlanId, title, schedule } = payload;
      if (userId && installmentPlanId && schedule) {
        await calendarService.syncInstallmentSchedule(userId, installmentPlanId, title, schedule);
        console.log(`[CalendarListener] Taksit planı (${installmentPlanId}) takvime başarıyla senkronize edildi.`);
      }
    } catch (err) {
      console.error('[CalendarListener Error]:', err);
    }
  });
}
