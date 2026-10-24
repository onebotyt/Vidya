# 🤖 Antigravity AI & Dev 2 Collaboration Instructions

> **MANDATORY INSTRUCTIONS FOR DEV 2 & ANTIGRAVITY AI SESSIONS:**
> If you are the 2nd Developer or an Antigravity AI Agent operating on a collaboration branch:
> **You must read and strictly follow all rules in this document.**

---

## 🏛️ 1. Project Setup (Pre-Seeded Database Ready)

The full database is already pre-configured and committed directly in the repository:
- **Database File**: `backend/college_attendance.sqlite`
- **No Database Setup Needed**: Do NOT run schema migrations or reset scripts. All courses, students, teachers, marks, and attendance records are ready out-of-the-box.

### How to Run Locally:
```bash
cd backend
npm install
node server.js
```
The server will boot on **`http://localhost:3000`**.

### Demo Test Credentials:
- **Faculty / Class Teacher**: `prof.sharma@college.edu` | `Password@123` (`http://localhost:3000/faculty/groups.html`)
- **Student**: `student.it01@college.edu` | `Password@123` (`http://localhost:3000/student/dashboard.html`)
- **System Admin**: `admin` | `Admin@123` (`http://localhost:3000/admin/academic-structure.html`)

---

## 🛡️ 2. Strict Scope & Guardrails (Frontend Only)

> [!IMPORTANT]
> **External Contributors / Dev 2 must ONLY modify:**
> 1. Files inside the **`frontend/`** directory.
> 2. Documentation and task-tracking files (**`TODO.md`**, **`*.md`**).
> 
> Any pull request that modifies backend logic (`backend/src/**`, `backend/server.js`, controllers, models) will be **automatically rejected by GitHub CI PR Guard**.

### Architectural Invariants:
1. **Zero Hardcoded Hex Colors**:
   - Always use theme CSS variables from `frontend/shared/css/variables.css` (e.g. `var(--bg-app)`, `var(--bg-card)`, `var(--text-main)`, `var(--border-color)`).
   - Never write raw `#hex` or `rgb()` colors in stylesheets or inline styles.
   - Run verification before pushing:
     ```powershell
     node backend/scripts/test-theme-support.js
     ```
2. **Responsive Parity**:
   - Test both PC Desktop resolution (`1920x1080` / `min-width: 769px`) and Mobile resolution (`max-width: 768px`).

---

## 📝 3. Keeping Documentation & `TODO.md` Updated (CRITICAL)

The primary repository lead monitors changes through `TODO.md` and commit logs.

### Whenever you start or complete a task with Antigravity:
1. **Read `TODO.md` first** to understand the latest project state and milestones.
2. **Add a structured Milestone entry at the top of `TODO.md`** before committing:
   ```markdown
   ### ✅ Milestone [Next Number]: [Concise Title of the Change]

   - **Problem / Goal**:
     - Brief summary of the bug, UI fix, or improvement.
   - **Root Cause & Resolution**:
     1. [Specific fix details]
     2. [Specific fix details]
   - **Files Modified**:
     - `frontend/path/to/file1.css`
     - `frontend/path/to/file2.js`
   - **Verification**:
     - [Test commands run, e.g. node -c, test-theme-support.js, manual browser validation]
   ```
3. Keep commit messages descriptive:
   `git commit -m "feat(ui): [component] [short description of improvement]"`

---

## 🌿 4. Autonomous Antigravity Execution Protocol (Auto Pull & Push)

> **INSTRUCTION FOR DEV 2's ANTIGRAVITY AGENT:**
> Whenever the user asks you to implement a UI fix, design adjustment, or frontend feature,
> you must **autonomously execute this complete lifecycle without requiring manual git commands from the user**:

### Step 1: Auto-Sync & Branching
Before writing code, make sure you are working on an up-to-date feature branch:
```bash
# Fetch latest updates from main
git fetch origin main

# If currently on main, automatically create a feature branch:
git checkout -b feature/<descriptive-task-name>
# (Or if already on your feature branch, merge latest main: git merge origin/main)
```

### Step 2: Implement Frontend Changes
Make all requested edits strictly inside `frontend/**`.

### Step 3: Automated Verification
Run verification scripts to ensure zero syntax or theme regressions:
```bash
node backend/scripts/test-theme-support.js
node -c frontend/path/to/modified-file.js
```

### Step 4: Auto-Update `TODO.md`
Add the new milestone entry at the top of `TODO.md` documenting:
- Problem & goal
- Files modified
- Verification passed

### Step 5: Auto-Commit & Auto-Push
Automatically commit and push the branch to GitHub:
```bash
git add frontend/ TODO.md
git commit -m "feat(ui): <clear summary of what was changed>"
git push -u origin feature/<descriptive-task-name>
```

### Step 6: Inform User with Direct PR Link
Provide the user with the direct link to open the Pull Request:
`https://github.com/onebotyt/Vidya/pull/new/feature/<descriptive-task-name>`

The primary repository lead will inspect your `TODO.md` entry, test your changes using their dual-preview server (`http://localhost:3001`), and merge your code!

