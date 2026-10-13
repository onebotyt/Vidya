# College Attendance System — Attendance Mobile Application SRS

> **Document Type:** Software Requirements Specification (SRS)  
> **Document Identifier:** `docs/02_ATTENDANCE_MOBILE_APP_SRS.md`  
> **Version:** 1.0.0 (Architecture & Requirements Specification)  
> **Implementation Status:** FUTURE SCOPE (Phase 3 Roadmap) — NOT IMPLEMENTED IN CURRENT PHASE  
> **Current Implementation Priority:** Attendance Web System $\rightarrow$ API Stabilization & Security $\rightarrow$ Mobile Application Later  
> **Backend Integration Principle:** Consumes the identical Express REST API (`/api/v1/`) and MySQL database as the Web System. **NO separate mobile backend. NO second database.**

---

## 1. Executive Summary & Architectural Invariant

### 1.1 Purpose
The **College Attendance Mobile Application** is a planned cross-platform mobile extension engineered for students and faculty of the institution. Built using **React Native**, the mobile app provides an optimized native experience on iOS and Android devices, focusing on:
- High-convenience student mobile access: Real-time attendance monitoring, active session alerts, one-tap biometric/PIN/QR self-attendance, and predictive threshold forecasting.
- Streamlined teacher mobility: Classroom session control, live manual marking, biometric scan monitoring, and instant one-tap adjudication of student self-attendance claims directly from a smartphone or tablet.

### 1.2 Core Architectural Invariant
> **Strict System Rule:**  
> The mobile application **must NOT introduce a separate backend, microservice layer, or independent database**.  
> The React Native application functions as an alternative client interface that consumes the exact same Express.js REST API (`/api/v1/`) and interacts with the exact same on-premise MySQL 8.x database as the web application.

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

### 1.3 Client Security & Trust Model
- **Zero Frontend Trust:** The mobile client application is treated as an untrusted client environment.
- **Backend Authorization Authority:** All role permissions (`SYSTEM_ADMIN`, `TEACHER`, `STUDENT`) and academic dynamic scopes (`teacher_assignments`) are strictly enforced by backend Express middleware on every API call.
- **Dynamic Scope Resolution:** Just as in the web application, academic scopes are never baked into mobile JWT tokens. If a teacher's class assignment is modified by an administrator, mobile access permissions update instantaneously on the next request.

---

## 2. Technology Strategy & Native Capabilities

### 2.1 Technology Specifications
| Component | Technology / Library | Architectural Role |
|---|---|---|
| **Framework** | React Native (Expo Application Framework / React Native CLI) | Cross-platform native mobile application engine |
| **Language** | TypeScript / Modern JavaScript | Type-safe mobile development |
| **State Management** | React Query (TanStack Query) + Zustand | Server-state caching, background query revalidation, lightweight local state |
| **Network Client** | Axios / Fetch with interceptors | Base URL targeting `/api/v1/`, automatic JWT header attachment, refresh token rotation interceptor |
| **Secure Token Storage** | `expo-secure-store` / `react-native-keychain` | Hardware-backed encrypted keychain (iOS Keychain / Android KeyStore) for JWT access and refresh tokens |
| **Camera & QR Scanning** | `expo-camera` / `react-native-vision-camera` | High-speed native camera viewfinder for scanning teacher attendance QR codes |
| **Biometric Authentication**| `expo-local-authentication` | Device-level biometric app unlock (Face ID / Fingerprint) for student/faculty convenience |
| **Push / In-App Messaging**| WebSockets / SSE / Polling (LAN fallback) | Instant delivery of session open events and attendance status updates |
| **UI Component System** | Custom Vanilla StyleSheet / NativeWind | Dark/light theme support adhering to web HSL design tokens (`Inter` font, modern cards, glassmorphism) |

### 2.2 Network & Local Network Handling
- **Campus LAN Target:** The app connects to the Express server over institutional Wi-Fi using the server's local IP or local DNS hostname (e.g., `https://uiap-server.local:5000/api/v1`).
- **Self-Signed TLS Trust:** The React Native network stack is configured to trust the institution's self-signed local TLS certificate using custom certificate pinning or a network security configuration (`network_security_config.xml` on Android and `Info.plist` exceptions on iOS).
- **Graceful Offline Indication:** If the device loses Wi-Fi connection with the campus server, an immediate offline indicator banner informs the user: *"Disconnected from College Edge Server. Connect to Campus Wi-Fi to submit attendance."*

---

## 3. Student Mobile Application

### 3.1 Authentication & Profile Handling
- **Credentials Login:**
  - Login fields: `Official Enrollment Number` (used as username) and `Password`.
  - Secure biometric login: Once logged in, students can enable Fingerprint/FaceID device unlock to bypass re-typing passwords.
- **Google OAuth Login:**
  - Native Google Sign-In or deep-linked OAuth flow using `expo-web-browser` / `expo-auth-session`.
  - Backend verifies Google ID token, enforces the same atomic activation rules as web:
    - If `status = 'PROVISIONED'`: Links `google_sub` and activates account atomically.
    - If `status = 'PENDING'`: Displays alert: *"Registration pending Class Teacher approval."*
    - If `status = 'REJECTED'`: Displays rejection reason from `users.rejection_reason`.
- **First Login Activation Screen:**
  - If a student logs in with temporary credentials (`must_change_password = TRUE`), the app forces navigation to a **Mandatory Password Setup** screen.
  - User cannot navigate to the dashboard until a secure permanent password is set.
- **Token Handling:**
  - Access token and refresh token are stored in hardware-encrypted storage.
  - Axios interceptor automatically catches HTTP 401, calls `/api/v1/auth/refresh`, updates tokens, and retries the original request seamlessly.
- **Profile & Identity View:**
  - Displays read-only academic attributes: Full Name, Official Enrollment Number, Cohort (Department, Branch, Year, Semester), Class Roll Number, and linked Gmail status.
  - Allows password modification and optional profile avatar upload (stored via `/api/v1/students/me`).

### 3.2 Student Dashboard Experience
The student dashboard delivers an immediate, high-impact overview of academic standing:

```
┌──────────────────────────────────────────────────────────┐
│  [College Logo]  Student Portal                [🔔 2]   │
│  Hello, Arjun Mehta (Roll #15)                          │
├──────────────────────────────────────────────────────────┤
│  ⚡ ACTIVE SESSION DETECTED                              │
│  Database Management Systems (Theory)                    │
│  Teacher: Prof. R. Sharma | Started: 10:05 AM            │
│  [  MARK ATTENDANCE NOW  ]                              │
├──────────────────────────────────────────────────────────┤
│                  OVERALL ATTENDANCE                      │
│                                                          │
│                      ╭─────────╮                         │
│                     │   83.3%   │                         │
│                      ╰─────────╯                         │
│               Conducted: 18 | Attended: 15               │
│                                                          │
│  🟢 ATTENDANCE FORECAST: SAFE                            │
│  "You can safely miss up to 2 classes and remain         │
│   above the 75% institutional threshold."                │
├──────────────────────────────────────────────────────────┤
│  SUBJECT BREAKDOWN                                       │
│  • Database Management Systems        88% [████████░░]   │
│  • Operating Systems Systems          72% [███████░░░] ⚠️│
│  • Computer Networks                  90% [█████████░]   │
├──────────────────────────────────────────────────────────┤
│  RECENT ACTIVITY                                         │
│  • Today, 09:00 AM — OS: Present (PIN)                   │
│  • Yesterday, 02:00 PM — DBMS Lab: Present (ESP32)       │
└──────────────────────────────────────────────────────────┘
```

1. **Active Session Alert Banner:**
   - Periodically polls `/api/v1/attendance/sessions/active` (or listens to socket/SSE).
   - If an attendance session is currently `OPEN` for the student's enrolled cohort, a prominent animated card appears at the top of the dashboard.
2. **Attendance Ring Widget:**
   - Circular progress component displaying overall official attendance percentage:
     $$\text{Attendance } \% = \frac{\text{PRESENT} + \text{LATE}}{\text{Conducted Finalized Sessions}} \times 100$$
   - Breakdown badges: Total Conducted ($C$), Present, Late, Absent.
3. **Predictive Analytics Card:**
   - Directly executes the SRS prediction formulas client-side based on institutional threshold $T = 0.75$:
     - **If Safe:** Displays green badge: *"You can safely miss up to $X$ more classes and stay above 75%."* ($X = \lfloor (P - T \cdot C) / T \rfloor$).
     - **If At Risk:** Displays high-priority red alert: *"Warning! You need to attend $Y$ more consecutive classes to reach 75%."* ($Y = \lceil (T \cdot C - P) / (1 - T) \rceil$).
     - **If On the Edge ($X=0$):** Displays warning: *"Borderline! Missing the next class will drop you below 75%."*
4. **Subject-Wise Progress Cards:**
   - Visual progress bars for each registered subject with color indicators:
     - Green: $\ge 80\%$
     - Yellow/Warning: $75\% - 79.9\%$
     - Red/Critical: $< 75\%$

### 3.3 Attendance Capture Module
When a session is active, the student taps into the **Mark Attendance** screen, which dynamically renders the submission mode enabled by the teacher:

1. **Mode A: Single-Tap Button Submission (`BUTTON`)**
   - Renders a large animated button: **[Mark Myself Present]**.
   - Sends `POST /api/v1/attendance/sessions/:id/self-attendance`.
   - Transitions button to: *"Request Submitted — Awaiting Teacher Acceptance"*.
2. **Mode B: Session PIN Code (`PIN`)**
   - Displays a clean numeric keypad input.
   - Student enters the 4-to-6 digit code projected by the teacher in class.
   - Sends `POST /api/v1/attendance/sessions/:id/self-attendance/pin` with `{ pin: "4821" }`.
   - Displays instant validation response.
3. **Mode C: Dynamic QR Code Scanner (`QR`)**
   - Launches native camera viewfinder (`CameraView`).
   - Scans the teacher's screen QR code.
   - Extracts signed payload: `session_id`, `token`, `timestamp`.
   - Sends `POST /api/v1/attendance/sessions/:id/self-attendance/qr`.
   - Visual haptic feedback (vibration + green checkmark) on successful scan submission.

### 3.4 Attendance History & Detail Inspection
- **History Feed:**
  - Chronological list of all attended/missed sessions.
  - Filterable by: Subject, Date Range, Status (`PRESENT`, `ABSENT`, `LATE`).
- **Session Detail Sheet:**
  - Tapping an item opens a bottom sheet showing: Subject name, Session Type (Theory/Lab), Teacher name, Start time, Finalized status, and Attendance Source (`MANUAL`, `ESP32_SYNC`, `SELF_REQUEST`).
  - Shows teacher remarks if any were recorded (e.g., *"Arrived 15 minutes late"*).

### 3.5 In-App Notifications
- Displays a dedicated notification feed fetched from `/api/v1/notifications`:
  - Attendance session opened for your cohort.
  - Self-attendance request accepted or rejected by teacher.
  - Low attendance alert triggered.
  - Registration status notifications.

---

## 4. Teacher Mobile Application

### 4.1 Role Verification & Dynamic Scope Enforcement
- Faculty members log in with their institutional credentials.
- The mobile app immediately retrieves the teacher's profile and active functional scopes:
  $$\text{teacher\_assignments} \longrightarrow (\text{SUBJECT\_TEACHER}, \text{CLASS\_TEACHER}, \text{HOD})$$
- UI navigation adapts strictly to assigned permissions:
  - If teacher is assigned as `CLASS_TEACHER`: Unlocks the **Registration Approvals** tab.
  - If teacher is assigned as `HOD`: Unlocks **Department Analytics** overview.

### 4.2 Teacher Dashboard
- **Quick Metrics:** Classes conducted this week, total students taught, pending self-registration count.
- **Assigned Cohorts & Subjects:** Expandable cards showing current academic year assignments (e.g., *IT • 2nd Year • Sem 3 • DBMS*).
- **Fast Action:** Floating Action Button (FAB) $\rightarrow$ **[Start Attendance Session]**.

### 4.3 Session Creation & Lifecycle Management
Teachers can initiate and govern classroom sessions directly from their phone:

```
┌──────────────────────────────────────────────────────────┐
│  [<]  Live Session: DBMS (Theory)              [Close ✕] │
│  Cohort: IT • Year 2 • Sem 3 | 42 Students               │
│  State: OPEN (Auto-close in 18 min)                      │
├──────────────────────────────────────────────────────────┤
│  SESSION CONTROLS                                        │
│  [ 🔄 Sync ESP32 ]  [ 🔢 Show PIN ]  [ 📱 Show QR ]       │
├──────────────────────────────────────────────────────────┤
│  SELF-ATTENDANCE REQUESTS (3 Pending)                    │
│  • Rahul Verma (Roll #12)    [✓ Accept]  [✕ Reject]      │
│  • Priya Shah (Roll #18)     [✓ Accept]  [✕ Reject]      │
│  [ Accept All (3) ]                                      │
├──────────────────────────────────────────────────────────┤
│  STUDENT REGISTER (Sorted by Roll No)                    │
│  1. Arjun Mehta     [ P ] [ A ] [ L ]  (ESP32 Detected)  │
│  2. Ananya Patel    [ P ] [ A ] [ L ]  (Self: Accepted)  │
│  3. Devang Joshi    [ P ] [ A ] [ L ]  (Unmarked)        │
│  4. Sneha Rao       [ P ] [ A ] [ L ]  (Manual Present)  │
├──────────────────────────────────────────────────────────┤
│  [ Mark Remaining ABSENT ]     [ FINALIZE & LOCK 🔒 ]    │
└──────────────────────────────────────────────────────────┘
```

1. **Create Session Modal:**
   - Select Subject and Cohort (from assigned list).
   - Select Session Type: `THEORY`, `PRACTICAL`, `TUTORIAL`, `EXTRA`.
   - Set optional custom label (e.g., *"Batch A Lab"*).
   - Configure optional **Auto-Close Timer** (e.g., 15 min, 30 min).
   - Submits `POST /api/v1/attendance/sessions` (freezes cohort roster into `attendance_session_students`).
2. **Open Session:**
   - Teacher transitions session state to `OPEN`.
   - Can tap **[Show PIN]** to reveal a large full-screen 4-digit code to show the class.
   - Can tap **[Show QR]** to render a full-screen QR code for students to scan with their phones.
3. **One-Click ESP32 Sync:**
   - Tapping **[Sync ESP32]** calls `POST /api/v1/attendance/sessions/:id/sync-esp32`.
   - Fetches all physical scans from `esp32_presence` matching the session's time window.
   - Automatically pre-marks matched students as `PRESENT` in the register.
4. **Self-Attendance Adjudication:**
   - Displays real-time list of student requests submitted via Button, PIN, or QR.
   - Teacher taps **[Accept]** (marks student `PRESENT` with `source = 'SELF_REQUEST'`) or **[Reject]**.
   - Includes convenient **[Accept All]** batch action.
5. **Interactive Roster Marking:**
   - Scrollable student list sorted strictly by `class_roll_no`.
   - Segmented control for each student: **`[P]`** (Present), **`[A]`** (Absent), **`[L]`** (Late).
   - Visual badges indicate evidence provenance (e.g., *"ESP32 Detected"*, *"Self Request"*).
   - Allows adding teacher notes per student.
6. **Session Finalization:**
   - Tapping **[Finalize & Lock]** executes strict validation:
     - Validates that every included student has an explicit status (`PRESENT`, `ABSENT`, or `LATE`).
     - If any student is unmarked, highlights the missing rows or offers **[Mark Remaining Absent]**.
     - Transitions state to `FINALIZED`. Roster and register lock permanently into official institutional records.

### 4.4 Class Teacher Roster & Registration Management
For faculty holding the `CLASS_TEACHER` assignment:
- **Pending Registrations Screen:**
  - Displays self-registered students awaiting approval for their assigned cohort.
  - Shows student details: Name, Official Enrollment Number, Email, Google status.
  - Actions: **[Approve]** (activates account) or **[Reject]** (prompts for mandatory rejection reason).
- **Cohort Registration Toggle:**
  - Master switch: *"Allow student self-registration for this cohort"*.
  - Updates `cohort_registration_settings.registration_open` on the backend.
- **Cohort Student Roster:**
  - View all enrolled students in the cohort, filterable by status (`ACTIVE`, `PROVISIONED`).
  - View individual student attendance summaries.

### 4.5 Mobile Reports & Summary Analytics
- High-level subject attendance summaries: Total classes held, average attendance percentage.
- **Defaulters List / Low Attendance Alert:** Instantly displays all students currently below the 75% threshold, with one-tap contact details or in-app warning triggers.

---

## 5. System Admin Mobile (Status: Future / Optional)

### 5.1 Prioritization & Scope Clarification
> **Administrative Scope Rule:**  
> Developing an administrative mobile application is **explicitly de-prioritized**.  
> Primary institutional administration—including system master data configuration, faculty onboarding, role assignment, device cryptographic provisioning, database backups, and audit trail inspection—is designed exclusively for desktop web screens (`/admin/*`).

### 5.2 Optional Future Admin Capabilities
If an Admin mobile view is compiled in future releases, it must remain strictly limited to **read-only monitoring**:
- **System Health Card:** Server uptime, active database connections, edge server local time.
- **Hardware Terminal Heartbeat Monitor:** Real-time online/offline status of classroom ESP32 terminals.
- **College-Wide Metrics:** Daily institutional attendance percentage, active sessions count.

---

## 6. Future Academic Modules in Mobile UI (Roadmap Placeholders)

To ensure cohesive future expansion without requiring navigation rewrites, the mobile application architecture reserves dedicated, **clearly labeled future module placeholders**:

```
┌──────────────────────────────────────────────────────────┐
│                   ACADEMIC MODULES                       │
│                                                          │
│  [📅 Timetable]           [📝 Assignments] (Planned)     │
│  [📊 Test Scores]         [📚 Study Material] (Planned)  │
│  [📢 Notices]             [🗓️ Academic Calendar] (Plan) │
│  [🎯 Exam Schedule]       [📈 Performance] (Planned)     │
│                                                          │
│  ℹ️ "Academic modules are scheduled for upcoming phases.  │
│      Attendance services remain fully active."           │
└──────────────────────────────────────────────────────────┘
```

These sections will render informative placeholder screens in Phase 3 (*"Planned for Phase 4 / Phase 5"*) and will activate progressively as the shared backend APIs are deployed.

---

## 7. Mobile Security & Compliance Specifications

1. **Authentication Token Storage:** JWT access tokens and refresh tokens must never be written to unencrypted `AsyncStorage`. They must reside exclusively in hardware-backed secure storage (`Keychain` on iOS, `KeyStore` on Android).
2. **Session Revocation Compliance:** When a user logs out from the mobile app, the client calls `POST /api/v1/auth/logout`. The backend revokes the refresh token record in `user_sessions`, preventing token replay.
3. **No Biometric Data on Mobile:** The mobile app never handles raw biometric fingerprint templates. Physical fingerprint matching occurs strictly on the R307 sensor memory on the ESP32 hardware terminal.
4. **Certificate Pinning & MITM Protection:** Mobile builds must pin the local server's public key fingerprint to prevent interception of credentials over institutional Wi-Fi networks.
5. **No Client-Side Authorization Bypasses:** The mobile app relies entirely on HTTP status codes returned by the Express backend (`401 Unauthorized`, `403 Forbidden`, `422 Unprocessable Entity`). Modifying mobile client code cannot grant unauthorized access to academic records or attendance registers.
