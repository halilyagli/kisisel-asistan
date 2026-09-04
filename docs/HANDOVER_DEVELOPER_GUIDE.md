# Yazılımcı Ekibi Devir & Kurulum Rehberi (Developer Handover Guide)

Değerli Geliştirici, Kişisel Asistan SaaS platformuna hoş geldiniz! Bu proje, temiz kod (clean code), kurumsal tip güvenliği (TypeScript strict mode) ve modüler tak-çıkar mimari prensipleriyle geliştirilmiştir.

---

## 🚀 Hızlı Başlangıç (Geliştirme Ortamı)

### 1. Gereksinimler
- Node.js 20+ (veya 24 LTS)
- npm veya pnpm

### 2. Projeyi Çalıştırma

**Backend'i Başlatma:**
```bash
cd backend
npm install
npm run dev
# API: http://localhost:5000/api
# Sağlık Kontrolü: http://localhost:5000/api/health
```

**Frontend'i Başlatma:**
```bash
cd frontend
npm install
npm run dev
# Web Uygulaması: http://localhost:3000
```

---

## 🔑 Hazır Demo Test Hesabı

Veritabanını örnek verilerle doldurmak için:
```bash
cd backend
npm run db:seed
```

Demo Giriş Bilgileri:
- **E-Posta:** `demo@asistan.com`
- **Şifre:** `Password123!`
- **Abonelik:** `PRO`

---

## 📁 Proje Dizin Hiyerarşisi

```text
├── backend/                   # Node.js + Express + Prisma REST API
│   ├── src/
│   │   ├── core/              # Çekirdek alt yapı (Config, DB, EventBus, JWT, Middleware)
│   │   ├── modules/           # Tak-çıkar bağımsız iş modülleri
│   │   │   ├── auth/          # Kimlik doğrulama, kullanıcı profili, SaaS plan kontrolü
│   │   │   ├── finance/       # Gelir/gider, taksit motoru, açık bankacılık adaptörü
│   │   │   ├── calendar/      # Ajanda, anımsatıcılar, finans vadesi senkronu
│   │   │   └── notes/         # Etiketli, aranabilir notlar
│   │   ├── app.ts             # Express uygulama yapılandırması & modül kaydı
│   │   └── server.ts          # HTTP sunucu başlatıcı
│   └── prisma/                # SQLite & PostgreSQL şemaları
├── frontend/                  # React 18 + Vite + Tailwind CSS SPA
│   ├── src/
│   │   ├── components/        # Sidebar, Header, UI bileşenleri
│   │   ├── context/           # Auth & Session state yönetimi
│   │   ├── services/          # Tip güvenli REST API istemcisi
│   │   └── views/             # Dashboard, Finance, Calendar, Notes, Settings görünümleri
├── docker/                    # PostgreSQL 16 + Redis 7 + Nginx üretim ortamı
└── docs/                      # Mimari ve teknik dokümantasyon
```

---

## 🚢 Prodüksiyon (Canlı VPS) Kurulumu

Projeyi Docker ile tek komutla ayağa kaldırmak için:
```bash
cd docker
docker-compose up -d --build
```
Bu komut PostgreSQL 16, Redis 7, Backend ve Nginx destekli Frontend konteynerlerini otomatik olarak ayağa kaldırır.
