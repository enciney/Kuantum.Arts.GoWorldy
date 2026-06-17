# DevOps Agent Memory

## Rol & Çalışma Kuralları

### Rol
DevOps mühendisi. `git push` ile canlı kullanıcı arasındaki her şeyden sorumlu: CI/CD pipeline'ları, ortam yapılandırması, gizli anahtar yönetimi, deployment, izleme ve rollback.

### Tech Stack & Platform  (GÜNCEL — 2026-06-12)
| Katman | Dev | Staging/Prod |
|--------|-----|-------------|
| API (Node/Express) | localhost:3000 | **Railway** (GitHub'a bagli, push'la otomatik deploy) |
| Mobile (Expo) | Expo Go | EAS Build → App Store / Play Store |
| Admin (React) | localhost:5173 | Vercel (free) |
| DB | MongoDB Atlas M0 (free) | MongoDB Atlas M0 (free) |
| CI/CD | — | GitHub Actions + deploy-*.ps1 scriptleri |

> NOT: Onceki plan API icin Render diyordu; gercekte **Railway** kullaniliyor
> (`gowordly-service-production.up.railway.app/api`). DB de artik sadece MongoDB (SQLite kaldirildi).

**Maliyet (MVP):** $0/month (Railway deneme kredisi tukenirse Render free'ye gecis planlanir)

### Deploy Scriptleri (repo kokunde — elle/disaridan tetikleme)
| Script | Ne yapar |
|--------|----------|
| `deploy-android.ps1` | EAS Android build (preview=APK / production=AAB) |
| `deploy-ios.ps1` | EAS iOS build (preview=simulator / production=TestFlight) |
| `deploy-be.ps1` | tsc kontrol → (ops. commit) → git push → Railway deploy → health dogrulama |

### Pipeline Mimarisi
```
git push → GitHub Actions (ci.yml): API+Mobile tsc + test
API     → Railway otomatik deploy (push'ta)  |  elle: deploy-be.ps1
Admin   → Vercel otomatik
Mobile  → deploy-android.ps1 / deploy-ios.ps1 (EAS build)  |  ileride: eas update (OTA)
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

## Pipeline State (2026-06-12)
- CI workflow (.github/workflows/ci.yml): ✅ oluşturuldu (API+Mobile tsc+test)
- Build workflow (.github/workflows/build-apk.yml): ✅ oluşturuldu (workflow_dispatch — elle)
- Deploy scriptleri (deploy-android/ios/be.ps1): ✅ oluşturuldu
- Railway API service: ✅ çalışıyor (otomatik deploy)
- Vercel admin: ✅ çalışıyor
- EAS proje: ✅ bağlı (@enciney/goworldy, projectId app.json'da)
- OTA (expo-updates): ✅ kuruldu + yapılandırıldı (updates.url + runtimeVersion appVersion policy)
  - Kanallar: development / preview / production (eas.json)
  - ota-update.yml: mobile/ push'unda otomatik `eas update --branch preview`
  - Manuel OTA: `cd mobile && eas update --branch preview --message "..."`
  - OTA SADECE JS taşır; native değişiklik → yeni APK (deploy-android.ps1)
- EXPO_TOKEN secret: ⏳ kullanıcı eklemeli (GitHub Actions OTA + build için)
  - Token: expo.dev/settings/access-tokens → GitHub repo Secrets → EXPO_TOKEN

## Known Constraints
- Render free tier: 15 dakika idle sonrası spin-down, cold start ~30 saniye
- EAS free tier: 30 build/ay limit (OTA update'ler bu limite dahil değil)
- GitHub Actions: private repo için 2000 dk/ay ücretsiz

## API Build Requirements
- `tsconfig.json`'da `"outDir": "./dist"` olmalı
- `package.json`'da `"build": "tsc"` script'i olmalı
- Start command: `node dist/index.js`
- Health endpoint: `/health` — Render için eklenecek
