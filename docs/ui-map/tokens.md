# Design Tokens & Stylesheet Reference

Last audited: 2026-10-28
Source: `frontend/shared/css/variables.css` & `frontend/shared/css/components.css`

## 1. Core Token Inventory

| Token | Current Value | Semantic Use | Proposed Central Token | Evidence / Notes |
|---|---|---|---|---|
| `--font-family-sans` | `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif` | Primary UI typography, headings, labels, buttons | `--font-sans` | Loaded via Google Fonts across all 39 HTML pages |
| `--font-family-mono` | `'JetBrains Mono', monospace` | Numeric roll numbers, time codes, dates, PINs | `--font-mono` | Used in PIN codes, timestamps, matrix headers |
| `--color-primary` | `hsl(220, 90%, 56%)` | Primary brand accent, active buttons, focus outlines | `--color-primary` | Invariant brand blue |
| `--color-primary-hover` | `hsl(220, 90%, 48%)` | Hover state for primary buttons and interactive items | `--color-primary-hover` | Invariant |
| `--color-primary-light` | `hsl(220, 90%, 96%)` | Subtle tint for active navigation tabs and chips | `--color-primary-subtle` | Light mode tint |
| `--status-present` | `hsl(142, 71%, 45%)` | Student marked Present (Green) | `--status-present` | Strict invariant, tested in test-theme-support.js |
| `--status-present-bg` | `hsl(142, 71%, 95%)` | Background badge for Present status | `--status-present-bg` | Strict invariant |
| `--status-absent` | `hsl(0, 84%, 60%)` | Student marked Absent / Critical Danger (Red) | `--status-absent` | Strict invariant |
| `--status-absent-bg` | `hsl(0, 84%, 96%)` | Background badge for Absent status | `--status-absent-bg` | Strict invariant |
| `--status-late` | `hsl(38, 92%, 50%)` | Student marked Late / Warning (Amber) | `--status-late` | Strict invariant |
| `--status-late-bg` | `hsl(38, 92%, 95%)` | Background badge for Late status | `--status-late-bg` | Strict invariant |
| `--status-pending` | `hsl(215, 80%, 55%)` | Unmarked / Pending attendance record | `--status-pending` | Strict invariant |
| `--status-pending-bg` | `hsl(215, 80%, 96%)` | Background for pending record | `--status-pending-bg` | Strict invariant |
| `--bg-app` | `#f8fafc` | Global viewport background (Slate 50) | `--bg-app` | Zero hardcoded `#f8fafc` in templates |
| `--bg-card` | `#ffffff` | Content containers, modal dialogs, data tables | `--bg-card` | Strict token |
| `--bg-surface` | `#f1f5f9` | Secondary controls, search inputs, table headers | `--bg-surface` | Slate 100 |
| `--border-color` | `#e2e8f0` | Standard divider and border (Slate 200) | `--border-subtle` | Strict token |
| `--border-focus` | `#94a3b8` | Focus ring boundary (Slate 400) | `--border-focus` | Keyboard accessibility |
| `--text-main` | `#0f172a` | Primary body and heading text (Slate 900) | `--text-primary` | WCAG AAA contrast ratio > 12:1 |
| `--text-muted` | `#64748b` | Subtitles, helper text, table column headers (Slate 500) | `--text-secondary` | WCAG AA contrast ratio > 4.5:1 |
| `--radius-xs` | `4px` | Small tags, sub-pills, badges | `--radius-xs` | Precise micro-rounding |
| `--radius-sm` | `6px` | Buttons, tags, status chips | `--radius-sm` | Consistent rounded aesthetic |
| `--radius-md` | `10px` | Form inputs, popovers, notifications | `--radius-md` | Consistent rounded aesthetic |
| `--radius-lg` | `16px` | Modal dialogs, main content cards, drawers | `--radius-lg` | Consistent rounded aesthetic |
| `--radius-full` | `9999px` | Badges, avatar circles, pill indicators | `--radius-full` | Fully rounded pills/circles |
| `--shadow-sm` | `0 1px 2px 0 rgba(0, 0, 0, 0.05)` | Buttons, input focus, hover elevation | `--shadow-sm` | Subtle depth |
| `--shadow-md` | `0 4px 6px -1px rgba(0,0,0,0.08), 0 2px 4px -1px rgba(0,0,0,0.04)` | Dropdown menus, popovers, sticky headers | `--shadow-md` | Elevation level 2 |
| `--shadow-lg` | `0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)` | Modal dialogs, roll-call studio modal | `--shadow-lg` | Elevation level 3 |
| `--shadow-xl` | `0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)` | High-elevation overlays, modal cards, command palette | `--shadow-xl` | Elevation level 4 |
| `--color-primary-subtle` | `rgba(37, 99, 235, 0.12)` | Subtle tint for active items & hover states | `--color-primary-subtle` | Light/dark theme tokenized |
| `--text-on-primary` | `#ffffff` | Foreground text on primary colored fills | `--text-on-primary` | High-contrast white |
| `--bg-primary` | `var(--bg-app)` | Primary page background compatibility token | `--bg-primary` | Theme-adaptive |
| `--modal-max-width` | `540px` | Standard modal dialog constraint token | `--modal-max-width` | Theme-adaptive |
| `--bg-overlay` | `rgba(15, 23, 42, 0.55)` | Backdrop dimming behind modal dialogs | `--bg-overlay` | Blur overlay |

---

## 2. Role Chip Identity Tokens

| Role | Chip Background Token | Chip Text Color Token | Preview |
|---|---|---|---|
| **System Admin** | `--chip-admin-bg: #fee2e2` | `--chip-admin-color: #991b1b` | Red badge |
| **HOD** | `--chip-hod-bg: #fef3c7` | `--chip-hod-color: #92400e` | Amber badge |
| **Class Teacher** | `--chip-classteacher-bg: #dbeafe` | `--chip-classteacher-color: #1e40af` | Blue badge |
| **Faculty** | `--chip-faculty-bg: #ede9fe` | `--chip-faculty-color: #6b21a8` | Purple badge |
| **Student** | `--chip-student-bg: #dcfce7` | `--chip-student-color: #166534` | Emerald badge |

---

## 3. CSS Elimination Target: Shared vs Page-Local Styles

Currently, 51 separate CSS files duplicate common component rules:
- **`components.css`**: Central home for all buttons (`.btn`, `.btn-primary`, `.btn-secondary`, `.btn-danger`), forms (`.form-group`, `.form-input`, `.form-select`), badges, cards, and data tables.
- **`nav.css`**: Central home for `.gc-navbar`, `#app-sidebar`, `.gc-drawer-*`, and `#vidyaos-nav-progress`.
- **Target Architecture**: Eliminate individual page CSS files that merely re-declare `.card`, `.table`, `.btn`, `.modal`. Each page should only declare genuine feature-unique layouts (e.g. 31-day attendance matrix column layout).
