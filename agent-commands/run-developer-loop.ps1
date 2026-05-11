#requires -Version 5.1
<#
GoWorldy Developer agent — 2 ardışık tur (bypassPermissions).
2. turun sonunda agent'tan "neler yapıldı, neler kaldı" detaylı özet ister.

Kullanım: .\run-developer-loop.ps1
#>

$ErrorActionPreference = 'Stop'

try {
    Get-Command claude -ErrorAction Stop | Out-Null
} catch {
    Write-Error "claude CLI bulunamadı."
    exit 1
}

$RepoRoot = Split-Path $PSScriptRoot -Parent
$AgentDir = Join-Path $RepoRoot "agents\developer"
$ReadmePath = Join-Path $AgentDir "README.md"
$MemoryPath = Join-Path $AgentDir "memory.md"

if (-not (Test-Path $ReadmePath)) {
    Write-Error "Developer README bulunamadı: $ReadmePath"
    exit 1
}

$Timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$LogDir = Join-Path $RepoRoot "logs\dev-loop-$Timestamp"
New-Item -ItemType Directory -Path $LogDir -Force | Out-Null

Write-Host ""
Write-Host "GoWorldy Developer loop - 2 tur (bypassPermissions)" -ForegroundColor Cyan
Write-Host "Log dizini: $LogDir" -ForegroundColor DarkGray
Write-Host ""

for ($i = 1; $i -le 1; $i++) {
    $readme = Get-Content $ReadmePath -Raw -Encoding UTF8
    $memory = if (Test-Path $MemoryPath) { Get-Content $MemoryPath -Raw -Encoding UTF8 } else { '(memory.md yok)' }

    $systemPrompt = @"
Sen GoWorldy projesinin Developer agent'ısın. Aşağıda rol tanımın ve önceki bağlamın var. Çalışma kökü: $RepoRoot

# ROL TANIMI (agents/developer/README.md)
$readme

# MEMORY (agents/developer/memory.md)
$memory
"@

    if ($false) {
        $userPrompt = ""
    } else {
        $userPrompt = @"
Tek tur: README'deki sorumluluklarına göre projenin mevcut durumunu değerlendir, en kritik bir veya iki teknik görevi seç ve uygula. Önce 'cd api && npx tsc --noEmit' ile mevcut hataları gör, varsa düzelt. Yapılan değişiklikler temiz tsc ile bitmeli.

Sonunda KULLANICI İÇİN DETAYLI BİR ÖZET YAZ (Türkçe, markdown formatında):

## Bu 2 turda yapılanlar
- Her dosya değişikliği: yol, hangi fonksiyon/satır, ne değişti, neden
- Eklenen yeni route/endpoint listesi (path + method)
- Eklenen yeni repository metodları
- Düzeltilen TypeScript / runtime hataları

## Şu an çalışır durum
- API ayağa kalkıyor mu? Hangi komutla?
- TypeScript temiz mi?
- DB schema güncel mi?

## Hâlâ eksik / yarım kalan
- Hangi özellikler için backend yok?
- Hangi mobile/admin parçalar yok?
- Hangi entegrasyonlar (Stripe, Firebase, Google) yarım?
- Bilinen buglar?

## Önerilen sonraki 3 görev (öncelik sırası)
1. ...
2. ...
3. ...

Repo kökü: $RepoRoot
"@
    }

    $logFile = Join-Path $LogDir "developer-tur-$i.log"

    Write-Host ("=" * 70)
    Write-Host "▶ Developer tur $i/2 çalışıyor..." -ForegroundColor Yellow
    Write-Host "  log: $logFile" -ForegroundColor DarkGray
    Write-Host ("=" * 70)

    & claude -p $userPrompt `
        --append-system-prompt $systemPrompt `
        --add-dir $RepoRoot `
        --output-format text `
        --permission-mode bypassPermissions 2>&1 | Tee-Object -FilePath $logFile

    if ($LASTEXITCODE -ne 0) {
        Write-Warning "Developer tur $i exit code $LASTEXITCODE ile bitti."
    } else {
        Write-Host ""
        Write-Host "✓ Developer tur $i tamam." -ForegroundColor Green
    }
    Write-Host ""
}

Write-Host ("=" * 70)
Write-Host "Developer 2 tur bitti." -ForegroundColor Cyan
Write-Host "Loglar: $LogDir" -ForegroundColor Cyan
Write-Host "Final özet için: $LogDir\developer-tur-2.log" -ForegroundColor Cyan
Write-Host ("=" * 70)
