# Vidya — Smart College Attendance & Institutional Operating System

A production-ready, full-stack institutional attendance tracking and course administration system designed for colleges and universities. Features hardware-integrated biometric attendance (ESP32 terminals), role-based delegation (Admin, HOD, Teacher, Class Teacher, Student), automated registers, and student demographics analytics.

---

## 🏛️ Key Architectural Features

1. **Unified Academic Structure**:
   - **Departments & Programs (Single Code)**: Consolidated departments and degree branches into a single unified catalog (`IT`, `CE`, `ME`, `CL`, `EE`). No redundant branch codes or double-selection required.
   - **Academic Years & Terms**: Session terms with one-click active calendar switching.

2. **Hierarchical Academic Delegation**:
   - **Admin**: Master setup (Departments, Academic Years, Appoint HODs, ESP32 Terminals, Institutional Reporting, Audit).
   - **HOD (Head of Department)**: Departmental curriculum, subjects creation, teacher allocations, class teacher designations.
   - **Teacher**: Course registers, daily lecture attendance sessions, practical batches.
   - **Class Teacher**: Cohort oversight, student demographic provisioning, self-registration approval.
   - **Student**: Mobile/web self-service, 75% attendance predictor, lecture-by-lecture audit history, Google SSO linking.

3. **Touch-Screen Biometric Terminal Integration**:
   - ESP32 hardware terminal integration with offline fallback, fingerprint slot ID mapping, and anti-spoofing session locks.

4. **Institutional Student Analytics**:
   - Interactive KPI cards, department distribution charts, biometric hardware coverage doughnuts, cohort breakdown summaries, and on-demand student rosters.

---

## ✨ New: Simplified Faculty Portal & Extra Features

The faculty side has been redesigned for non-technical use — log in as a teacher
and you land on a big-tile hub (`/faculty/dashboard.html`) instead of a busy
dashboard. Everything is 1–3 taps:

| Feature | Where | What it does |
|---|---|---|
| **Take Attendance** | `/faculty/attendance/quick.html` | Tap a class → tap only the absent names → tap Submit. Everyone else is marked present automatically and the register is finalized in one step. |
| **Timetable** | `/faculty/timetable.html` (teacher) · `/student/timetable.html` (student) | Simple weekly schedule per class. |
| **Assignments** | `/faculty/assignments.html` (teacher) · `/student/assignments.html` (student) | Teacher gives an assignment (with an optional file); students upload PPT/DOC/PDF/XLS/etc.; teacher downloads and grades each submission. |
| **Leave Requests** | `/faculty/leave-approvals.html` (teacher) · `/student/leave.html` (student) | Students apply for leave; their teacher approves or rejects with an optional note. |
| **Test Marks** | `/faculty/marks.html` (teacher) · `/student/scores.html` (student) | Teacher creates a test and enters marks for the whole class in one table; students see their own scores. |
| **Attendance Analytics** | `/faculty/analytics.html` | Per-class attendance %, a 14-day trend, and a count of students below 75%. |

The registers view is available at `/faculty/registers.html`
for anyone who wants the full register-book view.

These features added 6 new database tables (`leave_applications`, `timetable_slots`,
`assignments`, `assignment_submissions`, `exams`, `exam_scores`) via
`database/migrations/003_faculty_plus_features.sql`, 5 new backend route files
(`quick.js`, `leave.js`, `timetable.js`, `assignments.js`, `exams.js`), and a new
`/api/v1/reports/analytics` endpoint. Uploaded files are stored under
`backend/uploads/` and served at `/uploads/...`.

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- SQLite3 (zero-configuration embedded engine)

### 1. Installation
```bash
# Navigate to the backend directory
cd backend

# Install dependencies
npm install
```

### 2. Environment Configuration
```bash
# Copy the example environment file
cp .env.example .env
```
Default `.env` settings:
```env
PORT=3000
NODE_ENV=development
JWT_SECRET=super-secure-jwt-secret-college-attendance-2026-key
JWT_EXPIRES_IN=7d
DB_CLIENT=sqlite3
SQLITE_DB_PATH=./college_attendance.sqlite
CORS_ORIGIN=http://localhost:3000
```

### 3. Start the Server
```bash
npm start
# or
node server.js
```
The application will launch on `http://localhost:3000`.

---

## 🔐 Default Demo Accounts

All demo accounts share the password: **`Admin@123`** (or **`Password@123`** for faculty/students).

| Role | Username / Email | Password | Scope |
| :--- | :--- | :--- | :--- |
| **System Administrator** | `admin` | `Admin@123` | Institutional Admin Console |
| **HOD (IT Dept)** | `hod.it@college.edu` | `Password@123` | Information Technology HOD Portal |
| **HOD (CE Dept)** | `hod.ce@college.edu` | `Password@123` | Computer Engineering HOD Portal |
| **HOD (ME Dept)** | `hod.me@college.edu` | `Password@123` | Mechanical Engineering HOD Portal |
| **Faculty / Class Teacher** | `prof.sharma@college.edu` | `Password@123` | Lecture Registers & Cohorts |
| **Faculty / Class Teacher** | `prof.patel@college.edu` | `Password@123` | Lecture Registers & Cohorts |
| **Student** | `student.it01@college.edu` | `Password@123` | Student Attendance Portal |

---

## 📁 Project Directory Structure

```
Attendance-system/
├── ATTENDANCE_ARCHITECTURE_FREEZE.md      # Strict architectural boundary documentation
├── SYSTEM_SPECIFICATION_AND_FEATURES.md   # Complete system requirements and features
├── README.md                              # This setup and quickstart guide
├── attendance/                            # System plans, SRS, and API contracts
│   ├── 01_ATTENDANCE_WEB_SRS.md
│   ├── 02_ATTENDANCE_MOBILE_APP_SRS.md
│   ├── 04_API_CONTRACT.md
│   └── DATABASE_SCHEMA_AND_ERD.md
├── backend/
│   ├── server.js                          # Express application entry point & URL routing
│   ├── package.json                       # Backend dependencies and scripts
│   ├── college_attendance.sqlite          # Pre-seeded SQLite database
│   ├── src/
│   │   ├── config/                        # Database connection & environment configuration
│   │   ├── middleware/                    # Auth token verification & role enforcement
│   │   ├── routes/                        # REST API routes (/admin, /hod, /faculty, /students, etc.)
│   │   └── utils/                         # Token helpers and validation
│   └── scripts/                           # Database seeding and verification scripts
│       ├── seed-demo.js                   # Populates comprehensive demo college dataset
│       └── verify-all.js                  # Automated test verification suite
├── database/
│   ├── schema.sql                         # Full DDL database schema definition
│   ├── migrations/                        # Versioned SQL migration scripts
│   └── sqlite/                            # SQLite schema definitions
└── frontend/
    ├── index.html                         # Institutional portal landing page
    ├── admin/                             # Admin portal (Academic structure, analytics, HODs, reports)
    ├── faculty/                           # Faculty & HOD portal (Registers, attendance marking, cohorts)
    ├── student/                           # Student portal (Live status, predictor, attendance history)
    ├── css/                               # Design system, layout, and component styling
    └── js/                                # API client, auth guards, and UI utilities
```

---

## 📊 Database Schema & Reseeding

- The complete SQL schema definition is available at [`database/schema.sql`](database/schema.sql).
- To re-seed fresh demo data at any time:
  ```bash
  cd backend
  node scripts/seed-demo.js
  ```
- To run automated test checks across all endpoints:
  ```bash
  cd backend
  node scripts/test-ui-dom-integration.js
  node scripts/test-single-controller.js
  ```
