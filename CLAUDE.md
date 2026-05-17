# GoWorldy — Agent Orchestrator

## Project
GoWorldy is a Turkish-language emigration guide platform.
- **API**: `api/` — Node.js + Express + TypeScript (scaffolded, running)
- **Mobile**: `mobile/` — React Native + Expo (not created yet)
- **Admin**: `admin/` — React + TypeScript (not created yet)
- API runs on `http://localhost:3000`

---

## Agents

Five specialized agents live in `agents/`. Each agent's role, working rules, and accumulated context are in a single `memory.md` file. Read the relevant agent's `memory.md` before acting in that agent's domain.

| Agent | File | Domain |
|-------|------|--------|
| Developer | `agents/developer/memory.md` | All code: API, mobile app, admin dashboard |
| Project Manager | `agents/project-manager/memory.md` | Planning, status, priorities, roadmap |
| UX/UI | `agents/ux-ui/memory.md` | Screen specs, design system, component design |
| DevOps | `agents/devops/memory.md` | CI/CD pipelines, deployment, infra, secrets, monitoring |
| Tester | `agents/tester/memory.md` | Writing and running tests, verifying ticket completion |

---

## How to Invoke an Agent

Prefix your request with the agent name:

```
developer: login ekranını yap
pm: durum raporu ver
uxui: forum ekranı için layout spec yaz
devops: CI/CD pipeline'ı kur
```

Or use natural language — context determines which agent is active:
- Writing/fixing code → Developer agent
- Planning, roadmap, blockers → PM agent
- Screen design, colors, components → UX/UI agent

---

## Orchestration Commands

### Full project status
```
pm: proje durumunu özetle
```
PM agent reads `agents/project-manager/memory.md` and delivers a structured Turkish status report covering all three layers.

### Start developer on a task
```
developer: [görev açıklaması]
```
Developer agent reads `agents/developer/memory.md`, implements the task, runs `tsc --noEmit`, and reports back with what was done, what files changed, and any issues found.

### Fix errors and report
```
developer: hataları tara, düzelt ve rapor ver
```
Developer agent will:
1. Run `cd api && npx tsc --noEmit` to find TypeScript errors
2. Check for runtime issues in routes/repositories
3. Fix each issue
4. Deliver a structured report (Status / Completed / Issues Found / Next Steps)

### Design a screen
```
uxui: [ekran adı] için tasarım spec'i yaz
```
UX/UI agent produces a detailed screen spec following the design system in `agents/ux-ui/README.md`.

### Plan next phase
```
pm: sonraki faz için plan yap
```
PM agent produces a prioritized task list with effort estimates and dependencies.

### Multi-agent workflow example
```
1. pm: auth flow için plan çıkar
2. uxui: login ve register ekranları için spec yaz
3. developer: uxui spec'e göre login ve register ekranlarını yap
4. developer: tsc hatasız çalıştığını doğrula ve rapor ver
```

---

## Full Permissions Mode

This project grants **full tool permissions** to enable autonomous work without approval prompts. Configured in `.claude/settings.json`.

To give an agent full autonomy on a task:
> "developer: şunu yap, tam izinle çalış, bitince rapor ver"

The agent will read files, write code, run shell commands, and fix errors without pausing for confirmation — then deliver a final report.

---

## Developer Agent — Quick Reference

### Start API
```bash
cd api && npm run dev
```

### Type check
```bash
cd api && npx tsc --noEmit
```

### Common fix patterns
- TypeScript error → read the file at the errored line, fix the type
- Missing import → check `repositories/index.ts` for exports
- Auth error → check `middleware/auth.ts` and JWT_SECRET in config
- DB error → check `repositories/sqlite/db.ts` schema

### Adding a new feature (checklist)
1. Add interface method to `IXxxRepository.ts`
2. Implement in `SqliteXxxRepository.ts`
3. Add route in `routes/xxx.ts`
4. Wire route in `src/index.ts` if new router
5. Run `tsc --noEmit`

---

## Git Workflow

### Branch & Worktree Rules
- **All agents work directly on the main repository** (`C:\Kuantum.Arts.GoWorldy`). No separate worktrees or branches unless the user explicitly requests one.
- Branch creation is the user's decision. Never create a branch without being asked.

Git MCP server is configured in `.claude/settings.json`. Use git tools for:
- Checking status and diff before committing
- Committing with descriptive messages (only when user asks)

Suggested branch naming (when user requests a branch):
```
dev/auth-screens
dev/forum-mobile
dev/admin-dashboard
pm/roadmap-update
```

---

## Sprint Ticket Workflow

Every ticket follows this mandatory flow — no exceptions:

### Step 1 — Developer
`developer` agent implements the feature or fix for the ticket.
- Runs `tsc --noEmit` before finishing.
- Reports what changed (files, functions, routes).

### Step 2 — Tester
`tester` agent takes over after developer is done.
- Reads `agents/tester/README.md` before acting.
- Writes **new tests** for the changed/added code, or **updates existing tests** if needed.
- Runs the **full test suite** (new + modified + all existing tests).
- Reports pass/fail per test.

### Step 3 — Ticket Completion
- If all tests pass → ticket is marked **done**.
- If any test fails → developer fixes the issue, then tester re-runs the full suite.
- A ticket is **never** marked done without passing tests.

### Trigger command
```
tester: [ticket adı] için testleri yaz ve çalıştır
```

### Multi-agent ticket example
```
1. developer: [ticket açıklaması] geliştir
2. tester: [ticket adı] için testleri yaz ve tam suite çalıştır
```

---

## Memory Management

Each agent maintains its own `memory.md`. After significant work sessions:
- Developer: update `agents/developer/memory.md` with resolved bugs and architectural decisions
- PM: update `agents/project-manager/memory.md` with completed phases and pivots
- UX/UI: update `agents/ux-ui/memory.md` with finalized design decisions

---

## Project Credentials & Config
- Admin: `admin@goworldy.com` / `admin123`
- JWT secret: see `config/.env.development`
- Stripe keys: see `config/.env.development`
- Firebase: see `config/.env.development`
