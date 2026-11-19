# VidyaOS Multi-Developer Collaboration Guide

This guide describes how **multiple full-stack developers (Dev 1, Dev 2, Dev 3)** work concurrently on VidyaOS across Frontend, Backend, and Root repositories without collisions.

---

## 🏛️ Ecosystem Repositories

| Component | Directory | GitHub Repository |
| :--- | :--- | :--- |
| **Monorepo (Root)** | `VidyaOS/` | [https://github.com/onebotyt/Vidya.git](https://github.com/onebotyt/Vidya.git) |
| **Frontend UI** | `VidyaOS/frontend/` | [https://github.com/onebotyt/VidyaOS.git](https://github.com/onebotyt/VidyaOS.git) |
| **Backend API** | `VidyaOS/backend/` | [https://github.com/onebotyt/VidyaOS_BackEnd.git](https://github.com/onebotyt/VidyaOS_BackEnd.git) |

---

## 🚀 Setup for a New Developer (One-Time Setup)

Each new developer should follow these steps:

### 1. GitHub Access
Ensure the developer is added as a **Collaborator** on all 3 repositories:
- `onebotyt/Vidya`
- `onebotyt/VidyaOS`
- `onebotyt/VidyaOS_BackEnd`

### 2. Clone the Root Workspace
```bash
git clone https://github.com/onebotyt/Vidya.git VidyaOS
cd VidyaOS
```

### 3. Initialize Standalone Git Pointers
The repository includes `.git_standalone/` bare references for independent frontend and backend version control. Ensure git points to them properly:
```powershell
# Set GitHub Personal Access Token if required for private access
$env:GITHUB_PAT = "your_pat_token_here"
```

### 4. Install Dependencies
```bash
# Backend dependencies
cd backend
npm install

# Frontend dependencies
cd ../frontend
npm install
```

---

## 🔄 Daily Development Workflow & Dev AI Lifecycle

Every developer and AI assistant working on any task must adhere to the 3-phase **Git Sync & Zero-Break Integration Protocol**:

---

### Phase 1: Pre-Work Synchronization (Before Starting ANY Work)
> **Rule: NEVER write, edit, or delete any code before completing this check.**

1. **Pull All Repositories First**:
   ```powershell
   cd E:\uiap\VidyaOS
   powershell -ExecutionPolicy Bypass -File .\pull-all.ps1
   ```
   *This safely rebases and updates Frontend, Backend, and Monorepo with `--autostash`.*

2. **Inspect Recent GitHub Commits**:
   Review the last 3-5 commits pushed by other developers or AI agents:
   ```powershell
   git log -n 5 --oneline
   git --git-dir="E:\uiap\VidyaOS\.git_standalone\frontend.git" --work-tree="E:\uiap\VidyaOS\frontend" log -n 5 --oneline
   git --git-dir="E:\uiap\VidyaOS\.git_standalone\backend.git" --work-tree="E:\uiap\VidyaOS\backend" log -n 5 --oneline
   ```

3. **Align with `TODO.md`**:
   Check active tasks in `TODO.md` to ensure your planned work coordinates seamlessly with other ongoing or recently merged work.

---

### Phase 2: Create a Feature Branch or Work Isolated
If developing on an isolated feature branch:
```powershell
# Format: .\new-feature.ps1 -BranchName <name>
powershell -ExecutionPolicy Bypass -File .\new-feature.ps1 -BranchName dev2/student-portal-ui
```
This automatically branches frontend, backend, and the root monorepo.

---

### Phase 3: Develop & Test Locally
Run the backend and frontend locally:
- **Backend (Port 3000)**:
  ```powershell
  cd backend
  node server.js
  ```
- **Frontend (Port 5000)**:
  ```powershell
  cd frontend
  node server.js
  ```

---

### Phase 4: Post-Work Remote Drift Check (When Work Completes)
> **Rule: NEVER push immediately upon completing code edits.**

1. **Check for Incoming GitHub Commits**:
   While you were coding, other developers or AI agents may have pushed new commits. Pull to rebase incoming changes:
   ```powershell
   cd E:\uiap\VidyaOS
   powershell -ExecutionPolicy Bypass -File .\pull-all.ps1
   ```
2. **Preserve All Developers' Code**:
   Inspect any merged files to ensure changes from other developers were not overwritten, deleted, or conflicted.

---

### Phase 5: Zero-Break Integration Verification (Before Pushing)
> **Rule: The AI/Developer MUST check that combining all dev code does NOT break the repository main code.**

Run the verification test suite before pushing:
```powershell
cd E:\uiap\VidyaOS\backend
node scripts/test-ui-manifest-sync.js
```
- If any frontend UI was modified, run `npm run ui:scan` and `npm run ui:verify` to guarantee 100% manifest, DOM parity, and API contract sync.
- Verify server boots cleanly with `node -c server.js`.

---

### Phase 6: Push Verified Code & Open Pull Request
Only when all checks pass 100%:

**For Main Direct Sync (Primary Developer)**:
```powershell
cd E:\uiap\VidyaOS
powershell -ExecutionPolicy Bypass -File .\push-all.ps1 -Message "feat: your concise commit message"
```
*(Note: `push-all.ps1` runs automated pre-push verification gates automatically).*

**For Feature Branches (Collaborators)**:
```powershell
powershell -ExecutionPolicy Bypass -File .\push-feature.ps1 -Message "feat: enhance student portal filters"
```
The script will output 3 direct Pull Request links:
- Frontend PR: `https://github.com/onebotyt/VidyaOS/pull/new/<branch>`
- Backend PR: `https://github.com/onebotyt/VidyaOS_BackEnd/pull/new/<branch>`
- Combined PR: `https://github.com/onebotyt/Vidya/pull/new/<branch>`

---

## 🛡️ Anti-Collision & Zero-Break Rules (Invariants)
1. **GitHub First**: Always pull and check GitHub commits before writing any code.
2. **Drift Check Before Push**: Always check GitHub for new commits after completing work before pushing.
3. **Zero Broken Code**: Always verify that combined code passes automated test suites without breaking repository main.
4. **Never force push (`push --force`) to `main`.**
5. **One Feature per Branch**: Keep branches scoped to a specific task or module.
6. **Theme Tokens**: Never use hardcoded hex `#fff` colors in stylesheets—use CSS variables (`var(--bg-primary)`).
