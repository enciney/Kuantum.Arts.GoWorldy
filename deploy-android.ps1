#!/usr/bin/env pwsh
# ============================================================================
# GoWorldy — ANDROID DEPLOY
# Mobil uygulamayı EAS bulutunda derler → kurulabilir APK linki üretir.
#
# Kullanım:
#   .\deploy-android.ps1                 # preview profili (APK, demo/test icin)
#   .\deploy-android.ps1 -Profile production   # store (AAB) build
#
# On kosul (tek seferlik):  eas login   (Expo hesabiyla giris)
# ============================================================================
param(
  [ValidateSet("preview", "production")]
  [string]$Profile = "preview"
)
$ErrorActionPreference = "Stop"
$mobile = Join-Path $PSScriptRoot "mobile"

Write-Host "==> ANDROID build baslatiliyor (profil: $Profile)" -ForegroundColor Cyan
Set-Location $mobile

# Bagimlilik uyumu (SDK ile uyumsuz paket build'i cokertir)
npx expo install --check

eas build -p android --profile $Profile --non-interactive

Write-Host ""
Write-Host "==> Build EAS bulutunda calisiyor." -ForegroundColor Green
Write-Host "    Kurulum linki cikinca buradan da gorebilirsin:" -ForegroundColor Green
Write-Host "    https://expo.dev/accounts/enciney/projects/goworldy/builds" -ForegroundColor Yellow
