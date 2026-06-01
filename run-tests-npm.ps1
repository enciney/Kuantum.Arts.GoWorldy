$allFailures = [System.Collections.Generic.List[hashtable]]::new()

function Strip-Ansi([string]$s) {
  $s -replace '\x1b\[[0-9;]*[mGKHFJA-Za-z]', '' -replace '\[[\d;]*m', ''
}

function Get-FailedTestNames([string[]]$lines) {
  $tests = [System.Collections.Generic.List[string]]::new()
  $seen  = [System.Collections.Generic.HashSet[string]]::new()
  foreach ($raw in $lines) {
    $line = Strip-Ansi $raw
    # Jest: "  ● Suite › test name"
    if ($line -match '^\s{2,4}●\s+(.+)$') {
      $name = $Matches[1].Trim()
      if ($name.Length -gt 3 -and $seen.Add($name)) { $tests.Add($name) }
    }
    # Vitest: " FAIL  path/file.tsx > Suite > test name" — take "Suite > test name"
    elseif ($line -match '\bFAIL\b\s+\S+\s+>\s+(.+)$') {
      $name = $Matches[1].Trim()
      if ($name.Length -gt 3 -and $seen.Add($name)) { $tests.Add($name) }
    }
  }
  return ,$tests  # comma forces array return even when 0 or 1 elements
}

function Run-Step {
  param([string]$Label, [scriptblock]$Cmd)
  Write-Host "`n$Label..." -ForegroundColor Cyan
  $tmp = [System.IO.Path]::GetTempFileName()
  & $Cmd 2>&1 | Tee-Object -FilePath $tmp
  $exit = $LASTEXITCODE
  if ($exit -ne 0) {
    $lines = Get-Content $tmp -Encoding UTF8 -ErrorAction SilentlyContinue
    $names = Get-FailedTestNames ($lines ?? @())
    $allFailures.Add(@{ Label = $Label; Tests = $names })
  }
  Remove-Item $tmp -Force -ErrorAction SilentlyContinue
}

# ── API ───────────────────────────────────────────────────────────────────────
Write-Host "=== API ===" -ForegroundColor Yellow
Set-Location "$PSScriptRoot\api"
Run-Step "API tsc"               { npm exec -- tsc --noEmit }
Run-Step "API integration tests" { npm exec -- jest Tests/integration --forceExit --passWithNoTests }
Run-Step "API unit tests"        { npm exec -- jest Tests/unit --forceExit --passWithNoTests }

# ── Mobile ────────────────────────────────────────────────────────────────────
Write-Host "`n=== Mobile ===" -ForegroundColor Yellow
Set-Location "$PSScriptRoot\mobile"
Run-Step "Mobile tsc"             { npm exec -- tsc --noEmit }
Run-Step "Mobile unit tests"      { npm exec -- jest Tests/unit --forceExit --passWithNoTests }
Run-Step "Mobile component tests" { npm exec -- jest Tests/component --forceExit --passWithNoTests }

# ── Admin ─────────────────────────────────────────────────────────────────────
# Admin panel mobile uygulamaya entegre edildi.
# Admin ekran testleri Mobile bölümündeki component testlerinde yer alır.

# ── Summary ───────────────────────────────────────────────────────────────────
$totalFailed = 0
foreach ($f in $allFailures) { $totalFailed += $f.Tests.Count }

Write-Host "`n============================================================" -ForegroundColor White
if ($allFailures.Count -eq 0) {
  Write-Host "ALL PASSED" -ForegroundColor Green
} else {
  $testWord = if ($totalFailed -eq 1) { "test" } else { "tests" }
  Write-Host "$totalFailed failed $testWord in $($allFailures.Count) step(s):" -ForegroundColor Red
  foreach ($f in $allFailures) {
    Write-Host "`n  ✗ $($f.Label)" -ForegroundColor Red
    if ($f.Tests.Count -gt 0) {
      foreach ($t in $f.Tests) {
        Write-Host "      – $t" -ForegroundColor DarkRed
      }
    } else {
      Write-Host "      (no individual test names captured — check output above)" -ForegroundColor DarkYellow
    }
  }
  exit 1
}
