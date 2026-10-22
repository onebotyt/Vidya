# 🏛️ Vidya — Project Overview & Architecture Guide

## 1. Executive Summary

**Vidya** is an enterprise-grade, full-stack institutional campus operating system and attendance management platform. Built to modernize and replace paper registers and fragmented spreadsheets, Vidya digitizes academic governance, student attendance tracking, coursework submissions, examination grading, student lifecycle progression, and IoT biometric terminal synchronization for polytechnic colleges and universities.

### Key Capabilities
- **Dual Attendance Modalities**:
  - **Day 1–31 Matrix Ledger**: High-density physical register view with one-click toggles, batch markers, remarks, and Excel-compatible exports.
  - **Live Roll Call Studio**: Real-time concurrent dynamic QR codes, rotating 6-digit PIN codes, and a live student check-in feed.
  - **ESP32 Biometric Hardware Synchronization**: Native integration with classroom touch-screen biometric terminals mapped to student enrollment numbers.
- **Academic Governance & Delegation**:
  - Complete multi-tier hierarchy: System Administrator ➔ Head of Department (HOD) ➔ Class Teacher ➔ Subject Faculty ➔ Enrolled Student.
- **Autonomous Lifecycle Engine**:
  - Academic year switching, term transitions (ODD/EVEN semesters), automated batch semester promotions, demotion reversal safety gates, and alumni archiving.
- **Curriculum & Evaluation**:
  - IRDT syllabus mapping, course files, internal evaluation marksheets with dynamic grade recalculations, and scoped assignment dropboxes.

---

## 2. Technology Stack

Vidya leverages a modern, decoupled, zero-build architecture prioritizing performance, instant cold starts, and resilience.

```
┌────────────────────────────────────────────────────────────────────────┐
│                          Vidya Architecture                            │
├────────────────────────────┬───────────────────────────────────────────┤
│ Frontend (Zero-Build CDN)  │ Backend (Modular 3-Tier MVC)              │
│                            │                                           │
│ • HTML5 Semantic Structure │ • Node.js (v20+) & Express 4.x            │
│ • Pure Vanilla CSS3 Tokens │ • Models (Pure Data Access / SQL queries) │
│ • Vanilla Modular ES6 JS   │ • Controllers (Request Orchestration)     │
│ • Shared Design Tokens     │ • Routes (Declarative REST Endpoints)     │
│ • Dynamic Responsive Glass │ • Built-in SQLite (DatabaseSync Engine)   │
│ • Theme Engine (Dark/Light)│ • MySQL 8.x (Dual-Engine Production Ready)│
└────────────────────────────┴───────────────────────────────────────────┘
```

### Backend Components
- **Runtime**: Node.js v20+ / v22+ with ESM and CommonJS support.
- **Framework**: Express.js with granular route-level middleware chains.
- **Database Engine**:
  - **Local Development / Embedded**: High-performance SQLite3 using Node's native synchronous DatabaseSync interface with Write-Ahead Logging (WAL).
  - **Production Deployment**: Dual-compatible with MySQL 8.x via connection pooling (`mysql2`).
- **Security & RBAC**:
  - JWT (JSON Web Tokens) with 7-day expiration and session tracking in `user_sessions`.
  - BCrypt password hashing (12 salt rounds).
  - Fine-grained role guards: `requireHOD()`, `requireClassTeacher()`, `requireSubjects()`.

### Frontend Components
- **Framework-Free Simplicity**: Pure HTML5, modern CSS3, and ES6+ JavaScript. No complex bundling or compilation step required (zero `npm run build` latency).
- **Theme Token Integrity**: 100% tokenized color palette defined in `variables.css` (`var(--bg-app)`, `var(--text-main)`, `var(--color-primary)`, `var(--border-color)`). No hardcoded hex values. Supports instantaneous light/dark theme toggles.
- **Shared Assets**: Centralized asset directory (`frontend/shared/{js,css}/`) aliased in Express to guarantee consistent UI across student, teacher, and administrator portals.

---

## 3. The 3-Tier MVC Architectural Pattern

Vidya follows a strict separation of concerns across Models, Controllers, and Routes with **100% bidirectional code traceability**.

```
  [ HTTP Client (Browser / Mobile / ESP32) ]
                      │
                      ▼ (HTTP Request with JWT Bearer Token)
  ┌─────────────────────────────────────────────────────────┐
  │ 1. Routes Layer (/backend/src/routes/*.js)               │
  │    • Declarative endpoint definitions                   │
  │    • Role authentication & RBAC middleware               │
  │    • express-validator input validation chains          │
  └──────────────────────────┬──────────────────────────────┘
                             │
                             ▼ (Clean, validated request)
  ┌─────────────────────────────────────────────────────────┐
  │ 2. Controllers Layer (/backend/src/controllers/*.js)     │
  │    • HTTP status codes & standard JSON payloads         │
  │    • Business workflow coordination                     │
  │    • Notification & Audit logging triggers              │
  └──────────────────────────┬──────────────────────────────┘
                             │
                             ▼ (Typed parameters)
  ┌─────────────────────────────────────────────────────────┐
  │ 3. Models Layer (/backend/src/models/*.js)              │
  │    • Pure data access & parameter-sanitized SQL queries │
  │    • Multi-table atomic database transactions           │
  │    • Zero HTTP or Express dependencies                  │
  └──────────────────────────┬──────────────────────────────┘
                             │
                             ▼
  ┌─────────────────────────────────────────────────────────┐
  │ Database Storage Engine (SQLite3 / MySQL)               │
  └─────────────────────────────────────────────────────────┘
```

### Traceability Schema
Every file in the backend maintains standardized JSDoc annotations connecting all three layers:
- **Models**: State what controller calls them and what HTTP route triggers them (`@calledBy`, `@route`).
- **Controllers**: Document HTTP method, path, RBAC authorization, models invoked, and services triggered (`@route`, `@access`, `@usesModel`, `@usesService`).
- **Routes**: Document route, description, access privileges, and the full delegation chain (`@route`, `@desc`, `@access`, `@handler`).

---

## 4. Architectural Invariants

To maintain long-term stability and code quality, the system adheres to strict architectural invariants:

1. **Theme Token Invariant**:
   - Every stylesheet and inline style must reference CSS variables from `frontend/shared/css/variables.css`. Hardcoded color strings (`#ffffff`, `rgb(...)`) are strictly prohibited and verified by automated regression test suites.
2. **SQLite Compatibility Invariant**:
   - The primary development engine is SQLite3. Dialect-specific functions (e.g. `TIMESTAMPDIFF`, `NOW()`, `DATE_SUB`) are emulated in `backend/src/config/db.js` so that the codebase runs identically in both local SQLite and production MySQL environments.
3. **Consolidated Register Architecture**:
   - All teacher workflows (Attendance Matrix, Coursework/Assignments, Class Tests/Marksheets, and Live QR/PIN studio) are consolidated into `/faculty/registers.html` with permanent 301 redirects for obsolete URLs to eliminate redundant interfaces.
4. **Zero Test Code in Production Git**:
   - Local verification suites (`scripts/test-*.js`) and test screenshots are strictly development tools tracked only locally, keeping the production Git repository and distribution packages lightweight and clean.
