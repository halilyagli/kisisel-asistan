import { prisma } from '../../core/database/prisma';
import { CreateCalendarEventInput, FilterCalendarInput } from './calendar.schema';
import { eventBus, SystemEvents } from '../../core/events/event-bus';

export class CalendarService {
  /**
   * Takvim Etkinliklerini Getirir
   */
  public async getEvents(userId: string, filter?: FilterCalendarInput) {
    const where: any = { userId };

    if (filter?.startMonth && filter?.endMonth) {
      where.startTime = {
        gte: new Date(filter.startMonth),
        lte: new Date(filter.endMonth),
      };
    }

    if (filter?.sourceModule) {
      where.sourceModule = filter.sourceModule;
    }

    return prisma.calendarEvent.findMany({
      where,
      orderBy: { startTime: 'asc' },
    });
  }

  /**
   * Bağımsız Etkinlik / Hatırlatıcı Oluşturur
   */
  public async createEvent(userId: string, input: CreateCalendarEventInput) {
    const event = await prisma.calendarEvent.create({
      data: {
        userId,
        title: input.title,
        description: input.description,
        startTime: new Date(input.startTime),
        endTime: input.endTime ? new Date(input.endTime) : null,
        isAllDay: input.isAllDay,
        reminderMinutes: input.reminderMinutes,
        color: input.color,
        sourceModule: 'CALENDAR',
      },
    });

    eventBus.publish(SystemEvents.CALENDAR_EVENT_CREATED, event);
    return event;
  }

  /**
   * Etkinlik Siler
   */
  public async deleteEvent(userId: string, eventId: string) {
    const event = await prisma.calendarEvent.findFirst({
      where: { id: eventId, userId },
    });

    if (!event) {
      throw new Error('Etkinlik bulunamadı.');
    }

    return prisma.calendarEvent.delete({
      where: { id: eventId },
    });
  }

  /**
   * Finans Modülünden Gelen Taksitleri Takvime Otomatik İşler
   */
  public async syncInstallmentSchedule(
    userId: string,
    installmentPlanId: string,
    title: string,
    schedule: Array<{ installmentNumber: number; dueDate: Date; amount: number }>
  ) {
    const eventsData = schedule.map(item => ({
      userId,
      title: `💳 Taksit: ${title} (${item.installmentNumber}/${schedule.length}) - ${item.amount} TL`,
      description: `Finans Modülü Otomatik Vade Bildirimi. Taksit Planı ID: ${installmentPlanId}`,
      startTime: item.dueDate,
      isAllDay: true,
      color: '#ef4444', // Borç / ödeme için belirgin kırmızı-turuncu
      sourceModule: 'FINANCE',
      sourceEntityId: installmentPlanId,
      reminderMinutes: 24 * 60, // 1 gün önce hatırlat
    }));

    await prisma.calendarEvent.createMany({
      data: eventsData,
    });
  }
}

export const calendarService = new CalendarService();
