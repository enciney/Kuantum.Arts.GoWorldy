#requires -Version 5.1
<#
GoWorldy 3-agent loop. Sırayla PM -> UX/UI -> Developer agentlarını
bir tur çalıştırır. Her agent için README + memory bağlam olarak verilir,
Claude Code CLI headless modda (claude -p) çağrılır, çıktı log dosyasına yazılır.

Kullanım: .\run-agents.ps1
#>

$ErrorActionPreference = 'Stop'

# Önkoşul: claude CLI PATH'te olmalı
try {
    Get-Command claude -ErrorAction Stop | Out-Null
} catch {
    Write-Error "claude CLI bulunamadı. Claude Code yüklü olmalı ve PATH'te claude komutu çalıştırılabilir olmalı."
    exit 1
}

$RepoRoot = Split-Path $PSScriptRoot -Parent
$TasksFile = Join-Path $PSScriptRoot 'current-tasks.md'
$Tasks = if (Test-Path $TasksFile) { Get-Content $TasksFile -Raw -Encoding UTF8 } else { '(current-tasks.md bulunamadı — agent kendi önceliklerine göre çalışsın)' }

$Agents = @(
    @{ Name = 'project-manager'; Label = 'PM'        },
    @{ Name = 'ux-ui';           Label = 'UX/UI'     },
    @{ Name = 'developer';       Label = 'Developer' }
)

$Timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$LogDir = Join-Path $RepoRoot "logs\$Timestamp"
New-Item -ItemType Directory -Path $LogDir -Force | Out-Null

Write-Host ""
Write-Host "GoWorldy agent loop - 1 tur" -ForegroundColor Cyan
Write-Host "Log dizini: $LogDir" -ForegroundColor DarkGray
Write-Host ""

foreach ($agent in $Agents) {
    $agentDir    = Join-Path $RepoRoot "agents\$($agent.Name)"
    $readmePath  = Join-Path $agentDir 'README.md'
    $memoryPath  = Join-Path $agentDir 'memory.md'

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

    $userPrompt = @"
Yukarıdaki rolde çalışıyorsun. Aşağıda kullanıcının bu sprint için yazdığı SOMUT GÖREV LİSTESİ var — kendi rolünle ilgili maddelerini öncelikli olarak ele al ve uygula. Tamamlayamadığın kısımları açıkça belirt. Yapılan tüm değişiklikleri ve gerekçeleri Türkçe özetle (dosya yolu + satır + ne yapıldı).

# AKTİF SPRINT GÖREVLERİ (agent-commands/current-tasks.md)
$Tasks

Repo kökü (worktree değil): $RepoRoot
"@

    $logFile = Join-Path $LogDir "$($agent.Name).log"

    Write-Host ("=" * 70)
    Write-Host "▶ $($agent.Label) çalışıyor..." -ForegroundColor Yellow
    Write-Host "  log: $logFile" -ForegroundColor DarkGray
    Write-Host ("=" * 70)

    & claude -p $userPrompt `
        --append-system-prompt $systemPrompt `
        --add-dir $RepoRoot `
        --output-format text `
        --permission-mode bypassPermissions 2>&1 | Tee-Object -FilePath $logFile

    if ($LASTEXITCODE -ne 0) {
        Write-Warning "$($agent.Label) exit code $LASTEXITCODE ile bitti."
    } else {
        Write-Host ""
        Write-Host "✓ $($agent.Label) tamam." -ForegroundColor Green
    }
    Write-Host ""
}

Write-Host ("=" * 70)
Write-Host "Tüm agentlar 1 tur döndü." -ForegroundColor Cyan
Write-Host "Loglar: $LogDir" -ForegroundColor Cyan
Write-Host ("=" * 70)
