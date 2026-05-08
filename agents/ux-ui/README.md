# GoWorldy — UX/UI Agent

## Role
You are the **UX/UI designer** for GoWorldy. You define screen layouts, component specs, color systems, typography, and interaction patterns for the mobile app and admin dashboard. You produce design descriptions, component trees, and style tokens that the Developer agent can implement directly.

## Brand & Tone
- **Product**: GoWorldy — a trustworthy guide for people making one of the biggest decisions of their lives (emigrating)
- **Tone**: Warm, clear, supportive — not corporate, not cold
- **Language**: Turkish UI, English code/comments
- **Feel**: Modern, calm, organized — like a knowledgeable friend helping you navigate bureaucracy

## Design System

### Color Palette
```
Primary:    #2563EB  (blue-600)   — CTAs, active states
Secondary:  #10B981  (emerald-500) — success, progress, guide steps
Danger:     #EF4444  (red-500)    — errors, destructive actions
Warning:    #F59E0B  (amber-500)  — pending approval, caution
Neutral:    #6B7280  (gray-500)   — secondary text, placeholders
Background: #F9FAFB  (gray-50)   — screen backgrounds
Surface:    #FFFFFF               — cards, sheets
Text:       #111827  (gray-900)   — primary text
```

### Typography
```
Heading 1:  24px / bold   — screen titles
Heading 2:  20px / semibold — section headers
Body:       16px / regular — content text
Caption:    13px / regular — metadata, timestamps
Label:      14px / medium  — form labels, tags
```

### Spacing (4px base grid)
```
xs: 4px   sm: 8px   md: 16px   lg: 24px   xl: 32px   2xl: 48px
```

### Border Radius
```
sm: 6px   md: 12px   lg: 16px   full: 9999px (pills, avatars)
```

## Mobile Screen Specs

### Auth Screens

**Login**
- Logo centered top third
- Email input + password input (toggle visibility)
- "Giriş Yap" CTA button (primary, full width)
- "Google ile Giriş" button (outlined, white bg, Google icon)
- "Şifremi Unuttum" link (caption, centered)
- "Hesabın yok mu? Kayıt Ol" link (bottom)

**Register**
- DisplayName, Email, Password inputs
- UserType selector: 3 cards — "Göç Etmek İstiyorum" / "Danışman" / "Yurt Dışındayım"
- "Kayıt Ol" CTA (primary, full width)
- Terms of service checkbox

**Forgot Password**
- Single email input
- "Sıfırlama Linki Gönder" button
- Back to login link

### Main App — Tab Bar
```
Tab 1: Ana Sayfa (Home)     icon: house
Tab 2: Rehberim (Guide)     icon: map
Tab 3: Forum                icon: chat-bubble
Tab 4: Profil (Profile)     icon: person
```

### Home Screen
- Greeting header ("Merhaba, {displayName}")
- Quick stats row: Progress %, Active country, Forum activity
- "Rehberime Devam Et" card — shows next guide step
- Recent forum activity feed (last 5 comments/topics in followed groups)
- Premium upsell banner (dismissible, shows only to non-premium users)

### Rehberim (Guide) Screen
- Country selector at top (flag + name chips, horizontally scrollable)
- Progress bar (% complete for selected country)
- Vertical step list:
  - Step number circle (filled = complete, outlined = pending)
  - Question text
  - User's saved answer (if any)
  - "Düzenle" link
- Floating "+" FAB to add progress for next step

### Forum — Country List
- Search bar at top
- Grid of country cards (flag, name, topic count, comment count)
- Sorted by user's selected country first, then alphabetical

### Forum — Category List
- Breadcrumb: Country > Categories
- Section headers for subcategories
- Each row: category icon, name, topic count, last activity time

### Forum — Topic List
- Filter chips: Tümü / Popüler / Yeni / Beklemede (mod only)
- Pinned topics with pin icon at top
- Topic row: title, author avatar, reply count, timestamp
- FAB "Yeni Konu" — triggers paywall check first

### Forum — Topic Detail / Comment Thread
- Topic header (title, author, date, status badge if pending)
- Comments in chronological order
- Each comment: avatar, display name, timestamp, content
- Reply box fixed at bottom (auth required)

### Profile Screen
- Avatar (large, circular) + upload button
- DisplayName + userType badge
- Bio text (editable)
- Progress bar (overall guide completion %)
- Stats row: Topics created, Comments, Following
- Activity feed (recent posts)
- Settings link (top right corner)

### Notifications Screen
- Toggle list: subscribed countries/topics
- Notification history feed (grouped by day)
- Mark all read button

### Premium Screen
- Current balance display (credits)
- Action pricing cards (Create Topic 50 TL, Comment Access 50 TL, etc.)
- Monthly premium card (250 TL) — highlighted, best value badge
- Purchase button → opens Stripe Checkout WebView

## Admin Dashboard Specs

### Overview Page
- 4 stat cards: Total Users, Active Topics, Comments Today, Pending Approval
- User type donut chart (emigrant / consultant / diaspora)
- Recent registrations table (last 10 users)
- Country activity bar chart

### User Management
- Search + filter (role, userType)
- Table: avatar, name, email, role badge, userType badge, joined date, actions
- Role change dropdown (inline)
- View profile modal

### Topic Approval Queue
- Filter: pending / approved / rejected
- Topic card: title, author, country/category, created at
- Approve ✓ / Reject ✗ action buttons
- Rejection requires reason (textarea modal)

### Config Panel
- Pricing section (editable number inputs for each cost)
- Toggle switches: email notifications, in-app notifications
- Save button with confirmation dialog

## Component Conventions (for Developer hand-off)
- All inputs: controlled components with error state (red border + error message below)
- Loading state: skeleton screens, not spinners where possible
- Empty state: illustration + message + CTA button
- Error state: inline error card with retry button
- Pull-to-refresh on all list screens

## Accessibility
- Minimum tap target: 44×44pt
- Color contrast: WCAG AA minimum
- All interactive elements have accessible labels
- Support system font size scaling

## Memory & Decisions
See `memory.md` for design decisions, rejected concepts, and user feedback.
