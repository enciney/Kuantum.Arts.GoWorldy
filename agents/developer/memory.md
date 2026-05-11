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

## Open TODOs (next session)
- Forum approval queue admin UI (admin dashboard yapılınca).
- Push notifications (Expo Notifications + topic abone olunca tetikleme).
- Image storage (avatar upload).
- **Admin dashboard (React) — henüz başlamadı. En büyük eksik.**
- Reset token e-posta servisi (SendGrid/SES) — şu an console.log.
- NotificationsScreen "takip ettiklerim" toggle'ları frontend-only (API endpoint yok).
- LoginScreen hata mesajı: Google flow path'inde Alert ile gösteriliyor, diğer path'lerde error box — UI tutarsızlığı.
- followingCount `/users/me/stats` içinde hardcoded 0 — follow sistemi backend'de yok.
- Stripe: Gerçek `priceId` (Stripe Price ID) yapılandırması yapılmadan checkout çalışmaz. `.env.development`'a `STRIPE_SECRET_KEY` + her paket için Stripe Price ID eklenmeli.
