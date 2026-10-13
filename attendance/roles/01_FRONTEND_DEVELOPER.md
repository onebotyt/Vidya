# Team Role Guide: Front-End Developer (Web Systems)

> **Role Title:** Front-End Web Engineer  
> **Document Identifier:** `docs/attendance/roles/01_FRONTEND_DEVELOPER.md`  
> **Primary Responsibility:** Complete Responsive Web Client (`frontend/`)  
> **Target Audience:** Front-End Developer / UI-UX Engineer  
> **Collaborates With:** Back-End Developer (API Consumption), Database Designer (Entity Understanding), Application Developer (Design Consistency)

---

## 1. Role Executive Summary & Mission

As the **Front-End Developer**, your mission is to build a modern, high-performance, responsive web application for the College Attendance System that runs seamlessly over a local area network (LAN) inside the institution.

You are responsible for crafting the user interfaces across three distinct institutional tiers:
1. **Student Portal:** Active attendance marking, predictive threshold forecasting, attendance history, and profile management.
2. **Faculty Portal:** Classroom attendance console, live session controls (ESP32 sync, PIN, QR), registration review for Class Teachers, and cohort reporting.
3. **Administrator Portal:** Master institutional data CRUD (departments, branches, academic years, subjects), teacher assignments, hardware terminal management, and audited corrections.

---

## 2. What You Need to Know (Core Architecture & Rules)

### 2.1 The Technology Stack
| Layer | Technology | Hard Constraints & Invariants |
|---|---|---|
| **Structure** | Semantic HTML5 | Clean semantic elements (`<header>`, `<nav>`, `<main>`, `<aside>`, `<section>`, `<article>`). Accessibility tags (`aria-*`), unique element IDs for testability. |
| **Styling** | Vanilla CSS3 | Driven strictly by CSS Custom Properties (`css/variables.css`). **Tailwind CSS and CSS preprocessors (Sass/Less) are strictly forbidden.** |
| **Logic** | Vanilla JavaScript | Modern ECMAScript (ES2022+). Page-specific scripts under `js/pages/`. Shared utilities (`api.js`, `auth.js`, `utils.js`). **No frontend JS frameworks (React, Vue, Angular are forbidden for the web system).** |
| **Typography** | Google Fonts | `Inter` and `Outfit` for body & headings; `JetBrains Mono` or `Fira Code` for PINs, tokens, and hardware IDs. |
| **Icons** | SVG / Feather / Lucide | Crisp inline or sprite-based SVGs. Zero heavy font-icon bundles. |

### 2.2 Institutional Invariants You Must Never Violate
1. **The Cohort Definition:**
   - There is **no "classes" table or entity**. Never display or label a selector simply as "Class".
   - An academic group is strictly defined as a **Cohort**:
     $$\textbf{Cohort} = \textbf{Department} + \textbf{Branch} + \textbf{Year} + \textbf{Semester} + \textbf{Academic Year}$$
   - When presenting selection dropdowns, filter dynamically: Department $\rightarrow$ Branch $\rightarrow$ Year (1–4) $\rightarrow$ Semester (1–8).
2. **Dual Student Identifiers & Default Sorting:**
   - Every student has two IDs:
     - `official_enrollment_no` (e.g., `2024IT047`): Permanent university ID, globally unique, used as login username.
     - `class_roll_no` (e.g., `1`, `2`, `15`): Cohort-internal ordering.
   - **Crucial UI Rule:** The live attendance register **must always sort students by `class_roll_no` ascending by default**. This matches physical classroom roll call.
3. **The Three Independent Attendance Streams:**
   - The UI must never pretend that ESP32 physical scans or student self-attendance are automatically the official record.
   - The UI must visually reflect three distinct data layers:
     - **Stream 1 (ESP32 Presence):** Biometric hardware evidence.
     - **Stream 2 (Teacher Register):** The official record of truth (`PRESENT`, `ABSENT`, `LATE`).
     - **Stream 3 (Student Self-Attendance):** Soft claims (`PENDING`, `ACCEPTED`, `REJECTED`).
   - "Sync from ESP32" is an explicit button click by the teacher, not an automatic background overwrite.
4. **Attendance Calculation & Statuses:**
   - `PRESENT`: Attended on time $\rightarrow$ Counts as attended (+1).
   - `LATE`: Attended late $\rightarrow$ Counts as attended (+1).
   - `ABSENT`: Did not attend $\rightarrow$ Does NOT count (0).
   - Official Attendance % = $\frac{\text{count}(\text{PRESENT}) + \text{count}(\text{LATE})}{\text{Total Finalized Conducted Sessions}} \times 100$.
5. **No Frontend Authorization Trust:**
   - Role checks in client JS (e.g., hiding an admin button) are strictly for UX.
   - Always anticipate that backend APIs may return `401 Unauthorized`, `403 Forbidden`, or `422 Unprocessable Entity` and handle them with user-friendly alerts.

### 2.3 The 5-Tier Actor Hierarchy & Front-End UI Views

The web frontend serves all institutional users through role-tailored workspaces. A user's navigation bar, accessible pages, and data editing controls are determined by their base system role in `user_roles` combined with their active dynamic scopes in `teacher_assignments`:

$$\textbf{System Admin} \succ \textbf{HOD} \succ \textbf{Class Teacher} \succ \textbf{Subject Teacher} \succ \textbf{Student}$$

| Actor Tier | System Role & Scope | Accessible Web Views | Key UI Components & Controls |
|---|---|---|---|
| **1. System Admin** | `SYSTEM_ADMIN` | `/admin/*` (All 12 Admin Views) | • Master Data DataTables (Departments, Branches, AY, Subjects)<br>• ESP32 Terminal Registry (`admin/devices.html`) with Health Badges<br>• User Provisioning & Credential Slips Exporter (`admin/students.html`)<br>• Audited Correction Modal with mandatory justification text<br>• Immutable Audit Log Table & CSV export controls |
| **2. HOD** | `TEACHER` + `HOD` | `faculty/reports.html`, `faculty/cohorts.html`, `faculty/subjects.html` | • Department-wide Cohort Switcher dropdown (auto-scoped to Dept)<br>• Comparative Faculty & Subject Attendance Performance Bar Charts<br>• Low Attendance / Defaulter Cohort Summary Matrix<br>• Read-only access to finalized classroom session registers |
| **3. Class Teacher** | `TEACHER` + `CLASS_TEACHER` | `faculty/students.html`, `faculty/registrations.html`, `faculty/reports.html` | • Cohort Roster sorted by `class_roll_no` ascending<br>• **Classroom Biometric Fingerprint Enrollment Modal** (`POST /devices/:id/enroll-mode`)<br>• Pending Student Self-Registration Review Drawer ([Approve] / [Reject])<br>• Cohort Attendance Defaulter List with threshold filtering (< 75%) |
| **4. Subject Teacher** | `TEACHER` + `SUBJECT_TEACHER` | `faculty/attendance/sessions.html`, `faculty/attendance/live.html` | • Session Creator Modal (Subject + Cohort + Delivery Mode)<br>• **Live Attendance Console:**<br>  - [Sync from ESP32] (Stream 1 biometric matching)<br>  - [Generate PIN] / [Display QR] modals (Stream 3 claims)<br>  - Roster Table with inline radio pills (`PRESENT`, `ABSENT`, `LATE`)<br>  - [Finalize & Lock Session] with universal marking check |
| **5. Student** | `STUDENT` | `student/dashboard.html`, `student/attendance/*`, `student/profile.html` | • **Active Session Banner:** Auto-detects open lecture; displays Button / PIN / QR submission input<br>• **75% Predictive Attendance Card:** Circular SVG gauge + deficit / surplus class counter<br>• Subject-wise Attendance Breakdown table with percentage pills<br>• Historical Session Timeline with filtering & status badges<br>• Account Activation Modal with mandatory initial password reset |

---

### 2.4 The 4 Cross-Actor Lifecycle Flows from the Front-End Perspective

The front-end engineer must build seamless UI transitions that correspond to the four canonical institutional lifecycle flows:

#### Flow 1: Academic Setup, Provisioning & Classroom Biometrics
1. **Admin Workspace (`admin/*`):** Admin creates departments, branches, academic years, and subjects in `admin/*.html`. In `admin/devices.html`, admin registers the classroom ESP32 device, assigning its IP and MAC. In `admin/assignments.html`, admin assigns faculty roles (HOD, Class Teacher, Subject Teacher).
2. **Class Teacher Cohort Console (`faculty/students.html`):**
   - Class Teacher selects their assigned cohort from the top header dropdown.
   - CT clicks **[Import Students via CSV]**; the UI previews parsed rows and submits to `/faculty/cohorts/provision`.
   - CT prints or exports credentials slips using **[Download Credential Slips (PDF/Excel)]**.
   - **Biometric Enrollment Action:** CT clicks the fingerprint icon next to an enrolled student. The UI opens `#modal-enroll-fingerprint`, selects the classroom ESP32 terminal, and triggers `POST /devices/:id/enroll-mode`. The modal displays a pulsing visual prompt: *"Instruct student to place finger on optical sensor twice"*, polls slot status, and updates the student's status pill to **"Fingerprint Enrolled (Slot #X)"** upon completion.
3. **Student Activation Gateway (`login/student.html`):**
   - Student logs in using their temporary credentials.
   - The UI intercepts the `needs_password_change: true` flag and renders `#modal-force-activation`.
   - Once the student submits a new secure password matching complexity rules, the UI stores the JWT and redirects to `student/dashboard.html`.

#### Flow 2: Live Classroom Attendance & Three-Stream Adjudication
1. **Subject Teacher Session Launch (`faculty/attendance/sessions.html`):**
   - Teacher clicks **[Start Attendance Session]**. A modal prompts for Subject, Cohort, Delivery Mode (L/T/P), and Auto-Close Duration (default: 30 min).
   - Upon creation, the router immediately redirects to `faculty/attendance/live.html?sessionId=...`.
2. **Student Submission (`student/attendance/active.html`):**
   - If the student visits the dashboard during an open session, a sticky top alert appears: *"Active Session Detected: IT401 Theory (Dr. Sharma)"*.
   - Clicking the alert opens the submission screen. If the session allows soft self-attendance, the student enters the teacher's broadcasted 6-digit PIN or scans the screen QR code.
   - Successful submission renders a green checkmark pill: *"Claim Recorded (PENDING Teacher Approval)"*.
3. **Teacher Live Console Adjudication (`faculty/attendance/live.html`):**
   - The UI displays students sorted strictly by `class_roll_no`.
   - **Stream 1 Action:** Teacher clicks **[Sync from ESP32]**. The UI fetches `/attendance/sessions/:id/sync-esp32`, marks matched students as `PRESENT` in the register draft, and illuminates a green fingerprint icon in the "Evidence" column.
   - **Stream 3 Action:** Teacher clicks **[Review Self-Attendance Claims]**. A slide-out panel lists students who submitted PIN/QR. Teacher clicks **[Accept All Legitimate Claims]** or audits individually.
   - **Manual Adjustments:** Teacher clicks inline status pills (`P`, `A`, `L`) for any manual overrides.
   - **Finalization:** Teacher clicks **[Finalize & Lock Session]**. The UI runs a client-side pre-validation: if any student is unmarked (`DRAFT`), an alert highlights unmarked rows. If 100% are marked, a confirmation modal confirms irreversible lock. Upon success, inputs become read-only and status updates to `FINALIZED`.

#### Flow 3: Defaulter Monitoring & Interventions
1. **Student Dashboard (`student/dashboard.html`):**
   - The client-side predictive calculator computes:
     $$\text{Deficit} = \lceil 3 \times \text{Attended} - \text{Total Conducted} \rceil$$
   - If attendance is below 75%, the circular gauge turns red/amber with an alert: *"ATTENDANCE WARNING: Attend next N consecutive classes to restore eligibility."*
2. **Class Teacher Cohort Monitor (`faculty/reports.html`):**
   - Class Teacher toggles the "Defaulters Only (< 75%)" switch.
   - The table filters rows in real time, displaying student roll numbers, attendance percentages, and deficit counts.
   - CT clicks **[Export Warning Notices (PDF)]** to notify students.
3. **HOD & Admin Oversight (`admin/reports.html` & `faculty/reports.html`):**
   - HOD compares cohorts across the department using visual bar comparisons.
   - Admin generates the semester-end official attendance register with university compliance stamps.

#### Flow 4: Exception Handling & Audited Post-Finalization Corrections
1. **Student / Faculty Offline Proof:** Student submits medical leave certificate to Class Teacher $\rightarrow$ CT endorses to HOD $\rightarrow$ HOD forwards approval to System Admin.
2. **Admin Audited Correction Console (`admin/attendance.html`):**
   - Admin searches for the specific session or student enrollment number.
   - Finalized registers display a locked padlock icon. Admin clicks **[Audited Correction]**.
   - A modal requires selecting the student, choosing the new status (e.g., `PRESENT`), and typing a mandatory justification text (e.g., *"Medical certificate ref #MED-2026-44 approved by Principal"*).
   - The [Submit Correction] button remains disabled until at least 15 characters of justification are entered.
   - Upon submission (`POST /admin/attendance/corrections`), the table refreshes, displays an "Audited" badge with tooltip details, and records the change in `admin/audit.html`.

---

## 3. What You Are Doing (Detailed Deliverables)

### 3.1 Directory Structure to Build & Maintain
```
frontend/
├── index.html                       # Public landing page with role login gateway
├── css/
│   ├── variables.css                # CSS custom properties (colors, typography, radii, shadows)
│   ├── reset.css                    # Box-sizing, margin resets, baseline normalization
│   ├── layout.css                   # Header, sidebar, main content wrapper, responsive grid
│   ├── components.css               # Buttons, cards, modals, tables, badges, toast notifications
│   └── pages/
│       ├── auth.css                 # Login, activation, registration card layouts
│       ├── student-dashboard.css    # Circular progress widget, predictor card styles
│       ├── live-attendance.css      # Interactive attendance table, PIN/QR modal styles
│       ├── reports.css              # Comparison matrix, data filter controls
│       └── admin.css                # Admin data grids and management drawers
├── js/
│   ├── api.js                       # Centralized fetch wrapper (token injection, refresh rotation)
│   ├── auth.js                      # Client session manager, token decoder, route guards
│   ├── utils.js                     # Date formatters, attendance math formulas, toast triggers
│   └── pages/
│       ├── login-faculty.js         # Faculty login controller
│       ├── login-student.js         # Student login & activation redirector
│       ├── register-student.js      # Student self-registration form controller
│       ├── student-dashboard.js     # Student stats, predictor, active session poller
│       ├── student-active.js        # Active session view, button/PIN/QR submission handlers
│       ├── student-history.js       # Filterable student attendance history
│       ├── faculty-dashboard.js     # Teacher dashboard metrics & active session creator
│       ├── faculty-sessions.js      # Session list & creation modal
│       ├── faculty-live.js          # Live classroom attendance console (core work)
│       ├── faculty-registrations.js # Class teacher pending approvals console
│       ├── faculty-reports.js       # Report generation & CSV export trigger
│       └── admin-*.js               # Individual controllers for admin management views
├── login/
│   ├── faculty.html                 # Unified faculty & admin login page
│   └── student.html                 # Student login & activation gateway
├── register/
│   └── student.html                 # Fallback student self-registration page
├── student/
│   ├── dashboard.html               # Main student analytics dashboard
│   ├── attendance/
│   │   ├── active.html              # Active session detection & submission interface
│   │   ├── history.html             # Historical attendance records
│   │   └── subjects.html            # Per-subject attendance progress & breakdown
│   ├── notifications.html           # In-app notifications list
│   └── profile.html                 # Student profile & permanent password change
├── faculty/
│   ├── dashboard.html               # Teacher dashboard
│   ├── cohorts.html                 # Assigned cohorts view
│   ├── subjects.html                # Assigned subjects view
│   ├── attendance/
│   │   ├── sessions.html            # Attendance session list & create modal
│   │   └── live.html                # Live attendance console (sessions/:id/live)
│   ├── students.html                # Enrolled student roster & biometric fingerprint enrollment
│   ├── registrations.html           # Class Teacher pending approvals
│   ├── reports.html                 # Multi-stream report generator
│   └── profile.html                 # Faculty profile settings
└── admin/
    ├── dashboard.html               # Admin institutional overview
    ├── students.html                # Student provisioning & credential slip exports
    ├── faculty.html                 # Faculty user accounts & profile management
    ├── departments.html             # Department master data CRUD
    ├── branches.html                # Branch master data CRUD
    ├── academic-years.html          # Academic year master data CRUD
    ├── subjects.html                # Subject catalog CRUD
    ├── enrollments.html             # Cohort student enrollments & roll numbers
    ├── assignments.html             # Teacher assignment mapping
    ├── devices.html                 # ESP32 hardware terminal registry
    ├── attendance.html              # Institutional attendance records
    ├── reports.html                 # Master institutional reports
    ├── audit.html                   # Immutable audit log viewer
    └── settings.html                # Attendance threshold policy configuration
```

---

## 4. For What (Business Logic & Purpose of Every Feature)

### 4.1 Why Vanilla HTML/CSS/JS?
1. **Instant Cold Start:** No JavaScript bundling or Webpack/Vite processing required. Pages load instantaneously when served by Express static middleware over local Wi-Fi.
2. **Local Edge Deployment:** The entire platform runs on a standard Windows PC inside the college. Memory and CPU overhead are minimized.
3. **Zero Tooling Dependency:** Institutional staff can inspect, debug, and maintain individual HTML/JS files without running complex Node build pipelines.

### 4.2 Why Two Student Identifiers?
- The university recognizes students by `official_enrollment_no` (e.g., `2024IT047`).
- The teacher calls roll by `class_roll_no` (e.g., `1`, `2`, `3`).
- If you sort by enrollment number, the teacher cannot conduct a natural roll call. Your UI must display both, but sort by `class_roll_no`.

### 4.3 Why the Client-Side Predictive Algorithm?
- Students are constantly stressed about semester exam eligibility (typically 75%).
- Instead of showing a static percentage, the dashboard calculates the exact number of classes they can afford to miss, or the exact number they must attend to recover.
- This runs entirely client-side in vanilla JS, reducing database load to zero extra queries.

---

## 5. How to Do Every Detail (Step-by-Step Implementation Guide)

### 5.1 The Core Design System (`css/variables.css`)
Implement these exact design tokens to ensure a premium, modern dark-mode aesthetic:

```css
:root {
  /* Brand Palette */
  --primary:          hsl(231, 89%, 62%);
  --primary-hover:    hsl(231, 89%, 55%);
  --primary-light:    hsl(231, 89%, 72%);
  --primary-subtle:   hsla(231, 89%, 62%, 0.12);

  /* Surfaces & Backgrounds */
  --bg-main:          hsl(222, 47%, 8%);
  --bg-surface:       hsl(222, 35%, 12%);
  --bg-surface-hover: hsl(222, 35%, 16%);
  --bg-card:          hsla(222, 35%, 14%, 0.85);
  --bg-overlay:       hsla(222, 47%, 6%, 0.75);

  /* Typography Colors */
  --text-primary:     hsl(220, 30%, 96%);
  --text-secondary:   hsl(220, 15%, 65%);
  --text-muted:       hsl(220, 10%, 45%);

  /* Borders & Accents */
  --border-subtle:    hsl(222, 25%, 20%);
  --border-focus:     hsl(231, 89%, 62%);

  /* Semantic Attendance Colors */
  --status-present:   hsl(142, 71%, 45%);
  --status-present-bg:hsla(142, 71%, 45%, 0.12);
  --status-absent:    hsl(0, 84%, 60%);
  --status-absent-bg: hsla(0, 84%, 60%, 0.12);
  --status-late:      hsl(38, 92%, 50%);
  --status-late-bg:   hsla(38, 92%, 50%, 0.12);
  --status-draft:     hsl(220, 15%, 50%);

  /* Layout Constants */
  --sidebar-width:    260px;
  --header-height:    64px;
  --radius-sm:        6px;
  --radius-md:        10px;
  --radius-lg:        16px;
  --radius-full:      9999px;

  /* Fonts */
  --font-sans:        'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  --font-heading:     'Outfit', var(--font-sans);
  --font-mono:        'JetBrains Mono', 'Fira Code', monospace;
}
```

### 5.2 Building the API Fetch Wrapper (`js/api.js`)
Create a robust, single-point API client that automatically handles JSON bodies, JWT bearer tokens, and transparent refresh token rotation:

```javascript
// js/api.js
const API_BASE = '/api/v1';

class ApiClient {
  constructor() {
    this.accessToken = localStorage.getItem('access_token');
  }

  setToken(token) {
    this.accessToken = token;
    if (token) {
      localStorage.setItem('access_token', token);
    } else {
      localStorage.removeItem('access_token');
    }
  }

  async request(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    try {
      let response = await fetch(url, { ...options, headers });

      // If token expired (401), attempt transparent refresh
      if (response.status === 401 && !options._retry && endpoint !== '/auth/refresh') {
        options._retry = true;
        const refreshed = await this.refreshToken();
        if (refreshed) {
          headers['Authorization'] = `Bearer ${this.accessToken}`;
          return await fetch(url, { ...options, headers });
        } else {
          this.handleAuthFailure();
          throw new Error('Session expired. Please log in again.');
        }
      }

      const data = await response.json();
      if (!response.ok) {
        throw data.error || { message: 'An unexpected error occurred' };
      }
      return data;
    } catch (err) {
      console.error(`API Error [${endpoint}]:`, err);
      throw err;
    }
  }

  async refreshToken() {
    try {
      const res = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (res.ok) {
        const data = await res.json();
        this.setToken(data.data.access_token);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  handleAuthFailure() {
    this.setToken(null);
    const isStudent = window.location.pathname.startsWith('/student');
    window.location.href = isStudent ? '/login/student' : '/login/faculty';
  }

  get(endpoint, headers) { return this.request(endpoint, { method: 'GET', headers }); }
  post(endpoint, body, headers) { return this.request(endpoint, { method: 'POST', body: JSON.stringify(body), headers }); }
  put(endpoint, body, headers) { return this.request(endpoint, { method: 'PUT', body: JSON.stringify(body), headers }); }
  delete(endpoint, headers) { return this.request(endpoint, { method: 'DELETE', headers }); }
}

export const api = new ApiClient();
```

### 5.3 Implementing the Predictive Attendance Algorithm (`js/utils.js`)
Implement this exact mathematical formula on the student dashboard:

```javascript
// js/utils.js
export function calculateAttendancePrediction(conducted, attended, thresholdPercent = 75) {
  const T = thresholdPercent / 100; // e.g. 0.75
  const P = attended;               // PRESENT + LATE
  const C = conducted;              // Finalized sessions included

  if (C === 0) {
    return {
      currentPercent: 100.0,
      status: 'SAFE',
      safeAbsences: 0,
      classesToRecover: 0,
      message: 'No classes finalized yet. Your attendance starts at 100%.'
    };
  }

  const currentPercent = ((P / C) * 100).toFixed(1);

  if (P >= T * C) {
    // Student is currently SAFE
    const X = Math.floor((P - T * C) / T);
    return {
      currentPercent,
      status: 'SAFE',
      safeAbsences: X,
      classesToRecover: 0,
      message: X === 0 
        ? 'Warning: You are exactly at threshold! Missing the next lecture will drop you below 75%.'
        : `You can safely miss up to ${X} consecutive class${X > 1 ? 'es' : ''} and remain above ${thresholdPercent}%.`
    };
  } else {
    // Student is currently AT RISK
    const Y = Math.ceil((T * C - P) / (1 - T));
    return {
      currentPercent,
      status: 'AT_RISK',
      safeAbsences: 0,
      classesToRecover: Y,
      message: `Attention: You must attend the next ${Y} consecutive class${Y > 1 ? 'es' : ''} to reach ${thresholdPercent}%.`
    };
  }
}
```

### 5.4 Implementing the Live Attendance Console (`faculty/attendance/live.html`)
The live attendance console is the **most critical screen in the entire application**. It must provide:

1. **Header Controls:**
   - Subject Name, Cohort Badge (`IT • Year 2 • Sem 3`), Session Type (`THEORY`/`PRACTICAL`).
   - Current State Pill: `DRAFT`, `OPEN`, `CLOSED`, or `FINALIZED`.
   - Timer Countdown if `auto_close_at` is set.
2. **Action Toolbar:**
   - `[Sync from ESP32]`: Calls `POST /api/v1/attendance/sessions/:id/sync-esp32`. Shows spinner, updates matching rows to `PRESENT` with source badge `ESP32`.
   - `[Generate PIN]`: Opens modal showing large 4-digit code and countdown timer.
   - `[Show QR Code]`: Opens modal displaying dynamic canvas QR code.
   - `[Mark Remaining Absent]`: One-click utility that sets all unmarked students to `ABSENT`.
3. **Incoming Self-Attendance Request Bar:**
   - Floats at the top when requests arrive.
   - Lists student name, roll number, and timestamp.
   - Provides **[Accept]** (updates status to `PRESENT`, source `SELF_REQUEST`) and **[Reject]** buttons.
4. **Interactive Roster Grid:**
   - Table columns: `Roll No` | `Name` | `Official Enrollment` | `Attendance Toggle` | `Provenance Badge` | `Teacher Notes`.
   - The attendance toggle must be a 3-state segmented control:
     ```html
     <div class="status-toggle" data-student-id="105">
       <button class="btn-toggle present active" data-val="PRESENT">P</button>
       <button class="btn-toggle absent" data-val="ABSENT">A</button>
       <button class="btn-toggle late" data-val="LATE">L</button>
     </div>
     ```
5. **Finalization Safeguard:**
   - When the teacher clicks **[Finalize & Lock]**, inspect every included student row.
   - If any row is unmarked, block submission and flash an alert toast: *"Cannot finalize: 4 students remain unmarked in the register."*
   - If all rows are marked, open confirmation dialog: *"This will permanently lock this session as an official institutional record. Confirm finalization?"*

---

## 6. Expected API Endpoints & JSON Inputs/Outputs (Front-End Contract)

Every page you build consumes specific backend endpoints. Below are the **exact request payloads and expected JSON outputs** your JavaScript scripts must parse and render.

### 6.1 Standard Global Response Envelopes

#### Success Envelope
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional human-readable feedback",
  "meta": { "pagination": { "page": 1, "limit": 50, "total": 1 } }
}
```

#### Error Envelope (Form Validation & Business Logic Failures)
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR | UNAUTHORIZED | FORBIDDEN | NOT_FOUND | UNPROCESSABLE_ENTITY",
    "message": "Human-readable description of error",
    "details": [
      {
        "field": "password",
        "message": "Password must be at least 8 characters long"
      }
    ]
  }
}
```

---

### 6.2 Authentication & User State APIs

#### A. Faculty Login
- **Endpoint:** `POST /api/v1/auth/faculty/login`
- **Request JSON:**
  ```json
  {
    "username": "prof.sharma@college.local",
    "password": "FacultyPassword123!"
  }
  ```
- **Expected Response `200 OK` JSON:**
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

#### B. Student Login (Standard vs First-Time Provisioned)
- **Endpoint:** `POST /api/v1/auth/student/login`
- **Request JSON:**
  ```json
  {
    "enrollment_no": "2024IT047",
    "password": "TemporaryOrPermanentPassword"
  }
  ```
- **Expected Response `200 OK` (Standard Active Account):**
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
- **Expected Response `200 OK` (First-Time Provisioned — Trigger Password Setup Screen):**
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

#### C. Student Permanent Password Activation
- **Endpoint:** `POST /api/v1/auth/student/activate`
- **Request Headers:** `Authorization: Bearer <activation_token>`
- **Request JSON:**
  ```json
  {
    "new_password": "NewPermanentPassword2026!"
  }
  ```
- **Expected Response `200 OK` JSON:**
  ```json
  {
    "success": true,
    "data": {
      "access_token": "eyJhbGciOi...",
      "message": "Account activated successfully. Welcome to the portal!"
    }
  }
  ```

---

### 6.3 Student Portal APIs

#### A. Student Attendance Dashboard Metrics & Prediction
- **Endpoint:** `GET /api/v1/students/me/attendance/stats`
- **Request Headers:** `Authorization: Bearer <access_token>`
- **Expected Response `200 OK` JSON:**
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

#### B. Subject-Wise Attendance Breakdown
- **Endpoint:** `GET /api/v1/students/me/attendance/subjects`
- **Expected Response `200 OK` JSON:**
  ```json
  {
    "success": true,
    "data": [
      {
        "subject_id": 4,
        "subject_name": "Database Management Systems",
        "subject_code": "IT401",
        "conducted": 10,
        "attended": 9,
        "absent": 1,
        "percentage": 90.0
      },
      {
        "subject_id": 5,
        "subject_name": "Operating Systems",
        "subject_code": "IT402",
        "conducted": 8,
        "attended": 6,
        "absent": 2,
        "percentage": 75.0
      }
    ]
  }
  ```

#### C. Active Attendance Session Detection
- **Endpoint:** `GET /api/v1/attendance/sessions/active`
- **Expected Response `200 OK` JSON (When Session is Active):**
  ```json
  {
    "success": true,
    "data": {
      "active_session": {
        "session_id": 42,
        "subject_name": "Database Management Systems",
        "session_type": "THEORY",
        "teacher_name": "Prof. R. Sharma",
        "start_time": "2026-09-09T10:00:00Z",
        "auto_close_at": "2026-09-09T10:30:00Z",
        "modes_allowed": ["BUTTON", "PIN", "QR"]
      }
    }
  }
  ```
- **Expected Response `200 OK` JSON (When No Active Session):**
  ```json
  {
    "success": true,
    "data": {
      "active_session": null
    }
  }
  ```

#### D. Submit Self-Attendance (PIN or QR Mode)
- **Endpoint (PIN):** `POST /api/v1/attendance/sessions/42/self-attendance/pin`
- **Request JSON:** `{ "pin": "4821" }`
- **Expected Response `201 Created` JSON:**
  ```json
  {
    "success": true,
    "data": {
      "request_id": 18,
      "session_id": 42,
      "verification_mode": "PIN",
      "request_status": "PENDING",
      "submitted_at": "2026-09-09T10:07:33Z",
      "message": "PIN verified! Attendance request submitted. Awaiting teacher confirmation."
    }
  }
  ```

---

### 6.4 Faculty Portal APIs (Live Console & Management)

#### A. Get Assigned Cohorts & Subjects
- **Endpoint:** `GET /api/v1/faculty/cohorts`
- **Expected Response `200 OK` JSON:**
  ```json
  {
    "success": true,
    "data": [
      {
        "department_id": 1,
        "department_name": "Information Technology",
        "branch_id": 1,
        "branch_name": "B.Tech",
        "year": 2,
        "semester": 3,
        "academic_year_id": 1,
        "academic_year_label": "2026-27",
        "assignment_type": "SUBJECT_TEACHER"
      }
    ]
  }
  ```

#### B. Get Live Session Details & Roster Snapshot
- **Endpoint:** `GET /api/v1/attendance/sessions/42`
- **Expected Response `200 OK` JSON:**
  ```json
  {
    "success": true,
    "data": {
      "session": {
        "id": 42,
        "subject_name": "Database Management Systems",
        "session_type": "THEORY",
        "state": "OPEN",
        "start_time": "2026-09-09T10:00:00Z",
        "auto_close_at": "2026-09-09T10:30:00Z"
      },
      "roster": [
        {
          "student_id": 101,
          "class_roll_no": 1,
          "full_name": "Arjun Mehta",
          "official_enrollment_no": "2024IT001",
          "included": true,
          "attendance_status": "PRESENT",
          "source": "ESP32_SYNC",
          "teacher_notes": null,
          "esp32_detected": true
        },
        {
          "student_id": 102,
          "class_roll_no": 2,
          "full_name": "Priya Patel",
          "official_enrollment_no": "2024IT002",
          "included": true,
          "attendance_status": null,
          "source": null,
          "teacher_notes": null,
          "esp32_detected": false
        }
      ]
    }
  }
  ```

#### C. 1-Click ESP32 Presence Sync
- **Endpoint:** `POST /api/v1/attendance/sessions/42/sync-esp32`
- **Expected Response `200 OK` JSON:**
  ```json
  {
    "success": true,
    "data": {
      "matched_scans_count": 28,
      "unmatched_enrolled_count": 14,
      "message": "Synchronized 28 biometric scans into session register. Review and edit exceptions."
    }
  }
  ```

#### D. Generate Soft-Verification PIN
- **Endpoint:** `POST /api/v1/attendance/sessions/42/pin`
- **Expected Response `200 OK` JSON:**
  ```json
  {
    "success": true,
    "data": {
      "pin": "4821",
      "expires_at": "2026-09-09T10:20:00Z",
      "valid_minutes": 15
    }
  }
  ```

#### E. Generate Dynamic QR Code Token
- **Endpoint:** `POST /api/v1/attendance/sessions/42/qr`
- **Expected Response `200 OK` JSON:**
  ```json
  {
    "success": true,
    "data": {
      "session_id": 42,
      "qr_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expires_at": "2026-09-09T10:15:00Z"
    }
  }
  ```

#### F. Incoming Self-Attendance Requests Feed
- **Endpoint:** `GET /api/v1/attendance/sessions/42/self-attendance`
- **Expected Response `200 OK` JSON:**
  ```json
  {
    "success": true,
    "data": [
      {
        "request_id": 18,
        "student_id": 105,
        "class_roll_no": 15,
        "full_name": "Rahul Sharma",
        "verification_mode": "PIN",
        "request_status": "PENDING",
        "submitted_at": "2026-09-09T10:07:33Z"
      }
    ]
  }
  ```

#### G. Finalize Session (Success vs 422 Unmarked Error)
- **Endpoint:** `PUT /api/v1/attendance/sessions/42/state`
- **Request JSON:** `{ "state": "FINALIZED" }`
- **Expected Response `200 OK` (All Students Marked):**
  ```json
  {
    "success": true,
    "data": {
      "session_id": 42,
      "state": "FINALIZED",
      "finalized_at": "2026-09-09T10:45:00Z",
      "message": "Session finalized successfully. Official records locked."
    }
  }
  ```
- **Expected Response `422 Unprocessable Entity` (Students Unmarked):**
  ```json
  {
    "success": false,
    "error": {
      "code": "UNPROCESSABLE_ENTITY",
      "message": "Cannot finalize session: 2 students remain unmarked in register.",
      "details": [
        { "student_id": 102, "class_roll_no": 2, "full_name": "Priya Patel" }
      ]
    }
  }
  ```

#### H. Stream Comparison Report (Discrepancy Matrix)
- **Endpoint:** `GET /api/v1/reports/stream-comparison?session_id=42`
- **Expected Response `200 OK` JSON:**
  ```json
  {
    "success": true,
    "data": {
      "session_id": 42,
      "subject": "Database Management Systems",
      "date": "2026-09-09",
      "comparison": [
        {
          "class_roll_no": 1,
          "full_name": "Arjun Mehta",
          "official_enrollment_no": "2024IT001",
          "register_status": "PRESENT",
          "esp32_scan": "DETECTED",
          "result": "MATCH"
        },
        {
          "class_roll_no": 2,
          "full_name": "Priya Patel",
          "official_enrollment_no": "2024IT002",
          "register_status": "PRESENT",
          "esp32_scan": "NOT_DETECTED",
          "result": "MISMATCH",
          "note": "Teacher marked present manually, but no hardware scan detected"
        }
      ]
    }
  }
#### I. Class Teacher Biometric Fingerprint Registration Console (`faculty/students.html`)
The Class Teacher uses this interface in the classroom to register students' optical fingerprint templates onto the classroom's ESP32 terminal:

1. **Fetch Cohort Terminals & Student Biometric Roster:**
- **Endpoint:** `GET /api/v1/faculty/cohorts/biometrics?department_id=1&branch_id=1&year=2&semester=4&academic_year_id=1`
- **Expected Response `200 OK` JSON:**
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

2. **Trigger Device Optical Sensor Enrollment Mode:**
- **Endpoint:** `POST /api/v1/devices/1/enroll-mode`
- **Request Body JSON:**
  ```json
  {
    "student_id": 105,
    "slot_id": 43
  }
  ```
- **Expected Response `200 OK` JSON (Triggers Modal Live Polling):**
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

3. **Deallocate / Clear Sensor Slot:**
- **Endpoint:** `DELETE /api/v1/devices/1/slots/43`
- **Expected Response `200 OK` JSON:**
  ```json
  {
    "success": true,
    "message": "Sensor slot deallocated and template marked for erasure."
  }
  ```

---

## 7. How You Collaborate With Other Roles

1. **With Back-End Developer:**
   - Consume endpoints strictly defined in Section 6 and [`04_API_CONTRACT.md`](file:///c:/Users/pooja/.codex/.chatgpt-projects/g-p-6a789ef4084c8191a51baa65bca08112/docs/attendance/04_API_CONTRACT.md).
   - If an endpoint returns an error, display `error.message` directly in a toast.
   - Coordinate on multipart CSV uploads for bulk student provisioning.
2. **With Database Designer:**
   - Understand the 26-table relational catalog in [`DATABASE_SCHEMA_AND_ERD.md`](file:///c:/Users/pooja/.codex/.chatgpt-projects/g-p-6a789ef4084c8191a51baa65bca08112/docs/attendance/DATABASE_SCHEMA_AND_ERD.md).
   - Recognize that `enrollments.class_roll_no` is what you sort by, while `students.official_enrollment_no` is what you authenticate with.
3. **With Application Developer:**
   - Share color tokens, typography scales, and user experience paradigms so that students and teachers experiencing the web and mobile apps feel total design continuity.

---

## 8. Front-End Deliverables Checklist

- [ ] `css/variables.css`, `reset.css`, `layout.css`, `components.css` complete.
- [ ] `js/api.js` (fetch wrapper with auto-refresh), `js/auth.js`, `js/utils.js`.
- [ ] Faculty Login (`/login/faculty.html`) & Student Login (`/login/student.html`).
- [ ] First-login Mandatory Password Setup screen.
- [ ] Student Dashboard with SVG progress ring, prediction card, active session banner.
- [ ] Student Active Attendance submission screen (Button, PIN input, QR camera link).
- [ ] Faculty Dashboard & Session Creation modal (Cohort & Subject selectors).
- [ ] Faculty Live Attendance Console (Roll-sorted table, 3-state toggle, ESP32 sync button, PIN/QR modals, Self-attendance requests).
- [ ] Class Teacher Pending Registration Approval console & Cohort toggle.
- [ ] Class Teacher Student Biometric Enrollment Console in `faculty/students.html` (Roster status badges, ESP32 terminal selector, optical enrollment modal with live touch feedback).
- [ ] Admin Master Data Management screens (Departments, Branches, Academic Years, Subjects).
- [ ] Admin ESP32 Hardware Terminal Registry & Slot Manager (`admin/devices.html`).
- [ ] Multi-Stream Attendance Reports & Stream Comparison (`MATCH`/`MISMATCH`) screen.
- [ ] Responsive layout verified on Mobile (375px), Tablet (768px), and Desktop (1280px+).

