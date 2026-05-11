# UX/UI Agent Memory

## Design Decisions
- Chose blue/emerald color palette: blue for action, emerald for progress/success — reinforces the "journey" metaphor of emigrating.
- 4-tab bottom nav chosen over drawer: emigrant users are mobile-first, bottom nav is more thumb-friendly.
- Country cards in forum use flag emoji for instant recognition without SVG overhead.
- Paywall shown as an inline gate (not a full-screen blocker) to avoid interrupting discovery flow.
- **`#8B5CF6` violet added as "premium" token** — already consistently used in HomeScreen and PremiumScreen for premium features. Officially added to design system as a distinct premium accent. Not to be used for anything other than premium-related UI.
- **Avatar uses initials (MVP decision)** — camera roll upload deferred post-MVP. Initial letters from `displayName` are used. Acceptable for launch; revisit when user base grows.
- **Forum moderation badge**: regular users CAN see their own "pending" topics — confirmed as correct UX (transparency over confusion).
- **PrivacyScreen as full-screen Modal** — shown as `animationType="slide"` Modal from within ProfileScreen. Avoids needing a Profile stack navigator; developer can lift to a proper screen later.
- **CreditGateModal hierarchy**: primary CTA = "Bakiyeden Düş" (only when canAfford), secondary = "Premium'a Geç / Kredi Satın Al" (violet when insufficient, outlined when can afford). This spec is the canonical design for all credit-gated actions.
- **Guide step states**: 4 distinct states — completed (green), active (blue outlined, next to answer), locked (gray, tap shows toast), disqualified (amber warning, result of a blockingAnswer match). Visual differentiation is critical for the sequential unlock flow.
- **Sequential step unlock**: only the first incomplete step is "active". Steps after it are "locked" until opened. If a completed step's answer matches its `blockingAnswer`, all subsequent steps become "disqualified".

## Rejected Concepts
- Linear wizard flow for Rehberim guide — reconsidered. MVP uses sequential unlock (each step unlocks the next), which is more guided than free-form checklist but still allows going back to completed steps.

## Resolved Issues
- `ProfileScreen` "Üye" badge now uses `USER_TYPE_LABELS[userType]` fetched from `/users/me` response (resolved 2026-05-11).
- All 5 changed screens (PremiumScreen, ProfileScreen, ForumTopicsScreen, ForumTopicDetailScreen, GuideScreen) now import from `theme.ts`. Hardcoded color/spacing values eliminated from these files.
- ProfileScreen menu buttons (Bildirim Ayarları, Gizlilik, Yardım, Hakkında) are now wired with handlers. Gizlilik opens PrivacyScreen modal; Yardım opens mailto; Hakkında opens Alert.
- `mobile/src/services/api.ts` updated: `AuthUser` now includes `userType?`, `me()` return includes `userType`, `sharePhoneNumber`, `phoneNumber`; `updateMe()` accepts `sharePhoneNumber` and `phoneNumber`; `guide.getSteps()` returns `blockingAnswer?`.

## Open Design Questions
- Admin dashboard: no screens exist yet. Spec is in `agents/ux-ui/README.md` (Overview, User Management, Topic Approval Queue, Config Panel). **Next UX/UI priority**.
- `CreditGateModal` is designed but not yet wired into ForumTopicsScreen FAB — Developer agent needs to plug in credit check + deduction calls.
- `GuideScreen` locked/disqualified states work on the UI side. Developer needs to add `blockingAnswer TEXT` column to `guide_steps` DB schema and return it from the API.
- Bildirim Ayarları in ProfileScreen shows a placeholder Alert — full NotificationsScreen navigation requires developer to add a Profile stack navigator.

## Design Audit — Mobile (2026-05-11)

### Sprint Deliverables — COMPLETE ✅

| Deliverable | File | Status |
|-------------|------|--------|
| CreditGateModal component | `mobile/src/components/CreditGateModal.tsx` | ✅ New |
| PrivacyScreen | `mobile/src/screens/main/PrivacyScreen.tsx` | ✅ New |
| PremiumScreen theme refactor | `mobile/src/screens/main/PremiumScreen.tsx` | ✅ Done |
| ProfileScreen theme refactor + badge + handlers + privacy modal | `mobile/src/screens/main/ProfileScreen.tsx` | ✅ Done |
| ForumTopicsScreen theme refactor | `mobile/src/screens/main/ForumTopicsScreen.tsx` | ✅ Done |
| ForumTopicDetailScreen theme refactor | `mobile/src/screens/main/ForumTopicDetailScreen.tsx` | ✅ Done |
| GuideScreen theme refactor + 4-state step visuals | `mobile/src/screens/main/GuideScreen.tsx` | ✅ Done |
| api.ts type updates | `mobile/src/services/api.ts` | ✅ Done |

## User Research Notes
<!-- Populate as user feedback comes in -->
