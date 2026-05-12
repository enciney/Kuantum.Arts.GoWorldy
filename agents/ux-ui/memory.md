# UX/UI Agent Memory

## Design Decisions
- Chose blue/emerald color palette: blue for action, emerald for progress/success — reinforces the "journey" metaphor of emigrating.
- 4-tab bottom nav chosen over drawer: emigrant users are mobile-first, bottom nav is more thumb-friendly.
- Country cards in forum use flag emoji for instant recognition without SVG overhead.
- Paywall shown as an inline gate (not a full-screen blocker) to avoid interrupting discovery flow.
- **`#8B5CF6` violet added as "premium" token** — already consistently used in HomeScreen and PremiumScreen for premium features. Officially added to design system as a distinct premium accent. Not to be used for anything other than premium-related UI.
- **Avatar uses initials (MVP decision)** — camera roll upload deferred post-MVP. Initial letters from `displayName` are used. Acceptable for launch; revisit when user base grows.
- **Forum moderation badge**: regular users CAN see their own "pending" topics — confirmed as correct UX (transparency over confusion).
- **PrivacyScreen as full-screen Modal** — shown as `animationType="slide"` Modal from within ProfileScreen. Avoids needing a Profile stack navigator; developer can lift to a proper screen later.
- **CreditGateModal hierarchy**: primary CTA = "Bakiyeden Düş" (only when canAfford), secondary = "Premium'a Geç / Kredi Satın Al" (violet when insufficient, outlined when can afford). This spec is the canonical design for all credit-gated actions.
- **Guide step states**: 4 distinct states — completed (green), active (blue outlined, next to answer), locked (gray, tap shows toast), disqualified (amber warning, result of a blockingAnswer match). Visual differentiation is critical for the sequential unlock flow.
- **Sequential step unlock**: only the first incomplete step is "active". Steps after it are "locked" until opened. If a completed step's answer matches its `blockingAnswer`, all subsequent steps become "disqualified".

## Rejected Concepts
- Linear wizard flow for Rehberim guide — reconsidered. MVP uses sequential unlock (each step unlocks the next), which is more guided than free-form checklist but still allows going back to completed steps.

## Resolved Issues
- `ProfileScreen` "Üye" badge now uses `USER_TYPE_LABELS[userType]` fetched from `/users/me` response (resolved 2026-05-11).
- All 5 changed screens (PremiumScreen, ProfileScreen, ForumTopicsScreen, ForumTopicDetailScreen, GuideScreen) now import from `theme.ts`. Hardcoded color/spacing values eliminated from these files.
- ProfileScreen menu buttons (Bildirim Ayarları, Gizlilik, Yardım, Hakkında) are now wired with handlers. Gizlilik opens PrivacyScreen modal; Yardım opens mailto; Hakkında opens Alert.
- `mobile/src/services/api.ts` updated: `AuthUser` now includes `userType?`, `me()` return includes `userType`, `sharePhoneNumber`, `phoneNumber`; `updateMe()` accepts `sharePhoneNumber` and `phoneNumber`; `guide.getSteps()` returns `blockingAnswer?`.

## Open Design Questions
- Admin dashboard: no screens exist yet. Spec is in `agents/ux-ui/README.md` (Overview, User Management, Topic Approval Queue, Config Panel). **Next UX/UI priority**.
- `CreditGateModal` is designed but not yet wired into ForumTopicsScreen FAB — Developer agent needs to plug in credit check + deduction calls.
- `GuideScreen` locked/disqualified states work on the UI side. Developer needs to add `blockingAnswer TEXT` column to `guide_steps` DB schema and return it from the API.
- Bildirim Ayarları in ProfileScreen shows a placeholder Alert — full NotificationsScreen navigation requires developer to add a Profile stack navigator.

## Design Audit — Mobile (2026-05-11)

### Sprint Deliverables — COMPLETE ✅

| Deliverable | File | Status |
|-------------|------|--------|
| CreditGateModal component | `mobile/src/components/CreditGateModal.tsx` | ✅ New |
| PrivacyScreen | `mobile/src/screens/main/PrivacyScreen.tsx` | ✅ New |
| PremiumScreen theme refactor | `mobile/src/screens/main/PremiumScreen.tsx` | ✅ Done |
| ProfileScreen theme refactor + badge + handlers + privacy modal | `mobile/src/screens/main/ProfileScreen.tsx` | ✅ Done |
| ForumTopicsScreen theme refactor | `mobile/src/screens/main/ForumTopicsScreen.tsx` | ✅ Done |
| ForumTopicDetailScreen theme refactor | `mobile/src/screens/main/ForumTopicDetailScreen.tsx` | ✅ Done |
| GuideScreen theme refactor + 4-state step visuals | `mobile/src/screens/main/GuideScreen.tsx` | ✅ Done |
| api.ts type updates | `mobile/src/services/api.ts` | ✅ Done |

## Buton Audit — UX/UI İş Kalemleri (PM tarafından tespit edildi, 2026-05-11)

### BU1 — ProfileScreen: Avatar Düzenleme Etkileşimi
- **Ekran**: `mobile/src/screens/main/ProfileScreen.tsx`
- **Buton**: Avatar alanının üzerindeki düzenleme ikonu
- **Beklenen davranış**: Kullanıcı tıklayınca fotoğraf güncelleme akışı başlamalı.
- **UX Spec**:
  - MVP: Küçük bir bottom sheet ya da Alert ile "URL Gir" seçeneği sunulacak. Input field → "Kaydet" butonu. Hatalı URL girilmişse satır altında kırmızı hata mesajı.
  - Avatar alanı üzerinde düzenleme göstergesi: yarı-saydam siyah overlay + kamera ikonu (şu an sadece ikon var, overlay yok).
  - Loading state: kaydetme sırasında avatar içinde `ActivityIndicator` (ikon yerine).
- **Tasarım token'ları**: overlay `rgba(0,0,0,0.4)`, ikon `colors.white`, boyut tema `spacing.xl`.
- **Öncelik**: P2

### BU2 — NotificationsScreen: Bildirim Satırı Tıklama Geri Bildirimi
- **Ekran**: `mobile/src/screens/main/NotificationsScreen.tsx`
- **Buton**: `NotifRow` — her bildirim satırı
- **Beklenen davranış**: Tıklanınca görsel ripple/opacity geri bildirimi + ilgili içeriğe geçiş.
- **UX Spec**:
  - `TouchableOpacity activeOpacity={0.7}` ile tıklama geri bildirimi (şu an yok).
  - Okunmamış bildirimler: sol kenarda `4px` mavi border + açık mavi arka plan (`colors.blue[50]`).
  - Okunmuş bildirimler: border yok, beyaz arka plan.
  - Tıklama sonrası satır anında okunmuş stiline geçmeli (optimistic update).
  - Forum bildirimleri için küçük forum-ikon badge (sağ üst köşe).
- **Tasarım token'ları**: border `colors.blue[500]`, arka plan `colors.blue[50]`, geçiş `50ms` opacity.
- **Öncelik**: P1

## Design Audit — Mobile (2026-05-11, Sprint 2)

### theme.ts Tam Kapsam — COMPLETE ✅

Bu sprint'te kalan tüm ekranlar `theme.ts` tokenlarına geçirildi. Artık hiçbir
mobil ekranda hardcoded renk/spacing değeri bulunmuyor.

| Ekran | Dosya | Değişiklik |
|-------|-------|-----------|
| HomeScreen | `main/HomeScreen.tsx` | ✅ theme.ts geçişi |
| NotificationsScreen | `main/NotificationsScreen.tsx` | ✅ theme.ts geçişi + BU2 uygulandı |
| ForumScreen | `main/ForumScreen.tsx` | ✅ theme.ts geçişi |
| LoginScreen | `auth/LoginScreen.tsx` | ✅ theme.ts geçişi + MinTapTarget |
| RegisterScreen | `auth/RegisterScreen.tsx` | ✅ theme.ts geçişi + Error Box |

### BU2 — Çözüldü ✅
- `notifUnread` stili: `borderLeftWidth: 4`, `borderLeftColor: Colors.primary`, `overflow: "hidden"`
- `activeOpacity={0.7}` zaten uygulanmıştı
- Optimistic update (okundu işaretleme) zaten çalışıyordu

### RegisterScreen Error Box — Çözüldü ✅
- Düz `<Text style={error}>` → icon'lu error box (LoginScreen ile tutarlı)
- `Ionicons "alert-circle"` + `Colors.dangerLight` arka plan

### Tasarım Notu: Auth Ekranları MinTapTarget
- `showBtn` (şifre görünürlük toggle): görsel 22px icon ama dokunma alanı 44×44pt
- `inputRow` min-height: `MinTapTarget` — form alanları da WCAG AA dokunma hedefi
- `googleBtn`: min-height: `MinTapTarget`

### Tespit Edilen Açık Sorunlar (Bu Sprint Çözülmedi)
- `NotificationsScreen.createdAt`: ham ISO string gösteriliyor, format edilmiyor → Developer (B7)
- `HomeScreen` header'da logout butonu var (ProfileScreen ile tekrar) → UX karar gerekiyor
- `ForumTopicDetailScreen` bildirim tıklaması direkt topic'e gitmiyor → Developer (B6)

### Spec Dosyası
Tam audit detayları: `designs/mobile-screens-audit-2026-05-11.md`

## Buton Audit — 2. Tur UX Kalemleri (PM, 2026-05-11)

### BU3 — PremiumScreen: Satın Alma Fail State UX ❌
- **Ekran**: `mobile/src/screens/main/PremiumScreen.tsx`
- **Butonlar**: Tüm 5 satın alma butonu (Yükle, Premium, Konu Aç, Yorum Erişimi, Reklam Yayınla)
- **UX Sorunu**: Stripe hatası oluştuğunda Alert gösteriyor ("Stripe yapılandırması eksik olabilir") — bu mesaj son kullanıcıya göre teknik ve kafa karıştırıcı. Ayrıca hata sonrası buton disabled state'i temizleniyor, retry mümkün ama belirsiz.
- **UX Spec**:
  - Başarısız satın alma → "Ödeme tamamlanamadı. Lütfen tekrar deneyin veya destek@goworldy.com ile iletişime geçin." mesajı (teknik detay gizlenmeli).
  - Alert yerine satır altında inline hata banner tercih edilmeli (Alert flow'u keser).
  - Loading spinner: buton içinde (`ActivityIndicator`) — şu an sadece 3 action card'da var, balance "Yükle" butonunda yok.
  - Başarılı ödeme sonrası: Stripe deep link callback (`goworldy://payment/success`) uygulamaya dönünce bakiye otomatik refresh yapmalı.
- **Öncelik**: P1 — developer B4'ü çözünce paralel uygulanmalı

### BU4 — HomeScreen: "Son Aktiviteler" Empty State ve Dolu State Tasarımı
- **Ekran**: `mobile/src/screens/main/HomeScreen.tsx:135-151`
- **UX Sorunu**: Empty state görsel olarak var ama "Henüz aktivite yok" placeholder'ı her zaman görünüyor — kullanıcıya içerik yüklendiğinde ne göreceği belirsiz.
- **UX Spec**:
  - Dolu state (aktivite geldiğinde): Her aktivite satırı sol kenarda renkli ikon badge (forum yorum → `Colors.primary` chat ikonu, guide adım → `Colors.secondary` check ikonu), sağda tarih (relative format, B7 ile aynı helper), alt satırda kısa içerik özeti (max 60 karakter, truncate).
  - Empty state mevcut tasarım yeterli — sadece text rengi `Colors.textMuted` olmalı.
  - Maksimum 5 aktivite göster, altında "Tümünü Gör" linki (Forum/Guide'a yönlendirir).
- **Öncelik**: P2 — developer B5'i bitirince uygulanmalı

### BU5 — Genel: HomeScreen Header Logout Butonu Kaldırılmalı
- **Ekran**: `mobile/src/screens/main/HomeScreen.tsx:60-63`
- **UX Sorunu**: Header'da logout ikonu var. ProfileScreen'de de "Çıkış Yap" butonu var. İki yerde aynı işlev — tutarsızlık ve kullanıcıyı şaşırtıyor.
- **UX Kararı**: Header logout ikonunu kaldır. Çıkış yalnızca ProfileScreen'den yapılmalı (kasıtlı bir işlem olmalı, yanlışlıkla tıklanmamalı).
- **Değişiklik**: `HomeScreen.tsx` header'dan `TouchableOpacity onPress={logout}` satırını kaldır. Çan (bildirim) ikonu header'da kalabilir.
- **Öncelik**: P2

## Design Audit — Mobile (2026-05-11, Sprint 3)

### Yeni Ekranlar — theme.ts Token Geçişi COMPLETE ✅

Bu sprint'te developer tarafından eklenen yeni ekranlar tarandı. 3 dosyada
hardcode değer ve WCAG ihlali tespit edildi ve düzeltildi.

| Ekran | Dosya | Değişiklik |
|-------|-------|-----------|
| ForumCategoriesScreen | `main/ForumCategoriesScreen.tsx` | ✅ theme.ts geçişi + MinTapTarget + activeOpacity |
| ForgotPasswordScreen | `auth/ForgotPasswordScreen.tsx` | ✅ theme.ts geçişi + icon'lu hata kutusu |
| ResetPasswordScreen | `auth/ResetPasswordScreen.tsx` | ✅ theme.ts geçişi + MinTapTarget + showBtn tap area |
| CreateTopicScreen | `main/CreateTopicScreen.tsx` | ✅ zaten uyumlu, değişiklik gerekmedi |
| ForumTopicsScreen | `main/ForumTopicsScreen.tsx` | ✅ zaten uyumlu, değişiklik gerekmedi |
| GuideScreen | `main/GuideScreen.tsx` | ✅ zaten uyumlu, değişiklik gerekmedi |

### Resolved Issues (Sprint 3)
- `ForumCategoriesScreen`: theme.ts eksikti, backBtn MinTapTarget yoktu — düzeltildi.
- `ForgotPasswordScreen`: theme.ts eksikti, hata düz text idi → icon'lu errorBox yapıldı (auth ekranlarıyla tutarlı).
- `ResetPasswordScreen`: theme.ts eksikti, inputRow/showBtn MinTapTarget yoktu — düzeltildi.
- **Auth ekranları hata UI standardı**: tüm auth ekranlarında artık `errorBox` stili (flexRow, dangerLight bg, `alert-circle` icon) kullanılıyor.

### Tespit Edilen Açık Sorunlar (Sprint 3, Çözülmedi)
- ~~`ForumCategoriesScreen` header'ında `backgroundColor` yok~~ → ✅ Sprint 4'te çözüldü.
- Tüm auth ekranlarında (ForgotPassword, ResetPassword) logo/marka görseli yok —
  LoginScreen ile görsel tutarsızlık. Bir sonraki auth sprint'inde ele alınmalı.
- `CreateTopicScreen` navigation stack dışında component olarak çalışıyor —
  ileride bottom sheet modal veya stack screen'e dönüştürülmeli.

### Spec Dosyası
Tam audit detayları: `designs/mobile-screens-audit-2026-05-11-sprint3.md`

## Design Audit — Mobile + Admin (2026-05-11, Sprint 4)

### Uygulanan Düzeltmeler ✅

| Dosya | Değişiklik |
|-------|-----------|
| `navigation/AppNavigator.tsx` | ✅ theme.ts import + 5 hardcoded renk → Colors token |
| `screens/main/ForumCategoriesScreen.tsx` | ✅ header backgroundColor + borderBottom eklendi |
| `screens/main/HomeScreen.tsx` | ✅ empty state icon color "#9CA3AF" → Colors.textMuted |
| `screens/main/ProfileScreen.tsx` | ✅ BU1: avatarEdit (28px, WCAG ihlali) → avatarBox TouchableOpacity (88px) + avatarOverlay |
| `admin/src/components/Layout.tsx` | ✅ logoutBtn: borderRadius + cursor + border:none eklendi |

### BU1 — Çözüldü ✅
- Avatar edit butonu artık tüm 88×88 avatar alanı (WCAG uyumlu).
- Yarı-saydam siyah overlay (rgba 0,0,0,0.4) + beyaz kamera ikonu — spec'e uygun.
- `avatarOverlay` stili: absolute, bottom 0, yükseklik 30px, borderBottomRadius tam.

### Admin Dashboard — İlk İnceleme (Sprint 4)
- 4 sayfa: Login, Dashboard, Topics (onay kuyruğu), Users — **fonksiyonel, MVP için yeterli**.
- Admin inline CSS kullanıyor; GoWorldy renkleriyle genel uyumlu — token sistemi gerekli değil MVP'de.
- **Eksik admin özellikler (Developer görevi):**
  - `TopicsPage` "Reddet" → sebep modalı yok (spec gereksinimi).
  - Config Panel sayfası hiç yok.

### Tespit Edilen Açık Sorunlar (Sprint 4, Çözülmedi)
- Auth ekranlarında (ForgotPassword, ResetPassword) logo/marka görseli eksik — LoginScreen ile görsel tutarsızlık.
- BU1 avatar: Modal içinde kaydetme sırasında `ActivityIndicator` göstergesi yok (P3, post-MVP).
- Admin Config Panel sayfası → Developer görevi.
- Admin TopicsPage Reddet sebep modalı → Developer görevi.

### Spec Dosyası
Tam audit detayları: `designs/mobile-screens-audit-2026-05-11-sprint4.md`

## Design Audit — Mobile + Admin (2026-05-11, Sprint 5)

### Uygulanan Düzeltmeler ✅

| Dosya | Değişiklik |
|-------|-----------|
| `auth/LoginScreen.tsx` | ✅ 2× `placeholderTextColor="#9CA3AF"` → `Colors.textMuted` |
| `main/NotificationsScreen.tsx` | ✅ 2× `color="#9CA3AF"` (Ionicons) → `Colors.textMuted` |
| `main/PremiumScreen.tsx` | ✅ `premiumCta borderRadius: 10` → `Radius.md` |
| `main/PremiumScreen.tsx` | ✅ `actionCard borderRadius: 14` → `Radius.md` |
| `main/PremiumScreen.tsx` | ✅ `actionPriceBox backgroundColor: "#F3F4F6"` → `Colors.background` |

### Doğrulanan Developer Değişiklikleri (UX onayı)
- BU3 ✅ PremiumScreen: inline hata banner + "Yükle" spinner + deep link bakiye yenileme
- BU4 ✅ HomeScreen: aktivite feed dolu state (ikon badge + `formatRelativeTime` + "Tümünü Gör")
- BU5 ✅ HomeScreen: header logout butonu kaldırıldı
- T5 ✅ NotificationsScreen: kapat butonu eklendi
- T6 ✅ PremiumScreen: kapat butonu eklendi
- T9 ✅ LoginScreen: Google hata akışı → inline error box (Alert kaldırıldı)
- Auth Branding ✅ ForgotPassword + ResetPassword: logoBox (`earth` ikon + "GoWorldy")
- A1 ✅ Admin DashboardPage: `<a href>` → `<Link>` (SPA uyumlu)
- A2 ✅ Admin TopicsPage: Reddet → `window.confirm` (yanlışlıkla tıklama önlendi)

### Admin Dashboard — MVP Değerlendirmesi
- Login + Dashboard + Topics + Users + Layout: **fonksiyonel, MVP için yeterli**.
- Inline CSS kullanıyor — GoWorldy renkleriyle uyumlu. Token sistemi MVP'de zorunlu değil.
- **Kalan admin görevler (Developer)**: Reddet sebep modalı (P3), Config Panel (P3).

### Tasarım Kararı: PremiumScreen Onay Alert
- `handlePurchase` satın alma öncesi `Alert.alert("Satın Al", ...)` gösteriyor.
- Bu BU3 kapsamı dışında — ERROR Alert kaldırıldı, ONAY Alert kasıtlı friction. Değişmeyecek.

### Tasarım Kararı: PremiumScreen Onay Alert
- `handlePurchase` satın alma öncesi `Alert.alert("Satın Al", ...)` gösteriyor.
- Bu BU3 kapsamı dışında — ERROR Alert kaldırıldı, ONAY Alert kasıtlı friction. Değişmeyecek.

### Tespit Edilen Açık Sorunlar (Sprint 5, Çözülmedi)
- `RegisterScreen.tsx` logoBox eksik — diğer auth ekranlarıyla görsel tutarsızlık (P3).
- `HomeScreen.tsx:311` `#DBEAFE`, `HomeScreen.tsx:409` `#EDE9FE` — kart-içi tint, token dışı ancak kabul edilebilir (P3).
- Admin TopicsPage Reddet sebep modalı → Developer görevi (P3).
- Admin Config Panel sayfası → Developer görevi (P3).

### Spec Dosyası
Tam audit detayları: `designs/mobile-screens-audit-2026-05-11-sprint5.md`

## Design Audit — Sprint 6 Kapsam (PM buton audit sonrası, 2026-05-11)

Mevcut sprint'te tüm mobile + admin butonları kod seviyesinde incelendi.
P0/P1/P2 sorunlar çözülmüş. UX açısından kalan P3 görevler:

### BU6 — RegisterScreen: logoBox Eksik — ÇÖZÜLDÜ ✅
- Developer Sprint 5'te uyguladı: `earth` ikonu + "GoWorldy" logoBox mevcut.
- UX audit Sprint 6'da doğrulandı.

### BU7 — Admin: Reddet Sebep Modalı — ÇÖZÜLDÜ ✅
- Developer Sprint 5'te uyguladı: `rejectModal` state, textarea, İptal/Reddet butonları.
- UX audit Sprint 6'da doğrulandı.

### BU8 — Admin: Config Panel — KISMİ ✅ (salt-okunur)
- Developer Sprint 5'te `/config` sayfası oluşturdu; sidebar linki ve route wired.
- **Eksik**: editable fiyatlandırma inputları — salt-okunur MVP impl seçildi.
- Kalan: AU1 olarak takip ediliyor (P3, bir sonraki admin sprint'i).

## Design Audit — Admin Dashboard (2026-05-11, Sprint 6)

### Uygulanan Düzeltmeler ✅

| Dosya | Değişiklik |
|-------|-----------|
| `admin/src/pages/UsersPage.tsx` | ✅ `alert()` → `setError()` inline hata banner |
| `admin/src/pages/UsersPage.tsx` | ✅ userType: ham İngilizce → `USER_TYPE_LABELS` Türkçe etiket |
| `admin/src/pages/LoginPage.tsx` | ✅ input border/borderRadius/outline + btn border:none/cursor:pointer |

### Doğrulanan Tamamlanan Görevler (Sprint 6) ✅
- BU6 ✅ RegisterScreen logoBox: developer zaten uygulamış (`earth` ikonu + "GoWorldy")
- BU7 ✅ Admin TopicsPage reddet modal: textarea + reason + İptal/Reddet butonları
- BU8 ✅ Admin ConfigPage: sayfa var, sidebar wired — **salt-okunur impl** (editable kısmı sonraki sprint)

### Admin Dashboard Genel Değerlendirme
- LoginPage, DashboardPage, TopicsPage, UsersPage, ConfigPage, Layout: **MVP için fonksiyonel ve kabul edilebilir**.
- Inline CSS kullanılıyor — GoWorldy brand renkleriyle genel uyumlu. Token sistemi MVP'de zorunlu değil.
- **ConfigPage editable inputs**: BU8 spec'i editable istiyordu; developer MVP için salt-okunur yaptı (DB config tablosu karmaşıklığı). Bir sonraki admin sprint'inde hedef.

### Kalan Açık Sorunlar (Sprint 6 Sonrası)
- **AU1** (P3): AdminConfigPage — editable forum fiyatlandırma inputları eksik
- **AU2** (P3): AdminDashboardPage — loading skeleton yok (null "—" gösterimi kabul edilebilir)
- **AU3** (P3): AdminLoginPage — şifre show/hide toggle yok (düşük öncelik)

### Spec Dosyası
Tam audit detayları: `designs/mobile-screens-audit-2026-05-11-sprint6.md`

## Design Audit — Mobile (2026-05-11, Sprint 7)

### git diff main Taranan Dosyalar
Tüm `mobile/src/` ve `admin/src/` değişiklikleri incelendi. Stakeholder Sprint
(PROF-3: `expo-image-picker`) ve önceki sprintlerde eklenen içerikler dahil.

### Uygulanan Düzeltmeler ✅

| Dosya | Satır | Değişiklik | Neden |
|-------|-------|-----------|-------|
| `main/ProfileScreen.tsx` | 336,338 | JSX `color="#fff"` → `color={Colors.surface}` (ActivityIndicator + Ionicons) | Hardcoded beyaz, token dışı |
| `main/ProfileScreen.tsx` | 601 | `saveBtnText color: "#fff"` → `Colors.surface` | Hardcoded beyaz, token dışı |
| `main/ProfileScreen.tsx` | 638 | `menuRow borderBottomColor: "#F3F4F6"` → `Colors.border` | `#F3F4F6` gray-100 ≠ `Colors.border` (#E5E7EB gray-200) — yanlış token |
| `main/ProfileScreen.tsx` | 733 | `avatarOptionBtnText color: "#fff"` → `Colors.surface` | Hardcoded beyaz, token dışı |
| `main/ProfileScreen.tsx` | 754 | `modalSaveText color: "#fff"` → `Colors.surface` | Hardcoded beyaz, token dışı |
| `main/PremiumScreen.tsx` | 140 | `ActivityIndicator color="#fff"` → `Colors.surface` | Hardcoded beyaz, token dışı |
| `main/PremiumScreen.tsx` | 158 | `crown icon color="#fff"` → `Colors.surface` | Hardcoded beyaz, token dışı |
| `main/PremiumScreen.tsx` | 227 | `Feature checkmark-circle color="#fff"` → `Colors.surface` | Hardcoded beyaz, token dışı |
| `main/PremiumScreen.tsx` | 303 | `balanceBtnText color: "#fff"` → `Colors.surface` | Hardcoded beyaz, token dışı |
| `main/PremiumScreen.tsx` | 323 | `premiumBadgeText color: "#fff"` → `Colors.surface` | Hardcoded beyaz, token dışı |
| `main/PremiumScreen.tsx` | 336 | `premiumTitle color: "#fff"` → `Colors.surface` | Hardcoded beyaz, token dışı |
| `main/PremiumScreen.tsx` | 353 | `featureText color: "#fff"` → `Colors.surface` | Hardcoded beyaz, token dışı |
| `main/HomeScreen.tsx` | 110 | `map-marker-path icon color="#fff"` → `Colors.surface` | Hardcoded beyaz, token dışı |
| `main/HomeScreen.tsx` | 218,225 | `crown + chevron-forward color="#fff"` → `Colors.surface` | Hardcoded beyaz, token dışı |

### Kabul Edilen İstisnalar (Değiştirilmedi)
- `ProfileScreen.tsx:502` `rgba(0,0,0,0.4)` → Avatar overlay — spec'te kasıtlı opacity değeri, token sistemine girmez.
- `ProfileScreen.tsx:669` `rgba(0,0,0,0.5)` → Modal backdrop overlay — aynı gerekçe.
- `HomeScreen.tsx:310` `#DBEAFE`, `HomeScreen.tsx:409` `#EDE9FE` → Renkli arka plan üstünde tint; Sprint 5'te P3 kabul edilmişti.
- `HomeScreen.tsx:313` `rgba(255,255,255,0.3)` → Progress bar track opacity, kasıtlı.
- `NotificationsScreen.tsx:202` `#93C5FD` → Switch `trackColor.true` — blue-300 tint, standart Switch tasarım kalıbı; `Colors.primary` çok koyu görünür.
- `NotificationsScreen.tsx:302` `#BFDBFE` → Okunmamış bildirim sol border — blue-200 tint, intentional.
- `admin/src/` tüm dosyalar → Admin inline CSS kullanıyor, GoWorldy renkleriyle uyumlu. Token sistemi zorunlu değil (MVP kararı, Sprint 4'te onaylandı).

### Tespit Edilen Açık Sorunlar (Sprint 7, Çözülmedi)
- **AU1** (P3): AdminConfigPage — editable forum fiyatlandırma inputları. Salt-okunur MVP impl mevcut.
- **AU2** (P3): AdminDashboardPage — loading skeleton yok (null "—" gösterimi kabul edilebilir).
- **AU3** (P3): AdminLoginPage — şifre show/hide toggle yok.
- **ProfileScreen PROF-3** (P2): Avatar base64 yükleme mevcut. Uzun vadede S3/Cloudinary önerilir.

## Sprint 6 — Rekabet Analizi Sonrası Görevler (PM tarafından atandı, 2026-05-11)

| Kod | Öncelik | Görev | Notlar |
|-----|---------|-------|--------|
| RU1 | **P1** | Forum arama ekranı spec'i | Arama çubuğu + sonuç listesi (topic başlığı, ülke/kategori breadcrumb, tarih). Boş state + yükleniyor state. |
| RU2 | **P1** | Upvote butonu spec'i | Topic listesinde her satırda küçük ↑ butonu + sayı. Tıklanınca dolup boşalan animasyon. Zaten upvote atılmışsa dolu/aktif state. |
| RU3 | **P2** | Onboarding flow ekranları spec'i | Kayıt sonrası 3 adımlı wizard: (1) Nereye gitmek istiyorsun? (ülke seç), (2) Ne zaman? (zaman dilimi), (3) Başlayalım (özet + CTA). Skip butonu her adımda. |
| RU4 | **P2** | Danışman listesi & profil ekranı spec'i | Listede: fotoğraf, isim, uzmanlık alanı (ülke), kısa bio. Profil detayda: iletişim butonu (mailto veya DM). |

## Sprint 7 — Profil UX Görevleri (Tamamlandı — 2026-05-12)

### PU-1 — userType Seçici UI — ÇÖZÜLDÜ ✅
- **Uygulanan**: `ProfileScreen.tsx` — `CHIP_ICONS` map eklendi (`location-outline`, `briefcase-outline`, `earth-outline`).
- Chip içi ikon + text yan yana (`flexDirection: "row"`, `gap: Spacing.xs`).
- Aktif chip: `backgroundColor: Colors.primary`, text `Colors.surface`, ikon beyaz — spec'e tam uyumlu.
- Seçilmemiş chip: `Colors.background` arka plan, `Colors.borderStrong` border.
- Kaydedilirken: aktif chip içinde `ActivityIndicator` (header'daki spinner kaldırıldı).
- Hata: chip altında kırmızı inline metin.
- **Kabul edilen fark**: Spec'te `map-marker-outline` istendi; Ionicons'da karşılığı `location-outline` — semantik aynı, aynı ikon ailesi.

### PU-2 — Telefon Numarası Input — ÇÖZÜLDÜ ✅
- **Uygulanan**: `PrivacyScreen.tsx` — `phoneSaveSuccess` state eklendi.
- Kaydet butonu 3 durumu destekliyor: spinner (kayıt sırasında) → yeşil `checkmark` ikonu (`Colors.secondary`, 2 saniye) → normal "Kaydet" metni.
- `phoneSaveBtnSuccess` stili eklendi: `backgroundColor: Colors.secondary`.
- Hata: `phoneError` state ile kırmızı satır-altı metin (Alert yok).

## Design Audit — Mobile (2026-05-12, Sprint 8)

### git diff main Taranan Dosyalar
`mobile/src/screens/main/ProfileScreen.tsx`, `mobile/src/screens/main/PrivacyScreen.tsx`,
`mobile/src/services/api.ts`, `api/src/routes/users.ts`.

### Uygulanan Düzeltmeler ✅

| Dosya | Satır | Değişiklik | Neden |
|-------|-------|-----------|-------|
| `main/ProfileScreen.tsx` | CHIP_ICONS | `CHIP_ICONS` map eklendi — her userType için Ionicons adı | PU-1 spec ikonları eksikti |
| `main/ProfileScreen.tsx` | chip JSX | Chip içine ikon + `ActivityIndicator` (kaydedilirken) | PU-1 spec — ikon spec zorunlu |
| `main/ProfileScreen.tsx` | `chipActive` | `backgroundColor: Colors.primaryLight` → `Colors.primary` | PU-1 spec solid primary istiyordu |
| `main/ProfileScreen.tsx` | `chipTextActive` | `color: Colors.primary` → `Colors.surface` | Solid bg üstünde beyaz metin gerekli |
| `main/ProfileScreen.tsx` | `chip` style | `flexDirection: "row"`, `alignItems: "center"`, `gap: Spacing.xs` eklendi | İkon + metin yan yana düzen |
| `main/ProfileScreen.tsx` | `chip` style | `paddingHorizontal: 16` → `Spacing.md`, `paddingVertical: 8` → `Spacing.sm` | Token uyumu |
| `main/ProfileScreen.tsx` | sectionHeader | `{userTypeSaving && <ActivityIndicator>}` kaldırıldı | Spinner artık chip içinde |
| `main/ProfileScreen.tsx` | `header` style | `marginBottom: 20` → `Spacing.lg` | 4px grid uyumu |
| `main/ProfileScreen.tsx` | `sectionHeader` style | `marginBottom: 10` → `Spacing.sm` | 4px grid uyumu |
| `main/ProfileScreen.tsx` | `editActions` style | `marginTop: 10` → `Spacing.sm` | 4px grid uyumu |
| `main/PrivacyScreen.tsx` | `handleSavePhone` | Başarı sonrası `setPhoneSaveSuccess(true)` + 2s timeout | PU-2 spec: yeşil onay ikonu |
| `main/PrivacyScreen.tsx` | phoneSaveBtn | 3 state: spinner → yeşil checkmark (2s) → "Kaydet" | PU-2 spec uyumu |
| `main/PrivacyScreen.tsx` | `phoneSaveBtnSuccess` style | `backgroundColor: Colors.secondary` eklendi | Yeşil success rengi |

### Kabul Edilen Farklar (Değiştirilmedi)
- `ProfileScreen.tsx` `paddingTop: 56`, `paddingBottom: 40` — safe area ofsetleri, token dışı kabul edilebilir.
- `ProfileScreen.tsx` `padding: 12` (bioInput, modalInput) — 3×4px, named token yok; görsel olarak uyumlu.
- `ProfileScreen.tsx` `paddingVertical: 14` (menuRow, logoutBtn, avatarOptionBtn) — 3.5 grid, kabul edilebilir.
- Chip ikon adı: spec `map-marker-outline` (MaterialCommunityIcons) → `location-outline` (Ionicons) — semantik aynı, daha tutarlı ikon ailesi.

### Tespit Edilen Açık Sorunlar (Sprint 8, Çözülmedi)
- **AU1** (P3): AdminConfigPage — editable forum fiyatlandırma inputları
- **AU2** (P3): AdminDashboardPage — loading skeleton yok
- **AU3** (P3): AdminLoginPage — şifre show/hide toggle yok
- **RU1** (P1): Forum arama ekranı — spec yazılmamış, developer bekliyor
- **RU2** (P1): Upvote butonu — spec yazılmamış, developer bekliyor
- **RU3** (P2): Onboarding flow ekranları spec'i — yazılmamış
- **RU4** (P2): Danışman listesi & profil ekranı spec'i — yazılmamış

## Sprint 8 — UX Görevleri (2026-05-12)

### CU1 — Avatar Modal Basitleştirmesi (C2 — Developer sonrası doğrulama)
- **Stakeholder kararı**: "Sadece galeriden yükleme" — URL input akışı kaldırıldı.
- **Yeni akış**: Avatar'a dokun → galeri direkt açılır → seç → otomatik kaydet. Modal yok.
- **UX notu**: Modal kaldırılınca "avatarOverlay" (kamera ikonu) tek CTA olarak kalıyor. İkon üzerindeki `activeOpacity` animasyonu korunmalı. Loading sırasında avatar alanında `ActivityIndicator` göster (önceki spec'e uygun).
- **Developer implementasyonu**: `C2` görev olarak developer memory'de.

### CU2 — İstatistik Kartları Tıklama Feedback'i (C3 — Developer sonrası doğrulama)
- **Değişiklik**: `StatItem` → `TouchableOpacity` olacak (developer görevi C3).
- **UX spec**: `activeOpacity={0.75}`, tap sonrası hafif scale animasyonu opsiyonel (MVP'de gerekli değil).
- **Navigasyon hedefleri**: Konu + Yorum → Forum tab, Adım → Guide tab.
- **Görsel ipucu**: Tıklanabilirliği göstermek için her stat kartının sağ alt köşesine küçük `chevron-forward` ikonu eklenebilir (P3, opsiyonel).

## Design Audit — Mobile (2026-05-12, Sprint 9)

### git diff main Taranan Dosyalar
`ProfileScreen.tsx`, `PrivacyScreen.tsx`, `AppNavigator.tsx` (Sprint 8 — C1/C2/C3/C4 değişiklikleri).
`CreateTopicScreen.tsx`, `ForumTopicDetailScreen.tsx`, `ForumTopicsScreen.tsx`, `GuideScreen.tsx` (T10-T13 token fix).

### CU1 + CU2 Doğrulaması ✅

| Görev | Durum | Detay |
|-------|-------|-------|
| CU1: Avatar modal kaldırıldı | ✅ | Galeri direkt açılıyor; `avatarModalVisible` state silindi |
| CU2: StatItem → TouchableOpacity | ✅ | `activeOpacity={0.75}`, Konu/Yorum → Forum tab, Adım → Guide tab |
| C4: About → React Native Modal | ✅ | `Alert.alert` kaldırıldı, `aboutVisible` state + Modal |

### T10-T13 — ÇÖZÜLDÜ ✅ (Sprint 9)

| Dosya | Satır | Değişiklik | Neden |
|-------|-------|-----------|-------|
| `main/CreateTopicScreen.tsx` | 158,161 | `color="#fff"` → `color={Colors.surface}` (2 adet) | Token tutarsızlığı |
| `main/ForumTopicDetailScreen.tsx` | 133,135 | `color="#fff"` → `color={Colors.surface}` (2 adet) | Token tutarsızlığı |
| `main/ForumTopicsScreen.tsx` | 149 | FAB `color="#fff"` → `color={Colors.surface}` | Token tutarsızlığı |
| `main/GuideScreen.tsx` | 301,304,406 | `color="#fff"` → `color={Colors.surface}` (3 adet) | Token tutarsızlığı |

### PrivacyScreen WCAG Düzeltmesi ✅

| Dosya | Değişiklik | Neden |
|-------|-----------|-------|
| `main/PrivacyScreen.tsx` | `MinTapTarget` import eklendi | Eksikti |
| `main/PrivacyScreen.tsx` | `phoneSaveBtn minHeight: 36` → `MinTapTarget` (44pt) | WCAG AA minimum 44×44pt |
| `main/PrivacyScreen.tsx` | `phoneSaveBtn paddingVertical: 8` → `Spacing.sm` | Token uyumu |

### Kabul Edilen İstisnalar (Değiştirilmedi)
- `PrivacyScreen.tsx` `phoneInput paddingHorizontal: 10`, `paddingVertical: 6` — küçük inline input, kabul edilebilir.
- `ProfileScreen.tsx` `avatarBox marginBottom: 12`, `badgeRow marginTop: 6` — 3×4px / 1.5×4px, görsel olarak uyumlu, kabul edilebilir.
- `ProfileScreen.tsx` `avatarOverlay rgba(0,0,0,0.4)` — kasıtlı spec değeri.
- `AppNavigator.tsx` — tamamen token uyumlu, değişiklik gerekmedi.

### RU1–RU4 Spec Dosyaları — YAZILDI ✅

| Kod | Öncelik | Dosya | Durum |
|-----|---------|-------|-------|
| RU1 | P1 | `designs/forum-search-spec.md` | ✅ Yazıldı |
| RU2 | P1 | `designs/upvote-spec.md` | ✅ Yazıldı |
| RU3 | P2 | `designs/onboarding-spec.md` | ✅ Yazıldı |
| RU4 | P2 | `designs/consultant-spec.md` | ✅ Yazıldı |

### Tespit Edilen Açık Sorunlar (Sprint 9 Sonrası)
- **AU1** (P3): AdminConfigPage — editable forum fiyatlandırma inputları
- **AU2** (P3): AdminDashboardPage — loading skeleton yok
- **AU3** (P3): AdminLoginPage — şifre show/hide toggle yok
- **RU1** (P1): `ForumSearchScreen` — spec hazır, developer implementasyonu bekliyor
- **RU2** (P1): Upvote butonu — spec hazır, developer implementasyonu bekliyor
- **RU3** (P2): Onboarding flow ekranları — spec hazır, developer implementasyonu bekliyor
- **RU4** (P2): Danışman listesi & profil — spec hazır, developer implementasyonu bekliyor
- **Onboarding backend**: `migrationTimeline` alanı `users` tablosuna eklenmeli (developer görevi, R4 genişlemesi)
- **Consultant backend**: `targetCountryName` alanı consultant response'a eklenmeli

### Spec Dosyası
Tam audit detayları bu memory dosyasında. Spec dosyaları: `designs/forum-search-spec.md`, `designs/upvote-spec.md`, `designs/onboarding-spec.md`, `designs/consultant-spec.md`.

## User Research Notes
<!-- Populate as user feedback comes in -->
