# Antigravity Agent Guidelines & Project Memory Anchor

> **CRITICAL INSTRUCTION FOR ALL AGENT SESSIONS & CONTEXT RESTORATIONS:**
> Whenever this conversation starts, restarts, or resumes after chat history truncation ("prefix cleared"):
> 1. **IMMEDIATELY READ `TODO.md`** at the VidyaOS root: `e:/uiap/VidyaOS/TODO.md`.
> 2. `TODO.md` contains the **single source of truth** regarding the current project state, active tasks, completed milestones, architectural rules, and test suites.
> 3. **KEEP `TODO.md` SYNCHRONIZED:** Whenever you start a task, complete a task, or discover a bug/change in requirements, update `TODO.md` immediately.
> 
> 🛡️ **MANDATORY MULTI-DEV AI GIT LIFECYCLE & ZERO-BREAK INTEGRATION PROTOCOL:**
> - **Pre-Work Check (Before Writing Code)**: Always run `.\pull-all.ps1` first to pull the latest GitHub commits across Frontend, Backend, and Monorepo, and check `git log -n 5` to inspect recent changes by other devs.
> - **Post-Work Remote Drift Check (When Work Completes)**: Before pushing, check GitHub again for any new commits pushed by other devs during your session (`.\pull-all.ps1` or `git fetch`).
> - **Zero-Break Integration Gatekeeper**: Never push broken code to `main`. Always verify combined code integrity (resolve conflicts cleanly, run `node scripts/test-ui-manifest-sync.js`, verify server syntax) before pushing!

---

## 🏛️ Project Identity & Directory Structure

> [!IMPORTANT]
> **`Attendance-System-Simplified` has been RETIRED.** The canonical source of truth is now `e:/uiap/VidyaOS/`.
> Do NOT make changes to the old folder. Use the VidyaOS ecosystem exclusively.

- **Root Repository (Combined)**: `e:/uiap/VidyaOS/` → pushes to `github.com/onebotyt/Vidya.git`
- **Frontend**: `e:/uiap/VidyaOS/frontend/` → pushes to `github.com/onebotyt/VidyaOS.git`
- **Backend**: `e:/uiap/VidyaOS/backend/` → pushes to `github.com/onebotyt/VidyaOS_BackEnd.git`
- **ESP32 Firmware**: `e:/uiap/VidyaOS/VidyaOS_ESP32_Biometric_Firmware/`

### Push All 3 Repos at Once
```powershell
cd e:\uiap\VidyaOS
.\push-all.ps1 -Message "feat: your commit message here"
```
Or individually via standalone git:
```powershell
# Backend → onebotyt/VidyaOS_BackEnd.git
git --git-dir="e:\uiap\VidyaOS\.git_standalone\backend.git" --work-tree="e:\uiap\VidyaOS\backend" add -A
git --git-dir="e:\uiap\VidyaOS\.git_standalone\backend.git" --work-tree="e:\uiap\VidyaOS\backend" commit -m "..."
git --git-dir="e:\uiap\VidyaOS\.git_standalone\backend.git" --work-tree="e:\uiap\VidyaOS\backend" push origin main

# Frontend → onebotyt/VidyaOS.git
git --git-dir="e:\uiap\VidyaOS\.git_standalone\frontend.git" --work-tree="e:\uiap\VidyaOS\frontend" add -A
git --git-dir="e:\uiap\VidyaOS\.git_standalone\frontend.git" --work-tree="e:\uiap\VidyaOS\frontend" commit -m "..."
git --git-dir="e:\uiap\VidyaOS\.git_standalone\frontend.git" --work-tree="e:\uiap\VidyaOS\frontend" push origin main
```

- **Application Type**: Production-ready, full-stack institutional campus operating system (VidyaOS).
- **Technology Stack**:
  - **Backend**: Node.js, Express, MySQL 8.x (`VidyaOS_BackEnd-patched/VidyaOS_BackEnd-main/database/`), JWT auth.
  - **Frontend**: Vanilla HTML5, Modern CSS3 (CSS Variables, responsive grid/flexbox), Modular JavaScript. Android Capacitor app included.
  - **Shared Assets**: Centralized under `shared/{js,css}/` within the frontend tree.
  - **UI Map / Manifests**: `e:/uiap/VidyaOS/docs/ui-map/` (manifests, pages.md, components.md, flows.mmd).

---

## 👥 Multi-Developer Collaboration (Dev 1, Dev 2, Dev 3) & AI Dev Protocol

When any developer or AI assistant starts work on any task, follow this strict 3-phase workflow:

### Phase 1: Pre-Work Synchronization (Before Starting Any Task)
1. **GitHub First**: Before writing or modifying any code, **always check GitHub commits and pull latest changes**:
   ```powershell
   cd e:\uiap\VidyaOS
   powershell -ExecutionPolicy Bypass -File .\pull-all.ps1
   ```
2. **Review Recent Commits**: Check recent commits across all 3 repos (`git log -n 5 --oneline`) to see what other developers have completed.
3. **Synchronize with `TODO.md`**: Confirm active tasks and current milestone to avoid duplicate work or overwriting concurrent dev changes.

### Phase 2: Post-Work Remote Drift Check (When Work is Completed)
1. **Check for Incoming Commits**: When your code changes are finished, **DO NOT push immediately**. Check if another dev or AI pushed new commits while you were working:
   ```powershell
   powershell -ExecutionPolicy Bypass -File .\pull-all.ps1
   ```
2. **Rebase & Merge Cleanly**: If remote changes exist, rebase and ensure your modifications integrate cleanly without overwriting any other developer's code.

### Phase 3: Zero-Break Integration Verification (Before Pushing)
1. **Check No Broken Code in Main**: Before pushing, verify that combining all dev code does not break the repository main code:
   ```powershell
   cd e:\uiap\VidyaOS\backend
   node scripts/test-ui-manifest-sync.js
   ```
   If UI was edited, run `npm run ui:scan` and `npm run ui:verify` to guarantee 100% manifest and DOM parity.
2. **Server & Syntax Sanity**: Ensure backend boots without error (`node -c server.js`) and no uncaught exceptions.
3. **Push Verified Code**: Only after all checks pass 100%, push:
   ```powershell
   cd e:\uiap\VidyaOS
   .\push-all.ps1 -Message "feat: your commit message"
   ```
   *(Or for feature branches: `.\push-feature.ps1 -Message "..."`)*

- **Reference Guide**: Full onboarding details in [MULTI_DEVELOPER_SETUP.md](file:///e:/uiap/VidyaOS/MULTI_DEVELOPER_SETUP.md).

---

## 🔒 Primary Developer Push Policy
- Always push via `push-all.ps1` or the standalone git commands above to keep all 3 repos in sync.
- Never push only to `Vidya.git` without also pushing to `VidyaOS.git` (frontend) and `VidyaOS_BackEnd.git` (backend).

---

## ⚙️ Core Architectural Invariants (DO NOT BREAK)

1. **Theme Token Compliance (Zero Hardcoded Hex Colors)**:
   - All styles must use CSS variables (e.g. `var(--bg-primary)`, `var(--text-primary)`, `var(--border-color)`, `var(--primary-color)`).
   - Never write raw `#hex` or `rgb()` color values in HTML `<style>` tags or stylesheets.

2. **Database Engine: MySQL 8.x** (production on cPanel/Render):
   - Schemas in `VidyaOS_BackEnd-patched/VidyaOS_BackEnd-main/database/`.
   - Never use SQLite-specific syntax. All migrations are numbered 001-008.

3. **Role-Based Access Control (RBAC)**:
   - Backend routes use granular middlewares in `src/middleware/auth.js`:
     - `requireHOD()` for curriculum/faculty management.
     - `requireDepartmentFaculty()` / `requireClassTeacher()` for class management.
     - `requireSubjects()` for registers and assignments.
   - Admin role resolution: `SYSTEM_ADMIN` and `ADMIN` checked **before** TEACHER/STUDENT.
   - Frontend pages must call `guardRoute({ requireHOD: true, ... })` from shared `auth.js`.

4. **Permanent 301 Redirects for Legacy URLs**:
   - Do NOT resurrect obsolete files (`assignments.html`, `marks.html`, `quick.html`).
   - All navigation routes to consolidated tabs:
     - Assignments ➔ `/faculty/registers/index.html?tab=assignments`
     - Class Tests / Marks ➔ `/faculty/registers/index.html?tab=marks`
     - Attendance Matrix ➔ `/faculty/registers/index.html`

5. **Consolidated Register Architecture (`registers/index.html`)**:
   - Tab 1: Attendance Matrix (Day 1-31 ledger, single-line compact ESP32 toolbar, Roll Call modal).
   - Tab 2: Coursework & Assignments (scoped list, creation modal, submissions grading).
   - Tab 3: Class Tests & Marksheets (scoped exam list, scheduling modal, marks roster).
   - Dual Live Attendance Studio: Concurrent Dynamic QR code + 6-digit PIN + Live Student Check-In Log feed.

6. **Zero Test Code in GitHub (Local Verification Only)**:
   - Test scripts (`scripts/test-*.js`, `scripts/verify-*.js`, `scripts/simulate-*.js`, etc.) and test screenshots (`*.png`, `*.jpg`) are strictly local development tools and must NEVER be tracked in Git or pushed to GitHub.
   - Enforced by `.gitignore` and Git hooks (`pre-commit`, `pre-push`).

7. **UI Manifest & Contract Synchronization (UIMS)**:
   - Every page has a machine-readable JSON manifest at `e:/uiap/VidyaOS/docs/ui-map/manifests/<page-id>.json`.
   - Before working on a UI page, read its manifest to understand all buttons, modals, and APIs without grepping code.
   - After any UI change run `npm run ui:scan` and `npm run ui:verify` from the VidyaOS root.

---

## 🧪 Verification & Regression Test Suite
Run these verification scripts from `e:/uiap/VidyaOS/VidyaOS_BackEnd-patched/VidyaOS_BackEnd-main/` before declaring any task complete:
```powershell
node scripts/test-ui-manifest-sync.js         # UI Manifest, DOM parity, SHA256 content hashes, API contracts
node scripts/test-register-consolidation.js   # Tabs, deep-linking, modals, drawer, studio
node scripts/test-roll-call-upgrade.js        # Dynamic QR & PIN Roll Call studio tests
node scripts/test-live-log-checkin.js         # Real-time student check-in feed tests
node scripts/test-theme-support.js            # Theme token integrity, 0 hardcoded colors
node scripts/test-rbac-and-structure.js       # RBAC guards & permanent redirects
node scripts/test-student-self-registration.js # End-to-end self-registration & approvals
node scripts/test-api-flows.js                # Core API integration flows
```
