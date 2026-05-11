# Agent Commands

Claude Code agent'larını headless modda (`claude -p`) toplu çalıştıran PowerShell script'leri. Her script `bypassPermissions` ile çalışır — agent hiçbir şey için onay sormaz.

| Script | Amaç |
|--------|------|
| `run-agents.ps1` | PM → UX/UI → Developer sırasıyla 1 tur (3 agent) |
| `run-developer-loop.ps1` | Sadece Developer agent'ı, döngü içinde (script içindeki `for` sayısıyla ayarla) |

## Çalıştırma

Repo kökünden:
```powershell
.\agent-commands\run-agents.ps1
.\agent-commands\run-developer-loop.ps1
```

Loglar `logs/<timestamp>/` altına yazılır. Her agent için ayrı `.log` dosyası.

## Önkoşullar
- `claude` CLI PATH'te erişilebilir olmalı
- `agents/<name>/README.md` (rol tanımı) ve opsiyonel `memory.md` (geçmiş bağlam) dosyaları mevcut olmalı
