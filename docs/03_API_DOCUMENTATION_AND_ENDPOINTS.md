# 📡 REST API Documentation & Endpoint Directory

All endpoints in Vidya follow standard REST conventions under the `/api/v1/` prefix.

## 1. Authentication & Response Headers

### Standard Request Headers
```http
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

### Standard Response Envelope
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional user-facing success string"
}
```

### Error Response Envelope
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR | NOT_FOUND | UNAUTHORIZED | FORBIDDEN | CONFLICT | INTERNAL_SERVER_ERROR",
    "message": "Descriptive error message",
    "details": []
  }
}
```

---

## 2. Comprehensive Endpoint Matrix (All 17 Modules)

### 2.1 Authentication Module (`/api/v1/auth/*`)
- `POST /api/v1/auth/login` — User credential authentication & JWT token generation.
- `POST /api/v1/auth/google` — Google OAuth credential exchange & account linking.
- `GET /api/v1/auth/me` — Retrieve current authenticated user profile & active roles.
- `POST /api/v1/auth/logout` — Invalidate active user session token.
- `POST /api/v1/auth/change-password` — Update user account password with verification.
- `POST /api/v1/auth/request-password-reset` — Issue OTP for forgot-password recovery.
- `POST /api/v1/auth/verify-reset-otp` — Verify password reset OTP code.
- `POST /api/v1/auth/reset-password-with-otp` — Complete password reset with verified token.

### 2.2 System Administration Module (`/api/v1/admin/*`)
- `GET /api/v1/admin/dashboard` — Institutional dashboard overview & campus KPIs.
- `GET /api/v1/admin/departments` — List all academic departments and assigned HODs.
- `POST /api/v1/admin/departments` — Create new academic department.
- `PUT /api/v1/admin/departments/:id` — Update department details or reassign HOD.
- `DELETE /api/v1/admin/departments/:id` — Delete department with safety verification.
- `GET /api/v1/admin/academic-years` — List academic calendar years.
- `POST /api/v1/admin/academic-years` — Create academic year calendar.
- `PUT /api/v1/admin/academic-years/:id/set-current` — Activate current academic year.
- `GET /api/v1/admin/audit-logs` — Query institutional audit trail with filtering.
- `GET /api/v1/admin/analytics` — Campus-wide attendance and demographic analytics.

### 2.3 Head of Department Module (`/api/v1/hod/*`)
- `GET /api/v1/hod/dashboard` — Department KPIs, active registers, and daily schedule.
- `GET /api/v1/hod/teachers` — List all departmental faculty members.
- `POST /api/v1/hod/teachers` — Provision new faculty account and profile.
- `PUT /api/v1/hod/teachers/:id` — Update teacher details.
- `DELETE /api/v1/hod/teachers/:id` — Deactivate or remove teacher.
- `GET /api/v1/hod/subjects` — List departmental curriculum subjects.
- `POST /api/v1/hod/subjects` — Create new subject in curriculum.
- `PUT /api/v1/hod/subjects/:id` — Update subject metadata.
- `GET /api/v1/hod/assignments` — List teacher course assignments.
- `POST /api/v1/hod/assignments/subject-teacher` — Assign faculty to course register.
- `POST /api/v1/hod/assignments/class-teacher` — Appoint Class Teacher for cohort.
- `GET /api/v1/hod/promotion/preview` — Preview cohort semester progression.
- `POST /api/v1/hod/promotion/execute` — Execute batch semester promotion with roll reindex.
- `GET /api/v1/hod/archive` — View graduated alumni records and lifetime attendance stats.

### 2.4 Faculty Module (`/api/v1/faculty/*`)
- `GET /api/v1/faculty/dashboard` — Faculty dashboard with assigned classes & fast actions.
- `GET /api/v1/faculty/registers` — List active attendance registers assigned to teacher.
- `GET /api/v1/faculty/registers/:id` — Retrieve full register details and monthly session matrix.
- `POST /api/v1/faculty/registers/:id/mark-cell` — Toggle attendance status for a single student on a date.
- `GET /api/v1/faculty/cohorts` — List cohort demographics under teacher purview.
- `POST /api/v1/faculty/cohorts/registration-toggle` — Open/close student self-registration gate.
- `GET /api/v1/faculty/registers/:id/export/excel` — Export formatted Excel attendance workbook.
- `GET /api/v1/faculty/registers/:id/internal-evaluation` — Retrieve internal evaluation marksheet.

### 2.5 Attendance Sessions Module (`/api/v1/attendance/*`)
- `POST /api/v1/attendance/sessions` — Create a new lecture attendance session (`DRAFT`).
- `POST /api/v1/attendance/sessions/:id/open` — Open session for student claims (`OPEN`).
- `POST /api/v1/attendance/sessions/:id/finalize` — Finalize and lock session (`FINALIZED`).
- `POST /api/v1/attendance/sessions/:id/pin` — Generate rotating 6-digit session PIN.
- `POST /api/v1/attendance/sessions/:id/qr` — Generate dynamic cryptographic QR token.
- `GET /api/v1/attendance/sessions/:id/claims` — Retrieve live student check-in claims feed.
- `POST /api/v1/attendance/claims/:claimId/adjudicate` — Approve or reject student check-in claim.

### 2.6 Students Module (`/api/v1/students/*`)
- `GET /api/v1/students/dashboard` — Student personalized dashboard with cumulative stats.
- `GET /api/v1/students/profile` — Detailed student academic dossier and enrollment info.
- `GET /api/v1/students/attendance` — Subject-by-subject attendance records with 75% predictor.
- `POST /api/v1/students/check-in/pin` — Submit 6-digit PIN code for lecture attendance.
- `POST /api/v1/students/check-in/qr` — Submit scanned dynamic QR token for lecture attendance.
- `POST /api/v1/students/register` — Public student self-registration submission.

### 2.7 Coursework & Assignments Module (`/api/v1/assignments/*`)
- `GET /api/v1/assignments` — List assignments filtered by subject and cohort.
- `POST /api/v1/assignments` — Create a new assignment with deadline and attachment.
- `GET /api/v1/assignments/:id/submissions` — Retrieve all student submissions for grading.
- `POST /api/v1/assignments/:id/submit` — Student upload of assignment file.
- `POST /api/v1/assignments/submissions/:subId/grade` — Faculty grading and feedback entry.

### 2.8 Class Tests & Exams Module (`/api/v1/exams/*`)
- `GET /api/v1/exams` — List exams and class tests.
- `POST /api/v1/exams` — Schedule new class test or internal evaluation.
- `GET /api/v1/exams/:id/scores` — Retrieve full cohort score roster.
- `POST /api/v1/exams/:id/scores` — Batch submit scores for whole class.

### 2.9 Devices & ESP32 Module (`/api/v1/devices/*`)
- `GET /api/v1/devices` — List all hardware biometric terminals.
- `POST /api/v1/devices` — Register new terminal device with secret hash.
- `POST /api/v1/devices/heartbeat` — Device heartbeat ping reporting online status.
- `POST /api/v1/devices/presence` — Device upload of biometric student fingerprint scans.
- `PATCH /api/v1/devices/:id/toggle` — Enable or disable terminal.

### 2.10 Leave Applications Module (`/api/v1/leave/*`)
- `GET /api/v1/leave` — List leave applications (faculty view pending, student view own).
- `POST /api/v1/leave` — Student applies for leave with date range and reason.
- `POST /api/v1/leave/:id/adjudicate` — Teacher approves or rejects leave request.

### 2.11 Teaching Groups Module (`/api/v1/teaching-groups/*`)
- `GET /api/v1/teaching-groups` — List practical/lab batches and tutorial sub-groups.
- `POST /api/v1/teaching-groups` — Create teaching group with assigned student subset.
- `POST /api/v1/teaching-groups/:id/members` — Add/remove students from group.

### 2.12 Timetable Module (`/api/v1/timetable/*`)
- `GET /api/v1/timetable` — Weekly lecture schedule for cohort or teacher.
- `POST /api/v1/timetable/slots` — Create or update recurring timetable period slot.

### 2.13 Reports Module (`/api/v1/reports/*`)
- `GET /api/v1/reports/attendance` — Aggregated attendance report by date and department.
- `GET /api/v1/reports/defaulters` — List students falling below the 75% attendance threshold.

### 2.14 Notifications Module (`/api/v1/notifications/*`)
- `GET /api/v1/notifications` — List in-app notifications for authenticated user.
- `PATCH /api/v1/notifications/:id/read` — Mark notification as read.
- `GET /api/v1/notifications/unread-count` — Count badge for navigation headers.

### 2.15 Media & Drive Module (`/api/v1/media/*`)
- `POST /api/v1/media/upload` — Multipart file upload (images, coursework documents, syllabus files).
- `GET /api/v1/media/files` — List user's uploaded repository files.

### 2.16 CourseFile Module (`/api/v1/course-file/*`)
- `GET /api/v1/course-file/:registerId` — Retrieve course file dossier (syllabus, lectures, notes).
- `POST /api/v1/course-file/:registerId` — Update course file sections and instructional plans.

### 2.17 Curriculum Module (`/api/v1/curriculum/*`)
- `GET /api/v1/curriculum/departments` — List curriculum branches mapped to IRDT schemes.
- `GET /api/v1/curriculum/subjects` — Query standardized curriculum subjects by branch and semester.
