import { Router } from 'express';
import { notesController } from './notes.controller';
import { authenticateJwt } from '../../core/middleware/auth.middleware';
import { validateRequest } from '../../core/middleware/error.middleware';
import { CreateNoteSchema, UpdateNoteSchema } from './notes.schema';

const router = Router();

router.use(authenticateJwt);

router.get('/', notesController.getNotes);
router.get('/tags', notesController.getTags);
router.post('/', validateRequest(CreateNoteSchema), notesController.createNote);
router.put('/:id', validateRequest(UpdateNoteSchema), notesController.updateNote);
router.delete('/:id', notesController.deleteNote);

export const notesRoutes = router;
