# Veritabanı Şeması & Veri Sözlüğü (Database Data Dictionary)

Platformumuz çift veritabanı desteği ile çalışır:
- **Geliştirme / Demo Ortamı:** SQLite (`backend/prisma/dev.db`) — sıfır konfigürasyon, hızlı geliştirme.
- **Canlı / Prodüksiyon Ortamı:** PostgreSQL 16 (`backend/prisma/schema.postgres.prisma`) — ACID uyumlu, yüksek eşzamanlılık.

---

## 1. Varlık İlişki Şeması (ER Diagram)

```text
┌─────────────────┐
│      User       │
└────────┬────────┘
         │ 1:N
         ├───► RefreshToken (Oturum / Token Revocation)
         │
         ├───► Account (Banka, Kredi Kartı, Nakit Cüzdan)
         │        │ 1:N
         │        └───► Transaction (Gelir / Gider / Transfer)
         │
         ├───► Category (Kira, Fatura, Market, Maaş vb.)
         │        │ 1:N
         │        └───► Transaction
         │
         ├───► InstallmentPlan (Taksitlendirme & Borç Takibi)
         │        │ 1:N
         │        └───► Transaction (Taksit 1/6, Taksit 2/6...)
         │
         ├───► CalendarEvent (Takvim & Finansal Vade Senkronu)
         │
         └───► Note (Notlar, Etiketler, Fikirler)
```

---

## 2. Tablo Tanımları

### `User` Tablosu
Kullanıcı kimlik, yetkilendirme ve SaaS abonelik durumunu tutar.
- `id` (UUID, PK): Kullanıcı benzersiz kimliği.
- `email` (String, Unique): Giriş e-posta adresi.
- `passwordHash` (String): Bcrypt ile şifrelenmiş parola.
- `fullName` (String): Ad Soyad.
- `subscriptionTier` (`FREE` | `PRO` | `ENTERPRISE`): Aktif abonelik paketi.
- `subscriptionStatus` (`ACTIVE` | `PAST_DUE` | `CANCELED`): Abonelik geçerlilik durumu.
- `subscriptionEndsAt` (DateTime): Plan yenilenme / bitiş tarihi.

### `Account` Tablosu
Kullanıcının varlık hesaplarını temsil eder.
- `type` (`BANK` | `CREDIT_CARD` | `CASH` | `INVESTMENT`).
- `balance` (Decimal/Float): Güncel bakiye (kredi kartlarında negatif borç olarak tutulur).
- `provider` (`MANUAL` | `MOCK_OPEN_BANKING` | `LIVE_OPEN_BANKING`).
- `lastSyncedAt` (DateTime): Açık bankacılıktan son senkronizasyon anı.

### `InstallmentPlan` Tablosu
Taksitli harcamaların amortisman ve vade durumunu yönetir.
- `totalAmount`: Toplam borç tutarı.
- `totalInstallments`: Toplam taksit adedi (Örn: 6).
- `remainingInstallments`: Kalan taksit adedi (Örn: 5).
- `installmentAmount`: Aylık taksit tutarı.
- `nextDueDate`: Bir sonraki taksit ödeme vadesi (Takvime işlenir).
- `status` (`ACTIVE` | `COMPLETED` | `CANCELLED`).

### `CalendarEvent` Tablosu
Ajanda ve hatırlatıcı kayıtları.
- `sourceModule`: `CALENDAR` (kullanıcının kendi girdiği) veya `FINANCE` (taksit motorundan otomatik gelen).
- `sourceEntityId`: Finans taksit planının ID referansı.
- `reminderMinutes`: Vadeden kaç dakika önce bildirim tetikleneceği.

### `Note` Tablosu
Not defteri kayıtları.
- `tags`: Virgülle ayrılmış etiketler (Örn: `pazarlama,strateji`).
- `isPinned`: Üste sabitleme bayrağı.
