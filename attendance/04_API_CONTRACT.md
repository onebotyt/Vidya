# UIAP College Attendance System — Shared REST API Contract

> **Document Type:** REST API Contract & Interface Specification  
> **Document Identifier:** `docs/04_API_CONTRACT.md`  
> **Version:** 1.0.0 (Authoritative Implementation Contract)  
> **Base URL:** `/api/v1`  
> **Database Foundation:** MySQL 8.x (`001_initial_schema.sql`)  
> **Shared Consumers:** Web Frontend (HTML/CSS/JS), Future React Native Student App, Future React Native Teacher App  
> **Architectural Principle:** The Express.js backend is the **single source of truth**. All clients consume these identical endpoints.

---

## 1. Global Architectural Principles & Protocols

### 1.1 Single Backend Architecture
Both web and mobile clients communicate with the exact same Express REST API layer over HTTP/HTTPS:

```
                    ┌────────────────────────────────────────┐
                    │            On-Premise MySQL DB         │
                    │               (MySQL 8.x)              │
                    └───────────────────▲────────────────────┘
                                        │
                                        │ mysql2 pool
                                        │
                    ┌───────────────────┴────────────────────┐
                    │          Express.js REST API           │
                    │             (/api/v1/*)                │
                    │      Single Backend Source of Truth    │
                    └───────────▲────────────────▲───────────┘
                                │                │
                       JSON over│LAN     JSON over│LAN / Local Wi-Fi
                     (Cookies / │Bearer)   (Bearer│Tokens)
                                │                │
             ┌──────────────────┴──┐          ┌──┴──────────────────┐
             │    Web Frontend     │          │    React Native     │
             │   (HTML5/CSS/JS)    │          │     Mobile App      │
             │   Desktop / Laptop  │          │   iOS & Android     │
             └─────────────────────┘          └─────────────────────┘
```

### 1.2 Content Negotiation & Encodings
- **Default Format:** All JSON endpoints accept and respond with `application/json; charset=utf-8`.
- **Binary & Stream Exports:** Reporting and credential distribution endpoints return binary or plain text streams with explicit MIME headers:
  - Excel Worksheets: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
  - PDF Documents: `application/pdf`
  - CSV Files: `text/csv; charset=utf-8`

### 1.3 Authentication & Session Management
- **Access Tokens:** Short-lived JWT (15–60 minutes).
  - Delivered via standard authorization header: `Authorization: Bearer <access_token>`
  - Payload Standard:
    ```json
    {
      "user_id": 105,
      "roles": ["STUDENT"],
      "session_id": 42,
      "exp": 1772900000
    }
    ```
  - *Zero Scope Pollution:* No cohort IDs or subject IDs are baked into the JWT. Scopes are resolved dynamically on the backend via `teacher_assignments`.
- **Refresh Tokens:** Long-lived (7–30 days).
  - Web Client: Transmitted in a secure `httpOnly`, `sameSite=Strict` cookie named `refreshToken`.
  - Mobile Client: Transmitted via encrypted authorization request body or `X-Refresh-Token` header.
  - Stored as SHA-256 hashes in `user_sessions`.
  - **Rotation & Revocation:** Every refresh request issues a new refresh token and revokes the prior token. Logging out or changing passwords invalidates the session record in `user_sessions`.
- **Google Authentication:**
  - Token verified server-side using `google-auth-library`.
  - Enforces guarded linking and atomic account activation.

### 1.4 Transactional Identifier Synchronization Invariant
> **Strict System Rule:**  
> For all student accounts:
> $$\textbf{users.username} = \textbf{students.official\_enrollment\_no}$$  
> All provisioning, registration, and activation endpoints execute within explicit database transactions (`START TRANSACTION ... COMMIT`) guaranteeing strict 1-to-1 parity.

### 1.5 Standard Response Envelopes

#### Success Envelope
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional human-readable feedback",
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 120
    }
  }
}
```

#### Error Envelope
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR | UNAUTHORIZED | FORBIDDEN | NOT_FOUND | CONFLICT | UNPROCESSABLE_ENTITY | RATE_LIMITED | INTERNAL_SERVER_ERROR",
    "message": "Human-readable description of error condition",
    "details": [
      {
        "field": "official_enrollment_no",
        "message": "Enrollment number is required and must be alphanumeric"
      }
    ]
  }
}
```

---

## 2. Active Attendance API Endpoints (Current Implementation Scope)

---

### Group A: Central Authentication & Session Management

#### A.1 Faculty Login
- **Endpoint:** `POST /api/v1/auth/faculty/login`
- **Auth:** Public
- **Request Body:**
  ```json
  {
    "username": "prof.sharma@college.local",
    "password": "FacultySecurePassword123!"
  }
  ```
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

#### A.2 Student Login (Standard & First-Time Provisioned)
- **Endpoint:** `POST /api/v1/auth/student/login`
- **Auth:** Public
- **Request Body:**
  ```json
  {
    "enrollment_no": "2024IT047",
    "password": "TemporaryOrPermanentPassword"
  }
  ```
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
- **Response `200 OK` (Provisioned Account Awaiting Activation):**
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

#### A.3 Student Password Activation
- **Endpoint:** `POST /api/v1/auth/student/activate`
- **Auth:** Bearer Token (Restricted `activation_token`)
- **Request Body:**
  ```json
  {
    "new_password": "StudentPermanentPassword2026!"
  }
  ```
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "data": {
      "access_token": "eyJhbGciOi...",
      "message": "Account activated successfully. Welcome to the portal!"
    }
  }
  ```

#### A.4 Token Refresh
- **Endpoint:** `POST /api/v1/auth/refresh`
- **Auth:** `refreshToken` (Cookie for Web / Header for Mobile)
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "data": {
      "access_token": "eyJhbGciOi..."
    }
  }
  ```

#### A.5 User Logout
- **Endpoint:** `POST /api/v1/auth/logout`
- **Auth:** Bearer Token
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "message": "Session terminated and refresh token revoked."
  }
  ```

#### A.6 Google Faculty Authentication
- **Endpoint:** `POST /api/v1/auth/google/faculty`
- **Auth:** Public
- **Request Body:** `{ "id_token": "eyJhbGciOi..." }`
- **Response `200 OK`:** Issues JWT access token for active faculty user.

#### A.7 Google Student Authentication
- **Endpoint:** `POST /api/v1/auth/google/student`
- **Auth:** Public
- **Request Body:** `{ "id_token": "eyJhbGciOi..." }`
- **Response `200 OK`:** Executes guarded atomic activation if `status = 'PROVISIONED'`, or authenticates active student.

---

### Group B: Student Self-Registration & Provisioning

#### B.1 Student Self-Registration (Fallback Workflow)
- **Endpoint:** `POST /api/v1/students/register`
- **Auth:** Public
- **Request Body:**
  ```json
  {
    "full_name": "Arjun Mehta",
    "official_enrollment_no": "2024IT099",
    "email": "arjun.mehta@gmail.com",
    "password": "StudentPassword123!",
    "department_id": 1,
    "branch_id": 1,
    "year": 2,
    "semester": 3
  }
  ```
- **Response `201 Created`:** Creates user with `status = 'PENDING'`.

#### B.2 Single Student Provisioning
- **Endpoint:** `POST /api/v1/students/provision`
- **Auth:** Bearer Token (`TEACHER` or `SYSTEM_ADMIN`)
- **Request Body:**
  ```json
  {
    "full_name": "Kavita Rao",
    "official_enrollment_no": "2024IT051",
    "class_roll_no": 18,
    "email": "kavita.rao@gmail.com",
    "department_id": 1,
    "branch_id": 1,
    "year": 2,
    "semester": 3,
    "academic_year_id": 1
  }
  ```
- **Response `201 Created`:**
  ```json
  {
    "success": true,
    "data": {
      "student_id": 108,
      "official_enrollment_no": "2024IT051",
      "class_roll_no": 18,
      "temporary_password": "K9#mQ4vP",
      "status": "PROVISIONED"
    }
  }
  ```

#### B.3 Bulk Student Provisioning (CSV Import)
- **Endpoint:** `POST /api/v1/students/provision/bulk`
- **Auth:** Bearer Token (`TEACHER` or `SYSTEM_ADMIN`)
- **Request Body:** Multipart form data (`file: roster.csv`, `cohort: { department_id, branch_id, year, semester, academic_year_id }`)
- **Response `200 OK`:** Summary of created, skipped, and generated credentials.

#### B.4 Export Provisioned Credentials (Excel / PDF)
- **Endpoint:** `POST /api/v1/students/credentials/export`
- **Auth:** Bearer Token (`TEACHER` or `SYSTEM_ADMIN`)
- **Request Body:**
  ```json
  {
    "department_id": 1,
    "branch_id": 1,
    "year": 2,
    "semester": 3,
    "academic_year_id": 1,
    "format": "EXCEL | PDF"
  }
  ```
- **Response `200 OK`:** Binary stream (`.xlsx` or `.pdf` slips).

#### B.5 List Pending Registrations (Class Teacher Scope)
- **Endpoint:** `GET /api/v1/students/registrations/pending`
- **Auth:** Bearer Token (`TEACHER` with `CLASS_TEACHER` assignment)
- **Response `200 OK`:** List of students with `status = 'PENDING'` for the teacher's cohort.

#### B.6 Adjudicate Registration (Approve / Reject)
- **Endpoint:** `POST /api/v1/students/registrations/:id/adjudicate`
- **Auth:** Bearer Token (`TEACHER` with `CLASS_TEACHER` assignment)
- **Request Body:**
  ```json
  {
    "action": "APPROVE | REJECT",
    "class_roll_no": 25,
    "rejection_reason": "Roll number clash or invalid enrollment ID"
  }
  ```
- **Response `200 OK`:** Updates status to `ACTIVE` or `REJECTED`.

---

### Group C: Student Portal Endpoints (`/students/me/*`)

#### C.1 Get Current Student Profile
- **Endpoint:** `GET /api/v1/students/me`
- **Auth:** Bearer Token (`STUDENT`)
- **Response `200 OK`:** Student identity, current cohort, roll number, and Google connection status.

#### C.2 Update Profile Avatar / Personal Details
- **Endpoint:** `PUT /api/v1/students/me`
- **Auth:** Bearer Token (`STUDENT`)
- **Request Body:** `{ "phone": "+919876543210" }`

#### C.3 Attendance Percentage & Predictive Statistics
- **Endpoint:** `GET /api/v1/students/me/attendance/stats`
- **Auth:** Bearer Token (`STUDENT`)
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "data": {
      "threshold_percentage": 75.0,
      "total_conducted": 18,
      "total_attended": 15,
      "total_absent": 3,
      "current_percentage": 83.33,
      "prediction": {
        "status": "SAFE",
        "safe_absences_remaining": 2,
        "classes_needed_to_recover": 0,
        "message": "You can miss up to 2 classes and stay above 75%."
      }
    }
  }
  ```

#### C.4 Subject-Wise Attendance Breakdown
- **Endpoint:** `GET /api/v1/students/me/attendance/subjects`
- **Auth:** Bearer Token (`STUDENT`)
- **Response `200 OK`:** Array of subjects with conducted, attended, absent, and percentage metrics.

#### C.5 Attendance History Log
- **Endpoint:** `GET /api/v1/students/me/attendance`
- **Auth:** Bearer Token (`STUDENT`)
- **Query Params:** `subject_id`, `from_date`, `to_date`, `page`, `limit`
- **Response `200 OK`:** Paginated history of finalized session records.

---

### Group D: Faculty Portal & Scoped Management

#### D.1 List Assigned Cohorts
- **Endpoint:** `GET /api/v1/faculty/cohorts`
- **Auth:** Bearer Token (`TEACHER`)
- **Response `200 OK`:** Returns list of cohorts assigned to the teacher for the current academic year.

#### D.2 List Assigned Subjects
- **Endpoint:** `GET /api/v1/faculty/subjects`
- **Auth:** Bearer Token (`TEACHER`)
- **Response `200 OK`:** Returns subjects assigned as `SUBJECT_TEACHER`.

#### D.3 List Cohort Students
- **Endpoint:** `GET /api/v1/faculty/cohorts/:id/students`
- **Auth:** Bearer Token (`TEACHER`)
- **Response `200 OK`:** Roster of enrolled students sorted by `class_roll_no`.

---

### Group E: Attendance Core & The Three Streams

#### E.1 Create Attendance Session (DRAFT)
- **Endpoint:** `POST /api/v1/attendance/sessions`
- **Auth:** Bearer Token (`TEACHER` with `SUBJECT_TEACHER` scope)
- **Request Body:**
  ```json
  {
    "subject_id": 4,
    "department_id": 1,
    "branch_id": 1,
    "year": 2,
    "semester": 3,
    "academic_year_id": 1,
    "session_type": "THEORY | PRACTICAL | TUTORIAL | EXTRA",
    "label": "Regular Lecture",
    "start_time": "2026-09-09T10:00:00Z",
    "auto_close_minutes": 30
  }
  ```
- **Response `201 Created`:** Takes snapshot of cohort into `attendance_session_students` with `state = 'DRAFT'`.

#### E.2 Transition Session State
- **Endpoint:** `PUT /api/v1/attendance/sessions/:id/state`
- **Auth:** Bearer Token (`TEACHER`)
- **Request Body:** `{ "state": "OPEN | CLOSED | FINALIZED" }`
- **Response `200 OK`:** State transitioned. Finalization requires all included students to have explicit status.

#### E.3 Generate Session Soft-Verification PIN
- **Endpoint:** `POST /api/v1/attendance/sessions/:id/pin`
- **Auth:** Bearer Token (`TEACHER`)
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "data": {
      "pin": "4821",
      "expires_at": "2026-09-09T10:20:00Z"
    }
  }
  ```

#### E.4 Generate Session Dynamic QR Code Token
- **Endpoint:** `POST /api/v1/attendance/sessions/:id/qr`
- **Auth:** Bearer Token (`TEACHER`)
- **Response `200 OK`:** Returns cryptographic signed payload and expiry.

#### E.5 Student Submit Self-Attendance (Button / PIN / QR)
- **Endpoints:**
  - `POST /api/v1/attendance/sessions/:id/self-attendance` (Button)
  - `POST /api/v1/attendance/sessions/:id/self-attendance/pin` (with `{ "pin": "4821" }`)
  - `POST /api/v1/attendance/sessions/:id/self-attendance/qr` (with `{ "qr_token": "..." }`)
- **Auth:** Bearer Token (`STUDENT`)
- **Response `201 Created`:** Records request in `student_self_attendance` with `request_status = 'PENDING'`.

#### E.6 Teacher Review Self-Attendance Requests
- **Endpoint:** `GET /api/v1/attendance/sessions/:id/self-attendance`
- **Auth:** Bearer Token (`TEACHER`)
- **Response `200 OK`:** Returns pending self-attendance submissions.

#### E.7 Adjudicate Self-Attendance Request
- **Endpoint:** `POST /api/v1/attendance/sessions/:id/self-attendance/:reqId/adjudicate`
- **Auth:** Bearer Token (`TEACHER`)
- **Request Body:** `{ "action": "ACCEPT | REJECT" }`
- **Response `200 OK`:** If accepted, records `attendance_status = 'PRESENT'` with `source = 'SELF_REQUEST'` in `register_attendance`.

#### E.8 Synchronize Raw ESP32 Scans
- **Endpoint:** `POST /api/v1/attendance/sessions/:id/sync-esp32`
- **Auth:** Bearer Token (`TEACHER`)
- **Response `200 OK`:** Correlates `esp32_presence` records within the session time window; pre-populates matched students as `PRESENT` (`source = 'ESP32_SYNC'`).

#### E.9 Bulk Save / Finalize Register Records
- **Endpoint:** `POST /api/v1/attendance/sessions/:id/records`
- **Auth:** Bearer Token (`TEACHER`)
- **Request Body:**
  ```json
  {
    "records": [
      { "student_id": 101, "attendance_status": "PRESENT", "source": "MANUAL", "teacher_notes": null },
      { "student_id": 102, "attendance_status": "ABSENT", "source": "MANUAL", "teacher_notes": "Sick" }
    ]
  }
  ```
- **Response `200 OK`:** Saves records into `register_attendance`.

---

### Group F: Hardware Device Webhook & Management

#### F.1 ESP32 Scan Webhook (Autonomous Presence Log)
- **Endpoint:** `POST /api/v1/devices/webhook/scan`
- **Auth:** Device Pre-Shared Key Header (`X-Device-Secret: <secret_key>`)
- **Request Body (Single Scan or Offline Batch):**
  ```json
  {
    "device_uid": "ESP32_LAB3_01",
    "scans": [
      {
        "slot_id": 42,
        "event_id": "8f1b2b4e-7b43-4e31-8f23-6b30f8a8470a",
        "scanned_at": "2026-09-09T10:05:12Z",
        "battery": 92
      }
    ]
  }
  ```
- **Response `200 OK`:** Maps `(device_uid + slot_id)` to student, inserts into `esp32_presence`, deduplicating via `UNIQUE(event_id)`.

---

### Group G: Reports & Analytics API

#### G.1 Teacher Register Report (Official)
- **Endpoint:** `GET /api/v1/reports/teacher-register`
- **Auth:** Bearer Token (`TEACHER` or `SYSTEM_ADMIN`)
- **Query Params:** `department_id`, `branch_id`, `year`, `semester`, `subject_id`, `from_date`, `to_date`, `export` (`json | csv | excel`)
- **Response `200 OK`:** Official attendance figures based strictly on finalized sessions.

#### G.2 Stream Comparison Report (Discrepancy Audit)
- **Endpoint:** `GET /api/v1/reports/stream-comparison`
- **Auth:** Bearer Token (`TEACHER` or `SYSTEM_ADMIN`)
- **Query Params:** `session_id`
- **Response `200 OK`:** Side-by-side comparison of Teacher Register vs ESP32 Biometric Presence (`MATCH | MISMATCH`).

---

## 3. Required Endpoints to be Added (Planning Specifications)

The following endpoints are required to complete operational workflows across web and mobile.  
**STATUS: PLANNED / NOT IMPLEMENTED IN CURRENT PHASE.**

---

### Category 1: User Account & Security Extensions

#### 1.1 Password Change (Authenticated User)
- **Designation:** `[FUTURE / PLANNED - NOT IMPLEMENTED]`
- **Method / Path:** `POST /api/v1/auth/password/change`
- **Auth:** Bearer Token (Authenticated `TEACHER`, `STUDENT`, or `SYSTEM_ADMIN`)
- **Request Body:**
  ```json
  {
    "current_password": "OldPassword123!",
    "new_password": "NewSecurePassword2026!"
  }
  ```
- **Behavior:** Validates `current_password` via `bcrypt`, updates `password_hash`, revokes all active sessions in `user_sessions` except the current session.

#### 1.2 Google Account Linking
- **Designation:** `[FUTURE / PLANNED - NOT IMPLEMENTED]`
- **Method / Path:** `POST /api/v1/auth/google/link`
- **Auth:** Bearer Token (Authenticated User)
- **Request Body:** `{ "id_token": "google_id_token" }`
- **Behavior:** Verifies Google token, validates that `google_sub` is not linked to another account, updates `users.google_sub`.

#### 1.3 Google Account Unlinking
- **Designation:** `[FUTURE / PLANNED - NOT IMPLEMENTED]`
- **Method / Path:** `DELETE /api/v1/auth/google/link`
- **Auth:** Bearer Token (Authenticated User)
- **Behavior:** Verifies user has a valid permanent `password_hash` set, clears `users.google_sub`.

---

### Category 2: In-App Notifications

#### 2.1 Get Notifications Feed
- **Designation:** `[FUTURE / PLANNED - NOT IMPLEMENTED]`
- **Method / Path:** `GET /api/v1/notifications`
- **Auth:** Bearer Token (Any Role)
- **Query Params:** `unread_only=true`, `limit=20`
- **Response `200 OK`:** Returns notification list from `notifications` table.

#### 2.2 Mark Notification as Read
- **Designation:** `[FUTURE / PLANNED - NOT IMPLEMENTED]`
- **Method / Path:** `PUT /api/v1/notifications/:id/read`
- **Auth:** Bearer Token (Target User)
- **Response `200 OK`:** Updates `is_read = TRUE`.

#### 2.3 Mark All Notifications as Read
- **Designation:** `[FUTURE / PLANNED - NOT IMPLEMENTED]`
- **Method / Path:** `PUT /api/v1/notifications/read-all`
- **Auth:** Bearer Token (Target User)

---

### Category 3: Cohort Registration Settings

#### 3.1 Get Cohort Registration Status
- **Designation:** `[FUTURE / PLANNED - NOT IMPLEMENTED]`
- **Method / Path:** `GET /api/v1/faculty/registrations/settings`
- **Auth:** Bearer Token (`TEACHER` with `CLASS_TEACHER` scope)
- **Query Params:** `department_id`, `branch_id`, `year`, `semester`, `academic_year_id`
- **Response `200 OK`:** Returns `{ "registration_open": true }`.

#### 3.2 Toggle Cohort Registration ON/OFF
- **Designation:** `[FUTURE / PLANNED - NOT IMPLEMENTED]`
- **Method / Path:** `PUT /api/v1/faculty/registrations/settings`
- **Auth:** Bearer Token (`TEACHER` with `CLASS_TEACHER` scope)
- **Request Body:** `{ "registration_open": false }`
- **Behavior:** Updates `cohort_registration_settings`.

---

### Category 4: Device Hardware Health & Slot Management

#### 4.1 Device Heartbeat Webhook
- **Designation:** `[FUTURE / PLANNED - NOT IMPLEMENTED]`
- **Method / Path:** `POST /api/v1/devices/heartbeat`
- **Auth:** Device Pre-Shared Key Header (`X-Device-Secret`)
- **Request Body:**
  ```json
  {
    "device_uid": "ESP32_LAB3_01",
    "battery_pct": 88,
    "free_heap_bytes": 142300,
    "uptime_seconds": 86400,
    "enrolled_fingerprint_count": 42
  }
  ```
- **Behavior:** Updates `devices.last_heartbeat_at`, logs to `device_events`.

#### 4.2 Get Cohort Biometric Status & Terminals (Class Teacher Console)
- **Designation:** `[AUTHORITATIVE CONTRACT - CLASS TEACHER WORKFLOW]`
- **Method / Path:** `GET /api/v1/faculty/cohorts/biometrics`
- **Auth:** Bearer Token (`TEACHER` with `CLASS_TEACHER` scope or `SYSTEM_ADMIN`)
- **Query Params:** `department_id`, `branch_id`, `year`, `semester`, `academic_year_id`
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "data": {
      "devices": [
        {
          "id": 1,
          "device_uid": "ESP32_LAB3_01",
          "name": "Lab 3 - ESP32 #1",
          "is_online": true,
          "total_slots": 1000,
          "occupied_slots": 42,
          "next_available_slot": 43
        }
      ],
      "students": [
        {
          "student_id": 101,
          "class_roll_no": 1,
          "full_name": "Arjun Mehta",
          "official_enrollment_no": "2024IT001",
          "biometric_status": "ENROLLED",
          "slot_id": 1,
          "device_id": 1,
          "enrolled_at": "2026-08-01T09:30:00Z"
        },
        {
          "student_id": 105,
          "class_roll_no": 15,
          "full_name": "Rahul Sharma",
          "official_enrollment_no": "2024IT047",
          "biometric_status": "NOT_ENROLLED",
          "slot_id": null,
          "device_id": null,
          "enrolled_at": null
        }
      ]
    }
  }
  ```

#### 4.3 Initiate Device Optical Sensor Enrollment Mode
- **Designation:** `[AUTHORITATIVE CONTRACT - CLASS TEACHER WORKFLOW]`
- **Method / Path:** `POST /api/v1/devices/:id/enroll-mode`
- **Auth:** Bearer Token (`TEACHER` with `CLASS_TEACHER` scope or `SYSTEM_ADMIN`)
- **Scope Verification:** Enforces that device `:id` is assigned to the Class Teacher's cohort and `student_id` is actively enrolled in that cohort.
- **Request Body:**
  ```json
  {
    "student_id": 105,
    "slot_id": 43
  }
  ```
- **Behavior:** Queues command for ESP32 terminal to switch R307 sensor into optical enrollment mode (prompts student for 2 touches).
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "data": {
      "command_id": "cmd_enroll_9912",
      "device_uid": "ESP32_LAB3_01",
      "slot_id": 43,
      "student_id": 105,
      "status": "WAITING_FOR_FINGERPRINT",
      "message": "Terminal is now in enrollment mode. Please instruct student to place finger on optical sensor twice."
    }
  }
  ```

#### 4.4 Confirm / Assign Fingerprint Sensor Slot
- **Designation:** `[AUTHORITATIVE CONTRACT - CLASS TEACHER & ADMIN]`
- **Method / Path:** `POST /api/v1/devices/:id/slots`
- **Auth:** Bearer Token (`SYSTEM_ADMIN` or authorized `CLASS_TEACHER`)
- **Request Body:**
  ```json
  {
    "slot_id": 43,
    "student_id": 105
  }
  ```
- **Behavior:** Inserts or updates row in `fingerprint_slots` (`UNIQUE(device_id, slot_id)` and `UNIQUE(device_id, student_id)`), logs to `audit_logs` (`FINGERPRINT_ENROLLED`).
- **Response `201 Created`:**
  ```json
  {
    "success": true,
    "data": {
      "device_id": 1,
      "slot_id": 43,
      "student_id": 105,
      "enrolled_at": "2026-09-09T10:25:00Z"
    },
    "message": "Fingerprint successfully registered for student."
  }
  ```

#### 4.5 Deallocate / Clear Fingerprint Sensor Slot
- **Designation:** `[AUTHORITATIVE CONTRACT - CLASS TEACHER & ADMIN]`
- **Method / Path:** `DELETE /api/v1/devices/:id/slots/:slotId`
- **Auth:** Bearer Token (`SYSTEM_ADMIN` or authorized `CLASS_TEACHER`)
- **Behavior:** Removes record from `fingerprint_slots` and logs command to clear template from physical R307 memory.
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "message": "Sensor slot deallocated and template marked for erasure."
  }
  ```

#### 4.6 Download Slot Directory for Terminal Sync
- **Designation:** `[AUTHORITATIVE CONTRACT - HARDWARE PROTOCOL]`
- **Method / Path:** `GET /api/v1/devices/:id/slots/sync`
- **Auth:** Device Pre-Shared Key Header (`X-Device-Secret`)
- **Response `200 OK`:** Returns array of `{ slot_id, official_enrollment_no, is_active }` for offline firmware verification.

---

### Category 5: Audited Administrative Attendance Corrections

#### 5.1 Correct Finalized Attendance Record
- **Designation:** `[FUTURE / PLANNED - NOT IMPLEMENTED]`
- **Method / Path:** `POST /api/v1/admin/attendance/records/:id/correct`
- **Auth:** Bearer Token (`SYSTEM_ADMIN` only)
- **Request Body:**
  ```json
  {
    "new_status": "PRESENT",
    "reason": "Medical certificate submitted and verified by Principal (Ref #MED-2026-44)"
  }
  ```
- **Behavior:** Updates `register_attendance.attendance_status`, writes immutable record to `register_attendance_corrections`, logs to `audit_logs`.

---

## 4. Planned Future Academic Module APIs (Roadmap Signatures)

The following endpoint signatures outline the interface specifications for Modules 1 through 8.  
**STATUS: FUTURE ROADMAP / NOT IMPLEMENTED IN CURRENT PHASE.**

---

### Module 1: Assignments API (`/api/v1/assignments/*`)
- `POST   /api/v1/assignments` — Create new assignment (Teacher)
- `GET    /api/v1/assignments` — List assignments (Filtered by cohort/subject)
- `GET    /api/v1/assignments/:id` — Get assignment details and attachments
- `PUT    /api/v1/assignments/:id` — Update assignment parameters (Teacher)
- `POST   /api/v1/assignments/:id/attachments` — Upload reference document
- `POST   /api/v1/assignments/:id/submit` — Submit student work (Student)
- `GET    /api/v1/assignments/:id/submissions` — View all cohort submissions (Teacher)
- `POST   /api/v1/assignments/:id/submissions/:subId/grade` — Grade submission and provide feedback (Teacher)

---

### Module 2: Test Scores API (`/api/v1/tests/*`)
- `POST   /api/v1/tests` — Create test instance (Unit test, practical, mid-term) (Teacher)
- `GET    /api/v1/tests` — List tests for assigned cohorts
- `POST   /api/v1/tests/:id/scores` — Bulk save student marks (Teacher)
- `PUT    /api/v1/tests/:id/publish` — Publish test results to student portal (Teacher)
- `GET    /api/v1/students/me/tests` — View student personal test marks history (Student)

---

### Module 3: Study Material API (`/api/v1/study-material/*`)
- `POST   /api/v1/study-material` — Upload study resource / notes (Teacher)
- `GET    /api/v1/study-material` — Browse material filtered by subject (Student/Teacher)
- `GET    /api/v1/study-material/:id/download` — Download digital file asset
- `DELETE /api/v1/study-material/:id` — Unpublish / delete material (Teacher)

---

### Module 4: Timetable API (`/api/v1/timetable/*`)
- `GET    /api/v1/timetable/cohort/:cohortId` — View weekly timetable grid for cohort
- `GET    /api/v1/timetable/faculty/me` — View personalized teaching timetable (Teacher)
- `GET    /api/v1/timetable/student/me` — View student weekly schedule (Student)
- `POST   /api/v1/timetable/slots` — Create / configure timetable slot (Admin/HOD)

---

### Module 5: Notices & Circulars API (`/api/v1/notices/*`)
- `POST   /api/v1/notices` — Publish circular / announcement (Admin/Faculty)
- `GET    /api/v1/notices` — View active notices targeted to user's scope
- `GET    /api/v1/notices/:id` — Read full notice body and download attachments
- `POST   /api/v1/notices/:id/acknowledge` — Record student read receipt

---

### Module 6: Academic Calendar API (`/api/v1/calendar/*`)
- `GET    /api/v1/calendar/events` — Retrieve institutional academic events and term dates
- `POST   /api/v1/calendar/events` — Create academic calendar event (Admin)

---

### Module 7: Exam Schedule API (`/api/v1/exams/*`)
- `GET    /api/v1/exams/schedule` — View upcoming examination schedule and room allocations
- `POST   /api/v1/exams/schedule` — Create exam instance and seating plan (Admin)

---

### Module 8: Student Performance Analytics API (`/api/v1/analytics/*`)
> **Data Rule:** Read-only queries across `register_attendance`, `test_scores`, and `assignment_grades`.
- `GET    /api/v1/analytics/student/:id/composite` — Get 360-degree student academic health report
- `GET    /api/v1/analytics/cohort/:id/defaulters` — Multi-dimensional defaulters matrix (<75% attendance + <40% test marks)
- `GET    /api/v1/analytics/department/:id/trends` — NAAC / NBA departmental performance summary
