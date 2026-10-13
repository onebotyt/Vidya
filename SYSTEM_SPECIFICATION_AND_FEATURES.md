# College Attendance Web System — Full System Architecture, Functions & Features Specification

> **Document Purpose**: Comprehensive technical and functional blueprint of the entire College Attendance Web System. Reconciled and frozen according to the realistic institutional business workflow: **Admin $\rightarrow$ HOD $\rightarrow$ Teacher $\rightarrow$ Student**.

---

## 1. Executive Summary & Technology Stack

The **College Attendance Web System** is an enterprise-grade academic management platform built with a natural, simplified institutional hierarchy:
- **System Admin**: Manages high-level college setup (Departments, Programs, Academic Years), appoints HODs, and views department-wide institutional reports.
- **Head of Department (HOD)**: Manages department faculty, creates subjects, assigns subject teachers (`Theory` / `Practical`), and designates Class Teachers.
- **Class Teacher**: Holds exclusive student roster ownership for their assigned cohort (provisioning, credentials, biometrics, self-registration adjudication).
- **Subject Teacher**: Conducts daily class sessions inside auto-generated continuous registers via a modern **Calendar-First UI**.

### Technology Stack
- **Backend**: Node.js (v20+) with Express.js REST API (`/api/v1/*`).
- **Database Architecture**: 
  - **Local Development / Edge Server**: Zero-configuration native SQLite (`college_attendance.sqlite`) with schema, master seeds, and dialect compatibility layer.
  - **Production Deployment**: Standard MySQL 8.x migrations maintained in `database/migrations/`. Switch database engine by changing `DB_CLIENT=mysql` in `backend/.env` without changing backend code.
- **Frontend**: Clean, modern Vanilla CSS and Vanilla JavaScript (zero bulky frontend framework dependencies). Includes responsive design tokens, glassmorphism cards, interactive modals, and slide-out navigation drawers.
- **Authentication**: JWT Access Token (15m expiry, lean payload without dynamic scopes) + HTTP-only Refresh Token (7d expiry, session rotation, device tracking) + Google Cloud OAuth 2.0 (same-tab authorization with strict email parity enforcement).
- **Hardware Telemetry**: Integration for ESP32 biometric fingerprint terminals with SHA-256 HMAC authentication, offline buffer deduplication, and telemetry logging.

---

## 2. Core Architectural Principles & Business Rules

### Rule 1: The 3 Jobs of System Admin
The System Administrator performs only high-level institutional governance:
1. **College Setup**:
   - Master Departments & Branches / Degree Programs.
   - **Configurable Academic Year Pattern** (Configured **once** in system settings, e.g. Start Month: July, Start Day: 1). System auto-prepares future years (e.g. `2027–28` from `2026–27`). Academic Year sits above the academic structure as a contextual umbrella and historical boundary.
2. **HOD Management**: Create HOD accounts (Gmail login ID) and assign HOD $\rightarrow$ Department.
3. **Institutional Reporting**: Department-wide official attendance analytics with subject and Theory/Practical drilldowns.
- **Admin DOES NOT**: Add students, create regular faculty accounts, create subjects, assign teachers, or manage daily attendance.

### Rule 2: HOD as Department Administrator & Multi-Assignment Reality
> **Hard Architectural Invariant:**  
> **“A teacher may simultaneously hold multiple academic assignments, including HOD, Class Teacher, and Subject Teacher. Assignments are independently scoped and must not require separate user accounts or logins.”**

The system role is strictly `TEACHER`, while responsibilities (`HOD`, `CLASS_TEACHER`, `SUBJECT_TEACHER`) are dynamically assigned and can be held concurrently by the same person:
- **One Faculty Login**: Portal dynamically unlocks "My Teaching", "Department Management" (if HOD), and "My Students" (if Class Teacher).
- **Creates Teachers**: Small 3-field form: Full Name, Institutional Gmail, Phone. (Employee ID is optional if the college issues one; the system does NOT generate fake synthetic IDs).
- **Creates Subjects**: Subject Code, Subject Name, Branch, Year, Semester. *(HOD is not asked complex Theory/Practical questions during subject creation)*.
- **Assigns Subject Teachers**: Select Teacher + Subject + Teaching Type (`Theory` or `Practical`).
- **Assigns Class Teachers**: Select Teacher + Cohort (Branch, Year, Semester).
- **Oversees Department Attendance**: Monitors teacher conduct, student rosters, and low-attendance defaulters.

### Rule 3: Theory / Practical Belongs to Teacher Assignment
- Theory and Practical components are established naturally when the HOD assigns a teacher:
  - HOD assigns Teacher A $\rightarrow$ DBMS $\rightarrow$ `Theory` $\longrightarrow$ System auto-creates **DBMS — THEORY Official Register**.
  - HOD assigns Teacher B $\rightarrow$ DBMS $\rightarrow$ `Practical` $\longrightarrow$ System auto-creates **DBMS — PRACTICAL Official Register**.
  - If one teacher teaches both, HOD makes two assignments (one for Theory, one for Practical) $\longrightarrow$ System creates **TWO separate, independent official registers**.
- Theory and Practical are never merged into a single register.

### Rule 4: Zero-Click Register Creation & Continuous Lifetime
- An Official Register (`attendance_registers`, `is_official = 1`) is generated automatically upon teacher assignment.
- The register is a **continuous, long-running semester container** spanning the entire academic term. It is NOT recreated daily.
- Daily classes are date-based attendance sessions (`attendance_sessions`) conducted **inside** that register.

### Rule 5: Calendar-First Digital Register UI
- The primary Official Register UI is a modern **Month-View Calendar** (`register-view.html`).
- Header displays: Subject, Component (Theory/Practical), Department, Branch, Year, Semester, Academic Year, Teacher, Cohort.
- Cells display compact summaries: Session time, Present count, Absent count, Late count, Attendance %, and session state badge (`DRAFT`, `OPEN`, `CLOSED`, `FINALIZED`). Today is highlighted with a `● LIVE` badge if an open session exists today.
- Clicking a date opens that day's **Daily Attendance Session** (Roll | Student | Status toggle: `PRESENT` / `ABSENT` / `LATE`), which serves as the primary attendance editing interface.
- Clicking a student name reveals their cumulative attendance history across dates for that register.
- Summary cards above the calendar display: Total Sessions Conducted, Average Attendance %, Students Below 75%, and Current Month Sessions.

### Rule 6: Exclusive Class Teacher Student Roster Ownership
- **ADMIN DOES NOT MANAGE OR ADD STUDENTS.**
- Student roster management belongs **EXCLUSIVELY to the CLASS TEACHER** for their assigned cohort:
  - Single student provisioning (with roll number and enrollment ID).
  - Bulk CSV roster upload.
  - Generating and exporting temporary student credentials.
  - Managing optical fingerprint sensor enrollment on hardware kiosks for cohort students.
  - Reviewing and approving/rejecting fallback student self-registrations.
  - Toggling cohort self-registration availability ON/OFF.
- Backend strictly validates that the teacher holds `CLASS_TEACHER` assignment for that specific cohort.

### Rule 7: Teacher Gmail Login & Strict Google Parity
- Teacher login ID is strictly their institutional Gmail (`users.username = teacher@gmail.com`).
- Temporary password generated on account creation is stored only as a `bcrypt` hash.
- First-time login requires: (1) Set permanent password, (2) Connect Google account.
- **Strict Google Email Matching**: Authenticated Google account must match the registered Gmail address exactly (`teacher@gmail.com` == `teacher@gmail.com`). Mismatches are rejected.
- Updating Gmail immediately revokes Google linkage, requiring re-validation.

### Rule 8: Official vs. Personal Registers
- **OFFICIAL Registers** (`is_official = TRUE`): Created automatically via HOD teacher assignment. Contributes to official attendance % and appears in Admin and HOD reports.
- **PERSONAL Registers** (`is_official = FALSE`): Created optionally by teachers for clubs (e.g. Robotics), tutorials, seminars. Excluded from Admin reports, defaulter reports, and official calculations at the database query level (`WHERE is_official = 1`).

### Rule 9: Three Independent Attendance Streams
1. **Stream 1: Physical Biometric Evidence (`esp32_presence`)**: Raw scans from autonomous ESP32 terminals. Supporting evidence only.
2. **Stream 2: Official Attendance Record (`register_attendance`)**: Sole institutional truth. Teacher can sync ESP32 scans, edit, and finalize.
3. **Stream 3: Student Self-Attendance Claims (`student_self_attendance`)**: Student soft presence claims (Button, 4–6 digit hashed PIN, dynamic HMAC QR). Always `PENDING` until teacher explicitly adjudicates.

### Rule 10: Session Lifecycle & Invariants
- Lifecycle: `DRAFT` $\rightarrow$ `OPEN` $\rightarrow$ `CLOSED` $\rightarrow$ `FINALIZED`.
- **Roster Freezing**: Creating a session captures an immutable snapshot into `attendance_session_students`.
- **Auto-Close Boundary**: `auto_close_at` only transitions `OPEN` $\rightarrow$ `CLOSED`. Auto-close NEVER finalizes.
- **Universal Marking Invariant**: Finalization requires 100% of included students to have an explicit status (`PRESENT`, `ABSENT`, or `LATE`), else `HTTP 422 Unprocessable Entity`.
- **Official Attendance Formula**:
  $$\text{Official Attendance } \% = \frac{\text{count}(\text{PRESENT}) + \text{count}(\text{LATE})}{\text{Total Finalized Sessions where } \text{included} = 1} \times 100$$
- Threshold 75%: Calculates safe absences remaining and recovery classes required.

---

## 3. Reconciled Database Schema (Entity-Driven, Non-Redundant Model)

> **No Arbitrary Target Count**: The schema contains only tables derived strictly from distinct institutional entities. All duplicate concepts (`cohort_enrollments`, `attendance_records`, `biometric_touch_stream`, `device_heartbeats`) have been eliminated.

### Non-Redundant Table Inventory
1. **`users`**: Central credentials (`id`, `username` [Gmail / Enrollment No], `email`, `password_hash`, `temp_password_hash`, `must_change_password`, `google_sub`, `status`, `rejection_reason`).
2. **`user_roles`**: Role mapping (`user_id`, `role`: `SYSTEM_ADMIN`, `TEACHER`, `STUDENT`).
3. **`user_sessions`**: Refresh token rotation and session tracking (`user_id`, `refresh_token_hash`, `user_agent`, `ip_address`, `expires_at`, `is_revoked`).
4. **`system_settings`**: Global configuration parameters (`setting_key`, `setting_value`, `description`, `updated_by`).
5. **`departments`**: Master departments (`name`, `code`, `hod_user_id`, `is_active`).
6. **`branches`**: Master degree programs (`department_id`, `name`, `code`, `is_active`).
7. **`academic_years`**: Master calendar periods (`label`, `start_date`, `end_date`, `is_current`).
8. **`subjects`**: Course catalog created by HOD (`department_id`, `branch_id`, `year`, `semester`, `name`, `code`, `is_active`).
9. **`teachers`**: Faculty profiles created by HOD (`user_id`, `department_id`, `employee_id`, `full_name`, `phone`).
10. **`teacher_assignments`**: Subject teacher (`THEORY` / `PRACTICAL`) and Class Teacher mappings (`teacher_id`, `assignment_type`, `subject_id`, `session_type_scope`, `department_id`, `branch_id`, `year`, `semester`, `academic_year_id`, `assigned_by`, `is_active`).
11. **`students`**: Permanent student records (`user_id`, `official_enrollment_no`, `full_name`, `entry_mode`).
12. **`enrollments`**: Cohort enrollment bindings (`student_id`, `department_id`, `branch_id`, `year`, `semester`, `academic_year_id`, `class_roll_no`, `status`).
13. **`cohort_registration_settings`**: Student fallback self-registration window toggles (`department_id`, `branch_id`, `year`, `semester`, `academic_year_id`, `registration_open`, `changed_by`).
14. **`attendance_registers`**: Long-running continuous registers (`teacher_id`, `name`, `subject_id`, `assignment_id`, `department_id`, `branch_id`, `year`, `semester`, `academic_year_id`, `component_type`: `THEORY`/`PRACTICAL`, `register_type`: `OFFICIAL`/`PERSONAL`, `is_official`, `is_active`).
15. **`attendance_sessions`**: Conducted daily classroom sessions (`register_id`, `teacher_id`, `subject_id`, `department_id`, `branch_id`, `year`, `semester`, `academic_year_id`, `session_type`, `label`, `session_date`, `start_time`, `end_time`, `state`, `auto_close_at`).
16. **`attendance_session_students`**: Historical frozen roster snapshot for that session (`session_id`, `student_id`, `enrollment_id`, `class_roll_no`, `included`).
17. **`attendance_session_pins`**: Rotating dynamic 4–6 digit PINs for soft verification (`session_id`, `pin_code`, `expires_at`).
18. **`attendance_session_qr`**: Dynamic rotating signed QR tokens (`session_id`, `token_hash`, `expires_at`).
19. **`esp32_presence`**: Stream 1 — Raw biometric physical presence scans (`device_id`, `student_id`, `event_id`, `scan_time`, `payload_json`).
20. **`register_attendance`**: Stream 2 — Sole official institutional attendance truth (`session_id`, `student_id`, `attendance_status`, `source`, `teacher_notes`, `marked_by`, `marked_at`).
21. **`register_attendance_corrections`**: Admin post-finalization audit log (`register_record_id`, `previous_status`, `new_status`, `corrected_by`, `reason`).
22. **`student_self_attendance`**: Stream 3 — Student presence claims (`session_id`, `student_id`, `verification_method`, `request_status`, `submitted_at`, `reviewed_at`, `reviewed_by`).
23. **`devices`**: ESP32 biometric terminal catalog (`device_uid`, `name`, `department_id`, `branch_id`, `year`, `semester`, `academic_year_id`, `secret_hash`, `certificate_fingerprint`, `is_active`, `last_heartbeat_at`).
24. **`fingerprint_slots`**: Terminal optical sensor slot mappings (`device_id`, `slot_id`, `student_id`, `enrolled_at`, `is_active`).
25. **`device_events`**: Hardware telemetry and health events (`device_id`, `event_type`, `payload_json`).
26. **`notifications`**: In-app notifications (`user_id`, `title`, `message`, `is_read`, `link_url`).
27. **`audit_logs`**: System security & administrative audit log (`user_id`, `action`, `entity_type`, `entity_id`, `details_json`, `ip_address`).

---

## 4. REST API Endpoint Reference (`/api/v1/*`)

### Authentication (`/auth/*`)
- `POST /auth/faculty/login`: Faculty/Admin/HOD login via Gmail and password.
- `POST /auth/student/login`: Student login via Enrollment Number and password.
- `POST /auth/change-password`: Set permanent password during first login or update password from profile.
- `GET /auth/google/url`: Generate Google OAuth authorization URL (`prompt=select_account`, same tab).
- `GET /auth/google/callback`: OAuth callback. Enforces strict registered Gmail matching, issues JWT.
- `POST /auth/google/link`: Link matching Google account to authenticated faculty profile.
- `POST /auth/refresh`: Rotate refresh token and issue fresh JWT.
- `POST /auth/logout`: Revoke active session.

### Admin Console (`/admin/*`) — Drastically Simplified
- `GET /admin/stats`: College KPIs.
- `GET|POST /admin/departments`: Department catalog CRUD.
- `PUT /admin/departments/:id`: Edit department.
- `GET|POST /admin/branches`: Degree branches CRUD.
- `PUT /admin/branches/:id`: Edit branch.
- `GET|POST /admin/academic-years`: Academic years CRUD.
- `PUT /admin/academic-years/:id`: Update academic year and toggle `is_current`.
- `GET|POST /admin/hods`: HOD management (create HOD, list HODs, assign HOD $\rightarrow$ Department).
- `GET|POST /admin/devices`: ESP32 biometric terminal registry.
- `GET /admin/reports/department`: **Department-Wise Official Attendance Report** (aggregates official registers with subject and component filters).
- `POST /admin/attendance/records/:id/correct`: Audited correction for finalized records.
- `GET|PUT /admin/settings`: View and update system threshold (75%).
- `GET /admin/audit`: Immutable security audit log.

### HOD Console (`/faculty/hod/*`) — Department Administration
- `GET /faculty/hod/dashboard`: Departmental metrics (teachers count, subjects count, student roster total, department attendance %).
- `GET|POST /faculty/hod/teachers`: List department teachers; create new teacher account (Name, Gmail, Phone).
- `GET|POST /faculty/hod/subjects`: List department subjects; add subject (Code, Name, Branch, Year, Semester).
- `POST /faculty/hod/assignments/subject`: Assign Subject Teacher (`Theory` / `Practical`). **Automatically creates official attendance register.**
- `POST /faculty/hod/assignments/class-teacher`: Assign Class Teacher to Cohort (grants exclusive student roster authority).
- `GET /faculty/hod/reports`: Department attendance reports and defaulter lists.

### Faculty Portal (`/faculty/*`)
- `GET /faculty/dashboard`: Metrics (assigned registers, today's sessions, pending student claims).
- `GET /faculty/registers`: List instructor's official curriculum registers and personal registers.
- `POST /faculty/registers/personal`: Create private personal register (clubs, seminars, extra coaching).
- `GET /faculty/registers/:id/calendar`: **Calendar-First Month View Data** (dates with session summaries, counts, and states).
- `GET /faculty/registers/:id/sessions`: Chronological session list inside register.
- `GET /faculty/registers/:id/student/:studentId`: Student's attendance history across dates for that register.
- `GET /faculty/cohorts`: Cohorts assigned under teacher's `CLASS_TEACHER` assignment.
- `GET /faculty/cohorts/students`: Class Teacher cohort roster view.
- `POST /faculty/cohorts/students/provision`: Single student provisioning (Class Teacher only).
- `POST /faculty/cohorts/students/bulk-csv`: Bulk CSV roster upload (Class Teacher only).
- `POST /faculty/cohorts/students/export-credentials`: Export student temporary password slips (Excel/PDF).
- `GET /faculty/cohorts/biometrics`: Biometric enrollment status of cohort students (Class Teacher only).
- `POST /faculty/devices/:id/enroll-mode`: Put ESP32 into 2-touch optical enrollment mode for cohort student.
- `GET /faculty/registrations`: Review pending student self-registrations for assigned cohort.
- `POST /faculty/registrations/:id/adjudicate`: Approve or reject student registration.
- `POST /faculty/cohorts/toggle-registration`: Open/close fallback self-registration window for cohort.
- `GET|PUT /faculty/profile`: View/update profile, password, contact, and Google account link status.

### Attendance Session Lifecycle (`/attendance/*`)
- `POST /attendance/sessions`: Create session inside a register (`DRAFT` state; snapshots cohort roster).
- `GET /attendance/sessions/:id`: Daily session details and student list for that date.
- `POST /attendance/sessions/:id/open`: Open session for attendance intake (`OPEN` state).
- `POST /attendance/sessions/:id/pin`: Generate dynamic 4–6 digit PIN.
- `POST /attendance/sessions/:id/qr`: Generate rotating HMAC QR token.
- `GET /attendance/sessions/:id/claims`: View student self-attendance claims awaiting adjudication.
- `POST /attendance/claims/:claimId/adjudicate`: Accept or reject student claim.
- `POST /attendance/sessions/:id/sync-esp32`: Pre-fill session attendance using raw scans from `esp32_presence`.
- `POST /attendance/sessions/:id/records/batch`: Batch manual mark updates (`PRESENT`, `ABSENT`, `LATE`).
- `POST /attendance/sessions/:id/close`: Stop accepting student claims (`CLOSED` state).
- `POST /attendance/sessions/:id/finalize`: Finalize session (enforces Universal Marking Invariant; locks records).

### Student Portal (`/students/*`)
- `POST /students/self-register`: Fallback registration when cohort window is open.
- `GET /students/me`: View student identity, cohort, and biometric status.
- `PUT /students/me`: Update contact details and password.
- `GET /students/me/attendance/stats`: Overall %, safe absences remaining, recovery classes needed.
- `GET /students/me/attendance/subjects`: Per-subject attendance breakdown.
- `GET /students/me/attendance/history`: Chronological attendance log.
- `POST /students/attendance/claim`: Submit self-attendance claim (Button, PIN, or QR).

---

## 5. Frontend Navigation & Pages Inventory

### 5.1 System Admin UI
```text
ADMIN
────────────────────────────
🏫 College Setup
   • Departments (CRUD)
   • Branches / Programs (CRUD)
   • Academic Years (Automatic temporal anchor)

👨‍🏫 HOD Management
   • HODs (Create HOD & Assign to Department)

📊 Attendance Reports
   • Department Reports (Filter by Department, Subject, Theory/Practical)

⚙ Settings
```

### 5.2 Faculty Portal (Unified Dual-Role Layout: Teaching + Department Management)
For faculty members who are also assigned as HOD or Class Teacher, the portal seamlessly groups their responsibilities without fragmenting logins:

```text
FACULTY PORTAL (e.g. Girdhar Dhami — HOD & Teacher)
────────────────────────────────────────────────────
🏠 Dashboard (KPIs, Schedule, Quick Links)

📖 My Teaching
   • My Registers (Calendar-First UI: DBMS Theory, DBMS Practical)
   • Attendance Live Console (Class Session Marking)
   • My Class Reports (Register Defaulters & Stats)

🏢 Department Management (Active when user is HOD)
   • My Teachers (List & Add Teacher: Name, Gmail, Phone)
   • My Subjects (List & Add Subject: Code, Name, Branch, Year, Sem)
   • Subject Teacher Assignments (Theory / Practical)
   • Class Teacher Assignments (Cohort Roster Owners)
   • Department Attendance Reports (Defaulter lists, Subject breakdown)

👥 My Students (Active when user is assigned as Class Teacher for a cohort)
   • Cohort Student Roster
   • Add Student / Bulk CSV Import
   • Temporary Credential Slips
   • Biometric Fingerprint Enrollment
   • Registration Requests Approval

🔔 Notifications
👤 Profile & Google Account Link
```

### 5.4 Student UI
```text
STUDENT
────────────────────────────
🏠 Dashboard (Overall Attendance %, Safe Absences, Recovery Predictor)

📅 Live Attendance (Submit Button / PIN / QR Claim for open sessions)

📚 My Subjects (Subject-wise attendance breakdown)

📜 Attendance History (Date-by-date session log)

👤 Profile (Cohort details, Fingerprint status, Password)
```
