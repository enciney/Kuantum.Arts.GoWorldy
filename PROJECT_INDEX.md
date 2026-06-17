# GoWorldy — Proje İndeksi (Tek Giriş Noktası)

> Bu dosya projenin **düzenli giriş noktasıdır.** Karışıklığı azaltmak için
> 3 şeyi bir arada tutar: (1) Feature Set listesi, (2) Agent tanımları, (3) To-Do listesi.
> Ayrıca tüm `.md` dosyalarının ne işe yaradığını klasör klasör haritalar.
>
> Hazırlayan: Developer agent · Tarih: 2026-06-11

---

## 🗺️ 0. Tüm .md Dosyaları — Klasör Klasör Harita

> **Temizlik (2026-06-11):** Türetilebilir/yinelenen dokümanlar silindi
> (`README.md`, `BACKLOG_REFINEMENT.md`, `TEST_SCENARIOS.md`,
> `agent-commands/current-tasks.md`, `mobile/MOBILE_TEST_GUIDE.md`).
> Hepsi git geçmişinde duruyor, gerekirse geri alınır. Kalan dosyalar **core**:
> ya koddan türetilemeyen kaynaklar (intent/karar/migration) ya da agent yapılandırması.

### Kök dizin
| Dosya | Ne için | Neden tutuluyor |
|-------|---------|-----------------|
| `PROJECT_INDEX.md` | **(bu dosya)** düzenli giriş noktası | Curated index |
| `CLAUDE.md` | Agent orkestrasyon kuralları (Claude Code için) | Agent config — kodda yok |
| `feature_sets.md` | **136 özelliğin** kodlu (ID'li) kataloğu — ürün intent/spec | Eksik feature + iş kuralları kodda yok |
| `SPRINT.md` | Aktif sprint + öncelikli backlog | Canlı proje durumu — kodda yok |

### `agents/` — Aktif agent tanımları (5 agent)
| Dosya | Ne için |
|-------|---------|
| `agents/developer/memory.md` | Developer rolü + birikmiş teknik geçmiş (uzun log) |
| `agents/project-manager/memory.md` | PM rolü + sprint geçmişi |
| `agents/tester/memory.md` | Tester rolü + test dosya haritası |
| `agents/ux-ui/memory.md` | UX/UI rolü + design system (renk/tipografi/spacing) |
| `agents/devops/memory.md` | DevOps rolü + deploy/altyapı planı |

### `agent-commands/` — Agent'ları toplu çalıştırma scriptleri
| Dosya | Ne için |
|-------|---------|
| `agent-commands/README.md` | Headless agent çalıştırma scriptlerinin tarifi |

### `mobile/` — Mobil uygulama dokümanları
| Dosya | Ne için |
|-------|---------|
| `mobile/MOBILE_STORE_MIGRATION.md` | App Store + Play Store yayın denetimi ve blokerler (migration — tutuluyor) |

### ✅ Worktree temizliği yapıldı (2026-06-11)
Eski/terk edilmiş tüm git worktree'leri kaldırıldı (`adoring-gould`, `gifted-lamarr`,
`gracious-carson`, `mystifying-fermi`). Bunlar **eski bir agent taksonomisi**
(`fullstack`, `mobile-developer`, `web-admin`) içeriyordu ve karışıklığın ana kaynağıydı.
Artık tek geçerli yapı `agents/` altındaki **5 agent**.

---

## 📦 1. FEATURE SET LİSTESİ (Özet)

> Tam detay (akış, kod, edge case) → `feature_sets.md`. Burada sadece üst seviye özet.
> Semboller: ✅ tam · ⚠️ kısmi · ❌ eksik · 🔒 stakeholder bekliyor

### Genel durum (136 feature)
**%51 tam · %7 kısmi · %38 eksik · %3 stakeholder bekliyor**

| Domain | Kod | Toplam | ✅ | ⚠️ | ❌ | 🔒 |
|--------|-----|:-:|:-:|:-:|:-:|:-:|
| Kimlik Doğrulama | AUTH | 17 | 9 | 1 | 6 | 1 |
| Kullanıcı Profili | USR | 12 | 6 | 1 | 5 | 0 |
| Forum | FRM | 24 | 11 | 2 | 11 | 0 |
| Premium | PRM | 15 | 9 | 0 | 6 | 0 |
| Ödeme | PAY | 8 | 3 | 0 | 3 | 2 |
| Kredi | CRD | 7 | 3 | 1 | 3 | 0 |
| Bildirim | NTF | 15 | 9 | 2 | 3 | 1 |
| Admin | ADM | 12 | 9 | 0 | 3 | 0 |
| **Moderasyon** | **MOD** | **6** | **0** | **0** | **6** | **0** |
| Rehber | GDE | 8 | 3 | 2 | 3 | 0 |
| Arama | SRC | 4 | 2 | 0 | 2 | 0 |
| Güvenlik | SEC | 8 | 5 | 1 | 2 | 0 |

**Dikkat çeken:** MOD (Moderasyon) modülü **tamamen eksik (0/6)** — raporlama kuyruğu,
ban/mute, soft-delete yok. Forum içerikli (UGC) bir uygulama olduğu için bu hem ürün
hem de **store onayı** açısından kritik (Apple 1.2 UGC kuralı).

### Çekirdek akışlar ne durumda?
- ✅ **Çalışan:** Kayıt/giriş (e-posta + Google), forum gezinme, konu/yorum, rehber adımları, profil, bildirimler, admin onay kuyruğu, kredi düşme.
- ⚠️ **Yarım:** Konu düzenleme/silme (admin onay akışı eksik), favoriler sayfası UI'ı, nested kategori/yorum.
- ❌ **Eksik & kritik:** Hesap silme, premium süre dolması, moderasyon modülü, rate limit.
- 🔒 **Stakeholder'a bağlı:** Stripe Price ID'leri, SendGrid API key.

---

## 🤖 2. AGENT TANIMLARI (5 Aktif Agent)

> Kaynak: `CLAUDE.md` + `agents/<name>/memory.md`. Çağırma: mesajın başına rol adı yaz
> (`developer: ...`, `pm: ...`). Ortak kural: **hiçbiri otomatik `git commit` yapmaz.**

| Agent | Çağrı | Sorumluluk | Sınır (yapmaz) |
|-------|-------|------------|----------------|
| **Developer** | `developer:` | Tüm kod: API (Node/Express/TS), Mobile (RN/Expo), Admin (React). Feature + bug fix. Her değişiklik sonrası `tsc --noEmit`. | Kendi kendine test yazıp onaylamaz; bug avlamaz (Tester'dan gelir). |
| **Tester** | `tester:` | QA. Değişen kod için test yazar, `.\run-tests.ps1` ile tam suite çalıştırır, bug raporlar (Türkçe). | Production kodu yazmaz. |
| **Project Manager** | `pm:` | Roadmap, önceliklendirme, sprint yönetimi, `SPRINT.md` güncelleme, stakeholder iletişimi. | Kod yazmaz, test yapmaz, UI kararı vermez. |
| **UX/UI** | `uxui:` | Ekran layout'ları, component spec'leri, design system (renk/tipografi/spacing). Developer'ın implement edeceği spec üretir. | Kod yazmaz. |
| **DevOps** | `devops:` | CI/CD, deploy, secret yönetimi, izleme, rollback. (Render + Vercel + Atlas + EAS, MVP maliyet $0). | Ürün kodu yazmaz. |

### Çalışma döngüsü (Definition of Done — değişmez)
```
1. Developer kodu yazar → 2. Tester'a teslim (ne değişti, dosya, satır)
3. Tester test yazar + .\run-tests.ps1 çalıştırır
4. Tüm testler geçer → ticket ✅ done
5. Test düşerse → Developer düzeltir → döngü başa
```
> "Kod çalışıyor görünüyor" geçerli teslim değildir. Tester onayı olmadan ticket kapanmaz.

### Hiyerarşi
```
PM ── önceliklendirir
├── UX/UI ── spec üretir
├── Developer ── kodlar
└── Tester ── doğrular (kapıyı o açar)
DevOps ── push sonrası canlıya taşır
```

> **Temizlik notu:** Eski worktree'deki `fullstack / mobile-developer / web-admin`
> agent'ları **geçersiz** — onları kullanma. Geçerli olan yukarıdaki 5 agent.

---

## ✅ 3. TO-DO LİSTESİ (Önceliklendirilmiş, Konsolide)

> Kaynaklar birleştirildi: `SPRINT.md` backlog + `feature_sets.md` eksikleri +
> `MOBILE_STORE_MIGRATION.md` blokerleri. Store yayını hedefiyle sıralandı.

### 🔴 P0 — Store yayını ve para akışı için zorunlu
| # | İş | Kaynak | Not |
|---|-----|--------|-----|
| T-01 | **IAP kararı + entegrasyonu** (premium dijital ürün) | STORE 4.1 | iOS/Android Stripe'ı dijital üründe kabul etmez. Karar bekliyor. |
| T-02 | **Hesap silme** (uygulama içi) | AUTH-ACC-002 / STORE 4.2 | Apple 5.1.1(v) zorunlu + KVKK/GDPR. Backend `DELETE /users/me` + UI. |
| T-03 | **Premium süre dolması** (isPremium otomatik false) | PRM-EXP-001/003 | Süresi dolan kullanıcı hâlâ premium görünüyor (kritik bug). |
| T-04 | **Stripe Price ID'leri** | S5-06 🔒 | Stakeholder'dan gerçek/test price ID'leri gelmeli, yoksa ödeme bloke. |
| T-05 | **SendGrid API key** | S5-07 🔒 | Şifre sıfırlama e-postası gerçekte gitmiyor (console.log). |
| T-06 | **Bundle ID onayı** | STORE 6 | `com.goworldy.app` atandı; ilk yüklemeden önce onayla/değiştir. |

### 🟠 P1 — İlk sürüm kalitesi (store öncesi güçlü tavsiye)
| # | İş | Kaynak |
|---|-----|--------|
| T-07 | **Moderasyon modülü** (raporlama kuyruğu + ban/mute + soft-delete) | MOD 0/6 — UGC kuralı |
| T-08 | Konu düzenleme/silme → admin onay akışı (`pending_edit` / deletion-request paneli) | FRM-TPC-005/006 |
| T-09 | "Favorilerim" sayfası (backend hazır, UI eksik) | FRM-TPC-008 |
| T-10 | Onboarding flow (hedef ülke + durum + bildirim izni) | AUTH-REG-003 / S5-04 |
| T-11 | Rate limit (`/auth/*` ve konu/yorum anti-spam) | SEC-RTL-001/002 |
| T-12 | Google Sign-In native client ID'leri (iOS/Android `.env`) | STORE 5.3 |
| T-13 | E-posta format + güçlü şifre validasyonu | AUTH-REG-002 / AUTH-PWD-005 |

### 🟡 P2 — UX / hata yönetimi
| # | İş | Kaynak |
|---|-----|--------|
| T-14 | Sessiz yutulmuş hatalar → kullanıcıya görünür mesaj (Notifications/Home) | F-07/08/09 |
| T-15 | Forum pagination / infinite scroll | S3-06 |
| T-16 | Avatar'ı CDN'e taşı (şu an base64 DB'de) | USR-AVT-001 |
| T-17 | Tab bar bildirim rozeti (9+ formatı) | S3-04 |
| T-18 | Forum full-text arama | S5-05 |

### 🟢 P3 — İleride
- Takip sistemi (followingCount şu an hep 0) · Push notification (FCM vs Expo kararı) ·
  Kredi geçmişi · Ödeme geçmişi/fatura · Danışman marketplace · Ülke karşılaştırma ·
  Rehber tamamlama rozeti · Admin pricing paneli.

---

## 🧭 Nereden Devam Etmeli? (öneri)
1. **Stakeholder kararları:** T-01 (IAP), T-04 (Stripe), T-05 (SendGrid), T-06 (Bundle ID) — bunlar senin/iş tarafının kararı, kod beklemeden netleşmeli.
2. **Developer'ın hemen başlayabileceği** (karar gerektirmeyen): T-02 (hesap silme), T-03 (premium expiry), T-07 (moderasyon), T-08 (edit/delete onay akışı).
3. Eski worktree'yi arşivle → tek kaynak `agents/` kalsın.
