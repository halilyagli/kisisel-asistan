import { Request, Response } from 'express';
import { adminService } from './admin.service';
import { ResponseHelper } from '../../core/utils/response.util';

export class AdminController {
  public async getSubscribers(_req: Request, res: Response) {
    try {
      const subscribers = await adminService.getSubscribers();
      return ResponseHelper.success(res, subscribers);
    } catch (err: any) {
      return ResponseHelper.error(res, err.message, 400);
    }
  }

  public async getSubscriberDiagnostics(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const diagnostics = await adminService.getSubscriberDiagnostics(
        req.user!.userId,
        req.user!.email,
        id
      );
      return ResponseHelper.success(res, diagnostics);
    } catch (err: any) {
      return ResponseHelper.error(res, err.message, 400);
    }
  }

  public async reSyncUserConnection(req: Request, res: Response) {
    try {
      const { id, connectionId } = req.params;
      const result = await adminService.reSyncUserConnection(
        req.user!.userId,
        req.user!.email,
        id,
        connectionId
      );
      return ResponseHelper.success(res, result, 'Kullanıcının banka verileri uzaktan başarıyla eşitlendi.');
    } catch (err: any) {
      return ResponseHelper.error(res, err.message, 400);
    }
  }

  public async updateUserTier(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { tier } = req.body;
      if (!tier) return ResponseHelper.error(res, 'tier gereklidir', 400);

      const result = await adminService.updateUserTier(
        req.user!.userId,
        req.user!.email,
        id,
        tier
      );
      return ResponseHelper.success(res, result, 'Kullanıcı abonelik planı güncellendi.');
    } catch (err: any) {
      return ResponseHelper.error(res, err.message, 400);
    }
  }

  public async toggleUserSuspension(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { isSuspended, reason } = req.body;

      const result = await adminService.toggleUserSuspension(
        req.user!.userId,
        req.user!.email,
        id,
        Boolean(isSuspended),
        reason
      );
      return ResponseHelper.success(res, result, 'Kullanıcı hesap durumu güncellendi.');
    } catch (err: any) {
      return ResponseHelper.error(res, err.message, 400);
    }
  }

  public async getAuditLogs(_req: Request, res: Response) {
    try {
      const logs = await adminService.getAuditLogs();
      return ResponseHelper.success(res, logs);
    } catch (err: any) {
      return ResponseHelper.error(res, err.message, 400);
    }
  }
}

export const adminController = new AdminController();
