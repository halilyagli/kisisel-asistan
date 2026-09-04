import { Request, Response } from 'express';
import { notesService } from './notes.service';
import { ResponseHelper } from '../../core/utils/response.util';

export class NotesController {
  public async getNotes(req: Request, res: Response) {
    try {
      const notes = await notesService.getNotes(req.user!.userId, req.query as any);
      return ResponseHelper.success(res, notes);
    } catch (err: any) {
      return ResponseHelper.error(res, err.message, 400);
    }
  }

  public async createNote(req: Request, res: Response) {
    try {
      const note = await notesService.createNote(req.user!.userId, req.body);
      return ResponseHelper.success(res, note, 'Not oluşturuldu.', 201);
    } catch (err: any) {
      return ResponseHelper.error(res, err.message, 400);
    }
  }

  public async updateNote(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updated = await notesService.updateNote(req.user!.userId, id, req.body);
      return ResponseHelper.success(res, updated, 'Not güncellendi.');
    } catch (err: any) {
      return ResponseHelper.error(res, err.message, 400);
    }
  }

  public async deleteNote(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await notesService.deleteNote(req.user!.userId, id);
      return ResponseHelper.success(res, null, 'Not silindi.');
    } catch (err: any) {
      return ResponseHelper.error(res, err.message, 400);
    }
  }

  public async getTags(req: Request, res: Response) {
    try {
      const tags = await notesService.getAllTags(req.user!.userId);
      return ResponseHelper.success(res, tags);
    } catch (err: any) {
      return ResponseHelper.error(res, err.message, 400);
    }
  }
}

export const notesController = new NotesController();
