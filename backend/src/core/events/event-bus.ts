import { EventEmitter } from 'events';

/**
 * Modüller Arası Gevşek Bağlı (Decoupled) Event Bus
 * 
 * Bu sınıf, modüllerin birbirlerinin veritabanlarına veya servislerine doğrudan
 * bağımlı olmadan asenkron haberleşmesini sağlar.
 * 
 * Örnek:
 * Finance modülü bir taksit/fatura oluşturduğunda `eventBus.emit(SystemEvents.INSTALLMENT_CREATED, data)`
 * çağrısı yapar. Calendar modülü bu eventi dinleyerek ajandaya etkinlik ekler.
 * Finans modülü Takvim modülünün varlığından habersizdir.
 */

export const SystemEvents = {
  // Auth Eventleri
  USER_REGISTERED: 'auth.user.registered',
  USER_SUBSCRIPTION_CHANGED: 'auth.user.subscription_changed',

  // Finans Eventleri
  TRANSACTION_CREATED: 'finance.transaction.created',
  INSTALLMENT_CREATED: 'finance.installment.created',
  INSTALLMENT_PAID: 'finance.installment.paid',
  INSTALLMENT_DUE_SOON: 'finance.installment.due_soon',
  BANK_SYNC_COMPLETED: 'finance.bank.sync_completed',

  // Takvim Eventleri
  CALENDAR_EVENT_CREATED: 'calendar.event.created',
  REMINDER_TRIGGERED: 'calendar.reminder.triggered',

  // Not Eventleri
  NOTE_CREATED: 'notes.note.created',
} as const;

export type SystemEventType = typeof SystemEvents[keyof typeof SystemEvents];

class AppEventBus extends EventEmitter {
  constructor() {
    super();
    // Bellek sızıntısı uyarısını engellemek için listener limitini artır
    this.setMaxListeners(50);
  }

  /**
   * Tip güvenli event fırlatma
   */
  public publish(event: SystemEventType, payload: any): void {
    this.emit(event, payload);
  }

  /**
   * Tip güvenli event dinleme
   */
  public subscribe(event: SystemEventType, listener: (payload: any) => void): void {
    this.on(event, listener);
  }
}

export const eventBus = new AppEventBus();
