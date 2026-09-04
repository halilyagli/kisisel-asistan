import { Request, Response, NextFunction } from 'express';
import { SecurityUtil, TokenPayload } from '../utils/jwt.util';
import { ResponseHelper } from '../utils/response.util';

// Express Request nesnesine user tipini ekle
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

export const authenticateJwt = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;
    let token = '';

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.cookies && req.cookies.access_token) {
      token = req.cookies.access_token;
    }

    if (!token) {
      ResponseHelper.error(res, 'Yetkilendirme jetonu bulunamadı. Lütfen giriş yapın.', 401);
      return;
    }

    const decoded = SecurityUtil.verifyToken<TokenPayload>(token);
    req.user = decoded;
    next();
  } catch (error: any) {
    ResponseHelper.error(res, 'Geçersiz veya süresi dolmuş oturum jetonu.', 401);
  }
};

/**
 * Abonelik Seviyesi Kontrol Middleware'i (SaaS Feature Gate)
 * Örnek: requireSubscription('PRO')
 */
export const requireSubscription = (minTier: 'FREE' | 'PRO' | 'ENTERPRISE') => {
  const tierWeight: Record<string, number> = {
    FREE: 0,
    PRO: 1,
    ENTERPRISE: 2,
  };

  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      ResponseHelper.error(res, 'Yetkisiz erişim.', 401);
      return;
    }

    const userTier = req.user.subscriptionTier || 'FREE';
    if ((tierWeight[userTier] ?? 0) < (tierWeight[minTier] ?? 0)) {
      ResponseHelper.error(
        res,
        `Bu özellik için en az ${minTier} abonelik planı gereklidir. Lütfen planınızı yükseltin.`,
        403
      );
      return;
    }

    next();
  };
};

/**
 * Rol Tabanlı Yetkilendirme Middleware'i (RBAC)
 * Örnek: requireRole(['ADMIN', 'SUPPORT'])
 */
export const requireRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      ResponseHelper.error(res, 'Yetkisiz erişim.', 401);
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      ResponseHelper.error(
        res,
        'Bu panele veya işleme erişim yetkiniz bulunmamaktadır (Sadece Sistem Yöneticisi & Müşteri Temsilcisi).',
        403
      );
      return;
    }

    next();
  };
};
