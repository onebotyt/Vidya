# VidyaOS System Architecture: What We Built, System Run Dependencies & Dead Code Cleanup Registry

> **DOCUMENT PURPOSE**: 
> This document provides an authoritative record of:
> 1. **Everything that was recently built & redesigned** (Faculty & Student Decoupling, Minimal Mobile UI/UX, Trash Bin System with 30-Day Auto-Purge, Transfer/Withdraw Workflow with Permanent Document Preservation, and Classroom Enhancements).
> 2. **Complete Code & Runtime Dependency Manifest**: The exact files, backend routes, models, database schemas, and frontend components required to run the entire system. Any file on this list **MUST NOT BE REMOVED** during dead code cleanup.
> 3. **The Dead Code & Legacy Pruning List**: Safe candidates for deprecation and removal (such as the legacy 300KB unified register and old duplicate files).

---

## 🚀 1. What We Have Made (Recent Milestones & Upgrades)

### A. Decoupled Faculty & Student Management Architecture
- **Separation of Concerns**: Split Faculty Roster (`/faculty/faculty/index.html`) and Student Roster (`/faculty/students/index.html`) into two independent, ultra-fast, focused modules.
- **Minimal, Ultra-Compact Mobile-First UI/UX**:
  - **Desktop View**: Shows streamlined columns (Roll #, Enrollment, Name, Cohort, Attendance, Actions).
  - **Mobile View (<= 412px)**: Reduced to essential columns only (`Roll #`, `Student Name`, `Actions`). Role and Employee ID are cleanly omitted from cards to avoid visual clutter and prevent horizontal overflow.
  - Zero horizontal scroll; 100% theme token compliant (`var(--...)` variables from `variables.css`).

### B. 3-Dot (Kebab) Dropdown Action Menus
- Replaced wide inline buttons with a compact 3-dot kebab menu on every row/card.
- Dynamic upward/downward flip positioning (`flip-up`) to ensure menus never get cut off at the bottom of the viewport.
- Faculty Actions: **View Details** (Full dossier modal), **Reset Password**, **Move to Trash**.
- Student Actions: **View Details** (Academic dossier), **Transfer Student**, **Withdraw Student**, **Move to Trash**, **Restore / Re-Active**.

### C. Type-to-Confirm Modal Security (`window.openDeleteModal`)
- Reusable confirmation modal in `shared-delete-modal.js`.
- Requires the user to explicitly type the target keyword (`remove`, `transfer`, or `withdraw`) in a text box before the action button unlocks.
- Explains consequences clearly (e.g. informing that transfer/withdraw does NOT delete data, but moves the student to inactive status with permanent document accessibility).

### D. Trash Bin System & 30-Day Auto-Purge
- **Soft Deletion**: Moving faculty or students to trash marks them with `deleted_at = NOW()` and `status = 'inactive'`.
- **Trash Bin Page (`/faculty/trash/index.html`)**: Allows administrators and HODs to view trashed records, inspect metadata, and restore them with one click within 30 days without data loss.
- **30-Day Cleanup Automation**: Automated backend routine purges records whose `deleted_at` is older than 30 days (`WHERE deleted_at < NOW() - INTERVAL 30 DAY`).

### E. Transfer & Withdrawal Workflow with Permanent Document Preservation
- Transferred and withdrawn students have their status updated to `'transferred'` or `'withdrawn'`.
- All student academic documents, test marks, assignment submissions, and attendance logs remain permanently coupled to the student's ID in `student_documents` and `assessment_submissions`.
- Faculty can access these documents and records at any time via the Student Records / Dossier modal.

### F. Student Portal Comprehensive Upgrade & Complete Dead/Duplicate Code Elimination
- **Dead & Duplicate Code Cleanup (267.2 KB / ~6,500 lines pruned)**:
  - Pruned 8 legacy duplicate flat `.html` files in `frontend/student/` (`assignments/assignments.html`, `attendance/attendance.html`, `dashboard/dashboard.html`, `group-detail/group-detail.html`, `leave/leave.html`, `profile/profile.html`, `scores/scores.html`, and `timetable/timetable.html`).
  - Pruned 5 orphaned components in `frontend/student/components/`: `components/dossier/` (`dossier.js`, `dossier.css`) and `components/delete-modal/` (`delete-modal.js`, `delete-modal.css`, `delete-modal.html`).
  - Pruned dead NBA accreditation links (`/student/nba/index.html`) across student navigation, headers, and drawers.
  - Standardized all navigation links and redirects across all student modules to canonical `/student/.../index.html` structure.
- **Student Dashboard (`/student/dashboard/index.html`)**:
  - Upgraded classroom cards to render `subject_short_name` (e.g. `DBMS`), `subject_code`, `component` (`THEORY`, `PRACTICAL`, `THEORY+PRACTICAL`), semester, and academic year.
- **Student Scores Module (`/student/scores/index.html`)**:
  - Multi-semester filter pills (`All Semesters`, `Sem 1` through `Sem 6`) with horizontal smooth scrolling container.
  - Assessment type filter pills (`All Assessments`, `Exams & Tests`, `Assignments`) with live counts and search input.
  - Decoupled marks model: queries `/api/v1/students/me/dossier` to fetch and render persistent assessment scores even after classrooms are deleted at semester end.
  - Mobile compact layout with responsive cards (<= 412px, zero horizontal overflow).
- **Student Profile & Self-Service Academic Dossier (`/student/profile/index.html`)**:
  - Full demographic dossier: Official Enrollment No, UBTER Reg No, Class Roll No, Father's Name, Mother's Name, Aadhar Number, DOB, Gender, Category, Mobile Phone, Residential Address, and dynamic Academic Batch (`Batch 2024 - 2027`).
  - Self-Service Academic Dossier Export Toolbar: Print/PDF (formal transcript), Excel .csv (demographics + attendance summary + assessment ledger), and Word .doc (formatted institutional document).
  - Verified Student Certificates & Documents section: queries `/api/v1/students/me/documents` to display verified certificates on file with download/view links.

### F. Classroom Creation Schema Enhancements (Database Migration 011)
- Added `subject_short_name VARCHAR(50)` to `teaching_groups` (e.g., `DBMS`, `OS`, `CN`).
- Added `year INT` to `teaching_groups` (auto-derived as `Math.ceil(semester / 2)`).
- Supported 4 component types: `THEORY`, `PRACTICAL`, `THEORY+PRACTICAL`, `TUTORIAL`.
- Coupled classrooms to `session_id` (`academic_year_id`), `year`, and `semester`.

---

## 🛡️ 2. RUNTIME CODE DEPENDENCY MANIFEST (DO NOT REMOVE)

The following files and components are **MANDATORY** to run the VidyaOS application. When performing dead code cleanup, **DO NOT REMOVE OR BREAK ANY OF THESE**:

### A. Frontend Core & Shared Assets
| File Path | Purpose | Why It Cannot Be Removed |
| :--- | :--- | :--- |
| `frontend/components/core/variables.css` | Global Design Tokens | Contains all CSS variables (`--bg-primary`, `--primary-color`, etc.) for theme compliance. |
| `frontend/components/core/api.js` | API Wrapper | Universal authenticated fetch handler with automatic JWT token refresh. |
| `frontend/components/core/auth.js` | Authentication & RBAC | Manages session, tokens, user info, role checks (`guardRoute`). |
| `frontend/components/core/shared-delete-modal.js` | Type-to-Confirm Modal | Provides the required `window.openDeleteModal` used by faculty, students, and trash bin. |
| `frontend/components/core/shared-delete-modal.css` | Modal Styling | Theme-compliant styling for type-to-confirm dialogs. |
| `frontend/components/core/exceljs.min.js` | Excel Generation Library | Powers client-side `.xlsx` spreadsheet generation for single and cohort records export. |
| `frontend/components/sidebar/sidebar.html` | Navigation Rail & Drawer | Master navigation sidebar across all faculty and admin pages. |
| `frontend/components/sidebar/sidebar.js` | Sidebar Controller | Manages collapsed rail, flyout drawer, active link indicators, and mobile drawer. |
| `frontend/components/header/header.html` | Universal Header | Institutional branding, profile pill, dark/light theme toggle, notifications. |
| `frontend/components/header/header.js` | Header Controller | Theme toggle state and user session displays. |

### B. Frontend Feature Pages (Active)
| File Path | Module | Functionality |
| :--- | :--- | :--- |
| `frontend/faculty/index.html` & `faculty.js`, `faculty.css` | Faculty Roster | Decoupled faculty management, add faculty modal, 3-dot kebab menu. |
| `frontend/students/index.html` & `students.js`, `students.css` | Student Roster | Decoupled student management, compact mobile columns, transfer/withdraw dialogs. |
| `frontend/trash/index.html` & `trash.js`, `trash.css` | Trash Bin | 30-day soft-delete trash bin with single-click restore and purge count badges. |
| `frontend/student-records/index.html` & `records.js`, `records.css` | **Student Records** | Replaces Unified Register. Filter by Session/Year/Sem/Batch, view full dossier, multi-format export (PDF/DOC/Excel). |
| `frontend/classes/index.html` & `classes.js`, `classes.css` | Classrooms | Classroom cards, upgraded Create Class modal (Subject, Short Name, Code, Component, Session, Sem, Year). |
| `frontend/drive/index.html` & `drive.js`, `drive.css` | Faculty Drive | Cloud storage repository for teacher documents, assignments, and media assets. |
| `frontend/dashboard/index.html` | Faculty Dashboard | Overview metrics, quick actions, schedule, notifications. |
| `frontend/timetable/index.html` | Timetable Schedule | Weekly lecture scheduling and classroom slot mappings. |
| `frontend/leave/index.html` | Leave Management | Faculty leave applications, approvals, and balance tracking. |

### C. Backend API Routes & Controllers
| Route Endpoint | Controller | File Paths | Purpose |
| :--- | :--- | :--- | :--- |
| `/api/v1/auth` | `authController.js` | `src/routes/auth.js`, `src/controllers/authController.js` | User login, JWT generation, password resets. |
| `/api/v1/hod` | `hodController.js` | `src/routes/hod.js`, `src/controllers/hodController.js` | Faculty/student rosters, self-registration toggle, transfer/withdraw, trash bin operations. |
| `/api/v1/student-records` | `studentRecordController.js` | `src/routes/studentRecords.js`, `src/controllers/studentRecordController.js` | Student records querying, dossier compilation, multi-semester marks/attendance aggregation. |
| `/api/v1/teaching-groups` | `teachingGroupController.js` | `src/routes/teachingGroups.js`, `src/controllers/teachingGroupController.js` | Classroom creation with 7 parameters, student enrollment, classroom safe cleanup. |
| `/api/v1/media` | `mediaController.js` | `src/routes/media.js`, `src/controllers/mediaController.js` | Faculty Drive document upload, file storage, and streaming. |
| `/api/v1/assessments` | `assessmentController.js` | `src/routes/assessments.js`, `src/controllers/assessmentController.js` | Class tests, assignments, student grading submissions. |
| `/api/v1/attendance` | `attendanceController.js` | `src/routes/attendance.js`, `src/controllers/attendanceController.js` | Live attendance sessions, QR/PIN roll call, ESP32 biometric synchronization. |

### D. Backend Models & Data Layer
| Model File | Associated Tables | Critical Invariants |
| :--- | :--- | :--- |
| `src/models/hodModel.js` | `faculty`, `students`, `departments`, `student_documents` | Handles faculty/student lifecycle, trash bin, transfer, withdrawal. |
| `src/models/studentRecordModel.js` | `students`, `assessment_submissions`, `register_attendance`, `student_documents` | Aggregates all student historical data across semesters for the Records dossier. |
| `src/models/teachingGroupModel.js` | `teaching_groups`, `teaching_group_students` | Manages classrooms without deleting underlying student assessment submissions upon classroom cleanup. |
| `src/models/assessmentModel.js` | `assessments`, `assessment_submissions` | Stores marks, exam results, assignments permanently coupled to `student_id`. |
| `src/models/attendanceModel.js` | `attendance_sessions`, `register_attendance` | Stores attendance sessions and per-student presence permanently coupled to `student_id`. |

### E. Database Tables & Critical Columns
1. **`students`**: `id`, `user_id`, `department_id`, `admission_year`, `graduation_year`, `current_semester`, `class_roll_no`, `official_enrollment_no`, `registration_no`, `full_name`, `father_name`, `mother_name`, `dob`, `gender`, `category`, `aadhar_number`, `address`, `phone`, `status` (`'active'`, `'inactive'`, `'transferred'`, `'withdrawn'`), `deleted_at`.
2. **`faculty`**: `id`, `user_id`, `department_id`, `employee_id`, `designation`, `deleted_at`.
3. **`teaching_groups`**: `id`, `name`, `subject_name`, `subject_short_name`, `subject_code`, `component`, `academic_year_id`, `department_id`, `year`, `semester`, `invite_code`, `status`.
4. **`student_documents`**: `id`, `student_id`, `department_id`, `title`, `document_type`, `file_path`, `file_name`, `file_size`, `uploaded_by`, `uploader_name`, `created_at`.
5. **`assessment_submissions`**: `id`, `assessment_id`, `student_id`, `marks_obtained`, `status`, `submitted_at`.
6. **`register_attendance`**: `id`, `session_id`, `student_id`, `status` (`'P'`, `'A'`, `'L'`).
7. **`faculty_media_assets`**: `id`, `faculty_id`, `file_path`, `title`, `created_at`.

---

## 🗑️ 3. DEAD CODE & LEGACY ASSETS SCHEDULED FOR REMOVAL / RETIREMENT

The following files represent obsolete, monolithic, or duplicate code that is safe to remove or replace with minimal redirects:

| Legacy Path | File Size | Why It Is Dead / Legacy | Action to Take |
| :--- | :--- | :--- | :--- |
| `faculty/registers/index.html` | ~110 KB | Monolithic unified register interface replaced by modular `student-records` | Replace with instant client-side `<script>` redirect to `/faculty/student-records/index.html` |
| `faculty/registers/registers.js` | ~186 KB | Monolithic 4,800+ lines of old code tightly coupling registers to obsolete models | Retire / remove file |
| `faculty/registers/registers.css` | ~15 KB | Monolithic register styling | Retire / remove file |
| `assignments.html` (legacy roots) | Varies | Replaced by classroom coursework tab and faculty drive | Ensure redirect to `/faculty/classes/index.html` |
| `marks.html` (legacy roots) | Varies | Replaced by student records dossier & assessments | Ensure redirect to `/faculty/student-records/index.html` |
| `quick.html` (legacy roots) | Varies | Replaced by Live QR & Roll Call Modal | Redirect to `/faculty/student-records/index.html` |
| `frontend/student/*/*.html` (duplicate files) | ~170 KB | 8 duplicate legacy flat files matching directory names (e.g. `assignments.html` inside `assignments/`) | Pruned completely; canonical `index.html` retained |
| `frontend/student/components/dossier/` | ~34 KB | Orphaned experimental dossier files (`dossier.js`, `dossier.css`) | Removed completely |
| `frontend/student/components/delete-modal/` | ~39 KB | Orphaned modal duplicate in student components | Removed completely |
| `frontend/student/nba/index.html` (dead link) | - | 404 dead link in navigation | Removed from sidebar and headers |
| `frontend/faculty/{direct-assessment, indirect-assessment, lab-classes, theory-classes, student-performance, assessment-process}` | ~130 KB (aggregate) | Redundant standalone redirect folders superseded by unified `/faculty/course-file/index.html` | Pruned directories from disk; replaced with server-side 301 redirects in `backend/server.js`, `frontend/server.js`, and `vercel.json` |

---

## ⚡ 4. Code Health & Protection Rules

1. **Never Purge Student Coupled Data**: Even when deleting a class or moving a student to transfer/withdrawn/trash, their `assessment_submissions`, `register_attendance`, and `student_documents` remain intact.
2. **Never Write Hardcoded Color Hexes**: Every UI element must use `var(--...)` tokens.
3. **Always Check Keep-List Before Cleanup**: When deleting dead files, verify against Section 2 above to ensure no required script, style, route, or model is touched.
