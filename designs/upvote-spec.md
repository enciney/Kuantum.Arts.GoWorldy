# Forum Upvote Butonu — UX Spec (RU2)

**Tarih**: 2026-05-12  
**Öncelik**: P1  
**Backend**: `POST /api/forum/topics/:id/upvote` toggle (R2 — mevcut), `ForumTopic.upvotes?: number`

---

## Konum

`ForumTopicsScreen`'deki her `TopicRow` satırının **sağ köşesi** — yorum sayısı ikonunun yanına eklenir.

---

## TopicRow Düzeni (güncellenmiş)

```
┌──────────────────────────────────────────────────────────┐
│ 📌 [Başlık...]                           [↑ 12] [💬 4]  │
│    avatar  yazar · 3 saat önce                           │
└──────────────────────────────────────────────────────────┘
```

---

## Upvote Butonu Bileşeni

### Görsel Durumlar

| Durum | İkon | İkon Rengi | Sayı Rengi | Arka Plan |
|-------|------|-----------|------------|-----------|
| Upvote yok | `arrow-up-outline` | `Colors.textMuted` | `Colors.textMuted` | şeffaf |
| Upvote atıldı | `arrow-up` (dolu) | `Colors.primary` | `Colors.primary` | `Colors.primaryLight` |

### Boyut ve Spacing
- Minimum tap target: `44×44pt` (`hitSlop={{ top: 8, bottom: 8, left: 12, right: 12 }}` kullan)
- İkon size: 18px
- Sayı font: `Typography.small`, `fontWeight: "600"`
- Gap (ikon ↔ sayı): `Spacing.xs` (4px)
- `borderRadius: Radius.full`
- Padding: `paddingHorizontal: Spacing.sm`, `paddingVertical: Spacing.xs`

### Animasyon (MVP opsiyonel, P3)
- Tıklanınca: `scale 1.0 → 1.3 → 1.0` (150ms ease-out) — `Animated.sequence`
- Renk geçişi: anlık (animasyon zorlaştırıyor ise animasyon atlanabilir)

---

## Etkileşim Akışı

1. Kullanıcı `↑` butonuna basar
2. **Optimistic update**: `upvotes +1`, ikon dolu, renk `Colors.primary`
3. `api.forum.upvoteTopic(topicId, token)` çağrısı (toggle: var ise sil, yok ise ekle)
4. Hata durumunda: eski state'e geri dön, `Toast/Alert` göster

### Auth Kontrolü
- Kullanıcı giriş yapmamışsa: `Alert.alert("Giriş Gerekli", "Upvote vermek için giriş yapmanız gerekiyor.")`
- Token var ise direkt upvote

---

## Topic List Sıralaması (Popüler Filtresi)
- Mevcut "Popüler" filtresi `commentCount`'a göre sıralıyor
- Upvote sonrası "Popüler" filtresi `upvotes` sayısına göre de sıralayabilir
- MVP'de `commentCount` önceliğini koru; upvote ikincil kriter olabilir

---

## Token Referansı
```
Colors.primary     → aktif upvote ikon + sayı rengi
Colors.primaryLight → aktif upvote arka plan
Colors.textMuted   → pasif upvote ikon + sayı rengi
Typography.small   → upvote sayısı font
Spacing.xs         → ikon-sayı gap, paddingVertical
Spacing.sm         → paddingHorizontal
Radius.full        → buton border radius
MinTapTarget       → hitSlop ile karşılanır
```

---

## Developer Notları
- `api.forum.upvoteTopic(topicId, token)` mevcut (`mobile/src/services/api.ts`)
- `TopicRow` bileşenine `upvotes: number` ve `hasUpvoted: boolean` prop'ları eklenecek
- `hasUpvoted` ilk yüklemede `undefined` olabilir (ilk sprint'te yoksa false default)
- `ForumTopicsScreen`'de her topic için `hasUpvoted` state'i array veya Map olarak tutulacak
- Backend response'da `userHasUpvoted: boolean` alanı eklenirse client-side hesaplamaya gerek kalmaz
