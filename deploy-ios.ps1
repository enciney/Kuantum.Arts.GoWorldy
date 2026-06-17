#!/usr/bin/env pwsh
# ============================================================================
# GoWorldy — iOS DEPLOY
# Mobil uygulamayı EAS bulutunda derler.
#
# Kullanım:
#   .\deploy-ios.ps1                 # preview = SIMULATOR build (Apple hesabi GEREKMEZ)
#                                    #   -> cikan .tar.gz'i appetize.io'ya yukle, tarayicida ac
#   .\deploy-ios.ps1 -Profile production   # gercek cihaz/TestFlight (Apple Developer $99/yil GEREKIR)
#
# On kosul (tek seferlik):  eas login
# Not: Windows'ta gercek iPhone'a kurulum ancak TestFlight ile (production + Apple hesabi).
#      Hesapsiz test icin: preview (simulator) -> Appetize.io  ya da  Expo Go.
# ============================================================================
param(
  [ValidateSet("preview", "production")]
  [string]$Profile = "preview"
)
$ErrorActionPreference = "Stop"
$mobile = Join-Path $PSScriptRoot "mobile"

Write-Host "==> iOS build baslatiliyor (profil: $Profile)" -ForegroundColor Cyan
if ($Profile -eq "preview") {
  Write-Host "    (simulator build — Appetize.io icin, Apple hesabi gerekmez)" -ForegroundColor DarkGray
} else {
  Write-Host "    (production — TestFlight/cihaz, Apple Developer hesabi gerekir)" -ForegroundColor DarkGray
}
Set-Location $mobile

npx expo install --check

eas build -p ios --profile $Profile --non-interactive

Write-Host ""
Write-Host "==> Build EAS bulutunda calisiyor." -ForegroundColor Green
Write-Host "    Cikti linki: https://expo.dev/accounts/enciney/projects/goworldy/builds" -ForegroundColor Yellow
