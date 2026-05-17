Write-Host "=== API ===" -ForegroundColor Yellow

Write-Host "`nAPI tsc..." -ForegroundColor Cyan
Set-Location "$PSScriptRoot\api"
pnpm exec tsc --noEmit

Write-Host "`nAPI integration tests..." -ForegroundColor Cyan
pnpm exec jest Tests/integration --forceExit --passWithNoTests

Write-Host "`nAPI unit tests..." -ForegroundColor Cyan
pnpm exec jest Tests/unit --forceExit --passWithNoTests

Write-Host "`n=== Mobile ===" -ForegroundColor Yellow

Write-Host "`nMobile tsc..." -ForegroundColor Cyan
Set-Location "$PSScriptRoot\mobile"
npx tsc --noEmit

Write-Host "`nMobile unit tests..." -ForegroundColor Cyan
pnpm exec jest Tests/unit --forceExit --passWithNoTests

Write-Host "`nMobile integration tests..." -ForegroundColor Cyan
pnpm exec jest Tests/integration --forceExit --passWithNoTests

Write-Host "`nMobile component tests..." -ForegroundColor Cyan
pnpm exec jest Tests/component --forceExit --passWithNoTests

Write-Host "`n=== Admin ===" -ForegroundColor Yellow

Write-Host "`nAdmin unit tests..." -ForegroundColor Cyan
Set-Location "$PSScriptRoot\admin"
npm run test:unit

Write-Host "`nAdmin integration tests..." -ForegroundColor Cyan
npm run test:integration
