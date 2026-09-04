# Sistem Mimarisi (Architecture Specification)

Bu doküman, Kişisel Asistan SaaS platformunu devralacak kıdemli yazılım mühendisleri, mimarlar ve teknik ekipler için hazırlanmıştır.

---

## 1. Mimari Felsefe: Modüler Monolit (Modular Monolith)

Platformumuz, erken aşamada mikroservislerin getireceği gereksiz ağ gecikmeleri, karmaşık dağıtım süreçleri ve devasa sunucu maliyetlerinden kaçınırken; mikroservis disiplinini kod tabanında koruyan **Modüler Monolit** mimarisiyle inşa edilmiştir.

### Temel Kurallar:
1. **İzolasyon (Decoupling):** Her modül (`auth`, `finance`, `calendar`, `notes`) kendi Controller, Service, Schema ve DTO katmanlarına sahiptir.
2. **Doğrudan Veritabanı Müdahalesi Yasağı:** Bir modül, başka bir modülün veritabanı tablosuna veya iç durumuna (internal state) doğrudan erişemez.
3. **Event-Driven Asenkron Haberleşme:** Modüller arası etkileşim merkezi `EventBus` (`core/events/event-bus.ts`) üzerinden gerçekleşir.
   - Örnek: `Finance` modülünde vadeli bir harcama veya taksit planı oluşturulduğunda `finance.installment.created` eventi fırlatılır.
   - `Calendar` modülü bu eventi arka planda dinler ve kendi ajanda tablosuna kayıt atar. Finans modülü Takvim modülünün varlığından dahi haberdar değildir.

---

## 2. Banka Entegrasyonunda Adapter Pattern

Kişisel Asistan'ın finans modülü, gelecekteki Açık Bankacılık (Open Banking) API'lerine tek satır kod değiştirmeden uyum sağlamak üzere **Adapter Pattern** kullanır:

```text
┌────────────────────────────────────────────────────────┐
│                   FinanceService                       │
└──────────────────────────┬─────────────────────────────┘
                           │ (bağımlılık arayüze yöneliktir)
                           ▼
                  ┌─────────────────┐
                  │  IBankAdapter   │
                  └────────┬────────┘
                           │
        ┌──────────────────┴──────────────────┐
        ▼                                     ▼
┌────────────────────────┐         ┌────────────────────────┐
│ MockTurkishBanksAdapter │         │ LiveOpenBankingAdapter │
│ (Garanti, İş, Akbank)  │         │ (İleride eklenecek)    │
└────────────────────────┘         └────────────────────────┘
```

Herhangi bir Türk veya yabancı banka API'si sisteme eklenirken yalnızca `IBankAdapter` arabirimini (`fetchAccounts`, `fetchTransactions`) uygulayan yeni bir sınıf oluşturulur.

---

## 3. Güvenlik, Oturum ve Multi-Tenant Veri İzolasyonu

- **Multi-Tenant Mantığı:** Tüm veritabanı modellerinde `userId` alanı zorunludur ve foreign key ile `User` tablosuna bağlıdır. Tüm sorgularda kullanıcı kimliği doğrulanarak tenant veri sızıntısı %100 engellenir.
- **Oturum Güvenliği:** 
  - `access_token`: Kısa ömürlü, JWT formatında, API isteklerini imzalar.
  - `refresh_token`: Güvenli, veritabanı destekli, cihaz bazlı iptal edilebilir (token revocation) yapıdadır.
  - `HttpOnly + SameSite=Lax + Secure` çerezler ile XSS ve CSRF saldırılarına karşı korunur.
- **SaaS Abonelik Kapıları (Feature Gating):**
  - `requireSubscription('PRO')` middleware'i ile kurumsal / premium özellikler tek satırda korunur.

---

## 4. Taksitlendirme & Amortisman Motoru (Installment Engine)

Finansal tutarlılık (ACID) gereği, küsuratlı taksit bölmelerinde kuruş artıklarının kaybolmaması esastır:
- Toplam tutar taksit adedine bölünür.
- Kuruş artığı varsa `InstallmentEngine`, son takside bu artığı ekleyerek toplam tutarın eşitliğini kuruşu kuruşuna garanti eder.
- Takvim gün taşmaları (örneğin ayın 31'i olan vadelerin Şubat ayında 28/29'a otomatik çekilmesi) motor tarafından yönetilir.
