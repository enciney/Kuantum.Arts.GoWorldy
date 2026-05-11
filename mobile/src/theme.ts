// GoWorldy Design System Tokens
// Single source of truth for colors, typography, spacing, and border radius.
// All screen StyleSheets must import from here instead of hardcoding values.

export const Colors = {
  // Brand
  primary:    "#2563EB", // blue-600 — CTAs, active states, links
  secondary:  "#10B981", // emerald-500 — success, progress, guide steps
  premium:    "#8B5CF6", // violet-500 — premium features exclusively
  danger:     "#EF4444", // red-500 — errors, destructive actions
  warning:    "#F59E0B", // amber-500 — pending, caution
  neutral:    "#6B7280", // gray-500 — secondary text, placeholders

  // Backgrounds
  background: "#F9FAFB", // gray-50 — screen backgrounds
  surface:    "#FFFFFF", // cards, sheets, modals

  // Text
  textPrimary:   "#111827", // gray-900
  textSecondary: "#6B7280", // gray-500
  textMuted:     "#9CA3AF", // gray-400 — placeholders

  // Borders
  border:        "#E5E7EB", // gray-200 — default borders
  borderStrong:  "#D1D5DB", // gray-300 — input borders

  // Semantic surfaces (tinted backgrounds for states)
  primaryLight:  "#EFF6FF", // blue-50
  secondaryLight:"#ECFDF5", // emerald-50
  dangerLight:   "#FEE2E2", // red-100
  warningLight:  "#FFFBEB", // amber-50
  premiumLight:  "#F5F3FF", // violet-50
} as const;

export const Typography = {
  h1: { fontSize: 24, fontWeight: "700" as const },   // screen titles
  h2: { fontSize: 20, fontWeight: "600" as const },   // section headers
  body: { fontSize: 16, fontWeight: "400" as const }, // content text
  label: { fontSize: 14, fontWeight: "500" as const },// form labels, tags
  caption: { fontSize: 13, fontWeight: "400" as const },// metadata, timestamps
  small: { fontSize: 12, fontWeight: "400" as const }, // helper text
} as const;

// 4px base grid
export const Spacing = {
  xs:  4,
  sm:  8,
  md:  16,
  lg:  24,
  xl:  32,
  xxl: 48,
} as const;

export const Radius = {
  sm:   6,
  md:   12,
  lg:   16,
  full: 9999, // pills, avatars
} as const;

// Minimum WCAG AA tap target
export const MinTapTarget = 44;
