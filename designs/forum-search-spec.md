# Forum Arama Ekranı — UX Spec (RU1)

**Tarih**: 2026-05-12  
**Öncelik**: P1  
**Backend**: `GET /api/forum/search?q=...&countryId=...` (R1 — mevcut)

---

## Genel Akış

Forum ekranında header'daki arama ikonu (`search-outline`) ya da ForumScreen üst bölümündeki arama çubuğuna dokunulduğunda bu ekran açılır.  
Açılış animasyonu: slide-in (sağdan) veya fade — navigation stack içinde açılır.

---

## Ekran Yapısı

```
┌─────────────────────────────────────────────────────┐
│ ← [Geri]   [Arama alanı...............]  [Temizle] │  ← Header
├─────────────────────────────────────────────────────┤
│ [Tüm Ülkeler ▾] [Kategori ▾]                        │  ← Filtre chips (opsiyonel)
├─────────────────────────────────────────────────────┤
│                                                     │
│   SONUÇLAR (2 konu bulundu)                        │  ← Section header (sonuç sayısı)
│                                                     │
│ ┌─────────────────────────────────────────────────┐ │
│ │ [Başlık ...]                                    │ │
│ │ 🇺🇸 ABD > Vize & Pasaport   ·  3 saat önce     │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ ┌─────────────────────────────────────────────────┐ │
│ │ [Başlık ...]                                    │ │
│ │ 🇩🇪 Almanya > Çalışma İzni   ·  2 gün önce     │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## Bileşenler

### Header / Arama Çubuğu
- `TouchableOpacity` ← geri butonu (`chevron-back`, `Colors.primary`, `MinTapTarget`)
- `TextInput`:
  - `autoFocus: true` — ekran açılınca klavye otomatik açılır
  - `placeholder: "Forum'da ara..."`
  - `placeholderTextColor: Colors.textMuted`
  - `returnKeyType: "search"`
  - `clearButtonMode: "while-editing"` (iOS)
- Sağda `✕` temizle butonu: `q.length > 0` iken görünür, `onPress → setQ("")`
- `backgroundColor: Colors.surface`, `borderBottomWidth: 1`, `borderBottomColor: Colors.border`

### Filtre Chips (opsiyonel, MVP'de ülke filtresi yeterli)
- Yatay kaydırılabilir (`ScrollView horizontal`)
- "Tüm Ülkeler" default chip (seçili = `Colors.primary` bg)
- Her ülke bir chip — `flag + name`, tıklanınca aktif
- `borderRadius: Radius.full`, `paddingHorizontal: Spacing.sm`, `paddingVertical: 4`

### Arama Durumları

**Boş (q === ""):**
```
🔍
Forum'da ne arıyorsun?
```
- `Ionicons "search"` size 48, `Colors.textMuted`
- Alt metin `Colors.textMuted`, `Typography.body`

**Yükleniyor (debounced 300ms sonra):**
- `ActivityIndicator color={Colors.primary}` — sonuç listesinin yerinde
- Skeleton gösterimi opsiyonel (MVP'de spinner yeterli)

**Sonuç var:**
Section header: `"X konu bulundu"` — `Typography.caption`, `Colors.textSecondary`
Her `SearchResultRow`:
- **Başlık**: `Typography.body`, `fontWeight: "600"`, `Colors.textPrimary`, `numberOfLines={2}`
- **Breadcrumb**: `flag emoji + countryName + " > " + categoryName` — `Typography.caption`, `Colors.textMuted`
- **Tarih**: `formatRelativeTime(createdAt)` — sağ kenarda, `Typography.caption`, `Colors.textMuted`
- Tıklanınca: ForumScreen'e navigate (`openTopicId` param)
- `activeOpacity={0.7}`, `borderBottomWidth: 1`, `borderBottomColor: Colors.border`

**Sonuç yok:**
```
🔍  "göç vizesi" için sonuç bulunamadı.
```
- İkon size 48, `Colors.textMuted`
- Alt metin: `"Farklı anahtar kelimeler deneyin."`

---

## Etkileşim Detayları
- Arama debounce: 300ms (her keystroke'ta API'ye gitme)
- Minimum karakter: 2 (2 karakterden az ise API çağrısı yapma, empty state göster)
- Sonuç tıklaması → `navigation.navigate("Forum", { openTopicId, openTopicTitle })` (mevcut param desteği var)
- Geri tuşu → keyboard dismiss + navigation.goBack()

---

## Token Referansı
```
Colors.primary    → arama çubuğu odak border, aktif chip bg
Colors.textMuted  → placeholder, empty state ikon
Colors.border     → row separator, header bottom border
Colors.surface    → header bg, card bg
Typography.body   → başlık
Typography.caption → breadcrumb, tarih, section header
Spacing.md        → row padding
Spacing.sm        → chip padding vertical
MinTapTarget      → geri butonu min boyut
```

---

## Developer Notları
- `api.forum.search(q, token, countryId?)` metodu mevcut (`mobile/src/services/api.ts`)
- `SearchResultRow` yeni bileşen — `ForumTopicsScreen.TopicRow` ile benzer yapı
- Yeni bir `ForumSearchScreen.tsx` oluşturulacak veya `ForumScreen` içine ek view olarak eklenir
- Navigation: `AppNavigator` içinde HomeStack veya ForumStack'e eklenebilir
