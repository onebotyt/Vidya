# College Academic, Teaching & Attendance System — Revised SRS
### **Source of Truth for Antigravity Migration**

> **IMPORTANT FOR ANTIGRAVITY:** This SRS replaces the previous attendance-system architecture. Do not preserve obsolete workflows merely because they exist in the current codebase. Refactor the existing project to follow this specification. Existing data/code should be migrated only where compatible with this design.

---

# 1. System Overview

The system is a **local-first College Academic, Teaching, Attendance and Classwork Management System**.

It combines:

1. Department/student administration
2. Faculty management
3. HOD management
4. Google Classroom-style Teaching Groups
5. Classwork, assignments and tests
6. Official teacher attendance registers
7. ESP32/fingerprint-based campus-presence evidence
8. Biometric enrollment
9. Academic-year/semester historical records
10. Audit and reporting

The architecture must separate:

```text
INSTITUTIONAL STRUCTURE
        ↓
Department → Faculty → Students → IoT Devices


TEACHING STRUCTURE
        ↓
Faculty → Teaching Group → Students
                         ↓
              Classwork / Marks
                         ↓
                 Official Attendance


PHYSICAL PRESENCE
        ↓
Fingerprint → ESP32 → IoT Attendance Events
                              ↓
                         ESP Sync
                              ↓
                    Official Register
```

These three layers must **not be merged into one hierarchy**.

---

# 2. Critical Architecture Principles

## 2.1 Department ≠ Teaching Group

A student's department is their institutional/organizational affiliation.

A Teaching Group is an instructional relationship.

Example:

```text
Student:
Department = Information Technology

Teaching Groups:
- First Year Mathematics
- Engineering Physics
- Programming
- Communication Skills
```

A Teaching Group may contain students from:

```text
IT
CSE
ECE
Other departments
```

Therefore, a Teaching Group must **not** have a mandatory department ID.

---

# 3. No Global Subject Catalog

There must be **no global subject master/catalog** in the current design.

Do not create a mandatory:

```text
subjects
```

master table for normal teaching-group creation.

When a teacher creates a Teaching Group, the teacher directly enters:

```text
Subject Name
```

Example:

```text
Group Name: First Year Common
Subject Name: Mathematics
Component: Theory
```

Another teacher may independently create:

```text
Group Name: First Year Mathematics Practical
Subject Name: Mathematics
Component: Practical
```

These are independent Teaching Groups.

---

# 4. Roles and Capabilities

The system uses roles/capabilities rather than forcing every user into one mutually exclusive role.

Core roles:

```text
ADMIN
HOD
COMMON_FACULTY_MANAGER
FACULTY
STUDENT
```

A user may have multiple roles.

Example:

```text
FACULTY + HOD
```

An HOD can therefore continue teaching.

---

# 5. ADMIN

Admin is the institution/system-level administrator.

## Admin responsibilities

Admin can:

- Manage departments
- Manage institution-level settings
- Approve HOD registrations
- Assign/change HODs
- Assign Common Faculty Manager
- Manage faculty accounts where appropriate
- Manage system/security configuration
- View audit information
- Manage academic configuration
- Manage user account status
- Handle exceptional administrative corrections

## Admin must NOT:

- Create normal Teaching Groups
- Manage teacher attendance registers as normal operation
- Register department IoT devices
- Approve every student enrollment
- Manage a global subject catalog
- Replace normal faculty/HOD workflows

---

# 6. HOD

HOD belongs to exactly one department.

Example:

```text
Information Technology
        ↓
HOD: Rahul Sharma
```

There must be **only one active HOD per department**.

## HOD responsibilities

HOD can:

- View department faculty
- View department students
- Oversee department
- Access department IoT management
- Register department IoT devices
- Manage department IoT devices
- View department IoT attendance data
- Manage departmental faculty-related operations
- Perform authorized attendance corrections if permitted by policy
- Access departmental reports

## HOD does NOT need to approve every student.

Student enrollment requests can be handled by authorized department faculty.

---

# 7. HOD Registration

Faculty registration provides:

```text
Account Type:
[ Faculty ]
[ HOD ]
```

If HOD is selected:

```text
Department:
[ Information Technology ▼ ]
```

HOD registration always goes to:

```text
HOD Registration
      ↓
Admin
      ↓
Approve / Reject
```

A department cannot approve its own new HOD.

---

# 8. One HOD Per Department

Database and application logic must enforce:

```text
Department
   ↓
Maximum 1 active HOD
```

If a department already has an HOD, another HOD cannot be assigned without changing/removing the existing assignment.

---

# 9. Assigning an Existing Faculty Member as HOD

Admin has:

```text
HOD Management
```

Admin searches for an existing faculty member by Gmail.

Example:

```text
Search Faculty by Gmail:
[ anita@gmail.com ]

Anita Joshi
anita@gmail.com
Department: IT
Role: Faculty

[ Make HOD ]
```

After confirmation:

```text
Anita
Roles:
- FACULTY
- HOD

Department:
IT
```

Do not delete the FACULTY capability.

If IT already has an HOD, the system must clearly warn Admin before replacing the existing HOD.

All HOD assignment/removal/replacement operations must be audited.

---

# 10. Common Faculty Manager

Some teachers do not belong to any department.

Example:

```text
Faculty:
ABC Teacher

Department:
No Department / Common Faculty
```

These may include first-year/common-subject faculty.

Because they have no HOD, create:

```text
COMMON_FACULTY_MANAGER
```

This role manages faculty accounts whose department is NULL/no department.

## Common Faculty Manager can:

- View no-department faculty registration requests
- Approve/reject no-department faculty
- Manage no-department faculty accounts
- Perform permitted faculty administrative operations

## Common Faculty Manager does NOT automatically get:

- HOD permissions
- Department IoT management
- Department student access
- Department attendance access

Admin assigns the Common Faculty Manager.

---

# 11. Faculty Registration Approval

There are three main cases.

## Case A — Department Faculty

```text
Faculty
Department = IT
        ↓
IT HOD
        ↓
Approve / Reject
```

## Case B — Common Faculty

```text
Faculty
Department = No Department
        ↓
Common Faculty Manager
        ↓
Approve / Reject
```

## Case C — HOD

```text
HOD
Department = IT
        ↓
Admin
        ↓
Approve / Reject
```

---

# 12. Faculty Authentication

Faculty account uses Gmail as the primary login identifier.

Admin may create/provision faculty accounts with a temporary password.

First login:

```text
Gmail
+
Temporary Password
```

System asks faculty to connect their Google account.

The Google account email must match the Gmail stored for the faculty account.

Store Google identity information such as:

```text
google_sub
```

After successful linking, Google login can be used.

Faculty can manage their permitted profile information and password.

---

# 13. Department Students

Every department has its student population.

All authorized teachers belonging to that department can access the department student area.

Example:

```text
IT Department
│
├── Teacher A
├── Teacher B
├── Teacher C
│
└── Students
    ├── Student 1
    ├── Student 2
    └── Student 3
```

This eliminates the previous Class Teacher dependency.

---

# 14. Student Enrollment Approval

There is **no special Class Teacher role** for this purpose.

Student enrollment request:

```text
Student Registration Request
        ↓
Department
        ↓
Any authorized teacher of that department
        ↓
Approve / Reject
```

Therefore:

- Admin does not approve every student.
- HOD does not approve every student.
- A special Class Teacher is not required.

Any authorized department teacher can process department student enrollment requests.

---

# 15. Student Profile

Student should have at minimum:

```text
Student ID
Enrollment Number
Full Name
Gmail (optional/if required)
Department enrollment
Academic context
Class/Roll information
Account status
Biometric enrollment status
```

Student identity must be stable across academic years.

---

# 16. Academic Enrollment

Do not permanently store historical department membership only as one mutable value.

Use academic/time-aware enrollment.

Conceptually:

```text
student_department_enrollments
```

Example:

```text
Student
24011120001

2026–27
Department: IT
Year: 1

2027–28
Department: IT
Year: 2
```

If a student changes department later, historical records remain associated with the original period.

---

# 17. Official Teaching Groups

This is the primary teaching container.

A teacher can freely create an **Official Teaching Group**.

No Admin approval is required for normal group creation.

Example:

```text
Create Official Teaching Group

Group Name:
First Year Common Mathematics

Subject Name:
Mathematics

Component:
Theory

Academic Year:
2026–27

Semester:
1
```

---

# 18. Teaching Group Fields

Recommended fields:

```text
id
name/group_name
subject_name
component
teacher_id
academic_year_id
semester
invite_code
status
created_at
archived_at
```

Potential component values:

```text
THEORY
PRACTICAL
```

Additional values can be added later if required.

---

# 19. Academic Year + Semester

When creating a Teaching Group, teacher selects:

```text
Academic Year
Semester
```

These values are fundamental historical metadata.

Example:

```text
2026–27
Semester 1
```

The automatically generated Official Attendance Register inherits the same values.

Teacher does **not** enter Academic Year/Semester again when creating the register.

---

# 20. Automatic Official Register Creation

When:

```text
Teacher creates Teaching Group
```

the system automatically creates:

```text
Official Attendance Register
```

Relationship:

```text
Teaching Group
     │
     └── Official Attendance Register
```

Example:

```text
Teaching Group:
First Year Mathematics

Academic Year:
2026–27

Semester:
1

        ↓ automatic

Official Register:
First Year Mathematics
2026–27
Semester 1
```

---

# 21. Teaching Group Archiving

Teaching Groups have:

```text
ACTIVE
ARCHIVED
```

Teacher can archive an old group.

Archive means:

- Remove from default active workspace
- Preserve all data
- Preserve attendance
- Preserve assignments
- Preserve submissions
- Preserve marks
- Preserve students/history
- Preserve IoT synchronization history
- Allow historical access

Archive is **not deletion**.

---

# 22. New Semester / Academic Year

Teacher should create a new Teaching Group rather than changing an old group's academic period.

Example:

```text
Old:
Mathematics
2026–27
Semester 1
ARCHIVED

New:
Mathematics
2026–27
Semester 2
ACTIVE
```

Even if the name is identical, they are separate Teaching Group records.

Never overwrite the old group's semester/year.

---

# 23. Teaching Group Membership

Students join using a Google-Classroom-style invite code/link.

Example:

```text
Teacher creates group
        ↓
Invite Code generated
        ↓
Student enters code
        ↓
Join Request
        ↓
Teacher approves
        ↓
Student becomes member
```

Teacher controls membership in their Teaching Group.

A student cannot join another group's official attendance/classwork without appropriate membership.

---

# 24. Mixed-Department Teaching Groups

A Teaching Group may contain:

```text
IT
CSE
ECE
```

simultaneously.

Example:

```text
First Year Mathematics

Students:
IT  → 25
CSE → 20
ECE → 18
```

The Teaching Group must not require a single department.

---

# 25. Google Classroom-Style Teaching Group UI

The group should have major sections:

```text
Stream
Classwork
Students
Attendance
Marks
```

---

# 26. Stream

Stream is for:

- Announcements
- Notices
- Reminders
- General teaching-group communication

Example:

```text
Teacher:
"Unit test will be conducted on Monday."

Posted to:
First Year Mathematics
```

---

# 27. Classwork

Classwork contains:

```text
Assignments
Tests
Study Material
```

The architecture should support future expansion.

---

# 28. Assignments

Teacher can create:

```text
Assignment
├── Title
├── Description
├── Attachments
├── Due Date
└── Maximum Marks
```

Student:

```text
Open assignment
      ↓
Complete work
      ↓
Submit
```

Teacher:

```text
Review submission
      ↓
Assign marks
      ↓
Return result
```

Assignment marks are separate from attendance.

---

# 29. Tests

Teaching Group can contain tests.

Example:

```text
Unit Test 1
Maximum Marks: 20

Unit Test 2
Maximum Marks: 20

Mid-Term
Maximum Marks: 50
```

Teacher records student marks.

Student can see their own marks.

Teacher can see the group's results.

---

# 30. Attendance Architecture

There are two fundamentally separate attendance concepts.

## A. IoT Campus Presence

```text
Fingerprint
    ↓
ESP32
    ↓
IoT Attendance Event
```

This means:

> The student's registered biometric identity was detected by an authorized device.

## B. Official Subject Attendance

```text
Teaching Group
    ↓
Official Register
    ↓
Teacher Session
    ↓
ESP Sync
    ↓
Review / Correction
    ↓
Finalize
```

This means:

> The teacher officially recorded attendance for that teaching session.

---

# 31. IoT Attendance Is Not Official Attendance

This is a hard architectural rule.

Never automatically convert:

```text
IoT Attendance Event
```

into:

```text
Official Attendance Record
```

IoT data is **evidence/input**.

The teacher's finalized register is the official subject attendance.

Example:

```text
IoT:
Student scanned at 08:45 → PRESENT

Mathematics:
Teacher may record → ABSENT
```

Both records can legitimately exist because they represent different contexts.

---

# 32. IoT Attendance Table

Create a separate raw event table conceptually:

```text
iot_attendance_events
```

Recommended fields:

```text
id
student_id
device_id
department_id
scan_time
scan_date
verification_status
event_type
created_at
```

Raw IoT events should be immutable.

Teachers should not edit/delete raw device events.

---

# 33. Department IoT Devices

IoT devices belong to departments.

```text
Department
    ↓
IoT Devices
```

HOD controls registration/management.

Admin does **not** have normal Device Registration.

Example:

```text
IT Department
├── ESP32-IT-01
└── ESP32-IT-02
```

---

# 34. Department Teacher IoT Access

Authorized teachers of a department can access relevant department IoT functionality.

They can:

- Register fingerprints for department students
- Use department IoT attendance data
- Use ESP Sync for their Teaching Groups

They do not need HOD approval for every attendance operation.

---

# 35. Fingerprint Enrollment

Department teachers can register fingerprints for students belonging to their department.

Example:

```text
IT Teacher
   ↓
IT Department Students
   ↓
Select Student
   ↓
Biometric Enrollment
   ↓
ESP32/Fingerprint Sensor
   ↓
Fingerprint Registered
```

The student's biometric identity belongs to the student/department biometric system, not to one Teaching Group.

The same biometric identity can later be used by multiple Teaching Groups.

---

# 36. Biometric Security

The system should store the minimum biometric information required.

Do not unnecessarily store raw fingerprint images.

Prefer:

```text
protected biometric template / sensor credential identifier
```

with appropriate encryption/access controls.

Biometric enrollment, replacement, deletion, and administrative access must be audited.

---

# 37. Common Faculty and IoT

Common faculty may teach students from multiple departments.

They do not need to own an IoT device.

Example:

```text
Common Mathematics Teacher

Teaching Group:
First Year Mathematics

Students:
IT
CSE
ECE
```

The relevant IoT devices may belong to:

```text
IT Department
CSE Department
ECE Department
```

The common teacher can use **ESP Sync** to retrieve relevant IoT presence for students in their Teaching Group.

---

# 38. ESP Sync

Inside the Official Attendance Register:

```text
[ ESP SYNC ]
```

The button is available when relevant IoT attendance data is available/authorized.

When clicked:

```text
Teacher Register
      ↓
Identify students in this session
      ↓
Identify their departments
      ↓
Find relevant authorized IoT events
      ↓
Match student biometric attendance
      ↓
Pre-fill attendance
      ↓
Teacher reviews
      ↓
Teacher can change result
      ↓
Teacher finalizes
```

---

# 39. ESP Sync Must Be Contextual

A common teacher must not receive unrestricted raw IoT logs from every department.

For a mixed Teaching Group:

```text
Mathematics
├── IT Student
├── CSE Student
└── ECE Student
```

the backend determines:

```text
Required departments:
IT
CSE
ECE
```

and retrieves only the relevant evidence needed for the register.

The raw IoT event system remains protected.

---

# 40. Official Attendance Register UI

The register should combine:

- Physical-register concept
- Calendar-style navigation
- Modern web UI

Recommended structure:

```text
Official Attendance Register

< Previous Date     September 2026     Next Date >

Session:
Mathematics Theory
10:00 AM – 11:00 AM

[ ESP SYNC ]

Student        Status
──────────────────────
Student A      P
Student B      A
Student C      L
Student D      P
```

For broader register view:

```text
              Sep 1 Sep 2 Sep 3 Sep 4 ...
Student A       P     P     A     P
Student B       P     L     P     P
Student C       A     P     P     P
```

Use sticky headers and clear P/A/L status indicators.

---

# 41. Official Attendance Status

Core statuses:

```text
PRESENT
ABSENT
LATE
```

PRESENT and LATE count as attended for attendance percentage unless future policy says otherwise.

---

# 42. Attendance Session Lifecycle

Recommended lifecycle:

```text
DRAFT
 ↓
OPEN
 ↓
CLOSED
 ↓
FINALIZED
```

Before finalization:

- Teacher can edit.
- Teacher can manually mark.
- Teacher can use ESP Sync.
- Teacher can correct imported suggestions.

After finalization:

- Normal teacher cannot silently modify records.
- Corrections require authorization.
- Correction requires reason.
- Audit record must be created.

---

# 43. Attendance Correction

Post-finalization correction must retain:

```text
original value
new value
reason
changed_by
changed_at
```

Authorized correction roles should be configurable, with HOD/Admin as the initial authority.

---

# 44. Attendance Percentage

Official attendance percentage must be calculated from:

```text
FINALIZED official teacher attendance sessions
```

not directly from IoT presence.

IoT attendance is not used as the official percentage source.

---

# 45. Academic-Year Reporting

Because Teaching Groups contain:

```text
academic_year
semester
```

the system can easily query:

```text
Academic Year: 2026–27
Semester: 1
```

and retrieve:

- Teaching Groups
- Students
- Attendance
- Assignments
- Submissions
- Tests
- Marks

Historical archived groups must remain queryable.

---

# 46. Suggested Database Entities

Core entities:

```text
users
user_roles
user_sessions

departments
department_hod_assignments

faculty_profiles
faculty_registration_requests

common_faculty_manager_assignments

students
student_department_enrollments
student_registration_requests

academic_years
semesters

teaching_groups
teaching_group_members
teaching_group_invites

classroom_posts
assignments
assignment_submissions

tests
test_results

attendance_registers
attendance_sessions
attendance_records
attendance_corrections

devices
device_assignments
device_heartbeats
iot_attendance_events

biometric_enrollments

notifications
audit_logs
system_settings
```

There must be **no mandatory global `subjects` table**.

---

# 47. Important Database Relationships

```text
users
 │
 ├── user_roles
 │
 ├── faculty_profiles
 │
 └── student profile
```

```text
departments
 │
 ├── HOD assignment
 ├── faculty
 ├── students
 └── IoT devices
```

```text
faculty
 │
 └── teaching_groups
        │
        ├── students
        ├── classwork
        └── attendance_register
```

```text
students
 │
 ├── department enrollment history
 ├── biometric enrollment
 ├── IoT events
 └── teaching-group memberships
```

---

# 48. Historical Data Rule

Never delete historical academic records simply because a Teaching Group is archived.

Archived groups remain accessible.

Historical records must retain their original:

```text
Academic Year
Semester
Teaching Group
Teacher
Students
Attendance
Marks
```

---

# 49. Department Transfer Rule

If a student changes department:

```text
Old Department Enrollment
        ↓
End Date

New Department Enrollment
        ↓
Start Date
```

Old attendance and academic records must remain unchanged.

Do not rewrite historical records to the new department.

---

# 50. Authorization Rules

The backend must enforce authorization.

Do not rely only on hiding UI buttons.

Examples:

### Department faculty

Can access:

```text
Students belonging to their department
```

### Common faculty

Can access:

```text
Their own Teaching Groups
Their Teaching Group students
Relevant ESP Sync data
```

### HOD

Can access:

```text
Their department
Their department IoT devices
Department IoT attendance
Department faculty/students
```

### Student

Can access:

```text
Their own profile
Their Teaching Groups
Their assignments
Their submissions
Their own marks
Their finalized attendance
```

---

# 51. ESP32 API Boundary

ESP32 must not directly connect to MySQL.

Architecture:

```text
ESP32
 ↓
Authenticated API
 ↓
Backend
 ↓
Database
```

Device authentication must be implemented securely.

Possible mechanism:

- Device credential
- Device secret
- HMAC/signature
- HTTPS where supported

Never expose database credentials to ESP32.

---

# 52. IoT Device Registration

HOD page:

```text
IoT Devices

[ Register Device ]

Device Name
Device ID
Device Type
Department
Status
```

HOD can:

- Register
- Activate/deactivate
- View status
- View heartbeat
- View attendance events
- Manage department devices

Admin does not perform normal device registration.

---

# 53. Student Biometric Enrollment Permissions

A department teacher can enroll:

```text
Student.department == Teacher.department
```

A common teacher cannot arbitrarily enroll fingerprints for students from another department.

Common faculty can consume relevant biometric attendance evidence through authorized ESP Sync.

---

# 54. Audit Logging

Audit events should include at minimum:

```text
FACULTY_APPROVED
FACULTY_REJECTED

HOD_ASSIGNED
HOD_REMOVED
HOD_REPLACED

COMMON_MANAGER_ASSIGNED

STUDENT_APPROVED
STUDENT_REJECTED

TEACHING_GROUP_CREATED
TEACHING_GROUP_ARCHIVED

BIOMETRIC_ENROLLED
BIOMETRIC_UPDATED
BIOMETRIC_REMOVED

DEVICE_REGISTERED
DEVICE_DISABLED

ESP_SYNC_EXECUTED

ATTENDANCE_FINALIZED
ATTENDANCE_CORRECTED

ASSIGNMENT_GRADED
TEST_MARK_UPDATED
```

---

# 55. Notifications

The architecture should support notifications for:

- Faculty approval/rejection
- Student enrollment approval/rejection
- Teaching-group invitation
- Assignment posted
- Assignment due
- Assignment graded
- Test marks published
- Attendance-related notices
- Administrative changes

Implementation can initially be simple in-app notifications.

---

# 56. Security Requirements

Implement:

- Password hashing with bcrypt/Argon2
- JWT access/refresh strategy if JWT remains the selected authentication mechanism
- Role-based authorization
- Resource-level authorization
- Rate limiting
- Input validation
- Secure headers
- CSRF protection where applicable
- Secure cookie/token handling
- Audit logs
- Device authentication
- Biometric protection
- No raw database credentials on IoT devices

---

# 57. Local-First Deployment

Current deployment target:

```text
College Windows PC / Server
        ↓
Local Backend
        ↓
Local Database
        ↓
College LAN
        ↓
Faculty / Student browsers
```

The system should continue functioning locally without depending on cloud services for core attendance operation.

Cloud/remote synchronization can be added later.

---

# 58. Recommended Current Technology

Unless the existing implementation has a deliberate approved alternative:

### Backend

```text
Node.js
Express.js
```

### Database

```text
MySQL 8.x
```

### Frontend

```text
HTML
CSS
Vanilla JavaScript
```

Avoid introducing React/Next.js into the current attendance system unless explicitly requested.

### Authentication

```text
JWT
bcrypt
Google OAuth / Google Identity
```

### IoT

```text
ESP32
Fingerprint sensor
Authenticated backend API
```

---

# 59. UI Main Navigation

## Admin

```text
Dashboard
Departments
Faculty
HOD Management
Common Faculty Manager
Academic Years
System Settings
Audit Logs
```

## HOD

```text
Dashboard
Department
Faculty
Students
IoT Devices
IoT Attendance
Reports
```

## Faculty

```text
Dashboard
My Teaching Groups
Department Students       [if department faculty]
Enrollment Requests       [if department faculty]
Classwork
Assignments
Tests
Attendance
Marks
Profile
```

## Common Faculty

```text
Dashboard
My Teaching Groups
Classwork
Assignments
Tests
Attendance
Marks
Profile
```

## Student

```text
Dashboard
My Teaching Groups
Classwork
Assignments
Tests
Attendance
Marks
Profile
```

---

# 60. Faculty Teaching Group Dashboard

Example:

```text
First Year Mathematics
2026–27 • Semester 1

[ Stream ]
[ Classwork ]
[ Students ]
[ Attendance ]
[ Marks ]

────────────────────────

Recent Activity
Assignments
Tests
Attendance Summary
```

---

# 61. Archive UI

Teacher should have:

```text
My Teaching Groups

ACTIVE
──────────────
Mathematics
Java Programming

ARCHIVED
──────────────
Mathematics • 2025–26 • Sem 2
Physics • 2025–26 • Sem 2
```

Archive action:

```text
[ Archive Group ]
```

Confirmation:

> Archiving hides this Teaching Group from your active workspace. Existing attendance, classwork, submissions and marks will remain accessible.

---

# 62. Reporting

Reporting should support filters such as:

```text
Academic Year
Semester
Department
Teaching Group
Teacher
Student
Date Range
```

Examples:

```text
2026–27 → Semester 1
```

can retrieve relevant historical data.

Reports should distinguish:

```text
IoT Campus Presence
```

from:

```text
Official Subject Attendance
```

Never label them as the same source.

---

# 63. Future Mobile Application

The backend/data model must be API-first enough to support a future mobile application.

Future mobile features may include:

- Student dashboard
- Assignments
- Test marks
- Attendance
- Notifications
- Teaching-group access
- Submission uploads

Do not build the mobile application as part of the current core implementation unless explicitly requested.

---

# 64. Future Modules

Design extension points for:

```text
Assignments
Tests
Marks
Announcements
Notifications
Timetable
Examinations
Mobile App
Cloud Synchronization
```

Do not implement future modules in a way that complicates the current core.

---

# 65. Explicitly Obsolete Requirements

Antigravity must remove/replace these concepts from the previous design:

### REMOVE

```text
Class Teacher as mandatory special role
```

Student enrollment does not depend on a Class Teacher.

### REMOVE

```text
Global Subject Catalog
```

Teacher enters subject name directly inside Teaching Group.

### REMOVE

```text
Admin Device Registration
```

HOD registers department IoT devices.

### REMOVE

```text
HOD approval for every student
```

Any authorized department teacher can process department student enrollment requests.

### REMOVE

```text
IoT attendance = official attendance
```

IoT data is evidence only.

### REMOVE

```text
Teaching Group must belong to one department
```

Teaching Groups can contain students from multiple departments.

### REMOVE

```text
Separate register manually created before teaching group
```

Teaching Group automatically generates its Official Register.

---

# 66. Core Invariants

Antigravity must preserve these invariants.

### Invariant 1

```text
One active HOD per department.
```

### Invariant 2

```text
No-department faculty → Common Faculty Manager approval.
```

### Invariant 3

```text
Department faculty → their department HOD approval.
```

### Invariant 4

```text
HOD registration → Admin approval.
```

### Invariant 5

```text
Any authorized department teacher can process
department student enrollment requests.
```

### Invariant 6

```text
Teacher can freely create Official Teaching Groups.
```

### Invariant 7

```text
Teaching Group has its own subject_name.
```

### Invariant 8

```text
No global subject catalog is required.
```

### Invariant 9

```text
Teaching Group stores Academic Year + Semester.
```

### Invariant 10

```text
Official Register inherits Academic Year + Semester
from Teaching Group.
```

### Invariant 11

```text
Archived Teaching Groups retain all historical data.
```

### Invariant 12

```text
IoT attendance events are independent raw evidence.
```

### Invariant 13

```text
IoT events never automatically finalize official attendance.
```

### Invariant 14

```text
Teacher reviews ESP Sync results before finalization.
```

### Invariant 15

```text
Department IoT devices belong to departments.
```

### Invariant 16

```text
HOD manages department IoT devices.
```

### Invariant 17

```text
Department teachers can register fingerprints
for students of their department.
```

### Invariant 18

```text
Common faculty can use relevant IoT evidence
through ESP Sync for their Teaching Groups.
```

### Invariant 19

```text
Historical academic records are never overwritten
when a student changes department or a group is archived.
```

### Invariant 20

```text
Official attendance percentage comes from finalized
teacher attendance records, not raw IoT scans.
```

---

# 67. Antigravity Migration Instructions

**Do not simply append these features to the old architecture.**

First inspect the existing project and identify:

```text
Old database schema
Old roles
Old permissions
Old student approval workflow
Old subject model
Old attendance model
Old device registration
Old Teaching Group/class model
Old frontend navigation
Old APIs
```

Then produce a migration plan.

Prioritize the following structural changes:

```text
OLD                         NEW
────────────────────────────────────────────
Class Teacher          →   Remove dependency
Global Subjects        →   Remove
Admin Device Register  →   HOD Device Register
HOD student approval   →   Department teacher approval
Rigid class hierarchy  →   Department + Teaching Group separation
Subject container      →   Teacher-created Teaching Group
Manual register        →   Auto-created register
IoT = attendance       →   IoT = evidence
Single-dept group      →   Mixed-department groups
Delete old group       →   Archive group
```

Do not destroy compatible historical data.

If migration is required, create explicit migration scripts and preserve historical records.

---

# 68. Implementation Priority

Build in this order:

### Phase 1 — Foundation

```text
Authentication
Users
Roles
Departments
Academic Years
Semesters
```

### Phase 2 — Faculty

```text
Faculty registration
Approval workflow
HOD assignment
Common Faculty Manager
Faculty permissions
```

### Phase 3 — Students

```text
Student registration
Department enrollment
Enrollment approval
Student profile
```

### Phase 4 — Teaching Groups

```text
Create group
Subject name
Theory/Practical
Academic Year
Semester
Invite code
Membership
Archive
```

### Phase 5 — Official Attendance

```text
Automatic register
Sessions
Calendar/register UI
Manual attendance
Finalization
Correction/audit
```

### Phase 6 — IoT

```text
Device management
Fingerprint enrollment
IoT events
ESP32 API
ESP Sync
```

### Phase 7 — Classroom Features

```text
Stream
Classwork
Assignments
Submissions
Tests
Marks
```

### Phase 8 — Reporting

```text
Academic-year filters
Semester filters
Department reports
Teaching-group reports
Attendance reports
Marks reports
IoT presence reports
```

---

# 69. Final System Concept

The final system should behave conceptually like this:

```text
                         ADMIN
                           │
          ┌────────────────┼────────────────┐
          │                │                │
      HOD Management   Faculty Approval   Common Faculty
                                           Manager
          │
          ▼
      DEPARTMENT
          │
     ┌────┼───────────┐
     │    │           │
    HOD Faculty     Students
     │    │           │
     │    │           ├── Department Enrollment
     │    │           └── Biometric Identity
     │    │
     │    └────────────────────┐
     │                         │
     │                    TEACHING GROUP
     │                         │
     │            ┌────────────┼────────────┐
     │            │            │            │
     │          Stream      Classwork    Attendance
     │                         │            │
     │                  ┌──────┼──────┐     │
     │                  │      │      │     │
     │             Assignment Test Material │
     │                  │      │            │
     │                Marks   Marks          │
     │                                       │
     │                                  ESP Sync
     │                                       │
     ▼                                       ▼
Department IoT                         Official Register
     │                                       │
     ▼                                       ▼
Fingerprint → ESP32 → IoT Events → Review → Finalize
```

## The most important architectural rule

**Department answers: "Who does this student belong to institutionally?"**

**Teaching Group answers: "Who is teaching this student this subject/component?"**

**IoT attendance answers: "Was this student's biometric identity detected physically?"**

**Official Register answers: "What attendance did the teacher officially record for this teaching session?"**

**Classwork/Marks answers: "What academic work and assessment happened in this Teaching Group?"**

Keeping those four concepts separate is what makes the system work for your college's mixed first-year structure without forcing everything into a rigid department/class hierarchy.