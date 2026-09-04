# Yeni Modül Ekleme Kılavuzu (Plug-and-Play Module Guide)

Platformumuz genişletilebilir (pluggable) yapıda tasarlanmıştır. Sisteme yeni bir iş modülü (örneğin: `crm`, `investments`, `habits` veya `ai-agent`) eklemek istediğinizde mevcut modüllere dokunmadan aşağıdaki 4 adımı uygulayınız.

---

### Adım 1: Modül Klasörünü Oluşturun
`backend/src/modules/` dizini altında yeni bir klasör açın:

```text
backend/src/modules/investments/
├── investments.schema.ts      # Zod ile request validation şemaları
├── investments.service.ts     # İş mantığı ve veritabanı sorguları
├── investments.controller.ts  # HTTP istek ve yanıt yönetimi
├── investments.routes.ts      # Express Router tanımları
└── investments.listener.ts    # Diğer modüllerin eventlerini dinleyen dinleyiciler (opsiyonel)
```

---

### Adım 2: Veritabanı Modelini Ekleyin (Gerekirse)
`backend/prisma/schema.prisma` dosyasına yeni modelinizi ekleyin ve `userId` ile kullanıcıya bağlayın:

```prisma
model Investment {
  id        String   @id @default(uuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  symbol    String   // Örn: THYAO, BTC, AAPL
  quantity  Float
  buyPrice  Float
  createdAt DateTime @default(now())

  @@index([userId])
}
```

Terminalde migration'ı çalıştırın:
```bash
npx prisma db push
```

---

### Adım 3: EventBus ile Diğer Modüllerle Konuşun
Diğer modüllere doğrudan import atmak yerine `SystemEvents` üzerinden haberleşin:

```typescript
// backend/src/core/events/event-bus.ts içine yeni eventi ekleyin:
INVESTMENT_PURCHASED: 'investments.asset.purchased'

// investments.service.ts içinde yayınlayın:
eventBus.publish(SystemEvents.INVESTMENT_PURCHASED, {
  userId,
  amount: totalCost,
  symbol,
});
```

Finans modülü bu eventi dinleyerek otomatik harcama kaydı açabilir.

---

### Adım 4: Modülü Sisteme Takın (Plug-in)
`backend/src/app.ts` dosyasına gelin ve tek satırla yeni modülünüzü sisteme bağlayın:

```typescript
import { investmentRoutes } from './modules/investments/investments.routes';

// Rota kaydı:
app.use('/api/investments', investmentRoutes);
```

Tebrikler! Yeni modülünüz mevcut hiçbir kodu bozmadan, tamamen bağımsız olarak canlıya alınmıştır.
