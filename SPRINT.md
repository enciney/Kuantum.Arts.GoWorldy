# GoWorldy — Sprint Board

> Tek aktif sprint + backlog. Tamamlanan sprintler `agents/project-manager/memory.md`'de.
> Son güncelleme: 2026-05-17

---

## Definition of Done (DoD) — ZORUNLU, TÜM TİCKETLAR İÇİN

Her ticket aşağıdaki adımların **tamamı** gerçekleşmeden "done" sayılmaz:

1. **Developer** kodu yazar / değiştirir
2. **Developer** ticket'ı Tester'a teslim eder (ne değişti, hangi dosyalar, satır no'lar)
3. **Tester** değişen kod için yeni testler yazar veya mevcut testleri günceller
4. **Tester** repo kökünden `.\run-tests.ps1` çalıştırır → API tsc + API tests + Mobile tsc + Mobile tests + Admin tests
5. Tüm testler geçerse → ticket ✅ **done**
6. Herhangi bir test başarısız → Developer düzeltir, Tester tekrar çalıştırır (1. adıma dön)

> Bu akış kısaltılamaz. "Kod çalışıyor görünüyor" geçerli bir teslim değildir.

---

## AKTİF SPRINT — Spike Bulguları P0+P1 Düzeltme

**Hedef:** Tester spike'ının P0 ve P1 bulgularını çöz — gerçek kullanıcıyı bloke eden her şey.
**Sahip:** Developer → Tester

| Kod | Öncelik | Ekran | Sorun | Tip | Dosya:Satır | Durum |
|-----|---------|-------|-------|-----|-------------|-------|
| F-01 | **P0** | NotificationsScreen | Bildirime tıklayınca forum açılmıyor — `navigate("Forum")` HomeStack context'inde çalışmaz, `navigation.getParent()?.navigate("Forum",...)` olmalı | NAV | `NotificationsScreen.tsx:95` | ✅ |
| F-02 | **P1** | ProfileScreen | "Bildirim Ayarları" butonu çalışmayabilir — nested tab navigation context yanlış | NAV | `ProfileScreen.tsx:327` | ✅ |
| F-03 | **P1** | PremiumScreen | Fiyatlar hardcoded (250 TL, 50 TL...) — `api.payment.getPackages()` kullanılmalı | HARDCODE | `PremiumScreen.tsx:38-63,200` | ✅ |
| F-04 | **P1** | PremiumScreen | Ürün ID'leri hardcoded, checkout'ta gerçek priceId iletilmiyor | HARDCODE | `PremiumScreen.tsx:40-60,110-116` | ✅ |
| F-05 | **P1** | MyTopicsScreen | Konu satırları tıklanamıyor — `<View>` yerine `<TouchableOpacity>` + navigation | DUMMY | `MyTopicsScreen.tsx:121-148` | ✅ |
| F-06 | **P1** | MyCommentsScreen | Yorum satırları tıklanamıyor — `<View>` yerine `<TouchableOpacity>` + navigation | DUMMY | `MyCommentsScreen.tsx:103-121` | ✅ |

> ✅ Sprint tamamlandı — 2026-05-17. DoD: tsc sıfır hata, 85 API testi + 98 mobile testi geçti (22 yeni test dahil).

---

## BACKLOG

Öncelik sırasına göre bir sonraki sprinte alınacak. Sıralama stakeholder ile birlikte yapılır.

### P2 — Hata Yönetimi & UX

| Kod | Ekran | Sorun | Dosya:Satır |
|-----|-------|-------|-------------|
| F-07 | NotificationsScreen | Okundu hataları sessizce loglanıyor, kullanıcıya mesaj yok | `NotificationsScreen.tsx:82,89` |
| F-08 | NotificationsScreen | Bildirim yükleme hataları yutulmuş, boş liste gösteriliyor | `NotificationsScreen.tsx:57-59,66-68` |
| F-09 | HomeScreen | API hataları yutulmuş, kullanıcıya uyarı yok | `HomeScreen.tsx:46-58` |
| F-12 | ForumScreen | Deep link ile konu açılınca geri gidince ülke listesine düşüyor | `ForumScreen.tsx:69-79,133-143` |
| F-15 | CreateTopicScreen | Konu içerik alanı (body) yok, API'ye gönderilmiyor | `CreateTopicScreen.tsx:69,117-125` |
| F-16 | ForumTopicDetailScreen | Upvote sayısı detay ekranında her zaman 0 başlıyor | `ForumTopicDetailScreen.tsx:35` |

### P3 — Minor

| Kod | Ekran | Sorun | Dosya:Satır |
|-----|-------|-------|-------------|
| F-10 | PremiumScreen | Kredi yüklenemezse sessizce `—` gösteriyor | `PremiumScreen.tsx:77-79` |
| F-11 | GuideScreen | Hata mesajı hangi API'nin başarısız olduğunu söylemiyor | `GuideScreen.tsx:106-118` |
| F-13 | HomeScreen | Premium banner'da "250 TL" hardcoded | `HomeScreen.tsx:231` |
| F-14 | ProfileScreen | Avatar seçimi sırasında loading spinner gösterilmiyor | `ProfileScreen.tsx:49,82,103` |
| F-17 | PrivacyScreen | Telefon paylaşım API'sine sayı gönderiliyor, boolean bekleniyor olabilir | `PrivacyScreen.tsx:70` |

### API & Backend

| Kod | Öncelik | Görev |
|-----|---------|-------|
| S1-01 | P0 | GET /me response'unda passwordHash dönmemeli |
| S1-02 | P0 | Kredi atomikliği — başarısız işlemde kredi düşmemeli (DB transaction) |
| S1-03 | P0 | Yetersiz kredide 402 dönmeli |
| S1-06 | P0 | Admin endpoint'lerine normal kullanıcı 403 dönmeli |
| S1-07 | P0 | Süresi dolmuş JWT 401 → mobile LoginScreen |
| S2-01 | P1 | Reset password token doğrulamaları |
| S2-02 | P1 | GET /forum/topics sadece approved konular |
| S2-04 | P1 | Bildirim güvenliği — başka kullanıcının bildirimini okuma 403 |
| S2-05 | P1 | Stripe webhook — geçerli imzada isPremium güncellenmeli |
| S2-06 | P1 | Guide progress — aynı stepId üzerine yaz, farklı ülkede sıfırla |
| S3-01 | P2 | Oturum kalıcılığı — AsyncStorage token restore |
| S3-02 | P2 | PATCH /me → role güncelleme whitelist |
| S4-07 | P0 | userFeatures — tekrar satın alma engeli |
| S5-02 | P1 | Premium süresi dolunca isPremium=false |
| S5-06 | P0 | **BLOKAJ**: Stripe Price ID'leri (stakeholder) |
| S5-07 | P0 | **BLOKAJ**: SendGrid API Key (stakeholder) |

### Özellikler (Feature Backlog)

| Kod | Öncelik | Görev |
|-----|---------|-------|
| S3-04 | P2 | Tab bar bildirim rozeti (9+ format) |
| S3-06 | P2 | Forum pagination / infinite scroll |
| S5-04 | P1 | Onboarding flow |
| S5-05 | P2 | Forum full-text arama |
| RU4 | — | Danışman marketplace |
| — | — | Ülke karşılaştırma aracı |
| — | — | Push notifications (FCM vs Expo kararı bekleniyor) |

---

## TAMAMLANAN (özet)

| Sprint | Kapsam | Tarih |
|--------|--------|-------|
| Phase 1 | Auth + Navigation | 2026-05-10 |
| Phase 2 | Guide (Rehberim) | 2026-05-10 |
| Phase 3 | Forum | 2026-05-10 |
| Phase 4 | Profile + Notifications | 2026-05-11 |
| Phase 5 | Premium + Payments backend | 2026-05-11 |
| Phase 6 | Admin Dashboard (MVP) | 2026-05-11 |
| Sprint 1–8 | Bug fix'ler, UX polish, CORS, avatar, stats | 2026-05-11–12 |
| Sprint 9 | Bildirim sistemi (SSE, subscriptions, badge) | 2026-05-14 |
