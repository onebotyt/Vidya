# VidyaOS — Institutional Campus & Academic Operating System

VidyaOS is a complete, production-ready institutional operating system for colleges and universities, encompassing full-stack academic operations, attendance management, course files, and IoT biometric integration.

---

## 🏛️ Ecosystem Architecture

```
VidyaOS/
├── VidyaOS-Frontend-patched/
│   └── VidyaOS-main/                      # Modern Vanilla JS / HTML5 / CSS3 Responsive UI
│       ├── admin/                         # Administrative consoles (Academic structure, faculty, audit)
│       ├── faculty/                       # Faculty suite (Consolidated registers, NBA, assessments)
│       ├── student/                       # Student portal (Attendance, scores, timetable, leave)
│       ├── login/                         # Unified authentication & onboarding
│       └── server.js                      # Express frontend reverse-proxy & static server
│
├── VidyaOS_BackEnd-patched/
│   └── VidyaOS_BackEnd-main/              # High-Performance Node.js / Express / MySQL 8.x Engine
│       ├── src/                           # Controllers, models, services, RBAC middlewares, routes
│       ├── database/                      # Production cPanel MySQL schemas & migrations (001-008)
│       ├── uploads/                       # Document storage & syllabus archives
│       └── server.js                      # Production API server (Port 3000)
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
cd VidyaOS_BackEnd-patched/VidyaOS_BackEnd-main
npm install
npm start
```
*API runs on `http://localhost:3000`.*

### 2. Frontend Server
```bash
cd VidyaOS-Frontend-patched/VidyaOS-main
npm install
npm start
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

## 📄 License
ISC License. Built for modern academic institutions.
