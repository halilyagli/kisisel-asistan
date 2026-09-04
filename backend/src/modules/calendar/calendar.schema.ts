import { z } from 'zod';

export const CreateCalendarEventSchema = z.object({
  title: z.string().min(1, 'Başlık zorunludur.'),
  description: z.string().optional(),
  startTime: z.string().datetime().or(z.string()),
  endTime: z.string().datetime().or(z.string()).optional(),
  isAllDay: z.boolean().default(false),
  reminderMinutes: z.number().int().min(0).optional(),
  color: z.string().default('#3b82f6'),
});

export const FilterCalendarSchema = z.object({
  startMonth: z.string().optional(),
  endMonth: z.string().optional(),
  sourceModule: z.enum(['CALENDAR', 'FINANCE', 'NOTES']).optional(),
});

export type CreateCalendarEventInput = z.infer<typeof CreateCalendarEventSchema>;
export type FilterCalendarInput = z.infer<typeof FilterCalendarSchema>;
