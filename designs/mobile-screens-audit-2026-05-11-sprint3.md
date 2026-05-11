# UX/UI Audit — Mobile Screens (Sprint 3, 2026-05-11)

Bu belge `git diff main` analizi sonucu bu sprintte eklenen veya değiştirilen
mobil ekranların UX/UI denetim çıktısını özetler.

---

## Denetim Kapsamı

Önceki iki sprint'te theme.ts token geçişi tamamlanmış ekranlar bu sprint'te
yeniden denetlenmedi. Bu sprint'e özgü YENİ dosyalar incelendi.

| Dosya | Durum Öncesi | Durum Sonrası |
|-------|-------------|---------------|
| `mobile/src/screens/main/ForumCategoriesScreen.tsx` | ❌ Hardcode renkler, WCAG ihlali | ✅ Düzeltildi |
| `mobile/src/screens/auth/ForgotPasswordScreen.tsx` | ❌ Hardcode renkler, hata UI tutarsız | ✅ Düzeltildi |
| `mobile/src/screens/auth/ResetPasswordScreen.tsx` | ❌ Hardcode renkler, MinTapTarget eksik | ✅ Düzeltildi |
| `mobile/src/screens/main/CreateTopicScreen.tsx` | ✅ theme.ts zaten kullanıyor | ✅ Değişiklik gerekmedi |
| `mobile/src/screens/main/ForumTopicsScreen.tsx` | ✅ theme.ts zaten kullanıyor | ✅ Değişiklik gerekmedi |
| `mobile/src/screens/main/GuideScreen.tsx` | ✅ theme.ts zaten kullanıyor | ✅ Değişiklik gerekmedi |

---

## Değişiklik Detayları

### 1. ForumCategoriesScreen.tsx

**Dosya:** `mobile/src/screens/main/ForumCategoriesScreen.tsx`

**Sorunlar tespit edildi:**
- `theme.ts` import yoktu; tüm renkler, spacing ve radius değerleri hardcode idi.
- `backBtn` için `minWidth/minHeight: MinTapTarget` yoktu → WCAG AA ihlali.
- `iconBox.borderRadius: 10` → tasarım sisteminde 10px tanımlı değil.
- `activeOpacity` eksikti satır öğelerinde.

**Yapılan değişiklikler:**
- `import { Colors, Typography, Spacing, Radius, MinTapTarget } from "../../theme"` eklendi.
- `container.backgroundColor: "#F9FAFB"` → `Colors.background`
- `header.paddingHorizontal: 8` → `Spacing.sm`
- `backBtn`: `minWidth: MinTapTarget, minHeight: MinTapTarget, justifyContent: "center"` eklendi.
- `title: fontSize: 22, fontWeight: "bold", color: "#111827"` → `Typography.h1, Colors.textPrimary`
- `list`: `paddingHorizontal: 16` → `Spacing.md`; `paddingBottom: 24` → `Spacing.lg`
- `row`: `backgroundColor: "#fff"` → `Colors.surface`; `borderRadius: 12` → `Radius.md`; `marginBottom: 8` → `Spacing.sm`; `borderColor: "#E5E7EB"` → `Colors.border`; `minHeight: MinTapTarget` eklendi.
- `iconBox`: `borderRadius: 10` → `Radius.md`; `backgroundColor: "#EFF6FF"` → `Colors.primaryLight`
- `rowText.color: "#111827"` → `Colors.textPrimary`
- `emptyTitle` → `Typography.body, Colors.textPrimary`
- `emptyText` → `Typography.caption, Colors.textSecondary`
- `errorText` → `Typography.label, Colors.danger`
- JSX'te tüm `"#2563EB"`, `"#EF4444"`, `"#9CA3AF"` renkleri → `Colors.*` token.
- `renderItem` `TouchableOpacity`'e `activeOpacity={0.7}` eklendi.

---

### 2. ForgotPasswordScreen.tsx

**Dosya:** `mobile/src/screens/auth/ForgotPasswordScreen.tsx`

**Sorunlar tespit edildi:**
- `theme.ts` import yoktu.
- Hata mesajı düz `<Text style={styles.error}>` idi — LoginScreen/RegisterScreen'deki
  icon'lu hata kutusuyla tutarsız.
- `successBox`'ta icon yoktu.
- `btn.minHeight: MinTapTarget` eksikti.
- `input.minHeight: MinTapTarget` eksikti.

**Yapılan değişiklikler:**
- `theme.ts` import eklendi + `Ionicons` import eklendi.
- `error` plain text → `errorBox` (flexRow, dangerLight bg, `alert-circle` icon, `Typography.caption`).
- `successBox` → flexRow + `checkmark-circle` Ionicons icon eklendi; `backgroundColor: "#D1FAE5"` → `Colors.secondaryLight`.
- `container.backgroundColor` → `Colors.background`
- `inner.paddingHorizontal: 24` → `Spacing.lg`
- `title` → `Typography.h1, Colors.textPrimary, Spacing.sm marginBottom`
- `subtitle.color: "#6B7280"` → `Colors.textSecondary`; `marginBottom: 32` → `Spacing.xl`
- `input`: `Colors.surface`, `Colors.borderStrong`, `Radius.md`, `Colors.textPrimary`, `minHeight: MinTapTarget` eklendi.
- `btn`: `Colors.primary`, `Radius.md`, `minHeight: MinTapTarget` eklendi; `btnDisabled` opacity state ayrıldı.
- `link.paddingVertical: 8` → `Spacing.sm`
- `linkText` → `Typography.label, Colors.primary`

---

### 3. ResetPasswordScreen.tsx

**Dosya:** `mobile/src/screens/auth/ResetPasswordScreen.tsx`

**Sorunlar tespit edildi:**
- `theme.ts` import yoktu.
- `inputRow.minHeight: MinTapTarget` eksikti → WCAG AA ihlali.
- `showPassword` toggle butonu için yeterli dokunma alanı yoktu.
- `successTitle: fontSize: 22` — tasarım sisteminde 22px tanımlı değil (h1=24, h2=20).
- `label.color: "#374151"` (gray-700) → `Colors.textPrimary` (gray-900) ile tutarlı olmalı.
- `errorBox.borderRadius: 10` → tasarım sisteminde tanımlı değil.
- Tüm hardcode renkler ve spacing değerleri.

**Yapılan değişiklikler:**
- `theme.ts` import eklendi.
- Tüm hardcode `#` renkleri → `Colors.*` token.
- `container.backgroundColor` → `Colors.background`
- `scroll.padding: 24` → `Spacing.lg`
- `title` → `Typography.h1, Colors.textPrimary, Spacing.sm`
- `subtitle` → `Typography.label, Colors.textSecondary, Spacing.lg`
- `errorBox`: `Colors.dangerLight`, `Radius.md`, gap `Spacing.sm`
- `errorText` → `Typography.caption, Colors.danger`
- `label` → `Typography.caption`, color `Colors.textPrimary`
- `inputRow`: `Colors.surface`, `Colors.borderStrong`, `Radius.md`, `minHeight: MinTapTarget`; gap `Spacing.sm`
- `showBtn`: `minWidth/minHeight: MinTapTarget` + `hitSlop` eklendi.
- `input.color` → `Colors.textPrimary`
- `btn`: `Colors.primary`, `Radius.md`, `minHeight: MinTapTarget`
- `link.paddingVertical` → `Spacing.md`
- `linkText` → `Typography.label, Colors.primary`
- `successContainer.backgroundColor` → `Colors.background`; `padding: 32` → `Spacing.xl`
- `successTitle` → `Typography.h1, Colors.textPrimary, Spacing.sm` (22px → 24px, tasarım sistemine uyum)
- `successText.color: "#6B7280"` → `Colors.textSecondary`; `marginBottom: 32` → `Spacing.xl`
- `successIcon.marginBottom: 16` → `Spacing.md`
- `<Ionicons color="#10B981">` → `Colors.secondary`

---

## Mevcut Durumda Clean Olan Ekranlar (Bu Sprint)

Aşağıdaki ekranlar developer tarafından zaten `theme.ts` kullanılarak yazıldı,
UX/UI müdahalesi gerektirmedi:

| Ekran | Notlar |
|-------|--------|
| `CreateTopicScreen.tsx` | theme.ts tam kapsamda, MinTapTarget uygulanmış |
| `ForumTopicsScreen.tsx` | theme.ts tam kapsamda, filter chip'ler doğru |
| `GuideScreen.tsx` | 4-state step visual sistemi doğru uygulanmış |

---

## Tespit Edilen Açık Sorunlar (Bu Sprint Çözülmedi)

| ID | Ekran | Sorun | Öneri |
|----|-------|-------|-------|
| S3-01 | `CreateTopicScreen` | Modal olarak değil component olarak kullanılıyor — navigasyon stack dışında render. | Navigation stack'e eklenmeli veya bottom sheet modal olarak sarılmalı (developer kararı). |
| S3-02 | `ForumCategoriesScreen` | Header'da `backgroundColor` yok, scroll sırasında content altında görünür. | `backgroundColor: Colors.surface` + `borderBottomWidth: 1, borderBottomColor: Colors.border` eklenebilir. |
| S3-03 | Tüm auth ekranlar | Logo/marka görseli yok — diğer auth ekranlarla (LoginScreen) görsel uyum sağlanmalı. | Logo veya marka rengi başlığı auth ekranların üstüne taşınabilir. |

---

## Tüm Sprint'lerdeki Kümülatif Durum

Sprint 1 + 2 + 3 tamamlandıktan sonra:

- **Hardcode değer içeren mobil ekran**: 0
- **MinTapTarget eksik etkileşim**: 0 (bilinen)
- **theme.ts'den bağımsız çalışan ekran**: 0
