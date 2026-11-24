# VidyaOS: Mobile & Desktop Applications Architecture & Deployment Guide

> **Scope**: This document explains how the unified **VidyaOS** website codebase (`frontend/`) powers the **Web Application**, the native **Mobile Application (Android APK / AAB)** via Capacitor, and the native **Desktop Application (Windows / macOS / Linux)** via Tauri.

---

## 🏛️ 1. Architecture Overview: Single Codebase, Multi-Platform

VidyaOS is architected with a **Zero-Build-Step, High-Performance Vanilla Web Architecture** (HTML5, Modern CSS Variables, Modular Vanilla ES6+ JavaScript). 

Instead of maintaining separate frontends for web, mobile, and desktop, the exact same responsive website codebase powers all three platforms:

```
                          ┌─────────────────────────────┐
                          │   VidyaOS Frontend Core     │
                          │   (frontend/ website part)  │
                          └──────────────┬──────────────┘
                                         │
        ┌────────────────────────────────┼────────────────────────────────┐
        ▼                                ▼                                ▼
┌───────────────┐              ┌───────────────────┐            ┌───────────────────┐
│   Web App     │              │  Mobile App (APK) │            │   Desktop App     │
│   (Browsers)  │              │   (Capacitor)     │            │     (Tauri)       │
├───────────────┤              ├───────────────────┤            ├───────────────────┤
│ • Chrome / Edge│             │ • Android APK/AAB │            │ • Windows .exe/.msi│
│ • Safari/Mobile│             │ • Offline Caching │            │ • macOS .dmg      │
│ • Desktop View│              │ • Status Bar Dark │            │ • Linux .deb      │
│ • Mobile View │              │ • OTA Live Sync   │            │ • Embedded WebKit │
└───────────────┘              └───────────────────┘            └───────────────────┘
```

---

## 📱 2. Mobile Application (Android via Capacitor)

VidyaOS packages into a high-performance native Android application using **@capacitor/core** and **@capacitor/android**.

### A. Key Mobile Configuration Files
1. **`capacitor.config.json`**:
   - `appId`: `com.vidyaos.app`
   - `appName`: `VidyaOS`
   - `webDir`: `www` (staging directory containing bundled frontend web assets)
   - `server.url`: Configured with fallback live cloud endpoint for instant Over-The-Air (OTA) updates without requiring full Play Store APK rebuilds.
   - `server.cleartext`: Enabled for local development with HTTP backend endpoints.
   - `StatusBar`: Dark high-contrast styling (`#07153e`) with `overlaysWebView: false` for edge-to-edge status bar safety.

2. **`mobile-bridge.js`**:
   - Injected into every HTML entry point during the build preparation.
   - Detects when running within the native Android WebView (`window.Capacitor.isNativePlatform()`).
   - Automatically intercepts API calls to route through native HTTP or configure local token storage.
   - Synchronizes app versioning (`app-version.json`) with native build codes.

3. **Responsive Mobile-First Viewport & CSS Tokens**:
   - Every page header includes `<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">`.
   - Dynamic touch chip bars, swipe-friendly navigation, and auto-collapsing 72px sidebar mini-rails into a smooth slide-out drawer on devices $\le 768\text{px}$.
   - 100% theme-token compliant (`var(--bg-primary)`, `var(--text-main)`, etc.) guaranteeing zero visual glitches in dark/light mode.

### B. How to Build & Package the Android Mobile App

#### Prerequisites:
- **Node.js**: v18+ or v20+
- **Android Studio**: Hedgehog / Iguana / Ladybug or newer
- **Java Development Kit (JDK)**: OpenJDK 17 or 21
- **Android SDK & Build Tools**: API Level 34 / 35 installed

#### Step-by-Step Instructions:

1. **Install Frontend Dependencies**:
   ```bash
   cd frontend
   npm install @capacitor/core @capacitor/cli @capacitor/android
   ```

2. **Prepare & Synchronize Assets (`www/`)**:
   Run the automated preparation script which bundles all website assets and injects the native bridge:
   ```bash
   node scripts/prepare-mobile.js
   ```
   *(This copies `admin/`, `faculty/`, `student/`, `login/`, `landing/`, `shared/`, `images/`, and assets into `www/` and injects `mobile-bridge.js`)*.

3. **Initialize & Sync Android Project**:
   ```bash
   npx cap add android   # (Run only once if android/ folder does not exist)
   npx cap sync android  # Copies www/ assets into android/app/src/main/assets/public/
   ```

4. **Build APK / Run in Emulator / Flash Device**:
   - **Via Android Studio GUI**:
     ```bash
     npx cap open android
     ```
     In Android Studio, click **Build > Build Bundle(s) / APK(s) > Build APK(s)**, or click **Run ▶** to test on an emulator or plugged-in physical Android device.
   - **Via Command Line (Automated CI/CD)**:
     ```bash
     cd android
     ./gradlew assembleDebug      # Produces app-debug.apk in app/build/outputs/apk/debug/
     ./gradlew bundleRelease      # Produces production .aab for Google Play Console
     ```

---

## 💻 3. Desktop Application (Windows, macOS, Linux via Tauri)

VidyaOS provides an ultra-lightweight desktop application wrapper using **Tauri v1/v2** (Rust + OS Native WebView: WebView2 on Windows, WebKitGTK on Linux, WKWebView on macOS).

### A. Why Tauri Over Electron?
- **Resource Footprint**: Typical Electron apps bundle a complete 150MB Chromium binary and consume 300MB+ RAM on idle.
- **Tauri Advantage**: The VidyaOS Tauri desktop binary is under **15 MB** and consumes less than **40 MB RAM**, utilizing the existing native Windows WebView2 runtime.

### B. Desktop Configuration (`src-tauri/tauri.conf.json`)
- `productName`: `VidyaOS`
- `identifier`: `com.vidyaos.desktop`
- `windows`:
  - `title`: `VidyaOS Academic Suite`
  - `width`: 1280, `height`: 800 (minimum 900x600)
  - `resizable`: true, `center`: true
- `build`:
  - `devPath`: `http://localhost:5000` (live hot-reload during development)
  - `distDir`: `../` (reads the standalone website root directly)

### C. How to Build & Package the Desktop Application

#### Prerequisites:
- **Rust Toolchain**: Install via [rustup.rs](https://rustup.rs/) (`rustc` and `cargo` installed).
- **Windows**: Microsoft Visual Studio C++ Build Tools & Microsoft Edge WebView2 (pre-installed on Windows 10/11).
- **Linux**: `libwebkit2gtk-4.0-dev`, `build-essential`, `curl`, `wget`, `file`, `libssl-dev`, `libgtk-3-dev`.
- **macOS**: Xcode Command Line Tools.

#### Step-by-Step Instructions:

1. **Install Tauri CLI**:
   ```bash
   npm install -D @tauri-apps/cli
   ```

2. **Run in Desktop Development Mode (Hot-Reload)**:
   ```bash
   # Terminal 1: Start frontend static server
   cd frontend
   node server.js

   # Terminal 2: Launch Tauri native desktop window
   cd frontend
   npx tauri dev
   ```

3. **Build Production Desktop Executable / Installer**:
   ```bash
   cd frontend
   npx tauri build
   ```
   **Output Artifacts**:
   - **Windows**: `src-tauri/target/release/bundle/msi/VidyaOS_1.0.0_x64_en-US.msi` and standalone `.exe`.
   - **macOS**: `src-tauri/target/release/bundle/dmg/VidyaOS_1.0.0_x64.dmg` or Apple Silicon `.dmg`.
   - **Linux**: `src-tauri/target/release/bundle/deb/vidyaos_1.0.0_amd64.deb` and `.AppImage`.

---

## 🌐 4. Running the Web Application (Browser & Server)

### A. Starting Backend API Server
```bash
cd backend
npm install
node server.js
```
Runs by default on `http://localhost:3000`.
- Connects to MySQL 8.x database configured in `.env`.
- Database schemas and numbered migrations located in `backend/database/`.

### B. Starting Frontend Web Server
```bash
cd frontend
node server.js
```
Runs by default on `http://localhost:5000`.
- Automatically proxies `/api/v1/*` requests to the local backend port 3000 (or cloud fallback).
- Automatically serves clean URLs (e.g. `/faculty/classes` resolves to `/faculty/classes/index.html`).
- Provides instant server-side HTTP 301 permanent redirects for all legacy routes to consolidated dynamic modules (such as `/faculty/course-file/index.html?type=...`).

---

## 🧭 5. UI Memory Map & Architectural Synchronization

VidyaOS features a deterministic **UI Memory Map System (UIMS)** located under `docs/ui-map/`:
- **`manifest-index.json`**: Machine-readable catalog of all 33 master pages.
- **`manifests/<page-id>.json`**: Detailed catalog of all 855 action buttons, 203 modal dialogs, 407 inputs, and 301 backend API endpoints.
- **`pages.md` & `components.md`**: Human-readable UI source of truth, responsive behavior, and shared component specifications.
- **`flows.mmd`**: Complete Mermaid workflow diagram for System Admin, Department HOD, Faculty, and Student navigation.
- **Verification Commands**:
  ```bash
  cd backend
  node scripts/extract-ui-manifest.js   # Re-scans frontend and regenerates manifests
  node scripts/test-ui-manifest-sync.js  # Verifies 100% SHA256 DOM & manifest parity
  ```
