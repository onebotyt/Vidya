# 👥 User Roles, Governance & System Workflows

## 1. Role Hierarchy Matrix

Vidya implements granular Role-Based Access Control (RBAC) across five institutional tiers:

| Role | Primary Responsibilities | Default Access Path |
|:---|:---|:---|
| **System Administrator** | Institutional master data, department creation, HOD appointments, academic calendars, terminal management, institutional audits | `/admin/academic-structure.html` |
| **Head of Department (HOD)** | Department curriculum, subject codes, faculty allocation, class teacher appointment, cohort promotions/demotions, faculty registration adjudication | `/faculty/hod-dashboard.html` |
| **Class Teacher** | Cohort oversight, student self-registration approvals, student demographic dossier, class roll number management | `/faculty/hod-students.html` |
| **Subject Teacher (Faculty)** | Lecture attendance sessions, day 1–31 matrix ledger, coursework/assignments, test marksheets, live roll call studio | `/faculty/registers.html` |
| **Student** | Self-service attendance portal, 75% threshold predictor, coursework submission, test marks viewing, leave application | `/student/dashboard.html` |

---

## 2. Core User Workflows

### 2.1 Attendance Taking & Finalization
Vidya provides faculty with three distinct ways to record lecture attendance:

```
                      ┌────────────────────────────┐
                      │    Faculty Starts Class    │
                      └─────────────┬──────────────┘
                                    │
           ┌────────────────────────┼────────────────────────┐
           ▼                        ▼                        ▼
┌──────────────────────┐ ┌──────────────────────┐ ┌──────────────────────┐
│  Mode 1: Day Matrix  │ │ Mode 2: Live RollCall│ │ Mode 3: Hardware ESP32│
│  • Day 1-31 table    │ │ • Dynamic QR token   │ │ • Fingerprint scan   │
│  • 1-click status flip│ │ • 6-Digit Live PIN   │ │ • Terminal ID verify │
│  • Batch 'Mark All'  │ │ • Real-time log feed │ │ • Synced into matrix │
└──────────┬───────────┘ └──────────┬───────────┘ └──────────┬───────────┘
           │                        │                        │
           └────────────────────────┼────────────────────────┘
                                    ▼
                      ┌────────────────────────────┐
                      │ Session State: FINALIZED   │
                      │ • Cumulative % updated     │
                      │ • Defaulter status logged  │
                      └────────────────────────────┘
```

1. **Physical Register View (Day 1–31 Ledger)**:
   - Located at `/faculty/registers.html`.
   - Displays all enrolled students in alphabetical order by name with assigned Class Roll Numbers.
   - Click any date column to toggle between `PRESENT`, `ABSENT`, or `LATE`.
   - Batch header controls allow one-click *"Mark All Present"* or *"Clear Session"*.
2. **Dual Live Roll Call Studio (`#manual-roll-modal`)**:
   - Opens an interactive modal directly from the register.
   - Generates a rotating, time-sensitive **Dynamic QR Code** and a concurrent **6-digit PIN code**.
   - As students scan or enter the PIN on their phones, the right-hand **Live Student Check-In Log** updates in real time.
   - Teachers can accept, verify, or revoke claims before clicking *"Finalize Attendance"*.
3. **ESP32 Hardware Biometric Sync**:
   - Students tap their enrolled fingerprint on physical classroom terminals.
   - ESP32 hardware transmits cryptographic scan logs to `/api/v1/devices/presence`.
   - Faculty click *"Sync ESP32 Attendance"* on the register toolbar to auto-populate the ledger with biometric clock-ins.

---

### 2.2 Student Self-Registration & Verification Gate

To eliminate manual data entry errors during admissions, Vidya supports an automated student self-registration pipeline:

1. **Cohort Registration Opening**:
   - Class Teacher or HOD toggles *"Open Registration"* for a specific department, year, and semester (`/faculty/cohorts.html`).
2. **Student Submission**:
   - Student navigates to `/student-register.html`.
   - Enters their Official Institutional Enrollment Number, full name, email, phone number, and password.
   - The system creates a user account in `PENDING` status.
3. **Class Teacher / HOD Adjudication**:
   - Class Teacher navigates to `/faculty/hod-students.html` and views pending applicant cards.
   - Verifies the student's admission credentials and clicks **"Approve"**.
   - Upon approval, the user account transitions to `ACTIVE`, an official enrollment record is established, and the class roll number is automatically indexed.
   - If rejected, a reason is documented and access is denied.

---

### 2.3 Coursework & Assignment Management

Located under the **Coursework & Assignments** tab in `/faculty/registers.html?tab=assignments`:

1. **Assignment Creation**:
   - Faculty click *"+ New Coursework"*.
   - Define assignment title, description, submission deadline, maximum marks, and optional syllabus reference attachment.
2. **Student Submission**:
   - Enrolled students receive notifications and access the assignment from `/student/assignments.html`.
   - Students upload solutions (PDF, DOCX, ZIP, images) and submit before the deadline.
3. **Review & Grading**:
   - Faculty view the submission roster, download student attachments, enter numeric scores, and leave feedback comments.
   - Scores immediately reflect in the student's academic profile.

---

### 2.4 Class Tests & Marksheets Studio

Located under the **Class Tests & Marksheets** tab in `/faculty/registers.html?tab=marks`:

1. **Test Scheduling**:
   - Faculty create tests with exam name (e.g. *"Internal Assessment 1"*), date, maximum marks, and passing cutoff.
2. **Roster Score Entry**:
   - Opens an Excel-style interactive grid populated with all enrolled cohort students.
   - Features keyboard arrow navigation, automatic clamped validation (scores cannot exceed maximum marks), and instant average calculation.
3. **Publication**:
   - Finalized scores are published to student dossiers and exported to institutional evaluation spreadsheets.

---

### 2.5 Semester Promotion, Demotion & Graduation Lifecycle

Vidya includes an automated promotion engine managed by the HOD at `/faculty/hod-settings.html`:

1. **Promotion Preview**:
   - HOD requests a preview of the upcoming term transition.
   - The engine categorizes students:
     - **Eligible for Promotion**: Progress from Semester $N \rightarrow N+1$.
     - **Eligible for Graduation**: Students completing their final semester progress to `ALUMNI` status.
     - **Detained / Exceptions**: Students placed on hold or below attendance criteria.
2. **Safety Confirmation Gate**:
   - Executing promotion requires entering the official department confirmation code to prevent accidental execution.
3. **Execution & Roll Re-Indexing**:
   - In a single atomic transaction, students' active enrollment semesters are updated.
   - Class roll numbers are automatically re-indexed alphabetically by student full name.
   - Student accounts are notified in real-time.
4. **Demotion / Reversal Safeguard**:
   - If a promotion was run prematurely, an automated demotion reversal command restores previous cohort assignments.
