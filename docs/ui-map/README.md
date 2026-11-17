# VidyaOS — Frontend UI Memory Map

Last audited: 2026-10-29
Source revision: Milestone 410 / Complete In-Folder Isolation for Admin & Faculty
Coverage: Admin 7/7 (100% Isolated) | HOD 3/3 (100% Isolated) | Faculty 14/14 (100% Isolated) | Student 8/8 (100%) | Auth & System 3/3 (100%)

## Start here
- Pages inventory: [pages.md](pages.md)
- Reusable UI component catalog & duplication audit: [components.md](components.md)
- Role workflows & route diagram: [flows.mmd](flows.mmd)
- Design tokens & CSS custom properties: [tokens.md](tokens.md)
- UI architecture decisions & records: [decisions.md](decisions.md)

## Audit Method & Source Baseline
- **Routes & Pages**: Verified via source tree inspection across `frontend/admin/`, `frontend/faculty/`, `frontend/student/`, `frontend/login/`, and `frontend/landing/` (39 HTML route entry points).
- **Isolated Component Modules**:
  - **Admin Components (`frontend/admin/components/`)**: `UI-ADM-001..005` (Rail & drawer sidebar, header, SVG icons, admin base styles, native toast alerts, and profile studio).
  - **Faculty Components (`frontend/faculty/components/`)**: `UI-FAC-001..005` (`faculty-base.css`, `header/`, `sidebar/`, `icons.js`, `faculty-ui.js`). Eliminates 800+ duplicated SVG blocks and all outside layout/components/nav CSS & JS calls across 18 faculty/HOD pages.
- **Shared Components & Primitives**: Inspected `frontend/shared/js/` (`api.js`, `auth.js`) and `frontend/shared/css/` (`variables.css`, `reset.css`).
- **Styles & Token Integrity**: Audited all stylesheets, verifying zero raw hex color leaks and 100% CSS variable compliance (`test-theme-support.js` passing 88/88).
- **Isolation Verification**: Enforced via automated test harnesses (`verify-admin-isolation.js` 30/30, `verify-faculty-isolation.js` 108/108).
