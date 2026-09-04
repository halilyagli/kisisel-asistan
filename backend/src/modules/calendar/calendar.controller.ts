import { Request, Response } from 'express';
import { calendarService } from './calendar.service';
import { ResponseHelper } from '../../core/utils/response.util';

export class CalendarController {
  public async getEvents(req: Request, res: Response) {
    try {
      const events = await calendarService.getEvents(req.user!.userId, req.query as any);
      return ResponseHelper.success(res, events);
    } catch (err: any) {
      return ResponseHelper.error(res, err.message, 400);
    }
  }

  public async createEvent(req: Request, res: Response) {
    try {
      const event = await calendarService.createEvent(req.user!.userId, req.body);
      return ResponseHelper.success(res, event, 'Etkinlik oluşturuldu.', 201);
    } catch (err: any) {
      return ResponseHelper.error(res, err.message, 400);
    }
  }

  public async deleteEvent(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await calendarService.deleteEvent(req.user!.userId, id);
      return ResponseHelper.success(res, null, 'Etkinlik silindi.');
    } catch (err: any) {
      return ResponseHelper.error(res, err.message, 400);
    }
  }
}

export const calendarController = new CalendarController();
