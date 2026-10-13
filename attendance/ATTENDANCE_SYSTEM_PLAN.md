# College Attendance System — Planning & SRS Document

> **Version:** 0.1 — Initial Planning
> **Date:** 2026-09-07
> **Status:** PLANNING ONLY — Implementation not started
> **Future Integration:** This system will eventually become a module inside UIAP Platform

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Technology Stack](#2-technology-stack)
3. [Project Structure](#3-project-structure)
4. [User Roles & Permissions](#4-user-roles--permissions)
5. [Authentication System](#5-authentication-system)
6. [Student Registration & Approval](#6-student-registration--approval)
7. [Academic Structure](#7-academic-structure)
8. [Attendance Concepts & Workflows](#8-attendance-concepts--workflows)
9. [Database Design Concepts](#9-database-design-concepts)
10. [API Boundaries](#10-api-boundaries)
11. [Frontend Pages & Features](#11-frontend-pages--features)
12. [Device Integration ESP32](#12-device-integration-esp32)
13. [Reporting](#13-reporting)
14. [Security Requirements](#14-security-requirements)
15. [Future Migration Path](#15-future-migration-path)
16. [Development Phases](#16-development-phases)
17. [Design System](#17-design-system)

---

## 1. Project Overview

### 1.1 Purpose

A complete, web-based College Attendance Management System designed to handle the full lifecycle of student attendance:
- Student registration and class assignment
- Classroom physical presence (fingerprint / ESP32 hardware)
- Subject-level attendance marking
- Teacher confirmation and finalization
- Attendance tracking, statistics, and reports

### 1.2 Deployment Model

- Local-first. Runs on a Windows PC inside the college network.
- Daily operation must work without internet.
- MySQL stores all college-specific data locally.
- Staff and students access via web browsers over the local LAN.

### 1.3 Scope for v1.0

- Complete web-based system (HTML/CSS/Vanilla JS + Node.js/Express + MySQL).
- Three user types: Admin, Faculty/Teacher, Student.
- Full student registration and teacher-approval workflow.
- Attendance session management.
- Attendance history, statistics, and reports.
- Responsive design for desktop, tablet, and mobile browser.

### 1.4 Out of Scope for v1.0

- React Native mobile apps (planned for later).
- Physical ESP32 hardware driver (API boundary defined, driver not implemented).
- Face recognition, cloud sync, multi-tenant, payments.
- Next.js frontend migration.
- UIAP integration (planned, not in v1.0).

---

## 2. Technology Stack

### 2.1 Backend

| Component | Technology |
|---|---|
| Runtime | Node.js v20+ |
| Framework | Express.js |
| Language | JavaScript |
| Database | MySQL 8.x |
| DB Driver | mysql2 (parameterized queries only) |
| Auth | JWT (access + refresh token pattern) |
| Passwords | bcrypt |
| Google Auth | google-auth-library |
| Rate Limiting | express-rate-limit |
| Validation | express-validator |
| Security Headers | helmet |
| Logging | winston or pino |
| File Uploads | multer |

### 2.2 Frontend

| Component | Technology |
|---|---|
| Markup | HTML5 semantic |
| Styling | Vanilla CSS with CSS custom properties |
| Scripting | Vanilla JavaScript, page-specific scripts |
| Fonts | Google Fonts (Inter, Outfit) |
| Icons | Feather Icons / Lucide Icons |

---

## 3. Project Structure

```
attendance-system/
  backend/
    server.js
    .env
    .env.example
    package.json
    src/
      config/     db.js
      middleware/ auth.js, requireRole.js, rateLimiter.js, validate.js
      routes/     auth.js, students.js, faculty.js, departments.js, branches.js
                  subjects.js, enrollments.js, assignments.js, attendance.js
                  reports.js, devices.js, notifications.js, admin.js, audit.js
      controllers/
      services/
      utils/

  frontend/
    index.html
    css/
      variables.css       (root design system)
      reset.css
      layout.css
      components.css
      pages/              (page-specific styles)
    js/
      api.js              (shared fetch wrapper)
      auth.js             (auth state helpers)
      pages/              (page-specific scripts)
    login/
      faculty.html        /login/faculty
      student.html        /login/student
    register/
      student.html        /register/student
    student/
      dashboard.html
      attendance/
        active.html
        history.html
        subjects.html
      notifications.html
      profile.html
    faculty/
      dashboard.html
      cohorts.html
      subjects.html
      attendance/
        sessions.html
        live.html (sessions/:id/live)
      students.html
      registrations.html
      reports.html
      profile.html
    admin/
      dashboard.html
      students.html
      faculty.html
      departments.html
      branches.html
      subjects.html
      academic-years.html
      enrollments.html
      assignments.html
      devices.html
      attendance.html
      reports.html
      audit.html
      settings.html

  docs/
    ATTENDANCE_SYSTEM_PLAN.md   (this document)
```

---

## 4. User Roles & Permissions

### 4.1 Core Principles

- Roles are stored in the database, not the frontend.
- Roles and assignments are separate concepts:
  - ROLE = what the user is allowed to do
  - ASSIGNMENT/SCOPE = where/for whom they can do it
- Multiple roles per user are supported. One person can be TEACHER + CLASS_TEACHER + HOD simultaneously.
- All authorization is enforced on the backend.

### 4.2 System Roles vs Academic Assignments

To keep authentication and academic responsibilities cleanly decoupled:
1. **System Roles (`user_roles`)**: Defines who the user is at the system level (`SYSTEM_ADMIN`, `TEACHER`, `STUDENT`).
2. **Academic Assignments (`teacher_assignments`)**: Defines the teacher's functional scopes (Subject Teacher, Class Teacher, HOD) per department, branch, year, semester, and academic year.

| Role | Scope Level | Description |
|---|---|---|
| SYSTEM_ADMIN | Global | Full administrative access: faculty management, device setup, master data. Does NOT approve normal student registrations. |
| TEACHER | Assigned Cohorts | Takes attendance for assigned subjects/cohorts. Can also hold CLASS_TEACHER or HOD assignments. |
| STUDENT | Self | Marks self-attendance, views personal attendance records, analytics, and threshold predictions. |

### 4.3 Clean RBAC Model

```sql
-- 1. System-level roles (clean, no scope columns)
user_roles:
  user_id           FK -> users.id
  role              ENUM('SYSTEM_ADMIN', 'TEACHER', 'STUDENT')
  created_at        TIMESTAMP

-- 2. Teacher functional assignments & academic scope
teacher_assignments:
  teacher_id        FK -> teachers.id
  assignment_type   ENUM('SUBJECT_TEACHER', 'CLASS_TEACHER', 'HOD')
  subject_id        FK -> subjects.id NULLABLE      -- for SUBJECT_TEACHER
  department_id     INT                             -- Department / Cohort
  branch_id         INT                             -- Branch
  year              INT                             -- 1, 2, 3, 4
  semester          INT                             -- 1 to 8
  academic_year_id  FK -> academic_years.id
  assigned_by       FK -> users.id
  is_active         BOOLEAN DEFAULT TRUE
```

### 4.4 Example Multi-Assignment for a Teacher

Teacher A in Academic Year `2026-27`:
- `user_roles`: `role = 'TEACHER'`
- `teacher_assignments`:
  1. `SUBJECT_TEACHER`: Subject `DBMS`, Dept `IT`, Year `2`, Sem `3`
  2. `SUBJECT_TEACHER`: Subject `DBMS Lab`, Dept `IT`, Year `2`, Sem `3`
  3. `CLASS_TEACHER`: Dept `IT`, Year `2`, Sem `3` (Grants registration approve/reject rights and registration toggle)
  4. `HOD`: Dept `IT` (Grants department-wide analytics and audit reports)

---

## 5. Authentication System

### 5.1 Login Routes

| URL | For |
|---|---|
| /login/faculty | Admin + all faculty roles |
| /login/student | Students only |
| /register/student | Student self-registration |

There is NO public Admin or Teacher registration page. Admin creates faculty accounts from the dashboard.

### 5.2 Faculty Login Fields

- Faculty ID / Email
- Password
- Login button
- Continue with Google (optional fast login)

### 5.3 Student Login Fields

- Enrollment Number / Student ID
- Password
- Login button
- Continue with Google (optional fast login)

### 5.4 JWT Token Strategy

- **Access Token:** Short-lived (15–60 minutes). Contains ONLY: `user_id`, `roles`, `session_id`, and `exp`.
- **NO `scope_ids` in JWT:** Academic scope (classes, cohorts, subjects taught) is **never** baked into the JWT token.
  - *Rationale:* If an Admin modifies or revokes a teacher's assignment, an access token with embedded `scope_ids` would carry stale authorization for up to an hour.
  - *Resolution:* Backend middleware resolves active permissions dynamically on every request:
    $$\text{User} \longrightarrow \text{System Role (JWT)} \longrightarrow \text{teacher\_assignments (DB)} \longrightarrow \text{Authorized Resource}$$
- **Refresh Token:** Long-lived (7–30 days). Stored in a secure `httpOnly`, `sameSite=strict` cookie.
- **Token Rotation:** New refresh token issued on every refresh.
- **Revocation:** Refresh tokens tracked in `user_sessions` table. Logout or password reset invalidates immediately.

### 5.5 Google OAuth Rules

IMPORTANT: Google login is an additional method, NOT a replacement for ID/password login.

Faculty Google Login:
1. Google OAuth flow completes.
2. Backend verifies token.
3. Backend looks up faculty by Google email.
4. If found and linked: issue JWT, redirect to dashboard.
5. If not found: error - "Link your Google account by logging in with Faculty ID first."

Student Google Login:
1. Google OAuth flow completes -> backend cryptographically verifies the Google ID token.
2. Backend extracts verified email and `google_sub`.
3. Backend looks up student user (`users u JOIN students s ON s.user_id = u.id`) matching `u.email` or `u.google_sub`, evaluating account status (`u.status`):

   - **IF `u.status = 'PROVISIONED'`:**
     - Requires: `u.email == verified_google_email` AND `u.google_sub IS NULL`.
     - Atomically executes:
       ```sql
       UPDATE users SET
         google_sub = verified_google_sub,
         status = 'ACTIVE',
         must_change_password = FALSE,
         temp_password_hash = NULL
       WHERE id = u.id;
       ```
     - Issues JWT access token + refresh cookie, redirects to dashboard.

   - **IF `u.status = 'ACTIVE'`:**
     - Requires: `u.google_sub == verified_google_sub`.
     - Issues JWT access token + refresh cookie, redirects to dashboard.

   - **IF `u.status = 'PENDING'`:**
     - Rejects login: *"Registration submitted and pending Class Teacher approval."*

   - **IF `u.status = 'REJECTED'`:**
     - Rejects login: *"Registration rejected by Class Teacher. Reason: [u.rejection_reason]"*.

   - **IF `u.status = 'SUSPENDED'`:**
     - Rejects login: *"Account suspended. Please contact the administrator."*

   - **IF no matching student user found:**
     - Redirects to fallback registration page (`/register/student`) with verified Google email and name pre-filled.

---

## 6. Student Registration & Approval

### 6.1 Registration Form Fields

- Full Name (required)
- Department (dropdown from DB)
- Branch (filtered by department)
- Year (1st/2nd/3rd/4th)
- Semester (1-8)
- Enrollment Number (required, unique)
- Email (required)
- Password (required, min 8 chars)
- Confirm Password

### 6.2 Google Signup Flow

1. Student clicks "Continue with Google" on registration page.
2. Google OAuth completes.
3. Backend verifies token. Does NOT create account yet.
4. Backend returns Google data (name, email, picture, sub ID) to frontend.
5. Frontend returns student to the SAME registration page.
6. Info banner: "Google connected! Please complete your registration."
7. Form prefilled with Google name and email.
8. Student reviews/corrects info and fills in academic fields.
9. Student submits full form.
10. Backend validates all fields (server-side).
11. Backend creates account with status=PENDING.
12. Backend finds class teacher for selected class + current academic year.
13. Backend sends notification to class teacher.
14. Student sees: "Registration submitted. Awaiting your class teacher's approval."

### 6.3 Student Account Status Lifecycle

Student authentication credentials, verification state, and activation status reside strictly in `users`:

```
PROVISIONED  -> Teacher created profile & temp password. Awaiting student activation.
PENDING      -> Self-registered student awaiting class teacher approval.
ACTIVE       -> Activated account (via temp password, Google OAuth, or class teacher approval). Can log in.
REJECTED     -> Registration rejected by class teacher (stores rejection_reason).
SUSPENDED    -> Account suspended by administrator.
```

**State Transitions:**
- **Teacher-Provisioned Path:** `PROVISIONED` ──(student sets permanent password or activates via Google)──> `ACTIVE`
- **Self-Registration Path:** `PENDING` ──(class teacher approves)──> `ACTIVE`
- **Rejection:** `PENDING` ──(class teacher rejects)──> `REJECTED`
- **Administrative Suspension:** `ACTIVE` ──(admin suspends)──> `SUSPENDED`

### 6.4 Class Teacher Approval Flow

RULE: Admin does NOT approve normal student registrations.
Only the assigned Class Teacher for that class + academic year approves.

1. Class Teacher receives notification about new registration.
2. Class Teacher opens Student Registrations page (filtered to their class only).
3. Class Teacher reviews: name, enrollment, email, Google-connected status.
4. Class Teacher clicks APPROVE or REJECT (with reason on reject).

Backend enforcement:
- Before update, backend verifies req.user.id is the assigned class teacher for the student's cohort (department_id, branch_id, year, semester) for the current academic year.
- If not: return 403 Forbidden. No exceptions.
- Student cannot alter cohort parameters in the browser to get a different teacher to approve them.

### 6.5 Registration ON/OFF Control

Class Teacher toggles registration for their cohort:

```sql
cohort_registration_settings:
  department_id    INT                  -- Cohort Department
  branch_id        INT
  year             INT
  semester         INT
  academic_year_id FK -> academic_years.id
  registration_open  BOOLEAN DEFAULT TRUE
  changed_by       FK -> users.id
  changed_at       TIMESTAMP
```

Backend enforcement: When student submits registration, backend checks registration_open. If FALSE: reject.
Frontend hide/disable is UX only. Backend is the authority.

---

## 7. Academic Structure

### 7.1 Hierarchy & Database-Backed Master Data

To avoid manual typing errors while preserving administrative flexibility, the academic structure is backed by **master database tables populated with predefined/seeded defaults** upon installation:

```
Department  (Database-backed, seeded: Information Technology, Computer Engineering, Mechanical, Civil, Electrical)
  └── Branch    (Database-backed, seeded: B.Tech, Diploma, BCA, MCA)
       └── Year      (Master/Hardcoded range: 1st Year, 2nd Year, 3rd Year)
            └── Semester  (Master/Hardcoded range: Sem 1 through Sem 6)
                 └── Subjects (Database-backed per department: DBMS, OS, Math-III, etc.)
```

**Cohort Definition:**
Instead of a standalone, abstract `classes` table with arbitrary names (like `IT-2A`, `Class-101`), an academic cohort is directly and deterministically defined as:
$$\textbf{Cohort} = \textbf{Department} + \textbf{Branch} + \textbf{Year} + \textbf{Semester} + \textbf{Academic Year}$$

- Frontend dropdowns fetch active departments and branches dynamically from the REST API (`/api/v1/admin/departments`, `/api/v1/admin/branches`).
- System Admin can add, rename, or deactivate departments/branches via master data management as the institution evolves.

### 7.2 Academic Year

- Every significant record is scoped to an academic year (format: "2026-27").
- Teacher assignments and student enrollments are per academic year. Historical assignments are preserved.
- Attendance records always link to the academic year they were created in.
- Multiple academic years can exist; only one is current/active at a time.

### 7.3 Teacher Assignment Model

```sql
teacher_assignments (
  id                INT PK AUTO_INCREMENT,
  teacher_id        INT NOT NULL FK -> teachers.id,
  assignment_type   ENUM('SUBJECT_TEACHER', 'CLASS_TEACHER', 'HOD') NOT NULL,
  subject_id        INT NULLABLE FK -> subjects.id,  -- for SUBJECT_TEACHER (NULL for CLASS_TEACHER/HOD)
  department_id     INT NOT NULL FK -> departments.id,
  branch_id         INT NOT NULL FK -> branches.id,
  year              INT NOT NULL,                    -- 1, 2, 3, 4
  semester          INT NOT NULL,                    -- 1 to 8
  academic_year_id  INT NOT NULL FK -> academic_years.id,
  assigned_by       INT NOT NULL FK -> users.id,
  is_active         BOOLEAN DEFAULT TRUE,
  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 8. Attendance Concepts & Workflows

### 8.1 Three Independent Attendance Streams

Attendance in this system has THREE completely separate, independent streams.
They are NOT automatically merged. Each stream is its own data source.
A teacher can use one, two, or all three streams simultaneously.

```
  STREAM 1           STREAM 2                STREAM 3
  ESP32 Attendance   Teacher Register        Student Self-Attendance
  (Hardware)         (Manual / Digital)      (Optional)
  ─────────────────  ──────────────────────  ────────────────────────
  Fingerprint scan   Teacher fills in their  Student requests their
  via ESP32 device   own attendance register own attendance
  Fully autonomous   Completely independent  Teacher reviews/confirms
  Works offline      No dependency on ESP32  Used as supporting proof
  Syncs to server    Teacher is the author   Optional, not mandatory
  later when online  and authority
```

**KEY RULE:**
- Stream 1 (ESP32) and Stream 2 (Teacher Register) are ALWAYS SEPARATE in the database.
- Stream 2 can optionally import from Stream 1 via a one-click "Sync from ESP32" button.
- The Teacher Register is the OFFICIAL record used for institutional purposes.
- ESP32 data is supporting evidence, not the final record by itself.
- Stream 3 (self-attendance) is an optional additional input to Stream 2.

---

### 8.2 Stream 1: ESP32 Classroom Presence

This stream records raw physical presence detected by the ESP32 fingerprint device.
It is fully hardware-driven and autonomous. It does not depend on a teacher action.

**Flow:**
```
Student scans fingerprint on ESP32 device
  -> ESP32 matches fingerprint to slot in sensor memory
  -> ESP32 sends event to server: device_id + slot_id + event_id + timestamp

Server processes event:
  -> Maps (device_id + slot_id) to student
  -> Saves to esp32_presence table
  -> Records: student_id, device_id, date, time, event_id

If ESP32 is offline:
  -> Event stored in W25Q32 SPI Flash on device
  -> When connection restored, ESP32 sends all queued events
  -> Server deduplicates by event_id (UUID)
```

**Important characteristics:**
- ESP32 presence data is ALWAYS saved separately in `esp32_presence` table.
- This data is NEVER automatically written into the teacher's register.
- It represents: "This student was physically detected by the fingerprint sensor."
- It does NOT represent: "This student is present in [Subject] for this class session."
- A student can scan at the door and then attend a different class — the mapping to subject requires the teacher's register.

---

### 8.3 Stream 2: Teacher Register Attendance

This is the teacher's own digital attendance register — the official subject attendance record.
It is completely independent of ESP32. Teacher has full authority over this register.

**The register works in one of three ways (teacher chooses):**

#### Option A: Manual Entry Only (No ESP32)
```
Teacher opens attendance session for subject + class
  -> Teacher sees student list
  -> Teacher marks each student: PRESENT / ABSENT / LATE
  -> Teacher saves (records in register_attendance table)
  -> Teacher finalizes session (FINALIZED = locked)
```

#### Option B: Sync from ESP32 then Edit
```
Teacher opens attendance session for subject + class
  -> Teacher clicks [Sync from ESP32] button
  -> System pulls all esp32_presence records for:
       this class + this date + this time window
  -> Students who scanned = pre-filled as PRESENT
  -> Students with no scan = pre-filled as ABSENT
  -> Teacher reviews the pre-filled list
  -> Teacher corrects any mistakes (student was present but sensor failed, etc.)
  -> Teacher saves and finalizes
```
**Sync button rules:**
- "Sync from ESP32" only populates the register with a starting point.
- It does NOT lock the register. Teacher can still change anything.
- If a student's scan arrived late (was offline, synced after), teacher can re-sync or correct manually.
- Sync can be done multiple times before finalization (each sync refreshes from latest ESP32 data).

#### Option C: Self-Attendance Requests + Teacher Review
```
Teacher opens attendance session
  -> Teacher makes session visible to students (session state: OPEN)
  -> Students see active session and click "Mark Attendance"
  -> System records student's request (student_self_attendance table)
  -> Teacher sees list of who requested attendance
  -> Teacher can accept or reject each request
  -> Teacher can also sync from ESP32 alongside this
  -> Teacher finalizes
```

**Teacher Register Session States:**
```
DRAFT      -> Session created, roster snapshot taken, not yet open to students
OPEN       -> Students can submit self-attendance requests; ESP32 scans actively correlate
CLOSED     -> No more student requests (manual or timer); teacher reviewing, editing & syncing
FINALIZED  -> Locked permanently; official attendance record
```

**1. Session Roster Snapshot (Immutable Historical Cohort Freeze):**
When an attendance session is created, the system snapshots active cohort enrollments into `attendance_session_students`. This ensures that even if students are later transferred, dropped, or promoted, the historical roster of who belonged to this specific lecture remains permanently frozen.

```sql
attendance_session_students (
  id             INT PK AUTO_INCREMENT,
  session_id     INT NOT NULL FK -> attendance_sessions.id,
  student_id     INT NOT NULL FK -> students.id,
  enrollment_id  INT NOT NULL FK -> enrollments.id,
  included       BOOLEAN DEFAULT TRUE,             -- Teacher can toggle off for subgroup practicals
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(session_id, student_id)
);
```

**2. Teacher Register record per student (`register_attendance`):**
Attendance status and data provenance are strictly separated:

```sql
register_attendance (
  id                INT PK AUTO_INCREMENT,
  session_id        INT NOT NULL FK -> attendance_sessions.id,
  student_id        INT NOT NULL FK -> students.id,
  attendance_status ENUM('PRESENT', 'ABSENT', 'LATE') NOT NULL,
  source            ENUM('MANUAL', 'ESP32_SYNC', 'SELF_REQUEST') NOT NULL,
  teacher_notes     TEXT NULL,                     -- Optional note (e.g., "arrived 15 min late")
  marked_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(session_id, student_id)
);
```

**3. Attendance Status Values & Computation:**
- `PRESENT`: Student attended on time $\longrightarrow$ Counts as attended (+1)
- `LATE`: Student attended late $\longrightarrow$ Counts as attended (+1)
- `ABSENT`: Student did not attend $\longrightarrow$ Does NOT count (0)

$$\text{Official Attended Count } (P) = \text{count}(\text{PRESENT}) + \text{count}(\text{LATE})$$
$$\text{Official Attendance } \% = \frac{\text{PRESENT} + \text{LATE}}{\text{Total Finalized Sessions Included } (C)} \times 100$$

**4. Session Finalization Integrity Invariant:**
Before an attendance session can transition from `CLOSED` to `FINALIZED`, the backend strictly verifies that **every included student** (`included = TRUE` in `attendance_session_students`) has an explicit record in `register_attendance`:
- **No `NULL`, `UNMARKED`, or `PENDING` states are permitted upon finalization.**
- If any included student has not been marked, the backend rejects the request with HTTP `422 Unprocessable Entity` (*"Cannot finalize session: [X] students are unmarked in register"*).
- This guarantees that an incomplete attendance register can never be permanently locked into official academic records.

---

### 8.4 Stream 3: Student Self-Attendance (Optional)

This stream is an optional mechanism where students can declare their own presence.
It does NOT automatically count as attendance.
It is a REQUEST that the teacher must review and accept or reject.

**Flow:**
```
Teacher sets session state = OPEN

Student:
  -> Opens "Active Attendance" page
  -> Sees: "[Subject] session is open — mark your attendance"
  -> Clicks "Mark Attendance"
  -> Backend verifies: session is OPEN, student enrolled, no duplicate request
  -> Record created in student_self_attendance with status=PENDING

Teacher:
  -> Opens Live Attendance page
  -> Sees list: students who submitted self-attendance (PENDING)
  -> Clicks ACCEPT (student marked PRESENT in register)
  -> Or clicks REJECT (student marked ABSENT in register)
  -> Or ignores and marks manually
```

**Rules:**
- Student self-attendance is only available when session is OPEN.
- One request per student per session (UNIQUE constraint).
- Accepting a self-attendance request creates/updates a record in `register_attendance` with source='self_request'.
- Teacher always has final say. Student cannot override teacher's decision.

---

### 8.5 Attendance Session Lifecycle (Combined View)

```
[TEACHER OPENS SESSION]
  Teacher selects: class + subject + date
  -> Session created (state: DRAFT)
  -> Teacher can optionally:
       a. Click [Sync from ESP32] to import scan data
       b. Click [Open for Students] to allow self-attendance
       c. Start manual entry immediately

[DURING SESSION]
  Stream 1 (ESP32) runs independently:
    -> Fingerprint scans recorded automatically in esp32_presence
    -> Teacher can sync anytime before finalization
  Stream 2 (Register) - Teacher fills in:
    -> Manual marks / edited ESP32 sync / accepted self-requests
  Stream 3 (Self-Attendance) - if session is OPEN:
    -> Students submit requests
    -> Teacher accepts/rejects

[TEACHER REVIEWS]
  -> Teacher reviews register_attendance list
  -> Corrects any errors
  -> Session state: CLOSED (student requests no longer accepted)

[TEACHER FINALIZES]
  -> Session state: FINALIZED
  -> register_attendance records are locked
  -> esp32_presence records are unaffected (they are always stored separately)
  -> No further changes to teacher register without admin override
```

---

### 8.6 What Each Stream Produces

| Stream | Table | Locked By | Used For |
|---|---|---|---|
| ESP32 Classroom Presence | `esp32_presence` | Never locked (always raw data) | Physical presence proof, sync source, comparison |
| Teacher Register | `register_attendance` | FINALIZED session | Official subject attendance record |
| Student Self-Attendance | `student_self_attendance` | Session CLOSED/FINALIZED | Supporting proof for teacher's decision |

---

### 8.7 Duplicate Protection

**ESP32 stream:**
- `UNIQUE(event_id)` on `esp32_presence` — deduplicates device retries and offline SPI flash buffer synchronization.
- Raw scan events preserve all legitimate physical touches (e.g. scanning into morning lecture and afternoon lab on the same device). Session time-window matching and first-scan resolution are handled dynamically in application logic during teacher sync, preserving all audit evidence.

**Teacher register:**
- `UNIQUE(session_id, student_id)` on `register_attendance` — one record per student per session.
- Backend checks before insert and update.

**Student self-attendance:**
- `UNIQUE(session_id, student_id)` on `student_self_attendance` — one request per student per session.

---

### 8.8 Offline ESP32 — Impact on Teacher Register

When ESP32 is offline, scans are stored in device flash and synced to the server later.
The teacher's register is NOT blocked by this:

```
ESP32 offline during class:
  -> Teacher fills register MANUALLY (does not wait for ESP32)
  -> OR opens session and manually marks present/absent
  -> Finalizes normally

ESP32 comes back online (hours later or next day):
  -> Queued events sync to esp32_presence table
  -> Teacher can VIEW the ESP32 data in Reports for that date
  -> Teacher can see comparison: who was in register vs who scanned
  -> Teacher CANNOT change a FINALIZED register session
     (but admin can make corrections with audit trail)
```

**This means:**
- ESP32 offline never blocks teaching operations.
- ESP32 and register are always reconcilable via reports, even after the fact.
- The comparison is a reporting/audit feature, not a mandatory workflow step.

---

### 8.9 No-Device Mode (Works Without ESP32)

**The system works 100% without any ESP32 device.**

ESP32 is Stream 1 — and Stream 1 is entirely optional.
If no device is registered or connected, the teacher simply does not see a "Sync from ESP32" button.
Streams 2 and 3 are fully software-based and require only a web browser.

```
With ESP32:          Without ESP32:

 Stream 1 (ESP32)    Stream 1 (ESP32)
    |                   [ABSENT — no device]
    v
 Stream 2 (Register) Stream 2 (Register)
    |                   |
    v                   v
 Stream 3 (Self)     Stream 3 (Self)
    |                   |
    v                   v
 Reports              Reports
 (with comparison)    (register only, no ESP32 column)
```

**When there is no ESP32, teachers have three software-only modes:**

---

#### Mode A: Pure Manual Register

Teacher opens a session, sees the student list, and marks each student manually.
This is exactly how a paper register works, but digital.

```
Teacher opens session (DRAFT)
  -> Teacher selects subject + class
  -> Student list loads
  -> Teacher clicks PRESENT or ABSENT for each student
  -> Teacher can type notes (e.g., "Late", "Left early")
  -> Teacher finalizes (FINALIZED)
```

- No phone required from students.
- No hardware needed.
- Fastest for small classes.
- Best for teachers who prefer full control.

---

#### Mode B: Session PIN / Code (Soft Presence Verification)

Teacher starts a session and the system generates a short time-limited PIN (4–6 digits).
Teacher writes or projects the PIN on the board.
Students open the app and enter the PIN to mark themselves present.

```
Teacher opens session (DRAFT)
  -> Teacher clicks [Generate PIN]
  -> System creates PIN: e.g., 4821 (valid for 15 minutes)
  -> Teacher writes PIN on board / announces it

Student:
  -> Opens Active Attendance page
  -> Sees: "Enter session PIN"
  -> Types 4821
  -> Backend verifies: session is OPEN, PIN matches, student enrolled, no duplicate
  -> Record created in student_self_attendance with source='pin'

Teacher:
  -> Reviews who submitted via PIN
  -> Can accept all at once or individually
  -> Can mark absent students manually
  -> Finalizes
```

**PIN rules (backend enforced):**
- PIN is generated per session (not reused across sessions).
- PIN expires after a configurable window (default: 15 minutes after generation).
- PIN is stored hashed in the database — not stored in plain text.
- Student can only submit once per session (UNIQUE constraint).
- Teacher can regenerate the PIN (old PIN immediately invalidated).
- Teacher can disable PIN entirely and switch to manual.
- Expired PIN submissions are rejected with a clear message.

**Why PIN instead of just open self-attendance?**
- Students cannot mark attendance from home or outside the class.
- The PIN is only known to students who are physically present in the room.
- It's a lightweight, no-hardware presence verification.

---

#### Mode C: QR Code (Visual Session Link)

Same concept as PIN, but visual. Teacher's screen displays a QR code.
Students scan it with their phone camera. The QR code encodes a time-limited signed URL.

```
Teacher opens session
  -> Teacher clicks [Show QR Code]
  -> System generates QR code (encodes: session_id + token + expiry)
  -> QR displayed on teacher's screen / projector

Student:
  -> Scans QR with phone camera (standard camera app, no special app needed)
  -> Opens browser link
  -> If already logged in: automatically marks attendance
  -> If not logged in: login prompt, then marks attendance

Backend:
  -> Verifies signed QR token (not forged)
  -> Verifies expiry
  -> Verifies student enrolled in session's class
  -> Creates record in student_self_attendance with source='qr'
  -> Teacher reviews and accepts/rejects
```

**QR rules:**
- QR encodes a signed JWT-like token (session_id + expiry + server HMAC signature).
- Token expires after configurable window (default: 10 minutes).
- Token is single-use per student — scanning twice does nothing.
- Teacher can regenerate QR (old token immediately invalidated).
- QR is NOT a permanent URL — it changes every session and expires.

---

#### Comparing No-Device Modes

| Mode | Student needs | Teacher needs | Proxy risk | Best for |
|---|---|---|---|---|
| Manual Register | Nothing | Mark each student | Low (teacher sees room) | Small classes, labs |
| Session PIN | Phone + browser | Project/write PIN | Medium (friend can share PIN) | Regular lectures |
| QR Code | Phone with camera | Screen/projector | Medium (photo of QR) | Larger lectures |
| ESP32 Fingerprint | Fingerprint | Device registered | Very low (biometric) | High-trust environments |

---

#### Session State With No-Device Mode

The session states are the same regardless of whether a device is used:

```
DRAFT      -> Session created, not open
OPEN       -> Students can submit (PIN / QR / self-attendance button)
CLOSED     -> Submissions locked; teacher reviewing
FINALIZED  -> Locked permanently
```

The only difference: when no ESP32 is connected for a class,
the "Sync from ESP32" button is hidden/disabled automatically.
The report page shows only the Teacher Register and Self-Attendance columns.
The comparison column (ESP32 vs Register) only appears when a device exists.

---

#### Database: No-Device Mode Tables

```sql
-- Session PIN table
attendance_session_pins (
  id             INT PK AUTO_INCREMENT,
  session_id     INT FK -> attendance_sessions.id,
  pin_hash       VARCHAR(255),    -- bcrypt hash of the 4-6 digit PIN
  generated_at   TIMESTAMP,
  expires_at     TIMESTAMP,       -- generated_at + configured window
  is_active      BOOLEAN DEFAULT TRUE,  -- FALSE once regenerated or session closed
  generated_by   INT FK -> users.id
)

-- Session QR token table
attendance_session_qr (
  id             INT PK AUTO_INCREMENT,
  session_id     INT FK -> attendance_sessions.id,
  token_hash     VARCHAR(255),    -- HMAC-signed token hash
  generated_at   TIMESTAMP,
  expires_at     TIMESTAMP,
  is_active      BOOLEAN DEFAULT TRUE,
  generated_by   INT FK -> users.id
)
```

Both tables use `is_active = FALSE` to immediately invalidate old tokens when teacher regenerates.
This ensures a student cannot use a screenshot of an old PIN/QR from a previous class.

---


## 9. Database Design Concepts

### 9.1 Core Tables Overview

```
users                       Central authentication, credentials, and account status (admin, faculty, students)
user_roles                  Clean system-level roles (SYSTEM_ADMIN, TEACHER, STUDENT) - NO scope columns

departments                 Master departments (IT, CSE, ME, etc.)
branches                    Master branches (B.Tech, Diploma, BCA, etc.)
academic_years              Academic year master (e.g., 2026-27)
subjects                    Subject master list (DBMS, OS, Math-III, etc.)
-- NOTE: No standalone 'classes' table. Cohort = Department + Branch + Year + Semester + Academic Year.

students                    Student profile & permanent identity (user_id FK, official_enrollment_no, full_name, entry_mode)
enrollments                 Historical & active cohort memberships per academic year (class_roll_no belongs here!)
teachers                    Teacher master profiles (user_id FK, employee_id, full_name, phone)
teacher_assignments         Academic functional assignments (SUBJECT_TEACHER, CLASS_TEACHER, HOD)

cohort_registration_settings Registration ON/OFF control per cohort

attendance_sessions         One session per teacher+subject+cohort+date/time (Full 16-field lifecycle schema)
attendance_session_students Roster snapshot of enrolled students frozen per session
esp32_presence              Stream 1: Raw ESP32 fingerprint scan events (physical presence evidence, UNIQUE event_id)
register_attendance         Stream 2: Teacher's official register records (authoritative attendance record)
student_self_attendance     Stream 3: Student self-attendance requests (PIN/QR/button, pending review)
attendance_session_pins     Time-limited PIN for no-device soft verification
attendance_session_qr       Time-limited QR token for no-device soft verification

devices                     Registered ESP32 devices (explicitly assigned to a cohort)
fingerprint_slots           Device slot -> student mapping (device_id + slot_id = student)
device_events               ESP32 hardware heartbeat and scan event log

notifications               In-app notifications for faculty & students
audit_logs                  Immutable audit trail
user_sessions               Refresh token storage
```

### 9.2 Key Schemas & Constraints

> **Identifier Synchronization Rule:**
> - `users.username` = Central login identifier (used for authentication).
> - `students.official_enrollment_no` = Permanent institutional/academic identifier.
> - For student accounts, the backend **enforces strict synchronization**: `users.username == students.official_enrollment_no` (e.g., `'24IT047'`).

```sql
-- 1. Central Authentication & Account Status
users (
  id                      INT PK AUTO_INCREMENT,
  username                VARCHAR(100) UNIQUE NOT NULL, -- Login identifier (Students: official_enrollment_no; Faculty: employee_id/email)
  email                   VARCHAR(150) UNIQUE NULL,     -- Official / verified Gmail
  password_hash           VARCHAR(255) NULL,            -- bcrypt hash for permanent password
  temp_password_hash      VARCHAR(255) NULL,            -- bcrypt hash for temporary password (cleared on activation)
  must_change_password    BOOLEAN DEFAULT FALSE,        -- TRUE for provisioned accounts
  google_sub              VARCHAR(255) UNIQUE NULL,     -- Google OAuth subject identifier
  status                  ENUM('PROVISIONED', 'PENDING', 'ACTIVE', 'REJECTED', 'SUSPENDED') DEFAULT 'ACTIVE',
  rejection_reason        VARCHAR(255) NULL,            -- Reason if registration was rejected
  created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 2. Permanent Student Profile (Pure identity layer — NO auth credentials)
students (
  id                      INT PK AUTO_INCREMENT,
  user_id                 INT UNIQUE NOT NULL FK -> users.id,
  official_enrollment_no  VARCHAR(50) UNIQUE NOT NULL,  -- Permanent academic ID (strictly synchronized with users.username)
  full_name               VARCHAR(150) NOT NULL,
  entry_mode              ENUM('teacher_provisioned', 'self_registered', 'admin_created') DEFAULT 'teacher_provisioned',
  created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 3. Teacher Profile
teachers (
  id                      INT PK AUTO_INCREMENT,
  user_id                 INT UNIQUE NOT NULL FK -> users.id,
  employee_id             VARCHAR(50) UNIQUE NOT NULL,  -- Faculty / Employee ID
  full_name               VARCHAR(150) NOT NULL,
  phone                   VARCHAR(20) NULL,
  created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 4. Cohort Enrollment & Academic History (Preserves roll no & cohort across years)
enrollments (
  id                      INT PK AUTO_INCREMENT,
  student_id              INT NOT NULL FK -> students.id,
  department_id           INT NOT NULL FK -> departments.id, -- Cohort Department
  branch_id               INT NOT NULL FK -> branches.id,    -- Cohort Branch
  year                    INT NOT NULL,                      -- 1, 2, 3, 4
  semester                INT NOT NULL,                      -- 1 to 8
  academic_year_id        INT NOT NULL FK -> academic_years.id,
  class_roll_no           INT NOT NULL,                      -- Roll number within THIS cohort & academic year
  status                  ENUM('ENROLLED', 'COMPLETED', 'PROMOTED', 'DROPPED') DEFAULT 'ENROLLED',
  created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  UNIQUE(department_id, branch_id, year, semester, academic_year_id, class_roll_no), -- roll no unique per cohort per year
  UNIQUE(student_id, academic_year_id)                                              -- one cohort per student per year
);

-- 5. Full Attendance Sessions (Complete 16-field Lifecycle Schema)
attendance_sessions (
  id                      INT PK AUTO_INCREMENT,
  teacher_id              INT NOT NULL FK -> teachers.id,
  subject_id              INT NOT NULL FK -> subjects.id,
  department_id           INT NOT NULL FK -> departments.id,
  branch_id               INT NOT NULL FK -> branches.id,
  year                    INT NOT NULL,                      -- 1, 2, 3, 4
  semester                INT NOT NULL,                      -- 1 to 8
  academic_year_id        INT NOT NULL FK -> academic_years.id,
  session_type            ENUM('THEORY', 'PRACTICAL', 'TUTORIAL', 'EXTRA') DEFAULT 'THEORY',
  label                   VARCHAR(100) NULL,                 -- e.g., "Regular Lecture", "Lab Batch A"
  start_time              DATETIME NOT NULL,
  end_time                DATETIME NULL,
  state                   ENUM('DRAFT', 'OPEN', 'CLOSED', 'FINALIZED') DEFAULT 'DRAFT',
  auto_close_at           DATETIME NULL,                     -- Optional timer expiration timestamp
  created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 6. Session Roster Snapshot (Freezes enrolled students when session is opened)
attendance_session_students (
  id                      INT PK AUTO_INCREMENT,
  session_id              INT NOT NULL FK -> attendance_sessions.id,
  student_id              INT NOT NULL FK -> students.id,
  enrollment_id           INT NOT NULL FK -> enrollments.id,
  class_roll_no           INT NOT NULL,
  included                BOOLEAN DEFAULT TRUE,
  created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(session_id, student_id)
);

-- 7. Hardware Devices (Explicitly bound to a cohort)
devices (
  id                      INT PK AUTO_INCREMENT,
  device_uid              VARCHAR(100) UNIQUE NOT NULL,      -- MAC address / hardware serial
  name                    VARCHAR(100) NOT NULL,             -- e.g. "Lab 3 - ESP32 #1"
  department_id           INT NOT NULL FK -> departments.id, -- Assigned Department
  branch_id               INT NOT NULL FK -> branches.id,    -- Assigned Branch
  year                    INT NOT NULL,                      -- Assigned Year
  semester                INT NOT NULL,                      -- Assigned Semester
  academic_year_id        INT NOT NULL FK -> academic_years.id,
  secret_hash             VARCHAR(255) NOT NULL,             -- Shared secret for HMAC / Auth header
  certificate_fingerprint VARCHAR(255) NULL,                 -- Self-signed TLS cert fingerprint
  is_active               BOOLEAN DEFAULT TRUE,
  last_heartbeat_at       TIMESTAMP NULL,
  created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. Three Attendance Streams Constraints
-- Stream 1: ESP32 raw scan deduplication (Event ID deduplication only; multiple scans retained as raw evidence)
esp32_presence: UNIQUE(event_id)

-- Stream 2: Official register: No duplicate student attendance per session
register_attendance: UNIQUE(session_id, student_id)

-- Stream 3: Student self-attendance: No duplicate submission per session
student_self_attendance: UNIQUE(session_id, student_id)

-- Sessions per day: MULTIPLE ALLOWED
-- No UNIQUE constraint on cohort+subject+date.
-- Teacher can create multiple sessions (e.g., Theory, Practical, Lab) for same subject+cohort+day.
-- Differentiated by: session_type + label + start_time.

-- Device slot mapping (device_id + slot_id uniquely identifies a student)
fingerprint_slots: UNIQUE(device_id, slot_id)

-- One registration toggle per cohort per academic year
cohort_registration_settings: UNIQUE(department_id, branch_id, year, semester, academic_year_id)
```

### 9.3 Key Relationships

```
users 1---1 students
users 1---1 teachers
users 1---N user_roles

students 1---N enrollments
enrollments N---1 academic_years
enrollments N---1 departments
enrollments N---1 branches

teachers 1---N teacher_assignments
teacher_assignments N---1 subjects
teacher_assignments N---1 departments
teacher_assignments N---1 branches
teacher_assignments N---1 academic_years

branches N---1 departments

devices N---1 departments
devices N---1 branches
devices N---1 academic_years

attendance_sessions N---1 subjects
attendance_sessions N---1 teachers
attendance_sessions N---1 departments
attendance_sessions N---1 academic_years

-- Stream 1: Raw ESP32 Hardware Presence (Supporting Evidence)
esp32_presence N---1 students
esp32_presence N---1 devices

-- Stream 2: Official Teacher Register (Authoritative Source of Truth)
register_attendance N---1 attendance_sessions
register_attendance N---1 students

-- Stream 3: Student Self-Attendance (Soft Verification Requests)
student_self_attendance N---1 attendance_sessions
student_self_attendance N---1 students

fingerprint_slots N---1 devices
fingerprint_slots N---1 students
```

---

## 10. API Boundaries

### 10.1 Base URL

All API routes: /api/v1/
Frontend pages served as static files by Express.

### 10.2 Authentication Routes

| Method | Path | Auth |
|---|---|---|
| POST | /api/v1/auth/faculty/login | Public |
| POST | /api/v1/auth/student/login | Public |
| POST | /api/v1/auth/student/register | Public |
| POST | /api/v1/auth/google/faculty | Public |
| POST | /api/v1/auth/google/student | Public |
| POST | /api/v1/auth/refresh | RefreshToken cookie |
| POST | /api/v1/auth/logout | Authenticated |

### 10.3 Student Routes

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET  | /api/v1/students/me | Student | Get own profile |
| PUT  | /api/v1/students/me | Student | Update profile photo / personal details |
| GET  | /api/v1/students/me/attendance | Student | Get own attendance history |
| GET  | /api/v1/students/me/attendance/stats | Student | Attendance percentage & predictive metrics |
| GET  | /api/v1/students/ | Admin/Teacher | List students (filterable by cohort) |
| POST | /api/v1/students/provision | Teacher/Admin | Provision single student profile with temp password |
| POST | /api/v1/students/provision/bulk | Teacher/Admin | Bulk provision students via CSV/JSON |
| POST | /api/v1/students/:id/regenerate-temp-password | Teacher/Admin | Reset/regenerate temporary password |
| POST | /api/v1/students/:id/activate | Public | Activate profile with temp password & set new password |
| POST | /api/v1/students/credentials/export | Teacher/Admin | Export credentials sheet (Excel / PDF slips) |
| GET  | /api/v1/students/registrations/pending | ClassTeacher | List self-registered students awaiting review |
| POST | /api/v1/students/registrations/:id/approve | ClassTeacher | Approve self-registered student |
| POST | /api/v1/students/registrations/:id/reject | ClassTeacher | Reject self-registered student |

### 10.4 Attendance Routes

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | /api/v1/attendance/sessions | Teacher | Create session (takes cohort snapshot in `attendance_session_students`) |
| GET  | /api/v1/attendance/sessions | Teacher | List teacher's sessions |
| GET  | /api/v1/attendance/sessions/:id | Teacher | Get session details, roster snapshot, and register |
| PUT  | /api/v1/attendance/sessions/:id/state | Teacher | Transition state (`DRAFT` -> `OPEN` -> `CLOSED` -> `FINALIZED`) |
| POST | /api/v1/attendance/sessions/:id/sync-esp32 | Teacher | 1-click sync from `esp32_presence` into register |
| POST | /api/v1/attendance/sessions/:id/pin | Teacher | Generate time-limited 4-6 digit soft verification PIN |
| POST | /api/v1/attendance/sessions/:id/pin/regenerate | Teacher | Invalidate and generate fresh PIN |
| POST | /api/v1/attendance/sessions/:id/qr | Teacher | Generate dynamic rotating QR token (HMAC) |
| POST | /api/v1/attendance/sessions/:id/qr/regenerate | Teacher | Invalidate and generate fresh QR token |
| GET  | /api/v1/attendance/sessions/active | Student | Detect currently OPEN session for student's cohort |
| POST | /api/v1/attendance/sessions/:id/self-attendance | Student | Submit standard button self-attendance request |
| POST | /api/v1/attendance/sessions/:id/self-attendance/pin | Student | Submit self-attendance request with verified PIN |
| POST | /api/v1/attendance/sessions/:id/self-attendance/qr | Student | Submit self-attendance request with scanned QR |
| POST | /api/v1/attendance/sessions/:id/self-attendance/:reqId/accept | Teacher | Accept self-attendance request into register |
| POST | /api/v1/attendance/sessions/:id/self-attendance/:reqId/reject | Teacher | Reject self-attendance request |
| POST | /api/v1/attendance/sessions/:id/records | Teacher | Bulk save/update teacher register records |
| PUT  | /api/v1/attendance/sessions/:id/records/:recordId | Teacher | Update individual student attendance record |

### 10.5 Device API

IMPORTANT: ESP32 never connects directly to MySQL. Only uses this API.

| Method | Path | Auth |
|---|---|---|
| GET | /api/v1/devices/ | Admin |
| POST | /api/v1/devices/ | Admin |
| POST | /api/v1/devices/webhook/scan | DeviceSecretKey |
| GET | /api/v1/devices/:id/status | Admin |

### 10.6 Admin Routes

| Method | Path | Auth |
|---|---|---|
| CRUD | /api/v1/admin/departments | Admin |
| CRUD | /api/v1/admin/branches | Admin |
| CRUD | /api/v1/admin/academic-years | Admin |
| CRUD | /api/v1/admin/subjects | Admin |
| CRUD | /api/v1/admin/faculty | Admin |
| CRUD | /api/v1/admin/students | Admin |
| CRUD | /api/v1/admin/enrollments | Admin |
| CRUD | /api/v1/admin/teacher-assignments | Admin |
| GET  | /api/v1/admin/audit-logs | Admin |
| GET  | /api/v1/admin/dashboard | Admin |

### 10.7 General API Rules

- All API endpoints return JSON unless the endpoint explicitly performs a file export (e.g. CSV, Excel, or PDF credential/attendance exports), in which case it returns the appropriate binary/text MIME content-type.
- Error format: `{ success: false, error: { code, message, details } }`
- Success format: `{ success: true, data: {...}, meta: { pagination } }`
- Backend validates ALL request bodies. Frontend validation is UX only.
- All SQL uses parameterized prepared statements (no string interpolation).

---

## 11. Frontend Pages & Features

### 11.1 Public Pages

| Page | URL |
|---|---|
| Landing | / |
| Faculty Login | /login/faculty |
| Student Login | /login/student |
| Student Register | /register/student |

### 11.2 Student Pages

| Page | URL | Key Features |
|---|---|---|
| Dashboard | /student/dashboard | Attendance %, active session alert, recent records, warnings |
| Active Attendance | /student/attendance/active | Open sessions, Mark Attendance button |
| Attendance History | /student/attendance/history | All sessions with status |
| Subject-wise | /student/attendance/subjects | Per-subject stats |
| Notifications | /student/notifications | All notifications |
| Profile | /student/profile | View/edit profile, password change, Google link status |

Student Dashboard widgets:
- Overall attendance percentage (circular progress)
- Present count / Total classes
- Absent count
- Subject-wise breakdown (mini bars)
- Active session alert (prominent if session is open)
- Recent attendance (last 5-10 records)
- Predictive Attendance Card ("Can miss X more classes" / "Attend Y classes to reach T%")

### 11.3 Faculty/Teacher Pages

| Page | URL | Key Features |
|---|---|---|
| Dashboard | /faculty/dashboard | Today's sessions, stats, notifications |
| My Cohorts | /faculty/cohorts | Assigned cohorts (Dept/Branch/Year/Sem) for current academic year |
| My Subjects | /faculty/subjects | Assigned subjects |
| Sessions | /faculty/attendance/sessions | All sessions, create new (Theory, Practical, Lab) |
| Live Attendance | /faculty/attendance/sessions/:id/live | Real-time attendance, mark, confirm, finalize |
| Students | /faculty/students | Students enrolled in assigned cohorts |
| Registrations | /faculty/registrations | Pending approvals (Class Teacher only) |
| Registration Settings | /faculty/registrations/settings | Toggle ON/OFF (Class Teacher only) |
| Reports | /faculty/reports | Generate cohort/subject reports |

### 11.4 Admin Pages

| Page | URL |
|---|---|
| Dashboard | /admin/dashboard |
| Students | /admin/students |
| Faculty | /admin/faculty |
| Departments | /admin/departments |
| Branches | /admin/branches |
| Academic Years | /admin/academic-years |
| Subjects | /admin/subjects |
| Cohort Enrollments | /admin/enrollments |
| Teacher Assignments | /admin/assignments |
| Devices | /admin/devices |
| Attendance Records | /admin/attendance |
| Reports | /admin/reports |
| Audit Logs | /admin/audit |
| Settings | /admin/settings |

---

## 12. Device Integration ESP32

### 12.1 Architecture Rule

ESP32 must NEVER connect directly to MySQL.

```
ESP32 + AS608 Fingerprint Sensor
  -> HTTPS POST /api/v1/devices/webhook/scan
  -> Express.js Backend
  -> MySQL Database
```

### 12.2 ESP32 Scan Event Payload

```json
{
  "device_id": "device_mac_or_registered_id",
  "slot_id": 42,
  "event_id": "uuid-v4-for-deduplication",
  "timestamp": "2026-09-07T09:30:00Z",
  "battery": 87
}
```

### 12.3 Backend Processing

1. Verify device secret key in Authorization header.
2. Look up device_id in devices table.
3. Look up (device_id, slot_id) in fingerprint_slots table to find student.
4. Record event in esp32_presence.
5. If active session exists for device's cohort: notify teacher.
6. Return success/error to ESP32.

### 12.4 Offline Resilience

ESP32 stores events in W25Q32 SPI Flash when offline.
When connection restores, ESP32 POSTs queued events.
Backend deduplicates using UNIQUE(event_id) in esp32_presence.

### 12.5 Slot Mapping Rule

slot_id alone is never a student identity.
Only (device_id + slot_id) together uniquely identify a student.
Same slot number on different devices = different students.

---

## 13. Reporting

### 13.1 Report Types

Because attendance exists in THREE separate streams, reports can be generated per-stream
or as a comparison between streams.

| Type | Source Stream | Filters |
|---|---|---|
| Teacher Register Report | register_attendance | Class, Subject, Date Range |
| ESP32 Presence Report | esp32_presence | Class, Device, Date Range |
| Self-Attendance Report | student_self_attendance | Class, Subject, Date Range |
| Stream Comparison Report | register + esp32_presence | Class, Subject, Date |
| Student Full Report | All streams combined | Student ID, Date Range |
| Daily Summary | register_attendance | Date, Class |
| Low Attendance Alert | register_attendance | Class, Threshold %, Subject |

### 13.2 Teacher Register Report (Official)

This is the primary report and the sole authoritative basis for transcripts, exams, and eligibility. Based exclusively on the teacher's **FINALIZED** register.

**Official Attendance Statistics Rule:**
- ONLY sessions in state `FINALIZED` contribute to official attendance.
- Attended Count ($P$) = Total finalized sessions where `attendance_status IN ('PRESENT', 'LATE')` (both count as attended; `ABSENT` does NOT count).
- Total Conducted Sessions ($C$) = Total finalized sessions where the student was included in the session roster snapshot (`attendance_session_students.included = TRUE`).
- **Official Attendance %** = $\frac{\text{PRESENT} + \text{LATE}}{C} \times 100$.
- *Raw `esp32_presence` scans and `student_self_attendance` requests NEVER independently alter or inflate this percentage.*

Columns:
- Student Name
- Enrollment Number
- Total Sessions Conducted ($C$)
- Present Count
- Late Count
- Absent Count
- Attended Total ($P = \text{Present} + \text{Late}$)
- Attendance Percentage
- Source breakdown: How many records originated from manual / ESP32 sync / accepted self-attendance

### 13.3 ESP32 Presence Report (Hardware Log)

Raw fingerprint scan data. Independent of subject attendance.

Columns:
- Student Name
- Enrollment Number
- Date
- Scan Time
- Device Name
- Cohort (device's assigned cohort)
- Total Scan Days

Use cases:
- Verify who physically came to college/classroom
- Catch discrepancies with register
- Work as backup evidence if register has errors

### 13.4 Stream Comparison Report (Key Feature)

This report shows the same set of students with data from BOTH
the Teacher Register AND the ESP32 stream side by side.
This allows the teacher or admin to spot discrepancies.

Columns:
- Student Name
- Enrollment Number
- Register: Present / Absent
- ESP32 Scan: Detected / Not Detected
- Status: MATCH | MISMATCH
- Notes

**Mismatch cases and what they mean:**

| Register | ESP32 | Status | Possible Reason |
|---|---|---|---|
| PRESENT | Detected | MATCH | Normal — student present in both |
| ABSENT | Not Detected | MATCH | Normal — student absent in both |
| PRESENT | Not Detected | MISMATCH | Teacher marked present but ESP32 did not scan (sensor issue, proxy, ESP32 offline) |
| ABSENT | Detected | MISMATCH | Student scanned at door but teacher marked absent (wrong class, or left early) |

This comparison is for review and audit purposes — it does NOT automatically correct either stream.

### 13.5 Standard Report Columns (Base)

- Student Name
- Enrollment Number
- Total Classes Conducted
- Present Count
- Absent Count
- Attendance Percentage
- (Comparison reports add: ESP32 scan count, Mismatch count)

### 13.6 Export Formats (v1.0)

- Screen: HTML table, responsive
- CSV: For spreadsheet import
- PDF: Planned for future (jsPDF or server-side)

---

## 14. Security Requirements

### 14.1 Authentication & Sessions

- Passwords hashed with bcrypt (min 10 salt rounds)
- JWT access tokens expire after 60 minutes
- Refresh tokens in httpOnly cookies
- Refresh token rotation on every use
- Refresh tokens in DB for revocation
- Google ID tokens verified server-side with google-auth-library

### 14.2 Authorization

- All role checks on backend
- Frontend never trusted for permissions
- RBAC middleware on every protected route
- Scoped authorization enforced:
  - Class Teacher can only approve their assigned class
  - Student can only mark attendance for enrolled sessions
  - Teacher can only manage their own sessions

### 14.3 Database Security

- All SQL uses parameterized prepared statements (mysql2)
- No raw SQL string interpolation anywhere
- File uploads: size limits and type validation
- Input validation server-side before processing

### 14.4 Transport & Network

- HTTPS enforced in production
- helmet.js for HTTP security headers
- CORS restricted to known origins
- express-rate-limit on login and registration routes
- Device webhook endpoints rate-limited

### 14.5 Attendance Integrity

- UNIQUE(session_id, student_id) database constraint
- Backend duplicate check before insert
- event_id UUID deduplication for device scans
- Session finalization locks records
- All finalization actions in audit_logs

### 14.6 Audit Logging

Every significant action recorded:
- Login / Logout
- Registration submitted / approved / rejected
- Attendance session created / opened / closed / finalized
- Attendance record modified
- Teacher assignment changed
- Device registered / deactivated
- Registration toggle ON/OFF

### 14.7 Future Multi-Tenant Readiness

- Database schema designed to support institution_id / tenant_id later
- No hardcoded institution-specific values
- Configuration via environment variables

---

## 15. Future Migration Path

### 15.1 React Native Mobile Apps

Same Express API serves both web and mobile:

```
React Native Student App  ->
React Native Teacher App  -> Express /api/v1/ -> MySQL
HTML/CSS/JS Web           ->
```

No API changes needed for mobile. API is already REST/JSON compliant.

### 15.2 Next.js Frontend Migration

Keep Express + MySQL backend unchanged.
Replace HTML/CSS/JS frontend with Next.js pages.
JWT cookie auth flow is already compatible.

### 15.3 UIAP Integration

When converting to a UIAP module:

```
UIAP Core
  Attendance Module
    manifest.json
    migrations/
      001_initial.sql  (from our MySQL schema)
    backend/
      index.ts         (wraps our Express routes using UIAP module-sdk)
    frontend/
      (our HTML pages become React components)
```

v1.0 design requirements for future UIAP compatibility:
- API routes modular and grouped by feature
- Database tables prefixed with "attendance_"
- Business logic in services (not controllers)
- Events documented (what module emits and listens for)

---

## 16. Development Phases

### Phase 0: Environment Setup (1-2 days)
- Create attendance-system/ directory structure
- Initialize Node.js project with dependencies
- Setup MySQL and connection pool
- Configure .env
- Basic Express server with health check
- CSS variables design system
- Shared HTML layout structure

### Phase 1: Auth & User Management (3-5 days)
- Faculty login (ID/password)
- Student login (enrollment/password)
- JWT generation and verification middleware
- Refresh token flow
- Bcrypt password hashing
- Logout

### Phase 2: Admin — Institution Structure & Master Data (3-5 days)
- Departments CRUD (seeded defaults)
- Branches CRUD (seeded defaults)
- Academic Years CRUD
- Subjects CRUD
- Cohort Management & Student Enrollments (`enrollments` table)
- Admin dashboard (basic)

### Phase 3: Faculty Management (2-3 days)
- Admin creates faculty accounts
- Teacher assignment (SUBJECT_TEACHER per cohort, CLASS_TEACHER, HOD)
- Faculty list and management pages

### Phase 4: Student Provisioning, Activation & Fallback Registration (4-5 days)
- Teacher student provisioning (single & bulk CSV) with auto-generated temporary credentials
- Downloadable credentials export (Excel sheet & printable PDF slips)
- Student profile activation & forced first-login password change
- Fallback student self-registration form (filtered by cohort dropdowns)
- Registration status flow (PROVISIONED / PENDING -> ACTIVE / REJECTED)
- Class Teacher approval page & cohort registration ON/OFF toggle
- Notification system (basic)

### Phase 5: Google OAuth (2-3 days)
- Google OAuth setup
- Student registration with Google prefill
- Faculty Google fast login
- Google account linking for existing accounts

### Phase 6: Attendance Core (5-7 days)
- Attendance session creation (DRAFT)
- Session state management (DRAFT -> OPEN -> CLOSED -> FINALIZED)
- Student self-attendance marking (during OPEN state)
- Teacher manual marking & 1-click ESP32 sync
- Duplicate prevention
- Live attendance page (polling or SSE)
- Auto-close timer integration (OPEN -> CLOSED)
- Session review (CLOSED) and final locking (FINALIZED)

### Phase 7: Student Portal (3-4 days)
- Student dashboard with attendance stats
- Attendance history page
- Subject-wise attendance breakdown
- Active session detection
- Notifications page
- Student profile page

### Phase 8: Teacher Portal (3-4 days)
- Teacher dashboard
- Class/subject views
- Session management
- Live attendance view
- Student list per class
- Registration management (Class Teacher)

### Phase 9: Reports (3-4 days)
- Class attendance report
- Subject attendance report
- Student individual report
- CSV export
- Low attendance alerts

### Phase 10: Device API (2-3 days)
- Device registration (Admin)
- ESP32 webhook endpoint
- Device secret key authentication
- Fingerprint slot mapping
- Classroom presence recording
- Offline event deduplication

### Phase 11: Security Hardening (2-3 days)
- Rate limiting on all sensitive routes
- Helmet security headers
- CORS configuration
- Full audit logging
- Input validation review
- SQL injection audit
- HTTPS configuration

### Phase 12: Polish & Testing (3-5 days)
- Responsive CSS review (desktop, tablet, mobile)
- Cross-browser testing
- Error state handling
- Loading state indicators
- Empty state designs
- Manual end-to-end testing

---

## 17. Design System

### 17.1 CSS Root Variables

All colors in the system derive from these root custom properties:

```css
:root {
  /* Brand Colors */
  --primary:          hsl(231, 89%, 62%);
  --primary-dark:     hsl(231, 89%, 50%);
  --primary-light:    hsl(231, 89%, 72%);

  /* Backgrounds */
  --background:       hsl(222, 47%, 8%);
  --surface:          hsl(222, 35%, 12%);
  --surface-raised:   hsl(222, 35%, 16%);
  --surface-overlay:  hsl(222, 35%, 20%);

  /* Typography */
  --text:             hsl(220, 30%, 95%);
  --text-muted:       hsl(220, 15%, 60%);
  --text-faint:       hsl(220, 10%, 40%);

  /* Borders */
  --border:           hsl(222, 25%, 20%);
  --border-focus:     hsl(231, 89%, 62%);

  /* Semantic Colors */
  --success:          hsl(142, 71%, 45%);
  --success-subtle:   hsl(142, 71%, 10%);
  --warning:          hsl(38, 92%, 50%);
  --warning-subtle:   hsl(38, 92%, 10%);
  --danger:           hsl(0, 84%, 60%);
  --danger-subtle:    hsl(0, 84%, 10%);
  --info:             hsl(199, 89%, 48%);
  --info-subtle:      hsl(199, 89%, 10%);

  /* Attendance Status Colors */
  --status-present:   var(--success);
  --status-absent:    var(--danger);
  --status-pending:   var(--warning);
  --status-finalized: hsl(231, 40%, 50%);

  /* Spacing & Shape */
  --radius-sm:        6px;
  --radius-md:        10px;
  --radius-lg:        16px;
  --radius-xl:        24px;
  --radius-full:      9999px;

  /* Typography */
  --font-sans:  'Inter', 'Outfit', system-ui, -apple-system, sans-serif;
  --font-mono:  'JetBrains Mono', 'Fira Code', monospace;

  /* Shadows */
  --shadow-sm:    0 1px 3px rgba(0,0,0,0.3);
  --shadow-md:    0 4px 16px rgba(0,0,0,0.4);
  --shadow-lg:    0 8px 32px rgba(0,0,0,0.5);
  --shadow-glow:  0 0 24px hsla(231, 89%, 62%, 0.2);

  /* Transitions */
  --transition-fast:  150ms ease;
  --transition-base:  250ms ease;
  --transition-slow:  400ms ease;
}
```

### 17.2 Responsive Breakpoints

```css
/* Mobile first */
@media (min-width: 480px)  { /* Small mobile */ }
@media (min-width: 640px)  { /* Large mobile */ }
@media (min-width: 768px)  { /* Tablet */ }
@media (min-width: 1024px) { /* Desktop */ }
@media (min-width: 1280px) { /* Large desktop */ }
```

### 17.3 Layout Patterns

- Dashboard: Sidebar (fixed, collapsible on mobile) + Main content area
- Auth pages: Centered card with subtle glassmorphism
- Data tables: Responsive (horizontal scroll on mobile)
- Cards: Rounded, border, subtle background
- Modals: Backdrop blur overlay
- Notifications: Top-right toast or inline alert

---

## Decisions Made (Resolved Design Questions)

> All open questions from the initial planning phase have been answered.
> This section records the final decisions for each.

---

### Decision 1: Attendance Session Uniqueness

**Decision: Multiple sessions per subject+class+day are ALLOWED.**

The previous `UNIQUE(class_id, subject_id, date)` constraint has been **removed**.

Teacher can create as many sessions as needed for the same subject on the same day:
- Theory lecture (morning)
- Practical / Lab (afternoon)
- Tutorial (evening)
- Any extra class the teacher wants to record

Each session has:
- A `session_type` label: teacher types any label ("Theory", "Practical", "Lab", or custom)
- A `start_time` timestamp
- Its own independent register

Student data (enrollment list) is **automatically pulled** from the class enrollment when the session is created. Teacher does not need to add students manually for each session.

If teacher wants a different student list (e.g., elective subgroup), they can manually include/exclude students from that session's register before finalizing.

```sql
attendance_sessions table changes:
  + session_type    VARCHAR(100) DEFAULT 'Theory'  -- e.g. Theory, Practical, Lab, Tutorial
  + label          VARCHAR(200) NULLABLE           -- optional extra label by teacher
  + auto_close_at  TIMESTAMP NULLABLE              -- auto-close timer (see Decision 7)
  (removed UNIQUE constraint on cohort+subject+date)
```

---

### Decision 2: Student Profiles — Teacher Creates, Student Activates

**Decision: Teacher creates the COMPLETE student profile. Student only activates it.**

The student does NOT fill a registration form if the teacher has already created their profile.
The student just claims/activates the pre-created account using Google or by setting a password.

---

#### Two Enrollment Numbers

Every student has TWO separate ID numbers:

| Field | Name | Set By | Uniqueness | Purpose |
|---|---|---|---|---|
| `official_enrollment_no` | University Enrollment Number | Teacher / Admin (from university records) | Globally unique (in `students` table) | Official identity, university-issued (e.g., "22IT001") — permanent Login ID |
| `class_roll_no` | Class Roll Number | Teacher | Unique per cohort per academic year (in `enrollments` table) | Internal class order (e.g., Roll 1, 2, 3... or 15) — used for roll call and register sorting |

**Why two numbers:**
- `official_enrollment_no` = what the university knows the student as. Used for certificates, results, official records.
- `class_roll_no` = what the teacher uses day-to-day in the class register. Physical attendance registers are sorted by roll number.
- They are separate fields. A student can have Roll No. 15 in IT-Year 2 Sem 3 but official enrollment 2024IT047. Roll numbers are stored in `enrollments` to preserve history as students advance across academic years.

**Default register sort:**
The teacher's attendance register (attendance session student list) is sorted by `class_roll_no` ascending by default.
This matches how a physical register / roll call works.
Teacher can change sort order on the UI but default is always roll number.

---

#### Path A: Teacher Creates Full Student Profile (Primary Path)

Teacher goes to: `My Cohorts -> Students -> [Add Student]` or `[Bulk Add]`

**Academic Hierarchy & Database-Backed Master Data:**
Instead of creating arbitrary class records, the academic group is defined directly by standard, **database-backed master dropdowns** (pre-seeded with standard college defaults):
- **Department** (Database-backed master: e.g., Information Technology, Computer Engineering, Mechanical, etc.)
- **Branch** (Database-backed master: e.g., B.Tech, Diploma, BCA, MCA)
- **Year** (Master range: 1st Year, 2nd Year, 3rd Year)
- **Semester** (Master range: Sem 1 through Sem 6)
- **Academic Year** (Active academic year: e.g., 2026-27)
- **Cohort Definition:** $\textbf{Cohort} = \textbf{Department} + \textbf{Branch} + \textbf{Year} + \textbf{Semester} + \textbf{Academic Year}$.

Teacher fills in or uploads the student data:
```
Full Name
Official Enrollment Number    (university-issued ID, used as permanent Login ID)
Class Roll Number             (cohort-internal, e.g., 15 — stored in enrollments)
Gmail / Email (optional)      (if provided, student can instantly activate via Google)
Department                    (dropdown from master data)
Branch                        (dropdown from master data)
Year                          (dropdown 1-3)
Semester                      (dropdown 1-6)
```

**Automatic Temporary Password Generation:**
Upon adding students (individual or bulk), the server automatically generates:
1. A cryptographically secure, random **Temporary Password** (e.g., `Xk9#m2P` or 6-character alphanumeric PIN) for each student.
2. Initial state: `status = 'PROVISIONED'`, `must_change_password = TRUE`.

**Teacher Downloads Credentials Sheet (Excel & PDF Slips):**
Immediately after addition/import, the teacher can click:
- `[Download Credentials (Excel)]`: Contains `Roll No | Name | Official Enrollment No | Temporary Password` (for teacher's digital records or distribution).
- `[Download Printable Slips (PDF)]`: Formatted cut-out slips (6-8 per page) with Student Name, Roll No, Enrollment ID, and Temp Password that teacher can print and hand to students in class.

Teacher can also click `[Regenerate Temp Pass]` for any student who loses their slip or hasn't claimed their account.

---

#### Path B: Student Activates Profile via Temporary Credentials (or Google)

This completely replaces error-prone self-matching forms. The student never has to re-type their name or worry about spelling mismatches!

**Option 1: Login with Temporary Credentials (Primary & Zero-Friction)**
```
1. Student goes to the standard /login page.
2. Student logs in with:
     ID:       Official Enrollment Number
     Password: Temporary Password (from teacher's Excel / slip)
3. Backend validates credentials:
     -> If valid and must_change_password = TRUE:
     -> System displays Welcome Screen:
        "Welcome, [Full Name]! (Roll No: [class_roll_no], [Department])"
        (Name is displayed directly from database — NO matching or rejection!)
4. Student is prompted to:
     -> Enter their new permanent password
     -> (Optional) Click "Link Google Account" for 1-click future logins
5. Account updates:
     -> status = 'ACTIVE'
     -> must_change_password = FALSE
     -> Temporary password is permanently deleted
     -> Student enters dashboard
```

**Option 2: Direct 1-Click Activation via Google (Guarded Atomic Activation)**
```
If the teacher entered the student's Gmail during bulk upload:
1. Student clicks "Sign in with Google" on the login page.
2. Backend receives and cryptographically verifies the Google ID token (obtaining verified email and google_sub).
3. Backend performs strict security checks on `users`:
     - user.status == 'PROVISIONED'
     - user.email == verified_google_email
     - user.google_sub IS NULL
4. If ALL criteria pass, backend executes an atomic transaction:
     UPDATE users SET
       google_sub = verified_google_sub,
       status = 'ACTIVE',
       must_change_password = FALSE,
       temp_password_hash = NULL
     WHERE id = user.id;
5. Issue JWT access token + refresh cookie and log student into dashboard.
   (If email does not match a PROVISIONED user, or google_sub is already linked, reject with an informative security message).
```

**Why this completely solves the "Name Rejection" issue:**
- The server **never compares student-typed names** with database names.
- The identity is verified strictly by `Official Enrollment Number` + `Temporary Password` (a secret distributed by the teacher) or verified `Google OAuth token`.
- Spacing differences, initials, middle names, or casing cannot cause rejection.

**After activation:**
- Student logs in with `Enrollment Number` + `Permanent Password`, or with `Google`.
- Master details (Name, Enrollment No, Cohort assignments) remain read-only for students. Only teacher/admin can edit them.

---

#### Path C: Student Self-Registers (Fallback when No Profile Exists)

If a student's profile was NOT pre-created by the teacher:
```
Student fills registration form:
  -> Official Enrollment Number
  -> Full Name, Gmail, Password
  -> Department, Branch, Year, Semester (all from master data dropdowns)
  -> User record created with status = 'PENDING'
  -> Class Teacher approves/rejects from Teacher Registrations dashboard
```

---

#### Student Status Lifecycle (Updated)

Account status is tracked in `users.status`:

```
PROVISIONED  -> Teacher created profile & temporary password. Student has not activated yet.
               Appears in class register. No login access until activated.
PENDING      -> Self-registered student awaiting class teacher approval.
ACTIVE       -> Activated account (via temporary password, Google OAuth, or class teacher approval). Can log in.
REJECTED     -> Class teacher rejected registration (stores rejection_reason).
SUSPENDED    -> Admin suspended. Cannot log in.
```

---

#### Register Default View (Sorted by Class Roll Number)

When teacher opens an attendance session, the student list loads in this default order:

```
Roll No | Name           | Official Enrollment | Status
--------|----------------|---------------------|--------
1       | Arjun Mehta    | 2024IT003           | ACTIVE
2       | Priya Patel    | 2024IT002           | PROVISIONED (not activated)
3       | Rahul Sharma   | 2024IT001           | ACTIVE
...
15      | Sneha Desai    | 2024IT015           | ACTIVE
```

- Teacher sees **all students** including PROVISIONED ones (they exist in the class, just no login yet).
- Teacher can mark attendance for PROVISIONED students too — they are real students in the class.
- The "not yet activated" status is informational for the teacher.

---

#### Database Changes

```sql
-- 1. Central User Authentication & Status
users:
  id                      INT PK AUTO_INCREMENT
  username                VARCHAR(100) UNIQUE          -- official_enrollment_no for students, email/emp_id for faculty
  email                   VARCHAR(150) UNIQUE NULL     -- official/verified Gmail
  password_hash           VARCHAR(255) NULL            -- permanent password bcrypt hash
  temp_password_hash      VARCHAR(255) NULL            -- temporary password hash (cleared on first login)
  must_change_password    BOOLEAN DEFAULT FALSE        -- TRUE for provisioned accounts until password is set
  google_sub              VARCHAR(255) NULL UNIQUE     -- linked Google Subject ID
  status                  ENUM('PROVISIONED', 'PENDING', 'ACTIVE', 'REJECTED', 'SUSPENDED') DEFAULT 'ACTIVE'
  rejection_reason        VARCHAR(255) NULL

-- 2. Permanent Student Profile (Pure identity — NO credentials)
students:
  id                      INT PK AUTO_INCREMENT
  user_id                 INT UNIQUE NOT NULL FK -> users.id
  official_enrollment_no  VARCHAR(50) UNIQUE           -- university-issued permanent academic ID (synchronized with users.username)
  full_name               VARCHAR(150) NOT NULL
  entry_mode              ENUM('teacher_provisioned', 'self_registered', 'admin_created')

-- 3. Academic Cohort Membership & History (Roll no belongs here!)
enrollments:
  id                      INT PK AUTO_INCREMENT
  student_id              INT FK -> students.id
  department_id           INT                          -- Cohort Department
  branch_id               INT                          -- Cohort Branch
  year                    INT                          -- 1, 2, 3, 4
  semester                INT                          -- 1 to 8
  academic_year_id        INT FK -> academic_years.id
  class_roll_no           INT                          -- class roll number within THIS cohort & academic year
  status                  ENUM('ENROLLED', 'COMPLETED', 'PROMOTED', 'DROPPED')
  UNIQUE(department_id, branch_id, year, semester, academic_year_id, class_roll_no)
  UNIQUE(student_id, academic_year_id)
```

---

### Decision 3: HTTPS Certificate

**Decision: Self-signed certificate generated by the local server.**

- The local Express server generates a self-signed TLS certificate on first startup.
- Certificate is stored in the server's config directory.
- The **same certificate is distributed to ESP32 devices** during device registration:
  - Admin registers the ESP32 from the dashboard.
  - Dashboard shows the certificate fingerprint / PEM.
  - The certificate is flashed/configured into the ESP32 firmware.
  - ESP32 uses this certificate to verify it is talking to the real local server (not a man-in-the-middle).
- Staff browsers on the LAN will see a "Not secure" warning on first visit.
  - Admin adds a browser exception once per device.
  - This is acceptable for a local LAN system.
- HTTPS is still used (not plain HTTP) — traffic is encrypted.

---

### Decision 4: Notifications

**Decision: In-app notifications only for v1.0. No email.**

- All notifications are stored in the `notifications` table and shown in the UI.
- Notification bell icon in the top navbar with unread count badge.
- Notification types:
  - New student registration pending approval (to Class Teacher)
  - Registration approved / rejected (to Student)
  - Active attendance session opened (to Students in that class)
  - Low attendance warning (to Student)
  - Session finalized (to Students)
- Email notifications (via SMTP/nodemailer) are planned for v2.0.
- Notification delivery uses polling (or Server-Sent Events) in v1.0.
  No WebSocket push required for v1.0.

---

### Decision 5: Attendance Threshold + Predictive Algorithm

**Decision: Threshold is configurable per institution. Student dashboard shows a predictive algorithm.**

#### Threshold Configuration

Admin sets the threshold in system settings:

```
Settings -> Attendance Policy
  Minimum Attendance Threshold: [75]%   (admin can change)
  Warning Level:                [80]%   (show warning before hitting threshold)
```

This setting is global for the institution. Subject-level override can be added later.

#### Student-side Predictive Algorithm

On the student dashboard, show a smart prediction card:

**"How many more classes do you need to attend?"**

```
Given:
  T  = threshold percentage converted to decimal (e.g., 75% -> T = 0.75)
  P  = total finalized classes attended (PRESENT + LATE) so far
  C  = total finalized classes conducted so far where student was included (P + ABSENT)

Current Attendance Percentage:
  Current % = (P / C) * 100

Case 1: Student is currently SAFE (Current % >= T * 100)
  How many consecutive classes can the student miss without falling below T%?
  Formula:
    X = floor((P - T * C) / T)

  Worked Examples (for T = 0.75):
    • P = 8, C = 10 (80%):
      X = floor((8 - 0.75 * 10) / 0.75) = floor(0.5 / 0.75) = 0
      (Result: Student is safe, but cannot miss even 1 class without dropping to 72.7%)
    • P = 15, C = 18 (83.3%):
      X = floor((15 - 0.75 * 18) / 0.75) = floor(1.5 / 0.75) = 2
      (Result: Student can miss up to 2 classes and remain at exactly 15/20 = 75%)

Case 2: Student is currently AT RISK (Current % < T * 100)
  How many consecutive classes must the student attend to recover to T%?
  Formula:
    Y = ceil((T * C - P) / (1 - T))

  Worked Example (for T = 0.75):
    • P = 6, C = 10 (60%):
      Y = ceil((0.75 * 10 - 6) / (1 - 0.75)) = ceil(1.5 / 0.25) = 6
      (Result: Student must attend the next 6 classes consecutively to reach 12/16 = 75%)

Dashboard Display:
  [Progress Ring: Current %]
  [Green Card]  If Safe: "You can miss up to X more classes and stay above 75%"
  [Red Card]    If At Risk: "You need to attend Y more consecutive classes to reach 75%"
  [Orange Card] If On the Edge (X = 0): "Warning: At threshold! Missing the next class will put you at risk."
```

The algorithm only requires `P`, `C`, and `T` — all already provided by the attendance stats API (`/api/v1/students/me/attendance/stats`).
This runs client-side in vanilla JS on the student dashboard. Zero extra database queries required.

---

### Decision 6: Google OAuth Credentials

**Decision: Developer manages the Google Cloud Console project.**

- A single Google Cloud project is created by the developer.
- OAuth client ID and secret are stored in the server `.env` file.
- For v1.0 (local LAN deployment): OAuth redirect URIs will be the local server IP/hostname.
- The Google OAuth consent screen will be in "Testing" mode for v1.0.
  Only manually added test users (teachers, students) can use Google login.
- For wider deployment: OAuth app must go through Google verification (v2.0 concern).
- ESP32 is not involved in Google OAuth at any point.

---

### Decision 7: Session Auto-Close Timer

**Decision: Teacher can optionally set an auto-close timer when creating a session.**

When creating an attendance session, teacher can optionally set:

```
[x] Auto-close session after: [30] minutes
                               (options: 10, 15, 20, 30, 45, 60, 90 min, or custom)
```

**What auto-close does:**
- When the timer expires, session state changes from `OPEN` to `CLOSED`.
- Students can no longer submit self-attendance or PIN/QR entries after CLOSED.
- Teacher's register is NOT finalized automatically — teacher still manually finalizes.
- Auto-close only affects Stream 3 (student submissions). Teacher can still edit the register.
- Teacher receives a notification: "Session auto-closed. Please review and finalize."

**Timer implementation:**
- `auto_close_at` column in `attendance_sessions` table (TIMESTAMP, nullable).
- A background job (Node.js `setInterval` or cron-like check every minute) scans for
  sessions where `state = 'OPEN'` AND `auto_close_at <= NOW()`.
- Backend closes those sessions automatically.
- No third-party scheduler needed — a simple interval in the Express app is sufficient for v1.0.

**Teacher can also manually close the session at any time** regardless of the timer.

---

*This document is the authoritative planning reference for the College Attendance System v1.0.*
*All design questions have been resolved. Implementation can begin.*
