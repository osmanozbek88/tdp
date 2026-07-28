
# TDP — Telekom Dağıtım Platformu (Telecom Distribution Platform)

TDP, eSIM ve mobil veri ürünlerinin dağıtımını yönetmek için geliştirilmiş,
**çok kiracılı (multi-tenant)** ve **rol tabanlı yetkilendirmeli (RBAC)** bir
web uygulamasıdır. Distribütör → bayi → alt bayi → müşteri hiyerarşisi ile
telekom ürünlerinin satış, sipariş ve aktivasyon süreçlerini tek bir panel
üzerinden yönetmeyi sağlar.

---

## Amaç

- eSIM profillerinin **ICCID, IMSI, EID, MSISDN** gibi telekom standartlarına
  (GSMA SGP.22, ITU-T E.118) uygun şekilde yönetimi
- Distribütör, bayi, alt bayi ve müşteri katmanlarında sipariş ve stok takibi
- **Provider soyutlama katmanı** sayesinde farklı telekom operatörleriyle
  (Telna vb.) entegrasyon
- Webhook, kullanım kaydı (CDR), faturalama ve abone yaşam döngüsü yönetimi
- Rol tabanlı erişim kontrolü ile güvenli operasyon

---

## Teknoloji Yığını

| Katman         | Kullanılan Teknolojiler                          |
|----------------|--------------------------------------------------|
| **Frontend**   | React 18, Next.js 14 (App Router), Tailwind CSS, shadcn/ui, Lucide |
| **Backend**    | Next.js API Routes, TypeScript 5.7               |
| **Veritabanı** | PostgreSQL (Supabase / Docker), Prisma ORM       |
| **Auth**       | JWT (jose), bcryptjs, Refresh Token rotasyonu, MFA (TOTP) |
| **Loglama**    | Pino + pino-pretty                                |
| **Validasyon** | Zod                                              |
| **Provider**   | Interface/Adapter/Factory pattern, FakeProvider (geliştirme/test) |

---

## Proje Yapısı

```
src/
├── app/
│   ├── api/
│   │   ├── auth/          # Kimlik doğrulama (login, MFA, email verify, şifre sıfırlama)
│   │   ├── dashboard/     # Dashboard istatistik API'si (FAZ 5)
│   │   ├── health/        # Sağlık kontrolü endpoint'i
│   │   ├── provider/      # Provider test endpoint'i (plan listesi)
│   │   └── v1/            # REST API v1
│   │       ├── customers/      # Müşteri CRUD + detay
│   │       ├── distributors/   # Distribütör CRUD
│   │       ├── dealers/        # Bayi CRUD
│   │       ├── sub-dealers/    # Alt bayi CRUD
│   │       ├── employees/      # Personel CRUD
│   │       ├── price-groups/   # Fiyat grubu CRUD
│   │       ├── audit-logs/     # İşlem logları
│   │       └── support-tickets/# Destek talepleri
│   └── dashboard/
│       ├── admin/             # Yetki yönetimi paneli
│       ├── organization/      # Firma/bayi yönetimi (6 sekme)
│       ├── customers/[id]/    # Müşteri detay profili (5 sekme)
│       └── reports/           # Raporlar
├── components/
│   ├── layout/            # Sidebar, Header
│   ├── theme-provider.tsx  # Dark/light tema desteği
│   └── ui/                # shadcn/ui bileşenleri (Button, Card, Table, Badge vb.)
├── config/
│   └── env.ts             # Ortam değişkenleri (PROVIDER_TYPE, DATABASE_URL vb.)
├── hooks/
│   └── use-mobile.ts      # Mobil cihaz algılama hook'u
└── lib/
    ├── auth/              # JWT, permission guard, permission service/repository
    │   └── with-permission.ts  # Route handler permission wrapper (FAZ 3)
    ├── audit.ts           # İşlem loglama yardımcıları (FAZ 7)
    ├── provider/          # Provider soyutlama katmanı (FAZ 4)
    │   ├── types.ts           # GSMA uyumlu DTO'lar
    │   ├── dto.ts             # Luhn, ICCID, IMSI, EID, MSISDN, SGP.22 yardımcıları
    │   ├── provider-interface.ts  # 18 metotlu Provider arayüzü
    │   ├── base-provider.ts   # Abstract sınıf, public wrapper'lar
    │   ├── fake-provider.ts   # FakeProvider (GSMA state machine, webhook, billing stub)
    │   ├── factory.ts         # Singleton provider factory
    │   ├── health-check.ts    # Periyodik sağlık kontrolü (30sn)
    │   └── errors.ts          # Provider hata sınıfları
    ├── prisma.ts          # Prisma singleton client
    ├── repository.ts      # Generic BaseRepository
    ├── logger.ts          # Pino logger
    ├── errors.ts          # AppError, NotFoundError
    └── config.ts          # Ortam değişkeni okuma yardımcıları

prisma/
├── schema.prisma          # Veritabanı şeması
├── seed.ts                # Seed script (örnek veri)
└── migrations/            # Migration dosyaları
```

---

## Veri Modeli

### Organizasyon Hiyerarşisi
**Tenant → Distributor → Dealer → SubDealer → Customer**

Tüm siparişler (`Order`), hangi distribütör/bayi/alt bayi üzerinden geldiğini
takip edecek şekilde ilişkilendirilmiştir.

### Ana Tablolar
| Tablo | Açıklama |
|-------|----------|
| `Tenant` | Çok kiracılı yapı — her organizasyon ayrı tenant |
| `Distributor`, `Dealer`, `SubDealer` | Dağıtım kanalı hiyerarşisi |
| `User` | Kullanıcılar (9 farklı rol), MFA desteği |
| `Customer` | Son müşteriler |
| `Product` | Ürün kataloğu (eSIM, data bundle, voice, top-up) |
| `Order` / `OrderItem` | Sipariş ve kalemleri |
| `Payment` | Ödeme kayıtları |
| `ESim` | eSIM profilleri (ICCID, IMSI, MSISDN, aktivasyon kodu) |
| `UsageRecord` | Kullanım/CDR kayıtları |
| `WebhookLog` | Telna webhook logları |
| `ProviderStatus` | Provider sağlık kontrolü sonuçları |
| `AuditLog` | Denetim logları |
| `SupportTicket` | Destek talepleri |
| `Permission` / `RolePermission` | RBAC yetki matrisi |

---

## Dashboard

`GET /api/dashboard` endpoint'i ve `/dashboard` sayfası ile anlık iş verisi sunar:

| Widget | Veri Kaynağı |
|--------|-------------|
| Günlük / Aylık Satış | Tamamlanmış siparişler üzerinden anlık ciro |
| Sipariş Sayısı | Bugün/Bu ay toggle ile seçilebilir |
| Bayi Sayısı | Tüm dağıtım kanalı toplamı |
| Müşteri Sayısı | Kayıtlı müşteri sayısı |
| Gelir | Bugün/Bu ay toggle ile filtrelenebilir |
| Son Siparişler | Son 15 sipariş detayı |
| Provider Durumu | Operatör sağlık kontrolü (gecikme, uptime, yeşil/sarı/kırmızı rozet) |

## Organizasyon Yönetimi

`/dashboard/organization` sayfasında 6 sekme ile tüm hiyerarşi yönetilir:
Distribütörler, Bayiler, Alt Bayiler, Personel, Fiyat Grupları, Müşteriler.
Her sekmede arama, Aktif/Pasif/Tümü filtresi, ekleme/düzenleme modal formu,
durum değiştirme ve silme işlemleri mevcuttur.

## Müşteri Profili (CRM)

`/dashboard/customers/[id]` sayfasında 5 sekmeli müşteri profili:
**Profil** (iletişim + organizasyon), **Siparişler** (sipariş geçmişi),
**eSIM'ler** (ICCID, IMSI, durum), **Destek Talepleri** (liste + oluşturma),
**İşlem Logları** (audit trail).

---

## Provider Katmanı

Dış operatör entegrasyonu **Interface/Adapter/Factory** pattern'i ile soyutlanmıştır:

```
Provider (interface)
 └── BaseProvider (abstract)
      ├── FakeProvider     ← Geliştirme/test
      └── TelnaProvider    ← Üretim
```

Desteklenen telekom standartları ve özellikler:

- **GSMA state machine**: `RELEASED → DOWNLOADED → INSTALLED → ENABLED → DISABLED → DELETED`
- **Luhn algoritması** ile ICCID/IMSI/EID/MSISDN doğrulama
- **SGP.22** formatında eSIM aktivasyon kodu yönetimi
- **HMAC-SHA256** ile webhook imzalama
- Subscriber yönetimi, faturalama, kullanım/CDR kaydı

Aktif provider `.env` dosyasında `PROVIDER_TYPE` ile belirlenir (`fake` veya `telna`).

---

## Kurulum ve Çalıştırma

### 1. Bağımlılıkları yükle
```bash
npm install
```

### 2. Ortam değişkenlerini ayarla
`.env.example` dosyasını `.env` olarak kopyala, gerekli değişkenleri doldur:
```bash
cp .env.example .env
```

**Kritik değişkenler:**
| Değişken | Açıklama | Varsayılan |
|----------|----------|-----------|
| `DATABASE_URL` | PostgreSQL bağlantı adresi | - |
| `AUTH_SECRET` | JWT imzalama anahtarı (en az 32 karakter) | - |
| `PROVIDER_TYPE` | Aktif provider | `fake` |
| `LOG_LEVEL` | Log seviyesi | `info` |

### 3. Veritabanını hazırla
```bash
npx prisma migrate dev     # Migration'ları uygula
npx prisma db seed         # (opsiyonel) Örnek verileri yükle
```

### 4. Uygulamayı başlat
```bash
npx next dev -p 3005 -H 0.0.0.0
```
Tarayıcıdan `http://localhost:3005` adresine git.

### Docker ile PostgreSQL
```bash
npm run docker:up          # PostgreSQL'i başlat
```

---

## Kimlik Doğrulama

- **JWT tabanlı**: Access token (kısa ömürlü) + Refresh token (uzun ömürlü, rotasyonlu)
- **MFA**: TOTP ve Email tabanlı 2 faktörlü doğrulama
- **Email doğrulama**: Kayıt sonrası email onay akışı
- **Şifre sıfırlama**: Email tabanlı güvenli sıfırlama akışı
- **9 farklı rol**: `SUPER_ADMIN` ... `CUSTOMER`, her rolde farklı yetki seviyesi

---

## Lisans

Private — Tüm hakları saklıdır.

