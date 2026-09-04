import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ResponseHelper } from '../utils/response.util';

export const validateRequest = (schema: ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        ResponseHelper.error(res, errors, 422, 'Girdi doğrulama hatası');
        return;
      }
      ResponseHelper.error(res, 'Doğrulanamayan istek.', 400);
    }
  };
};

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction): void => {
  console.error('[Error Middleware]:', err);
  const status = err.status || 500;
  const message = err.message || 'Sunucu içi beklenmeyen bir hata oluştu.';
  ResponseHelper.error(res, message, status);
};
