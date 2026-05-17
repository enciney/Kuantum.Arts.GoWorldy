# DevOps Agent Memory

## Rol & Çalışma Kuralları

### Rol
DevOps mühendisi. `git push` ile canlı kullanıcı arasındaki her şeyden sorumlu: CI/CD pipeline'ları, ortam yapılandırması, gizli anahtar yönetimi, deployment, izleme ve rollback.

### Tech Stack & Platform
| Katman | Dev | Staging/Prod |
|--------|-----|-------------|
| API (Node/Express) | localhost:3000 | Render (free) |
| Mobile (Expo) | Expo Go | EAS Build → App Store / Play Store |
| Admin (React) | localhost:5173 | Vercel (free) |
| DB | SQLite (local) | MongoDB Atlas M0 (free) |
| CI/CD | — | GitHub Actions |

**Maliyet (MVP):** $0/month

### Pipeline Mimarisi
```
git push → GitHub Actions: CI (tsc + test) → (master'da) CD:
  API → Render deploy hook
  Admin → Vercel otomatik
  Mobile → EAS Update (OTA)
```

### GitHub Secrets
| Secret | Kullanım |
|--------|---------|
| `RENDER_DEPLOY_HOOK_URL` | deploy-api.yml |
| `EXPO_TOKEN` | EAS mobile update |

### Platform Kurulum Özeti
- **Render**: New → Web Service, root=`api`, build=`npm ci && npm run build`, start=`node dist/index.js`
- **Vercel**: `admin/` root, Vite framework, `VITE_API_URL` env var
- **MongoDB Atlas**: M0 free, network access `0.0.0.0/0`
- **EAS**: `eas login && eas build:configure`

### Rollback
- API: Render dashboard → Deploys → önceki → Redeploy
- Admin: Vercel → Deployments → Promote to Production
- Mobile: `eas update --branch production --rollout-percentage 0`

### Ortak Görevler
- Pipeline fail → GitHub → Actions → kırmızı workflow log'u oku
- Render API çalışmıyor → Logs, `dist/` klasörü ve `tsconfig.json outDir` kontrol et
- Vercel env var ekle → Project → Settings → Environment Variables → Redeploy
- Mobile OTA: `cd mobile && eas update --branch production --message "..."`

---

## Platform Decisions
- **API hosting:** Render (free tier) — deploy hook URL'i GitHub Secrets'a eklenecek
- **Admin hosting:** Vercel (free) — GitHub entegrasyonu ile otomatik deploy
- **CI/CD:** GitHub Actions — ücretsiz, repo ile entegre
- **DB:** MongoDB Atlas M0 (ücretsiz, 512MB) — zaten mevcut
- **Mobile builds:** Expo EAS free tier (30 build/ay) + OTA updates

## Pipeline State
- CI workflow (.github/workflows/ci.yml): henüz oluşturulmadı
- CD workflow (.github/workflows/deploy-api.yml): henüz oluşturulmadı
- Render service: henüz kurulmadı
- Vercel project: henüz kurulmadı

## Known Constraints
- Render free tier: 15 dakika idle sonrası spin-down, cold start ~30 saniye
- EAS free tier: 30 build/ay limit (OTA update'ler bu limite dahil değil)
- GitHub Actions: private repo için 2000 dk/ay ücretsiz

## API Build Requirements
- `tsconfig.json`'da `"outDir": "./dist"` olmalı
- `package.json`'da `"build": "tsc"` script'i olmalı
- Start command: `node dist/index.js`
- Health endpoint: `/health` — Render için eklenecek
