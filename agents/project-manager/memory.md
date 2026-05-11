# Project Manager Memory

## Key Decisions
- Mobile app is the primary product; admin dashboard is secondary.
- SQLite used for local dev — no need for MongoDB setup during development phase.
- Forum pricing model: pay-per-action (not paywalled reading), except comment access.
- Topics require approval to keep content quality high.
- Google Sign-In: `google-auth-library` (OAuth2Client.verifyIdToken) kullanılıyor, Firebase Admin SDK değil. Firebase.ts sadece push notif için tutuldu.
- Topic oluşturma: admin/mod → anında yayın (status=approved); normal user → kredi kontrolüne tabi (kredi sistemi tamamlanana kadar 402 bloke).
- Kredi maliyeti kararı: konu açma = 10 kredi (merkezi sabit, `api/src/config/` altında tutulacak).

## Stakeholder Priorities (as understood)
1. Get auth + mobile navigation working first. ✅ DONE
2. Forum is the highest-engagement feature — prioritize after auth. ✅ DONE
3. Rehberim (guide) differentiates the product from generic forums. ✅ DONE
4. Admin dashboard can be minimal for MVP — just user roles + topic approval queue. 🔴 NOT STARTED
5. Kredi + premium backend: en kritik eksik, gerçek para akışını bloke ediyor.

## Completed Phases (2026-05-10)
- **Phase 1** (Auth + Nav): Login / Register / ForgotPassword / ResetPassword / GoogleSignIn + bottom tab nav — tümü tamamlandı.
- **Phase 2** (Guide): Ülke listesi API'dan, adım modal, progress kaydetme — tamamlandı.
- **Phase 3** (Forum): Countries → Categories → Topics → Detail + CreateTopic — tamamlandı. Role-aware paywall UI + backend.

## In-Progress / Partial
- **Phase 4** (Profile & Notifications): Profile + stats gerçek API'ye bağlı ✅. Notification toggle'lar frontend-only ❌. Activity feed placeholder ❌. ProfileScreen settings menüsü tıklanabilir değil ❌.
- **Phase 5** (Premium & Payments): UI tamam (PremiumScreen gerçek kredi bakiyesini gösteriyor ✅). Backend kredi düşme mekanizması yok ❌. Stripe Checkout gerçek priceId olmadan çalışmaz ❌.

## Active Sprint (2026-05-11) — Tamamlanma: %0 / 5 Ana Görev

### Developer Görevleri
| # | Görev | Durum | Notlar |
|---|-------|-------|--------|
| D1 | Premium kredi akışı (forum createTopic kredi kontrolü + mobile modal) | ❌ Başlamadı | Backend `deductCredits()` yok; sabitler dosyası yok; mobile modal yok |
| D2 | Rehber koşullu adım akışı (`blockingAnswer` + accordion UI) | ❌ Başlamadı | DB kolonu yok; mobile accordion yok |
| D3 | Profil butonları tıklanabilir + PrivacyScreen + telefon toggle | ❌ Başlamadı | `phoneNumber`/`sharePhoneNumber` DB kolonu yok; PrivacyScreen yok |

### UX/UI Görevleri
| # | Görev | Durum | Notlar |
|---|-------|-------|--------|
| U1 | Kredi modal + Rehber accordion + Gizlilik ekranı tasarım polish | ❌ Başlamadı | Developer çalışması bitince paralel yürüyecek |
| U2 | theme.ts token'larını tüm değiştirilen ekranlara uygula | ❌ Başlamadı | Hiçbir ekran şu an theme.ts import etmiyor |

### PrivacyScreen Tam Scope (yeni keşfedilen alt görevler)
- `users` tablosuna `phoneNumber TEXT` ve `sharePhoneNumber INTEGER DEFAULT 1` kolonları (idempotent migration)
- `IUserRepository.update` interface'ine bu alanlar düşecek
- `PATCH /users/me` route'u bu alanları kabul edecek şekilde genişleyecek
- Mobile'da yeni `PrivacyScreen.tsx` (telefon toggle en az, ileride genişletilebilir)
- ProfileScreen settings "Gizlilik" satırı → PrivacyScreen navigate

## Critical Gaps (P0)
1. **Kredi sistemi backend** — `users.credits` column var ✅; `deductCredits()` yöntemi ve `createTopic` kredi kontrolü yok ❌. Bu olmadan gerçek para akışı yok.
2. **Premium üyelik backend** — `users.isPremium + premiumUntil` column var ✅; Stripe webhook entegrasyonu ve premium'da topic açma ücretsiz mantığı yok ❌.
3. **Admin Dashboard scaffold** — Topic approval queue olmadan moderasyon manuel; içerik kalitesi riski.

## Resolved Debates
- **Google Sign-In backend**: Firebase Admin SDK → `google-auth-library` ile değiştirildi. Daha az dep, daha basit.
- **Forum topic görünürlük**: Pending topic'ler listede gizliydi → author kendi pending'ini badge ile görüyor (UX iyileştirmesi).
- **Topic oluşturma rolü**: Admin/mod auto-publish; user için kredi düşme mekanizması (D1 görevi tamamlanınca 402 bloke kalkacak).

## Open Questions
- **Push notifications**: Firebase FCM mi, Expo Notifications mı? (Karar verilmedi)
- **Avatar**: Kamera rulo upload mu, URL input mu? (MVP için URL input önerildi)
- **App store hedefi**: App Store, Google Play, ikisi birden? (Belirsiz)
- **E-posta servisi**: Reset token e-postası için SendGrid mi, SES mi? (Şu an console.log)
- **Seed verisi dışındaki ortamlar**: Prod'da seed nasıl çalışacak? (Belirsiz)
- **PrivacyScreen genişleme**: Telefon paylaşım toggle'ının ötesinde hangi gizlilik ayarları MVP kapsamında? (Belirsiz)
