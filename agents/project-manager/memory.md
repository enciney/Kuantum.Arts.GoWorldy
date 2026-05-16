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
4. Admin dashboard can be minimal for MVP — just user roles + topic approval queue. ✅ DONE (MVP scope tamamlandı)
5. Kredi + premium backend: ✅ DONE — sadece Stripe/SendGrid env key'leri stakeholder'dan bekleniyor.

## Completed Phases (2026-05-10)
- **Phase 1** (Auth + Nav): Login / Register / ForgotPassword / ResetPassword / GoogleSignIn + bottom tab nav — tümü tamamlandı.
- **Phase 2** (Guide): Ülke listesi API'dan, adım modal, progress kaydetme — tamamlandı.
- **Phase 3** (Forum): Countries → Categories → Topics → Detail + CreateTopic — tamamlandı. Role-aware paywall UI + backend.

## Tamamlanan Fazlar (güncellendi 2026-05-11)
- **Phase 4** (Profile & Notifications): Tümüyle tamamlandı ✅. Notification toggle'lar API'ye bağlı (subscriptions), activity feed gerçek veri gösteriyor, ProfileScreen butonları çalışıyor.
- **Phase 5** (Premium & Payments): Backend yapısı hazır ✅. PRICE_MAP env'den okuyor; PremiumScreen Stripe URL açıyor. Blokaj: Stakeholder'ın gerçek Stripe Price ID'lerini `.env.development`'a eklemesi gerekiyor.

## Sprint 1 (2026-05-11) — TAMAMLANDI ✅ 5/5

### Developer Görevleri
| # | Görev | Durum |
|---|-------|-------|
| D1 | Premium kredi akışı (CreditGateModal + deductCredits + forum route config) | ✅ Bitti |
| D2 | Rehber koşullu adım akışı (`blockingAnswer` + 4-state accordion UI) | ✅ Bitti |
| D3 | Profil butonları + PrivacyScreen + telefon toggle | ✅ Bitti |

### UX/UI Görevleri
| # | Görev | Durum |
|---|-------|-------|
| U1 | Kredi modal + Rehber accordion + Gizlilik ekranı tasarım polish | ✅ Bitti |
| U2 | theme.ts token'larını tüm ekranlara uygula | ✅ Bitti |

## Buton Audit (2026-05-11) — TAMAMLANDI ✅ 8/8

PM tüm butonları taradı (B1–B8 + BU1–BU5). Developer B1–B8'i çözdü, UX/UI BU1–BU2'yi çözdü.

| Kod | Buton | Durum |
|-----|-------|-------|
| B1 | ProfileScreen avatar edit | ✅ Bitti |
| B2 | NotificationsScreen satır tıkla + endpoint | ✅ Bitti |
| B3 | Notifications takip toggle'ları (subscriptions) | ✅ Bitti |
| B4 | PremiumScreen 5 satın alma butonu | ✅ Backend çözüldü — env key'leri stakeholder'dan bekleniyor |
| B5 | HomeScreen aktivite feed endpoint | ✅ Bitti |
| B6 | Notifications → direkt topic navigate | ✅ Bitti |
| B7 | Notifications tarih formatı (relative time) | ✅ Bitti |
| B8 | ForgotPassword e-posta servisi (SendGrid) | ✅ Bitti (graceful degrade) |
| BU1 | Avatar düzenleme overlay UX | ✅ Bitti |
| BU2 | Notification satırı okundu UI | ✅ Bitti |
| BU3 | PremiumScreen fail state UX | ⏳ Spec hazır → Developer implementasyonu bekleniyor |
| BU4 | HomeScreen aktivite dolu state render | ⏳ Spec hazır → Developer implementasyonu bekleniyor |
| BU5 | HomeScreen header logout kaldır | ⏳ Spec hazır → Developer implementasyonu bekleniyor |

## Sprint 2 — TAMAMLANDI ✅ (2026-05-11)

| Kod | Öncelik | Görev | Durum |
|-----|---------|-------|-------|
| — | **P0** | Admin dashboard scaffold (login + topic queue + user mgmt) | ✅ Bitti |
| T1 | **P1** | ForumScreen deep-link geri navigasyonu | ✅ Bitti (kod doğrulandı) |
| BU3 | **P1** | PremiumScreen inline fail state | ✅ Bitti |
| BU4 | **P2** | HomeScreen aktivite dolu state render | ✅ Bitti |
| BU5 | **P2** | HomeScreen header logout kaldır | ✅ Bitti |
| T2 | **P2** | HomeScreen rehber progress bar daima %0 | ✅ Bitti (kod doğrulandı) |
| T3 | **P2** | ProfileScreen bio İptal butonu bio siliyor | ✅ Bitti (kod doğrulandı) |
| T4 | **P2** | GuideRepository saveProgress yinelenen satır | ✅ Bitti (kod doğrulandı) |
| T5 | **P3** | NotificationsScreen görünür kapat butonu | ✅ Bitti |
| T6 | **P3** | PremiumScreen görünür kapat butonu | ✅ Bitti |
| T7 | **P3** | PremiumScreen 3 kredi kartı aynı productType | ✅ Bitti |

## Sprint 3 — TAMAMLANDI ✅ (2026-05-11)

| Kod | Öncelik | Görev | Durum |
|-----|---------|-------|-------|
| T9 | **P2** | LoginScreen Google flow hata mesajı → inline error box | ✅ Bitti |
| A1 | **P3** | Admin DashboardPage `<a href>` → `<Link>` (SPA) | ✅ Bitti |
| A2 | **P3** | Admin TopicsPage Reddet `window.confirm` | ✅ Bitti |
| T8 | **P1** | PremiumScreen credits_topic/comment/ad PRICE_MAP'te yok | ✅ Bitti |
| Auth | **P3** | ForgotPassword + ResetPassword logoBox eklendi | ✅ Bitti |
| — | **P2** | Stripe Price ID'leri | ⏳ Stakeholder bekleniyor |
| — | **P2** | SendGrid API Key | ⏳ Stakeholder bekleniyor |

## Sprint 4 — TAMAMLANDI ✅ (2026-05-11)

Tüm P0/P1/P2/P3 developer görevleri tamamlandı. Sprint 5 yeni stakeholder raporu ile açıldı.

## Sprint 5 — AKTİF (2026-05-11)

Stakeholder yeni sorunlar raporladı. Bu sorunların büyük bölümü ortak bir kök nedene işaret ediyor: `BASE_URL` sorunu.

### Kök Neden Analizi (PM)

`mobile/src/services/api.ts:1` → `BASE_URL = "http://localhost:3000/api"` **hardcoded**. React Native/Expo'da `localhost` Android emülatöründe veya fiziksel cihazda host makineye değil cihazın kendisine işaret eder. Bu nedenle:
- **Forum + Rehberim**: Sayfa açılışında API çağrısı başarısız → ekranda hata gösteriyor ("not fetch")
- **Profil telefon toggle**: Optimistic update yapılıyor, API başarısız → rollback + Alert ("Ayar kaydedilemedi")
- **Profil bio kaydetme**: Kaydet butonuna basılıyor, API başarısız → Alert ("Kaydedilemedi")

### Öncelik Sırası

| Kod | Öncelik | Görev | Sahip | Notlar |
|-----|---------|-------|-------|--------|
| FETCH-1 | **P0** | BASE_URL env değişkenine taşı | Developer | `api.ts:1` — `EXPO_PUBLIC_API_URL` ile konfigurasyon |
| PROF-1 | **P1** | Telefon toggle sonrası doğrula | Developer | FETCH-1 sonrası çalışmalı; bağımsız bug varsa araştır |
| PROF-2 | **P1** | Bio kaydetme sonrası doğrula | Developer | FETCH-1 sonrası çalışmalı; bağımsız bug varsa araştır |
| PROF-3 | **P2** | Avatar dosya seçici | Developer + UX-UI | `expo-image-picker` entegrasyonu; URL girişi ek olarak kalabilir |

**Stakeholder Blokajları (önceki — hâlâ bekliyor):**
- Stripe Price ID'leri + SendGrid API Key — stakeholder tarafından sağlanmalı

### Öncelik Sırası

| Kod | Öncelik | Görev | Sahip | Notlar |
|-----|---------|-------|-------|--------|
| D_NEW1 | **P3** | RegisterScreen logoBox eksik | Developer + UX-UI | Login/Forgot/Reset ile tutarlılık. `RegisterScreen.tsx` |
| D_NEW4 | **P3** | Admin Reddet sebep modalı | Developer | `TopicsPage.tsx` — UX spec `agents/ux-ui/memory.md`'de |
| D_NEW5 | **P3** | Admin Config Panel sayfası (`/config`) | Developer | `admin/src/pages/ConfigPage.tsx` + API endpoint |
| D_NEW6 | **P3** | Admin CORS whitelist | Developer | `api/src/index.ts` — localhost:5173 için origin ekle |
| D_NEW2 | **P3** | followingCount gerçek veri | Developer | `/users/me/stats` hardcoded 0 — follow sistemi gerektirir |
| D_NEW3 | **P3** | Bildirim seed datası | Developer | notifications tablosu boş başlıyor |

**Stakeholder Blokajları (kod hazır, env key'ler bekleniyor):**
- `STRIPE_PRICE_CREDITS_TOPIC/COMMENT/AD/100` ve `STRIPE_PRICE_PREMIUM_MONTHLY` — `.env.development`'a girilmeli
- `SENDGRID_API_KEY` — reset e-postası gerçekten gitmesi için

## Critical Gaps (Güncel)
1. **Stripe Price ID'leri** — `.env.development`'a `STRIPE_PRICE_CREDITS_TOPIC/COMMENT/AD/100` ve `STRIPE_PRICE_PREMIUM_MONTHLY` girilmeden checkout çalışmaz. Stakeholder bekleniyor.
2. **SendGrid API Key** — Şu an e-posta graceful degrade ile console.log'a düşüyor; gerçek reset e-postası gitmiyor. Stakeholder bekleniyor.

## Resolved Debates
- **Google Sign-In backend**: Firebase Admin SDK → `google-auth-library` ile değiştirildi. Daha az dep, daha basit.
- **Forum topic görünürlük**: Pending topic'ler listede gizliydi → author kendi pending'ini badge ile görüyor (UX iyileştirmesi).
- **Topic oluşturma rolü**: Admin/mod auto-publish; user için kredi düşme mekanizması (D1 görevi tamamlanınca 402 bloke kalkacak).

## Buton Audit Sonuçları (PM, 2026-05-11)

### Çalışan Butonlar (doğrulandı)
- Auth flow tüm butonları: login, register, forgot password, reset password ✅
- ProfileScreen: "Bildirim Ayarları" → Notifications, "Gizlilik" → PrivacyScreen modal, "Yardım" → mailto, "Hakkında" → Alert ✅
- PrivacyScreen: telefon toggle → PATCH /users/me (DB kolonu var) ✅
- NotificationsScreen: getAll, markRead, markAllRead, subscriptions toggle — tüm backend route'ları ✅
- Forum navigasyonu: countries → categories → topics → detail ✅
- ForumTopicDetail: "Gönder" (yorum) → createComment ✅
- CreateTopic: kredi düşme (deductCredits SqliteUserRepository'de implementle, forum route kullanıyor) ✅
- GuideScreen: adım kaydetme → saveProgress ✅

### Çalışmayan Butonlar (developer/ux-ui memory'ye yazıldı)
| Kodu | Ekran | Buton | Sorun | Öncelik |
|------|-------|-------|-------|---------|
| B4 | PremiumScreen | Yükle + Premium + 3 kredi (5 buton) | `priceId` hiç gönderilmiyor → Stripe "No such price" hatası | P0 |
| B5 | HomeScreen | "Son Aktiviteler" bölümü | GET /api/users/me/activity endpoint yok; daima empty state | P2 |
| B6 | NotificationsScreen | Bildirim satırı tıklaması | navigation.navigate("Forum") yapıyor, direkt topic'e gitmiyor | P1 |
| B7 | NotificationsScreen | createdAt gösterimi | Ham ISO string; "2 saat önce" gibi format yok | P2 |
| B8 | ForgotPasswordScreen | "Sıfırlama Linki Gönder" | API 200 dönüyor ama e-posta gitmiyor (console.log) | P1 |
| BU3 | PremiumScreen | Tüm satın alma butonları | Fail state UX: teknik hata mesajı kullanıcıya görünüyor | P1 |
| BU4 | HomeScreen | Aktivite feed | Empty state her zaman görünüyor; dolu state tasarımı yok | P2 |
| BU5 | HomeScreen | Header logout ikonu | ProfileScreen ile çakışıyor; kaldırılmalı | P2 |

### Admin Dashboard Durumu
Admin dashboard hâlâ başlamadı. Forum topic onay queue'su olmadan normal kullanıcı topic'leri sonsuza kadar "pending" kalıyor — bu P0 içerik moderasyonu riskidir.

## Rekabet Analizi Kararları (2026-05-11)

Benzer platformlar incelendi: InterNations, Expat.com, Lawfully, MigraConnect, ExpatsiGo, Expatica, VisaJourney.

### Eklenecek — Öncelikli
| Karar | Gerekçe | Sahip |
|-------|---------|-------|
| Forum full-text arama | Tüm rakiplerde var, kullanıcı ilk sorar | Developer |
| Kişiselleştirilmiş onboarding flow | İlk izlenimi belirler, retention'ı artırır | UX-UI + Developer |
| Upvote / "yararlı" işareti forum'a | İçerik kalitesini yüzeye çıkarır | Developer |
| Paylaşılabilir deep link | Konu URL'i paylaşılamıyor, viral büyüme yok | Developer |

### Eklenecek — Orta Vadeli
| Karar | Gerekçe | Sahip |
|-------|---------|-------|
| Danışman marketplace (profil + iletişim) | Rakiplerde yok, para getirir, "consultant" tipi zaten var | PM + Developer + UX-UI |
| Diploma/ünvan denklik rehberi | Türkiye'ye özel niş, rakiplerin hiçbirinde yok | Developer (içerik) |
| Ülke karşılaştırma aracı | Rakiplerde standart, karar aşamasındaki kullanıcı için kritik | Developer + UX-UI |

### Kaldırılacak / Ertelenecek
| Karar | Gerekçe |
|-------|---------|
| Dijital göçebe vizesi segmenti | GoWorldy'nin core hedef kitlesi bu değil, odak dağıtır |
| Gerçek zamanlı vize başvuru takibi | Yüksek teknik karmaşıklık, MVP dışı |
| AI destekli chatbot | Önce platform stabilitesi, sonra AI katmanı |

## Sprint 8 — TAMAMLANDI ✅ (2026-05-12)

C1/C2/C3/C4 tamamlandı. Profil sayfası tam çalışır hale getirildi.

## Sprint 9 — AKTİF (2026-05-14)

### Konu: Bildirim Sistemi Entegrasyonu

Stakeholder iki ana kategori bildirim istedi:
1. **Ülke bildirimleri**: Takip edilen ülkede yeni konu açılınca bildirim
2. **Konu bildirimleri**: Takip edilen konuya yeni yorum gelince bildirim

Ek: Admin panelinde topic onayı için gerçek zamanlı (SSE) çalışan sayfa.

### Sprint 9 Görev Tablosu

| Kod | Öncelik | Görev | Sahip | Durum |
|-----|---------|-------|-------|-------|
| N1 | **P0** | DB: `userTopicSubscriptions` koleksiyonu + index | Developer | ⏳ |
| N2 | **P0** | INotificationRepository + MongoNotificationRepository genişlet (unreadCount, topic sub, fan-out) | Developer | ⏳ |
| N3 | **P0** | Notification trigger: yeni konu (status=approved) → ülke abonelerine bildirim | Developer | ⏳ |
| N4 | **P0** | Notification trigger: yeni yorum → konu abonelerine + konu yazarına bildirim | Developer | ⏳ |
| N5 | **P0** | Notification trigger: konu onaylandı/reddedildi → konu yazarına bildirim | Developer | ⏳ |
| N6 | **P1** | `GET /notifications/unread-count` endpoint | Developer | ⏳ |
| N7 | **P1** | Topic subscribe/unsubscribe endpoints: `POST/DELETE /forum/topics/:id/subscribe` | Developer | ⏳ |
| N8 | **P1** | Admin SSE stream: `GET /api/admin/topics/stream` real-time pending topic events | Developer | ⏳ |
| N9 | **P1** | Admin TopicsPage SSE entegrasyonu — otomatik liste güncelleme | Developer | ⏳ |
| N10 | **P1** | Mobile: bildirim çanı badge (9+ format) AppNavigator + HomeScreen | Developer + UX-UI | ⏳ |
| N11 | **P1** | Mobile: ForumTopicDetailScreen'e "Konuyu Takip Et" butonu | Developer + UX-UI | ⏳ |
| N12 | **P2** | Mobile api.ts: unreadCount, topicSubscribe, topic bildirim tipi güncellemesi | Developer | ⏳ |
| T-N1 | **P1** | Tester: Bildirim sistemi tam manuel test planı | Tester | ⏳ |

### Kök Neden / Mimari Kararlar (Sprint 9)
- **Fan-out stratejisi**: Abonelere bildirim oluşturma sync yapılıyor (MVP) — prod'da queue kullanılabilir.
- **Topic bildirim tipi**: `topic_new` ve `comment_reply` yeni tipler ekleniyor.
- **Admin SSE**: Express SSE (long-lived GET) ile basit push; `EventSource` client tarafında.
- **Badge**: `GET /notifications/unread-count` her app focus'ta çağrılacak, 9'dan büyükse "9+" gösterilecek.

## Sprint 8 — AKTİF (2026-05-12)

Stakeholder 9 sorun raporladı. Kök neden: CORS + 3 bağımsız UI bug.

### Kök Neden Analizi
- **CORS**: `api/src/index.ts` whitelist (`localhost:3000/5173/19006`) Expo web dev server origin'ini karşılamıyor. Expo SDK'nın yeni sürümleri `localhost:8081`'de çalışıyor. Tüm `PATCH /api/users/me` ve `PATCH /api/notifications/subscriptions/:id` çağrıları preflight'ta başarısız.
- **Etkilenen sorunlar**: userType seçimi (2), bio kaydetme (6), telefon numarası (7), telefon paylaş toggle (8), takip toggle (4 — kısmen).

### Sprint 8 Görev Tablosu

| Kod | Öncelik | Görev | Sahip | Durum |
|-----|---------|-------|-------|-------|
| C1 | **P0** | CORS kök fix: `cors({ origin: true })` dev'de | Developer | ⏳ |
| C2 | **P1** | Avatar modal kaldır, direkt galeri aç (URL girişi kaldır) | Developer + UX-UI | ⏳ |
| C3 | **P1** | İstatistik kartları (Konu/Yorum/Adım) tıklanabilir + navigate | Developer | ⏳ |
| C4 | **P1** | "Hakkında" butonu araştır + Expo Web fix | Developer | ⏳ |
| C5 | **P1** | C1 sonrası: bio / userType / tel / paylaş toggle / takip toggle doğrula | Developer | ⏳ C1 bekleniyor |

### Stakeholder Kararı (2026-05-12)
- Avatar: URL girişi kaldırıldı — sadece cihaz galerisi (stakeholder "sadece localden" istedi).

## Sprint 10 — BACKLOG'A TAŞINDI (2026-05-15)

Sprint 10 görevleri test bulgularına göre yeniden önceliklendirildi. P10-1 → Sprint 4'e, P10-2 → Sprint 4'e, P10-3 → Sprint 5'e, P10-4 → Sprint 1'e (P0), P10-5 → Sprint 1'e (P0) taşındı. Tüm maddeler Backlog bölümünde "⏳ Backlog" etiketiyle korunuyor.

---

## Backlog

| Kod | Öncelik | Görev | Taşınan Sprint | Durum |
|-----|---------|-------|----------------|-------|
| P10-1 | **P0** | Premium özellik tekrar satın alma engeli: `userFeatures` koleksiyonu + sahiplik kontrolü — "Zaten sahipsiniz, X tarihe kadar geçerli" mesajı | Sprint 4 | ⏳ Backlog |
| P10-2 | **P1** | PremiumScreen özellik kartları: geçerlilik süresi gün/saat formatında göster (örn. "3 gün 4 saat kaldı") | Sprint 4 | ⏳ Backlog |
| P10-3 | **P1** | CreateTopicScreen: kullanıcı `credits_topic` özelliğine sahipse "Konu açma ücretlidir" infobox'ını gösterme | Sprint 5 | ⏳ Backlog |
| P10-4 | **P0** | CreateTopicScreen "Onayla ve Gönder" butonu çalışmıyor — root cause araştır (`CreditGateModal.onDeduct` → `doCreate` akışı, API 402 dönüşü, token/categoryId eksikliği) | Sprint 1 | ⏳ Backlog |
| P10-5 | **P0** | ForumTopicsScreen FAB: özellik yoksa CreditGateModal açılıyor ama "Satın Al" flow'u Premium sayfasına doğru yönlendirmiyor — `onNavigatePremium` bağlantısını doğrula | Sprint 1 | ⏳ Backlog |

---

## Yeni Sprint 1 (Test Bulguları) — BAŞLANDI ⚡

### Konu: Kritik Bug Fix (P0) — Güvenlik + Kredi Atomikliği + Temel Akışlar

| Kod | Öncelik | Görev | Sahip | Durum |
|-----|---------|-------|-------|-------|
| S1-01 | **P0** | SEC-06: GET /me response'unda passwordHash alanı kesinlikle dönmemeli — serializer/response kontrolü | Developer | ⏳ |
| S1-02 | **P0** | CR-03 + CR-07: Kredi atomikliği — başarısız işlemde kredi düşmemeli, bakiye asla eksi olmamalı (DB transaction) | Developer | ⏳ |
| S1-03 | **P0** | F-09 + F-14: Yetersiz kredide POST /forum/topics ve POST /forum/comments 402 Payment Required dönmeli | Developer | ⏳ |
| S1-04 | **P0** | P10-4 (backlog): CreateTopicScreen "Onayla ve Gönder" butonu çalışmıyor — CreditGateModal.onDeduct → doCreate akışını düzelt | Developer | ⏳ |
| S1-05 | **P0** | P10-5 (backlog): ForumTopicsScreen FAB → CreditGateModal → "Satın Al" → PremiumScreen yönlendirmesi çalışmıyor — onNavigatePremium bağlantısını doğrula | Developer | ⏳ |
| S1-06 | **P0** | AD-02 + SEC-03: Admin endpoint'lerine normal kullanıcı erişimi kesin 403 dönmeli — middleware audit | Developer | ⏳ |
| S1-07 | **P0** | SEC-01: Süresi dolmuş JWT 401 dönmeli, mobile taraf kullanıcıyı LoginScreen'e yönlendirmeli | Developer | ⏳ |
| S1-08 | **P0** | DEV: Tüm P0 bug fix'leri sonrası `tsc --noEmit` çalıştır, sıfır hata doğrula | Developer | ⏳ |
| S1-09 | **P1** | UXUI: Sprint 1'deki değişikliklerin etkilediği ekranları audit et — CreditGateModal, PremiumScreen, CreateTopicScreen | UX-UI | ⏳ |

---

## Yeni Sprint 2 (Test Bulguları) — BEKLEYEN ⏳

### Konu: API Doğruluğu (P1) — Reset Password, Forum Davranışları, Stripe

| Kod | Öncelik | Görev | Sahip | Durum |
|-----|---------|-------|-------|-------|
| S2-01 | **P1** | A-15 + A-16 + A-17: Reset password token doğrulamaları — süresi dolmuş token 400/401, geçersiz token 400 dönmeli | Developer | ⏳ |
| S2-02 | **P1** | F-04: GET /forum/topics sadece status=approved konular dönmeli — pending/rejected filtrelenmeli | Developer | ⏳ |
| S2-03 | **P1** | F-16 + F-17: Upvote toggle — ekle (200 upvote eklendi) + kaldır (200 upvote kaldırıldı) tam çalışmalı | Developer | ⏳ |
| S2-04 | **P1** | NO-03 + NO-05 + NO-06: Notification güvenliği — başka kullanıcının bildirimini okuma 403 dönmeli; unread-count doğru çalışmalı | Developer | ⏳ |
| S2-05 | **P1** | PM-09 + PM-10: Stripe webhook — geçerli imza ile isPremium güncellenmeli; geçersiz imza 400 dönmeli | Developer | ⏳ |
| S2-06 | **P1** | G-06 + G-07: Guide progress kaydetme — aynı stepId tekrar kaydedilince üzerine yazılmalı; farklı ülke seçilince adımlar sıfırlanmalı | Developer | ⏳ |
| S2-07 | **P1** | DEV: Tüm P1 API kontrolleri + fix, tsc --noEmit | Developer | ⏳ |
| S2-08 | **P2** | UXUI: Sprint 2 değişikliklerini audit et — Guide progress ekranları, notification badge | UX-UI | ⏳ |

---

## Yeni Sprint 3 (Test Bulguları) — BEKLEYEN ⏳

### Konu: UX & Orta Öncelik (P2) — Oturum Kalıcılığı, Abonelikler, Pagination

| Kod | Öncelik | Görev | Sahip | Durum |
|-----|---------|-------|-------|-------|
| S3-01 | **P2** | L-09: Oturum kalıcılığı — AsyncStorage'dan token restore edilmeli, uygulama yeniden açılınca otomatik giriş | Developer | ⏳ |
| S3-02 | **P2** | U-09: PATCH /me → role güncelleme denemesi role değiştirmemeli — whitelist kontrolü (displayName, bio, avatar, userType, targetCountry) | Developer | ⏳ |
| S3-03 | **P2** | NO-07 + NO-08 + NO-09: Ülke/konu aboneliği tam akışı — abone ol, abonelikten çık, liste doğru dönmeli | Developer | ⏳ |
| S3-04 | **P2** | N-06 + N-07: Tab bar bildirim rozeti — okunmamış sayı tab bar'da gösterilmeli (9+ format), konu aboneliği bildirimleri | Developer | ⏳ |
| S3-05 | **P2** | G-03: Guide blocker adım akışı — blockingAnswer seçilince ilerleme durmalı, uyarı gösterilmeli | Developer | ⏳ |
| S3-06 | **P2** | FT-05 + F-05: Pagination — ForumTopicsScreen infinite scroll + GET /forum/topics?page=2 doğru sayfalama | Developer | ⏳ |
| S3-07 | **P2** | CT-08: Konu admin onay süreci — normal kullanıcı topic'i status=pending oluşturmalı, admin panelinde görünmeli | Developer | ⏳ |
| S3-08 | **P2** | DEV: P2 düzeltmeleri, tsc --noEmit | Developer | ⏳ |
| S3-09 | **P2** | UXUI: Guide blocker state'leri + bildirim badge doğrulama — ekran spec'leri gözden geçir | UX-UI | ⏳ |

---

## Yeni Sprint 4 (Test Bulguları) — BEKLEYEN ⏳

### Konu: Edge Case & Admin (P3) — Deep Link, Güvenlik, Admin Kullanıcı Yönetimi

| Kod | Öncelik | Görev | Sahip | Durum |
|-----|---------|-------|-------|-------|
| S4-01 | **P3** | NAV-05 + NAV-06: Deep link testleri — `goworldy://topic/:id` ForumTopicDetailScreen açmalı; giriş yapılmamışsa Login'e yönlendir | Developer | ⏳ |
| S4-02 | **P3** | SEC-04: NoSQL injection koruması — `{email: {"$gt": ""}}` girişi 400 veya boş sonuç dönmeli | Developer | ⏳ |
| S4-03 | **P3** | SEC-07: Rate limiting kontrolü — çok hızlı istekte 429 Too Many Requests dönmeli | Developer | ⏳ |
| S4-04 | **P3** | SEC-08: CORS politikası — sadece izin verilen origin'lerden istek kabul edilmeli | Developer | ⏳ |
| S4-05 | **P3** | AD-08 + AD-09: Admin kullanıcı listesi (200) ve arama filtresi (q=engin eşleşen kullanıcılar) | Developer | ⏳ |
| S4-06 | **P3** | AD-10 + AD-11: Admin role güncelleme — geçerli role 200; geçersiz role (superadmin) 400 | Developer | ⏳ |
| S4-07 | **P0** | P10-1 (backlog): userFeatures koleksiyonu + sahiplik kontrolü — tekrar satın alma engeli | Developer | ⏳ |
| S4-08 | **P1** | P10-2 (backlog): PremiumScreen geçerlilik süresi gün/saat formatında göster | Developer + UX-UI | ⏳ |
| S4-09 | **P3** | DEV + UXUI: Edge case ve admin sprint — tsc --noEmit + etkilenen ekran audit | Developer + UX-UI | ⏳ |

---

## Yeni Sprint 5 (Test Bulguları) — BEKLEYEN ⏳

### Konu: Backlog Özellikleri & Refinement — Eksik Özellikler + Stakeholder Beklentileri

| Kod | Öncelik | Görev | Sahip | Durum |
|-----|---------|-------|-------|-------|
| S5-01 | **P1** | P10-3 (backlog): CreateTopicScreen — credits_topic özelliğine sahipse "Konu açma ücretlidir" infobox'ını gösterme | Developer | ⏳ |
| S5-02 | **P1** | CR-06: Premium süresi dolma kontrolü — premiumUntil geçtiyse isPremium=false olmalı (cron veya middleware kontrolü) | Developer | ⏳ |
| S5-03 | **P2** | PM-06: Mock topup dev endpoint doğrulama — POST /payment/topup/mock 200, 50 kredi eklendiğini doğrula | Developer | ⏳ |
| S5-04 | **P1** | Onboarding flow — RU3 spec hazır, implementation (UX-UI spec'e göre yeni kullanıcı akışı) | Developer + UX-UI | ⏳ |
| S5-05 | **P2** | Forum arama — RU1 spec hazır, GET /forum/search?q=X implementasyonu + mobile SearchBar entegrasyonu | Developer | ⏳ |
| S5-06 | **P0** | Stakeholder bekleniyor: Stripe Price ID'leri (CREDITS_TOPIC/COMMENT/AD/100 + PREMIUM_MONTHLY) `.env.development`'a eklenmeli | Stakeholder | ⏳ Blokaj |
| S5-07 | **P0** | Stakeholder bekleniyor: SendGrid API Key — reset e-postası gerçekten gitmesi için | Stakeholder | ⏳ Blokaj |

## Open Questions
- **Push notifications**: Firebase FCM mi, Expo Notifications mı? (Karar verilmedi)
- **Avatar**: ✅ Karar verildi: sadece galeri (lokal). S3/Cloudinary uzun vadeli.
- **App store hedefi**: App Store, Google Play, ikisi birden? (Belirsiz)
- **E-posta servisi**: Reset token e-postası için SendGrid mi, SES mi? (Şu an console.log)
- **Seed verisi dışındaki ortamlar**: Prod'da seed nasıl çalışacak? (Belirsiz)
- **PrivacyScreen genişleme**: Telefon paylaşım toggle'ının ötesinde hangi gizlilik ayarları MVP kapsamında? (Belirsiz)
- **Stripe priceId'ler**: Her paket için Stripe dashboard'da Price oluşturulacak mı? Test modunda mı çalışılacak?
