import { Router } from 'express';
import { adminController } from './admin.controller';
import { authenticateJwt, requireRole } from '../../core/middleware/auth.middleware';

const router = Router();

// Yalnızca Sistem Yöneticisi (ADMIN) ve Müşteri Hizmetleri / Destek (SUPPORT) personeli erişebilir
router.use(authenticateJwt);
router.use(requireRole(['ADMIN', 'SUPPORT']));

// Abone Yönetimi & Teşhis Listesi
router.get('/subscribers', adminController.getSubscribers);
router.get('/subscribers/:id/diagnostics', adminController.getSubscriberDiagnostics);

// Müşteri Temsilcisi İşlemleri (Sorun Çözme & Müdahale)
router.post('/subscribers/:id/sync/:connectionId', adminController.reSyncUserConnection);
router.put('/subscribers/:id/tier', adminController.updateUserTier);
router.put('/subscribers/:id/suspension', adminController.toggleUserSuspension);

// KVKK Denetim Geçmişi (Audit Logs)
router.get('/audit-logs', adminController.getAuditLogs);

export default router;
