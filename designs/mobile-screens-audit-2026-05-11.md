# GoWorldy Mobile — UX/UI Audit & Spec (2026-05-11)

Bu döküman, `git diff main` analizi sonucu tespit edilen tüm yeni/değişen ekranların
tasarım standardı denetimini ve uygulanan düzeltmeleri içerir.

---

## Ekranlar Durumu

| Ekran | Dosya | theme.ts | MinTapTarget | activeOpacity | Durum |
|-------|-------|----------|-------------|---------------|-------|
| LoginScreen | `auth/LoginScreen.tsx` | ✅ Düzeltildi | ✅ | ✅ | Temiz |
| RegisterScreen | `auth/RegisterScreen.tsx` | ✅ Düzeltildi | ✅ | ✅ | Temiz |
| ForgotPasswordScreen | `auth/ForgotPasswordScreen.tsx` | — | — | — | İncelenmedi* |
| HomeScreen | `main/HomeScreen.tsx` | ✅ Düzeltildi | — | ✅ | Temiz |
| NotificationsScreen | `main/NotificationsScreen.tsx` | ✅ Düzeltildi | ✅ | ✅ | Temiz + BU2 uygulandı |
| ForumScreen | `main/ForumScreen.tsx` | ✅ Düzeltildi | — | — | Temiz |
| ForumCategoriesScreen | `main/ForumCategoriesScreen.tsx` | ✅ Önceki sprint | ✅ | ✅ | Temiz |
| ForumTopicsScreen | `main/ForumTopicsScreen.tsx` | ✅ Önceki sprint | ✅ | ✅ | Temiz |
| ForumTopicDetailScreen | `main/ForumTopicDetailScreen.tsx` | ✅ Önceki sprint | ✅ | ✅ | Temiz |
| CreateTopicScreen | `main/CreateTopicScreen.tsx` | ✅ | ✅ | ✅ | Temiz |
| GuideScreen | `main/GuideScreen.tsx` | ✅ Önceki sprint | ✅ | ✅ | Temiz |
| ProfileScreen | `main/ProfileScreen.tsx` | ✅ Önceki sprint | ✅ | ✅ | Temiz |
| PremiumScreen | `main/PremiumScreen.tsx` | ✅ Önceki sprint | ✅ | ✅ | Temiz |
| PrivacyScreen | `main/PrivacyScreen.tsx` | ✅ Önceki sprint | ✅ | ✅ | Temiz |

> *ForgotPasswordScreen ve ResetPasswordScreen öncelikli olmayan ekranlar.

---

## Bu Sprint Uygulanan Değişiklikler

### 1. NotificationsScreen — theme.ts Geçişi + BU2 Uygulaması

**Dosya:** `mobile/src/screens/main/NotificationsScreen.tsx`

**Değişiklikler:**
- `Colors, Typography, Spacing, Radius, MinTapTarget` import edildi
- Tüm hardcoded renkler token'lara çevrildi
- `ICON_MAP` renkleri: `Colors.secondary / danger / primary / warning`
- `Switch` trackColor/thumbColor: `Colors.borderStrong / Colors.primary`
- `ActivityIndicator` color: `Colors.primary`

**BU2 Spec Uygulaması (Okunmamış bildirim sol border):**
```
notifUnread: {
  backgroundColor: Colors.primaryLight,   // blue-50
  borderColor: "#BFDBFE",                 // blue-200
  borderLeftWidth: 4,                     // 4px sol border
  borderLeftColor: Colors.primary,        // blue-600
  overflow: "hidden",                     // border taşmasını önler
}
```

**Tab butonları:** `minHeight: MinTapTarget` eklendi (44pt WCAG AA)

---

### 2. HomeScreen — theme.ts Geçişi

**Dosya:** `mobile/src/screens/main/HomeScreen.tsx`

**Değişiklikler:**
- `Colors, Typography, Spacing, Radius` import edildi
- `StatCard` icon renkleri: `Colors.secondary / primary / warning`
- `ActionCard` icon/bg renkleri: `Colors.primaryLight / secondaryLight / warningLight / premiumLight`
- `premiumBanner` bg: `Colors.premium` (`#8B5CF6`)
- Tüm `StyleSheet` değerleri token'lara çevrildi
- Logout butonu `activeOpacity={0.7}` eklendi

---

### 3. ForumScreen — theme.ts Geçişi

**Dosya:** `mobile/src/screens/main/ForumScreen.tsx`

**Değişiklikler:**
- `Colors, Typography, Spacing, Radius` import edildi
- Tüm hardcoded renkler ve spacing değerleri token'lara çevrildi
- Search input placeholder: `Colors.textMuted`
- Error state icon rengi: `Colors.danger`

---

### 4. LoginScreen — theme.ts Geçişi + MinTapTarget

**Dosya:** `mobile/src/screens/auth/LoginScreen.tsx`

**Değişiklikler:**
- `Colors, Typography, Spacing, Radius, MinTapTarget` import edildi
- Tüm hardcoded değerler token'lara çevrildi
- `inputRow` min height: `MinTapTarget`
- `showBtn` (şifre göster/gizle): `minWidth/minHeight: MinTapTarget` — küçük ikon butonu için WCAG AA uyumu
- `btn` (Giriş Yap): `minHeight: MinTapTarget`
- `googleBtn`: `minHeight: MinTapTarget`

---

### 5. RegisterScreen — theme.ts Geçişi + Error Box

**Dosya:** `mobile/src/screens/auth/RegisterScreen.tsx`

**Değişiklikler:**
- `Colors, Typography, Spacing, Radius, MinTapTarget` import edildi
- `Ionicons` import edildi
- Hata mesajı: düz `<Text>` → icon'lu error box (LoginScreen ile tutarlı)
  ```tsx
  <View style={styles.errorBox}>
    <Ionicons name="alert-circle" size={18} color={Colors.danger} />
    <Text style={styles.error}>{error}</Text>
  </View>
  ```
- Tüm hardcoded renkler token'lara çevrildi
- `input / btn` min height: `MinTapTarget`
- placeholder renkleri: `Colors.textMuted`

---

## Tasarım Kararları

### Unread Bildirim Sol Border (BU2 Çözümü)
Okunmamış bildirim satırları için `borderLeftWidth: 4` + `borderLeftColor: Colors.primary`
kullanıldı. `overflow: "hidden"` container'da zorunlu, aksi halde sol border dışarı taşar.
Bu pattern FlatList performansını etkilemez çünkü item bazlı koşullu stil.

### Auth Error Box Tutarlılığı
LoginScreen ve RegisterScreen artık aynı error box pattern'ini kullanıyor:
kırmızı arka plan + alert-circle icon + mesaj metni. Kullanıcı her iki ekranda
aynı error deneyimini görür.

### MinTapTarget Auth Ekranlarında
Şifre görünürlük toggle butonu (22px icon) küçük görünse de `minWidth/minHeight: 44`
ile dokunma alanı genişletildi — görsel boyutu değişmez, dokunma alanı artar.

---

## Açık UX Sorunları (Öncelikli)

| ID | Ekran | Sorun | Öncelik |
|----|-------|-------|---------|
| BU1 | ProfileScreen avatar | URL modal var ama overlay + loading state eksik | P2 |
| - | NotificationsScreen | `createdAt` ISO string formatlanmıyor (ham tarih gösteriliyor) | P3 |
| - | HomeScreen | Header'da logout butonu var (ProfileScreen'de de var, tekrar) | P3 |
| - | ForumTopicDetailScreen | Yoruma giderken doğrudan topic'e yönlendirilmiyor, sadece Forum tab'ına | P2 |
