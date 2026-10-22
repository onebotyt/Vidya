# 🎓 Vidya — Institutional Campus Operating & Attendance Management System

[![Node.js](https://img.shields.io/badge/Node.js-20%2B-339933?style=flat-square&logo=node.js)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.x-000000?style=flat-square&logo=express)](https://expressjs.com/)
[![SQLite](https://img.shields.io/badge/SQLite-Local_Dev-003B57?style=flat-square&logo=sqlite)](https://sqlite.org/)
[![MySQL](https://img.shields.io/badge/MySQL-Production_Ready-4479A1?style=flat-square&logo=mysql)](https://mysql.com/)
[![HTML5 / CSS3](https://img.shields.io/badge/Frontend-Vanilla_HTML5%20%2F%20CSS3-E34F26?style=flat-square&logo=html5)](https://developer.mozilla.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=flat-square&logo=docker)](https://www.docker.com/)

**Vidya** is a production-grade, full-stack institutional campus operating system and attendance management platform. Built for colleges and polytechnic institutions (following the **IRDT Uttarakhand** academic framework), Vidya replaces fragmented paper registers and spreadsheets with a unified, high-performance web platform.

---

## 📚 Detailed Documentation Directory

Comprehensive, in-depth documentation is available under [`docs/`](docs/):

| Document | Description |
|:---|:---|
| **[01. Project Overview & Architecture](docs/01_PROJECT_OVERVIEW_AND_ARCHITECTURE.md)** | System design, clean 3-tier MVC architecture, technology stack, and architectural invariants. |
| **[02. User Roles & System Workflows](docs/02_USER_ROLES_AND_WORKFLOWS.md)** | Granular RBAC hierarchy (Admin, HOD, Teacher, Class Teacher, Student), step-by-step user journeys, and lifecycle progression. |
| **[03. REST API & Endpoints Directory](docs/03_API_DOCUMENTATION_AND_ENDPOINTS.md)** | Complete catalog of all 17 backend modules with endpoints, methods, parameters, and response schemas. |
| **[04. Database Schema & Data Models](docs/04_DATABASE_SCHEMA_AND_MODELS.md)** | Full entity-relationship diagrams (ERD), table catalog (25+ tables), foreign keys, and indexes. |
| **[05. Hardware IoT ESP32 Integration](docs/05_HARDWARE_IOT_ESP32_INTEGRATION.md)** | Classroom touch-screen biometric fingerprint terminal architecture, heartbeat protocol, and offline scan ring buffer. |
| **[06. Deployment & MySQL Migration Guide](docs/06_DEPLOYMENT_AND_MYSQL_MIGRATION_GUIDE.md)** | Step-by-step guide for moving from local SQLite to production MySQL on cloud VPS, cPanel, or Docker. |

---

## 🏛️ Core Architectural Highlights

1. **Clean 3-Tier MVC Architecture**:
   - Strict separation between **Models** (`src/models/`), **Controllers** (`src/controllers/`), and **Routes** (`src/routes/`).
   - 100% bidirectional code traceability across all 17 backend modules with standardized JSDoc docblocks.
2. **Dual-Engine Database Layer**:
   - **Local Development**: Native synchronous SQLite3 (`DatabaseSync`) with Write-Ahead Logging (WAL) for zero-setup, instant cold starts.
   - **Production Deployment**: Dual-compatible with **MySQL 8.x / MariaDB** via connection pooling (`mysql2`). Seamlessly toggle via `DB_CLIENT=sqlite` or `DB_CLIENT=mysql` in `.env`.
3. **Consolidated Register Architecture (`/faculty/registers.html`)**:
   - **Tab 1: Physical Day 1–31 Attendance Ledger** with one-click status toggles, batch markers, remarks, and Excel export.
   - **Tab 2: Coursework & Assignments** with scoped file upload dropboxes and grading.
   - **Tab 3: Class Tests & Marksheets Studio** with an interactive marks roster, keyboard arrow navigation, and validation clamping.
   - **Dual Live Roll Call Studio (`#manual-roll-modal`)**: Concurrent dynamic QR code, rotating 6-digit PIN code, and real-time student check-in log.
4. **Touch-Screen Biometric Terminal Integration (ESP32)**:
   - Hardware terminal communication reporting student fingerprint scans, liveness heartbeats, and offline sync buffers.
5. **Universal Design System (100% Theme Token Integrity)**:
   - Pure semantic CSS variables in `variables.css`. Zero hardcoded hex colors. Instant, seamless light/dark theme switching.

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js**: v20.0.0 or higher (v22 LTS recommended)
- **npm**: v9.0.0 or higher
- Embedded SQLite3 (pre-installed in Node) or MySQL 8.x (for production)

### 1. Installation
```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install
```

### 2. Environment Configuration
```bash
# Copy example environment configuration
cp .env.example .env
```
Default `.env` settings (for local development with SQLite):
```env
PORT=3000
NODE_ENV=development
DB_CLIENT=sqlite
SQLITE_FILE=college_attendance.sqlite
JWT_SECRET=super-secure-jwt-secret-college-attendance-2026-key
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:3000
```

### 3. Start the Server
```bash
node server.js
```
The server will initialize the database and launch on:
👉 **`http://localhost:3000`**

---

## 🔐 Default Demo Accounts

All demo accounts share the password: **`Admin@123`** (for Administrator) or **`Password@123`** (for HOD, Faculty, and Students).

| Role | Username / Email | Password | Landing Page |
|:---|:---|:---|:---|
| **System Administrator** | `admin` | `Admin@123` | `/admin/academic-structure.html` |
| **HOD (Information Tech)** | `hod.it@college.edu` | `Password@123` | `/faculty/hod-dashboard.html` |
| **HOD (Civil Engineering)** | `hod.ce@college.edu` | `Password@123` | `/faculty/hod-dashboard.html` |
| **Faculty / Class Teacher** | `prof.sharma@college.edu` | `Password@123` | `/faculty/registers.html` |
| **Faculty / Class Teacher** | `prof.patel@college.edu` | `Password@123` | `/faculty/registers.html` |
| **Student** | `student.it01@college.edu` | `Password@123` | `/student/dashboard.html` |

---

## 🧪 Automated Verification Test Suite

Run these automated verification suites from `backend/` to validate the installation:

```bash
cd backend
node scripts/test-api-flows.js                 # 25/25 PASS (Core API integration flows)
node scripts/test-rbac-and-structure.js         # 30/30 PASS (RBAC guards & permanent redirects)
node scripts/test-register-consolidation.js     # 46/46 PASS (Registers, tabs, modals, drawer)
node scripts/test-theme-support.js              # 93/93 PASS (Theme token integrity, 0 hardcoded colors)
node scripts/test-student-self-registration.js   # 30/30 PASS (Student self-registration & approvals)
```

---

## 📦 Project Directory Structure

```
Attendance-System-Simplified/
├── docs/                                # In-depth architectural & deployment guides
│   ├── 01_PROJECT_OVERVIEW_AND_ARCHITECTURE.md
│   ├── 02_USER_ROLES_AND_WORKFLOWS.md
│   ├── 03_API_DOCUMENTATION_AND_ENDPOINTS.md
│   ├── 04_DATABASE_SCHEMA_AND_MODELS.md
│   ├── 05_HARDWARE_IOT_ESP32_INTEGRATION.md
│   └── 06_DEPLOYMENT_AND_MYSQL_MIGRATION_GUIDE.md
├── frontend/                            # Zero-build HTML5/CSS3/Modular JS client
│   ├── admin/                           # System Administrator portal
│   ├── faculty/                         # Faculty & HOD portal (Registers, Dashboard)
│   ├── student/                         # Student self-service portal
│   └── shared/                          # Unified CSS design tokens & modular JS auth
├── backend/                             # Express REST API Server
│   ├── src/
│   │   ├── models/                      # Pure data access & SQL queries (16 models)
│   │   ├── controllers/                 # Request coordinators & response envelopes (17 controllers)
│   │   ├── routes/                      # Declarative Express REST endpoints (17 routers)
│   │   ├── middleware/                  # Granular RBAC guards (auth, requireScope, validate)
│   │   ├── services/                    # Business services (audit, notifications, promotion)
│   │   └── config/                      # Dual database adapter (SQLite / MySQL)
│   ├── database/                        # Migration dumps & MySQL production scripts
│   ├── scripts/                         # Verification & testing suites
│   ├── server.js                        # Express server entry point
│   ├── package.json
│   └── .env.example
├── Dockerfile                           # Container definition
├── docker-compose.yml                   # Multi-container orchestration
└── README.md
```

---

## 📄 License & Attribution
Vidya Campus Operating System © 2026. Designed for institutional education deployment.
