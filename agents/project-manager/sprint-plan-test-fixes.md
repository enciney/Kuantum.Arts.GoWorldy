# GoWorldy — Sprint Planı (Test Bulgularına Göre)

> Oluşturma tarihi: 2026-05-16
> Kaynak: TEST_SCENARIOS.md + Sprint 10 backlog görevleri
> Toplam: 5 sprint, ~40 görev

---

## Sprint 10 → Backlog'a Taşındı

Sprint 10 görevleri test bulgularına göre yeniden öncekilendirildi ve aşağıdaki yeni sprint'lere dağıtıldı:

| Eski Kod | Görev Özeti | Taşınan Yer |
|----------|-------------|-------------|
| P10-1 | userFeatures koleksiyonu + sahiplik kontrolü | Sprint 4 — S4-07 |
| P10-2 | PremiumScreen geçerlilik süresi gün/saat formatı | Sprint 4 — S4-08 |
| P10-3 | CreateTopicScreen credits_topic infobox kaldırma | Sprint 5 — S5-01 |
| P10-4 | CreateTopicScreen "Onayla ve Gönder" butonu fix | Sprint 1 — S1-04 (P0) |
| P10-5 | ForumTopicsScreen FAB → Premium navigate fix | Sprint 1 — S1-05 (P0) |

---

## Yeni Sprint 1 — Kritik Bug Fix (P0)

**Odak:** Güvenlik açıkları, kredi atomikliği ve temel akış blokları
**Sahipler:** Developer (ana), UX-UI (audit)
**Tahmini süre:** 3-4 gün

| Kod | Öncelik | Görev | Sahip | Durum |
|-----|---------|-------|-------|-------|
| S1-01 | **P0** | SEC-06: GET /me response'unda passwordHash alanı kesinlikle dönmemeli — serializer/response kontrolü | Developer | ⏳ |
| S1-02 | **P0** | CR-03 + CR-07: Kredi atomikliği — başarısız işlemde kredi düşmemeli, bakiye asla eksi olmamalı (DB transaction) | Developer | ⏳ |
| S1-03 | **P0** | F-09 + F-14: Yetersiz kredide POST /forum/topics ve POST /forum/comments 402 Payment Required dönmeli | Developer | ⏳ |
| S1-04 | **P0** | P10-4 (backlog): CreateTopicScreen "Onayla ve Gönder" butonu çalışmıyor — CreditGateModal.onDeduct → doCreate akışını düzelt | Developer | ⏳ |
| S1-05 | **P0** | P10-5 (backlog): ForumTopicsScreen FAB → CreditGateModal → "Satın Al" → PremiumScreen yönlendirmesi — onNavigatePremium bağlantısını doğrula | Developer | ⏳ |
| S1-06 | **P0** | AD-02 + SEC-03: Admin endpoint'lerine normal kullanıcı erişimi kesin 403 dönmeli — tüm admin middleware'i audit et | Developer | ⏳ |
| S1-07 | **P0** | SEC-01: Süresi dolmuş JWT 401 dönmeli, mobile interceptor kullanıcıyı LoginScreen'e yönlendirmeli | Developer | ⏳ |
| S1-08 | **P0** | DEV: Tüm P0 bug fix'leri sonrası `tsc --noEmit` çalıştır, sıfır hata doğrula | Developer | ⏳ |
| S1-09 | **P1** | UXUI: Sprint 1 değişikliklerinin etkilediği ekranları audit et — CreditGateModal, PremiumScreen, CreateTopicScreen | UX-UI | ⏳ |

**Test senaryoları (doğrulama):** SEC-06, CR-03, CR-07, F-09, F-14, AD-02, SEC-03, SEC-01

---

## Yeni Sprint 2 — API Doğruluğu (P1)

**Odak:** Reset password akışı, forum endpoint davranışları, Stripe webhook, bildirim güvenliği
**Sahipler:** Developer (ana), UX-UI (audit)
**Tahmini süre:** 3-4 gün

| Kod | Öncelik | Görev | Sahip | Durum |
|-----|---------|-------|-------|-------|
| S2-01 | **P1** | A-15 + A-16 + A-17: Reset password token doğrulamaları — süresi dolmuş token 400/401, geçersiz token 400 dönmeli | Developer | ⏳ |
| S2-02 | **P1** | F-04: GET /forum/topics sadece status=approved konular dönmeli — pending/rejected filtrelenmeli | Developer | ⏳ |
| S2-03 | **P1** | F-16 + F-17: Upvote toggle — ekle (200) + kaldır (200) tam çalışmalı | Developer | ⏳ |
| S2-04 | **P1** | NO-03 + NO-05 + NO-06: Notification güvenliği — başka kullanıcının bildirimini okuma 403; unread-count doğru çalışmalı | Developer | ⏳ |
| S2-05 | **P1** | PM-09 + PM-10: Stripe webhook — geçerli imza ile isPremium güncellenmeli; geçersiz imza 400 dönmeli | Developer | ⏳ |
| S2-06 | **P1** | G-06 + G-07: Guide progress kaydetme — aynı stepId üzerine yazılmalı; farklı ülke seçince adımlar sıfırlanmalı | Developer | ⏳ |
| S2-07 | **P1** | DEV: Tüm P1 API kontrolleri + fix, `tsc --noEmit` | Developer | ⏳ |
| S2-08 | **P2** | UXUI: Sprint 2 değişikliklerini audit et — Guide progress ekranları, notification badge | UX-UI | ⏳ |

**Test senaryoları (doğrulama):** A-15, A-16, A-17, F-04, F-16, F-17, NO-03, NO-05, NO-06, PM-09, PM-10, G-06, G-07

---

## Yeni Sprint 3 — UX & Orta Öncelik (P2)

**Odak:** Oturum kalıcılığı, abonelikler, pagination, blocker adım akışı
**Sahipler:** Developer (ana), UX-UI (audit)
**Tahmini süre:** 4-5 gün

| Kod | Öncelik | Görev | Sahip | Durum |
|-----|---------|-------|-------|-------|
| S3-01 | **P2** | L-09: Oturum kalıcılığı — AsyncStorage'dan token restore edilmeli, uygulama yeniden açılınca otomatik giriş | Developer | ⏳ |
| S3-02 | **P2** | U-09: PATCH /me → role güncelleme denemesi role değiştirmemeli — whitelist kontrolü | Developer | ⏳ |
| S3-03 | **P2** | NO-07 + NO-08 + NO-09: Ülke/konu aboneliği tam akışı — abone ol, abonelikten çık, liste doğru dönmeli | Developer | ⏳ |
| S3-04 | **P2** | N-06 + N-07: Tab bar bildirim rozeti — okunmamış sayı 9+ format; konu aboneliği bildirimleri | Developer | ⏳ |
| S3-05 | **P2** | G-03: Guide blocker adım akışı — blockingAnswer seçilince ilerleme durmalı, uyarı gösterilmeli | Developer | ⏳ |
| S3-06 | **P2** | FT-05 + F-05: Pagination — ForumTopicsScreen infinite scroll + GET /forum/topics?page=2 doğru sayfalama | Developer | ⏳ |
| S3-07 | **P2** | CT-08: Konu admin onay süreci — normal kullanıcı topic'i status=pending oluşturmalı, admin panelinde görünmeli | Developer | ⏳ |
| S3-08 | **P2** | DEV: P2 düzeltmeleri, `tsc --noEmit` | Developer | ⏳ |
| S3-09 | **P2** | UXUI: Guide blocker state'leri + bildirim badge doğrulama — ekran spec'leri gözden geçir | UX-UI | ⏳ |

**Test senaryoları (doğrulama):** L-09, U-09, NO-07, NO-08, NO-09, N-06, N-07, G-03, FT-05, F-05, CT-08

---

## Yeni Sprint 4 — Edge Case & Admin (P3)

**Odak:** Deep link, güvenlik sertleştirme, admin kullanıcı yönetimi, userFeatures
**Sahipler:** Developer (ana), UX-UI (kısmi)
**Tahmini süre:** 4-5 gün

| Kod | Öncelik | Görev | Sahip | Durum |
|-----|---------|-------|-------|-------|
| S4-01 | **P3** | NAV-05 + NAV-06: Deep link testleri — `goworldy://topic/:id` ForumTopicDetailScreen açmalı; giriş yapılmamışsa Login'e yönlendir | Developer | ⏳ |
| S4-02 | **P3** | SEC-04: NoSQL injection koruması — `{email: {"$gt": ""}}` girişi 400 veya boş sonuç dönmeli | Developer | ⏳ |
| S4-03 | **P3** | SEC-07: Rate limiting kontrolü — çok hızlı istekte 429 Too Many Requests dönmeli | Developer | ⏳ |
| S4-04 | **P3** | SEC-08: CORS politikası — sadece izin verilen origin'lerden istek kabul edilmeli | Developer | ⏳ |
| S4-05 | **P3** | AD-08 + AD-09: Admin kullanıcı listesi (200) ve arama filtresi (q=engin eşleşen kullanıcılar) | Developer | ⏳ |
| S4-06 | **P3** | AD-10 + AD-11: Admin role güncelleme — geçerli role 200; geçersiz role (superadmin) 400 | Developer | ⏳ |
| S4-07 | **P0** | P10-1 (backlog): userFeatures koleksiyonu + sahiplik kontrolü — tekrar satın alma engeli, "Zaten sahipsiniz" mesajı | Developer | ⏳ |
| S4-08 | **P1** | P10-2 (backlog): PremiumScreen geçerlilik süresi gün/saat formatında göster ("3 gün 4 saat kaldı") | Developer + UX-UI | ⏳ |
| S4-09 | **P3** | DEV + UXUI: Tüm edge case ve admin düzeltmeleri — `tsc --noEmit` + etkilenen ekranları audit et | Developer + UX-UI | ⏳ |

**Test senaryoları (doğrulama):** NAV-05, NAV-06, SEC-04, SEC-07, SEC-08, AD-08, AD-09, AD-10, AD-11

---

## Yeni Sprint 5 — Backlog Özellikleri & Refinement

**Odak:** Eksik özellikler, onboarding, forum arama, premium süresi dolma, stakeholder beklentileri
**Sahipler:** Developer (ana), UX-UI (onboarding + arama)
**Tahmini süre:** 5-7 gün
**Blokaj:** Stripe Price ID'leri + SendGrid API Key — Stakeholder bekleniyor

| Kod | Öncelik | Görev | Sahip | Durum |
|-----|---------|-------|-------|-------|
| S5-01 | **P1** | P10-3 (backlog): CreateTopicScreen — credits_topic özelliğine sahipse "Konu açma ücretlidir" infobox'ını gösterme | Developer | ⏳ |
| S5-02 | **P1** | CR-06: Premium süresi dolma kontrolü — premiumUntil geçtiyse isPremium=false olmalı (cron veya middleware) | Developer | ⏳ |
| S5-03 | **P2** | PM-06: Mock topup dev endpoint doğrulama — POST /payment/topup/mock 200, 50 kredi eklendiğini doğrula | Developer | ⏳ |
| S5-04 | **P1** | Onboarding flow — RU3 spec hazır, implementation (UX-UI spec'e göre yeni kullanıcı akışı) | Developer + UX-UI | ⏳ |
| S5-05 | **P2** | Forum arama — RU1 spec hazır, GET /forum/search?q=X implementasyonu + mobile SearchBar entegrasyonu | Developer | ⏳ |
| S5-06 | **P0** | Stakeholder bekleniyor: Stripe Price ID'leri (CREDITS_TOPIC/COMMENT/AD/100 + PREMIUM_MONTHLY) `.env.development`'a eklenmeli | Stakeholder | ⏳ Blokaj |
| S5-07 | **P0** | Stakeholder bekleniyor: SendGrid API Key — reset e-postası gerçekten gitmesi için | Stakeholder | ⏳ Blokaj |

**Test senaryoları (doğrulama):** CR-06, PM-06, PR-06, PR-07

---

## Özet Tablo

| Sprint | Konu | P0 Görev | P1 Görev | P2/P3 Görev | Toplam |
|--------|------|----------|----------|-------------|--------|
| Sprint 1 | Kritik Bug Fix | 8 | 1 | 0 | 9 |
| Sprint 2 | API Doğruluğu | 0 | 7 | 1 | 8 |
| Sprint 3 | UX & Orta Öncelik | 0 | 0 | 9 | 9 |
| Sprint 4 | Edge Case & Admin | 1 | 1 | 7 | 9 |
| Sprint 5 | Backlog & Refinement | 2* | 3 | 2 | 7 |

*Sprint 5 P0'lar stakeholder beklentisi (Stripe + SendGrid), developer bloke değil.

---

## Kritik Bağımlılıklar

1. **Sprint 1 → Sprint 2 önkoşul:** S1-02 (kredi atomikliği) tamamlanmadan S2-05 (Stripe webhook) test edilemez.
2. **Sprint 4 → Sprint 5 önkoşul:** S4-07 (userFeatures koleksiyonu) tamamlanmadan S5-01 (CreateTopicScreen infobox) implement edilemez.
3. **Stripe + SendGrid blokajı:** Sprint 5'teki S5-06 + S5-07 stakeholder'a bağlı — developer tarafında blokaj yok, env key'ler gelince hazır.
