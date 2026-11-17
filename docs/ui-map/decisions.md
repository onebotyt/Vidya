# UI Architecture Decisions & Exceptions

Last audited: 2026-10-28

## DEC-001: Dynamic Schema-Driven Dialog System vs. Hardcoded HTML Modals
- **Date**: 2026-10-28
- **Context**: The existing frontend contains 656 hardcoded modal `div` elements, 30 identical copy-pasted delete confirmation modals, and 21 bespoke edit modals with manual field markup across 32 HTML files. This bloats the codebase by over 35,000 lines of repetitive HTML and JavaScript event binding.
- **Decision**: Introduce a centralized, declarative dynamic dialog engine (`ConfirmDialog` and `DynamicFormDialog`) inspired by modern React/Radix UI patterns. Rather than creating a static modal in every HTML file, pages invoke a lightweight JavaScript function passing a JSON schema (title, fields, initial values, validation, and submission callback).
- **Alternatives Considered**:
  - *Keep separate HTML modals*: Rejected due to high maintenance overhead and divergence in styling and accessibility.
  - *Web Components (`<app-modal>`)*: Considered, but vanilla schema-driven JS functions offer superior ergonomics, zero build step requirements, and instant compatibility with existing page scripts.
- **Affected IDs/Files**: All 39 pages; `UI-001`, `UI-002`, `frontend/shared/js/ui.js`.

---

## DEC-002: Zero Native Dialogs & Automated Session Takeover
- **Date**: 2026-10-27 (Milestone 336)
- **Context**: Browser native `window.alert()` and `window.confirm()` freeze JavaScript execution, cause bad UX on mobile devices, and look unprofessional. Furthermore, manual conflict cards on multi-device logins created unnecessary user friction.
- **Decision**:
  1. Ban native `alert()` and `confirm()` completely. Destructive actions must invoke `ConfirmDialog` or `showToast`.
  2. Implement automated session takeover on multi-device logins: when a user logs in from a new device, the old device is smoothly revoked with a non-blocking query redirect (`?reason=session_transferred`).
- **Affected IDs/Files**: `frontend/shared/js/auth.js`, `frontend/shared/js/api.js`, `backend/src/services/authService.js`.

---

## DEC-003: Consolidated 3-in-1 Register Architecture
- **Date**: 2026-10-26 (Milestone 330)
- **Context**: Previously, Faculty attendance, assignments, and test marks lived in disconnected, redundant pages (`assignments.html`, `marks.html`, `quick.html`), confusing faculty and duplicating cohort selection toolbars.
- **Decision**: Consolidate into a single high-efficiency portal `/faculty/registers.html` with three dedicated tabs:
  - Tab 1: Attendance Matrix (Day 1-31 monthly ledger, ESP32 hardware bar, live Roll-Call studio).
  - Tab 2: Coursework & Assignments (cohort-scoped assignment list, creation modal, grading).
  - Tab 3: Class Tests & Marksheets (test list, marksheet roster, score entry).
  - Permanent 301 redirects installed from obsolete URLs.
- **Affected IDs/Files**: `FAC-001`, `frontend/faculty/registers/`, `backend/server.js`.

---

## DEC-004: Universal Zero-Flash App Shell & Native View Transitions
- **Date**: 2026-10-27 (Milestone 335, 337)
- **Context**: Multi-page applications suffer from "flash of unstyled content" (FOUC) and jarring header redraws on route changes.
- **Decision**: Deploy `@view-transition { navigation: auto; }` and universal App Shell (`nav.css`, `nav.js`) across all 39 portal pages. The navbar (`.gc-navbar`) and drawer remain stationary while only the main page content transitions smoothly.
- **Affected IDs/Files**: All 39 HTML pages, `frontend/shared/nav/`.

---

## DEC-005: Progressive Role-by-Role Migration Sequence
- **Date**: 2026-10-28
- **Context**: Migrating 117,655 lines of frontend code in a single leap risks regressions and downtime.
- **Decision**: Execute migration in a clean target directory (`frontend-v2/` or modular package) role by role:
  1. **Phase 1: Admin**: Academic Structure, Faculty Roster, Dashboard, Audit Logs, Settings.
  2. **Phase 2: HOD**: Department Teachers, Settings, Common Teachers.
  3. **Phase 3: Faculty**: Registers (Matrix, Roll-Call, Coursework, Tests), Class Groups, Gradebooks.
  4. **Phase 4: Student**: Dashboard, Monthly Attendance, Assignments To-do, Exam Scores.
  The existing `frontend/` remains 100% active and runnable as the rollback path and test reference throughout the migration.
- **Affected IDs/Files**: `frontend-audit-and-migration-plan.md`, `TODO.md`.
