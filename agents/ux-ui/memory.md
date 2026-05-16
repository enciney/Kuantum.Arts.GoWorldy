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

## Sprint 9 — Bildirim Sistemi UX (2026-05-14)

### Bildirim Badge — Tasarım Kararları ✅

**Badge kuralları (stakeholder onaylı):**
- `count <= 9` → sayı göster (1, 2, ... 9)
- `count > 9` → "9+" yaz (max genişlik korunur, taşma olmaz)
- `count <= 0` → badge hiç görünmez

**Badge token'ları:**
- Arka plan: `Colors.danger` (#EF4444)
- Metin: beyaz (#fff), `fontSize: 10`, `fontWeight: "700"`
- Boyut: `minWidth: 18`, `height: 18`, `borderRadius: 9`
- Pozisyon: tab ikonunun `top: -4`, `right: -8` köşesi
- Padding: `paddingHorizontal: 4` (9+ için genişler)

**Uygulama yeri:** Home tab ikonunun üst sağ köşesi (`AppNavigator.tsx` `BadgeDot` bileşeni)

**Güncelleme zamanı:** `AppState` `active` event'inde (uygulama öne gelince) otomatik yenileme.

### Konu Takip Butonu — Tasarım Kararları ✅

**Yer:** `ForumTopicDetailScreen` header'ının sağ ucu — geri buton ve başlığın yanında.

**Durumlar:**
- Takip edilmiyor: çerçeveli daire, `notifications-outline` ikon, `Colors.primary` renk
- Takip ediliyor: dolu daire, `notifications` ikon, `Colors.surface` ikon, `Colors.primary` arka plan
- Yüklenirken: `ActivityIndicator` ikon yerine, `subscribing` flag'i

**Etkileşim:** Optimistic update — hemen state değişir, API başarısız olursa geri döner (Alert yok, sessiz rollback).

**Boyut:** `MinTapTarget` (44×44pt, WCAG uyumlu), `borderRadius: Radius.full`

### Admin Canlı Panel — Tasarım Kararları ✅

**Live status chip:**
- Canlı: yeşil arka plan `#D1FAE5`, `#065F46` metin, "● Canlı"
- Bağlanıyor: sarı `#FEF9C3`, `#92400E` metin, "○ Bağlanıyor"
- Çevrimdışı: kırmızı `#FEE2E2`, `#991B1B` metin, "✕ Çevrimdışı"

**Davranış:** Yeni konu gelince liste başına eklenir, sayaç güncellenir. Kullanıcı refresh yapmak zorunda değil.

## Design Audit — Sprint 1 (Test Bulguları, 2026-05-16)

Tester agent'ın P0 akış bulgularına dayanarak 5 ekran UX açısından incelendi.

---

### 1. CreditGateModal — CR Senaryo Grubu

| Test | Durum | Detay |
|------|-------|-------|
| CG-01: Maliyet + bakiye gösterimi | ✅ Uyumlu | `cost` prop + `userCredits` prop balanceRow'da gösteriliyor. Miktar bold, maliyet amber (`Colors.warning`). |
| CG-04: Yetersiz kredi mesajı | ✅ Uyumlu | `!canAfford` → `insufficientNote` view: "Bu işlem için yeterli kredin yok." + amber ikon. `balanceAmount` rengi `Colors.danger`'a geçiyor. |
| CG-05: isPremium=true kontrolü | ⚠️ İyileştirme gerekli | Modal bileşeni kendisi `isPremium` prop almıyor. Kontrol çağıran ekranlara bırakılmış: `ForumTopicsScreen` `handleFabPress()` → staff kontrolü var ama premium kontrolü yok. `CreateTopicScreen` → aynı durum. Premium kullanıcı için modal açılmamalı — bu kontrolü bileşen seviyesine taşımak ya da çağıran ekranlarda `user.isPremium` koşuluna göre gate'i skip etmek gerekiyor. |
| CG-06: Farklı işlem maliyetleri | ✅ Uyumlu | `cost` prop olarak geliyor, statik değil. `TOPIC_COST = 50` sabit `CreateTopicScreen`'de, `ForumTopicsScreen`'de. `PremiumScreen`'de `CREDIT_COST = 50` ile tek kullanımlık kreditler için ayrı sabit. |

**Açık sorun (CG-05):** `ForumTopicsScreen.handleFabPress()` yalnızca `isStaff || userCredits >= TOPIC_COST` kontrolü yapıyor. `user.isPremium === true` iken bile gate açılabilir (kredi yoksa). Premium kullanıcı için FAB direkt `onCreateTopic()` çağırmalı, modal açılmamalı.

**Spec (CG-05 fix):**
```
handleFabPress:
  if (isStaff || isPremium || userCredits >= TOPIC_COST) → onCreateTopic()
  else → setGateVisible(true)
```
`user` nesnesine `isPremium` alanı eklenmesi gerekiyor (Developer görevi).

---

### 2. CreateTopicScreen — CT Senaryo Grubu

| Test | Durum | Detay |
|------|-------|-------|
| CT-05: Boş başlık hatası | ⚠️ İyileştirme gerekli | `validateTitle()` çalışıyor ama `Alert.alert("Eksik", ...)` kullanıyor. Input alanı kırmızı border / inline hata mesajı yok — auth ekranlarındaki `errorBox` standartına uymuyor. Alert flow'u keser. |
| CT-06: Boş içerik hatası | ❌ Kritik sorun | `CreateTopicScreen` yalnızca `title` alanına sahip — `body/content` alanı hiç yok. Konu içeriği (açıklama metni) form'da eksik. |
| CT-07: Kategori seçilmeden gönder | ✅ Uyumlu | `categoryId` prop ile dışarıdan geliyor — ekran zaten seçili kategoriyle açılıyor. Boş kategori durumu bileşen seviyesinde oluşamaz. |
| CT-08: "Onay bekliyor" feedback'i | ✅ Uyumlu | Başarılı oluşturma → `Alert.alert("Konunuz alındı", "Konunuz onay sürecine alınmıştır...")`. Mesaj açık, bilgilendirici. |

**Açık sorunlar:**
- **CT-05 (P1):** `validateTitle()` → `Alert` yerine inline `titleError` state + input'un altında kırmızı metin + input `borderColor: Colors.danger` olmalı. Diğer form ekranlarıyla tutarlılık.
- **CT-06 (P0):** Konu içeriği (body) input alanı mevcut değil. Kullanıcı yalnızca başlık girebiliyor. Forum konularının bir gövde/içerik alanına ihtiyacı var. Bu hem UX hem backend kapsam sorunudur — developer ile koordine edilmeli.

**Hardcoded değerler:**
- `infoBoxStaff`: `backgroundColor: "#ECFDF5"`, `borderColor: "#A7F3D0"` → sırasıyla `Colors.secondaryLight` ve `Colors.secondary` (opaklıklı) kullanılabilir.
- `infoTitle`: `color: "#92400E"`, `infoText`: `color: "#78350F"` → `Colors.warning`'ın koyu tonları; token sisteminde karşılığı yok, P3 kabul edilebilir.
- `btnText`: `color: "#fff"` → `Colors.surface` olmalı (Sprint 9'da diğer ekranlarda düzeltilmişti, bu dosyada kaçmış).

---

### 3. PremiumScreen — PR Senaryo Grubu

| Test | Durum | Detay |
|------|-------|-------|
| PR-01: Plan listesi formatı | ✅ Uyumlu | `premiumCard`: başlık ("Aylık Premium"), fiyat ("250 TL / ay"), 4 özellik satırı (`Feature` bileşeni). Görsel hiyerarşi net. |
| PR-05: isPremium=true → "Aktif Premium" gösterimi | ❌ Kritik sorun | `PremiumScreen` `isPremium` state'i almıyor veya göstermiyor. Kullanıcı zaten premium olsa bile aynı satın alma UI'ı gösteriliyor. Bitiş tarihi yok. |
| PR-07: Başarılı Stripe dönüşü sonrası UI güncelleme | ✅ Uyumlu | `Linking.addEventListener("url")` → `goworldy://payment/success` → `refreshCredits()` çağrısı var. Kredi bakiyesi güncelleniyor. Ancak premium durumu güncellemiyor (PR-05 ile bağlantılı). |

**Açık sorunlar:**
- **PR-05 (P0):** Kullanıcı `isPremium === true` iken: Premium kart "EN AVANTAJLI" badge ile alım için gösterilmemeli. Bunun yerine: "Aktif Premium" başlığı, bitiş tarihi, "Premium üyesiniz" mesajı gösterilmeli. Satın alma butonu disable veya gizli olmalı.
- **PR-07 kısmi:** `goworldy://payment/success` dönüşünde `refreshCredits()` çalışıyor ancak premium durumunu (`isPremium`, `premiumExpiresAt`) yenilemiyor. `api.users.me()` yanıtında bu alanlar dönüyor olmalı; UI'da da kullanılmalı.

**Token uyumu:**
- `balanceBtn: minHeight: MinTapTarget - 8` → 36px, WCAG minimum 44pt altında. ⚠️ `MinTapTarget` olmalı.
- `premiumCard: padding: 20` → `Spacing.lg` (24) değil ama 5×4px = kabul edilebilir.
- `sectionTitle: fontSize: 17, marginBottom: 12` → Typography ve Spacing tokenı yok; P3.
- `premiumCta: paddingVertical: 12` → `Spacing.md` (16) değil; P3.

---

### 4. ForumTopicsScreen FAB — FT Senaryo Grubu

| Kontrol | Durum | Detay |
|---------|-------|-------|
| FAB görünürlüğü | ✅ Uyumlu | `position: absolute, bottom: 24, right: 24` — standart FAB konumu. |
| FAB boyutu | ✅ Uyumlu | `width: 56, height: 56, borderRadius: 28` — Material Design FAB standardı, WCAG'ın çok üzerinde (44pt min). |
| activeOpacity | ⚠️ İyileştirme gerekli | FAB `TouchableOpacity` üzerinde `activeOpacity` prop'u belirtilmemiş. Varsayılan `0.2` — çok soluk. `activeOpacity={0.85}` olmalı (büyük renkli FAB için hafif baskı yeterli). |
| Gölge/elevation | ✅ Uyumlu | iOS shadow + Android elevation (6) mevcut. FAB yeterince öne çıkıyor. |
| Premium yönlendirme | ⚠️ İyileştirme gerekli | CG-05 ile aynı sorun: `isStaff` veya yeterli kredi yoksa gate açılıyor ama `isPremium` kontrolü yok. Premium kullanıcılar gereksiz gate görüyor. |

---

### 5. SEC-06 Etkileri — ProfileScreen Kullanıcı Bilgileri

| Alan | Durum | Detay |
|------|-------|-------|
| Avatar gösterimi | ✅ Uyumlu | `avatarUrl` → `<Image source={{ uri: avatarUrl }}>`, yoksa initials fallback. Güvenlik fix'i sonrası base64 validasyonu API'de ise UI'da değişiklik gerekmez. |
| displayName | ✅ Uyumlu | `user?.displayName` direkt gösteriliyor. |
| bio | ✅ Uyumlu | `/users/me` → `u.bio` ile yükleniyor. Düzenleme akışı çalışıyor. |
| SEC-06 UI etkisi | ✅ Uyumlu | Avatar yükleme `api.users.updateMe({ avatarUrl: dataUrl })` → backend validasyonu geçmezse `Alert.alert("Hata", ...)` gösteriliyor. UI tarafında ek değişiklik gerekmez; güvenlik validasyonu API katmanında. |

---

### Özet Tablosu

| Ekran | Senaryo | Durum |
|-------|---------|-------|
| CreditGateModal | CG-01 Maliyet + bakiye | ✅ |
| CreditGateModal | CG-04 Yetersiz kredi mesajı | ✅ |
| CreditGateModal | CG-05 isPremium bypass | ⚠️ |
| CreditGateModal | CG-06 Dinamik maliyet prop | ✅ |
| CreateTopicScreen | CT-05 Boş başlık → inline hata | ⚠️ |
| CreateTopicScreen | CT-06 Body/içerik alanı eksik | ❌ |
| CreateTopicScreen | CT-07 Kategori zorunluluğu | ✅ |
| CreateTopicScreen | CT-08 "Onay bekliyor" feedback | ✅ |
| PremiumScreen | PR-01 Plan formatı | ✅ |
| PremiumScreen | PR-05 isPremium aktif gösterimi | ❌ |
| PremiumScreen | PR-07 Stripe dönüşü UI güncelleme | ✅ (kısmi) |
| ForumTopicsScreen | FAB görünürlük + boyut | ✅ |
| ForumTopicsScreen | FAB activeOpacity | ⚠️ |
| ForumTopicsScreen | FAB premium bypass | ⚠️ |
| ProfileScreen | SEC-06 avatar/displayName/bio | ✅ |

### Öncelikli Düzeltmeler (Developer Görevi)

| Kod | Öncelik | Görev |
|-----|---------|-------|
| DA1 | **P0** | `PremiumScreen`: `isPremium` + `premiumExpiresAt` alanlarını `/users/me`'den al, "Aktif Premium" UI'ı göster |
| DA2 | **P0** | `CreateTopicScreen`: `body` (içerik) TextInput alanı ekle — başlık + içerik zorunlu |
| DA3 | **P1** | `ForumTopicsScreen` + `CreateTopicScreen`: `handleFabPress`/`handleConfirm` içinde `isPremium` kontrolü ekle (gate'i skip et) |
| DA4 | **P1** | `CreateTopicScreen`: `Alert` tabanlı doğrulama → inline `titleError` state + kırmızı border |
| DA5 | **P2** | `ForumTopicsScreen` FAB: `activeOpacity={0.85}` ekle |
| DA6 | **P2** | `PremiumScreen` `balanceBtn`: `minHeight: MinTapTarget - 8` → `MinTapTarget` (WCAG) |
| DA7 | **P3** | `CreateTopicScreen` `btnText`: `color: "#fff"` → `color: Colors.surface` |

## Design Audit — Sprint 2 (Test Bulguları P1, 2026-05-16)

Tester agent'ın Sprint 2 güvenlik + işlevsellik bulgularına dayanarak 6 ekran UX açısından incelendi.

---

### 1. ResetPasswordScreen — Token Hata UX

| Kontrol | Durum | Detay |
|---------|-------|-------|
| Inline errorBox (A-16/A-17) | ✅ Uyumlu | `error` state → `errorBox` stili: `dangerLight` arka plan + `alert-circle` ikon. Alert kullanılmıyor. |
| Süresi dolmuş / geçersiz token | ⚠️ İyileştirme gerekli | Backend 400/401 döndüğünde hata mesajı görünüyor ama mesaj içeriği backend'den ham geliyor (`e.message`). "Token süresi dolmuş" ve "Geçersiz token" (A-16/A-17) için kullanıcı dostu Türkçe mesaj map'i yok. |
| "Yeni sıfırlama maili iste" linki | ❌ Kritik sorun | Token hata durumunda ForgotPasswordScreen'e yönlendiren inline link yok. Ekranda yalnızca "Giriş ekranına dön" linki var — kullanıcı hata aldığında süreci nasıl başlatacağını bilemiyor. |
| MinTapTarget uyumu | ✅ Uyumlu | `inputRow minHeight: MinTapTarget`, `showBtn minWidth/Height: MinTapTarget`, `btn minHeight: MinTapTarget`. |

**Kritik eksiklik (A-16/A-17):** Token hata durumunda kullanıcıya ForgotPasswordScreen'e kısa yol sunulmuyor. Spec gereği:
- Hata mesajının altında: "Kodunuzun süresi mi doldu? Yeni kod iste →" şeklinde tıklanabilir link
- Backend hata mesajlarına Türkçe map: `{ "Token expired": "Kodunuzun süresi dolmuş.", "Invalid token": "Geçersiz sıfırlama kodu." }`

---

### 2. ForumTopicsScreen — Upvote Butonu UX

| Kontrol | Durum | Detay |
|---------|-------|-------|
| Upvote butonu her satırda | ❌ Kritik sorun | `TopicRow` bileşeninde upvote butonu hiç yok. Spec (upvote-spec.md) `[↑ 12]` butonunu `TopicRow` sağına eklemesi gerektiğini söylüyor. Mevcut kod: yalnızca tarih ve yorum sayısı gösteriliyor. |
| Aktif/pasif state | ❌ Kritik sorun | Upvote UI hiç implement edilmemiş. `hasUpvoted` prop veya state yok. |
| Optimistic update / sayaç | ❌ Kritik sorun | `upvotes` alanı `Topic` interface'inde tanımlı değil. Sayaç artıp azalmıyor. |
| Spec uyumu | ❌ Kritik sorun | `designs/upvote-spec.md` spec'i yazılmış (Sprint 9) ama developer henüz implement etmemiş. F-16/F-17 tamamen açık. |
| "Popüler" filtresi bağlantısı | ⚠️ İyileştirme gerekli | Spec'te upvote ikincil sıralama kriteri olarak öneriliyor. MVP'de `commentCount` öncelikli — bu kabul edilebilir. |

**Tüm upvote UX'i implement edilmemiş. Developer görevi (bkz. RU2 spec: `designs/upvote-spec.md`).**

---

### 3. ForumTopicDetailScreen — Upvote UX

| Kontrol | Durum | Detay |
|---------|-------|-------|
| Konu detayında upvote butonu | ❌ Kritik sorun | Detay ekranında upvote butonu yok. Spec header veya konu kartına eklenmesini öneriyor; mevcut header'da yalnızca bildirim (subscribe) butonu var. |
| Toggle davranışı (aktif/pasif) | ❌ Kritik sorun | Implement edilmemiş. |
| MinTapTarget (44×44pt) | ⚠️ İyileştirme gerekli | Upvote butonu olmadığı için kontrol edilemiyor. Spec `hitSlop={{ top:8, bottom:8, left:12, right:12 }}` ile MinTapTarget karşılanmasını söylüyor — developer implement ederken uygulamalı. |
| Subscribe butonu MinTapTarget | ✅ Uyumlu | `subscribeBtn: width: MinTapTarget, height: MinTapTarget` — mevcut subscribe butonu WCAG uyumlu. |

---

### 4. NotificationsScreen — Güvenlik Sonrası UX

| Kontrol | Durum | Detay |
|---------|-------|-------|
| NO-03: Sadece kendi bildirimleri | ✅ Uyumlu | `api.notifications.getAll(token)` auth token ile çağrılıyor. Backend sadece kullanıcının bildirimleri dönüyor — UI'da "başkasının bildirimi" edge case'i oluşamaz. |
| NO-05: 403 hata UI'ı | ⚠️ İyileştirme gerekli | `handleNotifPress` içinde `api.notifications.markRead()` çağrısı `.catch(() => {})` ile silent fail yapıyor. 403 döndüğünde (başka kullanıcı bildirimi, teorik) kullanıcıya hiçbir geri bildirim yok. Ancak NO-03 gereği bu durum pratikte oluşmamalı. Yine de sessiz hata yerine `console.warn` en azından eklenebilir. |
| Okunmamış badge optimistic | ✅ Uyumlu | `handleNotifPress` → `markRead` API çağrısından önce `setNotifs` ile state güncelleniyor (optimistic). `markAllRead` da aynı pattern. |
| Akış tab okunmamış badge | ✅ Uyumlu | `!notif.read && <View style={styles.dot}/>` — kırmızı dot + `notifUnread` sol border stili. |
| Feed boş state | ✅ Uyumlu | "Henüz bildirim yok" + açıklayıcı alt metin. |

---

### 5. ForgotPasswordScreen — "Kodum var" Akışı UX

| Kontrol | Durum | Detay |
|---------|-------|-------|
| "Kodum var, şifreyi sıfırla" → navigate | ✅ Uyumlu | `submitted === true` → `onNavigateReset()` callback ile `ResetPasswordScreen`'e geçiş. Buton belirgin, CTA net. |
| Kayıtsız email hata mesajı | ⚠️ İyileştirme gerekli | `handleSubmit` → `catch` → `setError(e.message)`. Backend hata mesajı ham İngilizce gelebilir. Türkçe fallback yok: "Bu e-posta adresiyle kayıtlı hesap bulunamadı." gibi kullanıcı dostu mesaj gerekli. |
| Inline errorBox | ✅ Uyumlu | `errorBox` stili: `dangerLight` arka plan + `alert-circle` ikon. Alert kullanılmıyor. |
| Email format doğrulaması | ⚠️ İyileştirme gerekli | `handleSubmit` yalnızca boşluk kontrolü yapıyor (`!email`). Email format kontrolü yok — geçersiz format API'ye kadar gidiyor. Client-side `email.includes("@")` veya regex eklenmeli. |

---

### 6. GuideScreen — Guide Progress UX

| Kontrol | Durum | Detay |
|---------|-------|-------|
| G-07: Farklı ülkeye geçince progress sıfırlanıyor mu? | ✅ Uyumlu | `viewCountryId` değişince `loadData()` yeniden çağrılıyor. `progress` state tüm ülke adımlarını içeriyor — farklı ülke chip'ine basınca o ülkenin adımları ve ilerleme yüklenip gösteriliyor. Gözetleme ülkesi için `inactiveBanner` + grileşmiş progress bar gösteriliyor (renk `Colors.textMuted`). |
| Ülke değiştirme UI'ı | ✅ Uyumlu | Yatay scroll'lı chip listesi. Aktif ülke: `Colors.primary` dolu chip + pin ikonu. Gözetlenen ülke: `primaryLight` arka plan + `primary` border. Seçilmemiş: `surface` + `borderStrong`. |
| "Aktif Et" butonu (non-active ülke) | ✅ Uyumlu | `inactiveBanner` içinde "Aktif Et" butonu mevcut. `handleSetActive()` ile API çağrısı yapılıyor + `activeCountryId` güncelleniyor. Optimistic değil ama loading state var (`settingActive`). |
| Progress bar görsel reset | ✅ Uyumlu | Ülke geçişinde `loading: true` → spinner → yeni ülke adımları yükleniyor. Progress bar otomatik güncelleniyor. |
| Blocker durumu görünürlüğü | ✅ Uyumlu | `blocked === true` → `BlockerCard` gösteriliyor. `progressFillBlocked: backgroundColor: Colors.warning` — sarı bar. |

---

### Özet Tablosu — Sprint 2

| Ekran | Kontrol | Durum |
|-------|---------|-------|
| ResetPasswordScreen | Inline errorBox | ✅ |
| ResetPasswordScreen | A-16/A-17 Türkçe hata mesajı | ⚠️ |
| ResetPasswordScreen | "Yeni kod iste" ForgotPassword linki | ❌ |
| ForumTopicsScreen | Upvote butonu her satırda | ❌ |
| ForumTopicsScreen | Aktif/pasif upvote state | ❌ |
| ForumTopicsScreen | Optimistic sayaç | ❌ |
| ForumTopicDetailScreen | Upvote butonu | ❌ |
| ForumTopicDetailScreen | Toggle davranışı | ❌ |
| ForumTopicDetailScreen | Subscribe butonu MinTapTarget | ✅ |
| NotificationsScreen | NO-03 kendi bildirimleri | ✅ |
| NotificationsScreen | NO-05 403 hata UI | ⚠️ (silent fail) |
| NotificationsScreen | Okunmamış badge optimistic | ✅ |
| ForgotPasswordScreen | "Kodum var" → navigate | ✅ |
| ForgotPasswordScreen | Hata mesajı Türkçe | ⚠️ |
| ForgotPasswordScreen | Email format doğrulaması | ⚠️ |
| GuideScreen | G-07 ülke geçişi progress reset | ✅ |
| GuideScreen | Ülke değiştirme UI | ✅ |

### Öncelikli Düzeltmeler (Developer Görevi)

| Kod | Öncelik | Görev |
|-----|---------|-------|
| SP2-D1 | **P0** | `ForumTopicsScreen` + `ForumTopicDetailScreen`: RU2 spec'e göre upvote butonunu implement et. `Topic` interface'e `upvotes: number`, `hasUpvoted: boolean` ekle. Optimistic update + toggle. |
| SP2-D2 | **P1** | `ResetPasswordScreen`: Token hata durumunda (A-16/A-17) inline "Yeni kod iste →" linki ekle (`onNavigateForgot` prop) + backend hata mesajlarına Türkçe map. |
| SP2-D3 | **P2** | `ForgotPasswordScreen`: Email format client-side validasyonu ekle + hata mesajlarına Türkçe fallback. |
| SP2-D4 | **P3** | `NotificationsScreen`: `markRead` catch bloğuna `console.warn` ekle (silent fail yerine en azından log). |

## Design Audit — Sprint 3 (P2, 2026-05-16)

### 1. L-09 — Splash / Loading State (Oturum Restore) ✅ Uyumlu

`AuthContext.tsx`: `isLoading` state `true` başlıyor, AsyncStorage'dan token+user okunduktan sonra `false` oluyor.
`AppNavigator.tsx`: `isLoading === true` iken `<ActivityIndicator size="large" color={Colors.primary}>` centered `<View style={styles.loading}>` içinde gösteriliyor. Arka plan `Colors.background`.

**Değerlendirme:** Flash of Login Screen sorunu yok. Loading sırasında kullanıcı AuthStack'e düşmüyor; `isLoading` false olmadan navigator render edilmiyor. UX spec karşılanmış.

**İyileştirme önerisi (P3):** Marka logosu + spinner daha premium hissettirirdi (şu an sadece spinner). MVP için kabul edilebilir.

---

### 2. N-10 — Tab Bar Bildirim Rozeti ✅ Uyumlu

`AppNavigator.tsx` incelendi:
- `BadgeDot` bileşeni mevcut: `count <= 0` → görünmez, `count > 9` → "9+", diğerleri sayı.
- Token uyumu: `backgroundColor: Colors.danger`, `color: "#fff"`, `fontSize: 10`, `fontWeight: "700"`, `minWidth: 18`, `height: 18`, `borderRadius: 9`, `paddingHorizontal: 4` — Sprint 9 memory spec ile tam uyumlu.
- Konum: **Home tab ikonunun** üst sağ köşesi (`top: -4, right: -8`) — Sprint 9 kararıyla uyumlu.
- `useUnreadCount` hook: mount + `AppState "active"` event'inde refresh — spec'e uygun.

**Değerlendirme:** N-10 tamamen implement edilmiş ve Sprint 9 spec'ine uyumlu.

---

### 3. G-03 — Guide Blocker Adım Görsel State ✅ Uyumlu (küçük iyileştirme notu)

`GuideScreen.tsx` incelendi — 4 state:

| State | Görsel | Uygulama |
|-------|--------|----------|
| completed (normal) | Yeşil badge (`Colors.secondary`), `completedCard: secondaryLight bg, #BBF7D0 border` | ✅ `CompletedCard` |
| completed (blocking) | Amber badge (`warningLight + warning border`), `completedCardWarn` | ✅ `blocking && styles.completedCardWarn` |
| active (next step) | Mavi outlined kart (`Colors.primary border + shadow`) | ✅ `ActiveStepCard` |
| locked (sonraki) | Görünmüyor — `visibleUpTo + 1` ile slice edildiği için listelenmez | ✅ Doğru yaklaşım |
| disqualified (blocker) | `BlockerCard`: amber bg, `alert-circle` ikon, açıklama metin + opsiyonel FAQ linki | ✅ `BlockerCard` bileşeni |

**Disqualified / Blocker detayı:** Amber arka plan (`Colors.warningLight`), `#FDE68A` border, `Colors.warning` ikon, `#92400E` başlık, `#78350F` metin — spec'e uyumlu. "Bu adımda durmanız gerekiyor" başlığı mevcut.

**Eksik:** Blocker'da tıklanınca toast gösterimi spec'te belirtilmişti. `BlockerCard` tıklanamaz — sadece statik görüntü. Küçük iyileştirme: kart `TouchableOpacity` olarak ve üzerine dokunulunca "Bu adımdan ilerlenemez" kısa toast eklenebilir (P3).

**Token uyumu sorunları (P3):**
- `#7C3AED`, `#F5F3FF`, `#DDD6FE` — violet/premium renkleri "global step" badge için kullanılıyor. Sistemde `Colors.premium` var ama `Colors.premiumLight` / `Colors.premiumBorder` token yok. P3 kabul edilebilir.
- `#BBF7D0`, `#D1FAE5`, `#065F46` — green tint değerleri, `Colors.secondary` yerine kullanılmış. Görsel olarak aynı ama token dışı (P3).
- `activateBtn: minHeight: 36` — MinTapTarget (44pt) altında. ⚠️ P2 — `minHeight: MinTapTarget` olmalı.

---

### 4. FT-05 — ForumTopicsScreen Pagination UX ⚠️ İyileştirme Gerekli

`ForumTopicsScreen.tsx` incelendi:
- `FlatList` kullanılıyor ✅
- `onEndReached` prop yok ❌ — sayfalama/infinite scroll implement edilmemiş.
- `ListFooterComponent` yok ❌ — footer spinner yok.
- Şu an tüm topic'ler tek seferde `api.forum.getTopics()` ile çekiliyor.

**UX Spec (FT-05 fix):**
```
FlatList:
  onEndReached={() => loadMore()}   // page-based veya cursor-based
  onEndReachedThreshold={0.3}
  ListFooterComponent={loadingMore ? <ActivityIndicator color={Colors.primary} style={{ marginVertical: 16 }} /> : null}
```
Developer görevi: API'ye `?page=` veya `?cursor=` parametresi ekle + FlatList'i paginate et. Mevcut data küçükken sorun yok ama scale için gerekli.

**Öncelik:** P2 — şu an veri kümesi küçük, kritik değil ama erken alınmalı.

---

### 5. CT-08 — "Onay Bekliyor" / "Reddedildi" Badge ✅ Uyumlu

`ForumTopicsScreen.tsx` `TopicRow` bileşeni incelendi:
- `showStatusBadge = topic.isMine && topic.status !== "approved"` — yalnızca kendi konusu + onaysız durum kombinasyonunda gösteriliyor.
- **Pending (Onay Bekliyor):** `statusPending: backgroundColor: Colors.warningLight` + `statusTextPending: color: "#92400E"` — amber arka plan, koyu kahve metin. ✅
- **Rejected (Reddedildi):** `statusRejected: backgroundColor: Colors.dangerLight` + `statusTextRejected: color: "#991B1B"` — kırmızı arka plan, koyu kırmızı metin. ✅
- Lock ikonu spec'te belirtilmişti — mevcut değil. Badge yalnızca metin gösteriyor. P3 iyileştirme.
- Token uyumu: `Colors.warningLight`, `Colors.dangerLight` — tema token'larıyla uyumlu ✅.

---

## Design Audit — Sprint 4 (P3, 2026-05-16)

### 6. NAV-05/06 — Deep Link UX ⚠️ Kısmi

`AppNavigator.tsx` `linking` config incelendi:
```js
Forum: {
  path: "forum/topic/:openTopicId",
  parse: { openTopicId: (id: string) => id },
}
```
- Deep link yapılandırması mevcut ✅
- Giriş yapılmamış kullanıcı `goworldy://forum/topic/:id` açınca: `user === null` → `<AuthNavigator />` render ediliyor. React Navigation `linking` config giriş yapılmamış durumda `AuthStack` içinde `Forum` route'unu çözemez → kullanıcı LoginScreen'e düşer. ✅ (otomatik)
- **Sorun:** Intent korunmuyor ❌ — giriş yaptıktan sonra kullanıcı HomeScreen'e gider, topic'e otomatik yönlendirilmez. React Navigation `linking` config `AuthStack` ile `MainTabs` arasında intent aktarımı yapmıyor.
- **"Devam etmek için giriş yapın" mesajı:** Yok. Kullanıcı neden LoginScreen'e geldiğini anlamıyor.

**UX Spec (NAV-05/06):**
1. `LinkingContext` veya `initialURL` ile "pending deep link" state tut.
2. `AuthContext` `login()` başarısı sonrası → pending link varsa `navigation.navigate(target)`.
3. LoginScreen'de (deep link ile gelinmişse) bilgilendirme banner: "Bu içeriği görmek için giriş yapmanız gerekiyor." — `Colors.primaryLight` arka plan, `Colors.primary` metin, `information-circle` ikon.

**Öncelik:** P2 — deep link ile gelen kullanıcı intent'i kaybedince platformdan kopukluğu hisseder.

---

### 7. AD-08/09 — Admin Kullanıcı Arama UX ✅ Uyumlu

`admin/src/pages/UsersPage.tsx` incelendi:
- Arama input'u mevcut: `placeholder="İsim veya e-posta ara..."`, `width: 260`, `padding: "9px 14px"`. ✅
- `handleSearch`: `displayName` ve `email` üzerinde case-insensitive `toLowerCase().includes(lower)` filtresi. ✅
- Boş sonuç: `filtered.length === 0 && <div style={css.empty}>Kullanıcı bulunamadı.</div>` — Türkçe, yeterli. ✅
- Hata: `setError()` inline banner (`#FEF2F2` bg, `#DC2626` renk). ✅ — Sprint 6'da düzeltilmişti, doğrulandı.
- `USER_TYPE_LABELS` — Türkçe etiketler mevcut. ✅

**Admin token uyumu:** Inline CSS kullanıyor — Sprint 4 MVP kararıyla kabul edilebilir. GoWorldy brand renkleriyle (blue, gray) genel uyumlu.

**Küçük sorun (P3):** `searchInput` stil objesinde `border`, `borderRadius`, `outline` tanımı yok — tarayıcı default input stili görünüyor. Görsel tutarsızlık. `border: "1px solid #E2E8F0"`, `borderRadius: 8`, `outline: "none"` eklenmeli.

---

### 8. P10-2 — PremiumScreen Geçerlilik Süresi ✅ Uyumlu (iyileştirme notu)

`PremiumScreen.tsx` incelendi:
- `premiumStatus` state: `{ isPremium: boolean; premiumUntil?: string }` — `/users/me`'den `isPremium` ve `premiumUntil` alınıyor. ✅
- `refreshCredits()` hem mount hem de `goworldy://payment/success` deep link'te çağrılıyor. ✅
- **Aktif Premium Card:** `premiumStatus.isPremium === true` iken `activePremiumCard` görünüyor. `Colors.secondary` (yeşil) arka plan, `checkmark-circle` ikon, "Aktif Premium Üye" başlığı. ✅
- **Bitiş tarihi:** `premiumUntil` varsa `toLocaleDateString("tr-TR", { day, month, year })` formatında "X tarihine kadar geçerlidir." ✅

**Eksik — Countdown (P3):** Spec "X gün Y saat kaldı" countdown formatı istiyordu. Şu an sadece tarih gösteriliyor ("15 Haziran 2026 tarihine kadar"). Gerçek zamanlı geri sayım yok.

**Renk değişimi (< 24 saat) — Spec kararı gerekli:**
- Şu an `activePremiumCard` her zaman `Colors.secondary` (yeşil) kullanıyor.
- **UX Önerisi:** `premiumUntil` ile şu an arasındaki fark < 24 saat ise `backgroundColor: Colors.warning` (amber), < 3 gün ise `Colors.warningLight` border + normal yeşil arka plan — kullanıcıyı yenileme için uyar.
- **Sprint 4 kararı (P2):** Countdown yerine sadece `Colors.warning` arka plan geçişi yeterli MVP için. Gerçek zamanlı countdown post-MVP.

**Token sorunları:**
- `premiumCta: paddingVertical: 12` → `Spacing.md` (16) değil; P3.
- `sectionTitle: fontSize: 17, marginBottom: 12` → Typography/Spacing token yok; P3.
- `actionCard: padding: 14` → token yok; P3, kabul edilebilir.
- `balanceBtn: minHeight: MinTapTarget` ✅ — Sprint 1 audit'te işaretlenmiş ve düzeltilmişti, doğrulandı.

---

### 9. SEC-07 — Rate Limiting 429 UX ❌ Eksik

`mobile/src/services/api.ts` `request()` fonksiyonu incelendi:
```ts
if (!res.ok) {
  if (res.status === 401 && on401Handler) on401Handler();
  throw new ApiError(data.error || "Request failed", res.status);
}
```
- 429 için özel handling yok. Sadece genel `ApiError` fırlatılıyor.
- Çağıran ekranlarda 429'a özel UI yok — genel hata mesajı gösterilir veya catch bloğu boş.

**UX Spec (SEC-07, P3):**
```ts
// api.ts request() içinde:
if (res.status === 429) {
  throw new ApiError("Çok fazla istek gönderildi. Lütfen bir dakika bekleyin.", 429);
}
```
Ekran seviyesinde: `ApiError.status === 429` ise özel inline errorBox + 60 saniyelik geri sayım timer.
Geri sayım: `setInterval` ile `timeLeft` state, her saniye azalır, 0'da tekrar denemek için buton aktif olur.
Tüm form submit butonları ve API çağrıları bu pattern'i paylaşabilir — ortak `useRateLimit()` hook önerilebilir.

**Öncelik:** P3 — şu an rate limiting backend'de aktif mi belirsiz; frontend spec hazır, developer MVP sonrası implement eder.

---

### 10. Genel Token Kontrolü — Sprint 3-4 Etkilenen Dosyalar

**CreateTopicScreen.tsx:**
- `btnText: color: "#fff"` → `Colors.surface` olmalı ⚠️ (Sprint 9'da diğer ekranlarda düzeltilmişti, burada kaçmış — DA7 olarak daha önce işaretlenmişti)
- `infoBoxStaff: backgroundColor: "#ECFDF5", borderColor: "#A7F3D0"` → `Colors.secondaryLight` / token-yakın P3
- `infoTitle: color: "#92400E"`, `infoText: color: "#78350F"` → amber koyu ton, token yok P3

**GuideScreen.tsx:**
- `#7C3AED`, `#F5F3FF`, `#DDD6FE` → violet/premium badge renkleri, token yok P3
- `#BBF7D0`, `#D1FAE5`, `#065F46` → green tint, `Colors.secondary`-türevi P3
- `activateBtn minHeight: 36` → MinTapTarget olmalı ⚠️ P2
- `badgeNum color: "#fff"` → `Colors.surface` olmalı P3
- `tabBadgeTextActive color: "#fff"` → `Colors.surface` olmalı P3

**PremiumScreen.tsx:**
- Büyük ölçüde temiz. `premiumCta paddingVertical: 12`, `sectionTitle fontSize: 17` → P3
- `activePremiumCard` renk geçişi (< 24 saat `Colors.warning`) eklenmeli P2

**AppNavigator.tsx:**
- `badgeStyles.text: color: "#fff"` → `Colors.surface` olmalı P3 (küçük istisna)
- Geri kalan her şey `Colors` token kullanıyor ✅

**ForumTopicsScreen.tsx:**
- Token uyumu genel olarak iyi. `row padding: 14`, `statusText fontSize: 10` → küçük token dışı değerler P3.

**Admin UsersPage.tsx:**
- Inline CSS — MVP kararıyla kabul edilebilir. `searchInput` border/outline eksik P3.

### Sprint 3+4 Özet Tablosu

| Madde | Ekran | Durum |
|-------|-------|-------|
| L-09 Splash/Loading | AppNavigator + AuthContext | ✅ Uyumlu |
| N-10 Tab Bar Badge | AppNavigator | ✅ Uyumlu |
| G-03 Guide Blocker State | GuideScreen | ✅ Uyumlu (küçük P3 notlar) |
| FT-05 Pagination UX | ForumTopicsScreen | ⚠️ İyileştirme (P2) |
| CT-08 Pending/Rejected Badge | ForumTopicsScreen | ✅ Uyumlu |
| NAV-05/06 Deep Link Intent | AppNavigator | ⚠️ Intent korunmuyor (P2) |
| AD-08/09 Admin Arama | UsersPage | ✅ Uyumlu |
| P10-2 Premium Bitiş Süresi | PremiumScreen | ✅ Uyumlu (countdown P3) |
| SEC-07 429 Rate Limit UX | api.ts + ekranlar | ❌ Eksik (P3) |
| Token Kontrolü genel | Birden fazla | ⚠️ P3 notlar listede |

### Öncelikli Düzeltmeler (Developer Görevi)

| Kod | Öncelik | Görev |
|-----|---------|-------|
| SP34-D1 | **P2** | `GuideScreen` `activateBtn`: `minHeight: 36` → `MinTapTarget` (44pt WCAG) |
| SP34-D2 | **P2** | `ForumTopicsScreen`: FlatList'e `onEndReached` + `ListFooterComponent` (pagination) |
| SP34-D3 | **P2** | `AppNavigator`: Deep link intent korunması — pending URL state + login sonrası otomatik navigate |
| SP34-D4 | **P2** | `PremiumScreen` `activePremiumCard`: `premiumUntil` < 24 saat ise `Colors.warning` arka plan geçişi |
| SP34-D5 | **P3** | `api.ts` `request()`: 429 → özel `ApiError` mesajı ("Çok fazla istek...") + ekran seviyesinde 60s geri sayım |
| SP34-D6 | **P3** | `CreateTopicScreen` `btnText`: `color: "#fff"` → `Colors.surface` |
| SP34-D7 | **P3** | `GuideScreen`: `badgeNum`, `tabBadgeTextActive` `"#fff"` → `Colors.surface` |
| SP34-D8 | **P3** | Admin `UsersPage` `searchInput`: `border`, `borderRadius`, `outline: none` ekle |
| SP34-D9 | **P3** | `ForumTopicsScreen` CT-08 Pending badge: lock ikonu ekle (spec isteği) |

## User Research Notes
<!-- Populate as user feedback comes in -->
