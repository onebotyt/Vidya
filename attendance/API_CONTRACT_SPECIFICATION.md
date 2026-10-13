# UIAP College Attendance System — Complete REST API Contract

> **Version:** 1.0.0 (Authoritative Implementation Contract)  
> **Base URL:** `/api/v1`  
> **Database Foundation:** Derived strictly from `001_initial_schema.sql` (MySQL 8.x)  
> **Security Protocol:** HTTPS (Self-signed server TLS cert) + JWT (Access: 15–60m, Refresh: 7–30d)

---

## 1. Global Conventions & Standards

### 1.1 Content Negotiation
- All endpoints accept and return `application/json; charset=utf-8` by default.
- **Export Exception:** Endpoints that generate documents return binary file streams with appropriate MIME types:
  - Excel: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
  - PDF: `application/pdf`
  - CSV: `text/csv; charset=utf-8`

### 1.2 Authentication & Authorization Header
- Authenticated requests must include:  
  `Authorization: Bearer <access_token>`
- Refresh tokens are delivered in a secure, `httpOnly`, `sameSite=Strict` cookie named `refreshToken`.
- **JWT Payload Standard:**
  ```json
  {
    "user_id": 105,
    "roles": ["STUDENT"],
    "session_id": 42,
    "exp": 1772900000
  }
  ```
  *Note:* No academic cohort or subject scopes are embedded in JWTs. Academic permissions are evaluated dynamically from `teacher_assignments` on every request.

### 1.3 Transactional Identifier Synchronization Invariant
- **Rule:** For student accounts, `users.username` and `students.official_enrollment_no` must always hold the identical value (e.g. `'2024IT047'`).
- **Backend Enforcement:** Because MySQL cannot cross-table validate via standard `CHECK`, all student creation, provisioning, and profile update endpoints execute within an explicit database transaction (`START TRANSACTION ... COMMIT`) guaranteeing strict 1-to-1 synchronization.

### 1.4 Standard Response Formats

#### Success Envelope
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional human-readable feedback"
}
```

#### Error Envelope
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR | UNAUTHORIZED | FORBIDDEN | NOT_FOUND | CONFLICT | RATE_LIMITED | INTERNAL_SERVER_ERROR",
    "message": "Specific error description",
    "details": [ ... ]
  }
}
```

---

## 2. Authentication & Account Lifecycle (`/api/v1/auth`)

### 2.1 Faculty Login
- **Method / Path:** `POST /api/v1/auth/faculty/login`
- **Auth:** Public
- **Request Body:**
  ```json
  {
    "username": "prof.sharma@college.local",
    "password": "FacultySecurePassword123!"
  }
  ```
- **DB Operations:**
  1. Queries `users u JOIN user_roles ur ON ur.user_id = u.id` WHERE `(u.username = ? OR u.email = ?) AND ur.role IN ('TEACHER', 'SYSTEM_ADMIN')`.
  2. Compares `bcrypt.compare(password, u.password_hash)`.
  3. Verifies `u.status = 'ACTIVE'`.
  4. Inserts row into `user_sessions`.
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "data": {
      "access_token": "eyJhbGciOi...",
      "user": {
        "id": 12,
        "username": "prof.sharma",
        "email": "prof.sharma@college.local",
        "roles": ["TEACHER"]
      }
    }
  }
  ```

---

### 2.2 Student Login (Method B & Standard)
- **Method / Path:** `POST /api/v1/auth/student/login`
- **Auth:** Public
- **Request Body:**
  ```json
  {
    "enrollment_no": "2024IT047",
    "password": "Xk9#m2P"
  }
  ```
- **DB Operations:**
  1. Queries `users u JOIN students s ON s.user_id = u.id` WHERE `u.username = ?`.
  2. Account status evaluation:
     - If `u.status = 'PROVISIONED'`: Validates `bcrypt.compare(password, u.temp_password_hash)`. If valid, returns `must_change_password: true` and a short-lived, restricted `activation_token` (valid for 15 minutes, authorized solely for `/api/v1/auth/student/activate`).
     - If `u.status = 'ACTIVE'`: Validates `bcrypt.compare(password, u.password_hash)`. Issues full access token.
     - If `u.status = 'PENDING'`: Returns `403 Forbidden` (`"Registration pending Class Teacher approval"`).
     - If `u.status = 'REJECTED'`: Returns `403 Forbidden` (`"Registration rejected: [rejection_reason]"`).
     - If `u.status = 'SUSPENDED'`: Returns `403 Forbidden` (`"Account suspended. Contact administrator."`).
- **Response `200 OK` (Standard Active Account):**
  ```json
  {
    "success": true,
    "data": {
      "access_token": "eyJhbGciOi...",
      "must_change_password": false,
      "user": {
        "id": 105,
        "official_enrollment_no": "2024IT047",
        "full_name": "Rahul Sharma",
        "status": "ACTIVE"
      }
    }
  }
  ```
- **Response `200 OK` (First-Time Provisioned Account):**
  ```json
  {
    "success": true,
    "data": {
      "activation_token": "eyJhbGciOi...",
      "must_change_password": true,
      "student": {
        "full_name": "Rahul Sharma",
        "official_enrollment_no": "2024IT047"
      },
      "message": "Temporary credentials validated. Please set your permanent password."
    }
  }
  ```

---

### 2.3 Student Activation (Restricted Pre-Auth Endpoint)
- **Method / Path:** `POST /api/v1/auth/student/activate`
- **Auth:** Restricted `activation_token` (Authorization: Bearer <activation_token>)
- **Security Protections:**
  - **Heavily Rate-Limited:** Max 5 attempts per 15 minutes per IP.
  - **Enumeration-Safe:** Returns generic error response on invalid token.
- **Request Body:**
  ```json
  {
    "new_password": "NewPermanentSecurePass123!",
    "confirm_password": "NewPermanentSecurePass123!"
  }
  ```
- **DB Operations:**
  1. Validates `new_password === confirm_password` and length >= 8.
  2. Extracts `user_id` from verified `activation_token`.
  3. Executes atomic update within a transaction:
     ```sql
     UPDATE users SET
       password_hash = ?,
       temp_password_hash = NULL,
       must_change_password = FALSE,
       status = 'ACTIVE'
     WHERE id = ? AND status = 'PROVISIONED';
     ```
  4. Creates row in `user_sessions` and issues standard access token + refresh cookie.
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "data": {
      "access_token": "eyJhbGciOi...",
      "message": "Account successfully activated. Welcome to your portal!"
    }
  }
  ```

---

### 2.4 Authenticated Password Change
- **Method / Path:** `POST /api/v1/auth/password/change`
- **Auth:** Authenticated (`users`)
- **Request Body:**
  ```json
  {
    "current_password": "CurrentPassword123!",
    "new_password": "NewSecurePassword456!",
    "confirm_password": "NewSecurePassword456!"
  }
  ```
- **DB Operations:**
  1. Verifies `current_password` matches `u.password_hash`.
  2. Updates `users.password_hash = bcrypt(new_password)`.
  3. Invalidates all existing refresh sessions except current in `user_sessions`.
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "message": "Password changed successfully."
  }
  ```

---

### 2.5 Google OAuth Activation / Login & Account Linking
- **Student Google Login:** `POST /api/v1/auth/google/student` (Public)
  - Validates Google ID token via `google-auth-library`.
  - If `u.status = 'PROVISIONED'` and `u.email == verified_email` and `google_sub IS NULL`:
    Atomically links `google_sub`, transitions `status = 'ACTIVE'`, clears `temp_password_hash`, and issues session.
- **Faculty Google Login:** `POST /api/v1/auth/google/faculty` (Public)
  - Validates Google token; logs faculty in if email is pre-linked.
- **Link Google Account:** `POST /api/v1/auth/google/link` (Authenticated)
  - **Body:** `{ "id_token": "eyJhbGciOi..." }`
  - Verifies token and updates `users.google_sub = verified_sub WHERE id = req.user.id`.
- **Unlink Google Account:** `DELETE /api/v1/auth/google/link` (Authenticated)
  - Requires `u.password_hash IS NOT NULL` (cannot unlink if password is unset).
  - Updates `users.google_sub = NULL`.

---

### 2.6 Token Refresh & Logout
- **Token Refresh:** `POST /api/v1/auth/refresh`
  - Reads `refreshToken` cookie, looks up valid entry in `user_sessions`, generates rotated token pair.
- **Logout:** `POST /api/v1/auth/logout`
  - Sets `is_revoked = TRUE` in `user_sessions`, clears `refreshToken` cookie.

---

## 3. Student Self-Service Portal (`/api/v1/students/me`)

### 3.1 Get Profile & Current Cohort
- **Method / Path:** `GET /api/v1/students/me`
- **Auth:** Student (`role: STUDENT`)
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "data": {
      "student_id": 52,
      "user_id": 105,
      "official_enrollment_no": "2024IT047",
      "full_name": "Rahul Sharma",
      "email": "rahul.sharma@gmail.com",
      "google_linked": true,
      "cohort": {
        "department_id": 1,
        "department_name": "Information Technology",
        "department_code": "IT",
        "branch_id": 1,
        "branch_name": "B.Tech - Information Technology",
        "year": 2,
        "semester": 4,
        "academic_year_id": 1,
        "academic_year": "2026-27",
        "class_roll_no": 15
      }
    }
  }
  ```

---

### 3.2 Get Attendance Stats & Prediction Metrics
- **Method / Path:** `GET /api/v1/students/me/attendance/stats`
- **Auth:** Student (`role: STUDENT`)
- **Query Parameters:** `?subject_id=1` (optional; returns overall + subject list if omitted)
- **DB Computation:**
  - $P = \text{count}(\text{PRESENT}) + \text{count}(\text{LATE})$ from `register_attendance` joined with `attendance_sessions` (where `state = 'FINALIZED'` and `included = TRUE`).
  - $C = \text{count}(\text{finalized sessions where student was included})$.
  - Percentage: $(P / C) \times 100$.
  - Threshold: $T$ from `system_settings` (default $75\% \rightarrow 0.75$).
  - Safe Absences ($P/C \ge T$): $X = \lfloor (P - T \times C) / T \rfloor$.
  - Classes Needed to Recover ($P/C < T$): $Y = \lceil (T \times C - P) / (1 - T) \rceil$.
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "data": {
      "overall": {
        "conducted_sessions": 40,
        "attended_sessions": 33,
        "present_count": 31,
        "late_count": 2,
        "absent_count": 7,
        "percentage": 82.5,
        "threshold_percent": 75.0,
        "is_eligible": true,
        "safe_absences_remaining": 4,
        "recovery_classes_needed": 0
      },
      "subjects": [
        {
          "subject_id": 1,
          "subject_name": "Database Management Systems",
          "subject_code": "IT401",
          "conducted": 10,
          "attended": 9,
          "percentage": 90.0,
          "safe_absences_remaining": 2,
          "recovery_classes_needed": 0
        },
        {
          "subject_id": 2,
          "subject_name": "Operating Systems",
          "subject_code": "IT402",
          "conducted": 10,
          "attended": 7,
          "percentage": 70.0,
          "safe_absences_remaining": 0,
          "recovery_classes_needed": 2
        }
      ]
    }
  }
  ```

---

### 3.3 Submit Soft Self-Attendance (PIN or QR Token)
- **Method / Path:** `POST /api/v1/students/me/attendance/verify`
- **Auth:** Student (`role: STUDENT`)
- **Request Body:**
  ```json
  {
    "session_id": 142,
    "method": "PIN",
    "pin_code": "482910"
  }
  ```
  *(Or `method: "QR", "token": "a8f3b..."`)*
- **DB Operations:**
  1. Checks `attendance_sessions` WHERE `id = 142` AND `state = 'OPEN'`.
  2. Verifies student is in `attendance_session_students` for this session (`included = TRUE`).
  3. Validates PIN against `attendance_session_pins` (verifying `expires_at > NOW()`).
  4. Inserts into `student_self_attendance`:
     ```sql
     INSERT INTO student_self_attendance (session_id, student_id, verification_method, request_status)
     VALUES (?, ?, 'PIN', 'PENDING');
     ```
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "message": "Self-attendance request submitted. Awaiting teacher confirmation."
  }
  ```

---

## 4. Faculty Attendance Register & Sessions (`/api/v1/attendance`)

### 4.1 Create Attendance Session
- **Method / Path:** `POST /api/v1/attendance/sessions`
- **Auth:** Faculty (`role: TEACHER`)
- **Request Body:**
  ```json
  {
    "subject_id": 1,
    "department_id": 1,
    "branch_id": 1,
    "year": 2,
    "semester": 4,
    "academic_year_id": 1,
    "session_type": "THEORY",
    "label": "Lecture 14 - Relational Algebra",
    "start_time": "2026-09-08T10:00:00Z",
    "auto_close_minutes": 15
  }
  ```
- **DB Operations:**
  1. Validates teacher is assigned to this subject/cohort via `teacher_assignments`.
  2. Inserts record into `attendance_sessions` with `state = 'DRAFT'`, `auto_close_at = start_time + INTERVAL 15 MINUTE`.
  3. Freezes roster snapshot: queries all active students from `enrollments` for this cohort and inserts rows into `attendance_session_students`.
- **Response `201 Created`:**
  ```json
  {
    "success": true,
    "data": {
      "session_id": 142,
      "state": "DRAFT",
      "total_students_rostered": 48
    }
  }
  ```

---

### 4.2 Transition Session State
- **Method / Path:** `PATCH /api/v1/attendance/sessions/:id/state`
- **Auth:** Faculty (`role: TEACHER`)
- **Request Body:**
  ```json
  {
    "state": "OPEN"
  }
  ```
- **Lifecycle Rules:**
  - `DRAFT -> OPEN`: Activates student soft self-attendance submissions and ESP32 scan correlation.
  - `OPEN -> CLOSED`: Closes student self-attendance submissions (triggered manually or by background timer).
  - `CLOSED -> FINALIZED`: Teacher verifies the complete register and permanently locks the session.

---

### 4.3 Get Session Register & Evidence
- **Method / Path:** `GET /api/v1/attendance/sessions/:id/register`
- **Auth:** Faculty (`role: TEACHER`)
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "data": {
      "session": {
        "id": 142,
        "state": "CLOSED",
        "subject_name": "Database Management Systems",
        "session_type": "THEORY",
        "start_time": "2026-09-08T10:00:00Z"
      },
      "students": [
        {
          "student_id": 52,
          "class_roll_no": 1,
          "official_enrollment_no": "2024IT001",
          "full_name": "Arjun Mehta",
          "account_status": "ACTIVE",
          "included": true,
          "attendance_status": "PRESENT",
          "source": "ESP32_SYNC",
          "esp32_scan_time": "2026-09-08T09:58:22Z",
          "self_attendance_request": null
        },
        {
          "student_id": 53,
          "class_roll_no": 2,
          "official_enrollment_no": "2024IT002",
          "full_name": "Priya Patel",
          "account_status": "PROVISIONED",
          "included": true,
          "attendance_status": "PRESENT",
          "source": "MANUAL",
          "esp32_scan_time": null,
          "self_attendance_request": null
        },
        {
          "student_id": 54,
          "class_roll_no": 3,
          "official_enrollment_no": "2024IT003",
          "full_name": "Rahul Sharma",
          "account_status": "ACTIVE",
          "included": true,
          "attendance_status": null,
          "source": null,
          "esp32_scan_time": null,
          "self_attendance_request": {
            "method": "PIN",
            "submitted_at": "2026-09-08T10:05:14Z",
            "status": "PENDING"
          }
        }
      ]
    }
  }
  ```

---

### 4.4 Save Official Register & Finalize
- **Save Marks:** `PUT /api/v1/attendance/sessions/:id/register`
  - **Body:**
    ```json
    {
      "records": [
        { "student_id": 52, "status": "PRESENT", "source": "ESP32_SYNC" },
        { "student_id": 53, "status": "PRESENT", "source": "MANUAL" },
        { "student_id": 54, "status": "ABSENT", "source": "MANUAL" }
      ]
    }
    ```
- **Finalize Session:** `POST /api/v1/attendance/sessions/:id/finalize`
  - **Integrity Invariant:** Backend checks that every student where `included = TRUE` in `attendance_session_students` has an explicit row in `register_attendance` with `attendance_status IN ('PRESENT', 'ABSENT', 'LATE')`.
  - Rejects with `400 Bad Request` if any student is unmarked.
  - Updates `attendance_sessions.state = 'FINALIZED'`, `end_time = NOW()`.
  - Creates entry in `audit_logs`.

---

## 5. Faculty Cohort & Student Management (`/api/v1/faculty`)

### 5.1 Get Assigned Cohorts
- **Method / Path:** `GET /api/v1/faculty/cohorts`
- **Auth:** Faculty (`role: TEACHER`)
- **Returns:** List of cohorts and subjects assigned to this teacher from `teacher_assignments`.

### 5.2 Get Cohort Students List
- **Method / Path:** `GET /api/v1/faculty/cohorts/:department_id/:branch_id/:year/:semester/students`
- **Auth:** Faculty (`role: TEACHER`)
- **Returns:** Active and provisioned students enrolled in the cohort, ordered by `class_roll_no`.

### 5.3 Bulk Provision Students (Method B)
- **Method / Path:** `POST /api/v1/faculty/students/provision`
- **Auth:** Class Teacher (`role: TEACHER`, assigned to cohort)
- **Request Body:**
  ```json
  {
    "department_id": 1,
    "branch_id": 1,
    "year": 2,
    "semester": 4,
    "academic_year_id": 1,
    "students": [
      {
        "full_name": "Arjun Mehta",
        "official_enrollment_no": "2024IT001",
        "class_roll_no": 1,
        "email": "arjun@gmail.com"
      },
      {
        "full_name": "Priya Patel",
        "official_enrollment_no": "2024IT002",
        "class_roll_no": 2,
        "email": null
      }
    ]
  }
  ```
- **DB Operations (Executed in Transaction per Student):**
  1. Generates secure random 8-character temporary password (e.g. `K9#mQ2xL`).
  2. Inserts into `users` (`username = official_enrollment_no`, `temp_password_hash = bcrypt(temp_pw)`, `status = 'PROVISIONED'`, `must_change_password = TRUE`).
  3. Inserts into `user_roles` (`role = 'STUDENT'`).
  4. Inserts into `students` (`user_id = users.id`, `official_enrollment_no`, `full_name`, `entry_mode = 'teacher_provisioned'`).
  5. Inserts into `enrollments` (`student_id`, cohort details, `class_roll_no`).
- **Response `201 Created`:**
  ```json
  {
    "success": true,
    "data": {
      "provisioned_count": 2,
      "export_token": "exp_8932fa..."
    },
    "message": "Students provisioned. Use export_token to download printable credentials sheet."
  }
  ```

---

### 5.4 Export Credentials Sheet (Excel & PDF Slips)
- **Method / Path:** `GET /api/v1/faculty/students/credentials/export`
- **Auth:** Class Teacher (`role: TEACHER`)
- **Query Parameters:** `?token=exp_8932fa...&format=xlsx` (or `format=pdf`)
- **Response:** Binary file stream.
  - Excel (`format=xlsx`): Returns spreadsheet with `Roll No | Full Name | Official Enrollment No | Temporary Password`.
  - PDF (`format=pdf`): Returns printable grid of cut-out slips (6–8 per page) with student details and temporary credentials.

---

### 5.5 Review & Approve Self-Registered Students (Path C)
- **`GET /api/v1/faculty/registrations`**: Lists all registrations with `u.status = 'PENDING'` for the teacher's assigned cohort.
- **`PATCH /api/v1/faculty/registrations/:student_id`**:
  - **Body:** `{ "decision": "APPROVE" }` $\rightarrow$ Executes `UPDATE users SET status = 'ACTIVE' WHERE id = ?`.
  - **Body:** `{ "decision": "REJECT", "reason": "Not enrolled in Section A" }` $\rightarrow$ Executes `UPDATE users SET status = 'REJECTED', rejection_reason = ? WHERE id = ?`.

---

### 5.6 Cohort Registration Settings (Toggle ON/OFF)
- **`GET /api/v1/faculty/cohort/registration-setting`**:
  - **Query:** `?department_id=1&branch_id=1&year=2&semester=4&academic_year_id=1`
  - Returns `registration_open: true/false`.
- **`PATCH /api/v1/faculty/cohort/registration-setting`**:
  - **Body:** `{ "department_id": 1, "branch_id": 1, "year": 2, "semester": 4, "academic_year_id": 1, "registration_open": false }`
  - Updates `cohort_registration_settings.registration_open`.

---

## 6. Notifications (`/api/v1/notifications`)

### 6.1 List Notifications
- **Method / Path:** `GET /api/v1/notifications`
- **Auth:** Authenticated User
- **Query Parameters:** `?page=1&limit=20&unread_only=false`
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "data": {
      "notifications": [
        {
          "id": 1,
          "title": "Registration Approved",
          "message": "Your registration has been approved by your Class Teacher.",
          "is_read": false,
          "link_url": "/dashboard",
          "created_at": "2026-09-08T09:30:00Z"
        }
      ],
      "total": 1
    }
  }
  ```

### 6.2 Get Unread Notification Count
- **Method / Path:** `GET /api/v1/notifications/unread-count`
- **Auth:** Authenticated User
- **Response `200 OK`:** `{ "success": true, "data": { "unread_count": 3 } }`

### 6.3 Mark Notification as Read
- **Method / Path:** `PATCH /api/v1/notifications/:id/read`
- **Auth:** Authenticated User
- **Response `200 OK`:** `{ "success": true, "message": "Notification marked as read." }`

### 6.4 Mark All Notifications as Read
- **Method / Path:** `POST /api/v1/notifications/read-all`
- **Auth:** Authenticated User
- **Response `200 OK`:** `{ "success": true, "message": "All notifications marked as read." }`

---

## 7. Hardware Devices & Biometrics (`/api/v1/devices`)

### 7.1 Hardware Heartbeat
- **Method / Path:** `POST /api/v1/devices/heartbeat`
- **Headers:** `X-Device-UID: MAC_ADDRESS`, `X-Device-Secret: HMAC_KEY`
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "server_time": "2026-09-08T10:00:00Z",
    "commands": []
  }
  ```

---

### 7.2 ESP32 Batch Scan Upload (Stream 1)
- **Method / Path:** `POST /api/v1/devices/scans`
- **Headers:** `X-Device-UID: MAC_ADDRESS`, `X-Device-Secret: HMAC_KEY`
- **Request Body:**
  ```json
  {
    "device_uid": "3C:71:BF:8A:22:04",
    "events": [
      {
        "event_id": "evt_550e8400-e29b-41d4-a716-446655440000",
        "slot_id": 14,
        "scan_time": "2026-09-08T09:58:22Z"
      }
    ]
  }
  ```
- **DB Operations:**
  1. Verifies device authentication via `secret_hash`.
  2. Resolves `student_id` by looking up `fingerprint_slots` WHERE `device_id = ? AND slot_id = 14`.
  3. Inserts into `esp32_presence`:
     ```sql
     INSERT INTO esp32_presence (event_id, device_id, student_id, scan_time)
     VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE id=id;
     ```
     *(Retry deduplication via `event_id`; distinct scans are retained).*
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "processed": 1,
    "duplicates": 0
  }
  ```

---

### 7.3 Device Slot Management
- **List Device Slots:** `GET /api/v1/devices/:id/slots`
  - Returns array of slots 1..1000 indicating assigned student or vacant.
- **Allocate Slot:** `POST /api/v1/devices/:id/slots/allocate`
  - **Body:** `{ "slot_id": 14, "student_id": 52 }`
  - Inserts row into `fingerprint_slots`.
- **Deallocate Slot:** `DELETE /api/v1/devices/:id/slots/:slot_id`
  - Deletes row from `fingerprint_slots`.
- **Device Status:** `GET /api/v1/devices/:id/status`
  - Returns `last_heartbeat_at`, total enrolled slots, and active cohort assignment.

---

## 8. Reports & Analytics (`/api/v1/reports`)

### 8.1 Daily Attendance Report
- **Method / Path:** `GET /api/v1/reports/daily`
- **Query Parameters:** `?department_id=1&branch_id=1&year=2&semester=4&date=2026-09-08`
- **CSV Export:** `GET /api/v1/reports/daily/csv?...` -> Returns `text/csv`

### 8.2 Defaulter List Report ($< 75\%$)
- **Method / Path:** `GET /api/v1/reports/defaulters`
- **Query Parameters:** `?department_id=1&branch_id=1&year=2&semester=4&academic_year_id=1&threshold=75`
- **CSV Export:** `GET /api/v1/reports/defaulters/csv?...` -> Returns `text/csv`

### 8.3 Student Comprehensive History Report
- **Method / Path:** `GET /api/v1/reports/student/:id`
- **CSV Export:** `GET /api/v1/reports/student/:id/csv` -> Returns `text/csv`

### 8.4 Session Register Export
- **Method / Path:** `GET /api/v1/reports/sessions/:id/csv` -> Returns `text/csv` of finalized session register.

### 8.5 Stream Comparison Report
- **Method / Path:** `GET /api/v1/reports/stream-comparison`
- **Query:** `?session_id=142`
- **Returns:** Comparative matrix showing raw ESP32 presence scans vs student self-attendance submissions vs official teacher register decisions for forensic audit.
