# Antigravity Agent Guidelines & Project Memory Anchor

> **CRITICAL INSTRUCTION FOR ALL AGENT SESSIONS & CONTEXT RESTORATIONS:**
> Whenever this conversation starts, restarts, or resumes after chat history truncation ("prefix cleared"):
> 1. **IMMEDIATELY READ `TODO.md`** at the workspace root (`d:/uiap/TODO.md` or `d:/uiap/Attendance-System-Simplified/TODO.md`).
> 2. `TODO.md` contains the **single source of truth** regarding the current project state, active tasks, completed milestones, architectural rules, and test suites.
> 3. **KEEP `TODO.md` SYNCHRONIZED:** Whenever you start a task, complete a task, or discover a bug/change in requirements, update `TODO.md` immediately.

---

## 🏛️ Project Identity & Directory Structure
- **Root Repository**: `d:/uiap/Attendance-System-Simplified/`
- **Application Type**: Production-ready, full-stack institutional college attendance and course management system.
- **Technology Stack**:
  - **Backend**: Node.js, Express, SQLite (`backend/college_attendance.sqlite`).
  - **Frontend**: Vanilla HTML5, Modern CSS3 (CSS Variables, responsive grid/flexbox), Modular JavaScript.
  - **Shared Assets**: Centralized under `frontend/shared/{js,css}/` (aliased in Express as `/js`, `/css`, and `/shared`).

---

## ⚙️ Core Architectural Invariants (DO NOT BREAK)

1. **Theme Token Compliance (Zero Hardcoded Hex Colors)**:
   - All styles must use CSS variables defined in `frontend/shared/css/variables.css` (e.g. `var(--bg-primary)`, `var(--text-primary)`, `var(--border-color)`, `var(--primary-color)`).
   - Never write raw `#hex` or `rgb()` color values in HTML `<style>` tags or stylesheets. Verify with `test-theme-support.js`.

2. **Database Engine: SQLite**:
   - The database is SQLite3. Never use MySQL-specific SQL syntax (such as `TIMESTAMPDIFF`, `NOW()`, or backticks around tables). Compute date diffs in JavaScript.

3. **Role-Based Access Control (RBAC)**:
   - Backend routes must use the granular middlewares in `backend/src/middleware/auth.js`:
     - `requireHOD()` for curriculum/faculty management.
     - `requireDepartmentFaculty()` (and backward-compatible `requireClassTeacher()`) allowing all branch faculty to manage and assist student rosters, approvals, and cohorts.
     - `requireSubjects()` for registers and assignments.
   - Frontend pages must call `guardRoute({ requireHOD: true, ... })` from `frontend/shared/js/auth.js`.

4. **Permanent 301 Redirects for Legacy URLs**:
   - Do NOT resurrect obsolete files (`assignments.html`, `marks.html`, `quick.html`).
   - All navigation routes to consolidated tabs:
     - Assignments ➔ `/faculty/registers.html?tab=assignments`
     - Class Tests / Marks ➔ `/faculty/registers.html?tab=marks`
     - Attendance Matrix ➔ `/faculty/registers.html`

5. **Consolidated Register Architecture (`registers.html`)**:
   - Tab 1: Attendance Matrix (Day 1-31 ledger, single-line compact ESP32 toolbar, Roll Call modal).
   - Tab 2: Coursework & Assignments (scoped list, creation modal, submissions grading).
   - Tab 3: Class Tests & Marksheets (scoped exam list, scheduling modal, marks roster).
   - Dual Live Attendance Studio (`#manual-roll-modal`): Concurrent Dynamic QR code + 6-digit PIN + Live Student Check-In Log feed.

6. **Zero Test Code in GitHub (Local Verification Only)**:
   - Test scripts (`scripts/test-*.js`, `scripts/verify-*.js`, `scripts/simulate-*.js`, etc.) and test screenshots (`*.png`, `*.jpg`) are strictly local development tools and must NEVER be tracked in Git or pushed to GitHub.
   - Enforced by `.gitignore` and Git hooks (`pre-commit`, `pre-push`). All test files remain on local disk to run regression test suites, but must never be committed or pushed to remote repositories.

---

## 🧪 Verification & Regression Test Suite
Run these verification scripts from `d:/uiap/Attendance-System-Simplified/backend/` before declaring any task complete:
```powershell
node scripts/test-register-consolidation.js   # 48/48 tests (Tabs, deep-linking, modals, drawer, studio)
node scripts/test-roll-call-upgrade.js        # Dynamic QR & PIN Roll Call studio tests
node scripts/test-live-log-checkin.js         # Real-time student check-in feed tests
node scripts/test-theme-support.js            # 93/93 tests (Theme token integrity, 0 hardcoded colors)
node scripts/test-rbac-and-structure.js       # 30/30 tests (RBAC guards & permanent redirects)
node scripts/test-student-self-registration.js # 27/27 tests (End-to-end self-registration & approvals)
node scripts/test-api-flows.js                # Core API integration flows
```
