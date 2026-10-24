# Frontend Contributor & Collaboration Guide

Welcome to **VidyaOS**! As a frontend developer, you have full access to both the backend and frontend so you can run the entire system locally, test live APIs, and verify UI workflows in real-time.

---

## 🚀 1. Quick Setup (Running the Full Stack Locally)

### Prerequisites:
- **Node.js** (v18 or higher)
- **Git**

### Step 1: Clone the repository
```bash
git clone https://github.com/onebotyt/Vidya.git
cd Vidya
```

### Step 2: Install dependencies & start the local server
```bash
cd backend
npm install
node server.js
```
The server will start on: **`http://localhost:3000`**

### Step 3: Default Demo Login Credentials
All mock accounts are preloaded into the local SQLite database:

| Role | Email / Username | Password | Direct URL |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin` | `Admin@123` | `http://localhost:3000/admin/academic-structure.html` |
| **Faculty / Teacher** | `prof.sharma@college.edu` | `Password@123` | `http://localhost:3000/faculty/groups.html` |
| **Faculty (CE Dept)** | `prof.patel@college.edu` | `Password@123` | `http://localhost:3000/faculty/groups.html` |
| **Student** | `student.it01@college.edu` | `Password@123` | `http://localhost:3000/student/dashboard.html` |

---

## 🎨 2. Contribution Rules (Frontend Only)

> [!IMPORTANT]
> **Strict Rule**: All your code changes and styling must be located inside the **`frontend/`** directory.
> 
> You ARE required to update **`TODO.md`** with a record of your changes so the project lead can review what was done!
> 
> Any pull request that modifies backend logic (`backend/src/**`, `backend/server.js`, controllers, database schemas) will be automatically blocked by the GitHub PR Guard CI.
> 
> For full instructions for your Antigravity AI assistant, see [DEV2_ANTIGRAVITY_INSTRUCTIONS.md](file:///d:/uiap/Attendance-System-Simplified/DEV2_ANTIGRAVITY_INSTRUCTIONS.md).

### Frontend Code Structure:
- `frontend/shared/css/variables.css`: Theme tokens (colors, radii, typography). **Never use hardcoded `#hex` or `rgb()` colors!** Always use CSS variables (e.g. `var(--bg-primary)`, `var(--text-primary)`, `var(--primary-color)`).
- `frontend/shared/js/`: Common utilities, auth helpers, navigation bars.
- `frontend/faculty/`: Faculty dashboards, classes, registers, coursework, marks.
- `frontend/student/`: Student dashboards, assignment turn-in, attendance logs.
- `frontend/admin/`: System administrative consoles.

---

## 🌿 3. Collaboration Workflow

### Step 1: Create a feature branch
Always work on a dedicated branch:
```bash
git checkout -b feature/my-ui-improvement
```

### Step 2: Make your frontend changes
Edit files in `frontend/`. Test them in your browser at `http://localhost:3000`.

### Step 3: Verify CSS variable compliance
Before pushing, ensure no hardcoded colors were introduced:
```bash
cd backend
node scripts/test-theme-support.js
```

### Step 4: Record your changes in `TODO.md`
Add a structured entry at the top of `TODO.md`:
- What feature was added or bug fixed
- Root cause & exact files modified
- Test verification results

### Step 5: Commit & push your branch
```bash
git add frontend/ TODO.md
git commit -m "feat(ui): refine assignment details layout"
git push origin feature/my-ui-improvement
```

### Step 6: Open a Pull Request on GitHub
1. Go to `https://github.com/onebotyt/Vidya`
2. Open a Pull Request from your branch into `main`.
3. The automated **Frontend Only Guard** will verify that only `frontend/` and documentation are included.
4. The project lead will review your `TODO.md` entry, test your changes, and merge!

