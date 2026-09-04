import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import { config } from './core/config/env.config';
import { errorHandler } from './core/middleware/error.middleware';
import { ResponseHelper } from './core/utils/response.util';

// Modül Rotaları
import { authRoutes } from './modules/auth/auth.routes';
import { financeRoutes } from './modules/finance/finance.routes';
import { calendarRoutes } from './modules/calendar/calendar.routes';
import { notesRoutes } from './modules/notes/notes.routes';
import adminRoutes from './modules/admin/admin.routes';

// Event Dinleyicileri
import { registerCalendarListeners } from './modules/calendar/calendar.listener';

export function createApp(): Express {
  const app = express();

  // 1. Temel Güvenlik ve Yardımcı Middleware'ler
  app.use(helmet());
  app.use(cors({
    origin: (origin, callback) => {
      // Geliştirme ortamında veya izin verilen domainlerde serbest bırak
      if (!origin || config.corsOrigin.includes(origin) || !config.isProduction) {
        callback(null, true);
      } else {
        callback(new Error('CORS kısıtlaması: Bu kökene erişim izni yok.'));
      }
    },
    credentials: true,
  }));
  app.use(cookieParser());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  if (config.nodeEnv !== 'test') {
    app.use(morgan('dev'));
  }

  // 2. Modüller Arası Event Dinleyicilerini Başlat
  registerCalendarListeners();

  // 3. Sağlık ve Sistem Bilgisi (Health Check)
  app.get('/api/health', (req: Request, res: Response) => {
    ResponseHelper.success(res, {
      status: 'UP',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      modules: ['auth', 'finance', 'calendar', 'notes', 'admin'],
      environment: config.nodeEnv,
    }, 'Kişisel Asistan SaaS Platformu Aktif ve Sağlıklı');
  });

  // 4. Modülleri Tak-Çıkar (Plug-and-Play) Olarak Kaydet
  app.use('/api/auth', authRoutes);
  app.use('/api/finance', financeRoutes);
  app.use('/api/calendar', calendarRoutes);
  app.use('/api/notes', notesRoutes);
  app.use('/api/admin', adminRoutes);

  // 5. Bilinmeyen Rota (404) Yakalayıcı
  app.use((req: Request, res: Response) => {
    ResponseHelper.error(res, `Aradığınız uç nokta (${req.originalUrl}) bulunamadı.`, 404);
  });

  // 6. Merkezi Hata Yönetimi
  app.use(errorHandler);

  return app;
}
