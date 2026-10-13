# College Attendance System — Attendance Web System SRS

> **Document Type:** Software Requirements Specification (SRS)  
> **Document Identifier:** `docs/01_ATTENDANCE_WEB_SRS.md`  
> **Version:** 1.0.0 (Authoritative Implementation Baseline)  
> **Implementation Status:** CURRENT IMPLEMENTATION FOCUS — Implementation Ready  
> **Target Deployment:** Local-First Windows Edge Server (College Main PC / Server)  
> **Future UIAP Integration Notice:** UIAP integration is FUTURE SCOPE and is NOT part of the current standalone implementation.

---

## 1. Executive Summary & Project Purpose

### 1.1 Purpose & Scope
The **College Attendance Web System** is an institutional-grade, web-based platform engineered to govern the complete lifecycle of student attendance within higher education institutions. The system manages:
- Centralized student provisioning, identity synchronization, and enrollment verification.
- Academic cohort management across departments, branches, academic years, semesters, and subjects.
- Multi-stream attendance capture (physical biometric presence, teacher digital register, and student self-attendance).
- Dynamic role-based access control (RBAC) and scoped academic authorization for faculty.
- Statistical analytics, attendance threshold prediction, institutional reporting, and immutable audit logging.

### 1.2 Deployment Model & Operating Constraints
- **Local-First & Offline-Capable:** Operates entirely within the college's local area network (LAN) on a Windows edge server or dedicated administrative PC.
- **Zero Internet Dependency:** Core institutional operations—including classroom attendance sessions, teacher register marking, student self-attendance requests, biometric hardware capture, and report generation—function 100% reliably without an active internet connection.
- **Data Sovereignty:** All institutional records, faculty profiles, student credentials, and attendance transactions are stored locally within an on-premise MySQL 8.x database.
- **Client Access:** Faculty and students access the platform via modern desktop, tablet, and mobile web browsers over local Wi-Fi or LAN.

### 1.3 Implementation Scope Boundaries (v1.0)
- **Included in v1.0:**
  - Complete responsive web application (HTML5, Vanilla CSS design tokens, Vanilla JavaScript).
  - Node.js 20+ and Express.js REST API with comprehensive input validation, rate limiting, and security headers.
  - On-premise MySQL 8.x database schema with strict referential integrity, foreign key constraints, and transactional synchronization.
  - Three distinct user roles: `SYSTEM_ADMIN`, `TEACHER`, and `STUDENT`.
  - Dynamic faculty scoping (`SUBJECT_TEACHER`, `CLASS_TEACHER`, `HOD`) via assignment mapping.
  - Primary teacher-driven student provisioning with temporary password distribution (Excel & printable PDF slips).
  - Fallback student self-registration workflow governed by assigned Class Teachers with cohort registration toggles.
  - Three strictly independent attendance streams: ESP32 presence (`esp32_presence`), Teacher Register (`register_attendance`), and Student Self-Attendance (`student_self_attendance`).
  - Attendance session lifecycle (`DRAFT` $\rightarrow$ `OPEN` $\rightarrow$ `CLOSED` $\rightarrow$ `FINALIZED`) with immutable roster snapshots.
  - No-device soft verification modes (Pure Manual Register, Time-limited Session PIN, Dynamic QR Code).
  - ESP32 hardware webhook integration, slot mapping, offline buffer deduplication (`UNIQUE(event_id)`).
  - Statistical reports (Teacher Register, ESP32 Presence, Self-Attendance, Stream Comparison, Daily Summary, Low Attendance).
  - Comprehensive audit trail for authentication, lifecycle changes, and administrative overrides.

- **Explicitly Excluded from Current Scope (Deferred to Future Phases):**
  - React Native Mobile Applications (Student & Teacher mobile apps deferred to Phase 3).
  - Academic Modules: Assignments, Test Scores/Marks, Study Material, Timetable, Notices, Academic Calendar, Exam Schedule, Student Performance Analytics (deferred to Phases 4–7).
  - USB scanner drivers, facial recognition, automated payment gateways, multi-tenant cloud sync, and public app store deployments.
  - UIAP Core modular packaging and ZIP distribution (planned for Phase 8).

---

## 2. Technology Stack & Technical Architecture

### 2.1 Backend Architecture
The backend is structured as a modular Express.js application designed with strict separation of concerns across configuration, middleware, routing, controllers, and services.

```
attendance-system/backend/
├── server.js                        # Express server entry point & TLS configuration
├── .env / .env.example              # Environment variables
├── package.json                     # Dependency declarations
└── src/
    ├── config/
    │   └── db.js                    # mysql2 connection pool configuration
    ├── middleware/
    │   ├── auth.js                  # JWT access token validation & user extraction
    │   ├── requireRole.js           # System role verification (SYSTEM_ADMIN, TEACHER, STUDENT)
    │   ├── requireScope.js          # Dynamic teacher assignment validation (SUBJECT_TEACHER, etc.)
    │   ├── rateLimiter.js           # IP and route-based rate limiters
    │   └── validate.js              # express-validator request validation handler
    ├── routes/
    │   ├── auth.js                  # Login, refresh, logout, password activation
    │   ├── students.js              # Student profile, self-registration, provisioning
    │   ├── faculty.js               # Faculty cohorts, subjects, registration approvals
    │   ├── attendance.js            # Session lifecycle, register marking, sync, PIN/QR
    │   ├── devices.js               # ESP32 webhook, heartbeat, slot mapping
    │   ├── reports.js               # Attendance reports and CSV/Excel data streams
    │   ├── admin.js                 # Master data CRUD, teacher assignments, system settings
    │   └── audit.js                 # Immutable audit log queries
    ├── services/
    │   ├── authService.js           # Credential hashing, token generation, session management
    │   ├── attendanceService.js     # Session state machine, register calculations, roster freezing
    │   ├── deviceService.js         # Hardware event deduplication, slot correlation
    │   └── reportService.js         # Aggregations, comparison matrix, prediction algorithms
    └── utils/
        ├── tokenHelper.js           # JWT signing & verification utilities
        ├── pinQrHelper.js           # Secure PIN hashing and HMAC QR token generator
        └── logger.js                # Winston / Pino structured logger
```

| Component | Technology | Specification / Standard |
|---|---|---|
| **Runtime** | Node.js | v20.x LTS or higher |
| **HTTP Framework** | Express.js | v4.19+ |
| **Language** | JavaScript | Modern ECMAScript (ES2022+) |
| **Database Engine** | MySQL | 8.0+ / 8.4 LTS (InnoDB, `utf8mb4`, `utf8mb4_unicode_ci`) |
| **Database Driver** | `mysql2/promise` | Connection pool with parameterized queries exclusively |
| **Authentication** | JSON Web Tokens | Short-lived Access Token (15–60m) + Refresh Token (7–30d) |
| **Credential Security**| `bcrypt` | Salt rounds $\ge 10$ for passwords and temporary PINs |
| **Federated Identity**| `google-auth-library` | Server-side cryptographic verification of Google ID tokens |
| **Transport Security**| `https` / Self-Signed | Server-generated self-signed TLS cert pinned to ESP32 firmware |
| **Security Headers** | `helmet` | Strict CSP, HSTS, frameguard, and XSS filtering |
| **Rate Limiting** | `express-rate-limit` | Rate limits on auth routes, self-attendance, and device webhooks |
| **Request Validation**| `express-validator` | Strict server-side schema and sanitization rules |
| **Logging** | `winston` or `pino` | Structured JSON log records with log rotation |
| **File Handling** | `multer` | Strict file-size, MIME-type, and extension validation for CSV imports |

### 2.2 Frontend Architecture
To guarantee longevity, zero-build simplicity, instant offline loading, and ease of maintenance by institutional staff, the web frontend avoids heavy JavaScript component frameworks (such as React, Vue, or Angular) and utilizes clean, semantic web standards.

```
attendance-system/frontend/
├── index.html                       # Public landing & gateway page
├── css/
│   ├── variables.css                # Design system tokens (HSL color system, radius, spacing)
│   ├── reset.css                    # CSS box-sizing and normalize resets
│   ├── layout.css                   # Grid, flexbox, sidebar, and container layout rules
│   ├── components.css               # Buttons, cards, modals, tables, badges, toasts
│   └── pages/                       # Page-specific stylesheets
├── js/
│   ├── api.js                       # Shared fetch wrapper with automatic refresh token handling
│   ├── auth.js                      # Client authentication state, RBAC redirection helpers
│   ├── utils.js                     # Date formatters, math utilities, DOM helpers
│   └── pages/                       # Dedicated page-specific script files
├── login/
│   ├── faculty.html                 # Faculty & Administrator unified portal login
│   └── student.html                 # Student portal login & activation gateway
├── register/
│   └── student.html                 # Fallback student self-registration form
├── student/
│   ├── dashboard.html               # Attendance %, circular progress, prediction widget, alerts
│   ├── attendance/
│   │   ├── active.html              # Active session detection, Button/PIN/QR submission
│   │   ├── history.html             # Date & subject filtered attendance history
│   │   └── subjects.html            # Per-subject attendance progress & threshold analysis
│   ├── notifications.html           # In-app notifications & alert history
│   └── profile.html                 # Identity details, password change, Google link state
├── faculty/
│   ├── dashboard.html               # Today's sessions, quick metrics, pending approvals alert
│   ├── cohorts.html                 # Assigned cohorts view (Dept/Branch/Year/Sem)
│   ├── subjects.html                # Assigned subjects view
│   ├── attendance/
│   │   ├── sessions.html            # Session manager: Create session (Theory/Lab), status list
│   │   └── live.html                # Live attendance: Manual register, ESP32 sync, Self-requests
│   ├── students.html                # Enrolled students roster sorted by class_roll_no
│   ├── registrations.html           # Pending self-registration review (Class Teacher only)
│   ├── reports.html                 # Register, ESP32, and Comparison report generator
│   └── profile.html                 # Faculty profile & account settings
└── admin/
    ├── dashboard.html               # College-wide analytics, device status, active users
    ├── faculty.html                 # Faculty user accounts & profile management
    ├── departments.html             # Department master data CRUD
    ├── branches.html                # Branch master data CRUD
    ├── academic-years.html          # Academic years master data CRUD
    ├── subjects.html                # Subject master catalog CRUD (Theory/Practical config)
    ├── assignments.html             # Teacher assignment mapping (Subject, Class Teacher, HOD)
    ├── devices.html                 # ESP32 device registry, secret keys, certificate fingerprint
    ├── reports.html                 # Department-wide official attendance reports & CSV export
    ├── audit.html                   # Immutable system audit trail log viewer
    └── settings.html                # Attendance threshold policies, system configurations
```

---

## 3. User Roles, Permissions & Dynamic Scoping

### 3.1 Clean RBAC Principles
1. **Separation of System Role and Academic Scope:**
   - A **System Role** (`user_roles`) governs *what functions* a user can execute within the application (e.g., access faculty portal, mark attendance, configure master data).
   - An **Academic Assignment** (`teacher_assignments`) governs *which academic cohorts and subjects* the faculty member has jurisdiction over.
2. **Database-Driven Authority:** Permissions and assignments are stored strictly in the database and verified on the backend for every incoming request.
3. **No Dynamic Scopes in JWTs:** Academic cohort identifiers, subject assignments, and department mappings are **never** embedded in JWT payloads.
   - *Rationale:* If an administrator updates or revokes a teacher's class assignment, a JWT containing embedded scopes would remain valid until token expiration.
   - *Resolution:* Backend middleware resolves authorization dynamically from `teacher_assignments` on every request:
     $$\text{Request} \longrightarrow \text{System Role (JWT)} \longrightarrow \text{teacher\_assignments (DB Query)} \longrightarrow \text{Resource Authorized}$$

### 3.2 System Roles Catalog
| System Role | Scope Level | Responsibilities & Permissions |
|---|---|---|
| `SYSTEM_ADMIN` | Global / Institutional | Performs high-level college setup (departments, degree branches/programs, academic years). Creates HOD accounts and assigns HODs to departments. Views **Department-Wise Official Attendance Reports** and security audit logs. Adjusts institutional attendance threshold (75%). Performs audited corrections on finalized registers. **NON-NEGOTIABLE: DOES NOT CREATE SUBJECTS, DOES NOT CREATE NORMAL TEACHERS, DOES NOT ASSIGN TEACHERS, DOES NOT ADD STUDENTS.** |
| `TEACHER` | Dynamic Scoped | Takes attendance for assigned subjects in official long-running digital registers via Calendar-First UI. Operates live session console, triggers ESP32 sync, issues PINs/QR, and finalizes registers. Can hold functional assignments: `HOD`, `CLASS_TEACHER`, and `SUBJECT_TEACHER`. |
| `STUDENT` | Self / Identity Only | Marks self-attendance for currently open cohort sessions (via Button, PIN, or QR). Views personal attendance percentages, subject-wise breakdowns, and threshold predictive analytics. Updates personal profile photo and password. |

### 3.3 Multi-Assignment Architectural Model & Dual-Role Reality

> [!IMPORTANT]
> **Hard Architectural Requirement:**  
> **“A teacher may simultaneously hold multiple academic assignments, including HOD, Class Teacher, and Subject Teacher. Assignments are independently scoped and must not require separate user accounts or logins.”**

#### 3.3.1 System Role vs. Academic Assignments
The system maintains a single login role (`TEACHER`) in `user_roles`. Specific academic responsibilities are **assignments** stored as independent records in `teacher_assignments`:

```text
SYSTEM ROLE
    TEACHER
       │
       ├── HOD assignment (Department scope)
       ├── CLASS_TEACHER assignment (Cohort scope)
       └── SUBJECT_TEACHER assignment (Subject + Component scope)
```

These are **not mutually exclusive roles**. The same `teacher_id` can hold multiple concurrent assignment records:

```text
Teacher Account (e.g. Rahul)
      │
      ├── HOD
      │     └── Information Technology Department
      │
      ├── Class Teacher
      │     └── Diploma IT, Year 2, Semester 3
      │
      └── Subject Teacher
            ├── DBMS → Theory
            ├── DBMS → Practical
            └── Java → Theory
```

#### Example Multi-Assignment Roster
| Teacher | Assignment Type | Academic Scope | Resulting Privileges |
|---|---|---|---|
| Rahul | `HOD` | IT Department | Department administration, create teachers, create subjects, assign staff |
| Rahul | `CLASS_TEACHER` | Diploma IT, Y2, S3 | Cohort student roster management, provisioning, credentials, biometrics |
| Rahul | `SUBJECT_TEACHER` | DBMS, `THEORY` | Continuous official theory register (`DBMS — THEORY`) |
| Rahul | `SUBJECT_TEACHER` | DBMS, `PRACTICAL` | Continuous official practical register (`DBMS — PRACTICAL`) |

#### 3.3.2 Unified Faculty Portal Behavior
The faculty member uses a **single faculty login**. Upon authentication, the dashboard and navigation dynamically render sections based on their active assignments:

```text
Faculty Portal
│
├── My Registers       (Always active for Subject Teachers)
├── Attendance         (Always active for Subject Teachers)
├── My Students        (Active if user holds CLASS_TEACHER assignment)
├── Subjects           (Active if user holds SUBJECT_TEACHER assignment)
├── Teachers           (Active if user holds HOD assignment)
├── Department Setup   (Active if user holds HOD assignment)
├── Department Reports (Active if user holds HOD assignment)
├── Notifications
└── Profile
```
If a teacher is simultaneously **HOD + Class Teacher + Subject Teacher**, all applicable sections appear seamlessly without logging out or switching contexts.

#### 3.3.3 Student Scoping Tiers: HOD vs. Class Teacher vs. Subject Teacher
The platform strictly differentiates between **department oversight**, **cohort roster administration**, and **classroom attendance**:

```text
HOD (Department-Wide Visibility)
 │
 └── Own Department (Read-Only)
       ├── View all department students
       ├── View cohort-wise students (Branch, Year, Semester)
       ├── View student enrollment details & class roll numbers
       ├── View student attendance percentages & defaulter status
       └── View department-wide official reports
```

| Scope Level | Academic Authority | Permissions & Invariants |
|:---|:---|:---|
| **HOD** | **Department-Wide** (Own Department) | **Read-Only Oversight**: View all students enrolled under their department; filter cohort-wise (Branch, Year, Sem); view attendance stats and defaulter lists.<br>**Strict Boundary**: CANNOT view other departments. CANNOT create/provision students (Class Teacher responsibility). CANNOT edit student identity. CANNOT alter official attendance records. |
| **Class Teacher** | **Specific Cohort** (Assigned Cohort) | **Full Roster Management**: Exclusively provisions students (single & bulk CSV), generates temporary credential slips, enrolls optical biometric fingerprints on terminals, and approves/rejects fallback self-registrations. |
| **Subject Teacher** | **Assigned Register** (Subject + Component) | **Session Attendance Marking**: Takes daily attendance (P/A/L), reviews ESP32 evidence, adjudicates PIN/QR claims, and finalizes class sessions. |

> **Key Rule**: A single faculty member holding all three assignments concurrently gets department-wide student visibility (as HOD), full roster management for their designated cohort (as Class Teacher), and classroom attendance marking for their assigned subject registers (as Subject Teacher) under their single login.

#### 3.3.4 Operational Delegation:
1. **HOD Creates Teachers**:
   - Small form: Full Name, Institutional Gmail, Phone.
   - *(Optional)* Employee ID: Supported if the college uses one; omitted otherwise (no fake synthetic IDs generated).
   - System auto-generates temporary password and Gmail login ID.
   - Bound to HOD's department automatically.
2. **HOD Creates Subjects**:
   - Code, Name, Branch, Year, Semester. (HOD is not asked Theory/Practical questions during subject creation).
3. **HOD Assigns Subject Teachers (Theory / Practical)**:
   - Selects Teacher + Subject + Teaching Type (`Theory` or `Practical`).
   - Assigning `Theory` automatically creates/assigns the `[Subject] — THEORY` official register.
   - Assigning `Practical` automatically creates/assigns the `[Subject] — PRACTICAL` official register.
   - If one teacher teaches both, HOD creates two assignments $\longrightarrow$ System creates **TWO separate, continuous official registers**.
4. **HOD Assigns Class Teachers**:
   - Assigns teacher to cohort (Branch, Year, Semester).
   - Grants exclusive cohort student roster authority (provisioning, credentials, biometrics, self-registration adjudication).

---

## 4. Academic Structure & Cohort Definition

### 4.1 Master Data Hierarchy
The academic structure is established using normalized, relational master tables seeded with institutional defaults upon initialization:

```
Department (e.g., Information Technology, Computer Engineering, Mechanical Engineering)
  └── Branch (e.g., B.Tech, Diploma, BCA, MCA)
       └── Year (1st Year, 2nd Year, 3rd Year)
            └── Semester (Semester 1 through Semester 6)
                 └── Subjects (e.g., Database Management Systems, Operating Systems, Computer Networks)
```

### 4.2 Cohort Invariant
> **Strict Architectural Rule:**  
> The system **does NOT** utilize an arbitrary, standalone `classes` table with ambiguous names (e.g., `Class-A`, `IT-Room-2`).  
> An academic group of students is deterministically defined as a **Cohort**:
> $$\textbf{Cohort} = \textbf{Department} + \textbf{Branch} + \textbf{Year} + \textbf{Semester} + \textbf{Academic Year}$$

All academic enrollments, teacher assignments, attendance sessions, and hardware device bindings are anchored directly to these deterministic cohort attributes.

### 4.3 Dual Student Identifier Architecture
Every student within the institution maintains two distinct identifiers:

| Identifier | Column Name | Table | Scope & Uniqueness | Institutional Purpose |
|---|---|---|---|---|
| **Official Enrollment Number** | `official_enrollment_no` | `students` | Globally Unique across the Institution | Permanent university/board registration number (e.g., `2024IT047`). Used as the student's permanent login ID (`users.username`). Appears on all official transcripts, certificates, and institutional exports. |
| **Class Roll Number** | `class_roll_no` | `enrollments` | Unique per Cohort per Academic Year | Internal classroom sorting number (e.g., Roll 1, 2, 3... 45). Used for daily roll call and determines the default sort order of the teacher's attendance register. |

**Key Rationales:**
- As a student advances from Year 1 Sem 1 to Year 3 Sem 6 across different academic years, their `official_enrollment_no` remains completely immutable.
- A student's `class_roll_no` may change between academic years or semesters due to lateral entry students, cohort reshuffling, or repeaters. Storing `class_roll_no` within `enrollments` preserves full historical accuracy.

---

## 5. Central Authentication, Student Provisioning & Lifecycle

### 5.1 Authentication Schema & Identifier Invariant
Authentication credentials, account lifecycle states, and security tokens are consolidated within the `users` table:

```sql
users (
  id                   INT PK AUTO_INCREMENT,
  username             VARCHAR(100) UNIQUE NOT NULL,
  email                VARCHAR(150) UNIQUE NULL,
  password_hash        VARCHAR(255) NULL,
  temp_password_hash   VARCHAR(255) NULL,
  must_change_password BOOLEAN NOT NULL DEFAULT FALSE,
  google_sub           VARCHAR(255) UNIQUE NULL,
  status               ENUM('PROVISIONED', 'PENDING', 'ACTIVE', 'REJECTED', 'SUSPENDED') DEFAULT 'ACTIVE',
  rejection_reason     VARCHAR(255) NULL,
  created_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

> **Mandatory Transactional Invariant:**  
> For all student accounts, the central login username and the permanent institutional enrollment number must be identical:  
> $$\textbf{users.username} = \textbf{students.official\_enrollment\_no}$$  
> All provisioning, registration, and profile modification operations must execute within an explicit database transaction (`START TRANSACTION ... COMMIT`) guaranteeing strict 1-to-1 synchronization.

### 5.2 Account Status Lifecycle
Student accounts transition through a tightly regulated finite-state machine:

```
           [Teacher Provisioning]                           [Self-Registration]
                     │                                               │
                     ▼                                               ▼
               PROVISIONED                                        PENDING
                     │                                        ┌──────┴──────┐
        (Student changes temp password                        │             │
          or activates via Google)                            ▼             ▼
                     │                                     ACTIVE        REJECTED
                     ▼                                (Class Teacher   (Class Teacher
                   ACTIVE ◄───────────────────────────   Approves)        Rejects)
                     │
          (Admin suspends account)
                     │
                     ▼
                 SUSPENDED
```

- **`PROVISIONED`:** Created by a teacher or administrator. A cryptographically random temporary password is generated. The student exists in cohort rosters and attendance registers, but cannot access full platform features until activating their account.
- **`PENDING`:** Created via student self-registration. Awaiting review and approval by the assigned Class Teacher. Login access is blocked.
- **`ACTIVE`:** Fully verified institutional account. Possesses standard student login permissions.
- **`REJECTED`:** Self-registration was reviewed and rejected by the assigned Class Teacher. The reason for rejection is stored in `users.rejection_reason` and displayed to the student upon login attempt. (*Note: `APPROVED` is an action performed by the teacher, not an account status.*)
- **`SUSPENDED`:** Administratively deactivated. All active sessions are immediately revoked.

### 5.3 Method A: Teacher Student Provisioning (Primary Institutional Path)
To eliminate student registration delays and prevent name spelling discrepancies, the primary enrollment mechanism is teacher-driven bulk provisioning:

1. **Roster Input:** The Class Teacher navigates to `Faculty Portal -> Students -> [Add Student / Bulk CSV]`.
2. **Data Submission:** The teacher inputs or uploads a CSV containing: `Full Name`, `Official Enrollment Number`, `Class Roll Number`, and optional `Email`.
3. **Cryptographic Credential Generation:** For each student, the backend:
   - Generates a secure random 8-character temporary password (alphanumeric with special characters).
   - Hashes the temporary password using `bcrypt` and stores it in `users.temp_password_hash`.
   - Sets `users.status = 'PROVISIONED'` and `users.must_change_password = TRUE`.
   - Creates the permanent student profile in `students` and binds the cohort roll number in `enrollments`.
4. **Credential Export:** The system generates two immediate download artifacts for the teacher:
   - **Excel Roster:** `Roll No | Full Name | Official Enrollment No | Temporary Password` (for teacher's administrative records).
   - **Printable PDF Slips:** Standard formatted cut-out slips (6–8 per page) containing student identity and temporary login credentials to be handed out in class.
5. **Student Activation:**
   - Student visits `/login/student` and enters their `official_enrollment_no` and `temporary password`.
   - The backend validates credentials, recognizes `must_change_password = TRUE`, and routes the student to the **Mandatory Password Setup Screen**.
   - Student enters their permanent password.
   - The backend updates `password_hash`, clears `temp_password_hash`, sets `must_change_password = FALSE`, updates `status = 'ACTIVE'`, issues JWT tokens, and redirects to the student dashboard.

### 5.4 Method B: Fallback Student Self-Registration Workflow
If a student's profile was not pre-provisioned by faculty:
1. **Student Submission:** Student navigates to `/register/student`, selects their cohort from dynamic master dropdowns, enters their `Full Name`, `Official Enrollment Number`, `Email`, and `Password`.
2. **Cohort Setting Check:** The backend inspects `cohort_registration_settings`. If `registration_open = FALSE`, the submission is rejected immediately.
3. **Record Creation:** The backend creates a user record with `users.status = 'PENDING'`.
4. **Notification:** An in-app notification is routed to the assigned Class Teacher for that cohort.
5. **Class Teacher Review:** The Class Teacher reviews the pending list (`/faculty/registrations`).
   - If **Approved**: Account transitions from `PENDING` to `ACTIVE`. A cohort enrollment record is created, and the student can log in.
   - If **Rejected**: Account transitions from `PENDING` to `REJECTED` with a required explanation note.

### 5.5 Google Authentication & Account Linking
Google OAuth 2.0 serves as an optional, high-speed authentication method:
- **Server-Side Verification:** Google ID tokens are cryptographically verified by the backend using `google-auth-library`.
- **Atomic Activation of Provisioned Accounts:** If a student with `users.status = 'PROVISIONED'` and an unlinked account logs in with a Google email matching their provisioned email:
  ```sql
  UPDATE users SET
    google_sub = verified_google_sub,
    status = 'ACTIVE',
    must_change_password = FALSE,
    temp_password_hash = NULL
  WHERE id = user_id;
  ```
- **Guarded Linking:** Accounts with `users.status = 'PENDING'` or `'REJECTED'` are prevented from entering the system via Google until verified by their Class Teacher.

### 5.6 Teacher Identity, Temporary Passwords & Strict Google Email Parity
1. **Teacher Login Identifier:**
   - A teacher's institutional Gmail address is their permanent login ID (`users.username = teacher@gmail.com`).
   - Teacher names are never login usernames.
2. **Account Creation & Temporary Password:**
   - Admin creates the teacher account with their Gmail, Full Name, Employee ID, and Phone.
   - The system generates a cryptographically random temporary password and stores only its `bcrypt` hash in `users.temp_password_hash`.
   - Admin issues the temporary login slip (Gmail + Temporary Password) to the faculty member.
3. **Mandatory First-Time Login Setup:**
   - Teacher logs in with Gmail and temporary password.
   - The system triggers a mandatory first-time setup flow:
     - Step 1: Set permanent password.
     - Step 2: Link Google account for 1-click authentication.
4. **Strict Google Email Matching (Mandatory Rule):**
   - The linking flow requires the authenticated Google account email to **match the registered Gmail address exactly**.
   - If registered email is `teacher@gmail.com` and Google account is `teacher@gmail.com`: **ALLOW**.
   - If Google account is `another@gmail.com`: **DENY** with explicit error. Google login cannot create unknown faculty accounts.
5. **Profile Updates & Linkage Revalidation:**
   - Teachers can update password, contact details, and Gmail (where allowed).
   - If Gmail is updated, the Google linkage is immediately invalidated and requires re-linking.
   - Teachers cannot alter employee ID, assigned subjects, cohorts, or academic roles (Admin-only).

---

## 6. Attendance Concepts & The Three Independent Streams

### 6.1 Architectural Principle of Three Independent Streams
Attendance capture within the institution operates across **three strictly independent streams**. The streams are kept logically and physically separated within the database. The system **NEVER automatically merges, overwrites, or alters official attendance** based on raw hardware or student requests.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                             THREE ATTENDANCE STREAMS                         │
├──────────────────────┬───────────────────────────────┬──────────────────────┤
│       STREAM 1       │           STREAM 2            │       STREAM 3       │
│    ESP32 Presence    │       Teacher Register        │   Self-Attendance    │
│      (Hardware)      │       (Official Record)       │   (Soft Requests)    │
├──────────────────────┼───────────────────────────────┼──────────────────────┤
│ Raw fingerprint scan │ Teacher's official register   │ Student marks presence│
│ Autonomous IoT capture│ Full teacher authority        │ via Web/PWA          │
│ Offline SPI storage  │ Options: Manual, Sync, PIN/QR │ Soft claim/request   │
│ Table: esp32_presence│ Table: register_attendance    │ Table: self_attend   │
│ Never locked         │ Locked on FINALIZATION        │ Locked on CLOSE      │
│ Supporting evidence  │ Sole institutional authority  │ Requires acceptance  │
└──────────────────────┴───────────────────────────────┴──────────────────────┘
```

### 6.2 Stream 1: ESP32 Classroom Presence
Records raw biometric physical presence detected by ESP32 fingerprint terminals placed in classrooms or laboratories:
- **Hardware Autonomy:** Operates independently of whether a teacher has initiated an active session.
- **Data Attributes:** Captures `student_id`, `device_id`, `event_id`, scan date, scan time, and raw hardware battery/signal telemetry.
- **Evidence Storage:** Written strictly to `esp32_presence`.
- **No Direct Modification:** A biometric scan confirms physical presence at a door/device, but does **not** constitute an official class attendance mark until reviewed or synchronized by the subject teacher.

### 6.3 Stream 2: Teacher Register Attendance (Official Record of Truth)
The Teacher Register represents the **sole authoritative record** of course attendance used for academic transcripts, semester eligibility, and official institutional reporting:
- **Long-Running Container:** An Official Register (`attendance_registers`) continues throughout the semester/academic period. It is NOT recreated daily. Each conducted class is an `attendance_session` inside that register.
- **CALENDAR-FIRST UI (Primary Interface):**
  - Teacher opens the register and sees the **Month-View Calendar**.
  - Header: Subject, Component (Theory/Practical), Dept, Branch, Year, Semester, Academic Year, Teacher, Cohort.
  - Cells display compact summaries: Session Time, Present/Absent/Late counts, Percentage, and State badge (`DRAFT`, `OPEN`, `CLOSED`, `FINALIZED`). Today is highlighted with `● LIVE` badge if open.
  - Clicking a date opens that day's **Daily Attendance Session** (Roll | Student | Status toggle), which is the primary editing interface.
- **Official vs. Personal Registers:**
  - **OFFICIAL Registers:** Created automatically via Admin assignment. Contributes to official attendance % and appears in Admin Department Reports.
  - **PERSONAL Registers:** Created by teachers for clubs (e.g. Robotics), tutorials, seminars. Excluded from Admin reports, defaulter reports, and official calculations. Enforced at the database query level (`WHERE is_official = 1`).
- **Authority:** The assigned Subject Teacher retains complete authority over the register.
- **Session Modes:**
  - **Option A (Pure Manual):** Teacher reviews the roster and manually marks students `PRESENT`, `ABSENT`, or `LATE`.
  - **Option B (ESP32 Synchronized):** Teacher clicks **[Sync from ESP32]**. The backend matches raw scans from `esp32_presence` within the session's time window. Matched students are pre-populated as `PRESENT`, unmatched as `ABSENT`. The teacher reviews, edits exceptions, and finalizes.
  - **Option C (Self-Attendance Review):** Teacher reviews incoming student self-attendance requests, accepts valid claims, rejects fraudulent ones, and finalizes.
- **Attendance Status Values:**
  - `PRESENT`: Student attended on time $\longrightarrow$ Counts as attended (+1).
  - `LATE`: Student attended late $\longrightarrow$ Counts as attended (+1).
  - `ABSENT`: Student did not attend $\longrightarrow$ Does NOT count (0).

$$\text{Official Attended Count } (P) = \text{count}(\text{PRESENT}) + \text{count}(\text{LATE})$$
$$\text{Official Attendance } \% = \frac{\text{count}(\text{PRESENT}) + \text{count}(\text{LATE})}{\text{Total Finalized Sessions Included } (C)} \times 100$$

### 6.4 Stream 3: Student Self-Attendance (Soft Verification Requests)
An optional digital verification stream enabling students to mark attendance using personal devices:
- **Status Nature:** Records in `student_self_attendance` represent **requests only** (`PENDING`).
- **Teacher Adjudication:** The teacher inspects requests within the live session console and clicks **[Accept]** or **[Reject]**.
- **Register Translation:** Accepting a self-attendance request writes or updates a record in `register_attendance` with `source = 'SELF_REQUEST'` and `attendance_status = 'PRESENT'`.

---

## 7. Attendance Session Lifecycle & Data Integrity

### 7.1 Session State Machine

```
   [Create Session]
          │
          ▼
        DRAFT ──────────────► (Deleted if cancelled)
          │
    [Open Session]
          │
          ▼
        OPEN ◄────────────── (Students submit requests / PIN / QR;
          │                   ESP32 scans actively correlate)
   [Close Session /
   Auto-Close Timer]
          │
          ▼
        CLOSED ───────────── (Student submissions locked;
          │                   Teacher reviews, edits, syncs)
   [Finalize Session]
          │
          ▼
      FINALIZED ──────────── (LOCKED PERMANENTLY:
                              Official institutional record)
```

1. **`DRAFT`:** Session created by the subject teacher. The cohort roster is frozen. Not visible to students.
2. **`OPEN`:** Session opened for active student interaction. Students can submit self-attendance requests, enter session PINs, or scan dynamic QR codes.
3. **`CLOSED`:** Active student submissions are cut off. Can be triggered manually by the teacher or automatically via the `auto_close_at` timer. The teacher conducts final reviews, imports ESP32 data, or manually marks remaining students.
4. **`FINALIZED`:** Permanently locked. Records in `register_attendance` become the official basis for calculations. No further modifications can be made by faculty.

### 7.2 Session Roster Snapshot (`attendance_session_students`)
When an attendance session is created, the system takes an **immutable snapshot** of all students actively enrolled in that cohort:

```sql
attendance_session_students (
  id             INT PK AUTO_INCREMENT,
  session_id     INT NOT NULL FK -> attendance_sessions.id,
  student_id     INT NOT NULL FK -> students.id,
  enrollment_id  INT NOT NULL FK -> enrollments.id,
  class_roll_no  INT NOT NULL,
  included       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(session_id, student_id)
);
```

- **Historical Integrity:** If a student drops out, transfers departments, or changes roll numbers mid-semester, historical finalized session rosters remain perfectly preserved.
- **Subgroup / Batch Flexibility:** For practical labs or tutorial sessions conducted with a subset of students, the teacher can toggle `included = FALSE` for non-participating students. Excluded students are omitted from total session denominators ($C$) for that specific session.

### 7.3 Finalization Integrity Invariants
The system strictly enforces two database and business logic constraints prior to finalization:
1. **Universal Marking Invariant:** Before transitioning from `CLOSED` to `FINALIZED`, every student marked with `included = TRUE` in `attendance_session_students` **must have an explicit record** in `register_attendance` with status `PRESENT`, `ABSENT`, or `LATE`.
   - The backend rejects finalization requests containing unassigned or null statuses with HTTP `422 Unprocessable Entity`.
2. **Auto-Close Boundary Invariant:** The automated background timer `auto_close_at` **only transitions a session from `OPEN` to `CLOSED`**. Under no circumstances does an automated system process transition a session to `FINALIZED`. Institutional finalization requires deliberate human teacher sign-off.

### 7.4 Multiple Sessions Per Subject/Day
The system fully supports multiple attendance sessions for the same subject and cohort on the exact same date:
- *Examples:* Morning Theory Lecture (10:00 AM – 11:00 AM) and Afternoon Practical Lab (02:00 PM – 04:00 PM).
- Differentiated by `session_type` (`THEORY`, `PRACTICAL`, `TUTORIAL`, `EXTRA`), unique `start_time`, and custom `label`.

### 7.5 Audited Administrative Corrections
Once a session is `FINALIZED`, faculty members cannot edit records. If an administrative correction is legally required (e.g., medical leave certificate validated after the fact):
- Only a user with `SYSTEM_ADMIN` role can submit a correction.
- The update writes to `register_attendance` and simultaneously records an immutable row in `register_attendance_corrections`:
  ```sql
  register_attendance_corrections (
    id                INT PK AUTO_INCREMENT,
    register_id       INT NOT NULL FK -> register_attendance.id,
    previous_status   ENUM('PRESENT', 'ABSENT', 'LATE') NOT NULL,
    new_status        ENUM('PRESENT', 'ABSENT', 'LATE') NOT NULL,
    corrected_by      INT NOT NULL FK -> users.id,
    reason            TEXT NOT NULL,
    created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
  ```

---

## 8. No-Device Mode & Soft Presence Verification

The system operates 100% reliably in institutional environments without any biometric hardware:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          NO-DEVICE VERIFICATION MODES                       │
├──────────────────────┬───────────────────────────────┬──────────────────────┤
│        MODE A        │            MODE B             │        MODE C        │
│ Pure Manual Register │       Session PIN Code        │ Dynamic Signed QR    │
├──────────────────────┼───────────────────────────────┼──────────────────────┤
│ Zero student devices │ Students enter 4-6 digit PIN  │ Students scan dynamic│
│ Teacher marks screen │ PIN projected on classroom TV │ signed QR on screen  │
│ Best for small labs  │ 15-minute sliding expiry      │ 10-minute expiry     │
│ Paper register clone │ In-memory bcrypt validation   │ HMAC cryptographic sig│
└──────────────────────┴───────────────────────────────┴──────────────────────┘
```

### 8.1 Mode A: Pure Manual Register
- Teacher opens session on laptop, tablet, or classroom PC.
- Roster displays alphabetically or sorted by `class_roll_no`.
- Teacher marks attendance with single-click buttons. Full offline, zero-student-device requirement.

### 8.2 Mode B: Time-Limited Session PIN
- When the teacher opens a session, clicking **[Generate PIN]** creates a 4-to-6 digit numeric code (e.g., `5829`).
- The teacher projects or writes the PIN on the classroom whiteboard.
- Students open `/student/attendance/active`, enter the PIN, and submit.
- **Backend Rules:**
  - PIN is hashed (`bcrypt`) in `attendance_session_pins`.
  - Valid only while session is `OPEN` and within the expiration window (default 15 minutes).
  - One submission per student per session (`UNIQUE(session_id, student_id)`).
  - Teacher can regenerate the PIN, immediately invalidating the previous code.

### 8.3 Mode C: Dynamic Signed QR Code
- Teacher screen displays a high-resolution QR code generated on the fly.
- Students scan the QR code using any smartphone browser camera.
- **Cryptographic Security:**
  - The QR encodes a signed token: `HMAC_SHA256(session_id + timestamp + salt, server_secret)`.
  - Valid for a single session within a 10-minute window.
  - Mitigates remote attendance fraud by preventing static link sharing.

---

## 9. Hardware Device Integration (ESP32 & Biometrics)

### 9.1 Hardware Topology & Security Boundaries
Biometric terminals connect over Wi-Fi to the local edge server. **ESP32 devices never connect directly to the MySQL database.** All interactions occur over HTTPS via the device webhook API.

```
┌─────────────────────────┐                 ┌──────────────────────────┐
│  ESP32 + R307 Terminal  │───HTTPS POST───►│  Express REST API Server │
│  (Classroom / Door)     │◄──JSON Response─│  (/api/v1/devices/*)     │
└─────────────────────────┘                 └────────────┬─────────────┘
                                                         │ mysql2
                                                         ▼
                                            ┌──────────────────────────┐
                                            │      MySQL 8.x DB        │
                                            │  (esp32_presence table)  │
                                            └──────────────────────────┘
```

### 9.2 Device Authentication & Pinned TLS
- **Shared Secret:** Every device possesses a registered `device_uid` and pre-shared secret key delivered in an `X-Device-Secret` header.
- **Pinned Self-Signed TLS:** The local server's self-signed TLS certificate fingerprint is hardcoded into the ESP32 firmware, preventing man-in-the-middle attacks on the local network.

### 9.3 Fingerprint Slot Mapping Invariant
> **Fundamental Biometric Invariant:**  
> A fingerprint sensor memory slot number (`slot_id`, e.g., slot 42) is **never a student identity by itself**.  
> The physical slot belongs strictly to a specific physical terminal. Student identity is resolved exclusively through the compound tuple:
> $$\textbf{Student Identity} = \textbf{device\_id} + \textbf{slot\_id}$$

```sql
fingerprint_slots (
  id          INT PK AUTO_INCREMENT,
  device_id   INT NOT NULL FK -> devices.id,
  slot_id     INT NOT NULL,                  -- Slot 1 to 1000 in sensor flash
  student_id  INT NOT NULL FK -> students.id,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(device_id, slot_id)
);
```

### 9.4 Offline Resilience & Queue Synchronization
- When the campus network goes offline, the ESP32 buffers scan events in on-board SPI Flash memory (e.g., W25Q32).
- Each scan event generates a unique UUID `event_id`.
- When network connectivity is restored, the ESP32 transmits queued scans in batch.
- The backend enforces deduplication via `UNIQUE(event_id)` on `esp32_presence`. Duplicate events from network retries are dropped safely without throwing errors.

### 9.5 Class Teacher Classroom Biometric Enrollment Workflow
To prevent administrative bottlenecks where a single IT administrator must enroll hundreds of students, **Class Teachers are authorized to register student fingerprints** directly in the classroom or laboratory:

1. **Scoped Cohort Roster Access:**
   - The faculty member logs into the Faculty Portal. The system validates their active functional assignment (`assignment_type = 'CLASS_TEACHER'`).
   - The teacher navigates to **Enrolled Students** (`faculty/students.html`), which displays cohort members alongside biometric enrollment status badges:
     - 🟢 `ENROLLED (Slot #14 - Lab 3 ESP32)`
     - ⚪ `NOT ENROLLED`
2. **Interactive Optical Enrollment Modal:**
   - The Class Teacher selects an unenrolled student and clicks **[Register Fingerprint]**.
   - The modal automatically detects the active ESP32 terminal assigned to that cohort and queries the next available optical sensor memory slot (e.g. `Slot #43` out of 1000).
   - The teacher clicks **[Start Sensor Enrollment]**, invoking `POST /api/v1/devices/:id/enroll-mode`.
3. **Hardware Optical Handshake (Two-Touch Verification):**
   - The ESP32 receives the command, beeps its onboard buzzer, and displays `"Place Finger for Roll [X]"` on its OLED screen.
   - The student places their finger on the R307 sensor glass. The sensor captures the first optical image (`image2Tz(1)`).
   - The OLED prompts `"Lift & Place Again"`. The student lifts and re-places their finger. The sensor captures the second optical image (`image2Tz(2)`).
   - The R307 processor synthesizes the two scans into a mathematical minutiae template and stores it in slot `#43` (`storeModel(43)`).
4. **Database Confirmation & Audit Logging:**
   - The terminal acknowledges success to the server.
   - The backend service inserts the record into `fingerprint_slots` (`device_id`, `slot_id = 43`, `student_id = 105`) and writes an entry to `audit_logs` (`FINGERPRINT_ENROLLED`, authorized by the Class Teacher's user ID).
   - The Faculty Portal UI live-updates to show the green `ENROLLED` badge.
5. **Slot Re-Enrollment & Clearing:**
   - If a student's finger template degrades or requires re-scanning, the Class Teacher can click **[Re-Enroll]** or **[Clear Slot]**, freeing up slot `#43` on both the physical sensor and the database.

---

## 10. Official Calculations & Predictive Algorithms

### 10.1 Official Calculation Invariant
Official student attendance percentages are derived **exclusively from finalized teacher registers**:

$$P = \text{Total Finalized Sessions where } \text{attendance\_status} \in (\text{'PRESENT'}, \text{'LATE'})$$
$$C = \text{Total Finalized Sessions where student was included } (\text{included} = \text{TRUE})$$
$$\text{Official Attendance Percentage} = \begin{cases} 100.0\%, & \text{if } C = 0 \\ \left(\frac{P}{C}\right) \times 100, & \text{if } C > 0 \end{cases}$$

*Raw scans in `esp32_presence` and pending requests in `student_self_attendance` never contribute to this calculation.*

### 10.2 Predictive Threshold Algorithm
To empower students to proactively manage academic eligibility, the student portal implements a deterministic predictive algorithm based on the institutional threshold $T$ (configured as a decimal, e.g., $75\% \rightarrow T = 0.75$):

```
Let:
  T = Institutional Threshold (0.75)
  P = Official Attended Count (PRESENT + LATE)
  C = Official Conducted Count (Finalized and Included)
  Current % = (P / C) * 100

CASE 1: Student is currently SAFE (Current % >= T * 100)
  How many consecutive future classes can the student miss without dropping below T%?
  Formula:
    X = floor( (P - (T * C)) / T )

  Worked Examples (T = 0.75):
    • P = 8, C = 10 (80.0%):
      X = floor((8 - (0.75 * 10)) / 0.75) = floor(0.5 / 0.75) = 0 classes.
      Insight: Safe, but missing even 1 class drops attendance to 72.7%.
    • P = 15, C = 18 (83.3%):
      X = floor((15 - (0.75 * 18)) / 0.75) = floor(1.5 / 0.75) = 2 classes.
      Insight: Can safely miss 2 consecutive classes and remain at exactly 75.0%.

CASE 2: Student is currently AT RISK (Current % < T * 100)
  How many consecutive future classes must the student attend to recover to T%?
  Formula:
    Y = ceil( ((T * C) - P) / (1 - T) )

  Worked Example (T = 0.75):
    • P = 6, C = 10 (60.0%):
      Y = ceil(((0.75 * 10) - 6) / (1 - 0.75)) = ceil(1.5 / 0.25) = 6 classes.
      Insight: Must attend the next 6 consecutive sessions to reach 12/16 = 75.0%.
```

---

## 11. Reporting & Cross-Stream Comparison

### 11.1 Standard Reports Catalog
| Report Title | Source Data Table | Primary Purpose | Filters |
|---|---|---|---|
| **Teacher Register Report** | `register_attendance` | Authoritative academic transcript & exam eligibility | Cohort, Subject, Date Range |
| **ESP32 Presence Report** | `esp32_presence` | Physical door/terminal audit log | Device, Date Range, Cohort |
| **Self-Attendance Report** | `student_self_attendance` | Self-claim frequency and teacher acceptance rate | Cohort, Subject, Date Range |
| **Stream Comparison Report**| `register_attendance` + `esp32_presence` | Discrepancy analysis (human vs biometric) | Cohort, Subject, Date |
| **Student Full Report** | All three streams | 360-degree attendance profile for parent meetings | Student ID, Academic Year |
| **Daily Summary Report** | `register_attendance` | Institutional executive daily briefing | Date, Department |
| **Low Attendance Alert** | `register_attendance` | Identify students below threshold percentage | Cohort, Subject, Threshold % |

### 11.2 Stream Comparison Matrix
The Stream Comparison Report correlates records from the Teacher Register against biometric presence records for the exact same session:

| Register Status | ESP32 Scan Status | Correlation Result | Institutional Meaning / Typical Scenario |
|---|---|---|---|
| `PRESENT` | Detected | **MATCH** | Normal verification: Student attended lecture and scanned finger. |
| `ABSENT` | Not Detected | **MATCH** | Normal verification: Student was absent from campus and class. |
| `PRESENT` | Not Detected | **MISMATCH** | Teacher marked present, but biometric scan is missing. (Valid sensor failure, student finger cut, or teacher manual pardon). |
| `ABSENT` | Detected | **MISMATCH** | Student scanned device at door, but teacher marked absent in register. (Student left room early, attended wrong lab, or attempted proxy). |

---

## 12. Security Specifications & System Defenses

1. **Password Hashing:** All permanent and temporary passwords hashed using `bcrypt` with work factor $\ge 10$.
2. **Token Protection:** Refresh tokens stored as SHA-256 hashes in `user_sessions`. Issued inside `httpOnly`, `sameSite=Strict` cookies.
3. **Session Invalidation:** Revoking a session in `user_sessions` or changing a user password immediately terminates active refresh capability.
4. **SQL Injection Defense:** All database interactions utilize prepared statements through `mysql2`. String interpolation in SQL is strictly prohibited.
5. **Brute Force Protection:** `express-rate-limit` enforces threshold limits on `/api/v1/auth/faculty/login`, `/api/v1/auth/student/login`, and `/api/v1/devices/webhook/scan`.
6. **HTTP Hardening:** `helmet` applies Content Security Policy (CSP), hides `X-Powered-By`, and enforces frame options.
7. **Immutable Audit Trail:** All administrative operations, master data edits, registration adjudications, session finalizations, and corrections are logged to `audit_logs`.

---

## 13. Comprehensive Database Schema Outline

```sql
-- 1. Identity & Central Authentication
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  email VARCHAR(150) NULL UNIQUE,
  password_hash VARCHAR(255) NULL,
  temp_password_hash VARCHAR(255) NULL,
  must_change_password BOOLEAN NOT NULL DEFAULT FALSE,
  google_sub VARCHAR(255) NULL UNIQUE,
  status ENUM('PROVISIONED', 'PENDING', 'ACTIVE', 'REJECTED', 'SUSPENDED') NOT NULL DEFAULT 'ACTIVE',
  rejection_reason VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE user_roles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  role ENUM('SYSTEM_ADMIN', 'TEACHER', 'STUDENT') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uq_user_role (user_id, role)
);

CREATE TABLE user_sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  refresh_token_hash VARCHAR(255) NOT NULL UNIQUE,
  user_agent VARCHAR(255) NULL,
  ip_address VARCHAR(45) NULL,
  expires_at DATETIME NOT NULL,
  is_revoked BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 2. Master Academic Data
CREATE TABLE departments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  code VARCHAR(50) NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE branches (
  id INT AUTO_INCREMENT PRIMARY KEY,
  department_id INT NOT NULL,
  name VARCHAR(150) NOT NULL,
  code VARCHAR(50) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE RESTRICT,
  UNIQUE KEY uq_dept_branch (department_id, code)
);

CREATE TABLE academic_years (
  id INT AUTO_INCREMENT PRIMARY KEY,
  year_label VARCHAR(50) NOT NULL UNIQUE,
  is_current BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE subjects (
  id INT AUTO_INCREMENT PRIMARY KEY,
  department_id INT NOT NULL,
  branch_id INT NOT NULL,
  name VARCHAR(150) NOT NULL,
  code VARCHAR(50) NOT NULL UNIQUE,
  semester INT NOT NULL,
  has_theory BOOLEAN NOT NULL DEFAULT TRUE,
  has_practical BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE RESTRICT,
  FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE RESTRICT
);

-- 3. Profiles & Academic Assignments
CREATE TABLE teachers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  employee_id VARCHAR(50) NOT NULL UNIQUE,
  full_name VARCHAR(150) NOT NULL,
  phone VARCHAR(20) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE teacher_assignments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  teacher_id INT NOT NULL,
  assignment_type ENUM('SUBJECT_TEACHER', 'CLASS_TEACHER', 'HOD') NOT NULL,
  subject_id INT NULL,
  session_type_scope ENUM('THEORY', 'PRACTICAL', 'ALL') NOT NULL DEFAULT 'ALL',
  department_id INT NOT NULL,
  branch_id INT NOT NULL,
  year INT NOT NULL,
  semester INT NOT NULL,
  academic_year_id INT NOT NULL,
  assigned_by INT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE,
  FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE RESTRICT,
  FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE RESTRICT,
  FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE RESTRICT,
  FOREIGN KEY (academic_year_id) REFERENCES academic_years(id) ON DELETE RESTRICT,
  FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE RESTRICT
);

CREATE TABLE students (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  official_enrollment_no VARCHAR(50) NOT NULL UNIQUE,
  full_name VARCHAR(150) NOT NULL,
  entry_mode ENUM('teacher_provisioned', 'self_registered') NOT NULL DEFAULT 'teacher_provisioned',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE enrollments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  department_id INT NOT NULL,
  branch_id INT NOT NULL,
  year INT NOT NULL,
  semester INT NOT NULL,
  academic_year_id INT NOT NULL,
  class_roll_no INT NOT NULL,
  status ENUM('ENROLLED', 'COMPLETED', 'PROMOTED', 'DROPPED') NOT NULL DEFAULT 'ENROLLED',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE RESTRICT,
  FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE RESTRICT,
  FOREIGN KEY (academic_year_id) REFERENCES academic_years(id) ON DELETE RESTRICT,
  UNIQUE KEY uq_cohort_roll (department_id, branch_id, year, semester, academic_year_id, class_roll_no),
  UNIQUE KEY uq_student_year (student_id, academic_year_id)
);

CREATE TABLE cohort_registration_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  department_id INT NOT NULL,
  branch_id INT NOT NULL,
  year INT NOT NULL,
  semester INT NOT NULL,
  academic_year_id INT NOT NULL,
  registration_open BOOLEAN NOT NULL DEFAULT TRUE,
  changed_by INT NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE RESTRICT,
  FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE RESTRICT,
  FOREIGN KEY (academic_year_id) REFERENCES academic_years(id) ON DELETE RESTRICT,
  FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE RESTRICT,
  UNIQUE KEY uq_cohort_reg (department_id, branch_id, year, semester, academic_year_id)
);

-- 4. Attendance Registers & Sessions
CREATE TABLE attendance_registers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  teacher_id INT NOT NULL,
  name VARCHAR(200) NOT NULL,
  subject_id INT NULL,
  assignment_id INT NULL,
  department_id INT NULL,
  branch_id INT NULL,
  year INT NULL,
  semester INT NULL,
  academic_year_id INT NULL,
  component_type ENUM('THEORY', 'PRACTICAL') NOT NULL DEFAULT 'THEORY',
  register_type ENUM('OFFICIAL', 'PERSONAL') NOT NULL DEFAULT 'OFFICIAL',
  is_official BOOLEAN NOT NULL DEFAULT TRUE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE RESTRICT,
  FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE RESTRICT,
  FOREIGN KEY (assignment_id) REFERENCES teacher_assignments(id) ON DELETE SET NULL,
  FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
  FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL,
  FOREIGN KEY (academic_year_id) REFERENCES academic_years(id) ON DELETE SET NULL
);

CREATE TABLE attendance_sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  register_id INT NOT NULL,
  teacher_id INT NOT NULL,
  subject_id INT NOT NULL,
  department_id INT NOT NULL,
  branch_id INT NOT NULL,
  year INT NOT NULL,
  semester INT NOT NULL,
  academic_year_id INT NOT NULL,
  session_type ENUM('THEORY', 'PRACTICAL', 'TUTORIAL', 'EXTRA') NOT NULL DEFAULT 'THEORY',
  label VARCHAR(100) NULL,
  session_date DATE NOT NULL,
  start_time DATETIME NOT NULL,
  end_time DATETIME NULL,
  state ENUM('DRAFT', 'OPEN', 'CLOSED', 'FINALIZED') NOT NULL DEFAULT 'DRAFT',
  auto_close_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (register_id) REFERENCES attendance_registers(id) ON DELETE CASCADE,
  FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE RESTRICT,
  FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE RESTRICT,
  FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE RESTRICT,
  FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE RESTRICT,
  FOREIGN KEY (academic_year_id) REFERENCES academic_years(id) ON DELETE RESTRICT
);

CREATE TABLE attendance_session_students (
  id INT AUTO_INCREMENT PRIMARY KEY,
  session_id INT NOT NULL,
  student_id INT NOT NULL,
  enrollment_id INT NOT NULL,
  class_roll_no INT NOT NULL,
  included BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES attendance_sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE RESTRICT,
  FOREIGN KEY (enrollment_id) REFERENCES enrollments(id) ON DELETE RESTRICT,
  UNIQUE KEY uq_session_student (session_id, student_id)
);

CREATE TABLE attendance_session_pins (
  id INT AUTO_INCREMENT PRIMARY KEY,
  session_id INT NOT NULL,
  pin_hash VARCHAR(255) NOT NULL,
  generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  generated_by INT NOT NULL,
  FOREIGN KEY (session_id) REFERENCES attendance_sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (generated_by) REFERENCES users(id) ON DELETE RESTRICT
);

CREATE TABLE attendance_session_qr (
  id INT AUTO_INCREMENT PRIMARY KEY,
  session_id INT NOT NULL,
  token_hash VARCHAR(255) NOT NULL,
  generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  generated_by INT NOT NULL,
  FOREIGN KEY (session_id) REFERENCES attendance_sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (generated_by) REFERENCES users(id) ON DELETE RESTRICT
);

-- 5. The Three Streams
CREATE TABLE esp32_presence (
  id INT AUTO_INCREMENT PRIMARY KEY,
  device_id INT NOT NULL,
  student_id INT NOT NULL,
  event_id VARCHAR(100) NOT NULL UNIQUE,
  scanned_at DATETIME NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE RESTRICT
);

CREATE TABLE register_attendance (
  id INT AUTO_INCREMENT PRIMARY KEY,
  session_id INT NOT NULL,
  student_id INT NOT NULL,
  attendance_status ENUM('PRESENT', 'ABSENT', 'LATE') NOT NULL,
  source ENUM('MANUAL', 'ESP32_SYNC', 'SELF_REQUEST') NOT NULL,
  teacher_notes TEXT NULL,
  marked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES attendance_sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE RESTRICT,
  UNIQUE KEY uq_register_student (session_id, student_id)
);

CREATE TABLE register_attendance_corrections (
  id INT AUTO_INCREMENT PRIMARY KEY,
  register_id INT NOT NULL,
  previous_status ENUM('PRESENT', 'ABSENT', 'LATE') NOT NULL,
  new_status ENUM('PRESENT', 'ABSENT', 'LATE') NOT NULL,
  corrected_by INT NOT NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (register_id) REFERENCES register_attendance(id) ON DELETE CASCADE,
  FOREIGN KEY (corrected_by) REFERENCES users(id) ON DELETE RESTRICT
);

CREATE TABLE student_self_attendance (
  id INT AUTO_INCREMENT PRIMARY KEY,
  session_id INT NOT NULL,
  student_id INT NOT NULL,
  verification_mode ENUM('BUTTON', 'PIN', 'QR') NOT NULL,
  request_status ENUM('PENDING', 'ACCEPTED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reviewed_at DATETIME NULL,
  FOREIGN KEY (session_id) REFERENCES attendance_sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE RESTRICT,
  UNIQUE KEY uq_self_request (session_id, student_id)
);

-- 6. Hardware Terminal Registry
CREATE TABLE devices (
  id INT AUTO_INCREMENT PRIMARY KEY,
  device_uid VARCHAR(100) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  department_id INT NOT NULL,
  branch_id INT NOT NULL,
  year INT NOT NULL,
  semester INT NOT NULL,
  academic_year_id INT NOT NULL,
  secret_hash VARCHAR(255) NOT NULL,
  certificate_fingerprint VARCHAR(255) NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  last_heartbeat_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE RESTRICT,
  FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE RESTRICT,
  FOREIGN KEY (academic_year_id) REFERENCES academic_years(id) ON DELETE RESTRICT
);

CREATE TABLE fingerprint_slots (
  id INT AUTO_INCREMENT PRIMARY KEY,
  device_id INT NOT NULL,
  slot_id INT NOT NULL,
  student_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE RESTRICT,
  UNIQUE KEY uq_device_slot (device_id, slot_id)
);

CREATE TABLE device_events (
  id INT AUTO_INCREMENT PRIMARY KEY,
  device_id INT NOT NULL,
  event_type ENUM('HEARTBEAT', 'SCAN_SUCCESS', 'SCAN_FAIL', 'ERROR') NOT NULL,
  payload JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
);

-- 7. Notifications & Auditing
CREATE TABLE notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  type ENUM('INFO', 'WARNING', 'SUCCESS', 'DANGER') NOT NULL DEFAULT 'INFO',
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE audit_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  action VARCHAR(100) NOT NULL,
  resource VARCHAR(100) NOT NULL,
  resource_id VARCHAR(50) NULL,
  ip_address VARCHAR(45) NULL,
  details JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);
```

---

## 14. Phased Implementation Strategy

- **Phase 1: Attendance Web System (Current Immediate Goal)**
  - MySQL schema deployment and initial master seeds.
  - Express REST API foundations (auth, RBAC, session management, validation).
  - Student provisioning, temporary credential exports, and activation workflows.
  - Three independent attendance streams and live attendance console.
  - Responsive vanilla HTML/CSS/JS frontend portals (Admin, Faculty, Student).
  - ESP32 webhook integration, deduplication, and reports engine.
- **Phase 2: API Stabilization, Security & Testing**
  - Cross-browser QA, automated endpoint integration tests, rate limit benchmarking, and penetration review.
- **Phase 3: React Native Mobile Application**
  - Dedicated Student and Teacher mobile apps consuming the existing `/api/v1/` REST API.
- **Phases 4–7: Future Academic Modules**
  - Incremental addition of Assignments, Test Scores, Study Material, Timetable, Notices, Calendar, and Performance Analytics.
- **Phase 8: Future UIAP Integration**
  - Packaging the verified Attendance Web System into a standardized UIAP signed module bundle.
