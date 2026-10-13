# College Attendance System — Future Academic Modules SRS

> **Document Type:** Software Requirements Specification (SRS) & Architectural Roadmap  
> **Document Identifier:** `docs/03_FUTURE_ACADEMIC_MODULES_SRS.md`  
> **Version:** 1.0.0 (Forward-Looking Design Specification)  
> **Implementation Status:** FUTURE ROADMAP (Phases 4–7) — NOT IMPLEMENTED IN CURRENT PHASE  
> **Mandatory Architectural Rule:** DO NOT IMPLEMENT THESE MODULES NOW.  
> The purpose of this document is to design future academic capabilities so they can be integrated seamlessly without requiring architectural redesigns, schema overhauls, or identity bifurcations.

---

## 1. Architectural Principles & Common Foundation

### 1.1 The Single Source of Truth Invariant
All future academic extensions must integrate directly into the existing monolithic Node.js/Express backend and on-premise MySQL database.

```
                    ┌────────────────────────────────────────┐
                    │            Shared MySQL DB             │
                    │   (Core Entities + Academic Tables)    │
                    └───────────────────▲────────────────────┘
                                        │
                                        │ mysql2 pool
                                        │
                    ┌───────────────────┴────────────────────┐
                    │          Express.js REST API           │
                    │             (/api/v1/*)                │
                    │      Unified Routing & RBAC Engine     │
                    └───────────▲────────────────▲───────────┘
                                │                │
                                │                │
             ┌──────────────────┴──┐          ┌──┴──────────────────┐
             │    Web Frontend     │          │    React Native     │
             │   (HTML5/CSS/JS)    │          │     Mobile App      │
             └─────────────────────┘          └─────────────────────┘
```

### 1.2 Mandatory Common Entity Reuse
Future academic modules are strictly prohibited from creating separate user accounts, duplicate student/teacher tables, or alternative academic hierarchies. All academic modules must bind directly to the existing core foundation:

| Core Entity | Existing Table | Role in Future Academic Modules |
|---|---|---|
| **User Identity** | `users` | Single authentication, password management, and role authority |
| **System Roles** | `user_roles` | Core authorization (`SYSTEM_ADMIN`, `TEACHER`, `STUDENT`) |
| **Student Identity**| `students` | Master student profiles, `official_enrollment_no` identity |
| **Faculty Identity**| `teachers` | Master faculty profiles, employee identifiers |
| **Departments** | `departments` | Department-level scoping for courses, notices, and calendars |
| **Branches** | `branches` | Branch degree classifications (B.Tech, Diploma, BCA, etc.) |
| **Academic Years**| `academic_years`| Universal temporal scoping (e.g., `2026-27`) |
| **Subjects** | `subjects` | Master syllabus catalog linked to assignments, tests, and study files |
| **Cohort Enrollments**| `enrollments` | Active cohort memberships and `class_roll_no` class order |
| **Teacher Scopes** | `teacher_assignments` | Academic permissions (`SUBJECT_TEACHER`, `CLASS_TEACHER`, `HOD`) |

> **Architectural Law:**  
> A student submitting an assignment or checking a test score is the exact same student identity that marks attendance.  
> A teacher grading an exam or posting study notes is authenticated and authorized through the exact same `teacher_assignments` engine.

### 1.3 Strict Attendance Isolation Rule
> **Crucial Data Integrity Boundary:**  
> The Attendance System (`register_attendance`, `attendance_sessions`, `esp32_presence`) is the permanent institutional authority on attendance.  
> Future academic modules (such as Assignments, Test Scores, or Student Performance Analytics) **MAY READ** finalized attendance data for analytics, composite grading, or threshold correlation.  
> **Under NO circumstances may any academic module modify, delete, insert, or override records in the attendance tables.**

---

## 2. Module 1: Assignments (Phase 4 Roadmap)

> **Designation:** FUTURE DESIGN / PLANNED FOR PHASE 4 — NOT IMPLEMENTED

### 2.1 Overview & Functional Purpose
The Assignments module enables subject teachers to publish coursework, attach instruction materials, set submission deadlines, collect digital student work, evaluate submissions, assign numerical marks, and provide qualitative feedback.

### 2.2 Teacher Capabilities & Workflows
1. **Assignment Creation:**
   - Teacher selects an assigned subject and cohort from active `teacher_assignments`.
   - Inputs: Assignment Title, Rich-text Description / Instructions, Maximum Marks (e.g., 10 or 20).
   - Dates: Publish Timestamp (can be scheduled for future release) and Due Date / Deadline Timestamp.
   - Configuration Flags: `allow_late_submissions` (boolean), `max_file_size_mb`, `allowed_mime_types` (PDF, ZIP, DOCX).
   - File Attachments: Upload assignment problem statements, reference question sheets, or sample datasets.
2. **Assignment Lifecycle Management:**
   - Edit active assignments (updating instructions or extending deadlines).
   - Close assignment manually to halt all further submissions.
3. **Submission Review & Grading Console:**
   - Displays real-time student submission roster sorted by `class_roll_no`.
   - Status indicators: `SUBMITTED`, `SUBMITTED_LATE`, `PENDING_REVIEW`, `GRADED`, `MISSING`.
   - Download individual or bulk ZIP archives of student submissions.
   - Grading interface: Enter numerical score ($\le \text{max\_marks}$) and detailed feedback comments.
   - Publish grades to student portal.

### 2.3 Student Capabilities & Workflows
1. **Assignment Feed:**
   - Filterable view of assignments across enrolled subjects.
   - Filter tabs: `Upcoming / Due`, `Submitted`, `Graded & Evaluated`.
   - Visual urgency indicators (e.g., *"Due in 6 hours"*, *"Past Due"*).
2. **Assignment Detail & Download:**
   - Read full assignment instructions and download teacher's reference attachments.
3. **Submission Upload:**
   - Upload coursework files (single or multi-file within configured size limits).
   - Option to replace/update submission prior to the deadline.
4. **Grade & Feedback Inspection:**
   - View awarded marks, teacher feedback remarks, and evaluation timestamps once published.

### 2.4 Suggested Conceptual Entities
```sql
-- [FUTURE DESIGN - NOT IMPLEMENTED]
CREATE TABLE assignments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  teacher_id INT NOT NULL,
  subject_id INT NOT NULL,
  department_id INT NOT NULL,
  branch_id INT NOT NULL,
  year INT NOT NULL,
  semester INT NOT NULL,
  academic_year_id INT NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  max_marks DECIMAL(5,2) NOT NULL DEFAULT 10.00,
  due_date DATETIME NOT NULL,
  allow_late_submission BOOLEAN NOT NULL DEFAULT FALSE,
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (teacher_id) REFERENCES teachers(id),
  FOREIGN KEY (subject_id) REFERENCES subjects(id),
  FOREIGN KEY (department_id) REFERENCES departments(id),
  FOREIGN KEY (branch_id) REFERENCES branches(id),
  FOREIGN KEY (academic_year_id) REFERENCES academic_years(id)
);

CREATE TABLE assignment_attachments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  assignment_id INT NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_size_bytes INT NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE CASCADE
);

CREATE TABLE assignment_submissions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  assignment_id INT NOT NULL,
  student_id INT NOT NULL,
  enrollment_id INT NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_size_bytes INT NOT NULL,
  is_late BOOLEAN NOT NULL DEFAULT FALSE,
  status ENUM('SUBMITTED', 'EVALUATED') NOT NULL DEFAULT 'SUBMITTED',
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(id),
  FOREIGN KEY (enrollment_id) REFERENCES enrollments(id),
  UNIQUE KEY uq_assignment_student (assignment_id, student_id)
);

CREATE TABLE assignment_grades (
  id INT AUTO_INCREMENT PRIMARY KEY,
  submission_id INT NOT NULL UNIQUE,
  graded_by INT NOT NULL,
  marks_awarded DECIMAL(5,2) NOT NULL,
  feedback TEXT NULL,
  graded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (submission_id) REFERENCES assignment_submissions(id) ON DELETE CASCADE,
  FOREIGN KEY (graded_by) REFERENCES teachers(id)
);
```

---

## 3. Module 2: Test Scores & Marks (Phase 4 Roadmap)

> **Designation:** FUTURE DESIGN / PLANNED FOR PHASE 4 — NOT IMPLEMENTED

### 3.1 Overview & Functional Purpose
The Test Scores module manages the recording, tabulation, and publication of internal examination marks, practical assessments, unit tests, quizzes, and mid-term evaluations.

### 3.2 Teacher Capabilities & Workflows
1. **Test Instance Creation:**
   - Teacher selects subject and cohort from active `teacher_assignments`.
   - Attributes: Test Title (e.g., *"Unit Test 1"*, *"Mid-Term Exam"*), Test Type (`UNIT_TEST`, `MID_TERM`, `PRACTICAL_EXAM`, `QUIZ`, `FINAL_INTERNAL`).
   - Parameters: Conducted Date, Maximum Marks (e.g., 30, 50, 100), Passing Marks (e.g., 12, 20, 40).
2. **Marks Entry Grid:**
   - High-efficiency matrix pre-populated with cohort students sorted by `class_roll_no`.
   - Rapid keyboard navigation for numerical score entry.
   - Supports special status flags: `ABSENT`, `MEDICAL_EXCUSE`, `DISQUALIFIED`.
   - Batch import via CSV template (`Roll No | Official Enrollment No | Marks`).
3. **Publication Control:**
   - Results remain in `DRAFT` state until verified by the teacher.
   - Teacher clicks **[Publish Results]** to make marks visible on student web and mobile portals.

### 3.3 Student Capabilities & Workflows
1. **Academic Performance View:**
   - View published test scores categorized by subject and examination type.
   - Shows: Marks Obtained / Maximum Marks, Percentage, Pass/Fail status.
2. **Comparative Class Metrics:**
   - Anonymized aggregate insights: Class Highest Score, Class Average Score, Class Lowest Score.
   - Historical trend graph across consecutive unit tests.

### 3.4 Suggested Conceptual Entities
```sql
-- [FUTURE DESIGN - NOT IMPLEMENTED]
CREATE TABLE tests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  teacher_id INT NOT NULL,
  subject_id INT NOT NULL,
  department_id INT NOT NULL,
  branch_id INT NOT NULL,
  year INT NOT NULL,
  semester INT NOT NULL,
  academic_year_id INT NOT NULL,
  test_name VARCHAR(150) NOT NULL,
  test_type ENUM('UNIT_TEST', 'MID_TERM', 'PRACTICAL_EXAM', 'QUIZ', 'FINAL_INTERNAL') NOT NULL,
  test_date DATE NOT NULL,
  max_marks DECIMAL(5,2) NOT NULL,
  passing_marks DECIMAL(5,2) NOT NULL,
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (teacher_id) REFERENCES teachers(id),
  FOREIGN KEY (subject_id) REFERENCES subjects(id),
  FOREIGN KEY (department_id) REFERENCES departments(id),
  FOREIGN KEY (branch_id) REFERENCES branches(id),
  FOREIGN KEY (academic_year_id) REFERENCES academic_years(id)
);

CREATE TABLE test_scores (
  id INT AUTO_INCREMENT PRIMARY KEY,
  test_id INT NOT NULL,
  student_id INT NOT NULL,
  enrollment_id INT NOT NULL,
  marks_obtained DECIMAL(5,2) NULL,             -- NULL if absent
  is_absent BOOLEAN NOT NULL DEFAULT FALSE,
  remarks VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (test_id) REFERENCES tests(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(id),
  FOREIGN KEY (enrollment_id) REFERENCES enrollments(id),
  UNIQUE KEY uq_test_student (test_id, student_id)
);
```

---

## 4. Module 3: Study Material & Digital Repository (Phase 5 Roadmap)

> **Designation:** FUTURE DESIGN / PLANNED FOR PHASE 5 — NOT IMPLEMENTED

### 4.1 Overview & Functional Purpose
A centralized digital repository allowing faculty to distribute lecture slides, PDF notes, laboratory manuals, reference question banks, and course syllabi directly to enrolled cohort students.

### 4.2 Teacher Capabilities & Workflows
- Upload digital educational assets with title, description, and category tags:
  - Categories: `LECTURE_NOTES`, `SYLLABUS`, `LAB_MANUAL`, `QUESTION_BANK`, `REFERENCE_SLIDES`.
- Bind materials to a specific subject and cohort.
- Publish/Unpublish toggle allowing teachers to prepare resources in advance.

### 4.3 Student Capabilities & Workflows
- Browse study resources filtered by subject.
- Search documents by title or topic keywords.
- In-browser PDF preview and local file download.

### 4.4 Suggested Conceptual Entities
```sql
-- [FUTURE DESIGN - NOT IMPLEMENTED]
CREATE TABLE study_material (
  id INT AUTO_INCREMENT PRIMARY KEY,
  teacher_id INT NOT NULL,
  subject_id INT NOT NULL,
  department_id INT NOT NULL,
  branch_id INT NOT NULL,
  year INT NOT NULL,
  semester INT NOT NULL,
  academic_year_id INT NOT NULL,
  title VARCHAR(200) NOT NULL,
  category ENUM('LECTURE_NOTES', 'SYLLABUS', 'LAB_MANUAL', 'QUESTION_BANK', 'REFERENCE_SLIDES') NOT NULL,
  description TEXT NULL,
  is_published BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (teacher_id) REFERENCES teachers(id),
  FOREIGN KEY (subject_id) REFERENCES subjects(id),
  FOREIGN KEY (department_id) REFERENCES departments(id),
  FOREIGN KEY (branch_id) REFERENCES branches(id),
  FOREIGN KEY (academic_year_id) REFERENCES academic_years(id)
);

CREATE TABLE study_material_files (
  id INT AUTO_INCREMENT PRIMARY KEY,
  material_id INT NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_size_bytes INT NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (material_id) REFERENCES study_material(id) ON DELETE CASCADE
);
```

---

## 5. Module 4: Timetable & Scheduling Matrix (Phase 5 Roadmap)

> **Designation:** FUTURE DESIGN / PLANNED FOR PHASE 5 — NOT IMPLEMENTED

### 5.1 Overview & Functional Purpose
Maintains the weekly recurring lecture schedule for every cohort and faculty member. Acts as the institutional schedule backbone for both students and teachers.

### 5.2 Functional Specifications
- **Institutional Master Timetable:**
  - Configured by HOD or System Admin.
  - Matrix defined across Days of the Week (Monday through Saturday).
  - Time slots: Start time (e.g., `09:00:00`) to End time (e.g., `10:00:00`).
  - Allocated parameters: Subject, Assigned Teacher, Cohort, Classroom/Laboratory Room number.
- **Automated Conflict Detection:**
  - Prevents teacher double-booking across different cohorts at the same time slot.
  - Prevents room collision (two classes assigned to the same physical room simultaneously).
- **Portal Views:**
  - **Student View:** Weekly interactive timetable grid + "Today's Lectures" banner on mobile/web dashboard.
  - **Teacher View:** Faculty personalized teaching schedule highlighting current and upcoming classes.

### 5.3 Suggested Conceptual Entities
```sql
-- [FUTURE DESIGN - NOT IMPLEMENTED]
CREATE TABLE classrooms (
  id INT AUTO_INCREMENT PRIMARY KEY,
  room_number VARCHAR(50) NOT NULL UNIQUE,
  building VARCHAR(100) NOT NULL,
  capacity INT NOT NULL DEFAULT 60,
  room_type ENUM('LECTURE_HALL', 'LABORATORY', 'SEMINAR_ROOM') NOT NULL DEFAULT 'LECTURE_HALL'
);

CREATE TABLE timetable_slots (
  id INT AUTO_INCREMENT PRIMARY KEY,
  academic_year_id INT NOT NULL,
  department_id INT NOT NULL,
  branch_id INT NOT NULL,
  year INT NOT NULL,
  semester INT NOT NULL,
  day_of_week ENUM('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY') NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  subject_id INT NOT NULL,
  teacher_id INT NOT NULL,
  classroom_id INT NOT NULL,
  FOREIGN KEY (academic_year_id) REFERENCES academic_years(id),
  FOREIGN KEY (department_id) REFERENCES departments(id),
  FOREIGN KEY (branch_id) REFERENCES branches(id),
  FOREIGN KEY (subject_id) REFERENCES subjects(id),
  FOREIGN KEY (teacher_id) REFERENCES teachers(id),
  FOREIGN KEY (classroom_id) REFERENCES classrooms(id),
  UNIQUE KEY uq_room_slot (classroom_id, day_of_week, start_time, academic_year_id),
  UNIQUE KEY uq_teacher_slot (teacher_id, day_of_week, start_time, academic_year_id)
);
```

---

## 6. Module 5: Institutional Notices & Circulars (Phase 5 Roadmap)

> **Designation:** FUTURE DESIGN / PLANNED FOR PHASE 5 — NOT IMPLEMENTED

### 6.1 Overview & Functional Purpose
Enables targeted institutional announcements, departmental circulars, and classroom notifications with audience scoping and read-receipt audit tracking.

### 6.2 Scoped Publication Authority
| Notice Scope | Authorized Creator | Target Audience |
|---|---|---|
| `COLLEGE` | `SYSTEM_ADMIN` | All faculty and all students college-wide |
| `DEPARTMENT` | `HOD` / `SYSTEM_ADMIN` | All faculty and students within the designated department |
| `COHORT` | `CLASS_TEACHER` | Students enrolled within the specific cohort |
| `SUBJECT` | `SUBJECT_TEACHER` | Students enrolled in the specific subject |

### 6.3 Notice Attributes & Features
- Title, Rich-text Body, Priority (`NORMAL`, `URGENT`).
- Publish Timestamp, Expiration Timestamp (auto-archived past expiration).
- File Attachments (e.g., official signed administrative circular PDFs).
- Read Tracking: Tracks which students have opened and acknowledged the notice.

### 6.4 Suggested Conceptual Entities
```sql
-- [FUTURE DESIGN - NOT IMPLEMENTED]
CREATE TABLE notices (
  id INT AUTO_INCREMENT PRIMARY KEY,
  author_id INT NOT NULL,
  scope ENUM('COLLEGE', 'DEPARTMENT', 'COHORT', 'SUBJECT') NOT NULL,
  department_id INT NULL,
  branch_id INT NULL,
  year INT NULL,
  semester INT NULL,
  subject_id INT NULL,
  academic_year_id INT NOT NULL,
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  is_urgent BOOLEAN NOT NULL DEFAULT FALSE,
  publish_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (author_id) REFERENCES users(id),
  FOREIGN KEY (academic_year_id) REFERENCES academic_years(id)
);

CREATE TABLE notice_attachments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  notice_id INT NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (notice_id) REFERENCES notices(id) ON DELETE CASCADE
);

CREATE TABLE notice_reads (
  id INT AUTO_INCREMENT PRIMARY KEY,
  notice_id INT NOT NULL,
  user_id INT NOT NULL,
  read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (notice_id) REFERENCES notices(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uq_notice_user (notice_id, user_id)
);
```

---

## 7. Module 6: Academic Calendar (Phase 6 Roadmap)

> **Designation:** FUTURE DESIGN / PLANNED FOR PHASE 6 — NOT IMPLEMENTED

### 7.1 Overview & Functional Purpose
A centralized institutional academic timeline outlining official semester terms, holiday schedules, examination intervals, institutional events, and administrative deadlines.

### 7.2 Functional Specifications
- Maintained by `SYSTEM_ADMIN` per `academic_year_id`.
- Event Classifications: `SEMESTER_START`, `SEMESTER_END`, `GAZETTED_HOLIDAY`, `COLLEGE_FESTIVAL`, `EXAM_PERIOD`, `RESULT_DECLARATION`.
- Interactive calendar view with iCal/ICS export capabilities for staff and students.

### 7.3 Suggested Conceptual Entity
```sql
-- [FUTURE DESIGN - NOT IMPLEMENTED]
CREATE TABLE academic_calendar_events (
  id INT AUTO_INCREMENT PRIMARY KEY,
  academic_year_id INT NOT NULL,
  event_title VARCHAR(150) NOT NULL,
  event_type ENUM('TERM_DATE', 'HOLIDAY', 'EXAM_WINDOW', 'EVENT', 'DEADLINE') NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  description TEXT NULL,
  is_instructional_day BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (academic_year_id) REFERENCES academic_years(id)
);
```

---

## 8. Module 7: Exam Schedule (Phase 6 Roadmap)

> **Designation:** FUTURE DESIGN / PLANNED FOR PHASE 6 — NOT IMPLEMENTED

### 8.1 Overview & Functional Purpose
Manages formalized examination timetables for mid-term, semester-end, and laboratory examinations, including hall allocations and personalized student hall ticket schedules.

### 8.2 Functional Specifications
- Created by `SYSTEM_ADMIN` or examination committee coordinators.
- Defines: Examination Name (e.g., *"Winter 2026 End-Semester Exam"*), Subject, Exam Date, Time Slot (e.g., 10:00 AM – 01:00 PM), Seating Hall/Classroom, and Eligible Cohort.
- Student Portal: Generates printable examination schedule slip with seat allocations.

### 8.3 Suggested Conceptual Entity
```sql
-- [FUTURE DESIGN - NOT IMPLEMENTED]
CREATE TABLE exam_schedules (
  id INT AUTO_INCREMENT PRIMARY KEY,
  academic_year_id INT NOT NULL,
  department_id INT NOT NULL,
  branch_id INT NOT NULL,
  year INT NOT NULL,
  semester INT NOT NULL,
  subject_id INT NOT NULL,
  exam_type ENUM('MID_TERM', 'FINAL_THEORY', 'PRACTICAL_VIVA') NOT NULL,
  exam_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  classroom_id INT NOT NULL,
  FOREIGN KEY (academic_year_id) REFERENCES academic_years(id),
  FOREIGN KEY (department_id) REFERENCES departments(id),
  FOREIGN KEY (branch_id) REFERENCES branches(id),
  FOREIGN KEY (subject_id) REFERENCES subjects(id),
  FOREIGN KEY (classroom_id) REFERENCES classrooms(id)
);
```

---

## 9. Module 8: Student Performance & Academic Analytics (Phase 7 Roadmap)

> **Designation:** FUTURE DESIGN / PLANNED FOR PHASE 7 — NOT IMPLEMENTED

### 9.1 Overview & Composite Intelligence
The Student Performance & Academic Analytics module serves as the capstone academic intelligence layer. It synthesizes multidimensional academic metrics into comprehensive institutional dashboards.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    STUDENT PERFORMANCE ANALYTICS ENGINE                     │
├──────────────────────┬───────────────────────────────┬──────────────────────┤
│   OFFICIAL ATTENDANCE│       TEST SCORES / MARKS     │      ASSIGNMENTS     │
│   register_attendance│       test_scores + tests     │  assignment_grades   │
│   (Official % + Rate)│       (Exam Average %)        │  (Submission Rate %) │
└──────────┬───────────┴───────────────┬───────────────┴──────────┬───────────┘
           │                           │                          │
           └───────────────────────────┼──────────────────────────┘
                                       │
                                       ▼ READ-ONLY Aggregation
                        ┌──────────────────────────────┐
                        │   Composite Student Health   │
                        │      Index & Trends          │
                        └──────────────┬───────────────┘
                                       │
                 ┌─────────────────────┴─────────────────────┐
                 ▼                                           ▼
      Early Warning Defaulter Matrix              Institutional Accreditations
      ("Attendance < 75% & Marks < 40%")          (NBA / NAAC Compliance Data)
```

### 9.2 Key Analytical Invariants & Defenses
1. **Strict Read-Only Attendance Consumption:**
   - The analytics engine accesses attendance data **exclusively through read-only aggregation queries** against `register_attendance` and `attendance_sessions`.
   - It cannot mutate, recalculate, or overwrite attendance records.
2. **Multidimensional Defaulter Detection:**
   - Detects compound academic risk: Identifies students who exhibit both low attendance ($< 75\%$) and declining test performance ($< 40\%$), generating early intervention alerts for Class Teachers and HODs.
3. **Institutional Reporting:**
   - Automated generation of NAAC / NBA accreditation compliance metrics, department-wide pass percentages, and subject-level academic correlation graphs.

---

## 10. Phased Roadmap Summary

| Phase | Designation | Key Capabilities Delivered | Status |
|---|---|---|---|
| **Phase 1** | **Attendance Web System** | Core DB schema, Express REST API, Vanilla HTML/CSS/JS web, 3 attendance streams, student provisioning, ESP32 integration | **CURRENT BASELINE** |
| **Phase 2** | **API Stabilization & Testing** | Security hardening, penetration audit, unit/integration testing, rate limiting, and performance benchmarking | Upcoming |
| **Phase 3** | **React Native Mobile App** | Cross-platform Student & Teacher mobile apps consuming existing `/api/v1/` REST API | Planned |
| **Phase 4** | **Assignments & Test Scores** | Assignment creation, file submission, grading console, unit tests, and internal marks entry | Planned (Future) |
| **Phase 5** | **Study Material, Timetable & Notices** | Digital repository, master timetable matrix, conflict checking, and targeted circulars | Planned (Future) |
| **Phase 6** | **Calendar & Exam Schedule** | Academic term dates, holiday tracking, exam scheduling, and printable hall tickets | Planned (Future) |
| **Phase 7** | **Student Performance Analytics**| Cross-module academic synthesis, composite health index, and early warning risk matrix | Planned (Future) |
| **Phase 8** | **UIAP Integration** | Packaging the completed attendance and academic system into a signed UIAP module bundle | Planned (Future) |
