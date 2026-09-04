import { prisma } from '../../core/database/prisma';
import { CreateNoteInput, UpdateNoteInput, FilterNotesInput } from './notes.schema';
import { eventBus, SystemEvents } from '../../core/events/event-bus';

export class NotesService {
  /**
   * Notları Listeler (Etiket, Arama ve Sabitleme Desteği)
   */
  public async getNotes(userId: string, filter?: FilterNotesInput) {
    const where: any = { userId };

    if (filter?.tag) {
      where.tags = { contains: filter.tag };
    }

    if (filter?.isPinned !== undefined) {
      where.isPinned = filter.isPinned === 'true';
    }

    if (filter?.search) {
      where.OR = [
        { title: { contains: filter.search } },
        { content: { contains: filter.search } },
        { tags: { contains: filter.search } },
      ];
    }

    return prisma.note.findMany({
      where,
      orderBy: [
        { isPinned: 'desc' },
        { updatedAt: 'desc' },
      ],
    });
  }

  /**
   * Yeni Not Oluşturur
   */
  public async createNote(userId: string, input: CreateNoteInput) {
    const note = await prisma.note.create({
      data: {
        userId,
        title: input.title,
        content: input.content,
        tags: input.tags || '',
        isPinned: input.isPinned || false,
        color: input.color || '#ffffff',
        linkedModule: input.linkedModule,
        linkedEntityId: input.linkedEntityId,
      },
    });

    eventBus.publish(SystemEvents.NOTE_CREATED, note);
    return note;
  }

  /**
   * Not Günceller
   */
  public async updateNote(userId: string, id: string, input: UpdateNoteInput) {
    const existing = await prisma.note.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      throw new Error('Not bulunamadı.');
    }

    return prisma.note.update({
      where: { id },
      data: input,
    });
  }

  /**
   * Not Siler
   */
  public async deleteNote(userId: string, id: string) {
    const existing = await prisma.note.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      throw new Error('Not bulunamadı.');
    }

    return prisma.note.delete({
      where: { id },
    });
  }

  /**
   * Kullanıcının Kullandığı Tüm Benzersiz Etiketleri Getirir
   */
  public async getAllTags(userId: string): Promise<string[]> {
    const notes = await prisma.note.findMany({
      where: { userId },
      select: { tags: true },
    });

    const tagSet = new Set<string>();
    for (const n of notes) {
      if (n.tags) {
        n.tags
          .split(',')
          .map(t => t.trim())
          .filter(Boolean)
          .forEach(t => tagSet.add(t));
      }
    }

    return Array.from(tagSet);
  }
}

export const notesService = new NotesService();
