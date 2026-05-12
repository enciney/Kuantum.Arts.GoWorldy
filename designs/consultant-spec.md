# Danışman Listesi & Profil Ekranı — UX Spec (RU4)

**Tarih**: 2026-05-12  
**Öncelik**: P2  
**Backend**: `GET /api/users/consultants`, `GET /api/users/consultants/:id` (R5 — mevcut)

---

## Genel Akış

Danışman listesi HomeScreen'den veya ayrı bir tab/section'dan erişilebilir. MVP'de yeni bir ekran olarak navigation stack'e eklenir.  
Giriş noktası önerileri:
- HomeScreen'de "Danışman Bul →" kartı (premium banner'ın yanına)
- Veya Forum/Profile tab altında erişilebilir bir link

---

## Ekran 1 — Danışman Listesi

```
┌─────────────────────────────────────────────────────┐
│ ← [Geri]        Danışmanlar                        │  ← Header
├─────────────────────────────────────────────────────┤
│                                                     │
│ ┌─────────────────────────────────────────────────┐ │
│ │ [Avatar]  Ahmet Yılmaz            🇺🇸 Amerika   │ │
│ │           Danışman                              │ │
│ │           "Göç sürecinizde yanınızdayım..."     │ │
│ │                               [Profili Gör →]  │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ ┌─────────────────────────────────────────────────┐ │
│ │ [Avatar]  Sara Demir              🇩🇪 Almanya   │ │
│ │           Danışman                              │ │
│ │           "Almanya vizesi konusunda uzmanım..." │ │
│ │                               [Profili Gör →]  │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Header
- `← Geri` butonu (`chevron-back`, `Colors.primary`, `MinTapTarget`)
- Başlık: "Danışmanlar" (`Typography.h2`, `Colors.textPrimary`)
- `backgroundColor: Colors.surface`, `borderBottomWidth: 1`, `borderBottomColor: Colors.border`

### ConsultantCard Bileşeni

```
[Avatar 56×56]   [displayName  (Typography.body, bold)]   [flag + targetCountry]
                 [userType badge: "Danışman"]
                 [bio — max 2 satır, numberOfLines={2}]
                                                          [Profili Gör →]
```

- Kart: `backgroundColor: Colors.surface`, `borderRadius: Radius.lg`, `borderWidth: 1`, `borderColor: Colors.border`, `padding: Spacing.md`, `marginBottom: Spacing.sm`
- **Avatar**: 56×56 daire, `backgroundColor: Colors.primary`, initials fallback (aynı pattern ProfileScreen)
- **displayName**: `Typography.body`, `fontWeight: "600"`, `Colors.textPrimary`
- **userType badge**: küçük chip — `Colors.secondary` arka plan (`Colors.secondaryLight`), "Danışman" metni (`Colors.secondary`, `fontWeight: "600"`, `Typography.small`)
- **Uzmanlık ülkesi**: flag emoji + ülke adı (`Typography.caption`, `Colors.textMuted`) — `targetCountryId`'ye göre gösterilir
- **Bio**: `Typography.caption`, `Colors.textSecondary`, `numberOfLines={2}`, `lineHeight: 18`
- **Profili Gör →** butonu: `Colors.primary`, `Typography.label`, sağ kenarda, `activeOpacity={0.7}`
- Tüm kart tıklanabilir: `TouchableOpacity activeOpacity={0.75}` → Danışman Profil ekranına git

### Boş State
```
👤
Henüz danışman bulunmuyor.
Daha sonra tekrar kontrol edin.
```
- İkon: `"person-outline"`, size 48, `Colors.textMuted`

### Loading State
- Skeleton cards (3 adet) — `Colors.border` rengi placeholder bloklar
- MVP'de `ActivityIndicator` yeterli

---

## Ekran 2 — Danışman Profil Detayı

```
┌─────────────────────────────────────────────────────┐
│ ← [Geri]                                           │
├─────────────────────────────────────────────────────┤
│                                                     │
│              [Avatar 88×88]                        │  ← büyük avatar
│              Ahmet Yılmaz                          │
│              [Danışman] [🇺🇸 Amerika]              │
│                                                     │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Hakkında                                          │  ← section başlığı
│  "Uzun bio metni..."                               │
│                                                     │
├─────────────────────────────────────────────────────┤
│                                                     │
│  [✉️  E-posta ile İletişim]                         │  ← primary CTA, full width
│  [💬  Forum'da Mesaj Gönder]                        │  ← outlined CTA (opsiyonel, P3)
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Profil Kartı (üst bölüm)
- `backgroundColor: Colors.surface`, full width
- Avatar: 88×88, aynı ProfileScreen pattern
- displayName: `Typography.h1`, `Colors.textPrimary`
- Badge row: userType chip + ülke chip (ProfileScreen badge stili)

### Bio Bölümü
- Section başlığı: `Typography.body`, `fontWeight: "600"`, `Colors.textPrimary`
- Bio metni: `Typography.body`, `Colors.textSecondary`, `lineHeight: 24`
- `backgroundColor: Colors.surface`, `borderRadius: Radius.lg`, `padding: Spacing.md`

### İletişim Butonu
- **"E-posta ile İletişim"** (birincil CTA):
  - `backgroundColor: Colors.primary`, `borderRadius: Radius.md`, full width
  - `Ionicons "mail-outline"` ikon + metin yan yana
  - Tıklanınca: `Linking.openURL("mailto:" + consultant.email)`
  - `minHeight: MinTapTarget`
- **"Forum'da Görüntüle"** (ikincil, P3):
  - Outlined buton (`borderColor: Colors.primary`, `color: Colors.primary`)
  - Danışmanın forum konularına filtreli erişim (gelecek özellik)

---

## Eksik Backend Alanı

`GET /api/users/consultants` response'unda `targetCountryId` ve `targetCountryName` (veya `country.name`) alanları gerekiyor. Developer'ın eklemesi gerekebilir:
- Mevcut: `{ id, displayName, bio, avatarUrl, role, userType, email }`
- Eksik: `targetCountryId, targetCountryName` — ülke seçimi onboarding'den geliyor

---

## Token Referansı
```
Colors.primary      → buton bg, geri ikon, tıklanabilir link
Colors.secondary    → danışman badge bg
Colors.secondaryLight → danışman badge bg (light)
Colors.textPrimary  → ad, başlık
Colors.textSecondary → bio
Colors.textMuted    → ülke, empty state
Colors.border       → kart border, separator
Typography.h1       → profil adı
Typography.h2       → liste başlığı
Typography.body     → kart adı, bio bölüm başlığı
Typography.caption  → bio (listede), ülke etiketi
Typography.small    → badge metni
Spacing.md          → kart padding, buton padding
Spacing.sm          → aralar
Radius.lg           → kart, avatar
Radius.full         → badge, avatar
MinTapTarget        → butonlar, kart
```

---

## Developer Notları
- `api.users.consultants()` mevcut (`mobile/src/services/api.ts`)
- `api.users.consultant(id)` mevcut
- Yeni ekranlar: `ConsultantListScreen.tsx` + `ConsultantProfileScreen.tsx`
- Navigation: `AppNavigator`'da yeni stack veya HomeStack'e ek screen olarak eklenebilir
- Email alanı: danışman profilinde gizlilik kontrolü gerekebilir (privacy policy) — MVP'de açık bırakılabilir
