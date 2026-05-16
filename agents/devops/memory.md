# DevOps Agent Memory

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
