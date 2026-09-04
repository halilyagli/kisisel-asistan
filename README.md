# Kişisel Asistan SaaS Platformu 🚀

> Zaman içinde ölçeklenecek, **modüler (plug-and-play)** mimariye sahip, abonelik tabanlı (**SaaS**) akıllı kişisel finans ve asistan web platformu.

---

## 🌟 Proje Özeti & Temel Değer Önerisi

Bu platform, bağımsız bir marka çatısı altında, kendi sunucusunda (self-hosted / VPS / Cloud) barınacak şekilde tasarlanmış ticari bir SaaS ürünüdür.

- **Tek Tıkla Açık Bankacılık Senkronizasyonu:** Banka hesaplarını (Garanti BBVA, İş Bankası, Akbank vb.) simülatif açık bankacılık servis katmanıyla anında eşitler.
- **Akıllı Taksitlendirme & Amortisman Motoru:** Yapılan harcamaları istenilen aya böler, kalan taksit borçlarını hesaplar ve **Takvim modülü ile otomatik senkronize ederek** vadesi gelen taksitleri kullanıcı ajandasına işler.
- **Tak-Çıkar (Plug-and-Play) Modüler Mimari:** Yeni bir modül (CRM, Yapay Zeka Danışmanı, Sağlık, Alışkanlık Takibi) eklendiğinde mevcut modülleri bozmayacak şekilde gevşek bağlıdır (Event-Driven decoupled architecture).
- **Geliştirici Ekibine Doğrudan Devredilebilir:** Kurumsal standartlarda dokümantasyon (`docs/`), tip güvenliği (TypeScript) ve Docker altyapısı ile donatılmıştır.

---

## 🏗️ Mimari ve Teknoloji Yığını

| Katman | Teknoloji | Amaç |
| :--- | :--- | :--- |
| **Backend** | **Node.js & Express (TypeScript)** | Modüler REST API, Clean Architecture, EventBus |
| **Frontend** | **React 18 + Vite + Tailwind CSS** | Yüksek performanslı modern SaaS Dashboard |
| **Veritabanı & ORM** | **Prisma ORM (SQLite / PostgreSQL)** | ACID finansal tutarlılık, multi-tenant kullanıcı izolasyonu |
| **Açık Bankacılık** | **Adapter Pattern** | Gelecekteki tüm Open Banking API'lerine hazır soyutlama |
| **Konteynerizasyon** | **Docker & Docker Compose** | PostgreSQL 16 + Redis 7 + Nginx ile tek tıkla canlıya alma |

---

## ⚡ Hızlı Başlangıç

### 1. Geliştirme Sunucularını Başlatma

```bash
# 1. Backend'i çalıştırın
cd backend
npm run dev

# 2. Frontend'i çalıştırın (ayrı bir terminalde)
cd frontend
npm run dev
```

- Web Arayüzü: `http://localhost:3000`
- REST API: `http://localhost:5000/api`
- Sağlık Kontrolü: `http://localhost:5000/api/health`

### 2. Demo Giriş Bilgileri

Giriş ekranındaki **"Hazır Demo Hesabı ile Tek Tıkla Giriş"** butonuna basarak veya aşağıdaki bilgilerle oturum açabilirsiniz:
- **E-Posta:** `demo@asistan.com`
- **Şifre:** `Password123!`

---

## 📚 Dokümantasyon

- [Sistem Mimarisi ve Tasarım İlkeleri](docs/ARCHITECTURE.md)
- [Yeni Modül Ekleme Kılavuzu (Plug-and-Play)](docs/MODULE_GUIDE.md)
- [Veritabanı Şeması & Veri Sözlüğü](docs/DATABASE_SCHEMA.md)
- [Yazılımcı Ekibi Devir Rehberi](docs/HANDOVER_DEVELOPER_GUIDE.md)
