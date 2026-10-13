# Team Role Guide: Back-End Developer (Express REST API & Services)

> **Role Title:** Back-End Systems Engineer  
> **Document Identifier:** `docs/attendance/roles/02_BACKEND_DEVELOPER.md`  
> **Primary Responsibility:** Complete Node.js / Express.js Server (`backend/`)  
> **Target Audience:** Back-End Developer / API Architect  
> **Collaborates With:** Database Designer (Schema & Queries), Front-End Developer (Web API Contract), Application Developer (Mobile & IoT Webhook)

---

## 1. Role Executive Summary & Mission

As the **Back-End Developer**, you are the custodian of institutional truth and business logic. You are responsible for engineering the complete **Node.js / Express REST API** that serves both the responsive Web Frontend and the future React Native Mobile Application.

Your core mission is to enforce:
1. **Absolute Security & RBAC:** Dynamic scoped authorization ensuring teachers only access their assigned cohorts and students only access their own records.
2. **Attendance Session State Integrity:** Managing the strict lifecycle (`DRAFT` $\rightarrow$ `OPEN` $\rightarrow$ `CLOSED` $\rightarrow$ `FINALIZED`) and enforcing the universal marking invariant.
3. **Three Independent Attendance Streams:** Guaranteeing that raw biometric scans (`esp32_presence`), official registers (`register_attendance`), and student self-requests (`student_self_attendance`) remain logically separated.
4. **Hardware & Biometric Ingestion:** Processing high-speed, offline-buffered webhook posts from classroom ESP32 terminals without data corruption or duplicate insertion.

---

## 2. What You Need to Know (Core Architecture & Rules)

### 2.1 The Technology Stack
| Component | Technology | Version / Configuration Details |
|---|---|---|
| **Runtime** | Node.js | v20.x LTS or higher |
| **Framework** | Express.js | v4.19+ |
| **Database Pool** | `mysql2/promise` | Connection pool with parameterized queries exclusively. **No ORM** (pure SQL for performance and complete control). |
| **Authentication** | `jsonwebtoken` | Access Token: 15–60 min expiry. Refresh Token: 7–30 days with DB tracking in `user_sessions`. |
| **Password Security**| `bcrypt` | Salt rounds $\ge 10$ for permanent passwords, temporary credentials, and PINs. |
| **OAuth 2.0** | `google-auth-library` | Server-side cryptographic token verification. |
| **Security Headers** | `helmet` | Content Security Policy, frameguard, XSS filter, hide `X-Powered-By`. |
| **Rate Limiting** | `express-rate-limit` | Strict limits on `/auth/*`, `/devices/webhook/scan`, and `/attendance/*`. |
| **Validation** | `express-validator` | Comprehensive schema validation and input sanitization on every endpoint. |
| **File Uploads** | `multer` | Strict CSV upload limits for student bulk provisioning. |
| **Logging** | `winston` or `pino` | Structured JSON logging with daily log rotation. |

### 2.2 Invariants & System Laws You Must Enforce
1. **The Single Source of Truth Law:**
   - Both Web and Mobile clients consume the exact same `/api/v1/` routes.
   - The backend never trusts client-side authorization. Every protected route checks:
     $$\text{Request} \longrightarrow \text{JWT Verification} \longrightarrow \text{System Role Check} \longrightarrow \text{Dynamic Scope Query} \longrightarrow \text{Execute}$$
2. **The Username Parity Invariant:**
   - For all student accounts:
     $$\textbf{users.username} = \textbf{students.official\_enrollment\_no}$$
   - When provisioning or registering students, you **must wrap the operations in an explicit database transaction** (`START TRANSACTION ... COMMIT`). If either record fails, the entire transaction rolls back.
3. **No Scopes in JWTs:**
   - Do **NOT** bake department IDs, branch IDs, or subject IDs into JWT tokens.
   - Teachers' permissions are resolved dynamically from `teacher_assignments` on every request. If an admin revokes an assignment, access terminates instantly.
4. **Attendance Session Lifecycle Invariants:**
   - Lifecycle: `DRAFT` $\rightarrow$ `OPEN` $\rightarrow$ `CLOSED` $\rightarrow$ `FINALIZED`.
   - **Auto-Close Timer:** The background interval scanner checks for sessions where `state = 'OPEN'` and `auto_close_at <= NOW()`. It **ONLY transitions them from `OPEN` to `CLOSED`**. Under no circumstances does any automated process transition a session to `FINALIZED`.
   - **Finalization Universal Marking:** Before transitioning to `FINALIZED`, query `attendance_session_students` where `included = TRUE`. Verify that **every single student** has a record in `register_attendance` with `attendance_status IN ('PRESENT', 'ABSENT', 'LATE')`. If any student is unmarked, return HTTP `422 Unprocessable Entity`.
5. **The Three Independent Streams:**
   - **Stream 1:** `esp32_presence` (Hardware scans, deduplicated via `UNIQUE(event_id)`).
   - **Stream 2:** `register_attendance` (Teacher register, official record, `UNIQUE(session_id, student_id)`).
   - **Stream 3:** `student_self_attendance` (Student requests, `UNIQUE(session_id, student_id)`).
   - Never write ESP32 scans directly into `register_attendance`. Only the teacher's explicit sync endpoint or manual marking can populate `register_attendance`.
6. **Attendance Calculation Formula:**
   $$P = \text{count}(\text{PRESENT}) + \text{count}(\text{LATE})$$
   $$C = \text{Total Finalized Sessions where } \text{included} = \text{TRUE}$$
   $$\text{Official Attendance } \% = \left(\frac{P}{C}\right) \times 100$$

### 2.3 The 5-Tier Actor Hierarchy & API Authorization Matrix

The backend API enforces a two-layer security perimeter: **Layer 1 (System Role)** verifies global persona from `user_roles.role` (`SYSTEM_ADMIN`, `TEACHER`, `STUDENT`), and **Layer 2 (Dynamic Scope)** resolves institutional authority from `teacher_assignments.assignment_type` (`HOD`, `CLASS_TEACHER`, `SUBJECT_TEACHER`):

$$\textbf{System Admin} \succ \textbf{HOD} \succ \textbf{Class Teacher} \succ \textbf{Subject Teacher} \succ \textbf{Student}$$

| Actor Tier | Base Role | Dynamic Scope | Middleware Guard | Authorized API Capabilities |
|---|---|---|---|---|
| **1. System Admin** | `SYSTEM_ADMIN` | `*` (Global) | `requireRole('SYSTEM_ADMIN')` | • Full CRUD on master data (`/api/v1/admin/*`)<br>• Hardware terminal registry & status (`/api/v1/devices/*`)<br>• User provisioning & credential slip generation<br>• Audited post-finalization corrections (`POST /admin/attendance/corrections`)<br>• System threshold policy configuration & audit logs |
| **2. HOD** | `TEACHER` | `HOD` | `requireScope('HOD')` | • Read access to all cohorts & subjects in assigned department<br>• Departmental aggregate reports (`GET /api/v1/reports/department`)<br>• Faculty session frequency & attendance audit data<br>• Reviewing leave requests & escalating corrections to Admin |
| **3. Class Teacher** | `TEACHER` | `CLASS_TEACHER` | `requireScope('CLASS_TEACHER')` | • Bulk student provisioning for assigned cohort (`POST /faculty/cohorts/provision`)<br>• Reviewing & approving student self-registrations (`/faculty/cohorts/registrations`)<br>• **Classroom ESP32 Fingerprint Enrollment Trigger** (`POST /devices/:id/enroll-mode`)<br>• Cohort biometric status query (`GET /faculty/cohorts/biometrics`)<br>• Cohort defaulter reports & warning exports |
| **4. Subject Teacher** | `TEACHER` | `SUBJECT_TEACHER` | `requireScope('SUBJECT_TEACHER')` | • Creating & managing sessions (`POST /attendance/sessions`)<br>• Generating 6-digit PIN & dynamic QR tokens (`POST /attendance/sessions/:id/pin`)<br>• Triggering **1-Click ESP32 Sync** (`POST /attendance/sessions/:id/sync-esp32`)<br>• Adjudicating self-attendance claims (`POST /attendance/sessions/:id/self-claims`)<br>• Finalizing registers with universal marking validation (`POST /sessions/:id/finalize`) |
| **5. Student** | `STUDENT` | `None` (Self) | `requireRole('STUDENT')` | • Querying active classroom sessions (`GET /attendance/sessions/active`)<br>• Submitting self-attendance claims (`POST /attendance/sessions/:id/self-submit`)<br>• Viewing personal attendance metrics & history (`GET /students/me/attendance/summary`)<br>• Account activation & permanent password setup (`POST /auth/activate`) |

---

### 2.4 The 4 Cross-Actor Lifecycle Flows from the Backend Pipeline Perspective

The backend routes, controllers, and services must strictly enforce the business transactions defined across the four canonical flows:

#### Flow 1: Academic Setup, Provisioning & Classroom Biometric Ingestion
1. **Master Setup (Admin):**
   - Admin routes insert `departments`, `branches`, `academic_years`, `subjects`, and `devices`.
   - Admin assigns teachers via `POST /api/v1/admin/assignments`, inserting rows into `teacher_assignments`.
2. **Student Provisioning (Class Teacher):**
   - Class Teacher hits `POST /api/v1/faculty/cohorts/provision` with CSV data.
   - `studentController.provisionCohort`:
     - Wraps in `withTransaction(async (conn) => { ... })`.
     - Validates that `req.user` has `CLASS_TEACHER` scope for the requested cohort.
     - For each row: inserts into `users` (`role = 'STUDENT'`, `status = 'PROVISIONED'`, `temp_password_hash`), inserts into `students` (`official_enrollment_no = users.username`), and inserts into `cohort_enrollments`.
3. **Classroom Fingerprint Enrollment (Class Teacher & ESP32):**
   - Class Teacher triggers `POST /api/v1/devices/:id/enroll-mode` with `{ student_id, slot_id }`.
   - Controller verifies device status (`is_active = TRUE`) and validates `slot_id` availability in `fingerprint_slots`.
   - Server sends command to classroom ESP32 via HTTP/MQTT or flags device state as `ENROLL_PENDING`.
   - When student scans finger twice on the R307 sensor, the ESP32 posts to `POST /api/v1/devices/webhook/enroll-ack` with `{ device_id, slot_id, student_id, status: 'SUCCESS' }`.
   - Backend records the mapping in `fingerprint_slots (device_id, slot_id, student_id)`.
4. **Account Activation (Student):**
   - Student calls `POST /api/v1/auth/login` with temporary credentials. Backend returns `needs_password_change: true`.
   - Student calls `POST /api/v1/auth/activate` with `{ new_password }`. Backend verifies bcrypt complexity, updates `users.password_hash`, and sets `users.status = 'ACTIVE'`.

#### Flow 2: Live Classroom Attendance & Three-Stream Marking Pipeline
1. **Session Creation (Subject Teacher):**
   - Teacher calls `POST /api/v1/attendance/sessions` with `{ cohort_id, subject_id, delivery_mode, auto_close_minutes }`.
   - Controller verifies `requireScope('SUBJECT_TEACHER')`.
   - Database creates row in `attendance_sessions` with `state = 'OPEN'` and calculates `auto_close_at = NOW() + INTERVAL X MINUTE`.
   - **Roster Snapshot:** Controller selects all active students from `cohort_enrollments` and performs bulk insert into `attendance_session_students` with `included = TRUE`.
2. **Dual Stream Ingestion (Parallel Execution):**
   - **Stream 1 (ESP32 Scans):** Student touches R307 sensor at classroom door. ESP32 sends `POST /api/v1/devices/webhook/scan` with `{ device_id, slot_id, event_id, timestamp }`. Controller resolves `student_id` from `fingerprint_slots` and executes:
     `INSERT IGNORE INTO esp32_presence (session_id, device_id, student_id, event_id, scanned_at) ...`
     Deduplication is guaranteed by the `UNIQUE(event_id)` database constraint.
   - **Stream 3 (Student Claims):** Student submits PIN or scanned QR token via `POST /api/v1/attendance/sessions/:id/self-submit`. Controller validates PIN/token and inserts into `student_self_attendance` with `claim_status = 'PENDING'`.
3. **Official Register Adjudication & 1-Click Sync (Teacher):**
   - Teacher calls `POST /api/v1/attendance/sessions/:id/sync-esp32`.
   - Controller selects all `student_id` present in `esp32_presence` for this session and executes `INSERT INTO register_attendance ... ON DUPLICATE KEY UPDATE attendance_status = 'PRESENT'`.
   - Teacher reviews pending soft claims via `POST /api/v1/attendance/sessions/:id/self-claims/adjudicate` with `{ claims: [{ student_id, status: 'ACCEPTED' }] }`.
4. **Finalization & Universal Marking Check:**
   - Teacher calls `POST /api/v1/attendance/sessions/:id/finalize`.
   - **Integrity Validation:** Controller checks:
     `SELECT count(*) FROM attendance_session_students WHERE session_id = ? AND included = TRUE AND student_id NOT IN (SELECT student_id FROM register_attendance WHERE session_id = ? AND attendance_status IN ('PRESENT', 'ABSENT', 'LATE'))`
   - If count $> 0$, aborts with HTTP `422 Unprocessable Entity` ("Unmarked students exist in register").
   - If count $== 0$, updates `attendance_sessions.state = 'FINALIZED'` and `finalized_at = NOW()`.

#### Flow 3: Defaulter Monitoring & Notification Engine
1. **Calculation Query:**
   - On request to `GET /api/v1/reports/defaulters?threshold=75`, backend calculates:
     ```sql
     SELECT s.id, s.official_enrollment_no, s.full_name,
            COUNT(CASE WHEN ra.attendance_status IN ('PRESENT', 'LATE') THEN 1 END) AS attended_count,
            COUNT(ass.student_id) AS conducted_count,
            ROUND((COUNT(CASE WHEN ra.attendance_status IN ('PRESENT', 'LATE') THEN 1 END) / COUNT(ass.student_id)) * 100, 2) AS attendance_pct
     FROM students s
     JOIN attendance_session_students ass ON ass.student_id = s.id
     JOIN attendance_sessions sess ON sess.id = ass.session_id AND sess.state = 'FINALIZED'
     LEFT JOIN register_attendance ra ON ra.session_id = sess.id AND ra.student_id = s.id
     WHERE sess.cohort_id = ?
     GROUP BY s.id
     HAVING attendance_pct < 75;
     ```
2. **Alert Dispatch:**
   - Automated cron or Class Teacher trigger creates alert rows in `notifications` for every student falling below the 75% threshold.

#### Flow 4: Audited Post-Finalization Corrections
1. **Immutable Override API:**
   - Endpoint: `POST /api/v1/admin/attendance/corrections`
   - Headers: `Authorization: Bearer <ADMIN_JWT>`
   - Request Body: `{ session_id, student_id, new_status, justification }`
2. **Transactional Execution:**
   - Verifies `req.user` has `role = 'SYSTEM_ADMIN'`.
   - Validates that `justification` length is $\ge 15$ characters.
   - Executes atomic SQL transaction:
     ```sql
     -- 1. Read old status
     SELECT attendance_status INTO @old_status FROM register_attendance WHERE session_id = ? AND student_id = ? FOR UPDATE;
     -- 2. Update register
     UPDATE register_attendance SET attendance_status = ?, marked_by_user_id = ?, remarks = ? WHERE session_id = ? AND student_id = ?;
     -- 3. Insert into immutable corrections log
     INSERT INTO register_attendance_corrections (session_id, student_id, old_status, new_status, corrected_by_user_id, justification, created_at)
     VALUES (?, ?, @old_status, ?, ?, ?, NOW());
     -- 4. Append to general audit log
     INSERT INTO audit_logs (actor_user_id, action, target_entity, target_entity_id, details, ip_address)
     VALUES (?, 'ATTENDANCE_CORRECTED', 'register_attendance', ?, ?, ?);
     ```

---

## 3. What You Are Doing (Detailed Deliverables)

### 3.1 Directory Structure to Build & Maintain
```
backend/
├── server.js                        # Express server bootstrap, TLS setup, cron interval
├── .env.example                     # Environment template
├── package.json                     # Dependencies & scripts
└── src/
    ├── config/
    │   ├── db.js                    # mysql2 connection pool configuration
    │   └── constants.js             # Enums, default thresholds, expiry constants
    ├── middleware/
    │   ├── auth.js                  # Bearer token verification & req.user extraction
    │   ├── requireRole.js           # SYSTEM_ADMIN, TEACHER, STUDENT role enforcement
    │   ├── requireScope.js          # Dynamic teacher assignment validation (SUBJECT_TEACHER, etc.)
    │   ├── rateLimiter.js           # express-rate-limit configurations
    │   ├── validate.js              # express-validator error catcher
    │   └── errorHandler.js          # Global error envelope formatter
    ├── routes/
    │   ├── auth.js                  # /api/v1/auth/*
    │   ├── students.js              # /api/v1/students/*
    │   ├── faculty.js               # /api/v1/faculty/*
    │   ├── attendance.js            # /api/v1/attendance/*
    │   ├── devices.js               # /api/v1/devices/*
    │   ├── reports.js               # /api/v1/reports/*
    │   ├── admin.js                 # /api/v1/admin/*
    │   └── notifications.js         # /api/v1/notifications/*
    ├── controllers/
    │   ├── authController.js        # Login, refresh, logout, password activation
    │   ├── studentController.js     # Self-registration, provisioning, profile
    │   ├── facultyController.js     # Cohort & subject queries, registration settings
    │   ├── attendanceController.js  # Session state, PIN/QR, sync, records, finalization
    │   ├── deviceController.js      # Webhook ingestion, heartbeat, slot mapping
    │   ├── reportController.js      # Official register, comparison report, CSV streams
    │   └── adminController.js       # Master data CRUD, audited corrections
    ├── services/
    │   ├── authService.js           # Token generation, session revocation, bcrypt
    │   ├── attendanceService.js     # Roster freezing, auto-close scanner, finalization
    │   ├── deviceService.js         # Scan event deduplication, slot correlation
    │   ├── credentialService.js     # Random password generation, Excel/PDF slip exporter
    │   └── reportService.js         # Aggregation queries, comparison matching logic
    └── utils/
        ├── dbTransaction.js         # Explicit START TRANSACTION ... COMMIT wrapper
        ├── pinQrCrypto.js           # HMAC QR token signing & PIN bcrypt hashing
        ├── logger.js                # Winston logger configuration
        └── auditLogger.js           # Centralized logging to audit_logs table
```

---

## 4. For What (Business Logic & Purpose of Key Systems)

### 4.1 Why Dynamic Scoping (`requireScope.js`)?
In higher education, a faculty member is not just a "Teacher". They hold specific assignments:
- Professor Sharma might be the **Subject Teacher** for DBMS in 2nd Year IT, but has no authority over 3rd Year Civil Engineering.
- Professor Patel might be the **Class Teacher** for 1st Year BCA, giving her exclusive rights to approve student self-registrations and toggle registrations ON/OFF.
- Dr. Joshi is the **HOD** for IT, giving him read-only observational rights across all cohorts in IT.
Your middleware dynamically queries `teacher_assignments` to verify whether `req.user.id` is authorized for the specific `cohort` or `subject_id` being manipulated.

### 4.2 Why Immutable Session Snapshots (`attendance_session_students`)?
When a session is created, active cohort enrollments are snapshotted into `attendance_session_students`.
If a student drops out, changes roll numbers, or transfers departments 2 months later, **past attendance registers must remain historically accurate**. The session roster is permanently frozen.

### 4.3 Why Cryptographically Random Temporary Passwords?
To eliminate student registration chaos on Day 1:
- The teacher bulk-provisions 60 students from a CSV.
- The backend generates 8-character random temporary passwords (e.g., `Xk9#m2P`).
- The teacher downloads cut-out PDF slips and distributes them in class.
- The student logs in with their `official_enrollment_no` and temporary password, and is forced to set their permanent password.
- This completely eliminates name spelling mismatches and self-registration bottlenecks!

---

## 5. How to Do Every Detail (Implementation Recipes)

### 5.1 The Database Transaction Helper (`src/utils/dbTransaction.js`)
Use this wrapper to ensure transactional safety across multi-step mutations:

```javascript
// src/utils/dbTransaction.js
import { pool } from '../config/db.js';

export async function withTransaction(callback) {
  const connection = await pool.getConnection();
  await connection.beginTransaction();
  try {
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}
```

### 5.2 Dynamic Teacher Scope Middleware (`src/middleware/requireScope.js`)
Implement this middleware to enforce academic boundaries:

```javascript
// src/middleware/requireScope.js
import { pool } from '../config/db.js';

export function requireScope(assignmentType) {
  return async (req, res, next) => {
    const userId = req.user.user_id;
    const { department_id, branch_id, year, semester, subject_id } = req.body.cohort || req.query;

    try {
      // Find teacher ID from user ID
      const [[teacher]] = await pool.execute(
        'SELECT id FROM teachers WHERE user_id = ?',
        [userId]
      );

      if (!teacher) {
        return res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: 'No teacher profile bound to user account' }
        });
      }

      req.teacherId = teacher.id;

      // Allow SYSTEM_ADMIN to bypass academic scopes
      if (req.user.roles.includes('SYSTEM_ADMIN')) {
        return next();
      }

      let query = `
        SELECT id FROM teacher_assignments 
        WHERE teacher_id = ? 
          AND assignment_type = ? 
          AND department_id = ? 
          AND branch_id = ? 
          AND year = ? 
          AND semester = ? 
          AND is_active = TRUE
      `;
      const params = [teacher.id, assignmentType, department_id, branch_id, year, semester];

      if (assignmentType === 'SUBJECT_TEACHER' && subject_id) {
        query += ' AND subject_id = ?';
        params.push(subject_id);
      }

      const [rows] = await pool.execute(query, params);

      if (rows.length === 0) {
        return res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: `Access denied: You do not hold active ${assignmentType} assignment for this cohort` }
        });
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}
```

### 5.3 Attendance Session Finalization Enforcement (`src/services/attendanceService.js`)
Enforce the universal marking invariant before locking a session:

```javascript
// src/services/attendanceService.js
import { withTransaction } from '../utils/dbTransaction.js';

export async function finalizeAttendanceSession(sessionId, teacherId) {
  return await withTransaction(async (conn) => {
    // 1. Verify session exists, belongs to teacher, and is currently in CLOSED state
    const [[session]] = await conn.execute(
      'SELECT id, state FROM attendance_sessions WHERE id = ? AND teacher_id = ? FOR UPDATE',
      [sessionId, teacherId]
    );

    if (!session) {
      throw { status: 404, code: 'NOT_FOUND', message: 'Session not found' };
    }
    if (session.state === 'FINALIZED') {
      throw { status: 409, code: 'CONFLICT', message: 'Session is already finalized' };
    }

    // 2. Query included students with no record or null status in register_attendance
    const [unmarked] = await conn.execute(`
      SELECT ass.student_id, s.official_enrollment_no, s.full_name
      FROM attendance_session_students ass
      JOIN students s ON s.id = ass.student_id
      LEFT JOIN register_attendance ra 
        ON ra.session_id = ass.session_id AND ra.student_id = ass.student_id
      WHERE ass.session_id = ? 
        AND ass.included = TRUE 
        AND (ra.id IS NULL OR ra.attendance_status IS NULL)
    `, [sessionId]);

    if (unmarked.length > 0) {
      throw {
        status: 422,
        code: 'UNPROCESSABLE_ENTITY',
        message: `Cannot finalize session: ${unmarked.length} students remain unmarked in register.`,
        details: unmarked
      };
    }

    // 3. Transition state to FINALIZED and set end_time if null
    await conn.execute(`
      UPDATE attendance_sessions 
      SET state = 'FINALIZED', end_time = COALESCE(end_time, NOW())
      WHERE id = ?
    `, [sessionId]);

    return { sessionId, state: 'FINALIZED', finalizedAt: new Date() };
  });
}
```

### 5.4 Hardware Webhook & Offline Ingestion (`src/controllers/deviceController.js`)
Process incoming biometric scans from classroom ESP32 terminals:

```javascript
// src/controllers/deviceController.js
import { pool } from '../config/db.js';

export async function handleDeviceScan(req, res, next) {
  const deviceSecret = req.headers['x-device-secret'];
  const { device_uid, scans } = req.body;

  if (!deviceSecret || !device_uid || !Array.isArray(scans)) {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Invalid device scan payload' }
    });
  }

  try {
    // 1. Verify device credentials
    const [[device]] = await pool.execute(
      'SELECT id, secret_hash, is_active FROM devices WHERE device_uid = ?',
      [device_uid]
    );

    if (!device || !device.is_active || device.secret_hash !== deviceSecret) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Invalid or inactive device secret' }
      });
    }

    let insertedCount = 0;

    // 2. Ingest scans (supports both single scans and offline SPI flash batches)
    for (const scan of scans) {
      const { slot_id, event_id, scanned_at } = scan;

      // Look up student mapped to (device_id, slot_id)
      const [[slotMapping]] = await pool.execute(
        'SELECT student_id FROM fingerprint_slots WHERE device_id = ? AND slot_id = ?',
        [device.id, slot_id]
      );

      if (slotMapping) {
        // INSERT IGNORE ensures deduplication via UNIQUE(event_id)
        const [result] = await pool.execute(`
          INSERT IGNORE INTO esp32_presence 
            (device_id, student_id, event_id, scanned_at)
          VALUES (?, ?, ?, ?)
        `, [device.id, slotMapping.student_id, event_id, scanned_at]);

        if (result.affectedRows > 0) insertedCount++;
      }
    }

    // 3. Update device heartbeat
    await pool.execute(
      'UPDATE devices SET last_heartbeat_at = NOW() WHERE id = ?',
      [device.id]
    );

    return res.json({
      success: true,
      data: { received: scans.length, inserted: insertedCount }
    });
  } catch (err) {
    next(err);
  }
}
```

### 5.5 Auto-Close Background Scanner (`src/services/attendanceService.js`)
Register this interval in `server.js` to automatically transition expired sessions from `OPEN` to `CLOSED`:

```javascript
// Scans every 60 seconds
setInterval(async () => {
  try {
    const [result] = await pool.execute(`
      UPDATE attendance_sessions 
      SET state = 'CLOSED', updated_at = NOW()
      WHERE state = 'OPEN' 
        AND auto_close_at IS NOT NULL 
        AND auto_close_at <= NOW()
    `);
    if (result.affectedRows > 0) {
      logger.info(`Auto-closed ${result.affectedRows} expired attendance session(s)`);
    }
  } catch (err) {
    logger.error('Error during attendance auto-close job:', err);
  }
}, 60000);
```

---

## 6. Complete API Endpoints, Input JSON Schemas & Output Envelopes (Controller Contract)

As the Back-End Developer, your Express controllers must strictly implement the following request schemas, HTTP status codes, and response JSON envelopes.

### 6.1 Standard Global Response Envelopes

#### Success Envelope (`res.status(200 | 201).json(...)`)
```json
{
  "success": true,
  "data": { ... },
  "message": "Human-readable confirmation message",
  "meta": { "pagination": { "page": 1, "limit": 50, "total": 120 } }
}
```

#### Error Envelope (`res.status(4xx | 5xx).json(...)`)
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR | UNAUTHORIZED | FORBIDDEN | NOT_FOUND | CONFLICT | UNPROCESSABLE_ENTITY | INTERNAL_SERVER_ERROR",
    "message": "Specific error description",
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

### 6.2 Authentication & Session Controllers (`/api/v1/auth/*`)

#### A. Faculty Login (`POST /api/v1/auth/faculty/login`)
- **Input Body JSON:**
  ```json
  {
    "username": "prof.sharma@college.local",
    "password": "FacultyPassword123!"
  }
  ```
- **Success Response `200 OK` JSON:**
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
- **Error Response `401 Unauthorized` JSON:**
  ```json
  {
    "success": false,
    "error": {
      "code": "UNAUTHORIZED",
      "message": "Invalid faculty credentials or inactive account."
    }
  }
  ```

#### B. Student Login (`POST /api/v1/auth/student/login`)
- **Input Body JSON:**
  ```json
  {
    "enrollment_no": "2024IT047",
    "password": "TemporaryOrPermanentPassword"
  }
  ```
- **Success Response `200 OK` (Standard Active Account):**
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
- **Success Response `200 OK` (Provisioned Account — Forced Setup):**
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
- **Error Response `403 Forbidden` (Pending Class Teacher Approval):**
  ```json
  {
    "success": false,
    "error": {
      "code": "FORBIDDEN",
      "message": "Registration submitted and pending Class Teacher approval."
    }
  }
  ```
- **Error Response `403 Forbidden` (Rejected with Reason):**
  ```json
  {
    "success": false,
    "error": {
      "code": "FORBIDDEN",
      "message": "Registration rejected by Class Teacher. Reason: Invalid enrollment document uploaded."
    }
  }
  ```

#### C. Student Activation (`POST /api/v1/auth/student/activate`)
- **Headers:** `Authorization: Bearer <activation_token>`
- **Input Body JSON:**
  ```json
  {
    "new_password": "NewPermanentPassword2026!"
  }
  ```
- **Success Response `200 OK` JSON:**
  ```json
  {
    "success": true,
    "data": {
      "access_token": "eyJhbGciOi...",
      "message": "Account activated successfully. Welcome to the portal!"
    }
  }
  ```

#### D. Token Refresh (`POST /api/v1/auth/refresh`)
- **Input Body JSON (Mobile) or Cookie (Web):** `{ "refresh_token": "..." }`
- **Success Response `200 OK` JSON:**
  ```json
  {
    "success": true,
    "data": {
      "access_token": "eyJhbGciOi...",
      "refresh_token": "eyJhbGciOi..."
    }
  }
  ```

---

### 6.3 Student Provisioning & Registration Controllers (`/api/v1/students/*`)

#### A. Single Student Provisioning (`POST /api/v1/students/provision`)
- **Auth:** `TEACHER` or `SYSTEM_ADMIN`
- **Input Body JSON:**
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
- **Success Response `201 Created` JSON:**
  ```json
  {
    "success": true,
    "data": {
      "student_id": 108,
      "user_id": 215,
      "official_enrollment_no": "2024IT051",
      "class_roll_no": 18,
      "temporary_password": "K9#mQ4vP",
      "status": "PROVISIONED",
      "must_change_password": true
    },
    "message": "Student provisioned successfully with temporary credentials."
  }
  ```

#### B. Fallback Student Self-Registration (`POST /api/v1/students/register`)
- **Auth:** Public
- **Input Body JSON:**
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
- **Success Response `201 Created` JSON:**
  ```json
  {
    "success": true,
    "data": {
      "user_id": 220,
      "official_enrollment_no": "2024IT099",
      "status": "PENDING"
    },
    "message": "Registration submitted. Awaiting Class Teacher approval."
  }
  ```

#### C. Adjudicate Registration (`POST /api/v1/students/registrations/:id/adjudicate`)
- **Auth:** `TEACHER` with `CLASS_TEACHER` dynamic scope
- **Input Body JSON:**
  ```json
  {
    "action": "APPROVE",
    "class_roll_no": 25
  }
  ```
- **Success Response `200 OK` JSON:**
  ```json
  {
    "success": true,
    "data": {
      "student_id": 110,
      "status": "ACTIVE",
      "class_roll_no": 25
    },
    "message": "Student registration approved and enrolled."
  }
  ```

---

### 6.4 Attendance Core Controllers (`/api/v1/attendance/*`)

#### A. Create Session (`POST /api/v1/attendance/sessions`)
- **Auth:** `TEACHER` with `SUBJECT_TEACHER` scope
- **Input Body JSON:**
  ```json
  {
    "subject_id": 4,
    "department_id": 1,
    "branch_id": 1,
    "year": 2,
    "semester": 3,
    "academic_year_id": 1,
    "session_type": "THEORY",
    "label": "Morning Theory Lecture",
    "start_time": "2026-09-09T10:00:00Z",
    "auto_close_minutes": 30
  }
  ```
- **Success Response `201 Created` JSON:**
  ```json
  {
    "success": true,
    "data": {
      "session_id": 42,
      "subject_id": 4,
      "state": "DRAFT",
      "start_time": "2026-09-09T10:00:00Z",
      "auto_close_at": "2026-09-09T10:30:00Z",
      "frozen_roster_count": 42
    },
    "message": "Attendance session created and cohort roster snapshot frozen."
  }
  ```

#### B. Bulk Save Teacher Register Records (`POST /api/v1/attendance/sessions/:id/records`)
- **Auth:** `TEACHER` (Session Owner)
- **Input Body JSON:**
  ```json
  {
    "records": [
      {
        "student_id": 101,
        "attendance_status": "PRESENT",
        "source": "MANUAL",
        "teacher_notes": null
      },
      {
        "student_id": 102,
        "attendance_status": "LATE",
        "source": "MANUAL",
        "teacher_notes": "Arrived 15 min late"
      },
      {
        "student_id": 103,
        "attendance_status": "ABSENT",
        "source": "MANUAL",
        "teacher_notes": null
      }
    ]
  }
  ```
- **Success Response `200 OK` JSON:**
  ```json
  {
    "success": true,
    "data": {
      "session_id": 42,
      "saved_records_count": 3
    },
    "message": "Attendance register records saved."
  }
  ```

#### C. Session State Transition & Finalization (`PUT /api/v1/attendance/sessions/:id/state`)
- **Auth:** `TEACHER` (Session Owner)
- **Input Body JSON:** `{ "state": "FINALIZED" }`
- **Success Response `200 OK` (All Students Marked):**
  ```json
  {
    "success": true,
    "data": {
      "session_id": 42,
      "state": "FINALIZED",
      "finalized_at": "2026-09-09T10:45:00Z"
    },
    "message": "Session finalized successfully. Official register locked."
  }
  ```
- **Error Response `422 Unprocessable Entity` (Students Unmarked):**
  ```json
  {
    "success": false,
    "error": {
      "code": "UNPROCESSABLE_ENTITY",
      "message": "Cannot finalize session: 2 students remain unmarked in register.",
      "details": [
        { "student_id": 102, "class_roll_no": 2, "full_name": "Priya Patel" },
        { "student_id": 104, "class_roll_no": 4, "full_name": "Devang Joshi" }
      ]
    }
  }
  ```

---

### 6.5 Hardware Device Webhook (`/api/v1/devices/*`)

#### A. ESP32 Scan Webhook Ingestion (`POST /api/v1/devices/webhook/scan`)
- **Headers:** `X-Device-Secret: <secret_hash>`
- **Input Body JSON (Supports Single Scan or Offline Batch):**
  ```json
  {
    "device_uid": "ESP32_LAB3_01",
    "scans": [
      {
        "slot_id": 42,
        "event_id": "8f1b2b4e-7b43-4e31-8f23-6b30f8a8470a",
        "scanned_at": "2026-09-09T10:05:12Z",
        "battery": 92
      },
      {
        "slot_id": 15,
        "event_id": "3a7c8e11-9f22-4a01-8b44-7d50e9a1122b",
        "scanned_at": "2026-09-09T10:06:05Z",
        "battery": 91
      }
    ]
  }
  ```
- **Success Response `200 OK` JSON:**
  ```json
  {
    "success": true,
    "data": {
      "device_uid": "ESP32_LAB3_01",
      "received": 2,
      "inserted": 2,
      "ignored_duplicates": 0
    },
    "message": "Presence events processed and deduplicated."
  }
  ```

---

### 6.6 Class Teacher & Hardware Biometric Controllers

#### A. Get Cohort Biometric Roster & Terminals (`GET /api/v1/faculty/cohorts/biometrics`)
- **Headers:** `Authorization: Bearer <access_token>`
- **Authorization:** `requireScope('CLASS_TEACHER')` or `requireRole('SYSTEM_ADMIN')`
- **Query Params:** `department_id=1&branch_id=1&year=2&semester=4&academic_year_id=1`
- **Success Response `200 OK` JSON:**
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

#### B. Trigger Device Optical Enrollment Mode (`POST /api/v1/devices/:id/enroll-mode`)
- **Authorization:** `requireScope('CLASS_TEACHER')` or `requireRole('SYSTEM_ADMIN')`
- **Validation Rule:** Verifies that device `:id` is assigned to teacher's cohort and `student_id` is enrolled in that cohort.
- **Input Body JSON:**
  ```json
  {
    "student_id": 105,
    "slot_id": 43
  }
  ```
- **Success Response `200 OK` JSON:**
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

#### C. Confirm Fingerprint Slot Allocation (`POST /api/v1/devices/:id/slots`)
- **Input Body JSON:** `{ "slot_id": 43, "student_id": 105 }`
- **Success Response `201 Created` JSON:**
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

---

### 6.7 Reporting Controllers (`/api/v1/reports/*`)

#### A. Teacher Register Report (`GET /api/v1/reports/teacher-register`)
- **Query Params:** `department_id=1&branch_id=1&year=2&semester=3&subject_id=4&academic_year_id=1`
- **Success Response `200 OK` JSON:**
  ```json
  {
    "success": true,
    "data": {
      "cohort": { "department": "IT", "branch": "B.Tech", "year": 2, "semester": 3 },
      "subject": "Database Management Systems",
      "total_sessions_conducted": 18,
      "students": [
        {
          "student_id": 101,
          "class_roll_no": 1,
          "official_enrollment_no": "2024IT001",
          "full_name": "Arjun Mehta",
          "conducted": 18,
          "present": 14,
          "late": 1,
          "absent": 3,
          "attended_total": 15,
          "attendance_percentage": 83.33
        }
      ]
    }
  }
  ```

---

## 7. How You Collaborate With Other Roles

1. **With Database Designer:**
   - Coordinate on connection pooling parameters (`connectionLimit: 20`).
   - Request composite indexes for high-frequency queries (e.g., `attendance_sessions(state, auto_close_at)`).
   - Abide strictly by foreign key constraints and schema definitions in [`DATABASE_SCHEMA_AND_ERD.md`](file:///c:/Users/pooja/.codex/.chatgpt-projects/g-p-6a789ef4084c8191a51baa65bca08112/docs/attendance/DATABASE_SCHEMA_AND_ERD.md).
2. **With Front-End Developer:**
   - Maintain the standard success/error JSON envelope across all endpoints.
   - Deliver endpoints specified in Section 6 and [`04_API_CONTRACT.md`](file:///c:/Users/pooja/.codex/.chatgpt-projects/g-p-6a789ef4084c8191a51baa65bca08112/docs/attendance/04_API_CONTRACT.md).
   - Implement `httpOnly` cookie handling for web refresh tokens while supporting mobile bearer auth.
3. **With Application Developer:**
   - Ensure the `/api/v1/devices/webhook/scan` endpoint gracefully accepts batch scan arrays from offline ESP32 terminals.
   - Deliver reliable token refresh mechanics for the React Native mobile network interceptor.

---

## 8. Back-End Deliverables Checklist

- [ ] `src/config/db.js` mysql2 connection pool with health check ping.
- [ ] JWT authentication middleware (`auth.js`) and role validator (`requireRole.js`).
- [ ] Dynamic academic scoping middleware (`requireScope.js`) querying `teacher_assignments`.
- [ ] Central auth routes (`/api/v1/auth/*`) including login, activation, refresh rotation, logout, and Google auth.
- [ ] Student provisioning routes (single + bulk CSV with `multer` + temporary password generator).
- [ ] Credential sheet exporter (`.xlsx` and cut-out `.pdf` slips).
- [ ] Attendance session state machine (`DRAFT` $\rightarrow$ `OPEN` $\rightarrow$ `CLOSED` $\rightarrow$ `FINALIZED`).
- [ ] Background interval for `auto_close_at` auto-closing expired `OPEN` sessions.
- [ ] Universal marking validation check on session finalization.
- [ ] Soft presence verification PIN and dynamic HMAC QR token generators.
- [ ] ESP32 hardware webhook (`/api/v1/devices/webhook/scan`) with batch offline deduplication.
- [ ] Class Teacher biometric enrollment endpoints (`/api/v1/faculty/cohorts/biometrics`, `/api/v1/devices/:id/enroll-mode`, `/api/v1/devices/:id/slots`) with scoped cohort validation.
- [ ] One-click ESP32 sync endpoint populating `register_attendance` from `esp32_presence`.
- [ ] Reports generator (Teacher Register, Stream Comparison `MATCH`/`MISMATCH`, CSV export).
- [ ] Centralized audit logger logging to `audit_logs`.

