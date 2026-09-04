import { z } from 'zod';

export const CreateNoteSchema = z.object({
  title: z.string().min(1, 'Not başlığı giriniz.'),
  content: z.string().default(''),
  tags: z.string().optional().default(''),
  isPinned: z.boolean().optional().default(false),
  color: z.string().optional().default('#ffffff'),
  linkedModule: z.enum(['FINANCE', 'CALENDAR', 'GENERAL']).optional(),
  linkedEntityId: z.string().optional(),
});

export const UpdateNoteSchema = CreateNoteSchema.partial();

export const FilterNotesSchema = z.object({
  tag: z.string().optional(),
  search: z.string().optional(),
  isPinned: z.string().optional(),
});

export type CreateNoteInput = z.infer<typeof CreateNoteSchema>;
export type UpdateNoteInput = z.infer<typeof UpdateNoteSchema>;
export type FilterNotesInput = z.infer<typeof FilterNotesSchema>;
