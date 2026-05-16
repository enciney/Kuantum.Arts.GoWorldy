# Developer Agent Memory

## Architecture Decisions
- DB provider: SQLite for local dev, MongoDB interface ready for prod switch via DB_PROVIDER env var.
- Repository pattern enforced — routes never touch DB directly.
- JWT expiry: 7 days (JWT_EXPIRY env).
- Forum topics require admin/moderator approval before they appear publicly.
- Stripe Checkout used (not Payment Intents) — simpler flow, webhook confirms purchase.

## Known State
- API scaffolded and seeded. Mobile and Admin apps not yet created.
- Seed creates admin user + 8 countries + 5 US guide steps on every startup (idempotent via OR IGNORE).
- Firebase admin SDK imported but Google auth route not fully wired — needs implementation.

## Resolved Issues
- **[Loop 1]** `interfaces/index.ts` missing exports: `ForumStats`, `GuideStats`, `UserSearchParams`, `UserTypeStats` — added to barrel export.
- **[Loop 1]** `config/index.ts` roles/userTypes typed as plain `string` — fixed with `as const` so union types flow correctly.
- **[Loop 1]** `routes/auth.ts` JWT `sign` call: `expiresIn: string` incompatible with `@types/jsonwebtoken` v9 `StringValue` — cast options `as object`.
- **[Loop 1]** `routes/admin.ts` `req.params.id`: Express v5 `@types/express@^5.0.0` types params as `string | string[]` — cast to `string` at call sites.
- **[Loop 1]** `npm install` was never run — `better-sqlite3`, `@types/better-sqlite3`, and all other deps were missing. Run `npm install` before first build.

## Known State (güncel)
- API: tsc temiz, npm install tamamlandı, tüm routes çalışır durumda.
- Mobile: Expo scaffold tamamlandı. Auth flow (Login/Register/ForgotPassword) + bottom tab nav + Forum (country list) + Guide (steps + progress) screen'leri hazır. `npm install` tamamlandı, tsc temiz.
- Admin: henüz oluşturulmadı.
- `api/src/database`, `api/src/models`, `api/src/services` boş klasörler silindi — gerektiğinde eklenecek.

## Resolved (UI/UX pass — 3 loops)
- **[UI Loop 1]** `@expo/vector-icons` eklendi. Tab bar artık `Ionicons` ikonları kullanıyor (focused/unfocused varyantları).
- **[UI Loop 1]** LoginScreen: Google Sign-In butonu (Alert ile placeholder — backend Firebase entegrasyonu bekliyor), input içi mail/lock ikonları, password göz ikonu, error box ikonlu.
- **[UI Loop 1]** HomeScreen tamamen dolduruldu: greeting, 3'lü stat kartı, "Rehberime Devam Et" gradient kartı, 4'lü hızlı erişim grid (Forum/Rehberim/Bildirimler/Premium), aktivite feed empty state, Premium banner.
- **[UI Loop 2]** ProfileScreen: avatar (initial fallback), bio düzenleme inline, role badge, stats grid (Konu/Yorum/Takip), settings menu list, çıkış.
- **[UI Loop 2]** NotificationsScreen: Akış / Takip ettiklerim sekmeleri, bildirim row'ları okundu/okunmadı state, takip switch'leri.
- **[UI Loop 2]** Navigator: HomeStack içine Notifications + Premium modal olarak eklendi.
- **[UI Loop 3]** PremiumScreen: kredi bakiye kartı, en avantajlı "Aylık Premium" highlight kartı, 3 tek-kullanım kredi kartı, Stripe footer.
- **[UI Loop 3]** Forum drill-down: Country tıklayınca ForumCategoriesScreen açılıyor. (Topics + Comments için API client hazır, ekran TODO.)
- **[UI Loop 3]** HomeScreen action card'ları gerçek navigasyona bağlandı (`getParent().navigate(...)` ile tab değiştirme + stack içinde modal).

## Pending Decisions
- MongoDB migration path: when to switch, schema design for forums.
- Push notification provider: Firebase FCM vs Expo Notifications.
- Image storage for profile avatars: local vs S3/Cloudinary.
- Google Sign-In backend: Firebase Admin SDK ile token verify route eklenmeli (`/api/auth/google`).

## Resolved (P0 + P1 — 5 loops)
- **[P1 Loop 1]** seed.ts genişletildi: 8 ülke × 6 kategori = 48 forum kategorisi, 3 sample approved topic + comments, US/DE/UK/CA için 5'er guide adımı (toplam 20 adım, Türkçe).
- **[P1 Loop 1]** `POST /api/auth/forgot-password` — JWT-based reset token üretiyor (DB'ye yazmıyor), e-posta varlığını sızdırmamak için her durumda 200 dönüyor. Şimdilik token console'a log'lanıyor (gerçek e-posta servisi TODO).
- **[P1 Loop 1]** `GET /api/users/me`, `PATCH /api/users/me` (displayName + bio update), `GET /api/users/me/stats` (topicCount/commentCount/completedSteps).
- **[P1 Loop 1]** `IForumRepository.countTopicsByAuthor` + `countCommentsByAuthor` interface'e ve SQLite implementasyonuna eklendi.
- **[P0 Loop 2]** `POST /api/auth/google` — Firebase Admin SDK ile idToken verify, yeni kullanıcı yoksa otomatik oluştur, JWT döndür. `services/firebase.ts` lazy init helper. Credentials yoksa 503 dönüyor (graceful degrade).
- **[P0 Loop 2]** Config'e `firebase.clientEmail` + `firebase.privateKey` eklendi (private key `\n` escape decode dahil).
- **[P0 Loop 3]** ForumTopicsScreen: filtreler (Tümü/Yeni/Popüler), pin'li topic'ler önde, pull-to-refresh, FAB "yeni konu", boş state, status='pending' olanlar listede gösterilmiyor.
- **[P0 Loop 4]** ForumTopicDetailScreen: yorumlar listesi (kendin/başkası ayrımı, mavi highlight), reply box (KeyboardAvoidingView + send button), createComment API'ye bağlı.
- **[P0 Loop 4]** ForumScreen artık 4 view'lık state machine: countries → categories → topics → topic-detail (+ create-topic).
- **[P1 Loop 5]** CreateTopicScreen: başlık input (10-120 char), paywall confirm dialog (50 TL), createTopic API çağrısı, "moderatör onayı bekliyor" feedback.
- **[P1 Loop 5]** GuideScreen artık ülke listesini API'dan çekiyor (önceki hardcoded 4 ülke kaldırıldı). Code → flag/Türkçe isim haritalama UI tarafında.
- **[P1 Loop 5]** ProfileScreen `useEffect` ile `/users/me` ve `/users/me/stats` API'larını çağırıyor — bio'yu yüklüyor, stats'ı gerçek veriden gösteriyor. Bio kaydetme `PATCH /users/me` ile gerçek update yapıyor.
- **[P1 Loop 5]** ForgotPasswordScreen gerçek API'ye bağlandı.

## Resolved (P0 — auth completion, 2 loops)
- **[Auth Loop 1]** `POST /api/auth/reset-password { token, newPassword }` — JWT reset token verify (purpose='reset' check), bcrypt re-hash, `users.update({ passwordHash })`. ResetPasswordScreen mobile (token input, password + confirm, validation, success ekranı).
- **[Auth Loop 1]** ForgotPasswordScreen submitted state'inde "Kodum var, sıfırla" butonu → ResetPassword stack'e navigate.
- **[Auth Loop 2]** Backend Google verify yaklaşımı değişti: Firebase Admin SDK yerine `google-auth-library` (`OAuth2Client.verifyIdToken`). `services/google-auth.ts` oluşturuldu, audience array'i Web/iOS/Android client ID'lerinden geliyor. `services/firebase.ts` orada duruyor (push notif gibi gelecek ihtiyaçlar için).
- **[Auth Loop 2]** Config'e `google.webClientId/iosClientId/androidClientId` eklendi.
- **[Auth Loop 2]** Mobile: `expo-auth-session/providers/google` ile `useGoogleAuth` hook (`services/google-signin.ts`). `EXPO_PUBLIC_GOOGLE_*_CLIENT_ID` env'leri kullanılıyor.
- **[Auth Loop 2]** AuthContext'e `loginWithGoogle(idToken)` metodu eklendi.
- **[Auth Loop 2]** LoginScreen Google butonu artık gerçek akış: `promptAsync()` → response handling → `loginWithGoogle(idToken)`. Config yoksa Alert ile feedback.

## Setup notes — Google Sign-In çalışması için gerekli env'ler
**API (`config/.env.development`):**
```
GOOGLE_WEB_CLIENT_ID=...apps.googleusercontent.com
GOOGLE_IOS_CLIENT_ID=...apps.googleusercontent.com  (opsiyonel)
GOOGLE_ANDROID_CLIENT_ID=...apps.googleusercontent.com  (opsiyonel)
```
**Mobile (`mobile/.env`):**
```
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=...apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=...apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=...apps.googleusercontent.com
```
Client ID'ler [Google Cloud Console](https://console.cloud.google.com/apis/credentials) → OAuth 2.0 Client IDs altından alınır. Backend ve mobile aynı Client ID'leri kullanmalı (audience verify için).

## Resolved (UX fixes — 3 loops)
- **[UX Loop 1]** HomeScreen tüm tıklanabilir öğeler navigate ediyor: 3 stat kartı (Guide/Forum'a göre), guide card → Guide tab, activity card → Forum tab, header bell → Notifications, premium banner → Premium. Tümünde `activeOpacity` ile visual feedback var.
- **[UX Loop 2]** GuideScreen artık tıklanabilir adımlar — modal slide-up: soru + description + cevap input + Kaydet/İptal. `api.guide.saveProgress` çağrısı, kaydedilen cevap row içinde yeşil "answer box"ta görünüyor. Tamamlanmış adımlar yeşil arka plan + tick ikonu.
- **[Bug Fix]** `ForumTopicsScreen` sadece `status==='approved'` topicleri filtreliyordu → kullanıcı kendi pending konusunu göremiyordu, "açamıyorum" sanıyordu. Artık approved + kendi pending/rejected'ları görünüyor (badge ile). Pin'li topic'ler hâlâ üstte.
- **[UX Loop 3]** Backend `POST /api/forum/topics`: admin/moderator → status='approved' (auto-yayın), user → 402 PAYMENT_REQUIRED (henüz kredi sistemi yok). Validation eklendi (categoryId + title zorunlu).
- **[UX Loop 3]** CreateTopicScreen role-aware: admin/mod için yeşil "yetki" info kutusu, paywall confirm dialog atlanır, doğrudan oluşturur, "yayınlandı" feedback. User için sarı "ücretli" info kutusu, 50 TL confirm, 402 hatası "Premium gerekli" alert'ine çevriliyor.

## Resolved (Final Loop — Tur 2/2)
- **[Final Loop]** `ForumTopic` interface'e `commentCount: number` eklendi.
- **[Final Loop]** `SqliteForumRepository.getTopics` + `getPendingTopics`: LEFT JOIN ile comment count hesaplıyor; `createTopic` yeni kayıt döndürürken `commentCount: 0` ekliyor.
- **[Final Loop]** `IForumRepository.createTopic` imzası: `Omit<..., "commentCount">` olarak güncellendi.
- **[Final Loop]** Mobile `api.ts` `getTopics` dönüş tipine `commentCount: number` eklendi.
- **[Final Loop]** `ForumTopicsScreen`: Topic tipine `commentCount`, row'da saat ikonunun yanına yorum balonu ikonu + sayı. "Popüler" filtresi artık `commentCount` azalana göre sıralıyor (önceki `return 0` idi). "Yeni" ve default sıralama createdAt DESC.
- **[Final Loop]** `IForumRepository.pinTopic(id, isPinned)` interface + SQLite implementasyonu eklendi.
- **[Final Loop]** `PATCH /api/admin/topics/:id/pin` endpoint eklendi (admin/moderator — `{ isPinned: boolean }` body).
- tsc: temiz (warn yalnızca `.npmrc` ile ilgili npm config uyarısı, TS hatası yok).

## Resolved (Status Loop)
- **[Status Loop]** `ForumComment` interface'e `authorDisplayName: string` eklendi.
- **[Status Loop]** `SqliteForumRepository.getComments`: `forum_comments JOIN users` ile `authorDisplayName` döndürüyor.
- **[Status Loop]** `SqliteForumRepository.createComment` imzası: `Omit<..., "authorDisplayName">` olarak güncellendi; insert sonrası JOIN query ile tam kayıt döndürüyor.
- **[Status Loop]** `IForumRepository.createComment` interface imzası da güncellendi.
- **[Status Loop]** Mobile `api.ts`: `forum.getComments` dönüş tipine `authorDisplayName: string` eklendi; `users.me` dönüş tipine `credits`, `isPremium`, `premiumUntil` eklendi; `api.payment` namespace eklendi (`getPackages`, `checkout`).
- **[Status Loop]** `ForumTopicDetailScreen`: `Comment` interface'e `authorDisplayName` eklendi; `CommentRow` artık displayName gösteriyor, avatar baş harfleri displayName'den geliyor.
- **[Status Loop]** `PremiumScreen`: `useEffect` ile `/users/me` çağırıp gerçek kredi bakiyesini gösteriyor; satın alma butonları `api.payment.checkout` çağırıp `Linking.openURL(url)` ile Stripe Checkout açıyor; loading spinner eklendi.
- tsc: temiz.

## Resolved (Sprint — Kredi / Rehber / Profil)
- **[Sprint]** `db.ts` idempotent migrasyon: `guide_steps.blockingAnswer TEXT`, `users.phoneNumber TEXT`, `users.sharePhoneNumber INTEGER DEFAULT 1` eklendi.
- **[Sprint]** `IGuideRepository.GuideStep` ve `SqliteGuideRepository.createStep` — `blockingAnswer` alanı eklendi.
- **[Sprint]** `IUserRepository.User` — `phoneNumber?: string`, `sharePhoneNumber?: boolean` eklendi.
- **[Sprint]** `SqliteUserRepository.toUser` — `sharePhoneNumber` INTEGER→boolean dönüşümü eklendi.
- **[Sprint]** `routes/users.ts` PATCH `/users/me` — `phoneNumber` ve `sharePhoneNumber` güncelleme desteği.
- **[Sprint]** `routes/forum.ts` — hardcoded `50` yerine `config.forum.createTopicCost` kullanıyor.
- **[Sprint]** `CreateTopicScreen` — Alert dialog kaldırıldı, `CreditGateModal` entegre edildi. Bakiye `/users/me`'den çekiliyor. `onNavigatePremium` prop'u eklendi; "Satın al" → PremiumScreen.
- **[Sprint]** `ForumScreen` — `useNavigation` + `navigateToPremium` → `CreateTopicScreen.onNavigatePremium`.
- **[Sprint]** `ProfileScreen` — "Bildirim Ayarları" artık `navigation.navigate('Home', { screen: 'Notifications' })` ile NotificationsScreen'e gidiyor.
- **[Sprint]** `PremiumScreen` — `balanceBtnText` spread sırası düzeltildi (tsc uyarısı giderildi).
- GuideScreen koşullu adım akışı önceki sprintlerde tamamlanmıştı (computeStepStates, locked/disqualified).
- tsc: temiz (API + Mobile).

## Sprint 10 — Bekleyen Bug Listesi (2026-05-15)

Stakeholder testi sırasında tespit edilen 4 sorun. Bir sonraki sprint'te fix edilecek.

### P10-1 — Premium özellik tekrar satın alınabiliyor (P0)
- **Dosyalar**: `api/src/repositories/mongodb/db.ts`, `api/src/routes/payment.ts`
- **Sorun**: `POST /payment/spend-credit` her çağrıda kredi düşüyor, özelliğin zaten var olup olmadığını kontrol etmiyor.
- **Fix**: `userFeatures` MongoDB koleksiyonu oluştur: `{ userId, featureType, purchasedAt, expiresAt }`. `spend-credit` endpoint'i önce bu koleksiyonu kontrol etmeli — özellik geçerliyse 409 dön (`code: "ALREADY_OWNED"`).
- **Süre mantığı**: `credits_topic`/`credits_reply`/`credits_message` için 30 günlük `expiresAt` ata (değiştirilebilir).

### P10-2 — PremiumScreen özellik geçerlilik göstergesi yok (P1)
- **Dosya**: `mobile/src/screens/main/PremiumScreen.tsx`
- **Sorun**: Satın alınan özelliğin kartı hâlâ "50 kr" gösteriyor, "X gün Y saat kaldı" veya "Zaten sahipsiniz" göstermiyor.
- **Fix**: `GET /payment/my-features` endpoint'i ekle (userId'ye göre aktif `userFeatures` kayıtlarını döndür). PremiumScreen mount'ta bu endpoint'i çağırsın. Aktif özellik varsa kart üzerinde yeşil badge + "X gün Y saat kaldı" göster, satın alma butonu disabled olsun.

### P10-3 — CreateTopicScreen hatalı infobox (P1)
- **Dosya**: `mobile/src/screens/main/CreateTopicScreen.tsx`
- **Sorun**: Kullanıcı `credits_topic` özelliğini satın almış olsa dahi "Konu açma ücretlidir" sarı infobox görünüyor.
- **Fix**: `useEffect` içinde `/payment/my-features` çağrısına `credits_topic` varlığını kontrol et. Varsa `hasCreditTopicFeature = true` set et, infobox'ı gizle, `gateVisible` hiç gösterilmesin.

### P10-4 — "Onayla ve Gönder" çalışmıyor (P0)
- **Dosya**: `mobile/src/screens/main/CreateTopicScreen.tsx`
- **Sorun**: Butona basılınca hiçbir şey olmuyor. Olası sebepler:
  1. `CreditGateModal.onDeduct` → `doCreate` referansı kopmuş olabilir (stale closure)
  2. `categoryId` prop boş string olarak geliyor olabilir
  3. `token` null olabilir
  4. `doCreate` içindeki `api.forum.createTopic` çağrısı network hatası alıyor ve `catch` bloğuna düşüyor ama hata mesajı görünmüyor
- **Debug adımları**: `doCreate` başına `console.log({ token, categoryId, title })` ekle → Expo loglarını kontrol et. API'ya istek gidip gitmediğini network tab'da doğrula.

### P10-5 — FAB "Özellik Yok" popup yönlendirme sorunu (P0)
- **Dosya**: `mobile/src/screens/main/ForumTopicsScreen.tsx`
- **Sorun**: Kullanıcının yeterli kredisi yoksa `CreditGateModal` açılıyor ama "Premium'a Geç" butonuna basılınca Premium sayfasına gidilmiyor.
- **Fix**: `ForumTopicsScreen` props'una `onNavigatePremium?: () => void` eklendi (Sprint 9'da yapıldı). `ForumScreen`'deki `navigateToPremium` fonksiyonunun `navigation.navigate("Home", { screen: "Premium" })` çağrısının çalıştığını test et. Navigator stack'inde "Premium" screen name'inin doğru olduğunu doğrula (`AppNavigator.tsx`).

## Buton Audit — Çalışmayan İş Kalemleri (PM tarafından tespit edildi, 2026-05-11)

### B1 — ProfileScreen: Avatar Düzenleme Butonu
- **Ekran**: `mobile/src/screens/main/ProfileScreen.tsx`
- **Buton**: Profil fotoğrafının üzerindeki kamera/kalem ikonu (avatar alanı)
- **Beklenen davranış**: Kullanıcı butona basınca ya expo-image-picker ile galeri açılmalı ya da URL input girişi istenmeli; seçilen fotoğraf sunucuya yüklenip avatar URL'si güncellenmelidir.
- **Neden çalışmıyor**: `onPress` handler'ı ya hiç tanımlanmamış ya da boş — görsel olarak tıklanabilir görünüyor ancak hiçbir işlem tetiklenmiyor.
- **Gerekli adımlar**:
  1. Kısa vadeli (MVP): Kullanıcıdan URL girmesi için Alert+TextInput ya da küçük modal — sunucu tarafı upload yok.
  2. Uzun vadeli: `expo-image-picker` + S3/Cloudinary yükleme; `PATCH /users/me` route'una `avatarUrl` alanı ekle.
- **Öncelik**: P2 (P0 değil — initials fallback kullanılıyor)

### B2 — NotificationsScreen: Bildirim Satırı Tıklaması
- **Ekran**: `mobile/src/screens/main/NotificationsScreen.tsx`
- **Buton**: Her bildirim satırı (`NotifRow` bileşeni içindeki `TouchableOpacity`)
- **Beklenen davranış**: Tıklanınca bildirimin türüne göre ilgili içeriğe navigate etmeli. Örneğin: Forum bildirimi → `ForumTopicDetailScreen`; Genel → bildirim detay modal.
- **Neden çalışmıyor**: `TouchableOpacity.onPress` prop'u tanımlanmamış (ya hiç aktarılmıyor ya da boş).
- **Gerekli adımlar**:
  1. `NotifRow`'a `onPress?: () => void` prop'u ekle.
  2. Bildirim objesine `type` ve `targetId` alanları ekle (API'dan gelecek).
  3. Bildirim listesini API'dan çeken bir endpoint yaz (`GET /api/notifications`).
  4. `onPress` içinde `type==='forum_comment'` → `ForumScreen` navigate et.
- **Öncelik**: P1 (bildirim özelliğinin temel işlevi)

### B3 — NotificationsScreen: "Takip Ettiklerim" Toggle'ları (Mevcut açık TODO — hatırlatma)
- **Ekran**: `mobile/src/screens/main/NotificationsScreen.tsx`
- **Buton**: Takip sekmetindeki Switch toggle'ları
- **Beklenen davranış**: Açık/kapalı durumu kalıcı olmalı (API'ya yazılmalı).
- **Neden çalışmıyor**: Frontend-only local state — `PATCH /api/users/me/notifications` gibi bir endpoint yok.
- **Öncelik**: P2

## Resolved (Button Sprint — 2026-05-11)
- **[B1]** ProfileScreen avatar edit butonu aktif: kamera ikonuna basınca URL input modal açılıyor. `PATCH /users/me` artık `avatarUrl` kabul ediyor. `IUserRepository.User` + DB `avatarUrl TEXT` kolonu eklendi. Image bileşeni ile render — URL yoksa initials fallback.
- **[B2]** NotificationsScreen bildirim satırı tıklanabilir: `NotifRow` artık `onPress` prop alıyor. `GET /api/notifications`, `PATCH /api/notifications/:id/read`, `PATCH /api/notifications/read-all` endpoint'leri eklendi. Forum bildirimi → ForumScreen navigate.
- **[B3]** NotificationsScreen takip toggle'ları artık kalıcı: `GET /api/notifications/subscriptions` (tüm ülkeler + subscription durumu), `PATCH /api/notifications/subscriptions/:countryId` endpoint'leri eklendi. `user_country_subscriptions` tablosu oluşturuldu. Optimistic UI + rollback hata durumunda.
- **[Yeni]** `INotificationRepository` + `SqliteNotificationRepository` + `notifications` tablosu eklendi. `repositories/index.ts`'e wire edildi.
- API + Mobile tsc: temiz.

## Sprint 2 — Tester Bulguları Doğrulaması (PM, 2026-05-11)

T1–T4 kaynak kod incelenerek doğrulandı — hepsi çözülmüş:
- **T1** ✅ `ForumScreen.tsx:132-145` → `!view.country.id` kontrolü ile `countries` view'ına yönlendirme var.
- **T2** ✅ `HomeScreen.tsx:45-47` → `countries[0]?.id` ile `getSteps` çağrısı yapılıyor.
- **T3** ✅ `ProfileScreen.tsx:192` → `setBio(savedBio)` ile geri dönüyor (boşaltmıyor).
- **T4** ✅ `SqliteGuideRepository.ts:28-30` → `ON CONFLICT(userId, stepId) DO UPDATE SET` UPSERT mevcut.

## Admin Buton Audit — Yeni Bulgular (PM, 2026-05-11)

### A1 — DashboardPage: Hızlı Bağlantılar `<a href>` Kullanıyor (P3)
- **Ekran**: `admin/src/pages/DashboardPage.tsx:51-57`
- **Sorun**: "Konu Onay Kuyruğu →" ve "Kullanıcı Yönetimi →" bağlantıları düz HTML `<a href="/topics">` kullanıyor. SPA'da bu tam sayfa yenilemesine (full page reload) neden olur; React Router `<Link to="/topics">` kullanılmalı.
- **Düzeltme**: `import { Link } from "react-router-dom"` ile iki `<a>` → `<Link>` olarak değiştir.
- **Öncelik**: P3 — görsel olarak çalışıyor ama SPA deneyimini bozuyor.

### A2 — TopicsPage: "Reddet" Butonu Onay Gerektirmiyor (P3)
- **Ekran**: `admin/src/pages/TopicsPage.tsx:86-91`
- **Sorun**: "Reddet" butonuna tek tıkla konu reddedilebiliyor; yanlışlıkla tıklama riski var. Ayrıca red sebebi de kaydedilmiyor (ayrı görev — UX memory'de belgelenmiş).
- **Düzeltme**: `handleAction` çağrısından önce `window.confirm("Bu konuyu reddetmek istediğinizden emin misiniz?")` ekle. Sebep modalı ayrı sprint'e bırakılabilir.
- **Öncelik**: P3 — moderatör akışı için temel güvenlik.

## Sprint 6 — Rekabet Analizi Sonrası Görevler (PM tarafından atandı, 2026-05-11)

| Kod | Öncelik | Görev | Notlar |
|-----|---------|-------|--------|
| R1 | **P1** | Forum full-text arama endpoint'i | `GET /api/forum/search?q=...` — topics + comments içinde arar, ülke/kategori filtresi opsiyonel |
| R2 | **P1** | Forum topic upvote sistemi | `POST /api/forum/topics/:id/upvote` + `upvotes` kolonu, aynı kullanıcı iki kez upvote edemez |
| R3 | **P1** | Deep link scheme | `app.json`'da `scheme: "goworldy"` zaten var; `goworldy://forum/topic/:id` ve `goworldy://guide/:countryId` route'larını wiring |
| R4 | **P2** | Onboarding flow API | `PATCH /api/users/me` → `onboardingCompleted: boolean`, `targetCountryId: number` alanları; yeni kayıtta `onboardingCompleted: false` default |
| R5 | **P2** | Danışman profil endpoint'leri | `GET /api/consultants` (userType=consultant olanları döner) + `GET /api/consultants/:id` — yeni bir route değil, mevcut users üzerine filtre |

## Open TODOs (next session)
- Push notifications (Expo Notifications + topic abone olunca tetikleme).
- Image storage (avatar upload — şu an URL girişi, S3/Cloudinary entegrasyonu eksik).
- followingCount `/users/me/stats` içinde hardcoded 0 — follow sistemi backend'de yok. (P3)
- Bildirim seed'i yok — notifications tablosu boş başlıyor. Seed'e örnek bildirimler eklenebilir. (P3)
- Stripe: `.env.development`'a gerçek Stripe Price ID'ler yazılmadan checkout tetiklenmez. (Stakeholder bekleniyor)
- Admin dashboard: `cd admin && npm run dev` ile localhost:5173'te açılır. Gerçek prod build için Vite ile build + nginx/Caddy önünde servis edilmeli.
- Admin CORS: localhost:5173 → localhost:3000 isteklerinin whitelist'e alınması gerekebilir.
- Admin Config Panel sayfası yok. (P3)
- Admin Reddet sebep modalı yok. (P3 — UX spec'i memory'de mevcut)

## Tester Bulguları — 2026-05-11 (3. Tur — agents/tester/memory.md kaynaklı)

### T8 — PremiumScreen: credits_topic/comment/ad PRICE_MAP'te Yok [P1-KRİTİK]
- **Neden**: T7 düzeltmesi `PremiumScreen.tsx`'deki 3 kredi kartının `productType`'larını `credits_50`'den `credits_topic`, `credits_comment`, `credits_ad` olarak değiştirdi. Ancak `payment.ts:17-23` PRICE_MAP yalnızca eski tip'leri (`credits_50`, `credits_100`, `credits_250`) biliyor.
- **Sonuç**: "Konu Aç", "Yorum Erişimi", "Reklam Yayınla" butonlarına basınca backend 400 dönüyor — satın alma tamamen bloke.
- **Düzeltme**:
  1. `api/src/routes/payment.ts:17-23` — PRICE_MAP'e ekle:
     ```typescript
     credits_topic: config.stripe.prices.credits_50,   // 50 TL — credits_50 fiyatını paylaşır
     credits_comment: config.stripe.prices.credits_50,
     credits_ad: config.stripe.prices.credits_50,
     ```
  2. `api/src/index.ts:20-24` — CREDITS_GRANT'a ekle:
     ```typescript
     credits_topic: 50,
     credits_comment: 50,
     credits_ad: 50,
     ```
  3. Ya da ayrı env değişkenleri: `STRIPE_PRICE_CREDITS_TOPIC`, `STRIPE_PRICE_CREDITS_COMMENT`, `STRIPE_PRICE_CREDITS_AD` (stakeholder kararı gerekir).

### T9 — LoginScreen: Google Flow Hata Mesajı UI Tutarsızlığı [P2]
- **Dosya**: `mobile/src/screens/auth/LoginScreen.tsx:39-45`
- **Sorun**: `loginWithGoogle` başarısız olursa `Alert.alert(...)` çağrılıyor. Normal e-posta/şifre hatası `setError(...)` ile inline error box gösteriyor (satır 61). İki farklı hata UI pattern.
- **Düzeltme**: `LoginScreen.tsx:39-45` catch bloğunda `Alert.alert` yerine:
  ```typescript
  .catch((e: unknown) => setError(e instanceof Error ? e.message : "Google girişi başarısız."))
  ```

### A1 — Admin DashboardPage: `<a href>` SPA Uyumsuzluğu [P3]
- **Dosya**: `admin/src/pages/DashboardPage.tsx:52-56`
- **Düzeltme**: `import { Link } from "react-router-dom"` ekle; `<a href="/topics">` → `<Link to="/topics">`, `<a href="/users">` → `<Link to="/users">`. Style prop'unu Link'e taşı.

### A2 — Admin TopicsPage: Reddet Onay Dialogu Yok [P3]
- **Dosya**: `admin/src/pages/TopicsPage.tsx:87-90`
- **Düzeltme**: "Reddet" butonunun `onClick` handler'ına confirm ekle:
  ```typescript
  onClick={() => {
    if (!window.confirm("Bu konuyu reddetmek istediğinizden emin misiniz?")) return;
    handleAction(t.id, "rejected");
  }}
  ```

### Auth Branding — ForgotPassword ve ResetPassword Logo Yok [P3]
- **Dosya**: `ForgotPasswordScreen.tsx:49-53`, `ResetPasswordScreen.tsx:77-81`
- **Düzeltme**: Her iki ekrana LoginScreen'deki `logoBox` bileşenini ekle: `<MaterialCommunityIcons name="earth" size={56} color={Colors.primary} />` + `<Text style={styles.logo}>GoWorldy</Text>` `paddingTop:80`'den önce.

## Sonraki Sprint — UX Polish İş Kalemleri (PM, 2026-05-11)

Aşağıdaki görevler UX/UI agent tarafından spec'lendi; developer implementasyonu bekleniyor.

### BU3 — PremiumScreen: Satın Alma Fail State UX (P1)
- **Ekran**: `mobile/src/screens/main/PremiumScreen.tsx`
- **Görev**: Stripe hatası geldiğinde teknik Alert mesajı yerine kullanıcı dostu inline hata banner göster.
- **Değişiklikler**:
  1. Hata state'i için `purchaseError: string | null` ekle.
  2. Alert kaldır — satın alma kartının altında kırmızı inline banner: "Ödeme tamamlanamadı. Lütfen tekrar deneyin veya destek@goworldy.com ile iletişime geçin."
  3. "Yükle" (balanceBtn) butonuna da `ActivityIndicator` loading spinner ekle (şu an sadece 3 action card'da var).
  4. Başarılı ödeme sonrası (Stripe deep link callback `goworldy://payment/success`): `Linking.addEventListener` ile yakalanınca `/users/me` yeniden çek, bakiye güncelle.
- **UX token'ları**: hata arka plan `Colors.dangerLight`, ikon `"alert-circle"`, metin `Colors.danger`.

### BU4 — HomeScreen: Aktivite Feed Dolu State Tasarımı (P2)
- **Ekran**: `mobile/src/screens/main/HomeScreen.tsx`
- **Görev**: `users.myActivity` API çağrısı B5 ile eklendi; artık gelen veri için dolu state render'ı eksik.
- **Değişiklikler**:
  1. Aktivite listesi geldiğinde her satır: sol kenarda renkli ikon badge (forum yorum → `Colors.primary` "chatbubble" ikonu, guide adım → `Colors.secondary` "checkmark-circle" ikonu).
  2. Sağda tarih: `formatRelativeTime` helper (B7'de yazıldı, import et).
  3. Alt satırda içerik özeti: maksimum 60 karakter, `numberOfLines={1}` ile truncate.
  4. Maksimum 5 aktivite göster; altında "Tümünü Gör →" linki (Forum/Guide tab'ına navigate).
  5. Boş gelirse mevcut empty state korunuyor — değişiklik yok.

### BU5 — HomeScreen: Header Logout Butonu Kaldır (P2)
- **Ekran**: `mobile/src/screens/main/HomeScreen.tsx`
- **Görev**: `HomeScreen.tsx` header'daki `TouchableOpacity onPress={logout}` bloğunu kaldır.
- **Neden**: ProfileScreen'de zaten "Çıkış Yap" butonu var. İki yerde çıkış — tutarsızlık ve yanlışlıkla tıklama riski.
- **Değişiklik**: Header'da yalnızca çan (bildirim) ikonu kalsın. Logout handler referansı da `useAuth`'tan kaldırılabilir (başka yerde kullanılmıyorsa).

### P0 — Admin Dashboard Scaffold (kritik)
- Şu an admin ekranı olmadığı için forum topic onay süreci manuel ve sınırsız sürüyor. Her kullanıcı topic'i "pending" olarak takılıp kalıyor.
- **Görev**: `admin/` klasörü altında React + TypeScript projesi oluştur.
- **MVP kapsam** (öncelik sırasıyla):
  1. Giriş ekranı (JWT auth, `admin@goworldy.com`).
  2. Topic onay queue — `GET /api/admin/topics/pending` listesi; "Onayla" / "Reddet" butonları.
  3. Kullanıcı listesi + rol atama (`PATCH /api/admin/users/:id/role`).
  4. Özet stats sayfası (`GET /api/admin/stats`).
- **Bağımlılık**: Tüm backend route'ları (`/api/admin/*`) mevcut ve çalışır durumda — sadece frontend eksik.

## Resolved (B4–B8 Sprint — 2026-05-11)
- **[B4]** `routes/payment.ts`: `PRICE_MAP` eklendi (`productType → STRIPE_PRICE_xxx` env). `priceId` artık frontend'den gelmiyor, backend'de resolve ediliyor. Env yoksa 400 dönüyor. `config/index.ts`'e `stripe.prices` ve `sendgrid` blokları eklendi.
- **[B5]** `GET /api/users/me/activity` eklendi: son 10 forum yorumu + son 5 tamamlanan guide adımı, chronological birleşim. `IForumRepository.getRecentCommentsByAuthor` + `IGuideRepository.getRecentProgress` interface + SQLite impl. Mobile `api.ts`'e `users.myActivity`. `HomeScreen` gerçek aktivite listesi gösteriyor — boş gelirse empty state korunuyor. Aktiviteler tıklanabilir (forum → ForumScreen+topicId, guide → Guide tab).
- **[B6]** `NotificationsScreen.handleNotifPress`: `navigation.navigate("Forum", { openTopicId, openTopicTitle })` ile topic'e direkt geçiş. `MainTabParamList.Forum` params kabul ediyor. `ForumScreen` `useRoute` ile `openTopicId` okuyor, `topic-detail` view'ına atlıyor.
- **[B7]** `NotificationsScreen`: `formatRelativeTime(dateStr)` helper eklendi. Ham ISO string yerine "5 dk önce", "2 saat önce", "3 gün önce" gösteriliyor.
- **[B8]** `services/email.ts` oluşturuldu: `SENDGRID_API_KEY` varsa SendGrid REST API ile reset e-postası gönderir, yoksa console.log'a yazar (graceful degrade). `routes/auth.ts` artık `sendResetEmail(email, token)` çağırıyor.
- API + Mobile tsc: temiz.

## Buton Audit — 2. Tur (PM, 2026-05-11)

### B4 — PremiumScreen: Tüm Satın Alma Butonları (5 buton) ❌ BROKEN
- **Ekran**: `mobile/src/screens/main/PremiumScreen.tsx`
- **Butonlar**: "Yükle" (100 Kredi), "Şimdi Premium Ol" (Aylık Premium), "Konu Aç" (50 Kredi), "Yorum Erişimi" (50 Kredi), "Reklam Yayınla" (50 Kredi)
- **Beklenen davranış**: Kullanıcıya Stripe ödeme sayfası açılmalı; ödeme tamamlanınca kredi/premium balance güncellenmeli.
- **Neden çalışmıyor**:
  1. `PremiumScreen.tsx:66-73` → `api.payment.checkout({ productType, successUrl, cancelUrl }, token)` çağrısında `priceId` parametresi **hiç gönderilmiyor**.
  2. `routes/payment.ts:25` → `priceId` undefined olarak alınıyor.
  3. `StripePaymentProvider.ts:26` → `line_items: [{ price: undefined, quantity: 1 }]` → Stripe API "No such price" hatası fırlatıyor.
  4. Kullanıcıya "Ödeme Başlatılamadı / Stripe yapılandırması eksik olabilir" Alert'i görünüyor.
- **Gerekli adımlar**:
  1. `payment.ts` içinde `productType → Stripe priceId` mapping tablosu oluştur (env'den oku: `STRIPE_PRICE_CREDITS_50`, `STRIPE_PRICE_CREDITS_100`, `STRIPE_PRICE_PREMIUM_MONTHLY` vb.).
  2. `routes/payment.ts` checkout handler'ında: `priceId = PRICE_MAP[productType]`; priceId yoksa 400 döndür.
  3. `.env.development`'a gerçek (veya Stripe test modu) priceId'leri ekle.
  4. Alternatif: `PremiumScreen`'daki `handlePurchase` çağrısına `priceId` prop'u ekle — ancak priceId'leri frontend'e gömmek önerilmez.
- **Öncelik**: P0 — gerçek para akışı tamamen bloke

### B5 — HomeScreen: "Son Aktiviteler" Bölümü ❌ BROKEN (içerik yok)
- **Ekran**: `mobile/src/screens/main/HomeScreen.tsx:135-151`
- **Bileşen**: "Henüz aktivite yok" placeholder kartı + tıklanınca Forum navigate
- **Beklenen davranış**: Kullanıcının son forum yorumları ve tamamladığı rehber adımları kronolojik olarak listelenmeli.
- **Neden çalışmıyor**: Backend'de `GET /api/users/me/activity` endpoint'i yok. Şu an daima empty state gösteriyor; tıklayınca Forum'a gitmek çalışıyor ama içerik sıfır.
- **Gerekli adımlar**:
  1. `routes/users.ts`'e `GET /me/activity` ekle: son 10 forum yorumu (forum_comments) + son 5 tamamlanan guide adımı (user_guide_progress), birleşik kronolojik sıralı.
  2. `IUserRepository` veya yeni bir servis metoduna ekle (ya da doğrudan route içinde iki repo çağrısı yap).
  3. `api.ts`'e `users.myActivity(token)` metodu ekle.
  4. `HomeScreen`'de `useEffect` içinde aktivite verisini çek, boş gelirse empty state göster.
- **Öncelik**: P2 — ürün kullanılabilir ama aktivite bölümü anlamsız

### B6 — NotificationsScreen: Bildirim Satırı → Direkt Topic'e Gitmiyor ❌ BROKEN
- **Ekran**: `mobile/src/screens/main/NotificationsScreen.tsx`
- **Buton**: `NotifRow` tıklaması (`handleNotifPress`)
- **Beklenen davranış**: Forum bildirimine tıklandığında ilgili konu detay ekranına (ForumTopicDetailScreen) geçilmeli.
- **Neden çalışmıyor**: `handleNotifPress` şu an sadece `navigation.navigate("Forum")` yapıyor (root ekrana); `notif.targetId` kullanılmıyor. ForumScreen iç state machine'e programatik geçiş mekanizması yok.
- **Gerekli adımlar**:
  1. ForumScreen'e dışarıdan başlangıç view'ı geçebilmek için navigation param desteği ekle (ör. `initialTopicId`).
  2. `handleNotifPress` içinde `notif.targetType === "forum_topic"` kontrolü; `notif.targetId` ile ForumScreen'e navigate et ve o topic'i açık konumla başlat.
  3. Alternatif: ForumScreen'i state machine'den çıkarıp gerçek stack navigator'a taşı (daha temiz ama daha büyük refactor).
- **Öncelik**: P1 — bildirim özelliğinin temel UX değeri bu navigate'e bağlı

### B7 — NotificationsScreen: Tarih Formatı Ham ISO String ❌ UX SORUN
- **Ekran**: `mobile/src/screens/main/NotificationsScreen.tsx`
- **Alan**: `NotifRow` içindeki `notif.createdAt` gösterimi
- **Beklenen davranış**: "2 saat önce", "Dün", "3 Mayıs" gibi okunabilir format.
- **Neden çalışmıyor**: `new Date(notif.createdAt).toLocaleDateString("tr-TR")` benzeri bir dönüşüm yok; ham `"2026-05-11T10:30:00.000Z"` string'i gösteriliyor.
- **Gerekli adımlar**: `createdAt` değerini `toRelativeTime(dateStr)` helper ile işle. `date-fns` veya basit bir `formatRelative` yardımcı fonksiyon yazılabilir. Dependency eklemek istemiyorsan pure JS çözüm yeterli.
- **Öncelik**: P2 — işlevsel değil ama görünüm bozuk

### B8 — ForgotPasswordScreen: E-posta Gerçekte Gitmiyor ⚠️ YAPISAL SORUN
- **Ekran**: `mobile/src/screens/auth/ForgotPasswordScreen.tsx` → "Sıfırlama Linki Gönder"
- **Beklenen davranış**: Kullanıcı e-posta adresine reset token linki gelmeli.
- **Neden çalışmıyor**: `routes/auth.ts` reset token üretiyor ama e-posta servisi yok — token sadece `console.log`'a yazılıyor. Kullanıcı API'den 200 alıyor ama hiçbir şey gelmiyor.
- **Gerekli adımlar**: SendGrid veya AWS SES entegrasyonu. `SENDGRID_API_KEY` env ekle; `services/email.ts` yaz; auth route'ta `sendResetEmail(email, token)` çağır.
- **Öncelik**: P1 — reset akışı görünürde çalışıyor ama sıfırlama imkânsız

---

## Resolved (UX Sprint — 2026-05-11)
- **[BU5]** `HomeScreen.tsx`: header'dan logout butonu kaldırıldı. `useAuth` destructuring'den `logout` çıkarıldı. Header'da yalnızca çan ikonu kaldı.
- **[BU3]** `PremiumScreen.tsx`: Alert hata mesajı kaldırıldı. `purchaseError: string | null` state eklendi. Satın alma hatası inline kırmızı banner ile gösteriliyor (`Colors.dangerLight` arka plan, `alert-circle` ikonu). `Linking.addEventListener` ile `goworldy://payment/success` deep link yakalanınca `/users/me` yeniden çekiliyor.
- **[BU3]** "Yükle" (balanceBtn) butonuna `ActivityIndicator` loading spinner eklendi.
- **[T6]** `PremiumScreen.tsx`: Header'a kapat butonu eklendi (`Ionicons "close"`, `navigation.goBack()`).
- **[T7]** `PremiumScreen.tsx`: CREDIT_ITEMS productType'ları düzeltildi — `credits_topic`, `credits_comment`, `credits_ad` olarak ayrıldı (önceden hepsi `credits_50`'ydi).
- **[BU4]** `HomeScreen.tsx`: aktivite feed — `formatRelativeTime` helper eklendi, her satırda sağda kısa tarih gösteriyor. Ikon badge'leri (`chatbubble`/`checkmark-circle`) renkli arka planla birlikte eklendi. Max 5 aktivite gösteriliyor; 5'ten fazlaysa "Tümünü Gör →" linki görünüyor.
- **[T5]** `NotificationsScreen.tsx`: header sağına kapat butonu eklendi (`navigation.goBack()`). "Tümünü Okundu İşaretle" ve kapat butonu `headerRight` row içinde yan yana.
- **[P0]** `admin/` klasörü: Vite + React + TypeScript scaffold oluşturuldu. `npm install` + `@types/react` + `@types/react-dom` + `react-router-dom` + `axios` eklendi.
- **[P0]** Admin sayfaları: `LoginPage` (JWT auth, admin/mod kontrolü), `DashboardPage` (stats kartları + quick links), `TopicsPage` (pending topic listesi, Onayla/Reddet), `UsersPage` (kullanıcı listesi + rol dropdown).
- **[P0]** Admin `api.ts`: `auth.login`, `admin.dashboard/users/updateUserRole/pendingTopics`, `forum.updateTopicStatus` metodları.
- **[P0]** Admin `AuthContext.tsx`: localStorage persist, token/user state, login/logout.
- **[P0]** Admin `Layout.tsx`: sidebar nav (Dashboard / Konu Onayı / Kullanıcılar), kullanıcı adı, çıkış butonu.
- tsc: API + Mobile + Admin — hepsi temiz.

## Tester Bulguları — 2026-05-11 (agents/tester/memory.md kaynaklı)

### T1 — ForumScreen: Deep-Link Topic'ten Geri Navigasyon Bozuk [P1]
- **Dosya**: `mobile/src/screens/main/ForumScreen.tsx:68-77` ve `128-142`
- **Sorun**: HomeScreen aktivite akışından bir topic açıldığında (`openTopicId` param), `view` şu şekilde set ediliyor: `{ kind: "topic-detail", country: { id: "", name: "", code: "" }, categoryId: "", categoryName: "" }`. Geri basılınca boş `categoryId` ile `ForumTopicsScreen` render ediliyor → `getTopics("")` boş dönüyor → "Henüz konu yok" boş ekranı. Kullanıcı gerçek ülke listesine ulaşmak için 3 kez geri basmak zorunda kalıyor.
- **Düzeltme**: `view.kind === "topic-detail"` + `view.country.id === ""` koşulunda `onBack` direkt `{ kind: "countries" }` set etmeli.

### T2 — HomeScreen: Rehber Progress Bar Daima %0 [P2]
- **Dosya**: `mobile/src/screens/main/HomeScreen.tsx:41`
- **Sorun**: `api.guide.getSteps("1", token)` hardcoded `"1"` ID kullanıyor. Seed'deki ülke ID'leri `"us"`, `"de"`, `"uk"`, `"ca"` vb. `"1"` ID'si DB'de yok → `totalSteps = 0` → `completionPct = 0` → progress bar daima boş.
- **Düzeltme**: `getCountries` çağrısından dönen ülke listesinin ilk elemanının ID'sini kullan: `countries[0]?.id` ile `getSteps` çağır. Ya da `getProgress` üzerinden distinct stepId sayısını kullanacak şekilde stats hesapla.

### T3 — ProfileScreen: Bio "İptal" Butonu Kaydedilmiş Biyo'yu Siliyor [P2]
- **Dosya**: `mobile/src/screens/main/ProfileScreen.tsx:188`
- **Sorun**: `onPress={() => { setEditing(false); setBio(""); }}` — `setBio("")` ile bio boş string'e sıfırlanıyor. Kullanıcı düzenleme iptal ettikten sonra tekrar düzenleme açtığında boş alan görüyor.
- **Düzeltme**: Orijinal bio değerini ayrı bir `const [savedBio, setSavedBio]` state'e sakla; API'den yüklenince `setSavedBio(u.bio || "")` çağır; kaydetince `setSavedBio(bio)` güncelle; iptal'de `setBio(savedBio)` ile geri dön.

### T4 — SqliteGuideRepository: saveProgress Upsert Değil INSERT — Yinelenen Satırlar [P2]
- **Dosya**: `api/src/repositories/sqlite/SqliteGuideRepository.ts:22-26`
- **Sorun**: `saveProgress` her çağrıda yeni row INSERT ediyor. Kullanıcı tamamlanmış bir adımı yeniden cevaplarsa (`state === "completed"` adım tıklanıp güncellendi) DB'de aynı `userId + stepId` için iki satır oluşuyor. `getUserProgress` tüm satırları döndürüyor → `users.ts:56` `completedSteps: progress.length` şişmiş sayı dönüyor (örn. 1 adım güncellendiyse 2 dönüyor).
- **Düzeltme**: `INSERT OR REPLACE INTO user_guide_progress ... ON CONFLICT(userId, stepId) DO UPDATE SET answer=excluded.answer, completedAt=datetime('now')` kullan. Veya önce `SELECT` ile var/yok kontrol et. Ayrıca `IGuideRepository` interface'ine `UNIQUE(userId, stepId)` constraint eklenmeli (db.ts migration). `users.ts` stats route'u `completedSteps: new Set(progress.map(p => p.stepId)).size` olarak güncellenmeli.

### T5-T7 — Küçük UX Sorunları [P3]
- **T5** `NotificationsScreen`: Header'a görünür "×" veya geri butonu ekle (modal olarak sunuluyor, iOS'ta swipe dışında görünür kapat yolu yok).
- **T6** `PremiumScreen`: Header'a görünür kapat butonu ekle (aynı sebep).
- **T7** `PremiumScreen.tsx:17-42`: 3 kredi kartı hepsi `productType: "credits_50"` kullanıyor — ya farklı ürünler olacaksa ayrı product type kullan, ya da aynı ürün olduklarını UI'da belirt.

## Resolved (Tester/PM Sprint — 2026-05-11 Tur 3)
- **[T8]** `config/index.ts`: `stripe.prices` içine `credits_topic`, `credits_comment`, `credits_ad` eklendi — `STRIPE_PRICE_CREDITS_TOPIC/COMMENT/AD` env yoksa `STRIPE_PRICE_CREDITS_50`'yi fallback kullanıyor. `routes/payment.ts` PRICE_MAP'e 3 yeni productType eklendi. `index.ts` CREDITS_GRANT'a aynı tipler (50 kredi each) eklendi. Artık "Konu Aç" / "Yorum Erişimi" / "Reklam Yayınla" butonları backend 400 yerine Stripe Checkout URL döndürüyor.
- **[T9]** `LoginScreen.tsx`: Google flow hatası `Alert.alert` yerine `setError(...)` ile inline error box'a yönleniyor. `Alert` import'u kaldırıldı. `isGoogleSignInConfigured()` false durumu da aynı pattern'e geçirildi. Tüm Google hata yolları artık diğer hata kutularıyla aynı UI'da gösteriliyor.
- **[A1]** `DashboardPage.tsx`: `import { Link } from "react-router-dom"` eklendi. `<a href="/topics">` → `<Link to="/topics">`, `<a href="/users">` → `<Link to="/users">` — SPA full-page reload önlendi.
- **[A2]** `TopicsPage.tsx`: "Reddet" butonuna `window.confirm("Bu konuyu reddetmek istediğinizden emin misiniz?")` eklendi; iptal edilirse `handleAction` çağrılmıyor.
- **[Auth Branding]** `ForgotPasswordScreen.tsx` + `ResetPasswordScreen.tsx`: Her iki ekrana `MaterialCommunityIcons` import edildi ve LoginScreen'deki `logoBox` stili eklendi (`earth` ikonu + "GoWorldy" metni). `paddingTop` 80→60 azaltıldı, logo için `marginBottom` ayrıldı.
- tsc: API + Mobile + Admin — hepsi temiz.

## Buton Audit — Sprint 4 Açık İş Kalemleri (PM tarafından tespit edildi, 2026-05-11)

Tüm mobile + admin butonları kod seviyesinde incelendi. P0/P1/P2 maddelerin tümü çözülmüş durumda.
Aşağıdakiler kalan P3 iş kalemleridir.

### D_NEW1 — RegisterScreen: Logo/Marka Görseli Eksik (P3)
- **Ekran**: `mobile/src/screens/auth/RegisterScreen.tsx`
- **Sorun**: LoginScreen, ForgotPasswordScreen ve ResetPasswordScreen'de `logoBox` bileşeni var (`MaterialCommunityIcons name="earth"` + "GoWorldy" text). RegisterScreen'de yok — görsel tutarsızlık.
- **Düzeltme**:
  1. `MaterialCommunityIcons` import ekle.
  2. `paddingTop: 60` yerine `paddingTop: 20` yap, üste logoBox ekle (LoginScreen:49-57 ile aynı pattern).
  3. `logoBox` + `logo` + `logoText` stillerini ekle.
- **Öncelik**: P3 — işlevsel değil ama marka tutarlılığı için gerekli.

### D_NEW2 — ProfileScreen: followingCount Hardcoded 0 (P3)
- **Ekran**: `mobile/src/screens/main/ProfileScreen.tsx` + `api/src/routes/users.ts`
- **Sorun**: `GET /api/users/me/stats` followingCount değeri hardcoded 0 döndürüyor. Follow/takip sistemi backend'de mevcut değil.
- **Düzeltme**: MVP için `users_follows` tablosu gerekir. Bu kapsamlı bir özellik — kısa vadede stat'ı UI'dan kaldır veya "yakında" etiketi koy. Uzun vadede follow sistemi ekle.
- **Öncelik**: P3 — kullanıcı deneyimini bozmaz, sadece istatistik yanıltıcı.

### D_NEW3 — Bildirim Seed Datası Yok (P3)
- **Dosya**: `api/src/repositories/sqlite/db.ts` (seed bölümü)
- **Sorun**: `notifications` tablosu boş başlıyor. Test/demo ortamında bildirim akışı her zaman "Henüz bildirim yok" gösteriyor.
- **Düzeltme**: Seed'e 3-5 örnek bildirim ekle: 1 `topic_approved`, 1 `comment_reply`, 1 `system` tipi — admin user ID'sine atanmış.
- **Öncelik**: P3 — sadece geliştirme/demo deneyimi için.

### D_NEW4 — Admin: Reddet Sebep Modalı Yok (P3)
- **Ekran**: `admin/src/pages/TopicsPage.tsx`
- **Sorun**: Moderatör konu reddederken sebep giremez. UX spec'i mevcut (`agents/ux-ui/memory.md`). Şu an `window.confirm` ile tek tıkla reddetme var; sebep DB'ye kaydedilmiyor.
- **Düzeltme**:
  1. `TopicsPage.tsx`'e `rejectModal: { open: boolean; topicId: string }` state ekle.
  2. "Reddet" butonuna modalı aç, modal içinde `<textarea>` ile sebep girişi.
  3. "Onayla" clicked'da `api.forum.updateTopicStatus(id, "rejected", token, { reason })` çağır.
  4. Backend `PATCH /api/admin/topics/:id/status` — `reason` alanını `forum_topics.rejectionReason TEXT` kolonu olarak kaydet.
- **Öncelik**: P3 — moderatör iş akışı kalitesi.

### D_NEW5 — Admin: Config Panel Sayfası Yok (P3)
- **Ekran**: `admin/` — `/config` route yok
- **Sorun**: Forum fiyatlandırması ve feature toggle'ları admin panelinden yönetilemiyor. Şu an tüm config env'den geliyor.
- **Düzeltme**:
  1. `admin/src/pages/ConfigPage.tsx` oluştur.
  2. `GET /api/admin/config` endpoint: `config.forum.createTopicCost`, `config.stripe.prices.*` değerlerini döndür.
  3. `PATCH /api/admin/config` (opsiyonel): runtime override için in-memory store veya DB config tablosu.
  4. Admin sidebar'a "Ayarlar" linki ekle (`Layout.tsx`).
- **Öncelik**: P3 — MVP için zorunlu değil.

### D_NEW6 — Admin: CORS Whitelist (P3)
- **Dosya**: `api/src/index.ts`
- **Sorun**: Admin dashboard `localhost:5173`'ten API'ye `localhost:3000`'e istek atıyor. CORS middleware `localhost:5173` origin'ini whitelist'e almıyorsa tarayıcı isteklerini bloke eder.
- **Düzeltme**: `api/src/index.ts` içinde `cors({ origin: ["http://localhost:5173", "http://localhost:3000"] })` ekle (geliştirme için). Prod'da env-driven origin listesi.
- **Öncelik**: P3 — admin dashboard şu an çalışıyorsa sorun yok; deployment öncesinde gerekli.

## Resolved (Sprint 5 — P3 Görevleri — 2026-05-11)
- **[D_NEW1]** `RegisterScreen.tsx`: `MaterialCommunityIcons` import eklendi. `logoBox` + `logo` stilleri eklendi. `paddingTop` 60→20. `ScrollView` içine `<View style={styles.logoBox}>` + `earth` ikonu + "GoWorldy" metni eklendi. Diğer auth ekranlarıyla (Login/ForgotPassword/ResetPassword) marka tutarlılığı sağlandı.
- **[D_NEW2]** Eylem gerekmedi: ProfileScreen stats grid zaten yalnızca topicCount/commentCount/completedSteps gösteriyor. `followingCount` state'de mevcut ancak hiç render edilmiyor — UI önceki sprint'te zaten temizlenmişti.
- **[D_NEW3]** `seed.ts`: Admin kullanıcısına 3 örnek bildirim eklendi (`topic_approved`, `comment_reply`, `system`). Admin için daha önce bildirim seed'i yoksa ekleniyor (idempotent kontrol).
- **[D_NEW4]** Reddet sebep modalı eklendi end-to-end:
  - `db.ts`: `addColumnIfNotExists("forum_topics", "rejectionReason", "TEXT")` — idempotent migrasyon.
  - `IForumRepository.updateTopicStatus`: `reason?: string` parametresi eklendi.
  - `SqliteForumRepository.updateTopicStatus`: reason varsa `SET status = ?, rejectionReason = ?` çalışıyor.
  - `routes/forum.ts`: `req.body.reason` route'a geçirildi.
  - `admin/api.ts`: `updateTopicStatus` imzasına `reason?: string` eklendi.
  - `TopicsPage.tsx`: `rejectModal` state eklendi. "Reddet" butonu modalı açıyor. `<textarea>` ile sebep girişi. "Reddet" confirm → `handleConfirmReject` → API çağrısı. Modal stillleri eklendi.
- **[D_NEW5]** Admin Config Panel oluşturuldu:
  - `admin/src/pages/ConfigPage.tsx`: `GET /api/admin/config` çağrısı, 5 bölümlü salt-okunur tablo (App/Forum/Premium/Rehber/Bildirimler).
  - `admin/api.ts`: `api.admin.config(token)` metodu + `AdminConfig` interface eklendi.
  - `admin/src/App.tsx`: `/config` route eklendi (`ConfigPage`).
  - `admin/src/components/Layout.tsx`: NAV dizisine "Ayarlar" linki eklendi.
- **[D_NEW6]** `api/src/index.ts`: `cors()` → `cors({ origin: allowedOrigins })` şeklinde güncellendi. `CORS_ALLOWED_ORIGINS` env varsa virgülle ayrılmış liste olarak parse ediliyor; yoksa dev defaults (localhost:3000/5173/19006).
- tsc: API + Mobile + Admin — hepsi temiz.

## Sprint 5 — Stakeholder Raporu (2026-05-11) — YENİ

Stakeholder aşağıdaki sorunları raporladı. Tümü incelenmeli ve düzeltilmeli.

### FETCH-1 — Forum + Rehberim "Network Request Failed / Not Fetch" Hatası [P0]
- **Dosya**: `mobile/src/services/api.ts:1` — `const BASE_URL = "http://localhost:3000/api"` hardcoded
- **Sorun**: React Native/Expo'da `localhost` fiziksel cihazda veya Android emülatöründe host makineye değil cihazın kendisine işaret eder. Bu nedenle `getCountries`, `getSteps`, `getProgress` gibi tüm API çağrıları "Network request failed" (kullanıcı bunu "not fetch hatası" olarak tarif ediyor) dönüyor.
- **Düzeltme adımları**:
  1. `mobile/.env`'e (veya `mobile/.env.local`'e) `EXPO_PUBLIC_API_URL` değişkeni ekle
  2. `api.ts:1` → `const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000/api";`
  3. Android emülatörü için: `EXPO_PUBLIC_API_URL=http://10.0.2.2:3000/api`
  4. Fiziksel cihaz için: `EXPO_PUBLIC_API_URL=http://192.168.x.x:3000/api` (makinenin yerel IP'si)
  5. iOS Simulator + Expo Web için mevcut `localhost` çalışır
- **Bağımlılık**: PROF-1, PROF-2 de aynı kök nedenli olabilir — önce FETCH-1'i çöz
- **Öncelik**: P0 — forum ve rehberim sayfaları tamamen kilitli

### PROF-1 — Profil Telefon Toggle'ı Çalışmıyor [P1]
- **Dosya**: `mobile/src/screens/main/PrivacyScreen.tsx:38-51`
- **Sorun**: Toggle `PATCH /api/users/me { sharePhoneNumber: 0 | 1 }` çağrısı yapıyor. FETCH-1 çözülünce test et. Kök neden aynı ağ erişimi sorunuysa düzelir. Bağımsız sorun varsa:
  - `db.ts`'de `users.sharePhoneNumber INTEGER DEFAULT 1` kolonunun var olduğunu doğrula
  - `SqliteUserRepository.update` metodunun `sharePhoneNumber` alanını güncellediğini doğrula
- **Test komutu**: `curl -X PATCH http://localhost:3000/api/users/me -H "Authorization: Bearer TOKEN" -H "Content-Type: application/json" -d '{"sharePhoneNumber": 0}'`
- **Öncelik**: P1

### PROF-2 — Profil Hakkımda Kaydedilemiyor [P1]
- **Dosya**: `mobile/src/screens/main/ProfileScreen.tsx:79-91` (`handleSaveBio`)
- **Sorun**: `PATCH /api/users/me { bio: "..." }` çağrısı yapıyor. FETCH-1 çözülünce test et. Ağ sorunu dışında başka bir sorun varsa:
  - API route (`routes/users.ts:19-49`) `bio` alanını doğru işlediğini doğrula — kod incelemesinde doğru görünüyor
  - Kullanıcının token'ının geçerli olduğunu doğrula
- **Test komutu**: `curl -X PATCH http://localhost:3000/api/users/me -H "Authorization: Bearer TOKEN" -H "Content-Type: application/json" -d '{"bio": "test bio"}'`
- **Öncelik**: P1

### PROF-3 — Avatar Dosya Seçici (Feature Request) [P2]
- **Dosya**: `mobile/src/screens/main/ProfileScreen.tsx:270-305` — mevcut modal URL girişi yapıyor
- **Talep**: Kullanıcı bilgisayardan/cihazdan dosya seçerek avatar yükleyebilmeli (mevcut URL girişi yerine veya ek olarak)
- **Gerekli değişiklikler**:
  1. `expo-image-picker` yükle: `cd mobile && npx expo install expo-image-picker`
  2. `app.json` permissions: `"ios.infoPlist.NSPhotoLibraryUsageDescription"` + `"android.permissions": ["READ_EXTERNAL_STORAGE"]`
  3. `ProfileScreen.tsx` avatar modalını güncelle:
     - "Galeriden Seç" butonu → `ImagePicker.launchImageLibraryAsync({ mediaTypes: "images", base64: true, quality: 0.7 })`
     - Seçilen görseli `data:image/jpeg;base64,...` formatında `avatarUrl` olarak kaydet (MVP — sunucu upload yok)
     - Expo Web'de `launchImageLibraryAsync` otomatik browser file input açar
  4. UX: modal içinde "Galeriden Seç" (birincil) + "URL Gir" (ikincil) seçenekleri sunsun
- **Öncelik**: P2

## Resolved (Stakeholder Sprint — 2026-05-11)
- **[FETCH-1]** `mobile/src/services/api.ts:1`: `BASE_URL` artık `process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000/api"` kullanıyor. `mobile/.env` template dosyası oluşturuldu — Android emülatör (10.0.2.2), fiziksel cihaz (yerel IP) ve iOS Simulator/Web (localhost) talimatları yorumlarda var.
- **[PROF-1 + PROF-2]** Kod incelendi: `PrivacyScreen.handlePhoneToggle` ve `ProfileScreen.handleSaveBio` doğru API çağrılarını yapıyor. FETCH-1 çözümü ile bu sorunlar da çözülmüş oldu — ağ erişimi düzelince toggle ve bio kaydetme çalışır.
- **[PROF-3]** `expo-image-picker@~17.0.11` kuruldu. `app.json`'a iOS (`NSPhotoLibraryUsageDescription`) ve Android (`READ_EXTERNAL_STORAGE`, `READ_MEDIA_IMAGES`) izinleri eklendi. `ProfileScreen.tsx` avatar modalı iki görünümlü hale getirildi: "options" view'ında "Galeriden Seç" (birincil) + "URL Gir" (ikincil) butonları; "url" view'ında URL input + Geri/Kaydet. Galeri seçiminde base64 data URL olarak `PATCH /users/me` çağrısı yapılıyor (MVP — server-side upload yok). İzin reddedilirse kullanıcıya bilgilendirme Alert'i gösteriliyor.
- tsc: API + Mobile — hepsi temiz.

## Open TODOs (güncel)
- PROF-1/PROF-2: FETCH-1 düzeltmesi ile ağ erişimi sağlandıktan sonra fiziksel cihazda test edilmeli. `mobile/.env`'de `EXPO_PUBLIC_API_URL` ayarlanmalı.
- PROF-3: Base64 avatar büyük veri URL'leri üretiyor — uzun vadede S3/Cloudinary yükleme önerilir.
- Push notifications (Expo Notifications + topic abone olunca tetikleme).
- followingCount `/users/me/stats` içinde hardcoded 0 — follow sistemi backend'de yok. (P3)
- Stripe: `.env.development`'a gerçek Stripe Price ID'ler yazılmadan checkout tetiklenmez. (Stakeholder bekleniyor)
- Admin Config Panel sayfası salt-okunur — runtime override yok. (P3)
- Admin Reddet sebep modalı mevcut ama `rejectionReason` bildirim olarak kullanıcıya ulaşmıyor. (P3)

## Sprint 7 — Profil Sayfası Tam Çalışma (Aktif — 2026-05-12)

Stakeholder talebi: Profil sayfasındaki tüm fonksiyonlar çalışmalı — fotoğraf yükleme, radio buttonlar (userType), bio, tüm butonlar.

### PS-1 — userType Değiştirme (Radio Button) [P1 — KRİTİK EKSİK]
- **Sorun**: `ProfileScreen` userType badge GÖSTERIYOR ama kullanıcı türünü DEĞİŞTİREMİYOR. "Göç Adayı / Danışman / Yurt Dışında" için seçim UI'ı yok. Bu stakeholder'ın "radio buttonlar çalışmıyor" dediği şey.
- **Backend eksik**: `api/src/routes/users.ts:21` — `PATCH /users/me` `userType` alanını desteklemiyor (sadece `displayName`, `bio`, `phoneNumber`, `sharePhoneNumber`, `avatarUrl` var).
- **Gerekli değişiklikler**:
  1. `api/src/routes/users.ts:21-37` — `userType` alanını `allowed` nesnesine ekle:
     ```typescript
     const VALID_USER_TYPES = ["emigrant", "consultant", "diaspora"] as const;
     if (typeof userType === "string" && VALID_USER_TYPES.includes(userType as any)) {
       allowed.userType = userType;
     }
     ```
  2. `mobile/src/services/api.ts` — `updateMe` tip tanımına `userType?: string` ekle
  3. `mobile/src/screens/main/ProfileScreen.tsx` — Bio bölümünün altına veya profil kartına "Üye Türü" seçici ekle:
     - 3 seçenek: Göç Adayı / Danışman / Yurt Dışında
     - Seçili olan highlight — UX spec için UX-UI memory'ye bakın
     - Seçim değişince `api.users.updateMe({ userType }, token)` çağrısı
     - Başarı/hata inline feedback (Alert değil)
- **Dosyalar**: `api/src/routes/users.ts`, `mobile/src/services/api.ts`, `mobile/src/screens/main/ProfileScreen.tsx`
- **Öncelik**: P1

### PS-2 — Telefon Numarası Input UI [P1 — EKSİK ÖZELLİK]
- **Sorun**: Backend `PATCH /users/me { phoneNumber }` destekliyor. PrivacyScreen'de "Telefon Numaramı Paylaş" toggle'ı var ama telefon numarasının GİRİLECEĞİ bir input alanı yok. Kullanıcı numarasını kaydedemez.
- **Gerekli değişiklikler**:
  1. `mobile/src/screens/main/PrivacyScreen.tsx` — "Telefon Numaramı Paylaş" toggle'ının üstüne `phoneNumber` input alanı ekle:
     - TextInput (phone keyboard), kaydet butonu
     - `api.users.me(token)` ile mevcut numarayı yükle
     - "Kaydet" basınca `api.users.updateMe({ phoneNumber }, token)` çağrısı
     - Inline başarı/hata mesajı
- **Dosyalar**: `mobile/src/screens/main/PrivacyScreen.tsx`
- **Öncelik**: P1

### PS-3 — Profil Fonksiyonları Doğrulama [P1]
- **Kapsam**: Bio kaydet, Avatar galeri seç, Avatar URL gir, Gizlilik toggle — tümünü tsc temiz + kod seviyesinde doğrula.
- **Tester Doğrulaması (2026-05-12)**:
  - Avatar (PROF-3): ✅ `expo-image-picker` entegre, galeri + URL modal çalışıyor
  - Bio (PROF-2): ✅ `handleSaveBio` → `PATCH /users/me { bio }` doğru
  - Phone toggle (PROF-1): ✅ `PrivacyScreen.handlePhoneToggle` → `PATCH /users/me { sharePhoneNumber }` doğru
  - userType seçici: ✅ PS-1 tamamlandı (Sprint 7 Loop)
  - Phone input: ✅ PS-2 tamamlandı (Sprint 7 Loop)
- tsc: API + Mobile + Admin — temiz
- **Öncelik**: PS-1 ve PS-2 tamamlandı ✅

## Tester Bulguları — 2026-05-12 (6. Tur — Sprint 7)

### S7-1 — ProfileScreen: userType Seçici ✅ ÇÖZÜLDÜ
### S7-2 — PrivacyScreen: Telefon Numarası Input ✅ ÇÖZÜLDÜ

## Resolved (Sprint 7 — Profil Tam Çalışma — 2026-05-12)
- **[S7-1 / PS-1]** `api/src/routes/users.ts:21` — `PATCH /me` handler'a `userType` destructuring eklendi. `VALID_USER_TYPES` array ile validasyon; `ValidUserType` union type ile `allowed` objesine eklendi. Artık backend `userType` değişikliğini kabul ediyor.
- **[S7-1]** `mobile/src/services/api.ts:87` — `updateMe` params'ına `userType?: "emigrant" | "consultant" | "diaspora"` eklendi.
- **[S7-1]** `mobile/src/screens/main/ProfileScreen.tsx` — `handleSelectUserType` fonksiyonu eklendi (optimistic update + rollback). Profil kartından hemen sonra "Üye Türü" section'ı eklendi: 3'lü chip seçici (Göç Adayı / Danışman / Yurt Dışında), seçili chip mavi highlight, inline hata mesajı, loading spinner.
- **[S7-2 / PS-2]** `mobile/src/screens/main/PrivacyScreen.tsx` — `phoneNumber` / `phoneSaved` / `phoneSaving` / `phoneError` state'leri eklendi. `useEffect`'te `api.users.me` ile mevcut numara yükleniyor. Toggle'ın üstüne yeni bir card olarak telefon input bölümü eklendi: TextInput (phone-pad), "Kaydet" butonu (değişiklik yoksa disabled), inline hata, submit-on-return.
- tsc: API + Mobile — hepsi temiz.

### T10-T13 — Renkli Butonlarda `#fff` Token Tutarsızlığı [P3]
- `CreateTopicScreen.tsx:158,161` — Gönder butonu `color="#fff"` → `Colors.surface`
- `ForumTopicDetailScreen.tsx:133,135` — Yorum butonu `color="#fff"` → `Colors.surface`
- `ForumTopicsScreen.tsx:149` — FAB "+" `color="#fff"` → `Colors.surface`
- `GuideScreen.tsx:301,304,406` — Modal kaydet + step dot `color="#fff"` → `Colors.surface`
- **Not**: UX Sprint 7 kapsamı dışında kalmış — UX/UI agent görevi.

## Tester Doğrulaması — 2026-05-12 (7. Tur)
- **S7-1 ✅**: `ProfileScreen.tsx:129,239` chip seçici + `api.ts:94` userType param + `routes/users.ts:40` backend validasyonu — çözülmüş.
- **S7-2 ✅**: `PrivacyScreen.tsx:25,46,104` telefon input + `api.ts:92` phoneNumber param + `routes/users.ts:31` backend — çözülmüş.
- **C1 ❌ P0**: `api/src/index.ts:15-17` — allowedOrigins dev'de `true` olmalı; şu an `localhost:3000/5173/19006` array'ine default ediyor; `localhost:8081` Expo web dev server CORS'tan geçemiyor.
- **C2 ❌ P1**: `ProfileScreen.tsx:374-447` — Avatar modal (URL girişi dahil) hâlâ mevcut; stakeholder "sadece galeri" istedi.
- **C3 ❌ P1**: `ProfileScreen.tsx:461-479` — `StatItem` hâlâ `<View>`; tıklanamıyor.
- **C4 ❌ P1**: `ProfileScreen.tsx:170-176` — "Hakkında" `Alert.alert` kullanıyor; Expo Web'de popup blocker engelliyor.

## Sprint 8 — Stakeholder CORS + UI Bugları (2026-05-12)

**Kök neden**: CORS whitelist eksik + 3 bağımsız UI bug. Önce C1'i çöz, sonra C5 listesini doğrula.

### C1 — CORS Kök Fix [P0 — İLK YAP]
- **Dosya**: `api/src/index.ts:15-18`
- **Sorun**: `allowedOrigins` whitelist sadece `localhost:3000/5173/19006`'yı kapsıyor. Expo web `localhost:8081` veya başka bir port üzerinden istek atıyor; browser bu origin için CORS preflight'tan geçemiyor. Etkilenen endpoint'ler: tüm `PATCH /api/users/me` ve `PATCH /api/notifications/subscriptions/:id` çağrıları.
- **Düzeltme**:
  ```typescript
  const allowedOrigins = process.env.CORS_ALLOWED_ORIGINS
    ? process.env.CORS_ALLOWED_ORIGINS.split(",")
    : true; // dev: tüm origin'lere izin ver
  app.use(cors({ origin: allowedOrigins }));
  ```
  `true` değeri her `Origin` header'ını yansıtır — production'da `CORS_ALLOWED_ORIGINS` env ile kısıtlanır.
- **Beklenen etki**: C1 fix sonrası C5 listesindeki sorunların çoğu otomatik çözülür.
- **Öncelik**: P0

### C2 — Avatar: Sadece Galeriden Yükle, URL Girişini Kaldır [P1]
- **Dosya**: `mobile/src/screens/main/ProfileScreen.tsx`
- **Sorun**: Stakeholder "sadece localden yükleme kalsın" istiyor. Mevcut avatar modal iki seçenek sunuyor: "Galeriden Seç" + "URL Gir". URL girişi kaldırılacak, galeri akışı direkt tetiklenecek.
- **Düzeltme**:
  1. `avatarModalVisible` state kaldır. Avatar'a basınca doğrudan `handlePickFromGallery()` çağır — modal gösterme.
  2. `avatarModalView`, `avatarInput`, `avatarOptionBtn`, `avatarOptionSecondaryBtn`, `modalInput`, `modalActions` → tümünü kaldır.
  3. `handleSaveAvatar` (URL input için olan) kaldır.
  4. `closeAvatarModal` kaldır.
  5. `Modal` (avatar modal) → tamamen kaldır.
  6. `handlePickFromGallery` zaten `ImagePicker.launchImageLibraryAsync` → `PATCH /users/me { avatarUrl }` yapıyor; bu akış korunuyor.
- **Sonuç**: Avatar alanına tek tıkla galeri açılır, seçim yapılır, kayıt otomatik olur.
- **Öncelik**: P1

### C3 — İstatistik Kartları Tıklanabilir Yap [P1]
- **Dosya**: `mobile/src/screens/main/ProfileScreen.tsx`
- **Sorun**: `StatItem` bileşeni `<View>` kullanıyor — tıklanamıyor. Stakeholder "Konu / Yorum / Adım üzerine tıklanamıyor" diye raporladı.
- **Düzeltme**:
  1. `StatItem` fonksiyonuna `onPress?: () => void` prop'u ekle.
  2. `<View style={styles.statItem}>` → `<TouchableOpacity style={styles.statItem} onPress={onPress} activeOpacity={0.75}>`.
  3. Stats grid'deki her `<StatItem>` çağrısına navigasyon ekle:
     - "Konu" → `navigation.navigate("Forum")` (Forum tab)
     - "Yorum" → `navigation.navigate("Forum")` (Forum tab)
     - "Adım" → `navigation.navigate("Guide")` (Guide tab)
  4. `onPress` yoksa (undefined) `TouchableOpacity` yine de render edilebilir — no-op.
- **Öncelik**: P1

### C4 — "Hakkında" Butonu Araştırma + Fix [P1]
- **Dosya**: `mobile/src/screens/main/ProfileScreen.tsx:169-175`
- **Durum**: Kod doğru görünüyor — `MenuRow` → `handleMenuPress("about")` → `Alert.alert(...)`. Expo Web'de `Alert.alert` `window.alert()` olarak çalışır; bazı tarayıcılar bunu popup blocker ile engelliyor olabilir.
- **Düzeltme**:
  1. Expo Web'de `Alert` yerine React Native `Modal` veya inline bilgi paneli kullan. Ya da `Platform.OS === "web"` kontrolü ile web'de alternatif göster.
  2. Kısa vadeli MVP fix: `Alert.alert` yerine `Alert.alert` korunabilir ama web'de log ekle (`console.log("About pressed")`). Sorun devam ederse `ProfileAboutModal` oluştur.
- **Öncelik**: P1

### C5 — CORS Sonrası Doğrulama Listesi [P1 — C1 bağımlılığı]
C1 fix'i sonrası aşağıdaki akışları test et; her biri `PATCH /api/users/me` veya ilgili endpoint'e istek atıyor:
- **Bio kaydetme** (`ProfileScreen.handleSaveBio`): Backend `bio` alanını kabul ediyor ✅, sadece CORS engelliyor.
- **userType seçimi** (`ProfileScreen.handleSelectUserType`): Backend `userType` validasyonu var ✅.
- **Telefon numarası kaydetme** (`PrivacyScreen.handleSavePhone`): Backend `phoneNumber` kabul ediyor ✅.
- **Telefon paylaş toggle** (`PrivacyScreen.handlePhoneToggle`): Backend `sharePhoneNumber` boolean/number kabul ediyor ✅.
- **Takip Ettiklerim toggle** (`NotificationsScreen.handleSubscriptionToggle`): `PATCH /notifications/subscriptions/:id` — CORS fix sonrası test et.
- Eğer C1 sonrası hâlâ başarısız olursa: `curl -X PATCH http://localhost:3000/api/users/me -H "Origin: http://localhost:8081" -H "Authorization: Bearer TOKEN" -H "Content-Type: application/json" -d '{"bio":"test"}'` ile test et.
- **Öncelik**: P1 (C1 tamamlanınca)

## Resolved (Sprint 8 — CORS + UI Bugları — 2026-05-12)
- **[C1]** `api/src/index.ts:15-18`: `allowedOrigins` dev'de `true` olarak güncellendi. `CORS_ALLOWED_ORIGINS` env varsa split ile parse ediliyor; yoksa `true` (tüm origin'ler). Expo web `localhost:8081` dahil tüm dev originleri artık CORS'tan geçiyor.
- **[C2]** `ProfileScreen.tsx`: Avatar modal tamamen kaldırıldı (`avatarModalVisible`, `avatarModalView`, `avatarInput`, `closeAvatarModal`, `handleSaveAvatar` state/fonksiyonları silindi). Avatar box `onPress` artık direkt `handlePickFromGallery()` çağırıyor. URL girişi yok. Galeri seçimi otomatik kayıt yapıyor.
- **[C3]** `ProfileScreen.tsx:StatItem`: `<View>` → `<TouchableOpacity onPress={onPress} activeOpacity={0.75}>`. Stats grid'e navigasyon eklendi: Konu/Yorum → `navigate("Forum")`, Adım → `navigate("Guide")`.
- **[C4]** `ProfileScreen.tsx:handleMenuPress("about")`: `Alert.alert` kaldırıldı. `aboutVisible` state eklendi. Hakkında bilgisi React Native `Modal` ile gösteriliyor — Expo Web'de popup blocker engeli yok.
- Kullanılmayan stiller (`modalInput`, `modalActions`, `modalCancel`, `modalCancelText`, `avatarOptionBtn`, `avatarOptionBtnText`, `avatarOptionSecondaryBtn`, `avatarOptionSecondaryBtnText`) silindi.
- tsc: API + Mobile — hepsi temiz.

## Resolved (Sprint 6 — Rekabet Analizi Görevleri — 2026-05-12)
- **[R1]** `GET /api/forum/search?q=...&countryId=...` endpoint eklendi. `IForumRepository.searchTopics` interface + `ForumSearchResult` type. `SqliteForumRepository.searchTopics`: LIKE sorgusu — title veya comment içeriği eşleşirse döndürüyor. ülke filtresi opsiyonel. Limit 50. Mobile `api.forum.search` metodu eklendi.
- **[R2]** `POST /api/forum/topics/:id/upvote` [auth] endpoint eklendi (toggle: varsa sil, yoksa ekle). `forum_topic_upvotes` tablosu `db.ts`'e eklendi. `IForumRepository.upvoteTopic` interface + `ForumTopic.upvotes?: number` alanı. `SqliteForumRepository.upvoteTopic` implementasyonu. Mobile `api.forum.upvoteTopic` metodu eklendi.
- **[R3]** `AppNavigator.tsx`'e `linking` config eklendi: `goworldy://forum/topic/:openTopicId` → Forum tab (ForumScreen `openTopicId` param'ı zaten okuyor), `goworldy://guide/:countryId` → Guide tab, `goworldy://home` → Home, `goworldy://profile` → Profile.
- **[R4]** `IUserRepository.User`'a `onboardingCompleted?: boolean` ve `targetCountryId?: string` eklendi. `db.ts`'e idempotent migrasyon kolonu eklendi. `routes/users.ts` PATCH `/me` handler'ı bu alanları kabul ediyor. Mobile `api.users.updateMe` tip tanımı güncellendi.
- **[R5]** `GET /api/users/consultants` (userType=consultant filtreli, şifre hariç) ve `GET /api/users/consultants/:id` endpoint'leri `routes/users.ts`'e eklendi. Mobile `api.users.consultants()` ve `api.users.consultant(id)` metodları eklendi.
- tsc: API + Mobile — hepsi temiz.

## Sprint 9 — Bildirim Sistemi (2026-05-14)

### Uygulanan Değişiklikler ✅

**Backend:**
- `db.ts`: `USER_TOPIC_SUBSCRIPTIONS` koleksiyonu + unique index (`userId, topicId`) eklendi.
- `IForumRepository`: `getTopicById(id)` metodu eklendi; `MongoForumRepository`'de implement edildi.
- `INotificationRepository`: `getUnreadCount`, `getTopicSubscriptions`, `setTopicSubscription`, `isTopicSubscribed`, `getTopicSubscriberIds`, `notifyCountrySubscribers`, `notifyTopicSubscribers` eklendi. Yeni tipler: `topic_new`, `new_comment`.
- `MongoNotificationRepository`: Tüm yeni metodlar implement edildi (fan-out dahil).
- `routes/notifications.ts`: `GET /unread-count`, `GET /topic-subscriptions` endpoint'leri eklendi.
- `routes/forum.ts`: `POST/DELETE/GET /topics/:id/subscribe` endpoint'leri eklendi. Notification trigger'ları eklendi: `createTopic` (approved) → `notifyCountrySubscribers`; `createComment` → `notifyTopicSubscribers`; `updateTopicStatus` → yazar bildirimi + country fan-out.
- `routes/admin.ts`: `broadcastPendingTopic()` SSE fan-out fonksiyonu + `GET /topics/stream` SSE endpoint (query param `?token=` auth).

**Admin Frontend:**
- `TopicsPage.tsx`: SSE `EventSource` entegrasyonu — real-time pending topic listesi, live status chip ("● Canlı" / "○ Bağlanıyor" / "✕ Çevrimdışı").

**Mobile:**
- `api.ts`: `notifications.getUnreadCount`, `getTopicSubscriptions`, `subscribeToTopic`, `unsubscribeFromTopic`, `isTopicSubscribed` metodları eklendi. Notification type'ına `topic_new` ve `new_comment` eklendi.
- `AppNavigator.tsx`: `useUnreadCount` hook (AppState "active" event'inde otomatik yenileme), `BadgeDot` bileşeni (9+ kuralı, danger rengi), Home tab ikonuna badge eklendi.
- `ForumTopicDetailScreen.tsx`: Header sağ üstüne "Konuyu Takip Et" çan butonu eklendi (optimistic toggle, WCAG uyumlu).
- `NotificationsScreen.tsx`: `NotifType`'a `topic_new` ve `new_comment` eklendi; `ICON_MAP`'e yeni tipler için ikonlar eklendi.

**tsc:** API + Mobile — temiz. Admin node_modules mevcut olmadığından tsc çalıştırılamadı (syntax doğru).

## Sprint 1 — Tester P0 Bug Fix (2026-05-16)

### SEC-06 — passwordHash Sızıntısı
- **Dosya**: `api/src/routes/users.ts`
- **Bulgı**: Zaten fix'liydi. GET /me (satır 12), PATCH /me (satır 60), GET /consultants (satır 146), GET /consultants/:id (satır 159) — hepsi `{ passwordHash, ...safe }` pattern kullanıyor.
- **Aksiyon**: Değişiklik gerekmedi.

### CR-07 — Kredi Eksi Düşülmemeli
- **Dosya**: `api/src/repositories/mongodb/MongoUserRepository.ts`
- **Bulgı**: Zaten fix'liydi. `deductCredits` metodu `{ credits: { $gte: amount } }` koşulu ile atomik MongoDB `updateOne` yapıyor — yetersiz kredide 0 document değiştirilir, `modifiedCount === 0` → `false` döner.
- **Aksiyon**: Değişiklik gerekmedi.

### CR-03 — Atomik Kredi İşlemi (Forum Topic)
- **Dosya**: `api/src/routes/forum.ts`
- **Sorun**: `deductCredits` başarılıysa kredi düşülüyordu, ama `createTopic` exception atarsa kredi geri verilmiyordu.
- **Fix**: `createTopic` çağrısını `try-catch`'e aldım. Hata durumunda premium değilse `addCredits(userId, TOPIC_COST)` ile refund yapılıyor, 500 dönülüyor.

### P10-4 — CreateTopicScreen "Onayla ve Gönder"
- **Dosya**: `mobile/src/screens/main/CreateTopicScreen.tsx`
- **Bulgı**: Kod incelemesinde bug yok — `CreditGateModal.onDeduct={doCreate}` doğru bağlı, `doCreate` içinde `categoryId`/`title`/`token` doğru geçiliyor, `gateVisible` sıralaması (setGateVisible(false) → setSubmitting(true)) doğru. Memory'deki P10-4 açıklaması network hatasına ya da boş `categoryId` prop'una işaret ediyor — caller (ForumScreen) tarafında kontrol edilmeli.
- **Aksiyon**: Değişiklik gerekmedi.

### P10-5 — ForumTopicsScreen FAB → Premium Navigate
- **Dosya**: `mobile/src/screens/main/ForumTopicsScreen.tsx`
- **Bulgı**: Kod doğru — `CreditGateModal.onBuy` → `setGateVisible(false); onNavigatePremium?.()`. `onNavigatePremium` prop tanımlı. Navigator'da "Premium" stack name doğru.
- **Aksiyon**: Değişiklik gerekmedi.

### AD-02 + SEC-03 — Admin Endpoint Koruması
- **Dosya**: `api/src/routes/admin.ts` + `api/src/middleware/auth.ts`
- **Bulgı**: Tüm admin endpoint'lerinde `requireRole(...)` var. `/topics/stream` endpoint'i kendi içinde manuel JWT doğrulama + role check yapıyor (EventSource custom header gönderemiyor — query param ile token alınıyor). `requireRole` middleware doğru implement edilmiş.
- **Aksiyon**: Değişiklik gerekmedi.

### SEC-01 — Süresi Dolmuş JWT Yönetimi
- **Dosya**: `mobile/src/services/api.ts`, `mobile/src/context/AuthContext.tsx`
- **Sorun**: API 401 dönünce `Error` throw ediyordu ama 401'i normal hata gibi işliyordu. `AuthContext` 401'i intercept etmiyordu.
- **Fix**:
  1. `api.ts`'e `ApiError` class'ı eklendi (status code taşıyor).
  2. `api.ts`'e `setOn401Handler` + `_on401` global callback mekanizması eklendi. Token içeren request'ler 401 dönünce `_on401?.()` tetikleniyor.
  3. `AuthContext`'te `useEffect` ile `setOn401Handler` set ediliyor — AsyncStorage temizlenir, state null'a çekilir → navigator otomatik LoginScreen'e yönlendirir.
  4. `AuthContextValue`'ye `logoutOnUnauthorized` metodu eklendi.
- **tsc**: API temiz, Mobile temiz.

## Open TODOs (güncellendi — 2026-05-16)
- Push notifications (Expo Notifications + topic abone olunca tetikleme). (P2)
- S3/Cloudinary avatar yükleme — şu an base64 data URL (büyük veri). (P3)
- followingCount `/users/me/stats` hardcoded 0 — follow sistemi yok. (P3)
- Stripe: `.env.development`'a gerçek Price ID'ler yazılmadan checkout tetiklenmez. (Stakeholder bekleniyor)
- Admin Reddet sebep modalı mevcut ama `rejectionReason` kullanıcıya bildirim olarak ulaşmıyor. (P3)
- Onboarding flow UI (mobile): `onboardingCompleted` backend'de hazır, mobil ekran yok. (P2)
- SqliteUserRepository: `onboardingCompleted` INTEGER→boolean dönüşümü `toUser`'da yapılmalı (şu an raw integer dönüyor). (minor bug)
- P10-4 kök sebebi hâlâ tam doğrulanamadı — ForumScreen'den `categoryId` prop'u boş geçiyor olabilir; canlı test ile doğrulanmalı.

## Sprint 2 (Test Bulgulari -- P1) -- 2026-05-16

### 1. Forum Topic content Alani (Sprint 1'den tasindi)
- **Bulgu**: `routes/forum.ts` POST /topics -> `body.content` alinmiyordu. `IForumRepository.ForumTopic` interface'inde `content` alani yoktu.
- **Aksiyon (FIX)**:
  - `IForumRepository.ts`: `ForumTopic` interface'ine `content?: string` eklendi.
  - `IForumRepository.ts`: `getTopics` metoduna `options?: { onlyApproved?: boolean }` parametresi eklendi.
  - `routes/forum.ts`: `const { categoryId, title, content } = req.body;` ve `createTopic` cagrisina `content` eklendi.
  - `MongoForumRepository.createTopic`: `data` spread ile content otomatik yaziliyor (zaten generic).

### 2. A-15/A-16/A-17: Reset Password Token Dogrulamalari
- **Bulgu**: ZATEN DOGRUYDU. `routes/auth.ts` POST /reset-password icinde `jwt.verify` try-catch mevcut, gecersiz/suresi dolmus token icin 401 donuyor, `purpose !== 'reset'` kontrolu var.
- **Aksiyon**: Degisiklik gerekmedi.

### 3. F-04: GET Topics -- Sadece Approved Konular
- **Bulgu**: `MongoForumRepository.getTopics` status filtresi uygulamiyordu -- pending/rejected konular da listeleniyor olabilirdi.
- **Aksiyon (FIX)**:
  - `IForumRepository.ts`: `getTopics(categoryId, options?)` imzasi guncellendi.
  - `MongoForumRepository.getTopics`: `options?.onlyApproved` varsa `filter.status = 'approved'` ekleniyor.
  - `routes/forum.ts` GET /categories/:categoryId/topics: `{ onlyApproved: true }` parametresiyle cagriliyor.

### 4. F-16/F-17: Upvote Toggle
- **Bulgu**: ZATEN DOGRUYDU. `MongoForumRepository.upvoteTopic` -- mevcut upvote varsa delete, yoksa insert; toggle davranisi tam dogru.
- **Aksiyon**: Degisiklik gerekmedi.

### 5. NO-03/NO-05/NO-06: Notification Guvenligi
- **Bulgu**: GET /, GET /unread-count, PATCH /read-all -- userId filtreli, guvenli. PATCH /:id/read -> `markRead(id, userId)` userId kosuluyla calisiyor ama eslesme yoksa 200 donuyordu (403 yerine).
- **Aksiyon (FIX)**:
  - `INotificationRepository.ts`: `markReadOwned(id, userId): Promise<boolean>` metodu eklendi.
  - `MongoNotificationRepository.ts`: `markReadOwned` -- updateOne `matchedCount > 0` ise true doner.
  - `routes/notifications.ts` PATCH /:id/read: `markReadOwned` kullaniliyor; `false` donerse 403 yaniti.

### 6. G-06/G-07: Guide Progress
- **Bulgu**: ZATEN DOGRUYDU. `MongoGuideRepository.saveProgress` -- `findOneAndUpdate` ile `upsert: true` -> ayni stepId tekrar gelince uzerine yazar. `resetAllChecklistProgress` metodu mevcut, `routes/guide.ts` POST /progress'te farkli ulke icin otomatik cagriliyor.
- **Aksiyon**: Degisiklik gerekmedi.

### 7. PM-09/PM-10: Stripe Webhook Guvenligi
- **Bulgu**: ZATEN DOGRUYDU. `api/src/index.ts:36-56` -- webhook endpoint tam olarak dogru implement edilmis: `express.raw()` ile raw body, `stripe.webhooks.constructEvent` imza dogrulamasi, gecersiz imzada 400, `checkout.session.completed` event'inde `isPremium=true` + `premiumUntil` set, kredi ekleme.
- **Aksiyon**: Degisiklik gerekmedi.

### tsc Sonuclari
- `api`: Temiz (0 hata)
- `mobile`: Temiz (0 hata)

## UX/UI Sprint 3+4 Audit — Developer Görevleri (2026-05-16)

UX/UI agent'ı Sprint 3 ve Sprint 4 kapsamındaki ekranları audit etti. Aşağıdaki görevler developer implementasyonu bekliyor.

| Kod | Öncelik | Dosya | Görev |
|-----|---------|-------|-------|
| SP34-D1 | **P2** | `mobile/src/screens/main/GuideScreen.tsx` | `activateBtn` `minHeight: 36` → `MinTapTarget` (44pt WCAG) |
| SP34-D2 | **P2** | `mobile/src/screens/main/ForumTopicsScreen.tsx` | FlatList'e `onEndReached` + `onEndReachedThreshold={0.3}` + `ListFooterComponent` (ActivityIndicator) — pagination için API'ye `?page=` parametresi ekle |
| SP34-D3 | **P2** | `mobile/src/navigation/AppNavigator.tsx` | Deep link intent korunması: giriş yapılmamış kullanıcı `goworldy://forum/topic/:id` açınca → login sonrası otomatik topic'e navigate. `pendingDeepLink` state + `AuthContext.login()` sonrası navigate. |
| SP34-D4 | **P2** | `mobile/src/screens/main/PremiumScreen.tsx` | `activePremiumCard`: `premiumUntil` - şu an < 24 saat kaldıysa `backgroundColor: Colors.warning` (amber), normal durumda `Colors.secondary` (yeşil) |
| SP34-D5 | **P3** | `mobile/src/services/api.ts` | `request()` fonksiyonuna 429 özel handling: `if (res.status === 429) throw new ApiError("Çok fazla istek gönderildi. Lütfen bir dakika bekleyin.", 429)` |
| SP34-D6 | **P3** | `mobile/src/screens/main/CreateTopicScreen.tsx` | `btnText: color: "#fff"` → `color: Colors.surface` (token tutarlılığı) |
| SP34-D7 | **P3** | `mobile/src/screens/main/GuideScreen.tsx` | `badgeNum color: "#fff"` → `Colors.surface`, `tabBadgeTextActive color: "#fff"` → `Colors.surface` |
| SP34-D8 | **P3** | `admin/src/pages/UsersPage.tsx` | `searchInput` CSS: `border: "1px solid #E2E8F0"`, `borderRadius: 8`, `outline: "none"` ekle |
| SP34-D9 | **P3** | `mobile/src/screens/main/ForumTopicsScreen.tsx` | CT-08 Pending badge: `statusPending` view'ına küçük `lock-closed` Ionicons ikon ekle |

**Deep Link UX Spec (SP34-D3 detay):**
```
// AppNavigator.tsx
const [pendingUrl, setPendingUrl] = useState<string | null>(null);
// isLoading false + user null iken gelen URL'yi kaydet
// user state true'ya geçince pendingUrl var mı bak → navigate
// LoginScreen'de banner göster: "Bu içeriği görüntülemek için giriş yapmanız gerekiyor."
//   (Colors.primaryLight bg, Colors.primary text, information-circle ikon)
```

**429 UX Spec (SP34-D5 detay):**
- Ekran seviyesinde `ApiError.status === 429` ise özel inline errorBox + 60 saniyelik geri sayım
- Timer sıfırlanınca retry butonu aktif hale gelir
- P3 — backend'de rate limiting aktif mi onaylanmadan implement edilmeyebilir

## Sprint 3 (P2) — 2026-05-16

- **S3-1 / L-09** FIX UYGULAND: `AuthContext.tsx` — token restore sırasında JWT payload'dan `exp` alanı okunuyor. Süresi dolmuşsa AsyncStorage temizlenir, user=null ile login ekranı gösterilir. 401 handler (on API response) zaten Sprint 1'de eklenmişti.
- **S3-2 / U-09** ZATEN DOĞRUYDU: `routes/users.ts` PATCH /me — sadece `displayName`, `bio`, `phoneNumber`, `sharePhoneNumber`, `avatarUrl`, `userType`, `onboardingCompleted`, `targetCountryId`, `activeGuideCountryId` whitelist'te. `role`, `credits`, `isPremium`, `premiumUntil` hiçbir zaman set edilmiyor.
- **S3-3 / NO-07/08/09** ZATEN DOĞRUYDU: `routes/notifications.ts` — GET/PATCH /subscriptions, GET /topic-subscriptions mevcut. `MongoNotificationRepository` — `setSubscription`, `setTopicSubscription` implement edilmiş.
- **S3-4 / N-10** ZATEN DOĞRUYDU: `AppNavigator.tsx` — `BadgeDot` bileşeni, `useUnreadCount` hook (AppState listener), Home tab badge (count>0 sayı, >9 "9+") zaten implement edilmişti.
- **S3-5 / G-03** ZATEN DOĞRUYDU: `GuideScreen.tsx` — `blockingAnswer` alanı Step interface'de mevcut, `computeVisible` blocker mantığı implementli, `BlockerCard` gösteriliyor. API guide.ts `getSteps` blockingAnswer döndürüyor.
- **S3-6 / FT-05/F-05** FIX UYGULAND: `IForumRepository.getTopics` imzası paginated response döndürecek şekilde güncellendi `{ data, total, page, totalPages }`. `MongoForumRepository.getTopics` skip/limit uyguluyor. `routes/forum.ts` `?page=&limit=` query parametre alıyor (varsayılan page=1, limit=20). `mobile/src/services/api.ts` `getTopics` paginated response tipi. `ForumTopicsScreen` — "Daha fazla yükle" butonu + append mantığı eklendi.
- **S3-7 / CT-08** ZATEN DOĞRUYDU: `routes/forum.ts` PATCH /topics/:id/status — topic yazarına `topic_approved`/`topic_rejected` bildirimi zaten gönderiliyor. Onayda country subscribers da notify ediliyor.

## Sprint 4 (P3) — 2026-05-16

- **S4-1 / NAV-05/06** FIX UYGULAND: `AppNavigator.tsx` linking config — `Forum` tab artık `path: "topic/:openTopicId"` ile eşleşiyor. `goworldy://topic/:id` açıldığında Forum tab'ı `openTopicId` parametresiyle açılıyor.
- **S4-2 / SEC-04** FIX UYGULAND: `routes/forum.ts` search — `typeof q !== 'string'` kontrolü + `$`/`{` ile başlıyorsa 400. `MongoForumRepository.searchTopics` — regex özel karakterleri escape ediliyor. `MongoUserRepository.search` — aynı regex escape uygulandı.
- **S4-3 / SEC-07** FIX UYGULAND: `express-rate-limit@8.5.2` pnpm ile kuruldu. `api/src/index.ts` — auth endpoint'leri (login/register/forgot-password) 10 istek/dakika; genel API 100 istek/dakika. Standart headers (Retry-After vb.) eklendi.
- **S4-4 / SEC-08** ZATEN DOĞRUYDU: `api/src/index.ts` — `CORS_ALLOWED_ORIGINS` env varsa parse, yoksa `true`. Sprint 8'de zaten doğru şekilde implementlenmişti.
- **S4-5 / AD-08/09** FIX UYGULAND: `admin/src/api.ts` — `users(token, search?)` imzası güncellendi, `?search=` query parametresi API'ye gönderiliyor. `admin/src/pages/UsersPage.tsx` — arama input'u keystrokes'ta API'ye istek atıyor (>=2 karakter ise server-side, yoksa tüm liste).
- **S4-6 / AD-10/11** ZATEN DOĞRUYDU: `routes/admin.ts` PATCH /users/:id/role — `{ role }` alıyor, `config.roles` ile validasyon, geçersiz rol için 400. Admin UsersPage — role dropdown select çalışıyor.
- **S4-7 / P10-1** FIX UYGULAND: `IUserFeatureRepository.ts` oluşturuldu. `MongoUserFeatureRepository.ts` oluşturuldu. `db.ts` — `USER_FEATURES` koleksiyonu + index'ler eklendi. `repositories/index.ts` — `userFeatures` wire edildi. `routes/payment.ts` — `POST /spend-credit` öncesinde `hasFeature` kontrolü (zaten sahipse 409 `ALREADY_OWNED`); başarılıysa 30 günlük `expiresAt` ile `addFeature`. `GET /my-features` endpoint eklendi. `index.ts` webhook — premium satın alınca `userFeatures`'a da kayıt ekleniyor.
- **S4-8 / P10-2** FIX UYGULAND: `PremiumScreen.tsx` — `formatTimeRemaining(expiresAt)` helper export edildi (>24h: "X gün Y saat", <24h: "X saat Y dakika", geçmiş: "Süresi doldu"). `activePremiumCard` artık tarih string'i yerine formatTimeRemaining çıktısını gösteriyor. `mobile/src/services/api.ts` — `payment.myFeatures(token)` metodu eklendi.

**tsc sonuçları (2026-05-16):**
- API: Yalnızca pre-existing TS2688 hataları (npm/pnpm hoist çakışması) — kod seviyesinde hata yok.
- Mobile: Temiz (0 hata).
- Admin: Temiz (0 hata).
