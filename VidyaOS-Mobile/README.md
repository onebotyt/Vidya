# VidyaOS — Native Android Mobile Application 📱

A production-grade, true native mobile application for **VidyaOS**, built with **React Native**, **Expo SDK 58**, **TypeScript**, and **Expo Router**.

Designed specifically for institutional colleges adhering to NBA accreditation standards, providing role-based mobile experiences for **Students**, **Faculty**, and **Administrators**.

---

## 🚀 Key Architectural Highlights

- **100% Native Mobile Experience**: Zero WebView wrappers; utilizes high-performance native components with custom styling and animations.
- **Expo Router Stack**: Modern file-based routing (`app/`) with nested role tabs (`(student)`, `(faculty)`, `(admin)`), type-safe navigation, and deep-linking support.
- **Hermes Bytecode Engine**: Fully optimized Hermes compilation with instantaneous launch times and minimal memory footprint.
- **Hardware-Backed Security**: Persistent credential and JWT management using `expo-secure-store` with AES hardware encryption and persistent device fingerprinting (`X-Device-Id`).
- **Render Cloud Cold-Start Resilience**: Built-in 25-second startup grace period and 3-stage failure thresholds preventing false offline banners when the backend awakens from idle sleep.
- **Real-Time Live Attendance**:
  - **Student Self-Attendance**: Scans dynamic rotating QR tokens (`expo-camera`) or enters rolling 6-digit session PINs.
  - **Faculty Live Session Studio**: Generates rolling PINs with countdown timers, dynamic QR tokens, and real-time student check-in feeds.
- **In-App Notifications & Bug Deep-Linking**: Live unread badge counters, polling feeds, and instant deep-linking to technical bug report dossiers.
- **Institutional Desktop Gates**: Routes heavy ledgers and NBA documents (`Sheets`, `Course File`, `Assessment Process`, `ESP32 Devices`, `HOD Archive`, and `Admin Reports`) to `<DesktopOnlyNotice />` with the mandatory heading *"Please move to Desktop"* and quick "Copy Web Link" action.

---

## 🛠️ Project Structure

```text
VidyaOS-Mobile/
├── app/                          # Expo Router file-based routes
│   ├── (auth)/                   # Login, Registration, Forgot Password, Change Password
│   ├── (student)/                # Student Dashboard, Attendance, Classes, Assignments, Leave, Profile, etc.
│   ├── (faculty)/                # Faculty Dashboard, Registers, Live Session Studio, Student Roster, etc.
│   ├── (admin)/                  # Admin Master Dashboard, Faculty Directory, Academic Structure, Bug Triage, etc.
│   ├── desktop-only.tsx          # Desktop-only modal gate
│   ├── index.tsx                 # Root session hydration & role-based splash router
│   └── _layout.tsx               # Root layout, AuthProvider, StatusBar, and OfflineBanner
├── assets/                       # App icons, splash screens, and vector fonts
├── components/                   # Reusable UI component library
│   ├── common/                   # Button, Card, Badge, Input, EmptyState, ConfirmDialog, etc.
│   ├── DesktopOnlyNotice.tsx     # Standardized desktop migration notice
│   ├── NotificationsList.tsx     # Cross-role in-app notification feed
│   └── OfflineBanner.tsx         # Cold-start resilient network status banner
├── constants/                    # Theme design tokens, spacing, radii, typography, and API config
├── context/                      # AuthContext and session state manager
├── hooks/                        # useAuth, useNotifications, and responsive hooks
├── services/                     # Domain API services
│   ├── api.ts                    # Central API client with token injection & 401 refresh
│   ├── authService.ts            # Authentication, registration, and session sync
│   ├── studentService.ts         # Student attendance, classes, assignments, and scores
│   ├── facultyService.ts         # Teaching groups, live attendance sessions, and grading
│   ├── adminService.ts           # Master institutional statistics, faculty, and gates
│   ├── bugReportService.ts       # Technical complaints and multipart screenshot uploads
│   ├── notificationService.ts    # Unread counter and notification feed
│   └── secureStore.ts            # Hardware-backed SecureStore adapter
├── types/                        # TypeScript type definitions for all domain entities
├── app.json                      # Expo application manifest, package name, and permissions
├── eas.json                      # EAS Build profiles (development, preview APK, production AAB)
└── package.json                  # Dependencies and npm scripts
```

---

## ⚙️ Environment Configuration

Configuration is managed via `.env` using Expo's public environment variables (`EXPO_PUBLIC_*`).

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Configure target backend:
   ```env
   # Production Cloud Backend (Render)
   EXPO_PUBLIC_API_URL=https://vidyaos-backend.onrender.com/api/v1
   EXPO_PUBLIC_UPLOADS_URL=https://vidyaos-backend.onrender.com/uploads
   EXPO_PUBLIC_WEB_URL=https://vidya-os.vercel.app

   # Institution Branding
   EXPO_PUBLIC_INSTITUTION_NAME=Government Polytechnic Nainital
   EXPO_PUBLIC_APP_VERSION=1.0.0
   ```

*Note: For local Wi-Fi testing, set `EXPO_PUBLIC_API_URL=http://<YOUR_LOCAL_IP>:3000/api/v1`.*

---

## 📱 Running & Testing Locally

### 1. Start Metro Bundler
```bash
npm start
# or
npx expo start -c
```
- Press `a` to open in an Android Emulator.
- Or scan the displayed QR code using the **Expo Go** app on your physical Android phone (ensure phone and PC are connected to the same Wi-Fi network).

### 2. Verify TypeScript Compilation
```bash
npm run typecheck
# or
npx tsc --noEmit
```

### 3. Verify Project Health with Expo Doctor
```bash
npm run doctor
# or
npx expo-doctor
```

---

## 📦 Building Android Packages (APK & AAB)

We use **EAS (Expo Application Services)** configured in `eas.json` for cloud and local builds.

### Prerequisites:
1. Install EAS CLI globally (if not already installed):
   ```bash
   npm install -g eas-cli
   ```
2. Log in to your Expo account:
   ```bash
   eas login
   ```
3. Initialize/link the project:
   ```bash
   eas project:init
   ```

---

### Option A: Build Standalone Android APK (Direct Phone Sideloading)
The `preview` profile generates a standalone `.apk` file that you can install directly on any Android device without Google Play Store:

```powershell
npm run build:apk
# or via direct PowerShell command:
$env:EAS_NO_VCS = "1"; eas build -p android --profile preview
```
- EAS will compile the Android APK in the cloud.
- Once finished, it provides a direct download link and QR code to install the APK on your phone.

---

### Option B: Build Google Play Store AAB (Production Android App Bundle)
The `production` profile generates an optimized `.aab` (Android App Bundle) ready for upload to the Google Play Console:

```powershell
npm run build:aab
# or via direct PowerShell command:
$env:EAS_NO_VCS = "1"; eas build -p android --profile production
```
- Generates a signed `.aab` file complying with all Google Play Store 64-bit and Target SDK requirements.

---

### Option C: Local Android APK Build (Without Cloud Queue)
If you have Android Studio, JDK 17, and the Android SDK installed locally on your PC:

```bash
eas build -p android --profile preview --local
```

---

## 🔒 Security & Compliance

- **Package Identifier**: `com.vidyaos.app`
- **Target OS**: Android 13+ (API 33+) backward compatible to Android 8.0 (API 26+)
- **Minimal System Permissions**:
  - `CAMERA`: Required solely for scanning Attendance QR codes in the classroom.
  - `READ_EXTERNAL_STORAGE` / `WRITE_EXTERNAL_STORAGE`: Required for submitting assignment PDFs and attaching bug report screenshots.
- **Zero Push Notification / FCM Bloat**: Utilizes lean in-app reactive polling to preserve battery life and eliminate heavy external service dependencies.

