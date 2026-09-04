import { PrismaClient } from '@prisma/client';

// Tekil (Singleton) Prisma Client örneği
export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// Uygulama kapandığında veritabanı bağlantısını güvenle sonlandır
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});
