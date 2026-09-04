import { createApp } from './app';
import { config } from './core/config/env.config';
import { BankingSyncJob } from './core/jobs/banking-sync.job';

const app = createApp();

const server = app.listen(config.port, '0.0.0.0', () => {
  // Açık Bankacılık Otomatik Arka Plan Senkronizasyonunu Başlat
  BankingSyncJob.start();

  console.log(`
=========================================================
🚀 KİŞİSEL ASİSTAN SAAS PLATFORMU (BACKEND API)
=========================================================
📡 Port:         ${config.port}
🌍 Ortam:        ${config.nodeEnv}
📦 Modüller:     [Auth, Finance, Calendar, Notes]
🛡️  Güvenlik:     JWT + HttpOnly Cookie + Helmet + CORS
💾 Veritabanı:   Prisma ORM (SQLite / PostgreSQL Hazır)
🔄 Açık Bankacılık: BKM Uyumlu Otomatik Senkronizasyon (Aktif)
=========================================================
Sağlık Kontrolü: http://localhost:${config.port}/api/health
=========================================================
  `);
});

// Hataları ve çıkış sinyallerini yakala
process.on('SIGTERM', () => {
  console.log('SIGTERM sinyali alındı. Sunucu kapatılıyor...');
  server.close(() => {
    console.log('HTTP sunucusu kapatıldı.');
    process.exit(0);
  });
});
