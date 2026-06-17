#!/usr/bin/env pwsh
# ============================================================================
# GoWorldy — BACKEND (API) DEPLOY  [external trigger]
# Railway, GitHub'a bagli oldugu icin push'la OTOMATIK deploy eder.
# Bu script o akisi elle/disaridan tetikler + deploy'u dogrular.
#
# Kullanım:
#   .\deploy-be.ps1                          # mevcut commit'leri push'lar + dogrular
#   .\deploy-be.ps1 -Message "fix: ..."      # api/ degisikliklerini commit'ler, push'lar, dogrular
#
# Akis:  tsc kontrol -> (ops. commit) -> git push -> Railway deploy -> health dogrulama
# ============================================================================
param(
  [string]$Message
)
$ErrorActionPreference = "Stop"
$root = $PSScriptRoot
$apiUrl = "https://gowordly-service-production.up.railway.app/api/forum/countries"

# 1) Guvenlik: API derlenmeli
Write-Host "==> API typecheck (tsc --noEmit)" -ForegroundColor Cyan
Set-Location (Join-Path $root "api")
npx tsc --noEmit
Set-Location $root

# 2) Opsiyonel commit
if ($Message) {
  Write-Host "==> api/ degisiklikleri commit'leniyor: $Message" -ForegroundColor Cyan
  git add api
  git commit -m $Message
}

# 3) Push -> Railway otomatik deploy
Write-Host "==> git push (Railway otomatik deploy tetiklenir)" -ForegroundColor Cyan
git push

# 4) Deploy dogrulama (Railway ~1-2 dk surer)
Write-Host "==> Deploy bekleniyor, API dogrulaniyor..." -ForegroundColor Cyan
$ok = $false
for ($i = 1; $i -le 20; $i++) {
  Start-Sleep -Seconds 9
  try {
    $r = Invoke-WebRequest -Uri $apiUrl -TimeoutSec 10 -UseBasicParsing
    if ($r.StatusCode -eq 200) { $ok = $true; break }
  } catch { Write-Host "   deneme $i/20 — henuz hazir degil..." -ForegroundColor DarkGray }
}

if ($ok) {
  Write-Host "==> BASARILI: API ayakta ve cevap veriyor." -ForegroundColor Green
} else {
  Write-Host "==> UYARI: API 3 dk icinde dogrulanamadi. Railway loglarini kontrol et:" -ForegroundColor Red
  Write-Host "    https://railway.app  ->  proje  ->  Deployments / Logs" -ForegroundColor Yellow
  exit 1
}
