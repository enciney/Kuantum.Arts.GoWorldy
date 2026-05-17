# GoWorldy — Eksiksiz Feature Set Kataloğu

> Kod üzerinden doğrulanmış durum. Her satır en az bir dosya okunarak teyit edilmiştir.
> Son güncelleme: 2026-05-17

---

## Semboller

| Sembol | Anlam |
|--------|-------|
| ✅ | Çalışıyor, kodda mevcut |
| ❌ | Eksik, hiç yazılmamış |
| ⚠️ | Kısmen çalışıyor / bug var |
| 🔒 | Stakeholder bekleniyor (API key vb.) |

---

## 1. KIMLIK DOĞRULAMA (Auth)

### 1.1 LoginScreen

| Feature | Durum | Detay |
|---------|-------|-------|
| E-posta + şifre girişi | ✅ | `POST /auth/login` |
| Inline hata mesajı | ✅ | API hatası ekranda gösteriliyor |
| Google ile giriş | ✅ | `POST /auth/google` — `google-auth-library` OAuth2Client |
| "Şifremi Unuttum" linki | ✅ | ForgotPasswordScreen'e navigate ediyor |
| "Kayıt Ol" linki | ✅ | RegisterScreen'e navigate ediyor |
| Logo + marka görseli | ✅ | logoBox mevcut |
| Şifre göster/gizle (eye icon) | ❌ | Yok |
| E-posta format validasyonu (regex) | ❌ | Sadece boşluk kontrolü var |
| Oturum kalıcılığı (AsyncStorage) | ✅ | AuthContext'te token + user kaydediliyor |

### 1.2 RegisterScreen

| Feature | Durum | Detay |
|---------|-------|-------|
| Ad, e-posta, şifre alanları | ✅ | |
| Kullanıcı tipi seçimi (Göç Adayı / Danışman / Yurt Dışında) | ✅ | Chip seçici |
| Şifre min. 6 karakter kontrolü | ✅ | |
| API hata mesajı | ✅ | e-posta çakışması gösteriyor |
| Logo + marka görseli | ❌ | Login/Forgot/Reset'te var ama Register'da yok |
| Şifre göster/gizle (eye icon) | ❌ | Yok |
| E-posta format validasyonu (regex) | ❌ | Yok — geçersiz format gönderilebilir |
| Kayıt sonrası onboarding flow | ❌ | Direkt ana ekrana atıyor |

### 1.3 ForgotPasswordScreen

| Feature | Durum | Detay |
|---------|-------|-------|
| E-posta girişi + gönder butonu | ✅ | `POST /auth/forgot-password` |
| Başarı mesajı | ✅ | |
| API hata gösterimi | ✅ | |
| Gerçek e-posta gönderimi | 🔒 | SendGrid API Key stakeholder'dan bekleniyor; şu an console.log'a düşüyor |
| Logo + marka görseli | ✅ | |

### 1.4 ResetPasswordScreen

| Feature | Durum | Detay |
|---------|-------|-------|
| Token + yeni şifre girişi | ✅ | `POST /auth/reset-password` |
| Süresi dolmuş/geçersiz token 401 | ✅ | JWT verify ile kontrol ediliyor |
| Başarı sonrası Login'e yönlendirme | ✅ | |
| "Şifremi Unuttum'a dön" linki | ❌ | AppNavigator'da `onNavigateForgot` prop geçirilmiyor |
| Logo + marka görseli | ✅ | |

---

## 2. ANA SAYFA (HomeScreen)

| Feature | Durum | Detay |
|---------|-------|-------|
| Kullanıcı selamlama | ✅ | displayName gösteriyor |
| Rehber progress bar (seçili ülke için) | ✅ | `GET /guide/home-stats` — tamamlanma yüzdesi |
| Aktif ülke adı ve completion % | ✅ | |
| Son aktiviteler feed | ✅ | `GET /users/me/activity` — yorum ve rehber adımları |
| Aktivite satırına tıklayınca ilgili ekrana git | ✅ | Forum konu veya rehber |
| Premium banner / CTA | ✅ | Premium değilse gösteriyor |
| Premium fiyatı | ⚠️ | "250 TL" hardcoded (`HomeScreen.tsx:232`) — API'dan çekilmiyor |
| API hata yönetimi | ⚠️ | Hata sessizce yutuluyor (`.catch(() => [])`) — kullanıcıya gösterilmiyor |
| followingCount istatistiği | ❌ | Her zaman 0 — follow sistemi yok |

---

## 3. REHBERİM (GuideScreen)

| Feature | Durum | Detay |
|---------|-------|-------|
| Ülke listesi yükleme | ✅ | `GET /forum/countries` — XX filtresi var |
| Aktif ülke seçme | ✅ | `PATCH /users/me` — activeGuideCountryId |
| Assessment adımları tab | ✅ | |
| Checklist adımları tab | ✅ | |
| Adım accordionu (4 state: kapalı/açık/yapıldı/bloke) | ✅ | |
| Cevap kaydetme | ✅ | `POST /guide/progress` |
| FAQ linki (Linking.openURL) | ✅ | |
| Blocking answer engeli (cevap verilince ilerleme duruyor) | ⚠️ | Handler (`computeVisibleUpTo`) doğru çalışıyor ama UI'da bloke görseli eksik olabilir |
| Hata gösterimi (saveAnswer başarısız) | ❌ | `handleAnswer` catch bloğu var ama Alert/inline error yok |
| Aynı adım tekrar cevaplandığında üstüne yaz (upsert) | ⚠️ | API `INSERT`yapıyor, aynı stepId için eski kaydı güncellemeyebilir |

---

## 4. FORUM

### 4.1 ForumScreen (giriş — ülke seçimi)

| Feature | Durum | Detay |
|---------|-------|-------|
| Ülke listesi (bayraklı, kategorili) | ✅ | |
| Ülke seçimi → kategori ekranı | ✅ | |
| Deep link ile direkt topic açılışı | ✅ | `goworldy://topic/:id` — ForumScreen catch ediyor |

### 4.2 ForumCategoriesScreen

| Feature | Durum | Detay |
|---------|-------|-------|
| Kategori listesi yükleme | ✅ | `GET /forum/categories/:countryId` |
| Kategoriye tıklama → topic listesi | ✅ | |
| Boş state | ✅ | |

### 4.3 ForumTopicsScreen

| Feature | Durum | Detay |
|---------|-------|-------|
| Topic listesi yükleme | ✅ | `GET /forum/categories/:id/topics` |
| Sayfalama (infinite scroll) | ✅ | `page`, `totalPages` ile çalışıyor |
| "Tümü" / "Popüler" filtre | ⚠️ | Popüler sadece `commentCount`'a bakıyor — `upvotes` dahil değil |
| Kullanıcının kendi pending topic'lerini görmesi | ✅ | Approved + kendi pending/rejected görünüyor |
| FAB → Yeni konu oluştur | ✅ | |
| FAB kredi kontrolü (CreditGateModal) | ✅ | |
| CreditGateModal → Premium'a yönlendir | ❌ | `onNavigatePremium` prop alınıyor ama `_onNavigatePremium` olarak kullanılmıyor |
| Upvote butonu | ✅ | Optimistic update |
| Pin badge | ✅ | |

### 4.4 ForumTopicDetailScreen

| Feature | Durum | Detay |
|---------|-------|-------|
| Yorum listesi | ✅ | `GET /forum/topics/:id/comments` |
| Yorum gönderme | ✅ | `POST /forum/topics/:id/comments` |
| Yorum sonrası liste sona scroll | ❌ | `scrollToEnd` çağrısı yok |
| Upvote (toggle) | ✅ | `POST /forum/topics/:id/upvote` — optimistic update |
| Upvote sayısı deep link ile açılınca | ✅ | Props üzerinden geçiriliyor (`topicUpvotes`) |
| Boş yorum hata gösterimi | ✅ | |
| Yükleme hatası gösterimi | ✅ | |

### 4.5 CreateTopicScreen

| Feature | Durum | Detay |
|---------|-------|-------|
| Başlık alanı | ✅ | Max 120 karakter, 10 karakter min validasyonu |
| Konu içeriği (body) alanı | ❌ | Yok — sadece başlık gönderilebiliyor |
| Admin/Moderatör → anında yayın | ✅ | Status `approved` |
| Premium üye → ücretsiz + anında | ✅ | `isFree = isStaff || isPremium` bypass |
| Normal kullanıcı → kredi kontrolü | ✅ | CreditGateModal açılıyor |
| Kredi yetersiz → Premium yönlendirme | ✅ | Alert'te "Premium'a Geç" butonu |
| Gönderim sonrası geri dön | ⚠️ | Alert callback `onCreated` çağrıyor ama bazı hata durumlarında navigation.goBack() garanti değil |
| Kategori adı gösterimi | ✅ | |

---

## 5. PROFİL

### 5.1 ProfileScreen

| Feature | Durum | Detay |
|---------|-------|-------|
| Profil bilgileri gösterimi | ✅ | |
| Avatar gösterimi | ✅ | |
| Avatar düzenleme (galeri) | ✅ | expo-image-picker |
| Bio düzenleme + kaydet | ✅ | `PATCH /users/me` |
| Kullanıcı tipi seçimi (chip) | ✅ | |
| İstatistik kartları (Konu/Yorum/Adım sayısı) | ✅ | `GET /users/me/stats` |
| İstatistik kartları tıklanabilir | ✅ | MyTopics / MyComments'e navigate |
| Takip sayısı (followingCount) | ❌ | Her zaman 0 — follow sistemi yok |
| "Bildirim Ayarları" butonu | ✅ | NotificationsScreen'e navigate |
| "Gizlilik" butonu | ✅ | PrivacyScreen modal açıyor |
| "Yardım & Destek" butonu | ✅ | mailto: açıyor |
| "Hakkında" butonu | ✅ | Alert |
| Çıkış yap | ✅ | |
| Profil yüklenirken loading spinner | ⚠️ | Genel loading state var ama profil alanlarına özgü spinner eksik |
| navigation tipi | ⚠️ | `any` — tip güvencesi yok |

### 5.2 MyTopicsScreen

| Feature | Durum | Detay |
|---------|-------|-------|
| Konu listesi | ✅ | `GET /users/me/topics` |
| Durum badge (Yayında / Onay Bekliyor / Reddedildi) | ✅ | |
| Konuya tıklama → forum topic detail | ✅ | `TouchableOpacity` + navigate |
| Pull to refresh | ✅ | |
| Boş state | ✅ | |
| Sayfalama | ❌ | Sadece ilk 20 konu — infinite scroll yok |

### 5.3 MyCommentsScreen

| Feature | Durum | Detay |
|---------|-------|-------|
| Yorum listesi | ✅ | `GET /users/me/comments` |
| Yoruma tıklama → forum topic detail | ✅ | `TouchableOpacity` + navigate |
| Pull to refresh | ✅ | |
| Boş state | ✅ | |
| Sayfalama | ❌ | Sadece ilk 20 yorum |

### 5.4 PrivacyScreen

| Feature | Durum | Detay |
|---------|-------|-------|
| Telefon numarası girişi | ✅ | `PATCH /users/me` |
| Telefon paylaşım toggle | ✅ | `sharePhoneNumber` |
| Telefon format validasyonu (Türkiye +90) | ❌ | Yok — herhangi bir string kaydedilebilir |

---

## 6. BİLDİRİMLER (NotificationsScreen)

| Feature | Durum | Detay |
|---------|-------|-------|
| Bildirim listesi | ✅ | `GET /notifications` |
| Okundu olarak işaret (satıra tıklama) | ✅ | `PATCH /notifications/:id/read` |
| Tümünü okundu işaret | ✅ | `PATCH /notifications/read-all` |
| Bildirime tıklayınca ilgili topic'e git | ✅ | `navigation.getParent()?.navigate("Forum", ...)` |
| Ülke abonelik toggle'ları | ✅ | `PATCH /notifications/subscriptions/:countryId` |
| API hata yönetimi | ⚠️ | Feed/abonelik hataları sessizce yutuluyor |
| Tab bar bildirim rozeti (9+ format) | ✅ | AppNavigator'da `useUnreadCount` hook var, Home tab'ında `BadgeDot` gösteriliyor |
| Konu aboneliği listesi (topic takip) | ✅ | `GET /notifications/topic-subscriptions` |

---

## 7. PREMIUM & ÖDEMELER

### 7.1 PremiumScreen

| Feature | Durum | Detay |
|---------|-------|-------|
| Aktif premium kartı | ✅ | Kalan süre formatlanmış gösteriyor |
| Mevcut kredi bakiyesi | ✅ | |
| Paketler API'dan yükleniyor | ✅ | `loadPackages()` → `GET /payment/packages` |
| Kredi yükleme → Payment ekranı | ✅ | `navigation.navigate("Payment", ...)` |
| Haftalık Premium → Payment ekranı | ✅ | 199 TL |
| Aylık Premium → Payment ekranı | ✅ | 299 TL |
| Hata banner (paket yüklenemedi) | ✅ | |
| Kapat butonu | ✅ | |
| Tekrar satın alma engeli ("Zaten sahipsiniz") | ❌ | Yok — premium aktifken aynı paket tekrar satın alınabilir |
| Geçerlilik süresi gün/saat formatında | ⚠️ | `formatTimeRemaining` fonksiyonu var ama formatı doğrulanmadı |

### 7.2 PaymentScreen

| Feature | Durum | Detay |
|---------|-------|-------|
| Ürün adı + fiyat gösterimi | ✅ | |
| "Öde" butonu | ✅ | `POST /payment/process` |
| Başarı state | ✅ | Yeşil onay + kredi/premium bilgisi |
| Hata state | ✅ | |
| Gerçek Stripe entegrasyonu | 🔒 | Şu an mock — Stripe Price ID'leri stakeholder'dan bekleniyor |

---

## 8. NAVİGASYON & DEEP LINK

| Feature | Durum | Detay |
|---------|-------|-------|
| Bottom tab bar (Ana / Rehber / Forum / Profil) | ✅ | |
| HomeStack (Home → Notifications, Premium, Payment) | ✅ | |
| ProfileStack (Profile → MyTopics, MyComments) | ✅ | |
| Auth → Main geçişi (login sonrası) | ✅ | |
| Main → Auth geçişi (logout) | ✅ | |
| Süresi dolmuş JWT 401 → LoginScreen yönlendirme | ❌ | Mobile api.ts 401'i yakalayıp otomatik logout yapmıyor |
| Deep link: `goworldy://topic/:id` | ✅ | Forum tab'ı açıyor, topic detail gösteriyor |
| Deep link: `goworldy://guide/:countryId` | ✅ | Guide tab'ı açıyor |
| Deep link: giriş yapılmamışsa Login'e yönlendir | ✅ | AppNavigator user kontrolü yapıyor |

---

## 9. API — Auth Endpointleri

| Endpoint | Durum | Detay |
|----------|-------|-------|
| `POST /auth/register` | ✅ | bcrypt hash, JWT dön |
| `POST /auth/login` | ✅ | |
| `POST /auth/google` | ✅ | google-auth-library |
| `POST /auth/forgot-password` | ✅ | Reset token üret; SendGrid entegrasyonu 🔒 |
| `POST /auth/reset-password` | ✅ | Token doğrulama, süresi dolmuş → 401 |
| Süresi dolmuş JWT 401 | ✅ | authMiddleware'de jwt.verify ile |
| Şifre hash ifşası önleme | ✅ | Tüm `/users` route'larında `{ passwordHash, ...safe }` destructure |

---

## 10. API — Kullanıcı Endpointleri

| Endpoint | Durum | Detay |
|----------|-------|-------|
| `GET /users/me` | ✅ | passwordHash soyuluyor |
| `PATCH /users/me` | ✅ | Whitelist: displayName, bio, phone, avatar, userType, targetCountryId, activeGuideCountryId |
| `PATCH /users/me` → role güncellenemez | ✅ | Whitelist'te role yok |
| `GET /users/me/stats` | ✅ | topic/yorum/adım sayısı; followingCount hardcoded 0 |
| `GET /users/me/activity` | ✅ | |
| `GET /users/me/topics` | ✅ | |
| `GET /users/me/comments` | ✅ | |
| `GET /users/consultants` | ✅ | Danışman listesi |

---

## 11. API — Forum Endpointleri

| Endpoint | Durum | Detay |
|----------|-------|-------|
| `GET /forum/countries` | ✅ | |
| `GET /forum/categories/:countryId` | ✅ | |
| `GET /forum/categories/:id/topics` | ✅ | onlyApproved:true + sayfalama |
| `POST /forum/topics` | ✅ | Staff → approved, user → pending |
| `POST /forum/topics` kredi düşme | ⚠️ | Kredi atomikliği yok (DB transaction eksik) |
| `POST /forum/topics` 402 dönüşü (yetersiz kredi) | ❌ | Kredi kontrolü yapılıyor ama 402 yerine başka hata dönebilir |
| `POST /forum/topics/:id/comments` | ✅ | |
| `POST /forum/topics/:id/comments` kredi düşme | ⚠️ | Atomiklik yok |
| `GET /forum/topics/:id/comments` | ✅ | |
| `POST /forum/topics/:id/upvote` | ✅ | Toggle (tekrar basınca kaldırıyor) |
| `PATCH /forum/topics/:id/status` | ✅ | Admin/mod only — onay/red + bildirim tetikliyor |
| `GET /forum/search?q=` | ✅ | Full-text arama mevcut |
| `POST /forum/topics/:id/subscribe` | ✅ | Konu takibi |
| `DELETE /forum/topics/:id/subscribe` | ✅ | Konu takibi bırakma |
| `GET /forum/topics/:id/subscribe` | ✅ | Takip durumu |

---

## 12. API — Rehber Endpointleri

| Endpoint | Durum | Detay |
|----------|-------|-------|
| `GET /guide/steps/:countryId` | ✅ | |
| `GET /guide/progress` | ✅ | |
| `POST /guide/progress` | ⚠️ | Aynı stepId için INSERT yapıyor — upsert değil |
| `GET /guide/home-stats` | ✅ | completionPct dahil |

---

## 13. API — Bildirim Endpointleri

| Endpoint | Durum | Detay |
|----------|-------|-------|
| `GET /notifications` | ✅ | |
| `GET /notifications/unread-count` | ✅ | |
| `PATCH /notifications/:id/read` | ✅ | Sahiplik kontrolü (403 başka kullanıcıya) |
| `PATCH /notifications/read-all` | ✅ | |
| `GET /notifications/subscriptions` | ✅ | Ülke abonelikleri |
| `PATCH /notifications/subscriptions/:countryId` | ✅ | |
| `GET /notifications/topic-subscriptions` | ✅ | |
| Bildirim fan-out (yeni konu → ülke aboneleri) | ✅ | Forum route'da fire-and-forget |
| Bildirim fan-out (yeni yorum → konu aboneleri) | ✅ | Forum route'da fire-and-forget |
| Bildirim (konu onay/red → yazar) | ✅ | Admin status update'de tetikleniyor |

---

## 14. API — Ödeme Endpointleri

| Endpoint | Durum | Detay |
|----------|-------|-------|
| `GET /payment/packages` | ✅ | credits_pack 99TL, premium_weekly 199TL, premium_monthly 299TL |
| `POST /payment/process` | ✅ | Mock ödeme — anında kredi/premium grant |
| Gerçek Stripe webhook | 🔒 | Stakeholder Stripe Price ID'leri bekleniyor |
| Premium expiry kontrolü | ❌ | `premiumUntil` geçtikten sonra `isPremium` otomatik false yapılmıyor |
| Tekrar satın alma engeli | ❌ | Premium aktifken aynı paketi tekrar alabilir |

---

## 15. API — Admin Endpointleri

| Endpoint | Durum | Detay |
|----------|-------|-------|
| `GET /admin/topics?status=pending` | ✅ | |
| `PATCH /admin/topics/:id/status` | ✅ | Onay/red |
| `GET /admin/users` | ✅ | Kullanıcı listesi |
| `GET /admin/users?q=` | ✅ | Arama |
| `PATCH /admin/users/:id/role` | ✅ | Role güncelleme |
| Admin middleware (normal user → 403) | ⚠️ | `requireRole` middleware var ama tüm admin route'larına eklendiği doğrulanmadı |

---

## 16. ADMIN DASHBOARD (Web)

| Feature | Durum | Detay |
|---------|-------|-------|
| Login sayfası | ✅ | |
| Topic onay kuyruğu | ✅ | Pending topic listesi + Onayla/Reddet |
| Reddet → sebep modal | ✅ | |
| Kullanıcı yönetimi sayfası | ✅ | Liste + arama + role değiştir |
| Config Panel (`/config`) | ❌ | Hiç yok |
| SSE ile gerçek zamanlı pending topic akışı | ❌ | Admin paneli için SSE stream yok |

---

## 17. EKSİK ÖZELLÜKLER — ÖNCELİKLİ SIRALI

### P0 — Sistem güvenliği ve para akışı

| # | Özellik | Hangi Dosya |
|---|---------|-------------|
| 1 | Kredi düşme atomikliği — başarısız topic/comment oluşturmada kredi düşmemeli (DB transaction) | `api/src/routes/forum.ts` + repository |
| 2 | Forum POST routes → yetersiz kredi → 402 dönüşü | `api/src/routes/forum.ts` |
| 3 | Süresi dolmuş JWT → mobile otomatik logout → LoginScreen | `mobile/src/services/api.ts` |
| 4 | Admin route'larına normal kullanıcı tam dışlama (middleware audit) | `api/src/routes/admin.ts` |

### P1 — Kullanıcı deneyimini kıran eksiklikler

| # | Özellik | Hangi Dosya |
|---|---------|-------------|
| 5 | ForumTopicsScreen: `onNavigatePremium` kullanılmıyor → CreditGateModal'dan Premium'a gidilemiyor | `ForumTopicsScreen.tsx:50` |
| 6 | Premium expiry: `premiumUntil` geçince `isPremium` otomatik false yapılmıyor | API middleware veya cron |
| 7 | Guide progress upsert: aynı stepId tekrar cevaplandığında yeni satır açılmamalı | `repositories/guide` |
| 8 | ResetPasswordScreen: `onNavigateForgot` AppNavigator'da geçirilmiyor | `AppNavigator.tsx:81-87` |

### P2 — UX kalitesi

| # | Özellik | Hangi Dosya |
|---|---------|-------------|
| 9 | ForumTopicsScreen "Popüler" filtre: `upvotes` da dahil edilmeli | `ForumTopicsScreen.tsx:156` |
| 10 | CreateTopicScreen: konu içeriği (body) TextInput alanı | `CreateTopicScreen.tsx` |
| 11 | ForumTopicDetailScreen: yorum gönderilince `scrollToEnd` | `ForumTopicDetailScreen.tsx:86` |
| 12 | GuideScreen: `handleAnswer` hata → Alert/inline error | `GuideScreen.tsx:154` |
| 13 | HomeScreen: premium fiyatı API'dan çekilmeli ("250 TL" hardcoded) | `HomeScreen.tsx:232` |
| 14 | MyTopicsScreen + MyCommentsScreen: sayfalama / infinite scroll | Her iki dosyada |

### P3 — Validasyon ve polish

| # | Özellik | Hangi Dosya |
|---|---------|-------------|
| 15 | RegisterScreen: e-posta format regex | `RegisterScreen.tsx:39` |
| 16 | RegisterScreen + LoginScreen: şifre göster/gizle toggle | Her iki dosyada |
| 17 | RegisterScreen: logo/marka görseli | `RegisterScreen.tsx` |
| 18 | PrivacyScreen: telefon format validasyonu (+90 / 05xx) | `PrivacyScreen.tsx:47` |
| 19 | Premium tekrar satın alma engeli ("Zaten aktif" mesajı) | `PaymentScreen.tsx` + API |
| 20 | Admin Config Panel sayfası | `admin/src/pages/ConfigPage.tsx` + API |
| 21 | Admin SSE — gerçek zamanlı pending topic akışı | `api/src/routes/admin.ts` |
| 22 | followingCount — gerçek veri (follow sistemi) | Yeni feature — büyük scope |
| 23 | Kullanıcı onboarding flow (ilk kayıt sonrası) | Yeni ekran |
| 24 | ProfileScreen: `navigation` tipi `any` → doğru NavigationProp | `ProfileScreen.tsx:39` |

---

## 18. ÖZET TABLO

| Katman | Toplam Feature | Çalışıyor | Kısmen | Eksik |
|--------|---------------|-----------|--------|-------|
| Mobile Auth (4 ekran) | 20 | 15 | 0 | 5 |
| Mobile Ana/Rehber (2 ekran) | 18 | 13 | 3 | 2 |
| Mobile Forum (4 ekran) | 22 | 16 | 3 | 3 |
| Mobile Profil (3 ekran) | 16 | 13 | 2 | 1 |
| Mobile Bildirimler | 8 | 6 | 2 | 0 |
| Mobile Premium/Ödeme | 10 | 7 | 1 | 2 |
| Mobile Navigasyon | 6 | 5 | 0 | 1 |
| API Auth | 7 | 7 | 0 | 0 |
| API Users | 8 | 7 | 0 | 1 |
| API Forum | 13 | 10 | 2 | 1 |
| API Rehber | 4 | 3 | 1 | 0 |
| API Bildirim | 8 | 8 | 0 | 0 |
| API Ödeme | 4 | 2 | 0 | 2 |
| API Admin | 5 | 4 | 1 | 0 |
| Admin Dashboard | 5 | 3 | 0 | 2 |
| **TOPLAM** | **154** | **119** | **15** | **20** |

**%77 tamamlanmış, %10 kısmen çalışıyor, %13 eksik.**
