# GoWorldy — Göç Rehberi Platformu

Türkiye'den yurt dışına çıkmak isteyen veya hâlihazırda yurt dışında yaşayan kullanıcılar için rehberlik, forum ve danışmanlık platformu.

---

## Ürün Katmanları

| Katman | Teknoloji | Durum |
|--------|----------|-------|
| **API** | Node.js + Express + TypeScript | ✅ Çalışıyor |
| **Mobile** | React Native + Expo + TypeScript | ✅ Çalışıyor |
| **Admin** | React + TypeScript + Vite | ✅ Çalışıyor |

---

## Proje Yapısı

```
GoWorldy/
├── api/               # Backend API
│   └── src/
│       ├── config/        # Ortam değişkenleri
│       ├── middleware/     # Auth + rol kontrolleri
│       ├── repositories/  # Repository pattern (interfaces + sqlite/ + mongo/)
│       ├── routes/        # auth, forum, guide, payment, admin, notifications
│       └── index.ts       # Giriş noktası
├── mobile/            # React Native / Expo uygulaması
│   └── src/
│       ├── screens/       # auth/ + main/
│       ├── navigation/    # AppNavigator.tsx
│       ├── services/      # api.ts (HTTP client)
│       ├── context/       # AuthContext
│       └── theme.ts       # Design system token'ları
├── admin/             # React admin paneli
│   └── src/
│       └── pages/         # Dashboard, Users, Topics, Config
├── agents/            # Agent orchestration
│   ├── developer/memory.md
│   ├── tester/memory.md
│   ├── project-manager/memory.md
│   ├── ux-ui/memory.md
│   └── devops/memory.md
├── config/            # .env dosyaları
├── CLAUDE.md          # Claude Code orchestration kuralları
└── SPRINT.md          # Aktif sprint + backlog
```

---

## Hızlı Başlangıç

### API
```bash
cd api
npm install
npm run dev        # http://localhost:3000
```

### Mobile
```bash
cd mobile
npm install
npx expo start
```

### Admin
```bash
cd admin
npm install
npm run dev        # http://localhost:5173
```

### Test
```bash
cd api
npm test           # Tüm testler (85 senaryo)
```

### Type Check
```bash
cd api && npx tsc --noEmit
```

---

## Ortam Değişkenleri

Tüm ayarlar `config/.env.development` dosyasında:

| Değişken | Açıklama |
|----------|---------|
| `DB_PROVIDER` | `sqlite` (local) veya `mongodb` (prod) |
| `MONGODB_URI` | MongoDB Atlas bağlantı adresi |
| `JWT_SECRET` | JWT imzalama anahtarı |
| `STRIPE_SECRET_KEY` | Stripe gizli anahtar |
| `STRIPE_PRICE_*` | Stripe fiyat ID'leri (stakeholder bekleniyor) |
| `SENDGRID_API_KEY` | E-posta servisi (stakeholder bekleniyor) |
| `EXPO_PUBLIC_API_URL` | Mobile → API adresi (ör. `http://192.168.x.x:3000/api`) |

---

## Admin Girişi

- **URL**: http://localhost:5173
- **E-posta**: `admin@goworldy.com`
- **Şifre**: `admin123`

---

## Ana Özellikler

| Modül | Açıklama |
|-------|---------|
| **Auth** | E-posta/şifre + Google Sign-In, JWT, şifre sıfırlama |
| **Rehberim** | Ülkeye göre göç adımları, progress takibi |
| **Forum** | Ülkeler → Kategoriler → Konular → Yorumlar |
| **Premium** | Kredi sistemi (50 TL/işlem), aylık üyelik (250 TL), Stripe |
| **Bildirimler** | Ülke/konu aboneliği, SSE canlı admin paneli, badge |
| **Admin** | Kullanıcı yönetimi, konu onay kuyruğu, config paneli |

---

## Agent Sistemi

Bu proje beş uzman AI agent ile yönetilir. Her agent `agents/<name>/memory.md` dosyasında rol tanımı ve birikmiş bağlamını tutar.

| Agent | Sorumlu Alan |
|-------|-------------|
| `developer` | Tüm kod: API, mobile, admin |
| `tester` | Test yazma, test çalıştırma, bug raporlama |
| `project-manager` | Roadmap, sprint planı, SPRINT.md |
| `ux-ui` | Ekran tasarımı, design system |
| `devops` | CI/CD, deployment, altyapı |

**Kullanım:**
```
developer: [görev açıklaması]
tester: [sprint] için testleri yaz ve çalıştır
pm: durum raporu ver
uxui: [ekran] için spec yaz
```

Detaylar: [`CLAUDE.md`](CLAUDE.md) | Aktif görevler: [`SPRINT.md`](SPRINT.md)

---

## Kullanıcı Tipleri & Roller

| Tip | Açıklama |
|-----|---------|
| `emigrant` | Göç etmek isteyen |
| `consultant` | Danışman |
| `diaspora` | Zaten yurt dışında |

| Rol | Yetki |
|-----|-------|
| `user` | Yorum yaz, rehber kullan |
| `moderator` | Konu onayla/reddet, içerik yönet |
| `admin` | Tam yetki |
