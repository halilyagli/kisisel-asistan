import { Request, Response } from 'express';
import { authService } from './auth.service';
import { ResponseHelper } from '../../core/utils/response.util';

export class AuthController {
  public async register(req: Request, res: Response) {
    try {
      const result = await authService.register(req.body);

      // HttpOnly secure cookie ayarla
      res.cookie('access_token', result.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000,
      });

      return ResponseHelper.success(res, result, 'Kayıt işlemi başarıyla tamamlandı.', 201);
    } catch (err: any) {
      return ResponseHelper.error(res, err.message, 400);
    }
  }

  public async login(req: Request, res: Response) {
    try {
      const result = await authService.login(req.body);

      res.cookie('access_token', result.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000,
      });

      return ResponseHelper.success(res, result, 'Giriş başarılı.');
    } catch (err: any) {
      return ResponseHelper.error(res, err.message, 401);
    }
  }

  public async logout(req: Request, res: Response) {
    res.clearCookie('access_token');
    return ResponseHelper.success(res, null, 'Başarıyla çıkış yapıldı.');
  }

  public async refreshToken(req: Request, res: Response) {
    try {
      const token = req.body.refreshToken || req.cookies.refresh_token;
      if (!token) {
        return ResponseHelper.error(res, 'Refresh token bulunamadı.', 400);
      }
      const result = await authService.refreshToken(token);
      return ResponseHelper.success(res, result, 'Token başarıyla yenilendi.');
    } catch (err: any) {
      return ResponseHelper.error(res, err.message, 401);
    }
  }

  public async getProfile(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;
      const user = await authService.getProfile(userId);
      return ResponseHelper.success(res, user);
    } catch (err: any) {
      return ResponseHelper.error(res, err.message, 404);
    }
  }

  public async updateProfile(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;
      const updated = await authService.updateProfile(userId, req.body);
      return ResponseHelper.success(res, updated, 'Profil güncellendi.');
    } catch (err: any) {
      return ResponseHelper.error(res, err.message, 400);
    }
  }

  public async changeTier(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;
      const updated = await authService.changeTier(userId, req.body);
      return ResponseHelper.success(res, updated, 'Abonelik planı güncellendi.');
    } catch (err: any) {
      return ResponseHelper.error(res, err.message, 400);
    }
  }
}

export const authController = new AuthController();
