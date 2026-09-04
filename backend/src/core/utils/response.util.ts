import { Response } from 'express';

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string | any;
  timestamp: string;
}

export class ResponseHelper {
  public static success<T>(res: Response, data: T, message?: string, statusCode: number = 200): Response {
    const payload: ApiResponse<T> = {
      success: true,
      message,
      data,
      timestamp: new Date().toISOString(),
    };
    return res.status(statusCode).json(payload);
  }

  public static error(res: Response, error: string | any, statusCode: number = 400, message?: string): Response {
    const payload: ApiResponse = {
      success: false,
      message: message || 'Bir hata oluştu',
      error: typeof error === 'string' ? error : error?.message || error,
      timestamp: new Date().toISOString(),
    };
    return res.status(statusCode).json(payload);
  }
}
