# GoWorldy — Backlog Refinement & Test Plan

> **Tarih:** 2026-05-27
> **Kaynak:** `feature_sets.md` v2.0 — 130 feature taraması
> **Amaç:** Developer + Tester agent'ları aynı checklist üzerinden çalışsın. Her satır kim ne yapar, hangi delil aranır netleşmiş olsun.

---

## 📊 1. Mevcut Durum Özeti

### Genel Oran (feature_sets.md son istatistik)

| Domain | Toplam | ✅ Tam | ⚠️ Kısmi | ❌ Eksik | 🔒 Stakeholder |
|--------|:-:|:-:|:-:|:-:|:-:|
| AUTH | 17 | 9 | 1 | 6 | 1 |
| USR  | 12 | 6 | 1 | 5 | 0 |
| FRM  | 24 | 11 | 2 | 11 | 0 |
| PRM  | 15 | 9 | 0 | 6 | 0 |
| PAY  | 8  | 3 | 0 | 3 | 2 |
| CRD  | 7  | 3 | 1 | 3 | 0 |
| NTF  | 15 | 9 | 2 | 3 | 1 |
| ADM  | 12 | 9 | 0 | 3 | 0 |
| MOD  | 6  | 0 | 0 | 6 | 0 |
| GDE  | 8  | 3 | 2 | 3 | 0 |
| SRC  | 4  | 2 | 0 | 1 (🚫 1) | 0 |
| SEC  | 8  | 5 | 1 | 2 | 0 |
| **TOPLAM** | **136** | **~69** | **~10** | **~52** | **~4** |

**Tahmini durum:** %51 tam · %7 kısmi · %38 eksik · %3 stakeholder bekliyor.

---

## 🚨 2. P0 — Bu Sprintte Mutlaka Bitmeli (Blocker)

Bunlar canlı kullanıcının raporladığı veya MVP'yi kıran şeyler.

### P0-1 · PRM-EXP-001: Premium otomatik kapanma (lazy check + cron)

- **Sorun:** `premiumUntil < now` olan kullanıcı hala `isPremium = true` görünüyor. Cron yok, lazy check yok.
- **Etki:** Süresi dolmuş premium üyeler ücretsiz konu açmaya devam edebilir, gelir kaybı.
- **Developer Görevi:**
  - [ ] `MongoUserRepository.findById()` içine lazy expiry check ekle: `premiumUntil < now` ise `$set: { isPremium: false }`
  - [ ] `api/src/jobs/expirePremium.ts` cron job (gece 00:00) — yedekleme katmanı
  - [ ] `app.ts` startup'ta cron başlatılsın
- **Tester Görevi:**
  - [ ] Integration: `premiumUntil = yesterday` user yarat → `findById` çağır → `isPremium = false` döner
  - [ ] Integration: cron'u manuel tetikle → ≥1 user expired olur
  - [ ] Integration: aktif premium (`premiumUntil > now`) lazy check'te değişmez

### P0-2 · NTF-INA-002 + NTF-INA-003: Real-time badge

- **Sorun:** Yeni bildirim gelince badge yanmıyor, okundu işaretlenince düşmüyor.
- **Etki:** Kullanıcı bildirim aldığını anlamıyor.
- **Developer Görevi:**
  - [ ] Mobile: `NotificationsContext` aç → `GET /notifications/unread-count` her 30s polling
  - [ ] Badge state'i `TabNavigator` seviyesinde tut → tüm tab'larda görünür
  - [ ] `PATCH /notifications/:id/read` sonrası local state'i optimistic güncelle
- **Tester Görevi:**
  - [ ] E2E: A user'ı B'ye yorum yazar → B'nin tab bar badge'i 30s içinde +1 olur
  - [ ] E2E: B bildirime tıklar → badge anında -1 olur, bildirim listede `read=true`
  - [ ] Unit: polling cleanup (`useEffect` return) memory leak yapmaz

### P0-3 · SEC-RTL-001 + SEC-RTL-002: Rate limit

- **Sorun:** `/auth/login` ve `/forum/topics` POST'a sınırsız çağrı yapılabilir. Brute-force + spam riski.
- **Developer Görevi:**
  - [ ] `express-rate-limit` ekle
  - [ ] `/auth/login` `/auth/register` `/auth/forgot-password` → IP başına 15 dakikada 5
  - [ ] `/forum/topics POST` `/forum/topics/:id/comments POST` → user başına dakikada 3
- **Tester Görevi:**
  - [ ] Integration: 6 ardışık login → 6.sı 429 döner, mesajı doğru
  - [ ] Integration: 4 ardışık topic create → 4.sı 429 döner
  - [ ] Integration: rate limit penceresi geçtikten sonra (TTL test'i mock'lanmış) tekrar 200

### P0-4 · AUTH-REG-002: E-posta format validasyonu (FE + BE)

- **Sorun:** "abc" veya "test@" kayıt olabiliyor.
- **Developer Görevi:**
  - [ ] Backend: Zod `z.string().email()` `/auth/register` body'sine
  - [ ] Mobile: `validateEmail()` util + RegisterScreen inline error
- **Tester Görevi:**
  - [ ] Integration: `abc` → 400 + Türkçe hata mesajı
  - [ ] Unit: `validateEmail("abc")` → error string; `validateEmail("a@b.com")` → null

### P0-5 · MOD-REP-002: Admin rapor kuyruğu UI

- **Sorun:** Backend hazır (`GET /admin/reports`) ama admin paneli ekranı yok.
- **Developer Görevi:**
  - [ ] `admin/src/pages/ReportsPage.tsx` — tablo (reporter, target, reason, status)
  - [ ] Aksiyon: "İçeriği sil" / "Reddet" / "Kullanıcıyı uyar"
- **Tester Görevi:**
  - [ ] E2E: rapor oluştur → admin paneli `/admin/reports` aç → satır gelir
  - [ ] E2E: "Reddet" tıkla → status `dismissed`, satır listeden çıkar (filter aktifse)

---

## 🟠 3. P1 — Sonraki Sprint (Önemli ama bloke değil)

### P1-1 · AUTH-PWD-004: Profil → şifre değiştir
- [ ] DEV: `POST /auth/change-password` (mevcut + yeni, bcrypt verify)
- [ ] DEV: Profil ekranına modal
- [ ] TEST: yanlış mevcut şifre → 401; doğru şifre → 200 + yeni şifre ile login
- [ ] TEST: yeni şifre < 6 karakter → 400

### P1-2 · AUTH-PWD-005: Güçlü şifre zorlaması
- [ ] DEV: `validatePasswordStrength()` util (8+ char, büyük/küçük/rakam)
- [ ] DEV: RegisterScreen + ChangePasswordModal'da güç çubuğu
- [ ] TEST: 6 test (zayıf, orta, güçlü kombinasyonları)

### P1-3 · PRM-SUB-004: Abonelik iptali
- [ ] DEV: `POST /premium/cancel` → `autoRenew=false`, premium devam eder (sürenin sonuna kadar)
- [ ] DEV: PremiumScreen'de "Aboneliği İptal Et" + onay modalı
- [ ] TEST: iptal sonrası premiumUntil değişmez, autoRenew false
- [ ] TEST: tekrar iptal → 409 (zaten iptal)

### P1-4 · AUTH-ACC-002: Hesap silme (KVKK/GDPR)
- [ ] DEV: `DELETE /users/me { password }` — şifre verify + topic/comment anonymize
- [ ] DEV: ProfileScreen → "Hesabımı Sil" modal'ı (şifre tekrar)
- [ ] TEST: yanlış şifre → 401; doğru şifre → 200, user repository'de yok, topic.authorId = "anonymous"
- [ ] TEST: silinen user JWT ile API → 401

### P1-5 · ADM-CFG-002: Pricing güncelleme (writable)
- [ ] DEV: `PATCH /admin/config/forum/pricing` — `config_overrides` koleksiyonu
- [ ] DEV: Admin panel → "Forum Pricing" sayfası
- [ ] TEST: admin değiştirince → `config.forum.createTopicCost` runtime'da değişir

### P1-6 · NTF-PSH-001: Expo push notification
- [ ] DEV: `api/src/services/push.ts` (expo-server-sdk)
- [ ] DEV: Mobile'da login sonrası `registerForPush` çağır, `user.expoPushToken` set et
- [ ] DEV: `notifyTopicSubscribers` + `notifyStaffOfPendingTopic` push da gönderir
- [ ] TEST: integration push token verify; e2e mobile ile sınırlı (Expo dev client gerekiyor)

---

## 🟡 4. P2 — MVP Sonrası

| ID | Özellik | Tahmin |
|----|---------|:-:|
| FRM-CAT-002 | Alt kategori UI (nested) | 1g |
| FRM-TPC-011 | Konu kilitleme (admin) | 0.5g |
| MOD-BAN-001/002 | Kullanıcı susturma + ban | 1g |
| MOD-DEL-001 | Soft delete UI ("kaldırıldı") | 0.5g |
| CRD-RWD-001 | Haftalık kredi ödülü cron | 0.5g |
| CRD-HST-001 | Kredi geçmişi | 1g |
| PAY-HST-001 | Ödeme geçmişi | 1g |
| USR-AVT-001 | Avatar → CDN'e taşı | 1g |
| GDE-ADM-001 | Admin rehber adımı ekleme UI | 1g |
| PRM-EXP-002 | Premium süre dolma bildirimi | 0.5g |

---

## 🧪 5. UZUN E2E TEST SENARYOLARI (Tester Agent için)

> Her senaryo birden çok feature'ı kapsar. Yeni özellikler eklendikçe veya regresyon korkusu olduğunda baştan sona koşturulur.

### TS-01 · "Sıfırdan premium üye, ilk konu, admin onayı" (kritik happy path)

**Kapsadığı feature'lar:** AUTH-REG-001, AUTH-LOG-001, USR-PRF-001, PRM-PKG-005, PRM-SUB-001, PRM-SUB-005, PAY-CHK-002, PRM-EXP-003, FRM-TPC-002, NTF-EVT-001, NTF-EVT-002, NTF-EVT-005, ADM-MOD-002, NTF-SUB-001

**Adımlar:**
1. Yeni kullanıcı (Ali) RegisterScreen → email + şifre + ad + userType=emigrant + KVKK onayı → "Kayıt Ol"
2. Kayıt sonrası anasayfada `PremiumBanner` → "Premium'a Geç" görünür
3. Ali PremiumScreen açar → autoRenew toggle ON → premium_weekly fiyatı `179 → 152.15 TL` (%15 indirim) gösterilir
4. "Aboneliği Başlat" → PaymentScreen → "Öde 152.15 TL"
5. Ödeme başarılı → `refreshUser()` tetiklenir → AuthContext.user.isPremium = true
6. PaymentScreen success → "Tamam" → anasayfaya dön
7. Banner artık "Premium Aktif 💎 — 7 gün kaldı" gösteriyor
8. Forum sekmesi → Türkiye → bir kategori → "+" FAB → CreateTopicScreen
9. Premium chip "Premium üye — ücretsiz" görünür (kırmızı/sarı kredi mesajı YOK)
10. Başlık ≥10 char + içerik → "Onayla ve Gönder"
11. POST `/forum/topics` 200 → topic.status = "pending"
12. Ali'ye in-app bildirim: "Konunuz alındı" (NTF-EVT-001)
13. Admin'e in-app bildirim: "Yeni onay bekleyen konu" (NTF-EVT-005)
14. Admin paneli açık ise SSE event canlı geliyor (ADM-MOD-004)
15. Admin "Onayla" → topic.status = "approved"
16. Ali'ye bildirim: "İlanınız onaylandı 🎉" (NTF-EVT-002)
17. Türkiye'ye abone olan diğer kullanıcılara: "Takip ettiğin ülkede yeni konu" (NTF-SUB-001)

**Tester Check List:**
- [ ] Step 5'te response body'de `isPremium: true`, `premiumUntil` future ISO string
- [ ] Step 7'de banner UI doğru, "7 gün" hesabı doğru (premiumUntil - now)
- [ ] Step 9'da `CreateTopicScreen` "ücretli" mesajı GÖSTERMEZ
- [ ] Step 11'de topic DB'ye `status: "pending"` ile yazılır
- [ ] Step 12'de notifications koleksiyonunda Ali'ye system tipi kayıt var
- [ ] Step 13'te tüm admin/moderator user'lara bildirim var
- [ ] Step 16'da notifications listede Ali'nin bildirimi en üstte
- [ ] Step 17'de Türkiye'ye sub olan başka user'da `topic_new` bildirimi var

---

### TS-02 · "Premium süresi dolar, ücretli moda döner" (regresyon)

**Kapsadığı:** PRM-EXP-001, PRM-EXP-003, FRM-TPC-002 ücretli yolu, CRD-DED-001

**Adımlar:**
1. Premium user (Bahar) yarat, `premiumUntil = today - 1 minute` set et (DB direkt)
2. Mobile uygulamayı aç (token hala geçerli)
3. AuthContext startup'ta `/users/me` çağrısı yapar → BE lazy check → `isPremium=false` döner
4. Banner artık "Premium'a Geç" gösteriyor
5. Forum'a git → konu açmaya çalış → `/forum/topics POST`
6. BE: user.isPremium=false + credits<50 → 402 INSUFFICIENT_CREDITS
7. Mobile: CreditGate modal "Yetersiz Kredi → Premium'a Geç" CTA gösterir

**Tester Check List:**
- [ ] Step 3'te `/users/me` response `isPremium: false`
- [ ] DB direkt sorgu: user.isPremium = false (lazy check kaydetti)
- [ ] Step 6 response `code: "INSUFFICIENT_CREDITS"`
- [ ] Yeterli kredi ile (50+) → 200 + 50 düşer + status pending

---

### TS-03 · "Yorum bildirimi 3 farklı user → 3 farklı başlık" (NTF-EVT-004)

**Kapsadığı:** FRM-TPC-002, FRM-CMT-002, FRM-TPC-009, NTF-EVT-004

**Adımlar:**
1. A premium user → konu açar (admin approves)
2. B user konuya `POST /subscribe` ile abone olur
3. C user konuya yorum yazar
4. Wait 300ms (notification fan-out async)
5. A'nın bildirim listesi → "Konunuza yeni yorum geldi" (type=new_comment)
6. B'nin bildirim listesi → "Takip ettiğin konuya yeni yorum"
7. C'nin bildirim listesi → kendi yorumu için bildirim YOK

**Tester Check List:**
- [ ] notifications collection'da 2 kayıt (A + B), C için yok
- [ ] Başlık string'leri tam eşleşiyor (regression için)
- [ ] message field'da yorumcunun adı geçiyor

---

### TS-04 · "Tek seferlik paket → 409 ALREADY_OWNED" (PAY-SPN-002)

**Kapsadığı:** PRM-PKG-004, PAY-SPN-002, PAY-CHK-002

**Adımlar:**
1. User → `POST /payment/process { productType: topic_pack_10_weekly }` → 200
2. userFeatures'da `topic_pack_10_weekly` aktif kayıt oluşur, TTL 7 gün
3. Aynı user aynı paketi → ikinci `POST /payment/process` → 409 ALREADY_OWNED
4. Başka user aynı paketi → 200 (kullanıcı bazlı kontrol)
5. Subscription paketler (premium_weekly) → ikinci kez → 200 (yenileme), 409 değil
6. Subscription'ın `premiumUntil` her seferinde uzar

**Tester Check List:**
- [ ] Step 3 response: `code: "ALREADY_OWNED"`, status 409
- [ ] Step 5: subscription muaf — `hasFeature` check'i çalışmaz
- [ ] Step 6: premiumUntil_2 > premiumUntil_1

---

### TS-05 · "Konu düzenleme talebi → admin onay/red akışı" (FRM-TPC-005)

**Kapsadığı:** FRM-TPC-002, FRM-TPC-005, NTF-EVT (edit_request, edit_approved, edit_rejected)

**Adımlar:**
1. Owner premium → konu açar (approved)
2. Owner → `POST /forum/topics/:id/edit-request { title, content }`
3. Owner notifications: "Düzenleme talebiniz alındı" (type=edit_request)
4. Konu hala aktif, original title gösteriliyor (edit BEKLİYOR)
5. Admin paneli → "Düzenleme Talepleri" sekmesi → talep görünür
6. **Path A — Onay:** Admin PATCH approved → topic.title GÜNCELLENİR + owner'a "Düzenlemeniz onaylandı"
7. **Path B — Red:** Admin PATCH rejected + reason → topic.title DEĞİŞMEZ + owner'a "Düzenlemeniz reddedildi: {reason}"

**Tester Check List:**
- [ ] Step 2 → forum_edit_requests koleksiyonunda kayıt
- [ ] Step 4 → topic DB'de title eski
- [ ] Step 6 → topic.title yeni, topic.editedAt set
- [ ] Step 7 → topic.title hala eski, owner notif message'da reason var
- [ ] Path B sonrası tekrar edit-request gönderilebilir (duplicate guard'ı çakmaz)

---

### TS-06 · "Konu silme talebi → admin onayı → soft delete" (FRM-TPC-006)

**Kapsadığı:** FRM-TPC-006, MOD-DEL-001, NTF-EVT

**Adımlar:**
1. Owner approved konu açar
2. `POST /forum/topics/:id/deletion-request { reason: "Artık güncel değil." }` → 201
3. Aynı konu için tekrar → 409
4. Reason < 5 char → 400
5. Admin notifications: "Konu silme talebi"
6. Admin paneli → "Silme Talepleri" sekmesi → satır görünür
7. Admin "Onayla" → topic.deletedAt set, listede gizlenir, detayda "[Bu konu silindi]"
8. Owner'a bildirim: "Silme talebiniz onaylandı"

**Tester Check List:**
- [ ] Step 7 sonrası `GET /forum/topics` listesinde topic YOK
- [ ] `GET /forum/topics/:id` ya 410 ya da deletedAt dolu döner
- [ ] Owner kendi MyTopics'inde "[Silindi]" badge görür (eğer UI varsa)

---

### TS-07 · "Şifre sıfırlama tam akış" (AUTH-PWD-001/002/003)

**Kapsadığı:** AUTH-PWD-001, AUTH-PWD-002, AUTH-PWD-003 (e-posta 🔒)

**Adımlar:**
1. User'ın email'i var
2. `POST /auth/forgot-password { email }` → 200 (var olmasa da aynı yanıt)
3. Console log'da reset token görünür (e-posta stub henüz)
4. Token ile `POST /auth/reset-password { token, newPassword }` → 200
5. Eski şifre ile login → 401
6. Yeni şifre ile login → 200
7. Aynı token ile tekrar reset → 401 (token invalidate edildi mi? — şu an: timestamp'a göre 1h içinde tekrar kullanılabilir, bu BUG'dır → ticket aç)

**Tester Check List:**
- [ ] Step 2 response ok:true, message Türkçe
- [ ] Step 4 sonrası DB'de passwordHash değişti
- [ ] Step 5 → 401, mesaj generic
- [ ] Step 7 → şu an tekrar 200 → **BUG: reset token tek kullanımlık olmalı** → AUTH-PWD-002 follow-up ticket

---

### TS-08 · "JWT expire → refresh token akışı" (AUTH-LOG-005)

**Kapsadığı:** AUTH-LOG-005, AUTH-LOG-004

**Adımlar:**
1. Login → access token (15dk TTL) + refresh token (30g TTL)
2. Access token'ı manuel expire et (DB'de değil, mobile'da silinmemiş ama JWT'de exp geçmiş)
3. Mobile API çağrısı → 401
4. on401Handler → refresh token ile `POST /auth/refresh` → yeni çift döner
5. Original API çağrısı retry → 200
6. Refresh token da expired → logout + LoginScreen

**Tester Check List:**
- [ ] Step 4 sonrası AsyncStorage'da yeni access ve refresh token var
- [ ] Step 6 sonrası AsyncStorage temizlenmiş, AuthContext.user = null

---

### TS-09 · "Spam/raporlama uçtan uca" (MOD-REP-001/002)

**Kapsadığı:** FRM-TPC-010, FRM-CMT-007, MOD-REP-001, MOD-REP-002

**Adımlar:**
1. User A spam konu açar (admin onayı sonrası approved)
2. User B → konuda 3-nokta → "Raporla" → sebep="Spam" → açıklama → Gönder
3. `POST /reports` 200 → content_reports koleksiyonunda kayıt
4. Aynı kullanıcı aynı konuyu tekrar raporla → 409
5. User C aynı konuyu raporla → 200 (farklı reporter)
6. Admin paneli `/admin/reports?status=pending` → 2 satır görünür
7. Admin "İçeriği Sil" → topic soft-deleted + her iki rapor `resolved` olur
8. (opsiyonel) A'ya uyarı bildirimi

**Tester Check List:**
- [ ] Step 3 → DB doğrulaması
- [ ] Step 4 → 409 mesajı doğru
- [ ] Step 7 → topic deletedAt dolu, raporlar status=resolved

---

### TS-10 · "Google ile giriş, ilk kez kayıt" (AUTH-LOG-002)

**Kapsadığı:** AUTH-LOG-002, AUTH-REG-001

**Adımlar:**
1. Mobile → "Google ile Giriş" butonuna bas
2. Eğer EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID yoksa → hata mesajı UI'da
3. ENV doluysa → expo-auth-session ID token alır → `POST /auth/google { idToken }`
4. Bu e-posta DB'de yok → otomatik user yarat (userType=emigrant default)
5. JWT döner → AsyncStorage kaydolur → ana sayfa
6. Tekrar Google login → mevcut user bulunur → yeni topic açma yetkisi

**Tester Check List:**
- [ ] Step 2 → setError doğru mesaj
- [ ] Step 4 → users koleksiyonunda yeni kayıt (`passwordHash` boş veya random)
- [ ] Step 6 → mevcut user'ın `userType` korunur (otomatik default ile ezilmez)

---

### TS-11 · "Rate limit — brute force koruması" (SEC-RTL-001)

**Kapsadığı:** SEC-RTL-001

**Adımlar:**
1. 5 yanlış login denemesi → her biri 401
2. 6. deneme → 429 + "15 dakika sonra dene"
3. Doğru şifre ile bile 6. deneme 429 (limit önce)
4. 15dk geçince (mock veya bekleyerek) → 6. deneme 200

**Tester Check List:**
- [ ] 6. yanıt header'ında `RateLimit-*` standardı var
- [ ] Mesaj Türkçe

---

### TS-12 · "Rehber adım engelleme" (GDE-STP-002)

**Kapsadığı:** GDE-STP-001/002, GDE-PRG-001/002/003

**Adımlar:**
1. Türkiye rehberi → adım 1 "Türk vatandaşı mısın?" cevap "Hayır"
2. Sonraki adımlar UI'da kilitli görünür ("Bu adım senin durumunda gerekli değil")
3. Tekrar adım 1'i değiştir → "Evet"
4. Sonraki adımlar açılır
5. Aynı adıma tekrar cevap yaz → upsert, duplicate satır yok
6. completionPct doğru hesaplanır (kilitli adımlar paydadan çıkar mı? → spec belirtilmeli)

**Tester Check List:**
- [ ] Step 5 → DB'de userProgress kaydı 1 tane
- [ ] Step 6 → spec netleşirse test güncellenir

---

## 🤝 6. Developer ↔ Tester Pair Çalışma Protokolü

### Adım 1 — Sprint başında

**Developer Agent:**
- Sprint için P0 listesinden 3-5 ticket seçer (kapasiteye göre)
- Her ticket için kısa task breakdown yazar (commit boyutu)

**Tester Agent:**
- Seçilen ticket'lar için acceptance criteria + test senaryolarını netleştirir
- TS-XX (uzun senaryo) regresyon dosyasındaki etkilenen senaryoları listeler

### Adım 2 — Her ticket için

```
┌─────────────────────────────────────────────┐
│  Developer                                  │
│  1. Branch aç: feature/PRM-EXP-001          │
│  2. Kodu yaz                                │
│  3. Birim test yaz (mocha/jest)             │
│  4. Lokalde test çalıştır (run-tests.ps1)   │
│  5. PR aç, tester'ı tag'le                  │
└─────────────────────┬───────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────┐
│  Tester                                     │
│  1. PR'ı çek, lokalde çalıştır              │
│  2. Acceptance criteria tek tek check       │
│  3. /verify skill ile gerçek app üzerinde   │
│     uzun senaryoyu (TS-XX) koştur           │
│  4. Edge case probe (boş input, çift tıkla, │
│     network kes vs.)                        │
│  5. Bulduğu sorunları PR yorumuna yaz       │
│     veya yeni ticket aç                     │
└─────────────────────────────────────────────┘
```

### Adım 3 — Sprint sonu

- Tester regresyon koşturu: TS-01 + TS-03 + TS-04 (her sprint kritik happy path)
- Yeni eklenen feature'ın etkilediği TS-XX'leri ekstra koştur
- Sonuç: feature_sets.md'de durum güncellenir, SPRINT.md'ye sprint raporu yazılır

### "Bitti" Tanımı (Definition of Done)

Her ticket için:
- [ ] Kod yazıldı, lokal build geçti (tsc 0 hata)
- [ ] Birim test eklendi, yeşil
- [ ] Integration test eklendi (BE değişiklikleri için)
- [ ] Mobil değişiklikse Expo'da gerçek cihaz/emülatörde manuel doğrulandı
- [ ] PR review aldı (eğer takım birden fazla agent)
- [ ] feature_sets.md güncellendi
- [ ] Commit mesajında feature ID geçiyor

---

## 📌 7. Hızlı Aksiyon Listesi (Bugün başlayabilir)

Sırayla, kapasiteye göre çek:

1. **PRM-EXP-001** — lazy expiry check (`MongoUserRepository.findById`) — **30 dk**
2. **PRM-EXP-001 cron** — node-cron + jobs/expirePremium.ts — **30 dk**
3. **SEC-RTL-001** — express-rate-limit `/auth/*` — **45 dk**
4. **SEC-RTL-002** — express-rate-limit forum POST'ları — **30 dk**
5. **AUTH-REG-002** — Zod validation + mobile validateEmail — **1 sa**
6. **NTF-INA-002** — Mobile polling badge (NotificationsContext) — **1 sa**
7. **MOD-REP-002** — Admin ReportsPage UI — **2 sa**

**Toplam tahmin:** ~6 saat dev + ~3 saat test = 1.5 gün.

Bittikten sonra **TS-01, TS-02, TS-09, TS-11** uzun senaryolarını koştur — bunlar yapılan değişiklikleri kapsıyor.

---

## 📎 8. Referans Linkler

- Detaylı feature açıklamaları → `feature_sets.md`
- Mevcut test scenario'ları → `TEST_SCENARIOS.md`
- Sprint geçmişi → `SPRINT.md`
- Mimari notlar → `CLAUDE.md`
