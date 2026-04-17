# GoWorldy - Göç Rehberi Platformu

Yurt dışına çıkmak isteyen kullanıcılar için rehberlik, forum ve danışmanlık platformu.

## Proje Yapısı

```
├── api/          # Backend API (Node.js + Express + TypeScript)
├── mobile/       # Mobil uygulama (React Native + Expo) - yakında
├── admin/        # Admin Dashboard (React) - yakında
├── config/       # Ortam değişkenleri (.env dosyaları)
```

## Hızlı Başlangıç

### 1. API'yi çalıştır

```bash
cd api
npm install
npm run dev
```

API `http://localhost:3000` adresinde çalışır.

### 2. Test et

```bash
# Health check
curl http://localhost:3000/api/health

# Kayıt ol
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"123456","displayName":"Test User"}'
```

## Konfigürasyon

Tüm ayarlar `config/.env.development` dosyasında yönetilir:
- DB_PROVIDER: `sqlite` (local) veya `mongodb` (production)
- Firebase, Stripe, JWT ayarları

## API Endpoints

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| POST | /api/auth/register | Kayıt |
| POST | /api/auth/login | Giriş |
| GET | /api/forum/countries | Ülke listesi |
| GET | /api/forum/countries/:id/categories | Kategoriler |
| GET | /api/forum/categories/:id/topics | Konular |
| POST | /api/forum/topics | Konu aç (auth) |
| GET | /api/forum/topics/:id/comments | Yorumlar |
| POST | /api/forum/topics/:id/comments | Yorum yaz (auth) |
| GET | /api/guide/steps/:countryId | Rehber adımları |
| GET | /api/guide/progress | Kullanıcı ilerlemesi (auth) |
| POST | /api/guide/progress | İlerleme kaydet (auth) |
| POST | /api/payment/checkout | Ödeme başlat (auth) |
