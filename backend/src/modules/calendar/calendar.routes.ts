import { Router } from 'express';
import { calendarController } from './calendar.controller';
import { authenticateJwt } from '../../core/middleware/auth.middleware';
import { validateRequest } from '../../core/middleware/error.middleware';
import { CreateCalendarEventSchema } from './calendar.schema';

const router = Router();

router.use(authenticateJwt);

router.get('/events', calendarController.getEvents);
router.post('/events', validateRequest(CreateCalendarEventSchema), calendarController.createEvent);
router.delete('/events/:id', calendarController.deleteEvent);

export const calendarRoutes = router;
