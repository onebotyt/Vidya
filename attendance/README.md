# College Attendance System — Documentation Suite

> **Location:** `docs/attendance/`  
> **Target Deployment:** Local-First Windows Edge Server (College Main PC / Server)  
> **Backend Architecture:** Single Express.js REST API (`/api/v1/`) + On-Premise MySQL 8.x DB  
> **Client Interfaces:** Web Frontend (HTML/CSS/Vanilla JS) & Future React Native Mobile Apps

---

## 1. Documentation Map & Reading Guide

This directory contains the authoritative specifications, requirements, architecture designs, and API contracts for the College Attendance System.

| Document | Identifier / Filename | Purpose & Target Scope | Status |
|---|---|---|---|
| **Web System SRS** | [`01_ATTENDANCE_WEB_SRS.md`](01_ATTENDANCE_WEB_SRS.md) | Authoritative requirements for the Attendance Web System (Node/Express backend, MySQL schema, vanilla frontend, 3 streams, provisioning, ESP32). | **CURRENT IMPLEMENTATION BASELINE** |
| **Mobile App SRS** | [`02_ATTENDANCE_MOBILE_APP_SRS.md`](02_ATTENDANCE_MOBILE_APP_SRS.md) | Future React Native mobile application SRS for Student & Teacher apps (strictly consumes the same `/api/v1/` REST API). | **FUTURE SCOPE (Phase 3)** |
| **Academic Modules SRS**| [`03_FUTURE_ACADEMIC_MODULES_SRS.md`](03_FUTURE_ACADEMIC_MODULES_SRS.md) | Forward-looking specifications & conceptual schemas for Assignments, Test Scores, Study Material, Timetable, Notices, Calendar, Exam Schedule, and Performance Analytics. | **FUTURE SCOPE (Phases 4–7)** |
| **Shared API Contract** | [`04_API_CONTRACT.md`](04_API_CONTRACT.md) | Unified REST API interface contract (`/api/v1/`) shared across Web Frontend, Student Mobile App, and Teacher Mobile App. | **CURRENT & PLANNED CONTRACT** |
| **Database Schema & ERD**| [`DATABASE_SCHEMA_AND_ERD.md`](DATABASE_SCHEMA_AND_ERD.md) | Complete MySQL 8.x entity-relationship diagram, table catalogs, foreign keys, and integrity constraints. | **SCHEMA REFERENCE** |
| **API Detailed Spec** | [`API_CONTRACT_SPECIFICATION.md`](API_CONTRACT_SPECIFICATION.md) | Low-level endpoint payload schemas, query parameters, error envelopes, and transaction boundaries. | **DETAILED API SPEC** |
| **Unified System Blueprint**| [`ATTENDANCE_SYSTEM_PLAN.md`](ATTENDANCE_SYSTEM_PLAN.md) | Complete original unified reference blueprint and architectural decision records. | **ARCHITECTURAL REFERENCE** |

---

## 2. Core Architectural Invariants

Every document in this suite strictly adheres to the following foundational rules:

1. **Single Backend & Database:**
   - There is **one backend** (Node.js/Express) and **one database** (MySQL 8.x).
   - Web and Mobile apps consume the identical `/api/v1/` REST API. There is no separate mobile backend or secondary database.
2. **Cohort Definition:**
   - The system does not use an arbitrary `classes` table.
   - A student group is deterministically defined as:
     $$\textbf{Cohort} = \textbf{Department} + \textbf{Branch} + \textbf{Year} + \textbf{Semester} + \textbf{Academic Year}$$
3. **Dual Identifiers & Username Parity:**
   - `official_enrollment_no` (in `students`): Permanent university ID, globally unique.
   - `class_roll_no` (in `enrollments`): Cohort-internal ordering, unique per cohort per academic year.
   - For all student accounts: $\textbf{users.username} = \textbf{students.official\_enrollment\_no}$.
4. **Three Independent Attendance Streams:**
   - **Stream 1:** `esp32_presence` (Raw physical biometric scans, `UNIQUE(event_id)`).
   - **Stream 2:** `register_attendance` (Teacher's official register: `PRESENT`, `ABSENT`, `LATE`; `source`: `MANUAL`, `ESP32_SYNC`, `SELF_REQUEST`).
   - **Stream 3:** `student_self_attendance` (Student soft requests: `BUTTON`, `PIN`, `QR`; `PENDING` until teacher accepts).
   - Streams are never automatically merged or overwritten. The Teacher Register is the sole institutional authority.
5. **Session Lifecycle & Data Integrity:**
   - States: `DRAFT` $\rightarrow$ `OPEN` $\rightarrow$ `CLOSED` $\rightarrow$ `FINALIZED`.
   - Cohort roster is frozen at session creation in `attendance_session_students`.
   - Auto-close timer (`auto_close_at`) transitions `OPEN` $\rightarrow$ `CLOSED` only (never auto-finalizes).
   - Universal marking invariant: All included students must have an explicit status (`PRESENT`, `ABSENT`, or `LATE`) before `FINALIZED`.
6. **Official Calculations & Predictive Formulas:**
   - Official Attendance: $\frac{\text{count}(\text{PRESENT}) + \text{count}(\text{LATE})}{\text{Finalized Sessions Included}} \times 100$.
   - Safe absences formula: $X = \lfloor (P - T \cdot C) / T \rfloor$.
   - Recovery classes formula: $Y = \lceil (T \cdot C - P) / (1 - T) \rceil$.
7. **Attendance Isolation Boundary:**
   - Future academic modules may **READ** finalized attendance records for analytics, but **MUST NEVER modify** attendance tables.

---

## 3. Recommended Reading Order

1. Start with [`01_ATTENDANCE_WEB_SRS.md`](01_ATTENDANCE_WEB_SRS.md) to understand current implementation requirements.
2. Inspect [`DATABASE_SCHEMA_AND_ERD.md`](DATABASE_SCHEMA_AND_ERD.md) and [`04_API_CONTRACT.md`](04_API_CONTRACT.md) for backend contract details.
3. Review [`02_ATTENDANCE_MOBILE_APP_SRS.md`](02_ATTENDANCE_MOBILE_APP_SRS.md) and [`03_FUTURE_ACADEMIC_MODULES_SRS.md`](03_FUTURE_ACADEMIC_MODULES_SRS.md) for roadmap planning.

---

## 4. Engineering Team Role Guides

For team task distribution, dedicated execution manuals have been prepared in [`roles/`](roles/README.md):

| Member Role | Guide Document | Focus & Scope |
|---|---|---|
| **1. Front-End Developer** | [`roles/01_FRONTEND_DEVELOPER.md`](roles/01_FRONTEND_DEVELOPER.md) | Web UI/UX, Semantic HTML5, CSS design tokens, Vanilla JS, Portals (Student, Faculty, Admin), Live Console. |
| **2. Back-End Developer** | [`roles/02_BACKEND_DEVELOPER.md`](roles/02_BACKEND_DEVELOPER.md) | Express REST API (`/api/v1/`), dynamic scoped RBAC, session state machine, auto-close cron, webhook ingestion. |
| **3. Application Developer** | [`roles/03_APPLICATION_DEVELOPER.md`](roles/03_APPLICATION_DEVELOPER.md) | React Native Mobile App (Student & Teacher), camera QR scanner, device biometrics, ESP32 IoT protocol. |
| **4. Database Designer** | [`roles/04_DATABASE_DESIGNER.md`](roles/04_DATABASE_DESIGNER.md) | MySQL 8.x schema, 25-table DDL, InnoDB optimization, indexes, foreign keys, and automated daily backups. |

