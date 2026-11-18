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

## 🔄 Daily Development Workflow

### Step 1: Always Pull the Latest `main` Before Starting
Before starting any new feature or fix:
```powershell
cd E:\uiap\VidyaOS
powershell -ExecutionPolicy Bypass -File .\pull-all.ps1
```
This rebases and synchronizes all 3 repositories to the latest `main`.

---

### Step 2: Create a Feature Branch
Do not work directly on `main`. Create an isolated feature branch across all 3 repos:
```powershell
# Format: .\new-feature.ps1 -BranchName <name>
powershell -ExecutionPolicy Bypass -File .\new-feature.ps1 -BranchName dev2/student-portal-ui
```
This automatically branches frontend, backend, and the root monorepo.

---

### Step 3: Develop & Test Locally
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

### Step 4: Verify Before Pushing
Run automated tests in backend before committing:
```powershell
cd backend
node scripts/test-ui-manifest-sync.js
node scripts/test-theme-support.js
```

---

### Step 5: Push Feature Branch & Open Pull Request
When work is complete, push the branch:
```powershell
powershell -ExecutionPolicy Bypass -File .\push-feature.ps1 -Message "feat: enhance student portal filters"
```
The script will output 3 direct Pull Request links:
- Frontend PR: `https://github.com/onebotyt/VidyaOS/pull/new/dev2/student-portal-ui`
- Backend PR: `https://github.com/onebotyt/VidyaOS_BackEnd/pull/new/dev2/student-portal-ui`
- Combined PR: `https://github.com/onebotyt/Vidya/pull/new/dev2/student-portal-ui`

Open the PR links on GitHub, assign a reviewer, and merge when approved.

---

## 🛡️ Anti-Collision Rules (Invariants)
1. **Never force push (`push --force`) to `main`.**
2. **One Feature per Branch**: Keep branches scoped to a specific task or module.
3. **Pull Before Merge**: If `main` moves forward while you are working, run `.\pull-all.ps1` to rebase cleanly before creating the final PR.
4. **Theme Tokens**: Never use hardcoded hex `#fff` colors in stylesheets—use CSS variables (`var(--bg-primary)`).
