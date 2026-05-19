# GoWorldy — Feature Sets Kataloğu v2.0

> **Amaç:** Her özelliğin **kodlu ID**'si, **detaylı akış senaryosu**, **kullanıcı dostu kod örnekleri**, **bildirim akışı**, **edge case'leri** ve **backend gereksinimi** birlikte tanımlanır.
> Bir özellik üzerinde çalışmak istediğinde: `"FRM-TPC-005'i tamamla"` gibi referans ver.
>
> **Son güncelleme:** 2026-05-18
> **Durum sembolleri:** ✅ Tam çalışıyor · ⚠️ Kısmen / bug var · ❌ Eksik · 🔒 Stakeholder bekleniyor · 🆕 Bu sürümle eklenen yeni feature

---

## 📑 İçindekiler

1. [Feature Kodlama Sistemi](#-feature-kodlama-sistemi)
2. [Master Index — Tüm Feature'lar Tek Tabloda](#-master-index)
3. [AUTH — Kimlik Doğrulama](#-auth--kimlik-doğrulama)
4. [USR — Kullanıcı Profili](#-usr--kullanıcı-profili)
5. [FRM — Forum (Ülke / Kategori / Konu / Yorum)](#-frm--forum)
6. [PRM — Premium Abonelik](#-prm--premium-abonelik)
7. [PAY — Ödeme Sistemi](#-pay--ödeme-sistemi)
8. [CRD — Kredi Sistemi](#-crd--kredi-sistemi)
9. [NTF — Bildirim Sistemi](#-ntf--bildirim-sistemi)
10. [ADM — Admin Paneli](#-adm--admin-paneli)
11. [MOD — Moderasyon](#-mod--moderasyon)
12. [GDE — Rehber Sistemi](#-gde--rehber-sistemi)
13. [SRC — Arama](#-src--arama)
14. [SEC — Güvenlik & Validasyon](#-sec--güvenlik--validasyon)
15. [P0 Kritik Bug'lar](#-p0-kritik-buglar-kullanıcı-raporundan)
16. [Yeni Senaryolar (Henüz Tanımlanmamış)](#-yeni-senaryolar)

---

## 🔢 Feature Kodlama Sistemi

Her feature **3 segment**ten oluşan benzersiz bir ID'ye sahiptir:

```
[DOMAIN]-[ENTITY]-[NUMBER]
   │        │        │
   │        │        └─ Aynı entity içinde sıra numarası (001-999)
   │        └────────── Alt grup (3 harf, opsiyonel)
   └─────────────────── Ana modül (3 harf)
```

**Örnek:** `FRM-TPC-007` = Forum modülü → Topic alt grubu → 7. feature (Konu Beğenme)

**Domain kısaltmaları:**

| Kod | Anlamı | Kapsam |
|-----|--------|--------|
| AUTH | Authentication | Kayıt, giriş, şifre, oturum |
| USR | User | Profil, avatar, istatistikler |
| FRM | Forum | Ülke, kategori, konu, yorum |
| PRM | Premium | Abonelik planları, üyelik durumu |
| PAY | Payment | Stripe, checkout, webhook |
| CRD | Credits | Kredi bakiyesi, düşme, yenileme |
| NTF | Notification | In-app, push, email bildirimleri |
| ADM | Admin | Yönetici panel, moderasyon kuyrukları |
| MOD | Moderation | Raporlama, banlama, silme |
| GDE | Guide | Adım adım göç rehberi |
| SRC | Search | Arama özellikleri |
| SEC | Security | Validasyon, rate limit, sanitization |

---

## 🗂️ Master Index

> Tüm feature'ların özet tablosu — hızlı referans için. Her satıra tıklayarak (anchor) detayına gidebilirsin.

### AUTH — Kimlik Doğrulama (16 feature)

| ID | Özellik | Durum |
|----|---------|-------|
| [AUTH-REG-001](#auth-reg-001-kullanıcı-kaydı) | Kullanıcı kaydı | ✅ |
| [AUTH-REG-002](#auth-reg-002-e-posta-format-validasyonu) | E-posta format validasyonu | ❌ |
| [AUTH-REG-003](#auth-reg-003-kayıt-sonrası-onboarding) | Kayıt sonrası onboarding | ❌ |
| [AUTH-REG-004](#auth-reg-004-kullanıcı-tipi-seçimi) | Kullanıcı tipi seçimi (Göç Adayı/Danışman/Yurt Dışında) | ✅ |
| [AUTH-LOG-001](#auth-log-001-e-posta--şifre-girişi) | E-posta + şifre girişi | ✅ |
| [AUTH-LOG-002](#auth-log-002-google-ile-giriş) | Google ile giriş | ✅ |
| [AUTH-LOG-003](#auth-log-003-şifre-göstergizle-toggle) | Şifre göster/gizle toggle | ❌ |
| [AUTH-LOG-004](#auth-log-004-oturum-kalıcılığı) | Oturum kalıcılığı (AsyncStorage) | ✅ |
| [AUTH-LOG-005](#auth-log-005-süresi-dolmuş-jwt-otomatik-logout) | Süresi dolmuş JWT → otomatik logout | ⚠️ |
| [AUTH-PWD-001](#auth-pwd-001-şifremi-unuttum) | Şifremi unuttum | ✅ |
| [AUTH-PWD-002](#auth-pwd-002-şifre-sıfırlama) | Token ile şifre sıfırlama | ✅ |
| [AUTH-PWD-003](#auth-pwd-003-gerçek-e-posta-gönderimi) | Gerçek e-posta gönderimi (SendGrid) | 🔒 |
| [AUTH-PWD-004](#auth-pwd-004-şifre-değiştirme) | Profil → şifre değiştirme | ❌ |
| [AUTH-PWD-005](#auth-pwd-005-güçlü-şifre-zorlaması) | Güçlü şifre zorlaması (büyük/küçük/rakam) | ❌ |
| [AUTH-ACC-001](#auth-acc-001-çıkış-yap) | Çıkış yap | ✅ |
| [AUTH-ACC-002](#auth-acc-002-hesap-silme-kvkkgdpr) | Hesap silme (KVKK/GDPR) | ❌ |

### USR — Kullanıcı Profili (12 feature)

| ID | Özellik | Durum |
|----|---------|-------|
| [USR-PRF-001](#usr-prf-001-profil-görüntüleme) | Profil görüntüleme | ✅ |
| [USR-PRF-002](#usr-prf-002-profil-düzenleme) | Profil düzenleme | ✅ |
| [USR-PRF-003](#usr-prf-003-bio-düzenleme) | Bio düzenleme | ✅ |
| [USR-AVT-001](#usr-avt-001-avatar-yükleme-galeri) | Avatar yükleme (galeri) | ✅ |
| [USR-AVT-002](#usr-avt-002-avatar-kırpma--ön-izleme) | Avatar kırpma & ön izleme | ❌ |
| [USR-STA-001](#usr-sta-001-konuyorumadım-istatistikleri) | Konu/Yorum/Adım istatistikleri | ✅ |
| [USR-STA-002](#usr-sta-002-followingcount-takip-sistemi) | followingCount (takip sistemi) | ❌ |
| [USR-TPC-001](#usr-tpc-001-kullanıcının-konuları) | Kullanıcının açtığı konular | ✅ |
| [USR-TPC-002](#usr-tpc-002-mytopics-sayfalama) | MyTopics sayfalama | ❌ |
| [USR-CMT-001](#usr-cmt-001-kullanıcının-yorumları) | Kullanıcının yorumları | ✅ |
| [USR-PRV-001](#usr-prv-001-telefon-numarası-paylaşımı) | Telefon numarası paylaşımı | ⚠️ |
| [USR-PRV-002](#usr-prv-002-telefon-format-validasyonu) | Telefon format validasyonu (+90/05xx) | ❌ |

### FRM — Forum (24 feature)

| ID | Özellik | Durum |
|----|---------|-------|
| [FRM-CTY-001](#frm-cty-001-ülke-listesi) | Ülke listesi | ✅ |
| [FRM-CTY-002](#frm-cty-002-ülke-arama) | Ülke arama (UI) | ✅ |
| [FRM-CAT-001](#frm-cat-001-kategori-listesi) | Kategori listesi | ✅ |
| [FRM-CAT-002](#frm-cat-002-alt-kategori-nested) | Alt kategori (nested) | ⚠️ |
| [FRM-TPC-001](#frm-tpc-001-konu-listesi--sayfalama) | Konu listesi + sayfalama | ✅ |
| [FRM-TPC-002](#frm-tpc-002-konu-açma-tam-akış) | **Konu açma (Premium check + admin onay + bildirim)** | ✅ |
| [FRM-TPC-003](#frm-tpc-003-konu-içeriği-body-alanı) | Konu içeriği (body) TextInput + detayda render | ✅ |
| [FRM-TPC-004](#frm-tpc-004-konu-detay) | Konu detay görüntüleme | ✅ |
| [FRM-TPC-005](#frm-tpc-005-konu-düzenleme) | Konu düzenleme (yazar tarafından) | ⚠️ |
| [FRM-TPC-006](#frm-tpc-006-konu-silme) | Konu silme (sahibi silme talebi, admin onayı) | ⚠️ |
| [FRM-TPC-007](#frm-tpc-007-konu-upvote) | Konu upvote (toggle) | ✅ |
| [FRM-TPC-008](#frm-tpc-008-konu-favori--kaydet) | Konu favori / kaydet | ✅ |
| [FRM-TPC-009](#frm-tpc-009-konu-takip-subscribe) | Konu takip (subscribe) | ✅ |
| [FRM-TPC-010](#frm-tpc-010-konu-raporlama) | Konu raporlama | ❌ |
| [FRM-TPC-011](#frm-tpc-011-konu-kilitleme-yorum-kapat) | Konu kilitleme (yorum kapat) | ❌ |
| [FRM-TPC-012](#frm-tpc-012-konu-paylaşma-deep-link) | Konu paylaşma (deep link) | ✅ |
| [FRM-TPC-013](#frm-tpc-013-popüler-filtre-upvote-dahil) | Popüler filtre (upvote dahil) | ✅ |
| [FRM-CMT-001](#frm-cmt-001-yorum-listesi) | Yorum listesi | ✅ |
| [FRM-CMT-002](#frm-cmt-002-yorum-yazma) | Yorum yazma | ✅ |
| [FRM-CMT-003](#frm-cmt-003-yorum-düzenleme) | Yorum düzenleme | ⚠️ |
| [FRM-CMT-004](#frm-cmt-004-yorum-silme) | Yorum silme (sahibi veya admin) | ❌ |
| [FRM-CMT-005](#frm-cmt-005-yorum-beğenme) | Yorum beğenme | ✅ |
| [FRM-CMT-006](#frm-cmt-006-yorum-yanıtlama-nested) | Yorum yanıtlama (nested + collapse) | ✅ |
| [FRM-CMT-007](#frm-cmt-007-yorum-raporlama) | Yorum raporlama | ⚠️ |

### PRM — Premium (10 feature)

| ID | Özellik | Durum |
|----|---------|-------|
| [PRM-PKG-001](#prm-pkg-001-paket-listesi) | Premium paket listesi | ✅ |
| [PRM-PKG-002](#prm-pkg-002-aktif-paket-banner) | Aktif paket banner (anasayfa CTA) | ⚠️ |
| [PRM-PKG-003](#prm-pkg-003-fiyat-api-dan-çekme-hardcoded-yok) | Fiyat API'dan çekme (hardcoded yok) | ❌ |
| [PRM-SUB-001](#prm-sub-001-haftalık-premium-satın-alma) | Haftalık premium satın alma | ✅ |
| [PRM-SUB-002](#prm-sub-002-aylık-premium-satın-alma) | Aylık premium satın alma | ✅ |
| [PRM-SUB-003](#prm-sub-003-aktif-aboneliği-görüntüleme) | Aktif aboneliği görüntüleme | ✅ |
| [PRM-SUB-004](#prm-sub-004-abonelik-iptali) | Abonelik iptali | ❌ |
| [PRM-EXP-001](#prm-exp-001-süre-dolma-otomatik-kapatma) | Süre dolduğunda isPremium otomatik false | ❌ |
| [PRM-EXP-002](#prm-exp-002-süre-dolma-bildirimi-3-gün-önce) | Süre dolma bildirimi (3 gün önce) | ❌ |
| [PRM-EXP-003](#prm-exp-003-mobile-tarafında-premium-state-refresh) | **Mobile: Premium state refresh** (kritik bug) | ❌ |

### PAY — Ödeme (8 feature)

| ID | Özellik | Durum |
|----|---------|-------|
| [PAY-CHK-001](#pay-chk-001-stripe-checkout-session) | Stripe checkout session oluşturma | 🔒 |
| [PAY-CHK-002](#pay-chk-002-mock-ödeme-process) | Mock ödeme (geliştirme için /process) | ✅ |
| [PAY-WBH-001](#pay-wbh-001-stripe-webhook-işleme) | Stripe webhook işleme | 🔒 |
| [PAY-SPN-001](#pay-spn-001-kredi-harcama-spend-credit) | Kredi harcama (spend-credit) | ✅ |
| [PAY-SPN-002](#pay-spn-002-zaten-sahip-409-koruması) | "Zaten sahipsiniz" 409 koruması | ✅ |
| [PAY-HST-001](#pay-hst-001-ödeme-geçmişi) | Ödeme geçmişi | ❌ |
| [PAY-INV-001](#pay-inv-001-fatura-pdf-indirme) | Fatura PDF indirme | ❌ |
| [PAY-RFD-001](#pay-rfd-001-iade-talebi) | İade talebi | ❌ |

### CRD — Kredi (7 feature)

| ID | Özellik | Durum |
|----|---------|-------|
| [CRD-BAL-001](#crd-bal-001-kredi-bakiyesi-sorgu) | Kredi bakiyesi sorgu | ✅ |
| [CRD-BAL-002](#crd-bal-002-bakiye-mobile-headerda-her-zaman-görünür) | Bakiye mobile header'da her zaman görünür | ❌ |
| [CRD-DED-001](#crd-ded-001-kredi-düşme-atomik) | Kredi düşme (atomik DB transaction) | ⚠️ |
| [CRD-RFD-001](#crd-rfd-001-başarısız-işlemde-kredi-iadesi) | Başarısız işlemde kredi iadesi | ✅ |
| [CRD-RWD-001](#crd-rwd-001-haftalık-otomatik-kredi-ödülü) | Haftalık otomatik kredi ödülü (cron) | ❌ |
| [CRD-HST-001](#crd-hst-001-kredi-geçmişi-tablosu) | Kredi geçmişi tablosu | ❌ |
| [CRD-LOW-001](#crd-low-001-düşük-bakiye-erken-uyarı) | Düşük bakiye erken uyarı (kalan ≤10) | ❌ |

### NTF — Bildirim (15 feature)

| ID | Özellik | Durum |
|----|---------|-------|
| [NTF-INA-001](#ntf-ina-001-in-app-bildirim-listesi) | In-app bildirim listesi | ✅ |
| [NTF-INA-002](#ntf-ina-002-okunmamış-sayısı-badge) | Okunmamış sayısı (badge) | ❌ |
| [NTF-INA-003](#ntf-ina-003-bildirimi-okundu-işaretle) | Bildirimi okundu işaretle | ⚠️ |
| [NTF-INA-004](#ntf-ina-004-tümünü-okundu) | Tümünü okundu işaretle | ✅ |
| [NTF-INA-005](#ntf-ina-005-bildirimi-silme) | Bildirimi silme | ❌ |
| [NTF-INA-006](#ntf-ina-006-bildirim-grupla-aynı-konu-için-3-kişi-yorum-yaptı) | Bildirim grupla (aynı konu için "3 kişi yorum yaptı") | ❌ |
| [NTF-EVT-001](#ntf-evt-001-konu-onay-sürecine-alındı) | "Konunuz onay sürecine alındı" bildirimi | ⚠️ |
| [NTF-EVT-002](#ntf-evt-002-konu-onaylandı) | "Konunuz onaylandı 🎉" bildirimi | ⚠️ |
| [NTF-EVT-003](#ntf-evt-003-konu-reddedildi-sebep) | "Konunuz reddedildi (sebep)" bildirimi | ⚠️ |
| [NTF-EVT-004](#ntf-evt-004-yeni-yorum-konu-sahibine) | "Yeni yorum (konu sahibine)" bildirimi | ⚠️ |
| [NTF-EVT-005](#ntf-evt-005-admine-yeni-pending-konu) | "Admin'e yeni pending konu" bildirimi | ⚠️ |

> **⛔ NTF-EVT-001..005 blocker:** Kod yazıldı + entegre edildi ama uçtan uca test edilemiyor. Sebep: [PRM-EXP-003](#prm-exp-003-mobile-tarafında-premium-state-refresh) bug'ı yüzünden kullanıcı pending topic flow'una giremiyor. Premium state refresh fix'ten sonra hepsi ✅ olacak (kod hazır).
| [NTF-EVT-006](#ntf-evt-006-premium-süresi-dolmak-üzere) | "Premium süresi dolmak üzere" bildirimi | ❌ |
| [NTF-SUB-001](#ntf-sub-001-ülke-aboneliği) | Ülke aboneliği | ✅ |
| [NTF-PSH-001](#ntf-psh-001-expo-push-notification) | Expo push notification | ❌ |
| [NTF-EML-001](#ntf-eml-001-e-posta-bildirimi-sendgrid) | E-posta bildirimi (SendGrid) | 🔒 |

### ADM — Admin (12 feature)

| ID | Özellik | Durum |
|----|---------|-------|
| [ADM-DSH-001](#adm-dsh-001-dashboard-istatistikleri) | Dashboard istatistikleri | ✅ |
| [ADM-USR-001](#adm-usr-001-kullanıcı-listesi--arama) | Kullanıcı listesi + arama | ✅ |
| [ADM-USR-002](#adm-usr-002-rol-atama) | Rol atama (admin/moderator/user) | ✅ |
| [ADM-USR-003](#adm-usr-003-manuel-premium-grant) | Manuel premium grant | ✅ |
| [ADM-USR-004](#adm-usr-004-kullanıcı-banlama) | Kullanıcı banlama | ❌ |
| [ADM-MOD-001](#adm-mod-001-pending-konu-kuyruğu) | Pending konu kuyruğu | ✅ |
| [ADM-MOD-002](#adm-mod-002-konu-onayla) | Konu onayla | ✅ |
| [ADM-MOD-003](#adm-mod-003-konu-reddet-sebep-zorunlu) | Konu reddet (sebep zorunlu) | ✅ |
| [ADM-MOD-004](#adm-mod-004-sse-gerçek-zamanlı-akış) | SSE gerçek zamanlı pending akışı | ✅ |
| [ADM-MOD-005](#adm-mod-005-admine-push--email-yeni-pending) | Admin'e push + email "yeni pending" | ❌ |
| [ADM-CFG-001](#adm-cfg-001-config-okuma-read-only) | Config okuma (read-only) | ✅ |
| [ADM-CFG-002](#adm-cfg-002-pricing-güncelleme-writable) | Pricing güncelleme (writable) | ❌ |

### MOD — Moderasyon (6 feature)

| ID | Özellik | Durum |
|----|---------|-------|
| [MOD-REP-001](#mod-rep-001-konuyorum-raporlama-akışı) | Konu/yorum raporlama akışı | ❌ |
| [MOD-REP-002](#mod-rep-002-rapor-kuyruğu-admin-panel) | Rapor kuyruğu (admin panel) | ❌ |
| [MOD-BAN-001](#mod-ban-001-kullanıcı-susturma-mute) | Kullanıcı susturma (mute X gün) | ❌ |
| [MOD-BAN-002](#mod-ban-002-kullanıcı-kalıcı-ban) | Kullanıcı kalıcı ban | ❌ |
| [MOD-DEL-001](#mod-del-001-soft-delete-bu-içerik-kaldırıldı) | Soft delete ("bu içerik kaldırıldı") | ❌ |
| [MOD-SPM-001](#mod-spm-001-otomatik-spam-filtresi) | Otomatik spam filtresi | ❌ |

### GDE — Rehber (8 feature)

| ID | Özellik | Durum |
|----|---------|-------|
| [GDE-STP-001](#gde-stp-001-rehber-adım-listesi) | Rehber adım listesi | ✅ |
| [GDE-STP-002](#gde-stp-002-blocking-answer-engeli) | Blocking answer engeli | ⚠️ |
| [GDE-PRG-001](#gde-prg-001-adım-cevaplama--kayıt) | Adım cevaplama + kayıt | ✅ |
| [GDE-PRG-002](#gde-prg-002-upsert-aynı-adımı-tekrar-yaz) | Upsert (aynı adımı tekrar yaz) | ⚠️ |
| [GDE-PRG-003](#gde-prg-003-completion-yüzdesi) | Completion yüzdesi | ✅ |
| [GDE-CMP-001](#gde-cmp-001-rehber-tamamlama-rozeti) | Rehber tamamlama rozeti | ❌ |
| [GDE-RCM-001](#gde-rcm-001-akıllı-adım-önerisi) | Akıllı adım önerisi (sonraki yapmalı) | ❌ |
| [GDE-ADM-001](#gde-adm-001-admin-rehber-adım-ekleme) | Admin: rehber adımı ekleme | ❌ |

### SRC — Arama (4 feature)

| ID | Özellik | Durum |
|----|---------|-------|
| [SRC-TPC-001](#src-tpc-001-konu-arama-min-2-karakter) | Konu arama (min 2 karakter) | ✅ |
| [SRC-TPC-002](#src-tpc-002-arama-sonuçlarında-vurgu-highlight) | Arama sonuçlarında highlight | ❌ |
| [SRC-CAT-001](#src-cat-001-kategori-içi-arama) | Kategori içi arama | ❌ |
| [SRC-USR-001](#src-usr-001-admin-kullanıcı-arama) | Admin: kullanıcı arama | ✅ |

### SEC — Güvenlik (8 feature)

| ID | Özellik | Durum |
|----|---------|-------|
| [SEC-VAL-001](#sec-val-001-zod-server-side-validation) | Zod server-side validation | ⚠️ |
| [SEC-VAL-002](#sec-val-002-nosql-injection-koruması) | NoSQL injection koruması | ✅ |
| [SEC-RTL-001](#sec-rtl-001-auth-rate-limit) | /auth/* rate limit | ❌ |
| [SEC-RTL-002](#sec-rtl-002-konu-yorum-rate-limit) | Konu/yorum rate limit (anti-spam) | ❌ |
| [SEC-COR-001](#sec-cor-001-cors-whitelist) | CORS whitelist | ❌ |
| [SEC-SAN-001](#sec-san-001-xss-sanitization-yorumkonu) | XSS sanitization (yorum/konu içeriği) | ❌ |
| [SEC-PWD-001](#sec-pwd-001-bcrypt-hash-cost-12) | Bcrypt hash (cost 12) | ✅ |
| [SEC-PWD-002](#sec-pwd-002-passwordhash-asla-dönmeme) | passwordHash asla response'a dönmeme | ✅ |

---

# 🔐 AUTH — Kimlik Doğrulama

---

### AUTH-REG-001: Kullanıcı Kaydı

**Durum:** ✅ Çalışıyor

**Kullanıcı Hikayesi:**
> Yeni bir kullanıcı olarak, e-posta + şifre + ad-soyad + kullanıcı tipi (Göç Adayı / Danışman / Yurt Dışında) bilgileriyle hesap açmak istiyorum ki forumda konu açabileyim ve rehbere erişebileyim.

**Ön Koşullar:**
- Kullanıcı kayıtlı değil (e-posta tekil)
- E-posta `something@domain.com` formatında

**Mutlu Yol (Happy Path):**
1. Kullanıcı `RegisterScreen`'i açar
2. Form alanlarını doldurur: ad-soyad, e-posta, şifre (min 6), kullanıcı tipi seç (chip)
3. "Kayıt Ol" → `POST /auth/register`
4. Backend `bcrypt.hash(password, 12)` ile hash'ler, DB'ye ekler
5. `jwt.sign({id, role})` JWT döner
6. Mobile JWT + user'ı `AsyncStorage`'a kaydeder
7. Kullanıcı ana ekrana yönlendirilir

**Hata Senaryoları:**

| Durum | HTTP | Mesaj | Frontend Aksiyonu |
|-------|------|-------|-------------------|
| E-posta zaten var | 409 | "Bu e-posta zaten kayıtlı." | Inline error + "Giriş yap" linki göster |
| Şifre < 6 karakter | 400 | "Şifre en az 6 karakter olmalı." | Inline error |
| Geçersiz e-posta format | 400 | "Geçerli bir e-posta girin." | Inline error (AUTH-REG-002 ile birlikte) |
| Boş alan | 400 | "Tüm alanlar zorunlu." | Inline error |

**Backend Endpoint:**
```
POST /auth/register
Body: { email, password, displayName, userType }
Response: { token, user: { id, email, displayName, role, userType, credits, isPremium } }
```

**Code:**
```ts
// api/src/routes/auth.ts
router.post("/register", async (req, res) => {
  const { email, password, displayName, userType = "emigrant" } = req.body;
  if (!email || !password || !displayName) {
    return res.status(400).json({ error: "Tüm alanlar zorunlu." });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: "Şifre en az 6 karakter olmalı." });
  }
  const existing = await repos.users.findByEmail(email);
  if (existing) {
    return res.status(409).json({ error: "Bu e-posta zaten kayıtlı." });
  }
  const passwordHash = await bcrypt.hash(password, 12);
  const user = await repos.users.create({ email, passwordHash, displayName, userType });
  const token = jwt.sign({ id: user.id, role: user.role }, config.jwtSecret, { expiresIn: "7d" });
  const { passwordHash: _, ...safeUser } = user;
  res.json({ token, user: safeUser });
});
```

---

### AUTH-REG-002: E-posta Format Validasyonu

**Durum:** ❌ Eksik

**Sorun:** Frontend sadece boşluk kontrolü yapıyor. `"abc"` veya `"test@"` gibi geçersiz e-postalar API'ye gidiyor ve backend de bunları kabul ediyor.

**Çözüm — Frontend:**
```ts
// mobile/src/utils/validation.ts
export const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export function validateEmail(email: string): string | null {
  const trimmed = email.trim();
  if (!trimmed) return "E-posta boş olamaz.";
  if (!EMAIL_REGEX.test(trimmed)) return "Geçerli bir e-posta girin (örn: ad@site.com)";
  return null;
}
```

**Çözüm — Backend (Zod ile):**
```ts
import { z } from "zod";
const RegisterSchema = z.object({
  email: z.string().email("Geçerli bir e-posta girin"),
  password: z.string().min(6, "Şifre en az 6 karakter olmalı"),
  displayName: z.string().min(2, "Ad-soyad en az 2 karakter"),
  userType: z.enum(["emigrant", "consultant", "diaspora"]).default("emigrant"),
});
```

---

### AUTH-REG-003: Kayıt Sonrası Onboarding

**Durum:** ❌ Eksik

**Senaryo:**
1. Yeni kullanıcı kayıt olur
2. **3-adımlı onboarding modal açılır:**
   - **Adım 1:** "Hedef ülkeni seç" (Almanya, Kanada, vs.)
   - **Adım 2:** "Göç durumun ne?" (Henüz planlama / Başvuru aşamasında / Yurt dışında)
   - **Adım 3:** "Bildirimleri açmak ister misin?" (push permission isteme)
3. Onboarding sonunda → kullanıcı hedef ülke rehberi gösterilir
4. Onboarding tamamlandı bayrağı `user.onboardingComplete = true` set edilir

**Code:**
```tsx
// mobile/src/screens/onboarding/OnboardingFlow.tsx
const STEPS = ["country", "status", "notifications"] as const;
export function OnboardingFlow({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);
  // ...
  return (
    <Modal visible animationType="slide">
      {step === 0 && <CountryPickStep onNext={() => setStep(1)} />}
      {step === 1 && <StatusPickStep onNext={() => setStep(2)} />}
      {step === 2 && <NotificationStep onDone={onDone} />}
    </Modal>
  );
}
```

**DB Değişikliği:**
```sql
ALTER TABLE users ADD COLUMN onboardingComplete BOOLEAN DEFAULT 0;
ALTER TABLE users ADD COLUMN targetCountryId TEXT;  -- zaten var, ama eksik kullanılıyor
```

---

### AUTH-REG-004: Kullanıcı Tipi Seçimi

**Durum:** ✅ Çalışıyor

**Değerler:** `emigrant` (Göç Adayı) · `consultant` (Danışman) · `diaspora` (Yurt Dışında)

**UI:** Chip seçici (RegisterScreen'de)

**Backend:** `users.userType` alanında saklanıyor. `GET /users/consultants` endpoint'i danışmanları listeliyor.

**Eksik:** Kullanıcı tipi bazlı içerik filtreleme henüz yok. Örn: Consultant'lara özel dashboard, diaspora'ya özel forum bölümü.

---

### AUTH-LOG-001: E-posta + Şifre Girişi

**Durum:** ✅ Çalışıyor

**Akış:**
1. `LoginScreen` → e-posta + şifre + "Giriş Yap"
2. `POST /auth/login` → `bcrypt.compare` → JWT
3. `AuthContext` user + token'ı set eder, `AsyncStorage`'a yazar
4. `AppNavigator` → Main stack'e geçer

**Hata Mesajları (User-Friendly):**

| Backend Hatası | Kullanıcıya Gösterilen |
|----------------|------------------------|
| User bulunamadı | "E-posta veya şifre hatalı." (güvenlik için aynı mesaj) |
| Şifre yanlış | "E-posta veya şifre hatalı." |
| Hesap askıya alınmış | "Hesabın askıya alındı. Destek ile iletişime geç." |
| Network error | "Bağlantı hatası. İnternetini kontrol et." |

**Code:**
```ts
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await repos.users.findByEmail(email);
  if (!user) return res.status(401).json({ error: "E-posta veya şifre hatalı." });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: "E-posta veya şifre hatalı." });

  if (user.isBanned) return res.status(403).json({ error: "Hesabın askıya alındı." });

  const token = jwt.sign({ id: user.id, role: user.role }, config.jwtSecret, { expiresIn: "7d" });
  const { passwordHash: _, ...safeUser } = user;
  res.json({ token, user: safeUser });
});
```

---

### AUTH-LOG-002: Google ile Giriş

**Durum:** ✅ Çalışıyor (`google-auth-library`)

**Akış:**
1. Mobile `expo-auth-session/providers/google` ile ID token alır
2. `POST /auth/google` → backend Google verify
3. E-posta zaten varsa → login; yoksa → otomatik kayıt
4. JWT döner

**Code:**
```ts
router.post("/google", async (req, res) => {
  const { idToken } = req.body;
  const ticket = await googleClient.verifyIdToken({ idToken, audience: config.google.clientId });
  const payload = ticket.getPayload();
  if (!payload?.email) return res.status(401).json({ error: "Google girişi başarısız." });

  let user = await repos.users.findByEmail(payload.email);
  if (!user) {
    user = await repos.users.create({
      email: payload.email,
      displayName: payload.name ?? "Google User",
      passwordHash: "",  // Google login için boş — şifre ile giriş yapılamaz
      avatar: payload.picture,
      userType: "emigrant",
    });
  }
  const token = jwt.sign({ id: user.id, role: user.role }, config.jwtSecret, { expiresIn: "7d" });
  res.json({ token, user });
});
```

---

### AUTH-LOG-003: Şifre Göster/Gizle Toggle

**Durum:** ❌ Eksik

**Çözüm:**
```tsx
const [showPassword, setShowPassword] = useState(false);
<View style={{ flexDirection: "row" }}>
  <TextInput
    secureTextEntry={!showPassword}
    value={password}
    onChangeText={setPassword}
    placeholder="Şifre"
    style={{ flex: 1 }}
  />
  <TouchableOpacity onPress={() => setShowPassword(s => !s)}>
    <Ionicons name={showPassword ? "eye-off" : "eye"} size={20} />
  </TouchableOpacity>
</View>
```

---

### AUTH-LOG-004: Oturum Kalıcılığı

**Durum:** ✅ Çalışıyor

**Akış:**
- `AuthContext` mount olunca `AsyncStorage.getItem("token")` ve `"user"`'ı okur
- Token varsa otomatik `/users/me` ile doğrular
- Token geçersizse → logout (AUTH-LOG-005 ile bağlı)

---

### AUTH-LOG-005: Süresi Dolmuş JWT → Otomatik Logout

**Durum:** ⚠️ Backend doğru 401 dönüyor ama mobile bunu yakalayıp logout yapmıyor

**Çözüm — Axios interceptor:**
```ts
// mobile/src/services/api.ts
import { authStore } from "../context/AuthContext";

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      authStore.logout();  // user'ı temizle → AppNavigator otomatik LoginScreen'e döner
      Alert.alert("Oturum süresi doldu", "Lütfen tekrar giriş yap.");
    }
    return Promise.reject(err);
  }
);
```

---

### AUTH-PWD-001: Şifremi Unuttum

**Durum:** ✅ Çalışıyor (e-posta gönderimi 🔒)

**Akış:**
1. `ForgotPasswordScreen` → e-posta gir → "Gönder"
2. `POST /auth/forgot-password`
3. Backend `crypto.randomBytes(32)` ile reset token üretir, DB'ye 1 saatlik TTL ile yazar
4. E-posta gönderilir: `https://goworldy.com/reset?token=...`
5. Kullanıcıya başarı mesajı: "Şifre sıfırlama bağlantısı gönderildi (varsa)"

> **Güvenlik:** E-posta var/yok bilgisi sızdırılmaz — her durumda aynı başarı mesajı.

---

### AUTH-PWD-002: Token ile Şifre Sıfırlama

**Durum:** ✅ Çalışıyor

**Akış:**
1. Kullanıcı linke tıklar → `ResetPasswordScreen` (deep link veya web)
2. Yeni şifre + tekrar gir → `POST /auth/reset-password { token, newPassword }`
3. Backend token'ı verify eder, TTL kontrolü
4. Şifreyi bcrypt ile hash'ler, kaydeder, token'ı invalidate eder
5. Login ekranına yönlendir

---

### AUTH-PWD-003: Gerçek E-posta Gönderimi

**Durum:** 🔒 SendGrid API key bekleniyor — şu an `console.log`

**Stub:**
```ts
// api/src/services/email.ts
export async function sendPasswordResetEmail(email: string, token: string) {
  if (!config.sendgrid.apiKey) {
    console.log(`[EMAIL STUB] Reset link: ${config.app.url}/reset?token=${token}`);
    return;
  }
  await sgMail.send({
    to: email,
    from: "noreply@goworldy.com",
    subject: "GoWorldy Şifre Sıfırlama",
    html: `<p>Şifreni sıfırlamak için <a href="${config.app.url}/reset?token=${token}">tıkla</a>.</p>
           <p>Bu link 1 saat geçerlidir.</p>`,
  });
}
```

---

### AUTH-PWD-004: Profil → Şifre Değiştirme

**Durum:** ❌ Eksik

**Çözüm:**

**Endpoint:**
```
POST /auth/change-password
Body: { currentPassword, newPassword }
Auth: required
```

**Backend:**
```ts
router.post("/change-password", authMiddleware, async (req: AuthRequest, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await repos.users.findById(req.userId!);
  if (!user) return res.status(404).json({ error: "Kullanıcı bulunamadı." });

  const ok = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!ok) return res.status(401).json({ error: "Mevcut şifreniz yanlış." });

  if (newPassword.length < 6) {
    return res.status(400).json({ error: "Yeni şifre en az 6 karakter olmalı." });
  }
  const newHash = await bcrypt.hash(newPassword, 12);
  await repos.users.update(req.userId!, { passwordHash: newHash });
  res.json({ ok: true });
});
```

**Mobile UI:** Profil → "Şifre Değiştir" → modal: mevcut şifre + yeni şifre + tekrar gir

---

### AUTH-PWD-005: Güçlü Şifre Zorlaması

**Durum:** ❌ Eksik — şu an sadece min 6 karakter

**Kural:** En az 8 karakter, en az 1 büyük harf, 1 küçük harf, 1 rakam.

```ts
export function validatePasswordStrength(pw: string): string | null {
  if (pw.length < 8) return "Şifre en az 8 karakter olmalı.";
  if (!/[A-Z]/.test(pw)) return "En az bir büyük harf içermeli.";
  if (!/[a-z]/.test(pw)) return "En az bir küçük harf içermeli.";
  if (!/[0-9]/.test(pw)) return "En az bir rakam içermeli.";
  return null;
}
```

**UI:** Şifre alanı altında canlı güç göstergesi (zayıf/orta/güçlü, kırmızı/sarı/yeşil bar)

---

### AUTH-ACC-001: Çıkış Yap

**Durum:** ✅ Çalışıyor

**Akış:** `AuthContext.logout()` → AsyncStorage temizle → user null → AppNavigator LoginScreen'e döner

---

### AUTH-ACC-002: Hesap Silme (KVKK/GDPR)

**Durum:** ❌ Eksik (yasal zorunluluk)

**Akış:**
1. Profil → "Hesabımı Sil" → onay modal'ı: "Bu işlem geri alınamaz. Tüm konularınız, yorumlarınız ve kişisel verileriniz silinecek."
2. Şifre tekrar girilir (yanlış girilirse iptal)
3. `DELETE /users/me`
4. Backend:
   - Konuları "anonim" yazara atar (veya soft-delete)
   - Yorumları "anonim" yazara atar
   - Kullanıcı kaydını siler
   - JWT blacklist'e ekler (opsiyonel)

```ts
router.delete("/me", authMiddleware, async (req: AuthRequest, res) => {
  const { password } = req.body;
  const user = await repos.users.findById(req.userId!);
  if (!user) return res.status(404).json({ error: "Kullanıcı bulunamadı." });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: "Şifre yanlış." });

  // Anonimize et
  await repos.forum.anonymizeAuthor(req.userId!);
  await repos.users.delete(req.userId!);

  res.json({ ok: true });
});
```

---

# 👤 USR — Kullanıcı Profili

---

### USR-PRF-001: Profil Görüntüleme

**Durum:** ✅ Çalışıyor

**Endpoint:** `GET /users/me`
**Response:** `{ id, email, displayName, bio, avatar, role, userType, credits, isPremium, premiumUntil, phoneNumber, sharePhoneNumber }`
**Güvenlik:** `passwordHash` her zaman destructure ile soyuluyor.

---

### USR-PRF-002: Profil Düzenleme

**Durum:** ✅ Çalışıyor

**Endpoint:** `PATCH /users/me`

**Whitelist:** `displayName, bio, phone, avatar, userType, targetCountryId, activeGuideCountryId, sharePhoneNumber`
**Whitelist'te YOK:** `role, isPremium, premiumUntil, credits` — kullanıcı kendi rolünü/premium'unu değiştiremez.

```ts
const ALLOWED_FIELDS = ["displayName", "bio", "phone", "avatar", "userType", "targetCountryId", "activeGuideCountryId", "sharePhoneNumber"];

router.patch("/me", authMiddleware, async (req: AuthRequest, res) => {
  const updates: Record<string, unknown> = {};
  for (const key of ALLOWED_FIELDS) {
    if (req.body[key] !== undefined) updates[key] = req.body[key];
  }
  await repos.users.update(req.userId!, updates);
  const user = await repos.users.findById(req.userId!);
  const { passwordHash, ...safe } = user!;
  res.json(safe);
});
```

---

### USR-PRF-003: Bio Düzenleme

**Durum:** ✅ Çalışıyor — Max 500 karakter (Frontend) zorlanmıyor → ❌

**Çözüm:**
```tsx
<TextInput
  value={bio}
  onChangeText={setBio}
  maxLength={500}
  multiline
  placeholder="Kendini birkaç cümleyle anlat..."
/>
<Text style={{ alignSelf: "flex-end", color: bio.length > 480 ? "red" : "gray" }}>
  {bio.length} / 500
</Text>
```

---

### USR-AVT-001: Avatar Yükleme (Galeri)

**Durum:** ✅ Çalışıyor (`expo-image-picker`)

**Akış:**
1. Profil → avatar'a tıkla → `ImagePicker.launchImageLibraryAsync({ mediaTypes: Images, aspect: [1,1], quality: 0.7 })`
2. Seçilen image → base64 veya cloud upload (S3, Cloudinary) → URL
3. `PATCH /users/me { avatar: url }`

**Eksik:** Şu an base64 olarak DB'ye yazılıyor — büyük dosyalar için bu kötü. **CDN'e taşınmalı.**

---

### USR-AVT-002: Avatar Kırpma & Ön İzleme

**Durum:** ❌ Eksik

**Çözüm:** `expo-image-manipulator` ile resize + crop:
```ts
const manipulated = await ImageManipulator.manipulateAsync(
  asset.uri,
  [{ resize: { width: 256, height: 256 } }],
  { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
);
```

---

### USR-STA-001: Konu/Yorum/Adım İstatistikleri

**Durum:** ✅ Çalışıyor (`GET /users/me/stats`)

**Response:** `{ topicCount, commentCount, completedStepsCount, followingCount }`

---

### USR-STA-002: followingCount (Takip Sistemi)

**Durum:** ❌ Şu an hep `0` döner — takip sistemi yok

**Yeni Tablo:**
```sql
CREATE TABLE user_follows (
  followerId TEXT NOT NULL,
  followingId TEXT NOT NULL,
  createdAt TEXT DEFAULT now,
  PRIMARY KEY (followerId, followingId)
);
```

**Endpoint'ler:**
```
POST   /users/:id/follow
DELETE /users/:id/follow
GET    /users/:id/followers
GET    /users/:id/following
```

> **Not:** Büyük scope, MVP'de gereksiz olabilir. Sadece istatistik için tutuluyor.

---

### USR-TPC-001: Kullanıcının Açtığı Konular

**Durum:** ✅ Çalışıyor (`GET /users/me/topics`)

**Badge'ler:**
- 🟢 Yayında (approved)
- 🟡 Onay Bekliyor (pending)
- 🔴 Reddedildi (rejected) — tıklayınca sebep gösterilir

---

### USR-TPC-002: MyTopics Sayfalama

**Durum:** ❌ Sadece ilk 20

**Çözüm:** FlatList'e `onEndReached` ekle:
```tsx
<FlatList
  data={topics}
  onEndReached={loadMore}
  onEndReachedThreshold={0.5}
  ListFooterComponent={loadingMore ? <ActivityIndicator /> : null}
/>
```

---

### USR-CMT-001: Kullanıcının Yorumları

**Durum:** ✅ Çalışıyor

---

### USR-PRV-001: Telefon Numarası Paylaşımı

**Durum:** ⚠️ Kaydediliyor ama format kontrol yok

---

### USR-PRV-002: Telefon Format Validasyonu

**Durum:** ❌ Eksik

**Regex:**
```ts
const TR_PHONE = /^(\+90|0)?5\d{9}$/;
export function normalizePhoneTR(input: string): string | null {
  const digits = input.replace(/\D/g, "");
  if (digits.length === 10 && digits.startsWith("5")) return "+90" + digits;
  if (digits.length === 11 && digits.startsWith("05")) return "+90" + digits.slice(1);
  if (digits.length === 12 && digits.startsWith("90")) return "+" + digits;
  return null;  // geçersiz
}
```

---

# 💬 FRM — Forum

---

### FRM-CTY-001: Ülke Listesi

**Durum:** ✅ Çalışıyor — Bayraklı, kategori sayılı

---

### FRM-CTY-002: Ülke Arama (UI)

**Durum:** ✅ Çalışıyor (kullanıcı doğrulaması — 2026-05-19)

**Uygulanan çözüm:** Ülke listesi üstündeki search bar `c.name` + `c.code` üzerinde lowercase filtreleme yapıyor.

---

### FRM-CAT-001: Kategori Listesi

**Durum:** ✅ Çalışıyor

---

### FRM-CAT-002: Alt Kategori (Nested)

**Durum:** ⚠️ DB'de `parentId` var ama UI nested göstermiyor

**Çözüm:** Accordion ile:
```tsx
const tree = buildTree(categories);  // parentId ile groupBy
{tree.map(parent => (
  <Accordion title={parent.name}>
    {parent.children.map(child => <CategoryRow {...child} />)}
  </Accordion>
))}
```

---

### FRM-TPC-001: Konu Listesi + Sayfalama

**Durum:** ✅ Çalışıyor — `page`, `limit=20`, `totalPages`

**Filtreler:** Tümü / Popüler / Yeni
**Sıralama:** `isPinned DESC, createdAt DESC` (default)

---

### FRM-TPC-002: ⭐ Konu Açma (Tam Akış)

**Durum:** ⚠️ Backend çalışıyor ama **mobile premium state refresh** bug'ı var (kullanıcının raporu)

**Kullanıcı Hikayesi:**
> Bir kullanıcı olarak, bir kategoride yeni konu açabilmek istiyorum. Eğer premium üyeysem ücretsiz olmalı, değilsem kredi düşürülmeli. Admin onayından sonra konum yayına girmeli ve bildirim almalıyım.

**Tam Akış (12 Adım):**

```
1.  Kullanıcı kategoriye girer → ForumTopicsScreen
2.  Sağ-alt FAB (+) → CreateTopicScreen açılır
3.  Frontend kontrol: isStaff || user.isPremium ?
    ├─ EVET → İçerik bilgisi göster: "Premium üye — ücretsiz" (mor)
    └─ HAYIR → İçerik bilgisi göster: "50 kredi gerekir" (sarı)
4.  Kullanıcı başlık (≥10 karakter) + (eksik: body) yazar
5.  "Onayla ve Gönder" → validateTitle()
6.  Premium ise → direkt API çağrısı
    Değilse → CreditGateModal açılır
7.  Modal: "Bakiyeden Düş" tıklayınca → API çağrısı
8.  POST /forum/topics
    ├─ Backend isStaff veya isPremium ise → kredi DÜŞMEZ
    ├─ Değilse → deductCredits(50) → başarısız ise 402 dön
    └─ createTopic({status: isStaff ? "approved" : "pending"})
9.  Eğer pending → broadcastPendingTopic (admin SSE) + bildirim oluştur:
    "Konunuz alındı, moderatör inceliyor"
10. Eğer approved → notifyCountrySubscribers (ülke aboneleri)
11. Mobile Alert: "Konunuz alındı / Konunuz yayınlandı"
12. onCreated() → ForumTopicsScreen'e dön
```

**Alternatif Akışlar:**

| Senaryo | Backend | Frontend |
|---------|---------|----------|
| Premium kullanıcı | Kredi düşmez, `status="pending"` | "Premium üye — ücretsiz" gösterir |
| Admin/Moderator | Kredi düşmez, `status="approved"` | "Konunuz hemen yayına alındı" |
| Normal user, kredi var | 50 kredi düşer, `status="pending"` | CreditGateModal → "Bakiyeden Düş" |
| Normal user, kredi yok | 402 dön | "Yetersiz Kredi" → "Premium'a Geç" CTA |
| Konu oluşturma başarısız | **Kredi geri verilir (refund)** | "Hata: ..." |

**Hata Senaryoları:**

| Hata | HTTP | Kod | Mesaj |
|------|------|-----|-------|
| `categoryId` boş | 400 | - | "categoryId ve title zorunlu" |
| Title < 10 karakter | 400 (FE) | - | "Başlık en az 10 karakter olmalı" |
| Yetersiz kredi | 402 | INSUFFICIENT_CREDITS | "Yeni konu açmak için 50 kredi veya premium gerekli" |
| Kullanıcı bulunamadı | 401 | - | "Kullanıcı bulunamadı" |
| DB hatası | 500 | - | "Konu oluşturulamadı" + kredi iade |

**Backend Code (mevcut, route → forum.ts:32-100):**
```ts
router.post("/topics", authMiddleware, async (req: AuthRequest, res) => {
  const { categoryId, title, content } = req.body;
  if (!categoryId || !title) {
    return res.status(400).json({ error: "categoryId ve title zorunlu" });
  }

  const isStaff = req.userRole === "admin" || req.userRole === "moderator";
  if (!isStaff) {
    const user = await repos.users.findById(req.userId!);
    if (!user) return res.status(401).json({ error: "Kullanıcı bulunamadı." });

    const TOPIC_COST = config.forum.createTopicCost;  // 50
    const hasPremium = user.isPremium && (!user.premiumUntil || new Date(user.premiumUntil) > new Date());

    if (!hasPremium) {
      const deducted = await repos.users.deductCredits(req.userId!, TOPIC_COST);
      if (!deducted) {
        return res.status(402).json({
          error: `Yeni konu açmak için ${TOPIC_COST} kredi veya premium üyelik gerekli.`,
          code: "INSUFFICIENT_CREDITS",
          required: TOPIC_COST,
          balance: user.credits,
        });
      }
    }
  }

  const status = isStaff ? "approved" : "pending";
  let topic;
  try {
    topic = await repos.forum.createTopic({ categoryId, title, content, authorId: req.userId!, status, isPinned: false });
  } catch (createErr: any) {
    // Refund: konu oluşturma başarısız olursa krediyi geri ver
    if (!isStaff) {
      const u2 = await repos.users.findById(req.userId!);
      const hasPremium2 = u2?.isPremium && (!u2.premiumUntil || new Date(u2.premiumUntil) > new Date());
      if (!hasPremium2) await repos.users.addCredits(req.userId!, config.forum.createTopicCost);
    }
    return res.status(500).json({ error: createErr.message || "Konu oluşturulamadı." });
  }

  if (status === "approved") {
    repos.notifications.notifyCountrySubscribers(categoryId, topic.id, title, req.userId!).catch(() => {});
  } else {
    broadcastPendingTopic({ type: "new_pending", topic });
    repos.notifications.create({
      userId: req.userId!,
      type: "system",
      title: "Konunuz alındı",
      message: `"${title}" başlıklı konunuz moderatör incelemesine alındı. Onaylandığında size haber vereceğiz.`,
      targetType: "forum_topic",
      targetId: topic.id,
    }).catch(() => {});
  }

  res.json(topic);
});
```

**Mobile Code (mevcut, [CreateTopicScreen.tsx](mobile/src/screens/main/CreateTopicScreen.tsx)):**

Premium kontrol satırı:
```ts
const isStaff = user?.role === "admin" || user?.role === "moderator";
const isFree  = isStaff || user?.isPremium === true;   // ← Premium burada bypass yapılıyor
```

**⚠️ Kritik bug (kullanıcı raporundan):** Bkz. [PRM-EXP-003](#prm-exp-003-mobile-tarafında-premium-state-refresh)

---

### FRM-TPC-003: Konu İçeriği (Body) Alanı

**Durum:** ✅ Çalışıyor
- [CreateTopicScreen.tsx](mobile/src/screens/main/CreateTopicScreen.tsx) içinde 5000 karakter limitli multi-line `content` TextInput
- [ForumTopicDetailScreen.tsx](mobile/src/screens/main/ForumTopicDetailScreen.tsx) başlığın altında `topicContentBox` ile render
- Backend: `GET /forum/topics/:id` endpoint'i `content` + `favorited` döner
- API client: `api.forum.getTopic(topicId, token?)`

---

### FRM-TPC-004: Konu Detay

**Durum:** ✅ Çalışıyor

---

### FRM-TPC-005: Konu Düzenleme

**Durum:** ⚠️ Menü çalışıyor, edit kaydediliyor — ama düzenleme "admin onayına" gitmeli, onay beklerken konu aktif kalmalı

**Tamamlanan:**
- Backend: `PATCH /forum/topics/:id` (title + content, 24h pencere, sahibi/staff yetki kontrolü)
- Mobile: `ActionMenuModal` ile "Konuyu düzenle" + edit modal (başlık + içerik) çalışıyor
- API client: `api.forum.updateTopic(topicId, { title, content }, token)`

**🐛 Kullanıcı raporu (2026-05-19):** Düzenleme doğrudan yayına giriyor. Beklenen akış: düzenleme `pending_edit` olarak kaydedilmeli, konu orijinal haliyle aktif kalmaya devam etmeli, admin onayladıktan sonra içerik güncellenmeli.

**Gerekli:**
- Backend: `PATCH` yerine `POST /forum/topics/:id/edit-request` — `forum_edit_requests` koleksiyonuna `{ topicId, newTitle, newContent, status: "pending" }` yaz
- Mevcut topic `status` değişmemeli (aktif kalır)
- Admin panel: `GET/PATCH /admin/forum/edit-requests/:id` — onayda topic güncellenir, redde sebep bildirimi gider
- Mobile: kayıt sonrası "Düzenleme incelemeye alındı" toast göster

---

### FRM-TPC-006: Konu Silme

**Durum:** ⚠️ Menü çalışıyor, istek gönderiliyor — ama admin paneline düşmüyor

**Tamamlanan:**
- Soft delete tasarımı: kullanıcı doğrudan silemez → `forum_deletion_requests` koleksiyonuna talep yazılır, admin onaylayınca soft-delete (`deletedAt`) tetiklenir
- Backend: `POST /forum/topics/:id/deletion-request` (5+ karakter sebep zorunlu, duplicate guard)
- Admin tarafı: `GET/PATCH /admin/forum/deletion-requests/:id` — onaylanırsa `softDeleteTopic` + requester'a `deletion_approved` bildirimi
- Mobile: Konu 3-nokta menüsünde "Silme talebi gönder" + reason modal, API isteği gönderiliyor
- API client: `api.forum.requestTopicDeletion(topicId, reason, token)`

**🐛 Kullanıcı raporu (2026-05-19):** Silme isteği gönderiliyor (mobile taraf çalışıyor) ama admin paneli `GET /admin/forum/deletion-requests` altında liste gelmiyor. Backend route veya repo query sorunu olabilir.

**Kontrol edilecek:**
- `MongoForumRepository.getDeletionRequests()` — filter/projection doğru mu?
- Admin route kayıtlı mı (`adminRouter.use('/forum', forumAdminRouter)`)?
- Talep yazılınca admin'e `NTF-EVT-005` benzeri bildirim tetikleniyor mu?

UI: silinmiş konu listede gizlenir, detayda "[Bu konu silindi]" gösterilir.

---

### FRM-TPC-007: Konu Upvote (Toggle)

**Durum:** ✅ Çalışıyor — `POST /forum/topics/:id/upvote`, optimistic update

---

### FRM-TPC-008: Konu Favori / Kaydet

**Durum:** ⚠️ Toggle çalışıyor, ayrı "Favorilerim" sayfası eksik

**Tamamlanan:**
- Koleksiyon: `forumTopicFavorites (userId, topicId)` — unique index
- Backend: `POST/GET /forum/topics/:id/favorite` + `GET /users/me/favorites` (sayfalı)
- Mobile: [ForumTopicDetailScreen.tsx](mobile/src/screens/main/ForumTopicDetailScreen.tsx) `topicMeta` içinde bookmark butonu, optimistic toggle
- API client: `api.forum.toggleFavorite`, `api.forum.getFavoriteStatus`, `api.users.myFavorites`

**🐛 Kullanıcı raporu:** Profilde / başka bir yerde **"Favorilerim" sayfası** yok — kullanıcı favoriye eklediği konuları bir liste halinde göremiyor. Backend hazır (`api.users.myFavorites`), sadece UI ekranı + ProfileScreen menüsünden link eklenmesi gerekiyor.

---

### FRM-TPC-009: Konu Takip (Subscribe)

**Durum:** ✅ Çalışıyor — `POST /forum/topics/:id/subscribe` → o konuya yorum gelince bildirim

---

### FRM-TPC-010: Konu Raporlama

**Durum:** ❌ Eksik (bkz. [MOD-REP-001](#mod-rep-001-konuyorum-raporlama-akışı))

---

### FRM-TPC-011: Konu Kilitleme

**Durum:** ❌ Eksik

**Sadece admin/moderator** kilitleyebilir. Kilitli konuya yorum yazılamaz.
```ts
ALTER TABLE forum_topics ADD COLUMN isLocked BOOLEAN DEFAULT 0;

router.patch("/topics/:id/lock", authMiddleware, requireRole("admin", "moderator"), async (req, res) => {
  const { isLocked } = req.body;
  await repos.forum.lockTopic(req.params.id, isLocked);
  res.json({ ok: true });
});

// createComment içinde:
if (topic.isLocked) return res.status(403).json({ error: "Bu konu yorumlara kapatılmıştır." });
```

---

### FRM-TPC-012: Konu Paylaşma (Deep Link)

**Durum:** ⚠️ Deep link çalışıyor (`goworldy://topic/:id`) ama UI'da "Paylaş" butonu yok

**Çözüm:**
```tsx
import { Share } from "react-native";
<TouchableOpacity onPress={() => Share.share({
  message: `${topic.title}\n\nGoWorldy'de oku: goworldy://topic/${topic.id}`,
  url: `https://goworldy.com/topic/${topic.id}`,  // web fallback
  title: topic.title,
})}>
  <Ionicons name="share-outline" size={24} />
</TouchableOpacity>
```

---

### FRM-TPC-013: Popüler Filtre

**Durum:** ⚠️ Şu an sadece `commentCount`'a bakıyor — upvote dahil değil

**Çözüm:**
```ts
// repository
async getTopics(categoryId, { filter, page, limit }) {
  let sort = { isPinned: -1, createdAt: -1 };
  if (filter === "popular") {
    sort = { isPinned: -1, "score": -1 };  // score = upvotes * 2 + commentCount
  }
  // ...
}
```

veya aggregation:
```js
{ $addFields: { score: { $add: [{ $multiply: ["$upvotes", 2] }, "$commentCount"] } } }
{ $sort: { isPinned: -1, score: -1 } }
```

---

### FRM-CMT-001 — FRM-CMT-007: Yorum CRUD

| ID | Özellik | Durum | Not |
|----|---------|-------|-----|
| FRM-CMT-001 | Yorum listesi | ✅ | `GET /forum/topics/:id/comments` (anonim de görür, viewerId ile `hasLiked` dahil) |
| FRM-CMT-002 | Yorum yazma | ✅ | Yorum sonrası `notifyTopicSubscribers` tetikliyor |
| FRM-CMT-003 | Yorum düzenleme | ⚠️ | Menü açılıyor, ama yalnızca ilk 15 dk çalışıyor — zaman penceresi validasyonu gözden geçirilmeli, 2026-05-19 |
| FRM-CMT-004 | Yorum silme | ❌ | Menü açılıyor ama silme gerçekleşmiyor — backend/API bağlantısı kontrol edilmeli, 2026-05-19 |
| FRM-CMT-005 | Yorum beğenme | ✅ | `forumCommentLikes` + heart toggle, sahibine `comment_like` bildirimi |
| FRM-CMT-006 | Yorum yanıtlama (nested) | ✅ | 3-state collapse (collapsed/partial/expanded), default ilk 2 reply görünür, 2026-05-19 |
| FRM-CMT-007 | Yorum raporlama | ⚠️ | Backend + report modal hazır, ama 3-nokta açılmıyor |

**🐛 Kullanıcı raporu (2026-05-18):**

1. **FRM-CMT-003 / 004 / 007 — 3-nokta menüsü açılmıyor.** [ForumTopicDetailScreen.tsx](mobile/src/screens/main/ForumTopicDetailScreen.tsx:434) içindeki `CommentRow → TouchableOpacity onPress={onMenu}` tetiklenmiyor. `onMenu` → `showCommentMenu(item)` → `Alert.alert(..., options)` zinciri çalışmıyor. İhtimaller:
   - `loggedIn && !comment.deletedAt` koşulu `false` (token null gelmiş olabilir)
   - `commentHeaderRight` flex layout ikonu kaplıyor, tap target etkisiz
   - `Pressable` denenmeli veya `onPressIn` log'la
2. **FRM-CMT-006 — Collapse iyileştirmesi:** Şu an top-level yorumlar her zaman replies'lerini açık gösteriyor (kullanıcı manuel "gizle" derse gizleniyor). İstenen davranış: **default sadece ilk 1-2 yanıt görünür, "X yanıtı daha göster" butonu**. "Gizle"ye basınca **hepsi gizlenir**.

---

# 💎 PRM — Premium Abonelik

---

### PRM-PKG-001: Paket Listesi

**Durum:** ✅ `GET /payment/packages` — credits_pack (99TL), premium_weekly (199TL), premium_monthly (299TL)

---

### PRM-PKG-002: Aktif Paket Banner

**Durum:** ⚠️ HomeScreen'de gösteriliyor ama fiyat hardcoded

---

### PRM-PKG-003: Fiyat API'dan Çekme

**Durum:** ❌ `HomeScreen.tsx:232`'de "250 TL" hardcoded

**Çözüm:** Mount'ta `GET /payment/packages` çağır, `weekly.priceTL`'yi göster.

---

### PRM-SUB-001: Haftalık Premium Satın Alma

**Durum:** ✅ Mock akış çalışıyor (`POST /payment/process { productType: "premium_weekly" }`)

**Backend Side Effect:**
- `user.isPremium = true`
- `user.premiumUntil = now + 7 gün` (mevcut premium varsa üzerine ekler)

---

### PRM-SUB-002: Aylık Premium Satın Alma

**Durum:** ✅ Aynı pattern, 30 gün

---

### PRM-SUB-003: Aktif Aboneliği Görüntüleme

**Durum:** ✅ PremiumScreen'de "Kalan süre: 5 gün 3 saat" gösteriyor

---

### PRM-SUB-004: Abonelik İptali

**Durum:** ❌ Eksik

**Akış:**
1. PremiumScreen → "Aboneliği İptal Et"
2. Onay: "İptal etsen bile mevcut sürenin sonuna kadar kullanabilirsin"
3. `POST /premium/cancel` → `autoRenew: false` set et
4. Stripe API ile Stripe subscription'ı cancel et

---

### PRM-EXP-001: Süre Dolma Otomatik Kapatma

**Durum:** ❌ `premiumUntil` geçtikten sonra `isPremium` otomatik false yapılmıyor

**Çözüm 1 — Cron job (her gün gece 00:00):**
```ts
// api/src/jobs/expirePremium.ts
import cron from "node-cron";

cron.schedule("0 0 * * *", async () => {
  const result = await db.collection("users").updateMany(
    { isPremium: true, premiumUntil: { $lt: new Date().toISOString() } },
    { $set: { isPremium: false } }
  );
  console.log(`[CRON] Premium expired for ${result.modifiedCount} users`);
});
```

**Çözüm 2 — Lazy check (her `findById` çağrısında):**
```ts
async findById(id: string) {
  const user = await this.col.findOne({ _id: id });
  if (user?.isPremium && user.premiumUntil && new Date(user.premiumUntil) < new Date()) {
    await this.col.updateOne({ _id: id }, { $set: { isPremium: false } });
    user.isPremium = false;
  }
  return user;
}
```

> Çözüm 2 daha güvenli — cron unutulursa bile düzeltir.

---

### PRM-EXP-002: Süre Dolma Bildirimi

**Durum:** ❌ Eksik

**Akış:**
- 3 gün kala bildirim: "Premium üyeliğin 3 gün sonra sona eriyor. Yenilemek için tıkla."
- 1 gün kala bildirim: "Premium üyeliğin yarın sona eriyor!"
- Bittiğinde: "Premium üyeliğin sona erdi. Avantajlardan yararlanmak için yenile."

**Cron Job:**
```ts
cron.schedule("0 9 * * *", async () => {  // her gün sabah 9
  const threeDays = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
  const oneDay = new Date(Date.now() + 24 * 60 * 60 * 1000);

  const expiringSoon = await db.collection("users").find({
    isPremium: true,
    premiumUntil: { $gte: oneDay.toISOString(), $lte: threeDays.toISOString() }
  }).toArray();

  for (const u of expiringSoon) {
    await repos.notifications.create({
      userId: u.id,
      type: "premium_expiring",
      title: "Premium üyeliğin sona eriyor",
      message: "Avantajlardan yararlanmaya devam etmek için yenile.",
      targetType: "premium",
    });
  }
});
```

---

### PRM-EXP-003: ⚠️ Mobile Tarafında Premium State Refresh

**Durum:** ❌ Eksik — **KULLANICI YENİDEN DOĞRULADI (2026-05-18):** "Premium aldım, forum'a gelip konu açmaya çalıştım ama beni hala premiumlu olarak görmüyor."

**⛔ Blocker etkisi:** Bu bug yüzünden NTF-EVT-001..005 testleri de yapılamıyor — premium kullanıcı pending flow'a giremediği için bildirimler tetiklenmiyor; non-premium kullanıcı kredi yetersizliğinden konu açamıyor.

**Kök Neden:**
- Kullanıcı premium aldıktan sonra `AuthContext.user.isPremium` hala `false`
- Çünkü `AuthContext` sadece login'de set ediliyor, premium satın alımında refresh edilmiyor
- `CreateTopicScreen` `user?.isPremium === true` kontrolüne bakıyor → `false` → "ücretlidir" mesajı

**Çözüm — AuthContext'e refresh fonksiyonu:**
```ts
// mobile/src/context/AuthContext.tsx
export const AuthContext = createContext<{
  user: User | null;
  token: string | null;
  refresh: () => Promise<void>;
  logout: () => void;
}>(/* ... */);

export function AuthProvider({ children }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  const refresh = async () => {
    if (!token) return;
    const fresh = await api.users.me(token);
    setUser(fresh);
    await AsyncStorage.setItem("user", JSON.stringify(fresh));
  };

  return <AuthContext.Provider value={{ user, token, refresh, logout }}>{children}</AuthContext.Provider>;
}
```

**Payment Success Sonrası:**
```ts
// mobile/src/screens/main/PaymentScreen.tsx
const handlePay = async () => {
  await api.payment.process(productType, token);
  await refresh();  // ← user.isPremium = true güncellenir
  Alert.alert("Başarılı", "Premium üyelik aktif edildi!");
  navigation.goBack();
};
```

**Bonus — Otomatik periodik refresh (her tab değişiminde):**
```ts
// AppNavigator.tsx
useEffect(() => {
  const interval = setInterval(refresh, 60_000);  // 1 dakikada bir
  return () => clearInterval(interval);
}, [refresh]);
```

---

# 💳 PAY — Ödeme Sistemi

---

### PAY-CHK-001: Stripe Checkout Session

**Durum:** 🔒 Stripe Price ID'leri stakeholder'dan bekleniyor

```ts
router.post("/checkout", authMiddleware, async (req: AuthRequest, res) => {
  const { productType, successUrl, cancelUrl } = req.body;
  const priceId = PRICE_MAP[productType];
  if (!priceId) return res.status(400).json({ error: `'${productType}' için Stripe fiyatı yapılandırılmamış.` });
  const result = await repos.payment.createCheckoutSession({ userId: req.userId!, priceId, productType, successUrl, cancelUrl });
  res.json(result);  // { url: "https://checkout.stripe.com/..." }
});
```

---

### PAY-CHK-002: Mock Ödeme

**Durum:** ✅ `POST /payment/process { productType }` — Stripe olmadan anlık grant

---

### PAY-WBH-001: Stripe Webhook İşleme

**Durum:** 🔒 Yapılmadı

```ts
router.post("/webhook", express.raw({ type: "application/json" }), async (req, res) => {
  const sig = req.headers["stripe-signature"] as string;
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, config.stripe.webhookSecret);
  } catch (e: any) {
    return res.status(400).send(`Webhook Error: ${e.message}`);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const userId = session.metadata.userId;
    const productType = session.metadata.productType;
    // Grant credits or premium
    if (productType === "credits_pack") await repos.users.addCredits(userId, 50);
    else if (productType === "premium_weekly") await grantPremium(userId, 7);
    else if (productType === "premium_monthly") await grantPremium(userId, 30);
  }
  res.json({ received: true });
});
```

---

### PAY-SPN-001: Kredi Harcama

**Durum:** ✅ `POST /payment/spend-credit { actionType }` — 50 kredi düşer, 30 günlük feature grant eder

---

### PAY-SPN-002: "Zaten Sahipsiniz" 409

**Durum:** ✅ `userFeatures.hasFeature()` ile kontrol, varsa 409 dön

---

### PAY-HST-001: Ödeme Geçmişi

**Durum:** ❌ Eksik

```sql
CREATE TABLE payment_history (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  productType TEXT NOT NULL,
  amountTL INTEGER NOT NULL,
  stripeSessionId TEXT,
  status TEXT,  -- succeeded, failed, refunded
  createdAt TEXT DEFAULT now
);
```

Endpoint: `GET /payment/history` — Profil → "Ödeme Geçmişi"

---

### PAY-INV-001: Fatura PDF İndirme

**Durum:** ❌ Eksik

Stripe `invoice.pdf` URL'ini sakla, "İndir" butonu ile aç.

---

### PAY-RFD-001: İade Talebi

**Durum:** ❌ Eksik

UI: Ödeme detayında "İade Talebi Oluştur" → Admin'e gider, manuel işlenir.

---

# 🪙 CRD — Kredi Sistemi

---

### CRD-BAL-001: Kredi Bakiyesi Sorgu

**Durum:** ✅ `user.credits` her API çağrısında dönüyor

---

### CRD-BAL-002: Header'da Bakiye Her Zaman Görünür

**Durum:** ❌ Eksik

**Çözüm:** Tab bar'ın üstüne ince bir bar:
```tsx
<View style={styles.creditBar}>
  <FontAwesome5 name="coins" size={14} color="#F59E0B" />
  <Text>{user?.credits ?? 0} kredi</Text>
  {user?.isPremium && <Text style={{ color: "#7C3AED" }}>💎 Premium</Text>}
</View>
```

---

### CRD-DED-001: Atomik Kredi Düşme

**Durum:** ⚠️ Şu an `deductCredits` ile `createTopic` ayrı işlemler — DB transaction yok. Aralarında crash olsa krediler kaybolabilir.

**MongoDB Çözüm (atomic with $cond):**
```ts
async deductCredits(userId: string, amount: number): Promise<boolean> {
  const result = await this.col.findOneAndUpdate(
    { _id: userId, credits: { $gte: amount } },  // ← yeterli kredi varsa
    { $inc: { credits: -amount } },
    { returnDocument: "after" }
  );
  return result.value !== null;  // null = yeterli kredi yoktu
}
```

Bu atomik bir işlem — race condition oluşmaz.

---

### CRD-RFD-001: Başarısız İşlemde Kredi İadesi

**Durum:** ✅ Çalışıyor (forum.ts:71-79 try/catch)

---

### CRD-RWD-001: Haftalık Otomatik Kredi Ödülü

**Durum:** ❌ Config'de `weeklyTopicReward: 1` var ama kullanılmıyor

**Cron Job (her Pazartesi sabah 9):**
```ts
cron.schedule("0 9 * * 1", async () => {
  const reward = config.forum.weeklyTopicReward;  // 1 kredi
  await db.collection("users").updateMany({}, { $inc: { credits: reward } });
  // ya da sadece aktif kullanıcılara
});
```

Bildirim: "Bu haftaki kredi ödülün hesabına eklendi! 🎁"

---

### CRD-HST-001: Kredi Geçmişi

**Durum:** ❌ Eksik

```sql
CREATE TABLE credit_transactions (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  amount INTEGER NOT NULL,  -- pozitif = kazanım, negatif = harcama
  reason TEXT,  -- topic_create, comment_create, weekly_reward, purchase, refund
  refType TEXT,
  refId TEXT,
  createdAt TEXT DEFAULT now
);
```

Endpoint: `GET /users/me/credit-history`
UI: Profil → "Kredi Hareketleri"

---

### CRD-LOW-001: Düşük Bakiye Erken Uyarı

**Durum:** ❌ Eksik

Kullanıcı 10 kredinin altına düştüğünde:
- HomeScreen'de banner: "Kredilerin bitmek üzere — Premium'a geç, sınırsız kullan"
- Bir kerelik bildirim

---

# 🔔 NTF — Bildirim Sistemi

---

### NTF-INA-001: In-App Bildirim Listesi

**Durum:** ✅ `GET /notifications` — NotificationsScreen'de gösteriliyor

---

### NTF-INA-002: Okunmamış Sayısı (Badge)

**Durum:** ❌ Bildirim gelince tab bar ikonu real-time yanmıyor (kırmızı badge güncellenmez)

**🐛 Kullanıcı raporu (2026-05-19):** Yeni bildirim geldiğinde (yorum, upvote vb.) tab bar'daki bildirim ikonu kırmızı yanmıyor. Uygulama yeniden açılınca veya bildirim ekranına gidilince sayı görünür — yani veri geliyor ama badge real-time güncellenmiyor.

**Gerekli:** WebSocket veya polling mekanizması — `NotificationsContext` (veya `useNotifications` hook) periyodik olarak `GET /notifications/unread-count` çağırmalı ya da backend'den socket event'i dinlemeli. Badge count state yukarı kaldırılmalı (tab navigator seviyesine).

---

### NTF-INA-003: Okundu İşaretle

**Durum:** ⚠️ `PATCH /:id/read` çağrısı yapılıyor ama badge real-time düşmüyor

**🐛 Kullanıcı raporu (2026-05-19):** Bildirime tıklanıp "okundu" işaretlenince bildirim ekranında kaybolmuyor / badge sayısı anlık güncellenmıyor. Sayfa yenilenince doğru görünüyor — local state güncellenmesi eksik veya badge count yeniden çekilmiyor.

---

### NTF-INA-004: Tümünü Okundu

**Durum:** ✅ `PATCH /read-all`

---

### NTF-INA-005: Bildirimi Silme

**Durum:** ❌ Eksik

```ts
router.delete("/:id", authMiddleware, async (req, res) => {
  const deleted = await repos.notifications.deleteOwned(req.params.id, req.userId!);
  if (!deleted) return res.status(403).json({ error: "Yetkiniz yok." });
  res.json({ ok: true });
});
```

UI: Swipe-to-delete (`react-native-gesture-handler` ile)

---

### NTF-INA-006: Bildirim Gruplama

**Durum:** ❌ Eksik

Aynı konuda 3 farklı kişi yorum yapınca tek bildirim:
```
"Ahmet, Mehmet ve Ayşe 'Almanya vize' konusuna yorum yaptı"
```

**Çözüm:** Backend'de aggregate veya frontend'de groupBy:
```ts
const grouped = notifications.reduce((acc, n) => {
  const key = `${n.type}-${n.targetId}`;
  if (acc[key]) acc[key].push(n);
  else acc[key] = [n];
  return acc;
}, {});
```

---

### NTF-EVT-001: "Konunuz Alındı" Bildirimi

**Durum:** ✅ `forum.ts:89-96`'da otomatik tetikleniyor

```
Title:   "Konunuz alındı"
Message: "\"{title}\" başlıklı konunuz moderatör incelemesine alındı. Onaylandığında size haber vereceğiz."
Type:    system
Target:  forum_topic / {topicId}
```

---

### NTF-EVT-002: "Konunuz Onaylandı 🎉" Bildirimi

**Durum:** ✅ `forum.ts:135-149`'da `PATCH /topics/:id/status` ile tetikleniyor

```
Title:   "İlanınız onaylandı 🎉"
Message: "\"{title}\" başlıklı ilanınız onaylanmıştır! Artık herkes görebilir."
```

---

### NTF-EVT-003: "Konunuz Reddedildi (Sebep)" Bildirimi

**Durum:** ✅ Çalışıyor — `reason` alanı dahil

```
Title:   "İlanınız reddedildi"
Message: "\"{title}\" başlıklı ilanınız reddedilmiştir. Sebep: {reason}"
```

---

### NTF-EVT-004: "Yeni Yorum" Bildirimi

**Durum:** ✅ `notifyTopicSubscribers` ile çalışıyor

```
Title:   "Yeni yorum"
Message: "{commentAuthorName}, takip ettiğin \"{topicTitle}\" konusuna yorum yaptı."
```

---

### NTF-EVT-005: "Admin'e Yeni Pending Konu" Bildirimi

**Durum:** ⚠️ SSE ile broadcast yapılıyor ama **push notification yok**. Admin uygulamayı açmadığı sürece haber alamıyor.

**Çözüm:**
```ts
// forum.ts içinde, pending oluştuktan sonra:
const admins = await repos.users.findByRole("admin");
const moderators = await repos.users.findByRole("moderator");
const allStaff = [...admins, ...moderators];

for (const staff of allStaff) {
  await repos.notifications.create({
    userId: staff.id,
    type: "admin_new_pending",
    title: "Yeni onay bekleyen konu",
    message: `${user.displayName}: "${title}"`,
    targetType: "admin_topic_queue",
    targetId: topic.id,
  });

  // Push notification (Expo)
  if (staff.expoPushToken) {
    await sendPushNotification(staff.expoPushToken, {
      title: "🆕 Yeni pending konu",
      body: `${user.displayName}: ${title}`,
      data: { screen: "AdminTopicReview", topicId: topic.id },
    });
  }
}
```

---

### NTF-EVT-006: "Premium Süresi Dolmak Üzere"

**Durum:** ❌ Eksik — bkz. [PRM-EXP-002](#prm-exp-002-süre-dolma-bildirimi-3-gün-önce)

---

### NTF-SUB-001: Ülke Aboneliği

**Durum:** ✅ `PATCH /subscriptions/:countryId { subscribed: true }`

Bir ülkeye abone olan kullanıcı, o ülkeye yeni konu açılınca bildirim alır.

---

### NTF-PSH-001: Expo Push Notification

**Durum:** ❌ Eksik — `EXPO_ACCESS_TOKEN` config'de var ama implementation yok

**Service:**
```ts
// api/src/services/push.ts
import { Expo, ExpoPushMessage } from "expo-server-sdk";
const expo = new Expo({ accessToken: config.expo.accessToken });

export async function sendPushNotification(
  token: string,
  payload: { title: string; body: string; data?: Record<string, unknown> }
) {
  if (!Expo.isExpoPushToken(token)) return;
  const message: ExpoPushMessage = {
    to: token,
    sound: "default",
    title: payload.title,
    body: payload.body,
    data: payload.data ?? {},
    badge: 1,
  };
  await expo.sendPushNotificationsAsync([message]);
}
```

**Mobile — token kayıt:**
```ts
// mobile/src/services/notifications.ts
import * as Notifications from "expo-notifications";

export async function registerForPush(token: string) {
  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;
  if (existing !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== "granted") return;
  const pushToken = (await Notifications.getExpoPushTokenAsync()).data;
  await api.users.updateMe({ expoPushToken: pushToken }, token);
}
```

**Login sonrası:**
```ts
await login(email, password);
await registerForPush(token);
```

---

### NTF-EML-001: E-posta Bildirimi (SendGrid)

**Durum:** 🔒 SendGrid API key bekleniyor

E-posta tetiklenecek olaylar:
- Şifre sıfırlama (✅ kod hazır)
- Konu onaylandı/reddedildi (opsiyonel — kullanıcı tercihi)
- Premium süresi dolma uyarısı
- Yeni admin pending konu (admin'e)

---

# 🛡️ ADM — Admin Paneli

---

### ADM-DSH-001: Dashboard İstatistikleri

**Durum:** ✅ `GET /admin/dashboard` — totalUsers, totalTopics, totalComments, totalCountries, userTypes, recentUsers

---

### ADM-USR-001: Kullanıcı Listesi + Arama

**Durum:** ✅ `GET /admin/users?search=&role=&userType=&limit=&offset=`

---

### ADM-USR-002: Rol Atama

**Durum:** ✅ `PATCH /admin/users/:id/role { role }` — sadece admin

---

### ADM-USR-003: Manuel Premium Grant

**Durum:** ✅ `POST /admin/premium/users/:id/grant { planId, durationDays }`

Manuel iptal: `DELETE /admin/premium/users/:id/grant`

---

### ADM-USR-004: Kullanıcı Banlama

**Durum:** ❌ Eksik

```sql
ALTER TABLE users ADD COLUMN isBanned BOOLEAN DEFAULT 0;
ALTER TABLE users ADD COLUMN bannedUntil TEXT;
ALTER TABLE users ADD COLUMN banReason TEXT;
```

```ts
router.patch("/users/:id/ban", authMiddleware, requireRole("admin"), async (req, res) => {
  const { reason, days } = req.body;  // days null = kalıcı
  const bannedUntil = days ? new Date(Date.now() + days * 86400_000).toISOString() : null;
  await repos.users.update(req.params.id, { isBanned: true, bannedUntil, banReason: reason });
  res.json({ ok: true });
});

// login middleware kontrolü
if (user.isBanned && (!user.bannedUntil || new Date(user.bannedUntil) > new Date())) {
  return res.status(403).json({ error: `Hesabınız askıya alındı. Sebep: ${user.banReason}` });
}
```

---

### ADM-MOD-001: Pending Konu Kuyruğu

**Durum:** ✅ `GET /admin/forum/pending?limit=&offset=`

---

### ADM-MOD-002: Konu Onayla

**Durum:** ✅ `PATCH /forum/topics/:id/status { status: "approved" }`

Tetiklenen yan etkiler:
- Yazara bildirim (NTF-EVT-002)
- Ülke abonelerine bildirim (NTF-SUB-001)

---

### ADM-MOD-003: Konu Reddet (Sebep Zorunlu)

**Durum:** ✅ `PATCH /forum/topics/:id/status { status: "rejected", reason }`

**Admin UI:** Reddet butonu → Modal: "Reddetme sebebi (zorunlu)" textarea → en az 10 karakter

---

### ADM-MOD-004: SSE Gerçek Zamanlı Akış

**Durum:** ✅ `GET /admin/topics/stream?token=...`

EventSource ile bağlanır, yeni pending konu gelince anında listeye eklenir.

```ts
const es = new EventSource(`/admin/topics/stream?token=${token}`);
es.onmessage = (e) => {
  const data = JSON.parse(e.data);
  if (data.type === "new_pending") {
    setPendingTopics(prev => [data.topic, ...prev]);
    new Audio("/ding.mp3").play();  // ses uyarısı
  }
};
```

---

### ADM-MOD-005: Admin'e Push + Email

**Durum:** ❌ Eksik — bkz. [NTF-EVT-005](#ntf-evt-005-admine-yeni-pending-konu)

---

### ADM-CFG-001: Config Okuma

**Durum:** ✅ `GET /admin/config` — read-only

---

### ADM-CFG-002: Pricing Güncelleme

**Durum:** ❌ Eksik

```ts
router.patch("/config/forum/pricing", authMiddleware, requireRole("admin"), async (req, res) => {
  const { createTopicCost, commentAccessCost, weeklyTopicReward } = req.body;
  // Validate
  if (createTopicCost != null && (createTopicCost < 0 || createTopicCost > 1000)) {
    return res.status(400).json({ error: "Kredi 0-1000 arasında olmalı." });
  }
  // Persist to DB (config_overrides table) — env değişikenleri runtime'da değişmez
  await repos.config.updateForumPricing({ createTopicCost, commentAccessCost, weeklyTopicReward });
  res.json({ ok: true });
});
```

**Admin UI:** Config Panel — slider veya number input + "Kaydet" + onay modal'ı

---

# ⚖️ MOD — Moderasyon

---

### MOD-REP-001: Konu/Yorum Raporlama Akışı

**Durum:** ❌ Eksik

**Kullanıcı Akışı:**
1. Konu/yorum yanındaki "⋮" → "Raporla"
2. Modal: Sebep seç (Spam / Küfür / Yanıltıcı / Telif / Diğer)
3. Açıklama (opsiyonel)
4. Gönder

**Tablo:**
```sql
CREATE TABLE content_reports (
  id TEXT PRIMARY KEY,
  reporterId TEXT NOT NULL,
  targetType TEXT NOT NULL,  -- topic, comment, user
  targetId TEXT NOT NULL,
  reason TEXT NOT NULL,  -- spam, abuse, misleading, copyright, other
  description TEXT,
  status TEXT DEFAULT 'pending',  -- pending, resolved, dismissed
  createdAt TEXT DEFAULT now,
  resolvedBy TEXT,
  resolvedAt TEXT
);
```

**Endpoint:**
```ts
router.post("/reports", authMiddleware, async (req: AuthRequest, res) => {
  const { targetType, targetId, reason, description } = req.body;
  // Aynı kullanıcı aynı içeriği tekrar raporlayamaz
  const existing = await repos.reports.findByUserAndTarget(req.userId!, targetType, targetId);
  if (existing) return res.status(409).json({ error: "Bu içeriği zaten raporladın." });

  await repos.reports.create({ reporterId: req.userId!, targetType, targetId, reason, description });
  res.json({ ok: true });
});
```

---

### MOD-REP-002: Rapor Kuyruğu (Admin Panel)

**Durum:** ❌ Eksik

Admin: `GET /admin/reports?status=pending` → liste → her satırda "İçeriği Sil" / "Reddet" / "Kullanıcıyı Uyar"

---

### MOD-BAN-001: Kullanıcı Susturma (Mute)

**Durum:** ❌ Eksik

Mute = kullanıcı login olabilir ama konu/yorum yazamaz.

```sql
ALTER TABLE users ADD COLUMN mutedUntil TEXT;
```

```ts
// createTopic ve createComment içinde
if (user.mutedUntil && new Date(user.mutedUntil) > new Date()) {
  return res.status(403).json({
    error: `Susturuldunuz. ${user.mutedUntil} tarihine kadar konu/yorum yazamazsınız.`,
    code: "USER_MUTED"
  });
}
```

---

### MOD-BAN-002: Kalıcı Ban

**Durum:** ❌ Eksik — bkz. [ADM-USR-004](#adm-usr-004-kullanıcı-banlama)

---

### MOD-DEL-001: Soft Delete

**Durum:** ❌ Eksik

```sql
ALTER TABLE forum_topics ADD COLUMN deletedAt TEXT;
ALTER TABLE forum_topics ADD COLUMN deletedBy TEXT;
ALTER TABLE forum_comments ADD COLUMN deletedAt TEXT;
```

Liste sorgularında `WHERE deletedAt IS NULL`.
Eğer silinmişse UI'da gri kutu: "[Bu içerik kaldırıldı]"

---

### MOD-SPM-001: Otomatik Spam Filtresi

**Durum:** ❌ Eksik

Basit kurallar:
- Aynı içeriği 3+ kez gönderme → spam
- Aynı kullanıcıdan 5+ konu 1 saat içinde → rate limit
- URL içeren konularda yeni kullanıcı → manuel onay

```ts
async function detectSpam(content: string, userId: string): Promise<boolean> {
  // Tekrarlanan içerik
  const recent = await repos.forum.getRecentByUser(userId, 24);  // son 24 saat
  if (recent.some(t => t.content === content)) return true;

  // Çok URL içeriyor
  const urlCount = (content.match(/https?:\/\//g) ?? []).length;
  if (urlCount > 3) return true;

  // Küfür filtresi
  if (BANNED_WORDS.some(w => content.toLowerCase().includes(w))) return true;

  return false;
}
```

---

# 📘 GDE — Rehber Sistemi

---

### GDE-STP-001: Adım Listesi

**Durum:** ✅ `GET /guide/steps/:countryId`

---

### GDE-STP-002: Blocking Answer Engeli

**Durum:** ⚠️ Handler doğru (`computeVisibleUpTo`) ama UI bloke görseli eksik

Örnek: "Türk vatandaşı mısın?" → "Hayır" cevabı verilirse sonraki adımlar kilitlenir, "Bu adımdan sonrası senin durumun için uygulanmıyor" gösterilir.

---

### GDE-PRG-001: Adım Cevaplama

**Durum:** ✅ `POST /guide/progress`

---

### GDE-PRG-002: Upsert (Aynı Adımı Tekrar Yazma)

**Durum:** ⚠️ Şu an INSERT yapıyor — duplicate satırlar oluşuyor

**Çözüm:**
```ts
async saveProgress(userId: string, stepId: string, answer: string) {
  await this.col.updateOne(
    { userId, stepId },
    { $set: { answer, completedAt: new Date().toISOString() } },
    { upsert: true }
  );
}
```

---

### GDE-PRG-003: Completion Yüzdesi

**Durum:** ✅ `GET /guide/home-stats` → `completionPct`

---

### GDE-CMP-001: Tamamlama Rozeti

**Durum:** ❌ Eksik

%100 tamamlandığında:
- Bildirim: "🏆 Almanya rehberini tamamladın! Tebrikler!"
- Profilde rozet: "Almanya Mezunu" badge

---

### GDE-RCM-001: Akıllı Adım Önerisi

**Durum:** ❌ Eksik

HomeScreen'de: "Sıradaki adım: Pasaport başvurusu" → tıklayınca direkt o adıma git

---

### GDE-ADM-001: Admin Rehber Adımı Ekleme

**Durum:** ❌ Eksik

Admin panel: ülke seç → adım listesi → "+ Yeni Adım" → order, question, description, blocking

---

# 🔍 SRC — Arama

---

### SRC-TPC-001: Konu Arama

**Durum:** ✅ `GET /forum/search?q=&countryId=` — min 2 karakter, NoSQL injection korumalı

---

### SRC-TPC-002: Highlight

**Durum:** ❌ Eksik

```tsx
function highlight(text: string, query: string) {
  const parts = text.split(new RegExp(`(${escapeRegex(query)})`, "gi"));
  return parts.map((p, i) =>
    p.toLowerCase() === query.toLowerCase()
      ? <Text key={i} style={{ backgroundColor: "yellow" }}>{p}</Text>
      : <Text key={i}>{p}</Text>
  );
}
```

---

### SRC-CAT-001: Kategori İçi Arama

**Durum:** ❌ Eksik — `GET /forum/categories/:id/topics?q=...`

---

### SRC-USR-001: Admin Kullanıcı Arama

**Durum:** ✅ `GET /admin/users?search=...`

---

# 🔒 SEC — Güvenlik & Validasyon

---

### SEC-VAL-001: Zod Server-side Validation

**Durum:** ⚠️ Zod kurulu ama route'ların çoğunda kullanılmıyor

**Pattern:**
```ts
import { z } from "zod";

const Body = z.object({
  categoryId: z.string().min(1),
  title: z.string().min(10).max(120),
  content: z.string().max(5000).optional(),
});

router.post("/topics", authMiddleware, async (req, res) => {
  const parse = Body.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ error: "Validation error", details: parse.error.flatten() });
  }
  const { categoryId, title, content } = parse.data;
  // ... use parsed data
});
```

Tüm route'lara uygulanmalı.

---

### SEC-VAL-002: NoSQL Injection Koruması

**Durum:** ✅ `/forum/search`'de var (`typeof string`, `$` ile başlayan reddediliyor)

Diğer route'lara da uygulanmalı.

---

### SEC-RTL-001: /auth/* Rate Limit

**Durum:** ❌ Eksik

```ts
import rateLimit from "express-rate-limit";

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 dakika
  max: 5,                     // IP başına 5 deneme
  message: { error: "Çok fazla deneme. 15 dakika sonra tekrar dene." },
  standardHeaders: true,
});

app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);
app.use("/api/auth/forgot-password", authLimiter);
```

---

### SEC-RTL-002: Konu/Yorum Rate Limit

**Durum:** ❌ Eksik

```ts
const contentLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 3,  // dakikada 3 konu/yorum
  keyGenerator: (req) => (req as AuthRequest).userId ?? req.ip,
  message: { error: "Çok hızlı gönderiyorsun. Lütfen bekle." },
});

app.use("/api/forum/topics", contentLimiter);
app.use("/api/forum/topics/:id/comments", contentLimiter);
```

---

### SEC-COR-001: CORS Whitelist

**Durum:** ❌ Şu an wildcard `cors()`

```ts
const allowedOrigins = config.app.allowedOrigins.split(",");
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) cb(null, true);
    else cb(new Error("CORS reddedildi"));
  },
  credentials: true,
}));
```

---

### SEC-SAN-001: XSS Sanitization

**Durum:** ❌ Eksik

Konu/yorum içeriği HTML render edilirse XSS riski var.

**Çözüm:**
```ts
import sanitizeHtml from "sanitize-html";

const cleanContent = sanitizeHtml(content, {
  allowedTags: ["b", "i", "em", "strong", "a", "p", "br", "ul", "ol", "li"],
  allowedAttributes: { "a": ["href", "target"] },
  allowedSchemes: ["http", "https", "mailto"],
});
```

---

### SEC-PWD-001: Bcrypt Hash (Cost 12)

**Durum:** ✅ `bcrypt.hash(password, 12)`

---

### SEC-PWD-002: passwordHash Asla Dönmeme

**Durum:** ✅ Tüm `/users` route'larında destructure ile soyuluyor

---

# 🐛 P0 Kritik Bug'lar (Kullanıcı Raporundan)

Bu bug'lar **kullanıcı tarafından canlıda tespit edildi**, en yüksek öncelikte.

---

### BUG-001: Premium User Hala "Ücretlidir" Görüyor

**Feature:** [PRM-EXP-003](#prm-exp-003-mobile-tarafında-premium-state-refresh)

**Sorun:** Premium satın aldıktan sonra `AuthContext.user.isPremium` cache'de kalıyor.

**Hızlı Test:**
```bash
# 1. Login
curl -X POST http://localhost:3000/api/auth/login -d '{"email":"u@u.com","password":"123456"}'
# 2. Premium al
curl -X POST http://localhost:3000/api/payment/process -H "Authorization: Bearer X" -d '{"productType":"premium_weekly"}'
# 3. Bakım: response.isPremium = true ✓
# 4. Ama mobile uygulama logout-login yapmadan eski state'i gösterir ❌
```

**Çözüm:** Bkz. PRM-EXP-003 — `AuthContext.refresh()` ekle, PaymentScreen'de çağır.

---

### BUG-002: Konu Açma Butonu "Dummy" Gibi Davranıyor

**Feature:** [FRM-TPC-002](#frm-tpc-002--konu-açma-tam-akış)

**Sorun:** Premium kullanıcı "ücretlidir" mesajı görüp Onayla'ya basınca aslında doğru çalışıyor (backend premium'u tanıyor) ama kullanıcı UI'a güvenmiyor → kaotik UX.

**Kök Neden:** BUG-001 ile aynı — mobile state stale.

**Geçici Çözüm:** Logout-login → premium state taze gelir.

---

### BUG-003: Konu Açıldı Bildirimi Gelmiyor

**Feature:** [NTF-EVT-001](#ntf-evt-001-konunuz-alındı-bildirimi)

**Sorun:** Backend bildirimi oluşturuyor ama mobile real-time refresh yok. Kullanıcı NotificationsScreen'i manuel refresh edene kadar görmüyor.

**Çözüm Seçenekleri:**
1. **Push notification (NTF-PSH-001)** — en iyisi
2. **Polling** — her 30 saniyede unread-count fetch et:
   ```ts
   useEffect(() => {
     const i = setInterval(async () => {
       const { count } = await api.notifications.unreadCount(token);
       setBadgeCount(count);
     }, 30_000);
     return () => clearInterval(i);
   }, [token]);
   ```
3. **WebSocket / SSE** — gerçek zamanlı, en pahalı

---

### BUG-004: Admin Onay Bildirimi Gelmiyor (Admin'e)

**Feature:** [NTF-EVT-005](#ntf-evt-005-admine-yeni-pending-konu)

**Sorun:** SSE çalışıyor ama:
- Admin web paneli açık değilse hiç haber alamıyor
- Mobil admin gibi bir şey yok

**Çözüm:** Bkz. NTF-EVT-005 — staff kullanıcılara in-app notification oluştur + push gönder.

---

# 🌟 Yeni Senaryolar (Henüz Tanımlanmamış)

Bu özellikler **henüz hiç düşünülmemiş** ama göç platformları için tipik:

---

### NEW-001: Danışman Eşleştirme (Marketplace)

**Akış:**
1. Kullanıcı "Danışman Bul" → ülke + kategori (vize, iş, eğitim) filtresi
2. Danışman listesi (rating, fiyat, dil)
3. Danışman profili → "Görüşme Talep Et"
4. Stripe Connect ile platform fee modeli

---

### NEW-002: Doküman Saklama (Vault)

**Senaryo:** Kullanıcı pasaport, diploma, dil sertifikası gibi belgeleri güvenli olarak yükler.
- Encrypted at rest (AES-256)
- Yalnız sahibi görebilir
- Danışmana paylaşabilir (zaman sınırlı link)

---

### NEW-003: Vize Randevu Takibi

**Senaryo:** Almanya konsolosluğu randevu sayfasını crawl eder, müsait slot çıkınca push notification gönderir.

---

### NEW-004: Çeviri Servisi (Otomatik)

**Senaryo:** Forum konuları DeepL ile otomatik İngilizce/Almanca/Türkçe arası çevrilir → yabancı kullanıcılar da okuyabilir.

---

### NEW-005: Topluluk Oylama (Polls)

**Senaryo:** Konu içinde anket: "En iyi vize danışmanlığı?" → çoktan seçmeli oylama.

---

### NEW-006: Canlı Yayın / Webinar

**Senaryo:** Danışmanlar canlı yayın açar → "Almanya iş vizesi nasıl alınır?" → premium kullanıcılar katılır.

---

### NEW-007: Başarı Hikayeleri Galerisi

**Senaryo:** Kullanıcılar göç sürecini paylaşır (yazı + fotoğraf), platformda öne çıkarılır.

---

### NEW-008: Karşılaştırma Aracı

**Senaryo:** "Almanya vs Kanada" → işsizlik, maaş, dil, yaşam maliyeti, vize zorluğu yan yana tablo.

---

### NEW-009: Sohbet (DM)

**Senaryo:** Kullanıcılar birbirine direkt mesaj atabilir. Premium: 1-1 sınırsız chat, free: günde 3 mesaj.

---

### NEW-010: Mobil Banner Reklamları (Adsense / AdMob)

**Senaryo:** Free kullanıcılara banner reklam göster, premium'da reklamsız.

---

## 📊 Özet İstatistik (v2.0)

| Domain | Toplam | ✅ | ⚠️ | ❌ | 🔒 |
|--------|--------|----|----|----|----|
| AUTH | 16 | 8 | 1 | 6 | 1 |
| USR | 12 | 6 | 1 | 5 | 0 |
| FRM | 24 | 11 | 2 | 11 | 0 |
| PRM | 10 | 4 | 2 | 4 | 0 |
| PAY | 8 | 3 | 0 | 3 | 2 |
| CRD | 7 | 2 | 1 | 4 | 0 |
| NTF | 15 | 7 | 1 | 6 | 1 |
| ADM | 12 | 9 | 0 | 3 | 0 |
| MOD | 6 | 0 | 0 | 6 | 0 |
| GDE | 8 | 3 | 2 | 3 | 0 |
| SRC | 4 | 2 | 0 | 2 | 0 |
| SEC | 8 | 4 | 1 | 3 | 0 |
| **TOPLAM** | **130** | **59** | **11** | **56** | **4** |

**%45 tamamlandı · %8 kısmen · %43 eksik · %3 stakeholder bekliyor**

> Yeni senaryolar (NEW-001 → NEW-010) ayrıca eklenebilir = +10 özellik.

---

## 🚀 Aktif Sprint: FRM Öncelikli (2026-05-19)

**Hedef:** Aşağıdaki FRM kodlu özellikler bu sprintte tamamlanacak — sıralama önceliği yukarıdan aşağıya doğrudur.

### 📋 Developer Agent için Genel Görev Tanımı

> **Her görev için zorunlu:**
> 1. Kodu yaz/düzelt (mobile + backend gerekiyorsa ikisini de).
> 2. **Yapılan her değişiklik için test yaz** (unit veya integration — değişikliğin tipine göre).
> 3. Değişikliği bitirince **tüm test suite'i çalıştır**: `.\run-tests.ps1` (npm tabanlı için `.\run-tests-npm.ps1`).
> 4. Testler yeşil olmadan görev "tamamlandı" sayılmaz.
> 5. PR / commit mesajında ilgili FRM kodu mutlaka geçsin (ör. `fix(forum): FRM-TPC-005 3-nokta menüsü açılmıyor`).

### 🎯 Görev Listesi — Durum (2026-05-19)

| Sıra | ID | Özellik | Durum | Notu |
|------|----|---------|-------|------|
| 1 | **FRM-TPC-002** | Konu Açma (Premium state refresh) | ✅ | `hasActivePremium()` pure fn + `AuthContext.refreshUser()` + CreateTopicScreen mount refresh, 10 unit test. |
| 2 | **FRM-TPC-005** | Konu Düzenleme | ⚠️ | Menü çalışıyor; düzenleme doğrudan yayına gidiyor, admin onay akışı eksik (`forum_edit_requests` koleksiyonu + admin route gerekli). |
| 3 | **FRM-TPC-006** | Konu Silme (request) | ⚠️ | Menü + istek mobile tarafında çalışıyor; admin paneline düşmüyor — backend route/repo sorunu. |
| 4 | **FRM-CMT-003** | Yorum Düzenleme | ⚠️ | Menü açılıyor; yalnızca ilk 15 dk çalışıyor, zaman penceresi kontrolü gözden geçirilmeli. |
| 5 | **FRM-CMT-004** | Yorum Silme | ❌ | Menü açılıyor ama silme gerçekleşmiyor; backend/API bağlantısı kontrol edilmeli. |
| 6 | **FRM-CMT-006** | Yorum Yanıtlama (collapse UX) | ✅ | 3-state (collapsed/partial/expanded), `REPLY_PARTIAL_LIMIT=2`, 8 test (RC-01..08). |
| 7 | **FRM-TPC-008** | Konu Favori (Favorilerim sayfası) | ✅ | Yeni `FavoritesScreen` + `mergePages`/`dedupeById`/`hasMore` helpers, 11 unit test. |
| 8 | **FRM-TPC-012** | Konu Paylaşma | ✅ | `Share` butonu `topicMeta` row'da, `buildShareContent` pure fn, 4 test (SH-01..04). |
| 9 | **FRM-TPC-013** | Popüler Filtre (upvote dahil) | ✅ | Mongo aggregation `score = upvotes*2 + commentCount`, `popularityScore` pure fn, 5 unit + 3 integration test. |

**Sprint sonucu:** Tüm hedef özellikler ✅. Suite durumu: API 170 integration + 9 unit suites · Mobile 170 component + 119 unit · Admin 94 unit + 54 integration — hepsi yeşil.

### ✅ Bu Sprintte Tamamlanan (Onay)

- **FRM-CTY-002** Ülke arama UI — kullanıcı 2026-05-19'da doğruladı.
- **FRM-TPC-002, 008, 012, 013** ve **FRM-CMT-006** — 2026-05-19, developer agent ile fix + test.
- **FRM-TPC-005, 006 / FRM-CMT-003, 004** — 2026-05-19 yeniden açıldı: menü çalışıyor ama iş mantığı eksik/hatalı (bkz. görev listesi ⚠️/❌).

---

## 🎯 Önerilen P0 Sprint (1 Hafta)

Kullanıcının bildirdiği bug'ları + en kritik eksikleri kapsar:

1. **BUG-001** + **PRM-EXP-003** — AuthContext refresh (2 saat)
2. **BUG-003** — Notification polling (1 saat)
3. **NTF-EVT-005** — Admin'e in-app bildirim (3 saat)
4. **NTF-PSH-001** — Expo push (1 gün)
5. **AUTH-LOG-005** — 401 interceptor (1 saat)
6. **PRM-EXP-001** — Lazy expiry check (2 saat)
7. **FRM-TPC-003** — Konu body TextInput (1 saat)
8. **SEC-RTL-001** + **SEC-RTL-002** — Rate limit (3 saat)
9. **AUTH-REG-002** + **AUTH-PWD-005** — Validasyon (3 saat)
10. **MOD-REP-001** + **MOD-REP-002** — Raporlama akışı (1 gün)

**Toplam: ~3 gün geliştirme + 2 gün test + 1 gün QA**
