# Onboarding Flow — UX Spec (RU3)

**Tarih**: 2026-05-12  
**Öncelik**: P2  
**Backend**: `PATCH /api/users/me` → `onboardingCompleted: boolean`, `targetCountryId: string` (R4 — mevcut)

---

## Genel Akış

Yeni kayıt sonrası (`RegisterScreen` → API başarılı) kullanıcı otomatik olarak `OnboardingScreen`'e yönlendirilir.  
`AuthContext`'te `user.onboardingCompleted === false` ise `AppNavigator` MainTabs yerine `OnboardingScreen` gösterir.

---

## Adım Yapısı

```
Adım 1: Hedef Ülke Seç
Adım 2: Zaman Dilimi
Adım 3: Başlayalım!
```

Her adımda:
- Üstte ilerleme çubuğu (1/3, 2/3, 3/3)
- Sağ üstte "Atla" linki
- Altta "İleri →" CTA butonu

---

## Adım 1 — Nereye Gitmek İstiyorsun?

```
┌─────────────────────────────────────────────────────┐
│ ● ○ ○                                  [Atla]      │  ← progress + skip
│                                                     │
│   🌍                                                │  ← ikon, size 64, Colors.primary
│                                                     │
│   Nereye gitmek istiyorsun?                        │  ← H1
│   Hedef ülkeni seç, sana özel rehber hazırlayalım. │  ← Body, Colors.textSecondary
│                                                     │
│   ┌──────────────────────────────────────────────┐ │
│   │ 🇺🇸  Amerika Birleşik Devletleri              │ │  ← seçili ülke (primary border)
│   └──────────────────────────────────────────────┘ │
│   ┌──────────────────────────────────────────────┐ │
│   │ 🇩🇪  Almanya                                  │ │
│   └──────────────────────────────────────────────┘ │
│   ┌──────────────────────────────────────────────┐ │
│   │ 🇨🇦  Kanada                                   │ │
│   └──────────────────────────────────────────────┘ │
│   ... (FlatList, 8 ülke)                           │
│                                                     │
│   [İleri →]                          (disabled)    │  ← seçim yapılmadan disabled
└─────────────────────────────────────────────────────┘
```

### Ülke Seçim Kartı
- `backgroundColor: Colors.surface`, `borderRadius: Radius.md`, `borderWidth: 1.5`
- Seçilmemiş: `borderColor: Colors.border`
- Seçili: `borderColor: Colors.primary`, `backgroundColor: Colors.primaryLight`
- İçerik: flag emoji (20px) + ülke adı (`Typography.body`, `Colors.textPrimary`)
- `minHeight: MinTapTarget`, `paddingHorizontal: Spacing.md`, `activeOpacity: 0.7`
- API'dan `api.forum.getCountries()` ile yüklenir (seed'de 8 ülke mevcut)

---

## Adım 2 — Ne Zaman?

```
┌─────────────────────────────────────────────────────┐
│ ● ● ○                                  [Atla]      │
│                                                     │
│   📅                                                │  ← ikon, Colors.secondary
│                                                     │
│   Ne zaman göç etmeyi planlıyorsun?                │
│   Yaklaşık bir zaman dilimi seç.                   │
│                                                     │
│   ┌──────────────────────────────────────────────┐ │
│   │ 🚀  6 aydan kısa süre içinde                 │ │
│   └──────────────────────────────────────────────┘ │
│   ┌──────────────────────────────────────────────┐ │
│   │ 📆  6–12 ay içinde                           │ │
│   └──────────────────────────────────────────────┘ │
│   ┌──────────────────────────────────────────────┐ │
│   │ 🗓️  1–2 yıl içinde                           │ │
│   └──────────────────────────────────────────────┘ │
│   ┌──────────────────────────────────────────────┐ │
│   │ 💭  Henüz emin değilim                       │ │
│   └──────────────────────────────────────────────┘ │
│                                                     │
│   [İleri →]                                        │
└─────────────────────────────────────────────────────┘
```

- Aynı seçim kartı stili
- Seçim `migrationTimeline: "under6m" | "6to12m" | "1to2y" | "undecided"` olarak `PATCH /users/me`'ye gönderilir (backend'e yeni alan olarak eklenecek — R4 genişlemesi)
- MVP'de seçim sadece local state'te tutulabilir (adım 3'te özete gösterilir), API çağrısı adım 3'te yapılır

---

## Adım 3 — Başlayalım!

```
┌─────────────────────────────────────────────────────┐
│ ● ● ●                                  [Atla]      │
│                                                     │
│   🎉                                                │  ← ikon, Colors.secondary
│                                                     │
│   Harika! Hazırsın.                                │  ← H1
│                                                     │
│   ┌──────────────────────────────────────────────┐ │
│   │ Hedef ülke:  🇺🇸 Amerika Birleşik Devletleri  │ │  ← özet card
│   │ Planlanan:   6 aydan kısa süre içinde        │ │
│   └──────────────────────────────────────────────┘ │
│                                                     │
│   GoWorldy sana özel rehber adımlarını hazırladı. │  ← Body, Colors.textSecondary
│   Şimdi başlayabilirsin!                           │
│                                                     │
│   [Rehberime Git →]                                │  ← primary CTA, full width
└─────────────────────────────────────────────────────┘
```

- "Rehberime Git" basılınca:
  1. `PATCH /api/users/me { targetCountryId, onboardingCompleted: true }` çağrısı
  2. `AuthContext`'teki `user` güncellenir (onboardingCompleted: true)
  3. `AppNavigator` MainTabs'a geçer (Guide tab aktif)
- Loading sırasında buton içinde `ActivityIndicator`

---

## İlerleme Göstergesi

- 3 nokta veya yatay çubuk — üst kısımda
- Dolu (`Colors.primary`) + boş (`Colors.border`), `borderRadius: Radius.full`
- Boyut: 8px yükseklik, eşit genişlik (flex: 1, gap: Spacing.xs)

---

## "Atla" Davranışı

- Her adımda sağ üstte "Atla" linki (`Typography.label`, `Colors.textSecondary`)
- Tıklanınca: `PATCH /users/me { onboardingCompleted: true }` → MainTabs'a geç
- Seçimler kaybolur (targetCountryId kayıt edilmemiş olabilir)

---

## Navigation Entegrasyonu

`AppNavigator.tsx`'te:
```typescript
// user giriş yapmış ama onboarding tamamlanmamış
if (user && !user.onboardingCompleted) return <OnboardingScreen />;
if (user) return <MainTabs />;
return <AuthNavigator />;
```

`OnboardingScreen` stack navigator'a eklemeden standalone render edilir (registration akışının parçası olduğu için).

---

## Token Referansı
```
Colors.primary     → ikon (1. adım), seçili kart border + bg, ilerleme dolgu
Colors.secondary   → ikon (3. adım), CTA opsiyonel
Colors.primaryLight → seçili kart arka plan
Colors.border      → seçilmemiş kart border, ilerleme boş
Typography.h1      → adım başlığı
Typography.body    → açıklama, ülke/timeline adı
Typography.label   → "Atla" linki
MinTapTarget       → tüm seçim kartları
Spacing.md         → yatay padding
Spacing.lg         → dikey padding, bölümler arası
Radius.md          → kart borderRadius
```
