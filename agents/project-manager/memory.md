# Project Manager Memory

## Key Decisions
- Mobile app is the primary product; admin dashboard is secondary.
- SQLite used for local dev — no need for MongoDB setup during development phase.
- Forum pricing model: pay-per-action (not paywalled reading), except comment access.
- Topics require approval to keep content quality high.

## Stakeholder Priorities (as understood)
1. Get auth + mobile navigation working first.
2. Forum is the highest-engagement feature — prioritize after auth.
3. Rehberim (guide) differentiates the product from generic forums.
4. Admin dashboard can be minimal for MVP — just user roles + topic approval queue.

## Resolved Debates
<!-- Populate as decisions are made -->

## Open Questions
- Will push notifications be Firebase FCM or Expo Notifications?
- Is there a designer providing mockups, or should UX-UI agent generate them?
- Target app store: App Store only, Google Play only, or both?
