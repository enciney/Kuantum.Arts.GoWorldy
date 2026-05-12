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

## Open Questions
- **Push notifications**: Firebase FCM mi, Expo Notifications mı? (Karar verilmedi)
- **Avatar**: ✅ Karar verildi: sadece galeri (lokal). S3/Cloudinary uzun vadeli.
- **App store hedefi**: App Store, Google Play, ikisi birden? (Belirsiz)
- **E-posta servisi**: Reset token e-postası için SendGrid mi, SES mi? (Şu an console.log)
- **Seed verisi dışındaki ortamlar**: Prod'da seed nasıl çalışacak? (Belirsiz)
- **PrivacyScreen genişleme**: Telefon paylaşım toggle'ının ötesinde hangi gizlilik ayarları MVP kapsamında? (Belirsiz)
- **Stripe priceId'ler**: Her paket için Stripe dashboard'da Price oluşturulacak mı? Test modunda mı çalışılacak?
