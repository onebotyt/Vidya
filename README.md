# VidyaOS — Institutional Campus & Academic Operating System

VidyaOS is a complete, production-ready institutional operating system for colleges and universities, encompassing full-stack academic operations, attendance management, course files, and IoT biometric integration.

---

## 🏛️ Ecosystem Architecture

```
VidyaOS/
├── frontend/                              # Modern Vanilla JS / HTML5 / CSS3 Responsive UI
│   ├── admin/                             # Administrative consoles (Academic structure, faculty, audit)
│   ├── faculty/                           # Faculty suite (Consolidated registers, NBA, assessments)
│   ├── student/                           # Student portal (Attendance, scores, timetable, leave)
│   ├── login/                             # Unified authentication & onboarding
│   └── server.js                          # Express frontend reverse-proxy & static server
│
├── backend/                               # High-Performance Node.js / Express / MySQL 8.x Engine
│   ├── src/                               # Controllers, models, services, RBAC middlewares, routes
│   ├── database/                          # Production cPanel MySQL schemas & migrations (001-008)
│   ├── uploads/                           # Document storage & syllabus archives
│   └── server.js                          # Production API server (Port 3000)
│
└── VidyaOS_ESP32_Biometric_Firmware/
    └── VidyaOS_ESP32_Biometric_Node/      # ESP32 AS608 Biometric Node & Presence Engine
        ├── VidyaOS_ESP32_Biometric_Node.ino # Arduino/C++ firmware
        ├── as608_driver.h                 # Optical fingerprint sensor driver
        ├── crypto_aes_gcm.h               # Hardware-accelerated AES-GCM encryption
        └── HARDWARE_WIRING_AND_PROTOCOL.md # Pinouts, schematics, and MQTT/HTTP protocol
```

---

## 🚀 Quick Start

### 1. Backend Server
```bash
cd backend
npm install
node server.js
```
*API runs on `http://localhost:3000`.*

### 2. Frontend Server
```bash
cd frontend
npm install
node server.js
```
*Frontend runs on `http://localhost:5000` (reverse proxies `/api` to port 3000).*

### 3. ESP32 Biometric Node
Open `VidyaOS_ESP32_Biometric_Firmware/VidyaOS_ESP32_Biometric_Node` in PlatformIO or Arduino IDE, configure Wi-Fi and server endpoints in `config.h`, and flash to the ESP32 board.

---

## 🔐 Default Demo Accounts
All demo accounts use password: `Admin@123` (Admin) or `Password@123` (Faculty & Students).

- **System Admin**: `admin`
- **HOD (IT Dept)**: `hod.it@college.edu`
- **Faculty**: `prof.sharma@college.edu`
- **Student**: `student.it01@college.edu`

---

## 📱 Mobile & 💻 Desktop Applications

The exact same responsive website codebase in `frontend/` powers:
1. **Web Application**: Responsive desktop and mobile browsers.
2. **Mobile Application (Android APK / AAB)**: Packaged with Capacitor (`capacitor.config.json` + `mobile-bridge.js`).
3. **Desktop Application (Windows .exe / macOS .dmg / Linux .deb)**: Packaged with Tauri (`src-tauri/` Rust WebView2 wrapper).

📖 Read the complete step-by-step build & packaging guide: **[MOBILE_AND_DESKTOP_DEPLOYMENT_GUIDE.md](MOBILE_AND_DESKTOP_DEPLOYMENT_GUIDE.md)**.

---

## 🧭 UI Memory Map & Contract Documentation

VidyaOS includes a deterministic machine-readable UI manifest and contract map system:
- **UI Memory Map Index**: `docs/ui-map/README.md`
- **Page Directory (42 registered views)**: `docs/ui-map/pages.md`
- **Shared Components & Design Tokens**: `docs/ui-map/components.md`
- **Navigation & Workflow State Machine**: `docs/ui-map/flows.mmd`
- **Machine-Readable Manifests (33 master pages)**: `docs/ui-map/manifests/*.json` & `docs/ui-map/manifests/manifest-index.json`
- **Complete Frontend UI Guide**: `docs/frontend-complete-ui-guide.md`
- **Student Records & Classroom Architecture**: `SYSTEM_ARCHITECTURE_STUDENT_RECORDS_AND_CLASSROOM.md`

Verify manifest parity at any time:
```bash
cd backend
node scripts/extract-ui-manifest.js
node scripts/test-ui-manifest-sync.js
```

---

## 👥 Contributors & Collaboration

- **Lead Architect (Dev 1)**: [@onebotyt](https://github.com/onebotyt)
- **Contributor (Dev 2)**: [@AkashK-Repo](https://github.com/AkashK-Repo)
- **Contributor (Dev 3)**: [@onebotyt-mobile](https://github.com/onebotyt-mobile) (Full-Stack & Mobile via Mobile Antigravity CLI)
- **Contributor (Dev 4)**: [@Surendra-singh885](https://github.com/Surendra-singh885)

---

## 🤝 4-Developer Git Collaboration Workflow

When working simultaneously across the repository ecosystem:

1. **Always Pull Before Coding**:
   ```powershell
   powershell -ExecutionPolicy Bypass -File .\pull-all.ps1
   ```
2. **Create a Scoped Feature Branch**:
   ```powershell
   powershell -ExecutionPolicy Bypass -File .\new-feature.ps1 -BranchName dev<2|3|4>/<feature-name>
   ```
3. **Commit & Push for Pull Request Review**:
   ```powershell
   powershell -ExecutionPolicy Bypass -File .\push-feature.ps1 -Message "feat: description of work"
   ```
4. Read the complete setup and anti-collision guidelines in [MULTI_DEVELOPER_SETUP.md](MULTI_DEVELOPER_SETUP.md).

---

## 📄 License
ISC License. Built for modern academic institutions.
