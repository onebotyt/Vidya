# Team Role Guide: Application Developer (Mobile Client & Hardware Integration)

> **Role Title:** Application & IoT Integration Engineer  
> **Document Identifier:** `docs/attendance/roles/03_APPLICATION_DEVELOPER.md`  
> **Primary Responsibility:** Cross-Platform React Native Mobile App (`mobile/`) & ESP32 Terminal Protocol  
> **Target Audience:** Mobile Application Developer / IoT Firmware Integrator  
> **Collaborates With:** Back-End Developer (REST API & Webhooks), Front-End Developer (UI Design Parity), Database Designer (Entity Models)

---

## 1. Role Executive Summary & Mission

As the **Application Developer**, you bridge the physical and mobile worlds of the institution. Your responsibility is twofold:
1. **The Mobile Client Application (Phase 3 Roadmap):** Engineering a unified, cross-platform **React Native mobile application** (iOS & Android) that empowers students to monitor attendance and submit presence claims, and enables teachers to run attendance sessions directly from a smartphone or tablet.
2. **The Hardware Terminal Client Integration:** Designing and verifying the device-side communication protocol for classroom **ESP32 + R307 fingerprint terminals**, ensuring offline buffering, pinned TLS security, and batch synchronization to the server.

---

## 2. What You Need to Know (Core Architecture & Rules)

### 2.1 The Single Backend Invariant
> **Strict System Law:**  
> The mobile application **must NOT introduce a separate backend, secondary database, or custom cloud sync**.  
> Your React Native app is an alternative client interface that consumes the **exact same Express REST API (`/api/v1/`)** and interacts with the **exact same MySQL database** as the web frontend.

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

### 2.2 Technology Stack
| Layer | Technology | Specification / Library |
|---|---|---|
| **Framework** | React Native | Expo SDK or React Native CLI |
| **Language** | TypeScript | Strict type definitions mirroring API schemas |
| **State & Caching** | TanStack Query + Zustand | Server-state caching, background revalidation, and fast local UI state |
| **Networking** | Axios | Custom interceptors handling Bearer token injection and automatic refresh retry queue |
| **Secure Storage** | `expo-secure-store` / Keychain | Hardware-backed encrypted storage for JWT tokens. **Never use unencrypted `AsyncStorage` for auth tokens.** |
| **Camera & QR** | `expo-camera` / Vision Camera | High-speed native camera scanner for reading classroom attendance QR codes |
| **Device Biometrics**| `expo-local-authentication` | Device-level biometric app unlock (Face ID / Fingerprint) |
| **Hardware Client** | ESP32 + R307 Sensor | C++ / Arduino HTTP Client communicating via HTTPS POST with pinned TLS certificate |

### 2.3 Hardware & IoT Core Invariants
1. **Slot ID is NOT a Student ID:**
   - The R307 fingerprint sensor memory has slots 1 to 1000.
   - Slot 42 on Device A is NOT the same student as Slot 42 on Device B.
   - Student identity is resolved **exclusively by the compound tuple**:
     $$\textbf{Student Identity} = \textbf{device\_id} + \textbf{slot\_id}$$
2. **Offline Hardware Resilience:**
   - ESP32 terminals must buffer scan events in on-board SPI Flash (W25Q32) whenever the campus Wi-Fi drops.
   - Every scan generates a unique UUID `event_id`.
   - When the connection restores, the terminal transmits all queued scans in batch. The backend deduplicates via `UNIQUE(event_id)`.
3. **Zero Biometrics on Mobile:**
   - Raw fingerprint templates are **never transmitted to mobile apps**. Biometric matching occurs strictly inside the optical sensor hardware module on the classroom wall terminal.

### 2.4 The 5-Tier Actor Hierarchy & Mobile / IoT Client Matrix

The Application Developer must understand which actors use the Mobile App, which use Web workstations, and how the physical ESP32 terminal interacts with each:

$$\textbf{System Admin} \succ \textbf{HOD} \succ \textbf{Class Teacher} \succ \textbf{Subject Teacher} \succ \textbf{Student}$$

| Actor / Client Entity | Client Medium | App Persona / Mode | Accessible Mobile Screens & Hardware Functions |
|---|---|---|---|
| **1. System Admin** | **Web Only** | None (Workstation) | **Zero Mobile Footprint.** System administration, database recovery, and audited corrections are workstation-only tasks. |
| **2. HOD** | **Teacher Mobile App** | Department Overseer | • `DepartmentSummaryScreen`: Department-wide average attendance gauge<br>• `TeacherSessionAuditScreen`: Frequency of sessions conducted by departmental faculty<br>• Push alerts for cohorts falling below institutional thresholds (< 75%) |
| **3. Class Teacher** | **Teacher Mobile App** | Cohort Guardian | • `CohortApprovalsScreen`: 1-tap approval/rejection of pending student self-registrations<br>• `CohortDefaultersScreen`: List of cohort students below 75% with instant parent/student contact actions<br>• Biometric status indicators showing enrolled fingerprint slots per student |
| **4. Subject Teacher** | **Teacher Mobile App** | Classroom Instructor | • `SessionLauncherModal`: Start lecture/lab session with duration timer<br>• `LiveAttendanceScreen`: Dynamic QR Code display & 6-digit PIN generator<br>• `RosterReviewScreen`: 3-state radio toggles (`P`/`A`/`L`) sorted by roll number<br>• [1-Click Sync ESP32] and [Finalize Register] actions |
| **5. Student** | **Student Mobile App** | Learner / Submitter | • `AttendanceGaugeCard`: Circular SVG percentage with 75% recovery forecast<br>• `NativeQrScannerScreen`: High-speed camera scanner for classroom QR codes<br>• `PinEntryPad`: 6-digit numeric keypad for session soft marking<br>• `BiometricUnlock`: Face ID / Fingerprint lock protecting personal records |
| **6. Classroom ESP32 Terminal** | **Embedded Hardware** | Optical Sensor Node | • **Verification Mode:** Continuous scan loop; matches finger against slots 1–1000; transmits scan touches via HTTPS POST<br>• **Enrollment Mode:** Triggered by Class Teacher; guides 2-touch optical capture; writes template to slot; ACKs back to server |

---

### 2.5 The 4 Cross-Actor Lifecycle Flows from the Mobile & Hardware Perspective

The mobile app screens and ESP32 firmware state machine participate across all four institutional lifecycle flows:

#### Flow 1: Academic Setup, Provisioning & Hardware Biometric Enrollment
1. **Provisioning Distribution:** Student receives physical or digital credential slip generated on web workstation.
2. **Student App Initial Login & Activation:**
   - Student opens mobile app $\rightarrow$ `LoginScreen` $\rightarrow$ enters `official_enrollment_no` and temporary password.
   - Axios interceptor detects `{ needs_password_change: true }` and routes to `ForcePasswordChangeScreen`.
   - Student sets new secure password $\rightarrow$ token updated $\rightarrow$ prompted to enable Face ID / Fingerprint unlock via `expo-local-authentication`.
3. **Classroom Hardware Enrollment (ESP32 State Machine):**
   - Class Teacher initiates enrollment from web/tablet $\rightarrow$ Server sends command to classroom ESP32.
   - **ESP32 Firmware Mode Switch:** Terminal switches from `STATE_VERIFY` to `STATE_ENROLL`.
   - OLED displays: `ENROLL SLOT #43` / `Place Finger`.
   - Student touches R307 sensor $\rightarrow$ sensor buffers image 1 $\rightarrow$ OLED displays `Remove & Place Again`.
   - Student touches sensor second time $\rightarrow$ sensor buffers image 2, generates model, and writes template to flash slot 43.
   - ESP32 buzzer beeps twice (success tone) and posts `POST /devices/webhook/enroll-ack` with `{ device_id, slot_id: 43, student_id, status: 'SUCCESS' }`.
   - Terminal resumes normal `STATE_VERIFY`.

#### Flow 2: Live Classroom Attendance & Dual Mobile/Hardware Marking
1. **Teacher Mobile Session Launch:**
   - Subject Teacher taps `[+ Start Session]` on Teacher App. Selects Subject (e.g. IT401) and sets duration (30 min).
   - Session goes `OPEN`. Teacher taps `[Display Dynamic QR]`. Screen renders animated rotating QR code (refreshes every 15 seconds to prevent screenshot sharing).
2. **Student Presence Submission:**
   - **Hardware Path (Stream 1):** Student walks into lab, touches R307 sensor. Sensor matches slot 43 $\rightarrow$ ESP32 OLED displays `WELCOME ROLL 15` $\rightarrow$ ESP32 immediately posts `{ device_id, slot_id: 43, event_id, timestamp }` to `/api/v1/devices/webhook/scan`. If campus Wi-Fi is temporarily down, the event is saved to W25Q32 flash queue and transmitted immediately upon reconnect.
   - **Mobile Soft Path (Stream 3):** Student opens Student App $\rightarrow$ taps `[Scan Classroom QR]` $\rightarrow$ native camera opens in <200ms $\rightarrow$ scans teacher's screen $\rightarrow$ submits `{ qr_token }` to `/attendance/sessions/:id/self-submit`. Screen displays green badge: *"Claim Recorded (PENDING Approval)"*.
3. **Teacher Adjudication on Mobile:**
   - Teacher taps `[Sync ESP32]` on mobile live screen $\rightarrow$ physical scans instantly populate register.
   - Teacher taps `[Accept All QR Claims]` to batch approve soft claims.
   - Teacher checks unmarked students, toggles status, and taps `[Finalize Session]`. Teacher App confirms 100% universal marking and locks register.

#### Flow 3: Defaulter Monitoring & Mobile Alerts
1. **Student App Threshold Card:**
   - TanStack Query revalidates `studentApi.getSummary()`.
   - If attendance $<75\%$, the circular gauge turns crimson (`--status-absent`), and the `PredictionCard` calculates:
     *"Deficit Alert: You must attend the next 4 consecutive lectures to reach 75% exam eligibility."*
2. **Teacher & HOD Push Notifications:**
   - Class Teacher's app displays a badge on `CohortDefaultersTab`.
   - HOD app displays weekly departmental attendance compliance summary.

#### Flow 4: Audited Register Corrections
- **Zero Mobile Mutability:** Once a register is `FINALIZED`, neither the Student App nor the Teacher App permits edits.
- The correction flow occurs exclusively via System Admin on the desktop Web Console with mandatory audit justification.
- Once corrected by Admin, TanStack Query invalidates cache keys `['attendance', 'summary']` on the Student App, instantly updating the student's attendance gauge.

---

## 3. What You Are Doing (Detailed Deliverables)

### 3.1 Mobile App Architecture (`mobile/`)
```
mobile/
├── App.tsx                          # App root & navigation providers
├── app.json                         # Expo configuration & permission declarations
├── package.json                     # Dependencies
└── src/
    ├── api/
    │   ├── client.ts                # Axios instance with refresh interceptor
    │   ├── authApi.ts               # Login, refresh, activation endpoints
    │   ├── attendanceApi.ts         # Sessions, PIN/QR submission, live marking
    │   └── studentApi.ts            # Profile, stats, prediction metrics
    ├── components/
    │   ├── AttendanceRing.tsx       # SVG circular progress widget
    │   ├── PredictionCard.tsx       # Safe absences / recovery forecast card
    │   ├── ActiveSessionBanner.tsx  # Pulsing alert when session is open
    │   ├── QrScannerModal.tsx       # Fullscreen camera viewfinder
    │   └── StudentRosterRow.tsx     # 3-state toggle row sorted by roll no
    ├── navigation/
    │   ├── RootNavigator.tsx        # Auth check & role-based routing
    │   ├── StudentNavigator.tsx     # Student bottom tabs
    │   └── TeacherNavigator.tsx     # Teacher bottom tabs
    ├── screens/
    │   ├── auth/
    │   │   ├── LoginScreen.tsx      # Dual portal login (Enrollment / Faculty ID)
    │   │   └── ActivationScreen.tsx # Forced first-login password change
    │   ├── student/
    │   │   ├── DashboardScreen.tsx  # Attendance %, predictor, active session alert
    │   │   ├── ActiveSessionScreen.tsx # Button / PIN / QR scanner interface
    │   │   ├── HistoryScreen.tsx    # Filterable attendance log
    │   │   └── ProfileScreen.tsx    # Academic identity & password update
    │   └── teacher/
    │       ├── DashboardScreen.tsx  # Assigned cohorts, today's schedule
    │       ├── CreateSessionScreen.tsx # Session setup (Theory/Lab, auto-close)
    │       ├── LiveSessionScreen.tsx# Core console: Sync, PIN, QR, Accept claims, Lock
    │       └── RegistrationsScreen.tsx # Class Teacher approval/rejection console
    └── utils/
        ├── secureStore.ts           # Token read/write wrapper
        └── predictionMath.ts        # Client threshold prediction formulas
```

---

## 4. For What (Business Logic & Purpose of Key Systems)

### 4.1 Why Mobile Live Attendance for Faculty?
In large lecture halls or laboratories, teachers cannot stay chained to a desktop PC. A mobile app allows the teacher to:
- Walk around the lab and tap `[P]`, `[A]`, or `[L]` on their phone while inspecting student work.
- Tap **[Sync from ESP32]** to instantly pull biometric scans from the door terminal.
- Review incoming self-attendance requests submitted from student phones and tap **[Accept All]**.
- Display a large 4-digit PIN or full-screen QR code on their phone screen for nearby students to scan.

### 4.2 Why Dynamic QR Code Scanning for Students?
- Mode C soft verification allows students to mark attendance using their own phone camera.
- The QR code contains an HMAC-signed token with a 10-minute expiry window.
- Scanning the code verifies that the student was physically in the room looking at the teacher's screen, preventing remote proxy attendance from home.

---

## 5. How to Do Every Detail (Implementation Recipes)

### 5.1 Axios Interceptor with Refresh Token Queue (`src/api/client.ts`)
Implement an interceptor that transparently rotates tokens and prevents race conditions when multiple requests fail simultaneously:

```typescript
// src/api/client.ts
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const API_BASE_URL = 'https://uiap-server.local:5000/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
});

let isRefreshing = false;
let failedQueue: Array<{ resolve: (token: string) => void; reject: (err: any) => void }> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token!);
  });
  failedQueue = [];
};

// Request interceptor: Attach access token
apiClient.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: Catch 401 and rotate token
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = await SecureStore.getItemAsync('refresh_token');
        if (!refreshToken) throw new Error('No refresh token stored');

        const res = await axios.post(`${API_BASE_URL}/auth/refresh`, { refresh_token: refreshToken });
        const newAccessToken = res.data.data.access_token;
        const newRefreshToken = res.data.data.refresh_token;

        await SecureStore.setItemAsync('access_token', newAccessToken);
        if (newRefreshToken) {
          await SecureStore.setItemAsync('refresh_token', newRefreshToken);
        }

        processQueue(null, newAccessToken);
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return apiClient(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        await SecureStore.deleteItemAsync('access_token');
        await SecureStore.deleteItemAsync('refresh_token');
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error.response?.data?.error || error);
  }
);
```

### 5.2 Native QR Code Camera Scanner (`src/screens/student/QrScannerScreen.tsx`)
Scan the teacher's session QR code and transmit the signed token:

```tsx
// src/screens/student/QrScannerScreen.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { apiClient } from '../../api/client';

export function QrScannerScreen({ route, navigation }: any) {
  const { sessionId } = route.params;
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  if (!permission) return <View />;
  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text>Camera permission is required to scan attendance QR codes.</Text>
        <Text onPress={requestPermission} style={styles.link}>Grant Permission</Text>
      </View>
    );
  }

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);

    try {
      // QR contains JSON: { session_id, token, timestamp }
      const payload = JSON.parse(data);

      if (payload.session_id !== sessionId) {
        Alert.alert('Invalid QR', 'This QR code belongs to a different lecture session.');
        setScanned(false);
        return;
      }

      await apiClient.post(`/attendance/sessions/${sessionId}/self-attendance/qr`, {
        qr_token: payload.token,
      });

      Alert.alert('Success', 'Self-attendance request submitted! Awaiting teacher confirmation.', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (err: any) {
      Alert.alert('Scan Failed', err.message || 'Invalid QR code');
      setScanned(false);
    }
  };

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      />
      <View style={styles.overlay}>
        <Text style={styles.instructions}>Align classroom QR code within the frame</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  link: { color: '#6366f1', marginTop: 10, fontWeight: 'bold' },
  overlay: { position: 'absolute', bottom: 60, width: '100%', alignItems: 'center' },
  instructions: { color: '#fff', fontSize: 16, backgroundColor: 'rgba(0,0,0,0.6)', padding: 12, borderRadius: 8 }
});
```

### 5.3 ESP32 Firmware Client Protocol Specification
When building or verifying the C++ / Arduino firmware for the classroom ESP32:

```cpp
// ESP32 Firmware Protocol Specification
// HTTP Client POST to: https://uiap-server.local:5000/api/v1/devices/webhook/scan

#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

const char* serverUrl = "https://uiap-server.local:5000/api/v1/devices/webhook/scan";
const char* deviceUid = "ESP32_LAB3_01";
const char* deviceSecret = "sec_live_9f83kd92..."; // Pre-shared key

// Self-signed certificate SHA-256 fingerprint for MITM protection
const char* serverFingerprint = "AA BB CC DD EE ...";

void sendScanEvent(int slotId, const char* eventUuid, const char* isoTimestamp) {
  if (WiFi.status() != WL_CONNECTED) {
    // Write to W25Q32 SPI Flash offline buffer
    bufferScanOffline(slotId, eventUuid, isoTimestamp);
    return;
  }

  WiFiClientSecure client;
  client.setFingerprint(serverFingerprint);
  HTTPClient http;

  http.begin(client, serverUrl);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("X-Device-Secret", deviceSecret);

  StaticJsonDocument<512> doc;
  doc["device_uid"] = deviceUid;
  JsonArray scans = doc.createNestedArray("scans");

  JsonObject scan = scans.createNestedObject();
  scan["slot_id"] = slotId;
  scan["event_id"] = eventUuid;
  scan["scanned_at"] = isoTimestamp;
  scan["battery"] = 94;

  String requestBody;
  serializeJson(doc, requestBody);

  int httpCode = http.POST(requestBody);
  if (httpCode == 200) {
    // Flush any successfully transmitted scans from offline SPI buffer
  }
  http.end();
}

// ---------------------------------------------------------------------------
// ESP32 Optical Sensor Enrollment Routine (Triggered by Class Teacher via Web)
// ---------------------------------------------------------------------------
// Drives Adafruit-compatible R307 / AS608 optical fingerprint sensor
int enrollFingerprintSlot(int targetSlotId) {
  // Step 1: First optical capture
  displayPrompt("Place Finger");
  while (finger.getImage() != FINGERPRINT_OK) { delay(50); }
  if (finger.image2Tz(1) != FINGERPRINT_OK) return -1;

  displayPrompt("Lift & Place Again");
  delay(1000);
  while (finger.getImage() != FINGERPRINT_NOFINGER) { delay(50); }

  // Step 2: Second optical capture
  while (finger.getImage() != FINGERPRINT_OK) { delay(50); }
  if (finger.image2Tz(2) != FINGERPRINT_OK) return -1;

  // Step 3: Combine scans into template model & store in target slot
  if (finger.createModel() != FINGERPRINT_OK) return -2;
  if (finger.storeModel(targetSlotId) != FINGERPRINT_OK) return -3;

  displayPrompt("Enrollment Success!");
  beepBuzzer(2); // Two short confirmation beeps
  return targetSlotId;
}
```

---

## 6. Mobile & IoT API Endpoints and Expected JSON Inputs/Outputs

As the Application Developer, both your React Native mobile app and the ESP32 hardware terminal client communicate with the backend via the following **exact JSON input and output schemas**.

### 6.1 Mobile Authentication & Token Rotation APIs

#### A. Mobile Student / Teacher Login
- **Endpoint:** `POST /api/v1/auth/student/login` or `POST /api/v1/auth/faculty/login`
- **Request JSON:**
  ```json
  {
    "enrollment_no": "2024IT047",
    "password": "SecurePassword123!"
  }
  ```
- **Expected Response `200 OK` (Tokens Stored in `expo-secure-store`):**
  ```json
  {
    "success": true,
    "data": {
      "access_token": "eyJhbGciOi...",
      "refresh_token": "eyJhbGciOi...",
      "must_change_password": false,
      "user": {
        "id": 105,
        "official_enrollment_no": "2024IT047",
        "full_name": "Rahul Sharma",
        "roles": ["STUDENT"],
        "status": "ACTIVE"
      }
    }
  }
  ```

#### B. Mobile Token Refresh (Network Interceptor)
- **Endpoint:** `POST /api/v1/auth/refresh`
- **Request JSON (Bearer / Body for Mobile):**
  ```json
  {
    "refresh_token": "eyJhbGciOi..."
  }
  ```
- **Expected Response `200 OK` JSON:**
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

### 6.2 Student Mobile App APIs

#### A. Dashboard Attendance Percentage & Threshold Prediction
- **Endpoint:** `GET /api/v1/students/me/attendance/stats`
- **Headers:** `Authorization: Bearer <access_token>`
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

#### B. Active Attendance Session Detection
- **Endpoint:** `GET /api/v1/attendance/sessions/active`
- **Expected Response `200 OK` (Pulsing Banner Active):**
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

#### C. Submit QR Attendance (Camera Viewfinder Result)
- **Endpoint:** `POST /api/v1/attendance/sessions/42/self-attendance/qr`
- **Request JSON:**
  ```json
  {
    "qr_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
  ```
- **Expected Response `201 Created` JSON:**
  ```json
  {
    "success": true,
    "data": {
      "request_id": 22,
      "session_id": 42,
      "verification_mode": "QR",
      "request_status": "PENDING",
      "submitted_at": "2026-09-09T10:08:14Z",
      "message": "QR attendance scanned successfully! Awaiting teacher acceptance."
    }
  }
  ```

#### D. Submit PIN Attendance (Numeric Keypad Result)
- **Endpoint:** `POST /api/v1/attendance/sessions/42/self-attendance/pin`
- **Request JSON:** `{ "pin": "4821" }`
- **Expected Response `201 Created` JSON:**
  ```json
  {
    "success": true,
    "data": {
      "request_id": 23,
      "session_id": 42,
      "verification_mode": "PIN",
      "request_status": "PENDING",
      "submitted_at": "2026-09-09T10:09:02Z",
      "message": "PIN verified! Request submitted."
    }
  }
  ```

---

### 6.3 Teacher Mobile App APIs (Classroom Console)

#### A. Create Attendance Session
- **Endpoint:** `POST /api/v1/attendance/sessions`
- **Request JSON:**
  ```json
  {
    "subject_id": 4,
    "department_id": 1,
    "branch_id": 1,
    "year": 2,
    "semester": 3,
    "academic_year_id": 1,
    "session_type": "THEORY",
    "label": "DBMS Lecture 1",
    "start_time": "2026-09-09T10:00:00Z",
    "auto_close_minutes": 20
  }
  ```
- **Expected Response `201 Created` JSON:**
  ```json
  {
    "success": true,
    "data": {
      "session_id": 42,
      "state": "DRAFT",
      "auto_close_at": "2026-09-09T10:20:00Z",
      "frozen_roster_count": 42
    }
  }
  ```

#### B. Get Live Roster & Attendance Statuses
- **Endpoint:** `GET /api/v1/attendance/sessions/42`
- **Expected Response `200 OK` JSON:**
  ```json
  {
    "success": true,
    "data": {
      "session": { "id": 42, "state": "OPEN", "subject_name": "DBMS" },
      "roster": [
        {
          "student_id": 101,
          "class_roll_no": 1,
          "full_name": "Arjun Mehta",
          "official_enrollment_no": "2024IT001",
          "attendance_status": "PRESENT",
          "source": "ESP32_SYNC",
          "esp32_detected": true
        },
        {
          "student_id": 102,
          "class_roll_no": 2,
          "full_name": "Priya Patel",
          "official_enrollment_no": "2024IT002",
          "attendance_status": null,
          "source": null,
          "esp32_detected": false
        }
      ]
    }
  }
  ```

#### C. Mobile 1-Click ESP32 Sync
- **Endpoint:** `POST /api/v1/attendance/sessions/42/sync-esp32`
- **Expected Response `200 OK` JSON:**
  ```json
  {
    "success": true,
    "data": {
      "matched_scans_count": 28,
      "unmatched_enrolled_count": 14,
      "message": "Synchronized 28 biometric scans into register."
    }
  }
  ```

#### D. Review & Adjudicate Self-Attendance Request
- **Endpoint:** `POST /api/v1/attendance/sessions/42/self-attendance/18/adjudicate`
- **Request JSON:** `{ "action": "ACCEPT" }`
- **Expected Response `200 OK` JSON:**
  ```json
  {
    "success": true,
    "data": {
      "request_id": 18,
      "student_id": 105,
      "attendance_status": "PRESENT",
      "source": "SELF_REQUEST"
    }
  }
  ```

#### E. Finalize Session (Success vs 422 Unmarked Error)
- **Endpoint:** `PUT /api/v1/attendance/sessions/42/state`
- **Request JSON:** `{ "state": "FINALIZED" }`
- **Expected Response `200 OK` JSON:**
  ```json
  {
    "success": true,
    "data": {
      "session_id": 42,
      "state": "FINALIZED",
      "finalized_at": "2026-09-09T10:45:00Z"
    }
  }
  ```
- **Expected Response `422 Unprocessable Entity` JSON:**
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

---

### 6.4 ESP32 Hardware Webhook & Telemetry Protocol

#### A. Biometric Fingerprint Scan Webhook (Single Scan or Batch)
- **Endpoint:** `POST /api/v1/devices/webhook/scan`
- **Request Headers:**
  - `Content-Type: application/json`
  - `X-Device-Secret: sec_live_9f83kd92...`
- **Request Body JSON sent by ESP32 C++ HTTP Client:**
  ```json
  {
    "device_uid": "ESP32_LAB3_01",
    "scans": [
      {
        "slot_id": 42,
        "event_id": "8f1b2b4e-7b43-4e31-8f23-6b30f8a8470a",
        "scanned_at": "2026-09-09T10:05:12Z",
        "battery": 94
      }
    ]
  }
  ```
- **Expected Response `200 OK` JSON returned to ESP32:**
  ```json
  {
    "success": true,
    "data": {
      "device_uid": "ESP32_LAB3_01",
      "received": 1,
      "inserted": 1,
      "ignored_duplicates": 0
    },
    "message": "Presence events processed and deduplicated."
  }
  ```

#### B. Hardware Terminal Heartbeat Telemetry
- **Endpoint:** `POST /api/v1/devices/heartbeat`
- **Request Headers:** `X-Device-Secret: sec_live_9f83kd92...`
- **Request Body JSON:**
  ```json
  {
    "device_uid": "ESP32_LAB3_01",
    "battery_pct": 94,
    "free_heap_bytes": 142300,
    "wifi_rssi_dbm": -58,
    "uptime_seconds": 86400,
    "enrolled_fingerprint_count": 42
  }
  ```
- **Expected Response `200 OK` JSON:**
  ```json
  {
    "success": true,
    "data": {
      "device_uid": "ESP32_LAB3_01",
      "server_utc_time": "2026-09-09T10:05:15Z",
      "status": "ONLINE"
    }
  }
  ```

---

## 7. How You Collaborate With Other Roles

1. **With Back-End Developer:**
   - Consume endpoints strictly defined in Section 6 and [`04_API_CONTRACT.md`](file:///c:/Users/pooja/.codex/.chatgpt-projects/g-p-6a789ef4084c8191a51baa65bca08112/docs/attendance/04_API_CONTRACT.md).
   - Ensure the mobile app receives and sends `refresh_token` properly without browser cookie dependencies.
   - Coordinate on payload structures for the ESP32 `/devices/webhook/scan` endpoint.
2. **With Front-End Developer:**
   - Synchronize design aesthetics: Match colors (`--status-present`, `--primary`), border radii, and prediction cards so that switching between web and mobile feels unified.
3. **With Database Designer:**
   - Understand that `class_roll_no` is cohort-scoped and must be used for default roster order, while `official_enrollment_no` is used for authentication.

---

## 8. Application Developer Deliverables Checklist

- [ ] React Native project scaffold with TypeScript and secure storage configuration.
- [ ] Axios client with token refresh interceptor and concurrency queue.
- [ ] Student Login & first-time mandatory password setup screen.
- [ ] Student Dashboard (Progress ring, threshold prediction card, active session banner).
- [ ] Student Attendance Submission (Single-tap button, PIN input keypad, native QR camera viewfinder).
- [ ] Teacher Dashboard & Session Creation interface (Theory/Lab, auto-close timer).
- [ ] Teacher Live Attendance Console (Roll-sorted list, `[P]`/`[A]`/`[L]` toggles, Sync ESP32 button, Self-attendance adjudication, Finalize & Lock).
- [ ] Class Teacher Registration Approvals screen.
- [ ] ESP32 firmware HTTPS payload specification with offline SPI flash queue and certificate fingerprint pinning.
- [ ] ESP32 optical sensor enrollment handler (driving R307 2-touch enrollment and acknowledging slot assignment to server).
- [ ] Campus Wi-Fi disconnect detection and local edge server reconnect handling.

