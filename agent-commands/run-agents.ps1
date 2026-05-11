#requires -Version 5.1
<#
GoWorldy 4-agent loop.
Sıra: PM → Tester → Developer → UX/UI

Kullanım:
  .\run-agents.ps1                          # 1 tur, current-tasks.md'deki görevler
  .\run-agents.ps1 3                        # 3 tur
  .\run-agents.ps1 2 "login butonu çalışmıyor, düzelt"   # 2 tur + PM'e high-level görev
#>

param(
    [int]$Loops = 1,
    [string]$PmTask = ""
)

$ErrorActionPreference = 'Stop'

try {
    Get-Command claude -ErrorAction Stop | Out-Null
} catch {
    Write-Error "claude CLI bulunamadı. Claude Code yüklü olmalı ve PATH'te claude komutu çalıştırılabilir olmalı."
    exit 1
}

$RepoRoot    = Split-Path $PSScriptRoot -Parent
$TasksFile   = Join-Path $PSScriptRoot 'current-tasks.md'
$Tasks       = if (Test-Path $TasksFile) { Get-Content $TasksFile -Raw -Encoding UTF8 } else { '(current-tasks.md bulunamadı — agent kendi önceliklerine göre çalışsın)' }
$ProgressLog = Join-Path $PSScriptRoot 'agent-progress.log'

$Agents = @(
    @{ Name = 'project-manager'; Label = 'PM'        },
    @{ Name = 'tester';          Label = 'Tester'    },
    @{ Name = 'developer';       Label = 'Developer' },
    @{ Name = 'ux-ui';           Label = 'UX/UI'     }
)

$Timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$LogDir    = Join-Path $RepoRoot "logs\$Timestamp"
New-Item -ItemType Directory -Path $LogDir -Force | Out-Null

Write-Host ""
Write-Host "GoWorldy agent loop — $Loops tur  (PM → Tester → Developer → UX/UI)" -ForegroundColor Cyan
if ($PmTask) {
    Write-Host "PM görevi: $PmTask" -ForegroundColor DarkYellow
}
Write-Host "Log dizini: $LogDir" -ForegroundColor DarkGray
Write-Host ""

@"
[$((Get-Date).ToString('HH:mm:ss'))] ==== GoWorldy Agent Loop başladı - $Loops tur ====
"@ | Out-File -FilePath $ProgressLog -Force

for ($loop = 1; $loop -le $Loops; $loop++) {
    Write-Host ""
    Write-Host ("*" * 70) -ForegroundColor Magenta
    Write-Host "  TUR $loop / $Loops" -ForegroundColor Magenta
    Write-Host ("*" * 70) -ForegroundColor Magenta
    Write-Host ""

    foreach ($agent in $Agents) {
        $agentDir   = Join-Path $RepoRoot "agents\$($agent.Name)"
        $readmePath = Join-Path $agentDir 'README.md'
        $memoryPath = Join-Path $agentDir 'memory.md'

        if (-not (Test-Path $readmePath)) {
            Write-Warning "$($agent.Label): README.md yok ($readmePath) — atlanıyor."
            continue
        }

        $readme = Get-Content $readmePath -Raw -Encoding UTF8
        $memory = if (Test-Path $memoryPath) { Get-Content $memoryPath -Raw -Encoding UTF8 } else { '(memory.md yok)' }

        $systemPrompt = @"
Sen GoWorldy projesinin $($agent.Label) agent'ısın. Aşağıda rol tanımın ve önceki bağlamın var. Çalışma kökü: $RepoRoot

# ROL TANIMI (agents/$($agent.Name)/README.md)
$readme

# MEMORY (agents/$($agent.Name)/memory.md)
$memory
"@

        # PM için user prompt: önce PmTask (varsa), sonra current-tasks.md
        if ($agent.Name -eq 'project-manager') {
            $pmSection = if ($PmTask) {
@"

# STAKEHOLDERDEn GELEN HIGH-LEVEL GÖREV
$PmTask

"@
            } else { "" }

            $userPrompt = @"
Yukarıdaki PM rolünde çalışıyorsun.$pmSection
Aşağıda mevcut sprint görev listesi var. Stakeholder'dan gelen high-level görevi (varsa) analiz et, ilgili agent memory'lerini güncelle ve öncelikleri belirle. Sprint görevlerini de dikkate alarak üst seviye bir özet rapor üret. Türkçe yaz.

# MEVCUT SPRINT GÖREVLERİ (agent-commands/current-tasks.md)
$Tasks

Repo kökü: $RepoRoot
"@
        } else {
            $userPrompt = @"
Yukarıdaki rolde çalışıyorsun. Önce kendi `agents/$($agent.Name)/memory.md` dosyasını oku — PM veya Tester'ın yazdığı güncel görevler orada. Rolünle ilgili maddeleri öncelik sırasına göre uygula. Tamamlayamadığın kısımları açıkça belirt. Yaptığın her değişikliği Türkçe özetle (dosya yolu + satır + ne yapıldı + neden).

# REFERANS SPRINT GÖREVLERİ (agent-commands/current-tasks.md)
$Tasks

Repo kökü: $RepoRoot
"@
        }

        $logFile    = Join-Path $LogDir "tur$loop-$($agent.Name).log"
        $promptFile = Join-Path $env:TEMP "gw-agent-$($agent.Name).txt"

        # Sistem bağlamı + kullanıcı görevi → tek temp dosyaya yaz (Windows komut satırı uzunluk limitini aşmamak için)
        $fullPrompt = @"
[AGENT SYSTEM CONTEXT]
$systemPrompt

[TASK]
$userPrompt
"@
        [System.IO.File]::WriteAllText($promptFile, $fullPrompt, [System.Text.Encoding]::UTF8)

        Write-Host ("=" * 70)
        Write-Host "  ▶  $($agent.Label) çalışıyor...  (tur $loop)" -ForegroundColor Yellow
        Write-Host "     log: $logFile" -ForegroundColor DarkGray
        Write-Host ("=" * 70)

        # Progress log'a yazma
        $startTime = Get-Date
        "[$($startTime.ToString('HH:mm:ss'))] TUR ${loop}: $($agent.Label) başladı" | Add-Content -Path $ProgressLog

        Get-Content $promptFile -Raw | & claude `
            --add-dir $RepoRoot `
            --output-format text `
            --permission-mode bypassPermissions 2>&1 | Tee-Object -FilePath $logFile

        Remove-Item $promptFile -ErrorAction SilentlyContinue

        $endTime = Get-Date
        $elapsed = [math]::Round(($endTime - $startTime).TotalSeconds)
        $status = if ($LASTEXITCODE -eq 0) { "✓" } else { "✗" }
        "[$($endTime.ToString('HH:mm:ss'))] TUR ${loop}: $($agent.Label) bitti ($elapsed`s) $status" | Add-Content -Path $ProgressLog

        if ($LASTEXITCODE -ne 0) {
            Write-Warning "$($agent.Label) exit code $LASTEXITCODE ile bitti."
        } else {
            Write-Host ""
            Write-Host "  ✓  $($agent.Label) tamam." -ForegroundColor Green
        }
        Write-Host ""
    }

    Write-Host ""
    Write-Host "--- Tur $loop / $Loops tamamlandı ---" -ForegroundColor Magenta
    Write-Host ""
}

"[$((Get-Date).ToString('HH:mm:ss'))] ==== Tüm agentlar $Loops tur tamamladı ====" | Add-Content -Path $ProgressLog

Write-Host ("=" * 70)
Write-Host "Tüm agentlar $Loops tur döndü." -ForegroundColor Cyan
Write-Host "Loglar: $LogDir" -ForegroundColor Cyan
Write-Host "Progress: $ProgressLog" -ForegroundColor Cyan
Write-Host ("=" * 70)
