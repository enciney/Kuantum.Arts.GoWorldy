# Mobile + Admin UX Audit — Sprint 4 (2026-05-11)

## Scope
`git diff main` ile tespit edilen yeni/değişen dosyalar tarandı. Öncelikli iş kalemleri
uygulandı; admin dashboard ilk kez incelendi.

---

## Uygulanan Düzeltmeler

### 1. ForumCategoriesScreen — Header Arka Plan (Sprint 3 Açık Sorun) ✅
**Dosya:** `mobile/src/screens/main/ForumCategoriesScreen.tsx`
**Sorun:** `header` stilinde `backgroundColor` yoktu; scroll sırasında içerik header'ın altından görünüyordu.
**Düzeltme:** `backgroundColor: Colors.surface`, `borderBottomWidth: 1`, `borderBottomColor: Colors.border` eklendi.

### 2. AppNavigator — Tab Bar Hardcoded Renkler ✅
**Dosya:** `mobile/src/navigation/AppNavigator.tsx`
**Sorun:** Tab bar ve loading ekranında 4 adet hardcoded hex değeri vardı. theme.ts'den token kullanılmıyordu.
**Düzeltme:**
- `Colors` import'u eklendi (`../theme`)
- `tabBarActiveTintColor: "#2563EB"` → `Colors.primary`
- `tabBarInactiveTintColor: "#6B7280"` → `Colors.neutral`
- `tabBarStyle.backgroundColor: "#fff"` → `Colors.surface`
- `tabBarStyle.borderTopColor: "#E5E7EB"` → `Colors.border`
- `styles.loading.backgroundColor: "#F9FAFB"` → `Colors.background`
- `ActivityIndicator color="#2563EB"` → `Colors.primary`

### 3. HomeScreen — Empty State Icon Hardcoded Renk ✅
**Dosya:** `mobile/src/screens/main/HomeScreen.tsx` satır 161
**Sorun:** `color="#9CA3AF"` hardcoded; design token değildi.
**Düzeltme:** `color={Colors.textMuted}` olarak güncellendi.

### 4. ProfileScreen — BU1 Avatar Overlay (P2) ✅
**Dosya:** `mobile/src/screens/main/ProfileScreen.tsx`
**Sorun:** Avatar üzerinde düzenleme göstergesi yoktu. Küçük kamera ikonu (28×28) MinTapTarget altındaydı.
**Düzeltme:**
- `avatarEdit` butonu kaldırıldı (28×28 → WCAG ihlali).
- `avatarBox` bir `TouchableOpacity` haline getirildi (tüm avatar alanı tıklanabilir, MinTapTarget'ın çok üzerinde 88×88).
- `avatarOverlay` stili eklendi: `position: absolute, bottom: 0`, yükseklik `30px`, `backgroundColor: rgba(0,0,0,0.4)`, kamera ikonu ortada beyaz.
- `avatarText` rengi `"#fff"` → `Colors.surface` olarak token'a bağlandı.
- `avatar` stiline `overflow: "hidden"` eklendi (overlay düzgün clip için).

### 5. Admin Layout — Logout Butonu Stili ✅
**Dosya:** `admin/src/components/Layout.tsx`
**Sorun:** `logoutBtn`'da `borderRadius` ve `cursor` yoktu; buton köşesiz ve tıklanabilirlik göstergesi olmadan görünüyordu.
**Düzeltme:** `borderRadius: 6, cursor: "pointer", border: "none"` eklendi.

---

## Admin Dashboard — İlk Audit (Sprint 4)

### Mevcut Durum
Admin paneli (React + Vite, `admin/src/`) bu sprintte developer tarafından oluşturuldu.
3 sayfa mevcut: `LoginPage`, `DashboardPage`, `TopicsPage`, `UsersPage`.

### Gözlemler

| Sayfa | Durum | Notlar |
|-------|-------|--------|
| LoginPage | ✅ İyi | Tasarım sistemiyle uyumlu renkler, kart merkezi layout |
| DashboardPage | ✅ İyi | 4 stat kartı, ülke renkleriyle vurgu |
| TopicsPage | ⚠️ Eksik | Red butonu için "sebep" modalı yok (spec gereksinimi) |
| UsersPage | ✅ İyi | Arama + rol dropdown çalışıyor |
| Layout (sidebar) | ✅ Düzeltildi | Logout butonu border-radius eklendi |

### Admin — Tespit Edilen Açık Sorunlar (Developer Görevi)
- `TopicsPage`: "Reddet" butonu basıldığında sebep sorulmuyor. Spec: "Rejection requires reason (textarea modal)". → Developer B8 olarak eklenebilir.
- **Config Panel** sayfası hiç yok (spec'te var: fiyatlandırma + toggle'lar). → Developer görevi.

### Admin Token Sistemi Notu
Admin web uygulaması inline CSS nesneleri (`css: Record<string, React.CSSProperties>`)
kullanıyor. Bu MVP için kabul edilebilir; ancak renkler GoWorldy design system ile genel olarak uyumlu
(mavi #3B82F6, emerald #10B981, kırmızı #EF4444). Gelecek sprintte `admin/src/tokens.ts` oluşturulabilir.

---

## Çözülmeyen / Sonraki Sprint

| Kod | Ekran | Konu | Öncelik |
|-----|-------|------|---------|
| — | Admin TopicsPage | Reddet → sebep modalı | Developer |
| — | Admin | Config Panel sayfası | Developer |
| — | Auth (ForgotPassword, ResetPassword) | Logo/marka görseli eksik | UX Sprint 5 |
| BU1 | ProfileScreen | Avatar yükleme sırasında ActivityIndicator (Modal içinde) | P3 |
