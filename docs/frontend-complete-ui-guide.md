# VidyaOS Frontend Architecture & Comprehensive UI Element Specification Manual

> **Institutional Operating System**: VidyaOS (Academic Campus, Biometric IoT & Classroom OS)
> **Standard**: Uttarakhand Board of Technical Education (UBTER) & Polytechnic Engineering Standard
> **Authoritative UI Map**: `docs/ui-map/` (Automated UI Manifest & Contract System — UIMS)
> **Total Pages Documented**: 32 Distinct Institutional Pages across 5 Domain Portals
> **Total Elements Cataloged**: 758 Action Buttons, 181 Modals, 389 Form Inputs, 270 Backend API Contracts

---

## 🏛️ Executive Summary & Core Architectural Invariants

VidyaOS is a production-grade institutional campus and academic operating system. The frontend is built on **Vanilla HTML5, Modern CSS3 (CSS Variables), and Modular ES6+ JavaScript** without build-time compilers or bundlers, ensuring instant updates, zero hydration delays, and seamless execution inside web browsers and Android Capacitor environments.

### 1. Theme Token Adherence (Zero Hardcoded Hex Colors)
Every stylesheet and HTML document uses CSS Custom Properties (Variables) defined in `shared/css/variables.css`. Direct hex colors (e.g. `#fff`, `#1e293b`) or raw `rgb()` values in inline styles are strictly prohibited and enforced via `test-theme-support.js`.

- `var(--bg-primary)`: Primary background for pages and main viewports.
- `var(--bg-surface)`: Elevated surfaces, cards, and modal dialogs.
- `var(--text-main)`: High-contrast body text and headers.
- `var(--text-muted)`: Subtle secondary captions, metadata, and timestamps.
- `var(--color-primary)`: Institutional accent (deep blue / indigo).
- `var(--status-present)` & `var(--status-present-bg)`: Green indicators for attendance presence (>=75%).
- `var(--status-absent)` & `var(--status-absent-bg)`: Red alerts for absences or defaulter thresholds (<75%).
- `var(--status-late)` & `var(--status-late-bg)`: Amber/yellow warnings for leave or pending statuses.
- `var(--border-color)`: Standard card, table, and input border token.

### 2. Institutional Standard: Ubiquitous UBTER Roll Number
Under UBTER standards, the 11-digit institutionally verified enrollment number (e.g., `24011090008`) is explicitly titled and displayed as **"UBTER Roll No."** or **"UBTER ROLL NO."** everywhere in the UI. Internal class rolls (`1`, `2`, `3`) are titled **"Roll No."** or **"Class Roll #"**, and the 8-digit UBTER registration ID (e.g., `24004335`) is titled **"UBTER Reg. No."**.

### 3. Role-Based Access Control (RBAC) & Route Guarding
All pages invoke client-side route guarding via `guardRoute({ roles: [...] })` from `shared/js/auth.js` prior to rendering. Session validity is asserted with local storage JWT tokens (`localStorage.getItem('token')`) and real-time heartbeat polling (`GET /api/v1/auth/heartbeat`).

---

## 🌐 1. Public & Authentication Entry Points (PUB)

*Public-facing entrance, single sign-on authentication, and student self-registration portals.*

### PUB-001: VidyaOS — Institutional Campus & Academic Operating System

- **URL Route**: `/ or /landing/`
- **Source File**: [frontend/landing/index.html](file:///e:/uiap/VidyaOS/frontend/landing/index.html)
- **Target Role**: `Public`
- **Shell & Styling**: Landing Shell (`variables.css`)
- **Responsive States**: Desktop: expansive hero showcase; Mobile: stacked feature cards with bottom login CTA

#### 🎯 Purpose & Academic Workflow
Institutional homepage, system features, login entrance

#### 🔘 Action Buttons & Interactive Controls (2 Cataloged)
| Button ID | Label / Text | Class / Variant | Action / Behavior |
| :--- | :--- | :--- | :--- |
| `#theme-toggle-btn` | Toggle Dark / Light Theme | `theme-toggle` | toggleTheme() |
| `#null` | Theme | `dock-btn` | toggleTheme() |

#### 📝 Form Inputs & Dropdown Selectors (0 Cataloged)
*No direct form inputs on this page; view-only or modal-driven input flow.*

#### 🪟 Modals, Dialogs & Drawers (0 Cataloged)
*No overlay modals on this page; all workflows occur inline or via full-page transitions.*

#### 📡 Backend REST API Contracts (1 Integrated)
| Method | Endpoint | Type | Purpose / Trigger |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/health` | `REST` | Core academic service call |

---

### PUB-002: VidyaOS | UGIP Nainital — Institutional Campus Operating System

- **URL Route**: `/login/`
- **Source File**: [frontend/login/index.html](file:///e:/uiap/VidyaOS/frontend/login/index.html)
- **Target Role**: `Public`
- **Shell & Styling**: Auth Shell (`login/index.css`)
- **Responsive States**: Desktop: centered card with brand illustration; Mobile: full-width card with numeric keypad support
- **URL Parameters**: `reason`, `preview`, `pending`, `google_pending`, `status`, `email`, `message`, `error`

#### 🎯 Purpose & Academic Workflow
Single sign-on portal, role redirection, multi-device warning

#### 🔘 Action Buttons & Interactive Controls (11 Cataloged)
| Button ID | Label / Text | Class / Variant | Action / Behavior |
| :--- | :--- | :--- | :--- |
| `#google-signin-btn` | Continue with Google | `google` | handleGoogleSignIn() |
| `#pw-toggle-btn` | Icon Button | `eye` | togglePw() |
| `#force-login-btn` | Disconnect Other Device &amp; Sign In Here | `btn-force` | submitForceLogin() |
| `#status-alert-close` | &times; | `status-alert-close` | document.getElementById( |
| `#submit-btn` | Sign In → | `signin` | Event handler bound |
| `#null` | Get Started | `m-btn-get-started` | showMobileLoginView() |
| `#null` | Go back | `m-back-circle-btn` | handleMobileBack() |
| `#m-togglePassword` | Icon Button | `m-toggle-eye-btn` | Event handler bound |
| `#m-submit-btn` | Login Now | `m-btn-login-now` | Event handler bound |
| `#m-google-btn` | Sign In with Google | `m-btn-google-signin` | handleGoogleSignIn() |
| `#act-submit-btn` | Save &amp; Enter Portal → | `signin` | Event handler bound |

#### 📝 Form Inputs & Dropdown Selectors (7 Cataloged)
| Control ID | Type | Name / Purpose | Placeholder / Options | Required |
| :--- | :--- | :--- | :--- | :--- |
| `#identifier` | `text` | identifier | `Enter Email, Phone or UBTER Roll No.` | No |
| `#password` | `password` | password | `Enter your password` | No |
| `#m-identifier` | `text` | identifier | `business.abineshjiro@gmail.com` | No |
| `#m-password` | `password` | password | `Password` | No |
| `#m-remember` | `checkbox` | Input | `None` | No |
| `#act-new-pw` | `password` | Input | `Create a strong password` | No |
| `#act-confirm-pw` | `password` | Input | `Re-enter your password` | No |

#### 🪟 Modals, Dialogs & Drawers (4 Cataloged)
##### Modal 1: `#activation-modal` — Modal Dialog
- **Container ID**: `#activation-modal`
- **Submit Action**: `Form submission`

##### Modal 2: `#act-title` — Modal Dialog
- **Container ID**: `#act-title`
- **Submit Action**: `Form submission`

##### Modal 3: `#act-name` — Modal Dialog
- **Container ID**: `#act-name`
- **Submit Action**: `Form submission`

##### Modal 4: `#act-email` — Modal Dialog
- **Container ID**: `#act-email`
- **Submit Action**: `Form submission`

#### 📡 Backend REST API Contracts (8 Integrated)
| Method | Endpoint | Type | Purpose / Trigger |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/health` | `REST` | Core academic service call |
| `GET` | `https://vidyaos-backend.onrender.com/api/v1/health` | `INTERNAL` | Core academic service call |
| `POST` | `https://vidyaos-backend.onrender.com/api/v1/health` | `INTERNAL` | Core academic service call |
| `POST` | `/api/v1/auth/change-password` | `REST` | Core academic service call |
| `GET` | `https://vidyaos-backend.onrender.com/api/v1/auth/google/url` | `INTERNAL` | Core academic service call |
| `POST` | `/api/v1/auth/google` | `REST` | Core academic service call |
| `GET` | `/api/v1/auth/branding` | `REST` | Core academic service call |
| `GET` | `/api/v1/admin/settings` | `REST` | Core academic service call |

---

### PUB-003: Register — VidyaOS Campus Management

- **URL Route**: `/login/register/`
- **Source File**: [frontend/login/register/index.html](file:///e:/uiap/VidyaOS/frontend/login/register/index.html)
- **Target Role**: `Public`
- **Shell & Styling**: Auth Shell (`register.css`)
- **Responsive States**: Desktop: guided 3-step card wizard; Mobile: full-screen step flow with sticky next button
- **URL Parameters**: `role`, `google_email`, `google_name`, `google_sub`

#### 🎯 Purpose & Academic Workflow
Student self-registration with branch/year onboarding

#### 🔘 Action Buttons & Interactive Controls (5 Cataloged)
| Button ID | Label / Text | Class / Variant | Action / Behavior |
| :--- | :--- | :--- | :--- |
| `#theme-toggle-btn` | Toggle dark mode | `btn-theme` | toggleTheme() |
| `#tab-student` | Student Registration | `rs-btn active` | Event handler bound |
| `#google-signup-btn` | Sign up with Google (Auto-Fill) | `btn-google-action` | initiateGoogleSignUp() |
| `#null` | Icon Button | `field-eye-btn` | togglePwVisibility( |
| `#stu-submit-btn` | Register Now → | `btn-submit` | Event handler bound |

#### 📝 Form Inputs & Dropdown Selectors (12 Cataloged)
| Control ID | Type | Name / Purpose | Placeholder / Options | Required |
| :--- | :--- | :--- | :--- | :--- |
| `#stu-name` | `text` | Input | `e.g. Aarav Sharma` | No |
| `#stu-email` | `email` | Input | `student@gmail.com` | No |
| `#stu-phone` | `tel` | Input | `10-digit mobile number` | No |
| `#chk-enroll-not-available` | `checkbox` | Input | `None` | No |
| `#stu-enroll` | `text` | Input | `11-digit numeric UBTER roll no` | No |
| `#stu-password` | `password` | Input | `Min. 8 characters` | No |
| `#stu-confirm` | `password` | Input | `Retype password` | No |
| `#stu-ubter` | `text` | Input | `e.g. 24101054` | No |
| `#stu-class-roll-no` | `text` | Input | `e.g. 15` | No |
| `#reg-terms-chk` | `checkbox` | Input | `None` | No |
| `#stu-dept` | `select` | Dropdown | Dynamic options | No |
| `#stu-sem` | `select` | Dropdown | Dynamic options | No |

#### 🪟 Modals, Dialogs & Drawers (0 Cataloged)
*No overlay modals on this page; all workflows occur inline or via full-page transitions.*

#### 📡 Backend REST API Contracts (6 Integrated)
| Method | Endpoint | Type | Purpose / Trigger |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/departments` | `REST` | Core academic service call |
| `GET` | `/api/v1/auth/departments` | `REST` | Core academic service call |
| `GET` | `/api/v1/auth/student/registration/status` | `REST` | Core academic service call |
| `GET` | `/api/v1/auth/google/url` | `REST` | Core academic service call |
| `GET` | `https://vidyaos-backend.onrender.com/api/v1/auth/google/url` | `INTERNAL` | Core academic service call |
| `POST` | `/api/v1/auth/student/register` | `REST` | Core academic service call |

---

## 🌐 2. Faculty Academic Operations & Teaching Group Management (FAC)

*Faculty command center, teaching classes, coursework assignments, real-time registers, academic sheets, and student dossiers.*

### FAC-001: Student Academic Records & Dossiers — VidyaOS

- **URL Route**: `/faculty/student-records/index.html (Legacy /faculty/registers.html redirects here)`
- **Source File**: [frontend/faculty/student-records/index.html](file:///e:/uiap/VidyaOS/frontend/faculty/student-records/index.html)
- **Target Role**: `Faculty`
- **Shell & Styling**: VidyaOS Semantic Shell (`variables.css`, `header.js`, `sidebar.js`)
- **Responsive States**: Desktop: tabular academic roster with attendance %; Mobile: compact cards with zero overflow (Roll, Name, Att %, 3-dot menu)

#### 🎯 Purpose & Academic Workflow
Student Academic Records & Dossiers: Decoupled historical records archive, full student demographic profile dossiers, multi-semester evaluation matrices, tests and attendance summaries, and multi-format exports

#### 🔘 Action Buttons & Interactive Controls (27 Cataloged)
| Button ID | Label / Text | Class / Variant | Action / Behavior |
| :--- | :--- | :--- | :--- |
| `#null` | Export All Records | `btn-rec-export-all` | openCohortExportModal() |
| `#null` | Reset Filters | `btn-rec-clear` | resetFilters() |
| `#btn-export-records` | Export | `btn-rec-export-section` | openClassworkExportModal() |
| `#btn-profile-export` | Personal Details | `btn-rec-export-profile` | toggleProfileExportMenu(event) |
| `#null` | Bio-Data Sheet (PDF) | `btn` | exportStudentPersonalDetails( |
| `#null` | Demographics (.xlsx) | `btn` | exportStudentPersonalDetails( |
| `#null` | Bio-Data Word (.doc) | `btn` | exportStudentPersonalDetails( |
| `#null` | &times; | `btn-modal-close` | closeDossierModal() |
| `#null` | View Sheet | `btn-rec-card-view` | event.stopPropagation(); selectDossierSection( |
| `#null` | View Matrix | `btn-rec-card-view` | event.stopPropagation(); selectDossierSection( |
| `#null` | View Files | `btn-rec-card-view` | event.stopPropagation(); selectDossierSection( |
| `#null` | Close | `btn-rec-outline` | closeDossierModal() |
| `#null` | Export Selected Dossier | `btn-rec-solid` | executeSingleStudentExport() |
| `#null` | ✕ | `btn-rec-modal-close` | closeDocumentPreview() |
| `#null` | &times; | `btn-rec-modal-close` | closeMobileMarksModal() |
| `#mob-marks-open-dossier` | Open Complete Academic Dossier | `btn-rec-solid` | Event handler bound |
| `#null` | &times; | `btn-modal-close` | closeCohortExportModal() |
| `#null` | Cancel | `btn-rec-outline` | closeCohortExportModal() |
| `#null` | Download Cohort Records | `btn-rec-solid` | Event handler bound |
| `#null` | &times; | `btn-modal-close` | closeClassworkExportModal() |
| `#null` | Cancel | `btn-rec-outline` | closeClassworkExportModal() |
| `#btn-view-sheet` | View | `btn-rec-secondary` | triggerViewClassworkSheet() |
| `#btn-export-sheet` | Export | `btn-rec-solid` | triggerExportClassworkSheet() |
| `#btn-preview-export-excel` | Excel (.xlsx) | `btn-sheet-action-pill` | downloadPreviewSheet( |
| `#btn-preview-export-pdf` | PDF (.pdf) | `btn-sheet-action-pill` | downloadPreviewSheet( |
| `#btn-preview-export-word` | Word (.docx) | `btn-sheet-action-pill` | downloadPreviewSheet( |
| `#null` | &times; | `btn-modal-close` | closeSheetPreviewModal() |

#### 📝 Form Inputs & Dropdown Selectors (27 Cataloged)
| Control ID | Type | Name / Purpose | Placeholder / Options | Required |
| :--- | :--- | :--- | :--- | :--- |
| `#rec-search-input` | `text` | Input | `Search by student, roll #, work or subject (e.g. 1 girdhardhami assinment java)...` | No |
| `#check-sem-all` | `checkbox` | Input | `None` | No |
| `#export-inc-tests` | `checkbox` | Input | `None` | No |
| `#export-inc-assignments` | `checkbox` | Input | `None` | No |
| `#export-inc-labs` | `checkbox` | Input | `None` | No |
| `#export-inc-attendance` | `checkbox` | Input | `None` | No |
| `#export-inc-documents` | `checkbox` | Input | `None` | No |
| `#export-single-pdf` | `checkbox` | Input | `None` | No |
| `#export-single-doc` | `checkbox` | Input | `None` | No |
| `#export-single-excel` | `checkbox` | Input | `None` | No |
| `#cohort-fmt-excel` | `checkbox` | Input | `None` | No |
| `#cohort-fmt-pdf` | `checkbox` | Input | `None` | No |
| `#cohort-fmt-doc` | `checkbox` | Input | `None` | No |
| `#fmt-xlsx` | `radio` | export-classwork-fmt | `None` | No |
| `#fmt-pdf` | `radio` | export-classwork-fmt | `None` | No |
| `#fmt-docx` | `radio` | export-classwork-fmt | `None` | No |
| `#filter-session` | `select` | Dropdown | Dynamic options | No |
| `#filter-year` | `select` | Dropdown | Dynamic options | No |
| `#filter-semester` | `select` | Dropdown | Dynamic options | No |
| `#filter-batch` | `select` | Dropdown | Dynamic options | No |
| `#filter-status` | `select` | Dropdown | Dynamic options | No |
| `#export-cohort-session` | `select` | Dropdown | Dynamic options | No |
| `#export-cohort-batch` | `select` | Dropdown | Dynamic options | No |
| `#export-cohort-year` | `select` | Dropdown | Dynamic options | No |
| `#export-cohort-semester` | `select` | Dropdown | Dynamic options | No |
| `#export-classwork-type` | `select` | Dropdown | Dynamic options | No |
| `#export-classwork-semester` | `select` | Dropdown | Dynamic options | No |

#### 🪟 Modals, Dialogs & Drawers (14 Cataloged)
##### Modal 1: `#modal-student-dossier` — Modal Dialog
- **Container ID**: `#modal-student-dossier`
- **Submit Action**: `Form submission`

##### Modal 2: `#export-inc-tests` — Modal Dialog
- **Container ID**: `#export-inc-tests`
- **Submit Action**: `Form submission`
- **Contained Fields**: `export-inc-tests`, `export-inc-assignments`, `export-inc-labs`, `export-inc-attendance`, `export-inc-documents`

##### Modal 3: `#modal-document-preview` — Modal Dialog
- **Container ID**: `#modal-document-preview`
- **Submit Action**: `Form submission`

##### Modal 4: `#modal-marks-mobile` — Marks
            Details
- **Container ID**: `#modal-marks-mobile`
- **Submit Action**: `Form submission`

##### Modal 5: `#mob-marks-assessment` — Modal Dialog
- **Container ID**: `#mob-marks-assessment`
- **Submit Action**: `Form submission`

##### Modal 6: `#mob-marks-score` — Modal Dialog
- **Container ID**: `#mob-marks-score`
- **Submit Action**: `Form submission`

##### Modal 7: `#mob-marks-pct` — Modal Dialog
- **Container ID**: `#mob-marks-pct`
- **Submit Action**: `Form submission`

##### Modal 8: `#mob-marks-status` — Modal Dialog
- **Container ID**: `#mob-marks-status`
- **Submit Action**: `Form submission`

##### Modal 9: `#mob-marks-feedback` — Modal Dialog
- **Container ID**: `#mob-marks-feedback`
- **Submit Action**: `Form submission`

##### Modal 10: `#modal-cohort-export` — Modal Dialog
- **Container ID**: `#modal-cohort-export`
- **Submit Action**: `Form submission`

##### Modal 11: `#modal-export-records` — Export & View Classwork
- **Container ID**: `#modal-export-records`
- **Submit Action**: `Form submission`

##### Modal 12: `#export-classwork-type` — Modal Dialog
- **Container ID**: `#export-classwork-type`
- **Submit Action**: `Form submission`

##### Modal 13: `#modal-sheet-preview` — Internal Evaluation Sheet
- **Container ID**: `#modal-sheet-preview`
- **Submit Action**: `Form submission`

##### Modal 14: `#sheet-preview-container` — Modal Dialog
- **Container ID**: `#sheet-preview-container`
- **Submit Action**: `Form submission`

#### 📡 Backend REST API Contracts (6 Integrated)
| Method | Endpoint | Type | Purpose / Trigger |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/logout` | `REST` | Core academic service call |
| `GET` | `/api/v1/auth/me` | `REST` | Core academic service call |
| `GET` | `/api/v1/auth/heartbeat` | `REST` | Core academic service call |
| `GET` | `/api/v1/notifications` | `REST` | Core academic service call |
| `PUT` | `/api/v1/notifications/:id/read` | `REST` | Core academic service call |
| `PUT` | `/api/v1/notifications/mark-all-read` | `REST` | Core academic service call |

---

### FAC-002: Faculty Dashboard — VidyaOS

- **URL Route**: `/faculty/dashboard.html`
- **Source File**: [frontend/faculty/dashboard/index.html](file:///e:/uiap/VidyaOS/frontend/faculty/dashboard/index.html)
- **Target Role**: `Faculty`
- **Shell & Styling**: Classroom Shell (`classroom-nav.css`, `nav.js`)
- **Responsive States**: Desktop: 3-column responsive card grid; Mobile: 1-column cards with quick jump buttons
- **URL Parameters**: `tab`

#### 🎯 Purpose & Academic Workflow
Faculty home console, class groups, today's schedule, pending tasks

#### 🔘 Action Buttons & Interactive Controls (0 Cataloged)
*This page utilizes card-level tap targets, contextual links, and direct row navigation without standalone static toolbar buttons.*

#### 📝 Form Inputs & Dropdown Selectors (0 Cataloged)
*No direct form inputs on this page; view-only or modal-driven input flow.*

#### 🪟 Modals, Dialogs & Drawers (0 Cataloged)
*No overlay modals on this page; all workflows occur inline or via full-page transitions.*

#### 📡 Backend REST API Contracts (7 Integrated)
| Method | Endpoint | Type | Purpose / Trigger |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/logout` | `REST` | Core academic service call |
| `GET` | `/api/v1/auth/me` | `REST` | Core academic service call |
| `GET` | `/api/v1/auth/heartbeat` | `REST` | Core academic service call |
| `GET` | `/api/v1/notifications` | `REST` | Core academic service call |
| `PUT` | `/api/v1/notifications/:id/read` | `REST` | Core academic service call |
| `PUT` | `/api/v1/notifications/mark-all-read` | `REST` | Core academic service call |
| `GET` | `/api/v1:id` | `REST` | Core academic service call |

---

### FAC-004: Teaching Group Classroom - VidyaOS

- **URL Route**: `/faculty/group-detail.html`
- **Source File**: [frontend/faculty/group-detail/index.html](file:///e:/uiap/VidyaOS/frontend/faculty/group-detail/index.html)
- **Target Role**: `Faculty`
- **Shell & Styling**: Classroom Shell (`classroom-nav.css`, `nav.js`)
- **Responsive States**: Desktop: multi-tab classroom workspace; Mobile: scrollable tab bar + compact stream feed

#### 🎯 Purpose & Academic Workflow
Comprehensive cohort studio (Stream, Classwork, People, Marks)

#### 🔘 Action Buttons & Interactive Controls (180 Cataloged)
| Button ID | Label / Text | Class / Variant | Action / Behavior |
| :--- | :--- | :--- | :--- |
| `#btn-edit-group` | Customize | `banner-action-btn` | openEditGroupModal() |
| `#null` | Sheets Studio | `banner-action-btn` | openSheetStudio() |
| `#null` | Register | `banner-action-btn primary` | openLinkedRegister() |
| `#btn-banner-promote` | Promote Cohort | `banner-action-btn` | openPromoteModal() |
| `#null` | Open Mark's Excel Sheet | `sheets-bar-btn` | openSheetStudio( |
| `#null` | Open Assignment Excel Sheet | `sheets-bar-btn` | openSheetStudio( |
| `#null` | Open Evaluation Sheet | `sheets-bar-btn` | openSheetStudio( |
| `#null` | Unified Studio | `sheets-bar-btn primary` | openSheetStudio() |
| `#tab-btn-stream` | Stream | `gc-nav-tab active` | switchTab( |
| `#tab-btn-classwork` | Classwork | `gc-nav-tab` | switchTab( |
| `#tab-btn-people` | People | `gc-nav-tab` | switchTab( |
| `#tab-btn-register` | Register | `gc-nav-tab` | switchTab( |
| `#tab-btn-marks` | Marks 0 | `gc-nav-tab` | switchTab( |
| `#tab-btn-attendance` | Attendance | `gc-nav-tab student-only-tab` | switchTab( |
| `#qa-item-assignment` | Create Assignment | `qa-item` | switchTab( |
| `#qa-item-test` | Schedule Class Test | `qa-item` | switchTab( |
| `#qa-item-practical` | Create Lab Practical | `qa-item` | switchTab( |
| `#null` | Sheets Studio (All Sheets) | `qa-item` | openSheetStudio( |
| `#null` | Open Attendance Register | `qa-item` | openLinkedRegister() |
| `#null` | document.getElementById('add-enroll-input').foc... | `qa-item` | switchTab( |
| `#null` | Promote Cohort | `qa-item` | openPromoteModal() |
| `#null` | Archive Group | `qa-item` | openArchiveModal() |
| `#btn-new-announcement` | New announcement | `btn-new-announcement-pill` | triggerNewAnnouncement() |
| `#btn-post-ann` | Icon Button | `btn` | Event handler bound |
| `#null` | Back to Stream | `detail-back-btn` | closeAnnouncementDetail() |
| `#null` | Options | `detail-overflow-btn` | toggleDetailOverflow(event) |
| `#btn-detail-send` | Send comment | `detail-send-btn` | submitDetailComment() |
| `#null` | Cancel | `mobile-composer-btn mobile-composer-close` | closeMobileAnnouncementComposer() |
| `#btn-mobile-composer-submit` | Create | `mobile-composer-create-btn` | submitMobileAnnouncement() |
| `#null` | Options | `mobile-composer-btn mobile-composer-menu` | showToast( |
| `#null` | Add attachment | `mobile-composer-attach-btn` | ById( |
| `#null` | &#10005; | `attachment-remove-btn` | clearMobileComposerFile() |
| `#cw-main-create-btn` | Create | `cw-create-btn gc-create-pill-btn` | toggleCWDrop() |
| `#btn-collapse-all-units` | Collapse all | `gc-collapse-all-btn` | toggleCollapseAllUnits() |
| `#null` | Classwork | `work-inst-back-btn` | closeWorkInstructionsView() |
| `#btn-work-inst-more` | Options | `work-inst-tool-btn` | toggleWorkInstMoreMenu(event) |
| `#null` | Edit | `work-dd-item` | openEditWorkFromInstructions(); closeWorkInstDropdown(); |
| `#null` | Delete | `work-dd-item danger` | deleteWorkFromInstructions(); closeWorkInstDropdown(); |
| `#btn-inst-tab-instructions` | Instructions | `work-inst-tab-btn active` | switchWorkInstTab( |
| `#btn-inst-tab-roster` | Student work 0 | `work-inst-tab-btn` | switchWorkInstTab( |
| `#work-inst-bottom-send-btn` | Send comment | `work-inst-bottom-send-btn` | submitWorkInstActiveComment() |
| `#null` | Close without saving | `work-edit-close-btn` | closeWorkEditPage() |
| `#btn-save-edit-work` | Save | `work-edit-save-btn` | submitEditWork() |
| `#null` | More options | `work-edit-more-btn` | toast( |
| `#null` | All students | `gc-edit-audience-chip` | toast( |
| `#null` | B | `gc-rich-btn` | formatEditDesc( |
| `#null` | I | `gc-rich-btn` | formatEditDesc( |
| `#null` | U | `gc-rich-btn` | formatEditDesc( |
| `#null` | &#8226; | `gc-rich-btn` | formatEditDesc( |
| `#null` | &#10006; | `gc-rich-btn` | formatEditDesc( |
| `#null` | Add attachment | `gc-edit-add-attach-btn` | promptAddAttachment( |
| `#null` | Add | `btn btn-secondary btn-sm` | addEditFinalDocRequirement() |
| `#null` | Drive | `gc-attach-tool-btn` | promptAddAttachment( |
| `#null` | YouTube | `gc-attach-tool-btn` | promptAddAttachment( |
| `#null` | Create | `gc-attach-tool-btn` | promptAddAttachment( |
| `#null` | Upload | `gc-attach-tool-btn` | promptAddAttachment( |
| `#null` | Link | `gc-attach-tool-btn` | promptAddAttachment( |
| `#null` | + Rubric | `gc-sidebar-rubric-btn` | toast( |
| `#null` | Copy Link | `btn btn-secondary btn-sm compact-invite-btn` | copyInviteCode() |
| `#null` | + Add | `add-student-submit-btn` | addStudentByEnroll() |
| `#null` | Cohort | `btn btn-secondary btn-sm add-student-cohort-btn` | openAddUnenrolledModal() |
| `#null` | Unified Sheets Studio | `btn btn-secondary` | openSheetStudio() |
| `#btn-marks-create-main` | + Create | `btn btn-primary` | toggleMarksCreateDropdown(event) |
| `#marks-dd-test-item` | Class Test | `dropdown-item` | openScheduleTestModal();toggleMarksCreateDropdown(false) |
| `#marks-dd-assignment-item` | Assignment | `dropdown-item` | openCreateAssignmentModal();toggleMarksCreateDropdown(false) |
| `#marks-dd-practical-item` | Lab Practical | `dropdown-item` | openCreatePracticalModal();toggleMarksCreateDropdown(false) |
| `#btn-marks-cat-all` | All 0 | `expand-filter-btn marks-filter-icon-btn active` | filterMarksCategory( |
| `#btn-marks-cat-tests` | Tests 0 | `expand-filter-btn marks-filter-icon-btn` | filterMarksCategory( |
| `#btn-marks-cat-assignments` | Assignments 0 | `expand-filter-btn marks-filter-icon-btn` | filterMarksCategory( |
| `#btn-marks-cat-practicals` | Practicals 0 | `expand-filter-btn marks-filter-icon-btn` | filterMarksCategory( |
| `#null` | + Schedule Test | `btn btn-secondary btn-sm mobile-sec-add-btn` | openScheduleTestModal() |
| `#null` | + New Assignment | `btn btn-secondary btn-sm mobile-sec-add-btn` | openCreateAssignmentModal() |
| `#btn-toggle-mobile-mode` | Full 31-Day Ledger | `btn btn-secondary btn-sm` | toggleMobileRegisterMode() |
| `#null` | Previous Month | `month-nav-arrow` | navigateClassRegisterMonth(-1) |
| `#btn-class-reg-month-picker` | OctoberOct 2026 | `month-nav-display` | openClassRegMonthPicker() |
| `#null` | Next Month | `month-nav-arrow` | navigateClassRegisterMonth(1) |
| `#null` | Today | `month-nav-today` | jumpToClassRegisterCurrentMonth() |
| `#null` | Export | `btn btn-secondary btn-sm btn-export-register` | openAttendanceExportModal() |
| `#null` | Print | `btn btn-secondary btn-sm btn-print-register` | printClassRegister() |
| `#btn-class-esp-sync` | Sync ESP Scans Sync ESP | `btn btn-primary btn-sm` | triggerClassEspDaySync() |
| `#null` | Roll Call (Manual, QR &amp; PIN) Roll Call | `btn btn-secondary btn-sm btn-roll-call` | openClassRollCallModal() |
| `#null` | Deselect | `btn btn-secondary btn-sm` | deselectAllMatrixStudents() |
| `#null` | P Mark Present | `btn-bulk-present` | bulkMarkAttendance( |
| `#null` | A Mark Absent | `btn-bulk-absent` | bulkMarkAttendance( |
| `#null` | Clear | `btn btn-secondary btn-sm` | bulkMarkAttendance( |
| `#btn-mobile-del-class` | Remove P2 | `btn-roster-del-period` | confirmDeleteCurrentPeriod() |
| `#btn-period-single` | P1 | `mobile-period-btn active` | Event handler bound |
| `#btn-mobile-add-class` | Add Period | `mobile-add-class-btn` | openAddPeriodModal() |
| `#mobile-search-clear-btn` | &times; | `mobile-search-clear` | clearMobileStudentSearch() |
| `#null` | &times; | `btn` | closeClassRollCallModal() |
| `#class-rc-tab-live` | Dynamic QR &amp; 6-Digit PIN | `rollcall-tab-btn active` | switchClassRollCallMode( |
| `#class-rc-tab-manual` | Manual Roll Call Roster | `rollcall-tab-btn` | switchClassRollCallMode( |
| `#null` | Close | `btn btn-secondary` | closeClassRollCallModal() |
| `#btn-save-class-rollcall` | Confirm &amp; Save Attendance | `btn btn-primary` | submitClassRollCall() |
| `#null` | &times; | `export-modal-close` | closeAttendanceExportModal() |
| `#btn-scope-both` | Theory + Lab | `export-scope-btn active` | selectExportScope( |
| `#btn-scope-theory` | Theory Only | `export-scope-btn` | selectExportScope( |
| `#btn-scope-practical` | Lab Only | `export-scope-btn` | selectExportScope( |
| `#null` | Cancel | `btn btn-secondary btn-sm` | closeAttendanceExportModal() |
| `#btn-execute-export` | Download Report | `btn btn-primary btn-sm btn-download-export` | executeAttendanceExport() |
| `#null` | &times; | `btn` | closeModal( |
| `#null` | Cancel | `btn btn-secondary` | closeModal( |
| `#btn-confirm-save-esp` | Confirm &amp; Add to Register | `btn btn-primary` | submitEspConfirmation() |
| `#null` | Icon Button | `modal-close-icon-btn` | closeModal( |
| `#null` | Theory Lecture | `period-suggestion-chip` | applyPeriodQuickName( |
| `#null` | Practical Lab | `period-suggestion-chip` | applyPeriodQuickName( |
| `#null` | Lab Batch A | `period-suggestion-chip` | applyPeriodQuickName( |
| `#null` | Lab Batch B | `period-suggestion-chip` | applyPeriodQuickName( |
| `#null` | Tutorial | `period-suggestion-chip` | applyPeriodQuickName( |
| `#null` | Remedial | `period-suggestion-chip` | applyPeriodQuickName( |
| `#null` | Viva / Seminar | `period-suggestion-chip` | applyPeriodQuickName( |
| `#null` | Extra Class | `period-suggestion-chip` | applyPeriodQuickName( |
| `#btn-toggle-period-time` | + Add class timing (optional) | `period-time-toggle-btn` | togglePeriodTimeInputs() |
| `#btn-submit-add-period` | Create Period | `btn btn-primary btn-sm` | Event handler bound |
| `#null` | &times; | `remark-popover-close` | closeRemarkMenu() |
| `#null` | Enrolled (Regular) Active enrolled student | `remark-opt-btn` | applyStudentStatusChange( |
| `#null` | Transferred Moved to another college/branch | `remark-opt-btn` | applyStudentStatusChange( |
| `#null` | Dropped / Detained Inactive in this academic se... | `remark-opt-btn` | applyStudentStatusChange( |
| `#null` | &#10005; | `modal-close-btn` | closeModal( |
| `#null` | Publish | `btn btn-primary` | submitCreateAssignment() |
| `#btn-submit-practical` | Publish Practical Work | `btn btn-primary` | submitCreatePractical() |
| `#null` | Add | `btn btn-secondary btn-sm` | addFinalDocRequirement() |
| `#btn-submit-finaldocs` | Request Final Documents | `btn btn-primary` | submitCreateFinalDocs() |
| `#btn-confirm-delete-work` | Delete | `btn btn-primary` | confirmDirectDeleteWork() |
| `#btn-save-unit-editor` | Add Unit | `btn btn-primary` | submitSaveUnit() |
| `#btn-confirm-delete-unit` | Delete Topic | `btn btn-danger` | confirmExecuteDeleteUnit() |
| `#null` | Auto-Split | `btn btn-secondary btn-sm` | autoSplitScheduleQuestions() |
| `#null` | + Add Question | `btn btn-secondary btn-sm` | addScheduleTestQuestion() |
| `#null` | Schedule Test | `btn btn-primary` | submitScheduleTest() |
| `#btn-modal-edit-q` | Q EditQ Edit | `btn btn-secondary btn-sm btn-tool-minimal` | openEditQuestionsModal() |
| `#btn-add-q` | + Add Q+ Q | `btn btn-secondary btn-sm btn-tool-minimal` | addModalQuestion() |
| `#btn-remove-q` | &minus; Remove Q&minus; Q | `btn btn-secondary btn-sm btn-tool-minimal` | removeModalQuestion() |
| `#btn-marks-col-filter` | Columns 0 | `btn btn-secondary btn-sm btn-tool-minimal` | toggleMarksColFilterMenu(event) |
| `#btn-marks-export` | Export | `btn btn-secondary btn-sm btn-tool-minimal` | toggleMarksExportMenu(event) |
| `#null` | Excel Spreadsheet (.xlsx) | `btn` | exportGroupTestMarks( |
| `#null` | PDF Document (.pdf) | `btn` | exportGroupTestMarks( |
| `#null` | Word Document (.doc) | `btn` | exportGroupTestMarks( |
| `#btn-view-table` | Table | `view-mode-btn` | setMarksModalView( |
| `#btn-view-excel` | Excel | `view-mode-btn` | setMarksModalView( |
| `#btn-set-default-view` | Set Default | `btn btn-secondary btn-sm marks-toolbar-extra-btn desktop-only-toggle` | saveCurrentViewAsDefault() |
| `#btn-save-marks-entry` | Save Marks | `btn btn-primary btn-modal-save` | saveMarksEntry() |
| `#null` | Split Evenly | `btn btn-secondary btn-sm btn-edit-q-tool` | distributeEditQuestionsEvenly() |
| `#null` | + Add Q | `btn btn-primary-tint btn-sm btn-edit-q-tool` | addEditQuestionRow() |
| `#null` | Apply &amp; Update | `btn btn-primary btn-edit-q-apply` | saveEditedQuestions() |
| `#btn-am-filter-all` | All (0) | `am-filter-pill active` | filterAssignModalStatus( |
| `#btn-am-filter-sub` | Submitted (0) | `am-filter-pill` | filterAssignModalStatus( |
| `#btn-am-filter-unsub` | Not Submitted (0) | `am-filter-pill` | filterAssignModalStatus( |
| `#btn-am-filter-ungraded` | Ungraded (0) | `am-filter-pill` | filterAssignModalStatus( |
| `#btn-save-assign-marks` | Save Assignment Marks Save | `am-save-btn` | saveAssignmentMarksEntry() |
| `#null` | Confirm &amp; Archive | `btn` | executeArchive() |
| `#btn-save-edit-group` | Save Changes | `btn btn-primary` | Event handler bound |
| `#btn-batch-enroll-unenrolled` | + Enroll Selected (0) | `btn btn-primary` | submitBatchEnrollUnenrolled() |
| `#null` | Proceed to Step 2 &rarr; | `btn btn-primary` | proceedDeleteStep2() |
| `#null` | &larr; Back | `btn btn-secondary` | backDeleteStep1() |
| `#btn-final-delete-confirm` | Confirm &amp; Remove | `btn` | executeConfirmedDelete() |
| `#null` | Copy | `btn btn-secondary btn-sm` | copyInviteCode() |
| `#null` | Close | `btn btn-secondary` | closeModal( |
| `#post-btn-bold` | B | `post-format-btn` | formatModalText( |
| `#post-btn-italic` | I | `post-format-btn` | formatModalText( |
| `#post-btn-underline` | U | `post-format-btn` | formatModalText( |
| `#post-btn-bullet` | Bulleted list | `post-format-btn` | formatModalText( |
| `#post-btn-clear` | Tx | `post-format-btn` | formatModalText( |
| `#null` | &#10005; | `attachment-remove-btn` | clearModalAnnouncementFile() |
| `#null` | Upload file | `post-icon-btn` | ById( |
| `#null` | Add link | `post-icon-btn` | insertLinkToModalAnnouncement() |
| `#btn-submit-modal-announcement` | Post | `post-submit-pill-btn` | submitModalAnnouncement() |
| `#classwork-mobile-fab` | Add Classwork | `classwork-mobile-fab cw-mobile-fab` | toggleCwFabMenu() |
| `#cw-fab-assignment-item` | Assignment | `cw-fab-menu-item` | openCreateAssignmentModal();toggleCwFabMenu(false) |
| `#cw-fab-test-item` | Class Test | `cw-fab-menu-item` | openScheduleTestModal();toggleCwFabMenu(false) |
| `#cw-fab-practical-item` | Lab Practical | `cw-fab-menu-item` | openCreatePracticalModal();toggleCwFabMenu(false) |
| `#null` | Final Documents | `cw-fab-menu-item` | openFinalDocsModal();toggleCwFabMenu(false) |
| `#null` | Unit / Topic | `cw-fab-menu-item` | openCreateUnitModal();toggleCwFabMenu(false) |
| `#null` | Present | `btn-dock-mark btn-dock-present` | bulkMarkAttendance( |
| `#null` | Absent | `btn-dock-mark btn-dock-absent` | bulkMarkAttendance( |
| `#null` | Cancel selection | `btn-dock-dismiss` | deselectAllMobileStudents() |
| `#mobile-tab-btn-stream` | Stream | `classroom-mobile-nav-btn active` | switchTab( |
| `#mobile-tab-btn-classwork` | Classwork | `classroom-mobile-nav-btn` | switchTab( |
| `#mobile-tab-btn-register` | Register | `classroom-mobile-nav-btn` | switchTab( |
| `#mobile-tab-btn-marks` | Marks | `classroom-mobile-nav-btn` | switchTab( |
| `#mobile-tab-btn-people` | People | `classroom-mobile-nav-btn` | switchTab( |

#### 📝 Form Inputs & Dropdown Selectors (86 Cataloged)
| Control ID | Type | Name / Purpose | Placeholder / Options | Required |
| :--- | :--- | :--- | :--- | :--- |
| `#compose-stream-file` | `file` | Input | `None` | No |
| `#detail-comment-input` | `text` | Input | `Add class comment…` | No |
| `#mobile-composer-file` | `file` | Input | `None` | No |
| `#work-inst-bottom-comment-input` | `text` | Input | `Add class comment…` | No |
| `#edit-work-title` | `text` | Input | `Title` | No |
| `#edit-work-marks-mobile` | `number` | Input | `100` | No |
| `#edit-work-due-mobile` | `date` | Input | `None` | No |
| `#edit-work-unit-mobile` | `hidden` | Input | `None` | No |
| `#edit-finaldocs-new-req-input` | `text` | Input | `Type document name...` | No |
| `#edit-work-marks` | `number` | Input | `None` | No |
| `#edit-work-due` | `date` | Input | `None` | No |
| `#edit-work-close-due` | `checkbox` | Input | `None` | No |
| `#edit-work-unit` | `hidden` | Input | `None` | No |
| `#add-enroll-input` | `text` | Input | `UBTER Roll No. to add…` | No |
| `#marks-search-input` | `text` | Input | `Search tests, assignments, practicals&#8230;` | No |
| `#hidden-class-reg-month-picker` | `month` | Input | `None` | No |
| `#class-sync-date` | `date` | Input | `None` | No |
| `#mobile-student-search-input` | `text` | Input | `Quick search student by name or roll...` | No |
| `#mobile-check-all` | `checkbox` | Input | `None` | No |
| `#null` | `radio` | export-format | `None` | No |
| `#null` | `radio` | export-format | `None` | No |
| `#null` | `radio` | export-format | `None` | No |
| `#range-opt-all` | `radio` | export-range | `None` | No |
| `#range-opt-overview` | `radio` | export-range | `None` | No |
| `#range-opt-month` | `radio` | export-range | `None` | No |
| `#range-opt-day` | `radio` | export-range | `None` | No |
| `#range-opt-week` | `radio` | export-range | `None` | No |
| `#export-day-input` | `date` | Input | `None` | No |
| `#export-scope-val` | `hidden` | Input | `None` | No |
| `#esp-select-all` | `checkbox` | Input | `None` | No |
| `#sess-date` | `date` | Input | `None` | No |
| `#sess-type` | `hidden` | Input | `None` | No |
| `#sess-label` | `text` | Input | `e.g. Theory Class, Practical Lab, Tutorial...` | No |
| `#sess-period` | `hidden` | Input | `None` | No |
| `#sess-start-time` | `time` | Input | `None` | No |
| `#sess-end-time` | `time` | Input | `None` | No |
| `#assign-title` | `text` | Input | `e.g. Assignment 1: SQL Normalization` | No |
| `#assign-marks` | `number` | Input | `None` | No |
| `#assign-due` | `date` | Input | `None` | No |
| `#practical-title` | `text` | Input | `e.g. Lab Experiment 1: SQL Join Operations & Indexing` | No |
| `#practical-marks` | `number` | Input | `None` | No |
| `#practical-due` | `date` | Input | `None` | No |
| `#practical-post-stream` | `checkbox` | Input | `None` | No |
| `#finaldocs-title` | `text` | Input | `None` | No |
| `#finaldocs-new-req-input` | `text` | Input | `Type document name (e.g. Viva Voce Report)...` | No |
| `#finaldocs-due` | `date` | Input | `None` | No |
| `#finaldocs-post-stream` | `checkbox` | Input | `None` | No |
| `#edit-work-id` | `hidden` | Input | `None` | No |
| `#edit-work-type` | `hidden` | Input | `None` | No |
| `#edit-work-title` | `text` | Input | `None` | No |
| `#edit-work-marks` | `number` | Input | `None` | No |
| `#edit-work-due` | `date` | Input | `None` | No |
| `#edit-finaldocs-new-req-input` | `text` | Input | `Type document name...` | No |
| `#del-work-delete-files` | `checkbox` | Input | `None` | No |
| `#unit-editor-mode` | `hidden` | Input | `None` | No |
| `#unit-editor-num` | `hidden` | Input | `None` | No |
| `#unit-editor-name` | `text` | Input | `e.g. Unit 1` | No |
| `#unit-editor-title` | `text` | Input | `e.g. Basics and Language Fundamentals` | No |
| `#test-number-input` | `number` | Input | `No.` | No |
| `#test-unit-no` | `hidden` | Input | `None` | No |
| `#test-title` | `text` | Input | `e.g. Unit Test 1: SQL Basics` | No |
| `#test-date` | `date` | Input | `None` | No |
| `#test-marks` | `number` | Input | `None` | No |
| `#test-num-questions` | `number` | Input | `None` | No |
| `#chk-show-sr` | `checkbox` | Input | `None` | No |
| `#chk-show-enroll` | `checkbox` | Input | `None` | No |
| `#chk-show-reg` | `checkbox` | Input | `None` | No |
| `#assign-marks-search` | `text` | Input | `Search student by name or roll&#8230;` | No |
| `#edit-group-id` | `hidden` | Input | `None` | No |
| `#edit-group-name` | `text` | Input | `None` | No |
| `#edit-group-subject` | `text` | Input | `None` | No |
| `#edit-group-total-units` | `number` | Input | `e.g. 5` | No |
| `#search-unenrolled-input` | `text` | Input | `Search by name, roll, or UBTER roll no...` | No |
| `#unenrolled-select-all` | `checkbox` | Input | `None` | No |
| `#del-confirm-checkbox` | `checkbox` | Input | `None` | No |
| `#modal-announcement-file` | `file` | Input | `None` | No |
| `#cw-unit-filter-select` | `select` | Dropdown | Dynamic options | No |
| `#cw-cat-filter-select` | `select` | Dropdown | Dynamic options | No |
| `#export-month-select` | `select` | Dropdown | Dynamic options | No |
| `#assign-num` | `select` | Dropdown | Dynamic options | No |
| `#assign-unit` | `select` | Dropdown | Dynamic options | No |
| `#practical-unit` | `select` | Dropdown | Dynamic options | No |
| `#edit-work-unit` | `select` | Dropdown | Dynamic options | No |
| `#test-unit-type` | `select` | Dropdown | Dynamic options | No |
| `#test-unit` | `select` | Dropdown | Dynamic options | No |
| `#edit-group-component` | `select` | Dropdown | Dynamic options | No |

#### 🪟 Modals, Dialogs & Drawers (54 Cataloged)
##### Modal 1: `#classroom-roll-modal` — Live Roll Call &amp; Attendance
- **Container ID**: `#classroom-roll-modal`
- **Submit Action**: `Form submission`

##### Modal 2: `#modal-export-attendance` — Export Attendance
- **Container ID**: `#modal-export-attendance`
- **Submit Action**: `Form submission`

##### Modal 3: `#btn-execute-export` — Modal Dialog
- **Container ID**: `#btn-execute-export`
- **Submit Action**: `closeAttendanceExportModal()`

##### Modal 4: `#esp-confirm-modal` — Confirm ESP32 Attendance
- **Container ID**: `#esp-confirm-modal`
- **Submit Action**: `Form submission`

##### Modal 5: `#add-session-modal` — Modal Dialog
- **Container ID**: `#add-session-modal`
- **Submit Action**: `Form submission`

##### Modal 6: `#sess-date` — Modal Dialog
- **Container ID**: `#sess-date`
- **Submit Action**: `Form submission`
- **Contained Fields**: `sess-date`

##### Modal 7: `#modal-existing-periods-list` — Modal Dialog
- **Container ID**: `#modal-existing-periods-list`
- **Submit Action**: `Form submission`

##### Modal 8: `#btn-submit-add-period` — Modal Dialog
- **Container ID**: `#btn-submit-add-period`
- **Submit Action**: `closeModal(`

##### Modal 9: `#modal-create-assignment` — Create Assignment
- **Container ID**: `#modal-create-assignment`
- **Submit Action**: `Form submission`

##### Modal 10: `#assign-num` — Modal Dialog
- **Container ID**: `#assign-num`
- **Submit Action**: `Form submission`

##### Modal 11: `#modal-create-practical` — Practical Work / Lab Experiment
- **Container ID**: `#modal-create-practical`
- **Submit Action**: `Form submission`

##### Modal 12: `#practical-title` — Modal Dialog
- **Container ID**: `#practical-title`
- **Submit Action**: `Form submission`
- **Contained Fields**: `practical-title`

##### Modal 13: `#btn-submit-practical` — Modal Dialog
- **Container ID**: `#btn-submit-practical`
- **Submit Action**: `closeModal(`

##### Modal 14: `#modal-create-finaldocs` — Final Documents Request
- **Container ID**: `#modal-create-finaldocs`
- **Submit Action**: `Form submission`

##### Modal 15: `#finaldocs-title` — Modal Dialog
- **Container ID**: `#finaldocs-title`
- **Submit Action**: `Form submission`
- **Contained Fields**: `finaldocs-title`

##### Modal 16: `#btn-submit-finaldocs` — Modal Dialog
- **Container ID**: `#btn-submit-finaldocs`
- **Submit Action**: `closeModal(`

##### Modal 17: `#modal-edit-classwork` — Edit Classwork
- **Container ID**: `#modal-edit-classwork`
- **Submit Action**: `Form submission`

##### Modal 18: `#edit-work-id` — Modal Dialog
- **Container ID**: `#edit-work-id`
- **Submit Action**: `Form submission`
- **Contained Fields**: `edit-work-id`, `edit-work-type`, `edit-work-title`

##### Modal 19: `#btn-save-edit-work` — Modal Dialog
- **Container ID**: `#btn-save-edit-work`
- **Submit Action**: `closeModal(`

##### Modal 20: `#modal-delete-work-direct` — Delete Classwork
- **Container ID**: `#modal-delete-work-direct`
- **Submit Action**: `Form submission`

##### Modal 21: `#del-work-title` — Modal Dialog
- **Container ID**: `#del-work-title`
- **Submit Action**: `Form submission`
- **Contained Fields**: `del-work-delete-files`

##### Modal 22: `#btn-confirm-delete-work` — Modal Dialog
- **Container ID**: `#btn-confirm-delete-work`
- **Submit Action**: `closeModal(`

##### Modal 23: `#modal-unit-editor` — Add Syllabus Unit
- **Container ID**: `#modal-unit-editor`
- **Submit Action**: `Form submission`

##### Modal 24: `#unit-editor-mode` — Modal Dialog
- **Container ID**: `#unit-editor-mode`
- **Submit Action**: `Form submission`
- **Contained Fields**: `unit-editor-mode`, `unit-editor-num`, `unit-editor-name`

##### Modal 25: `#btn-save-unit-editor` — Modal Dialog
- **Container ID**: `#btn-save-unit-editor`
- **Submit Action**: `closeModal(`

##### Modal 26: `#modal-confirm-delete-unit` — Modal Dialog
- **Container ID**: `#modal-confirm-delete-unit`
- **Submit Action**: `Form submission`

##### Modal 27: `#delete-unit-display-name` — Modal Dialog
- **Container ID**: `#delete-unit-display-name`
- **Submit Action**: `Form submission`

##### Modal 28: `#btn-confirm-delete-unit` — Modal Dialog
- **Container ID**: `#btn-confirm-delete-unit`
- **Submit Action**: `closeModal(`

##### Modal 29: `#modal-schedule-test` — Schedule Class Test
- **Container ID**: `#modal-schedule-test`
- **Submit Action**: `Form submission`

##### Modal 30: `#test-unit-type` — Modal Dialog
- **Container ID**: `#test-unit-type`
- **Submit Action**: `Form submission`
- **Contained Fields**: `test-number-input`, `test-unit-no`

##### Modal 31: `#modal-enter-marks` — Enter Marks
- **Container ID**: `#modal-enter-marks`
- **Submit Action**: `Form submission`

##### Modal 32: `#btn-modal-edit-q` — Modal Dialog
- **Container ID**: `#btn-modal-edit-q`
- **Submit Action**: `openEditQuestionsModal()`

##### Modal 33: `#marks-register-att-banner` — Modal Dialog
- **Container ID**: `#marks-register-att-banner`
- **Submit Action**: `Form submission`

##### Modal 34: `#marks-footer-max` — Modal Dialog
- **Container ID**: `#marks-footer-max`
- **Submit Action**: `Form submission`

##### Modal 35: `#modal-edit-questions` — Interactive Dialog
- **Container ID**: `#modal-edit-questions`
- **Submit Action**: `Form submission`

##### Modal 36: `#edit-q-total-max` — Modal Dialog
- **Container ID**: `#edit-q-total-max`
- **Submit Action**: `Form submission`

##### Modal 37: `#modal-enter-assignment-marks` — Modal Dialog
- **Container ID**: `#modal-enter-assignment-marks`
- **Submit Action**: `Form submission`

##### Modal 38: `#assign-marks-modal-meta` — Modal Dialog
- **Container ID**: `#assign-marks-modal-meta`
- **Submit Action**: `Form submission`

##### Modal 39: `#assign-marks-table` — Modal Dialog
- **Container ID**: `#assign-marks-table`
- **Submit Action**: `Form submission`

##### Modal 40: `#assign-marks-footer-max` — Modal Dialog
- **Container ID**: `#assign-marks-footer-max`
- **Submit Action**: `Form submission`

##### Modal 41: `#modal-archive` — Archive Teaching Group
- **Container ID**: `#modal-archive`
- **Submit Action**: `Form submission`

##### Modal 42: `#modal-edit-group` — Edit Class Settings
- **Container ID**: `#modal-edit-group`
- **Submit Action**: `Form submission`

##### Modal 43: `#edit-group-form` — Modal Dialog
- **Container ID**: `#edit-group-form`
- **Submit Action**: `Form submission`
- **Contained Fields**: `edit-group-id`, `edit-group-name`

##### Modal 44: `#modal-add-unenrolled` — Add Students from Cohort
- **Container ID**: `#modal-add-unenrolled`
- **Submit Action**: `Form submission`

##### Modal 45: `#search-unenrolled-input` — Modal Dialog
- **Container ID**: `#search-unenrolled-input`
- **Submit Action**: `Form submission`
- **Contained Fields**: `search-unenrolled-input`

##### Modal 46: `#modal-confirm-delete` — Confirm Action
- **Container ID**: `#modal-confirm-delete`
- **Submit Action**: `Form submission`

##### Modal 47: `#del-modal-step2-text` — Modal Dialog
- **Container ID**: `#del-modal-step2-text`
- **Submit Action**: `Form submission`
- **Contained Fields**: `del-confirm-checkbox`

##### Modal 48: `#btn-final-delete-confirm` — Modal Dialog
- **Container ID**: `#btn-final-delete-confirm`
- **Submit Action**: `backDeleteStep1()`

##### Modal 49: `#modal-work-filter` — Filter Classwork
- **Container ID**: `#modal-work-filter`
- **Submit Action**: `Form submission`

##### Modal 50: `#cw-filter-modal-list` — Modal Dialog
- **Container ID**: `#cw-filter-modal-list`
- **Submit Action**: `Form submission`

##### Modal 51: `#modal-class-info` — About this class
- **Container ID**: `#modal-class-info`
- **Submit Action**: `Form submission`

##### Modal 52: `#modal-new-announcement` — Post
- **Container ID**: `#modal-new-announcement`
- **Submit Action**: `Form submission`

##### Modal 53: `#modal-announcement-text` — Modal Dialog
- **Container ID**: `#modal-announcement-text`
- **Submit Action**: `Form submission`

##### Modal 54: `#modal-attachment-preview` — Modal Dialog
- **Container ID**: `#modal-attachment-preview`
- **Submit Action**: `Form submission`

#### 📡 Backend REST API Contracts (35 Integrated)
| Method | Endpoint | Type | Purpose / Trigger |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/logout` | `REST` | Core academic service call |
| `GET` | `/api/v1/auth/me` | `REST` | Core academic service call |
| `GET` | `/api/v1/auth/heartbeat` | `REST` | Core academic service call |
| `GET` | `/api/v1/notifications` | `REST` | Core academic service call |
| `PUT` | `/api/v1/notifications/:id/read` | `REST` | Core academic service call |
| `PUT` | `/api/v1/notifications/mark-all-read` | `REST` | Core academic service call |
| `GET` | `/attendance/registers/` | `INTERNAL` | Core academic service call |
| `GET` | `/teaching-groups/` | `REST` | Core academic service call |
| `GET` | `/api/v1` | `REST` | Core academic service call |
| `POST` | `/teaching-groups/` | `REST` | Core academic service call |
| `DELETE` | `/teaching-groups/` | `REST` | Core academic service call |
| `PUT` | `/teaching-groups/` | `REST` | Core academic service call |
| `GET` | `/api/v1/teaching-groups/` | `REST` | Core academic service call |
| `POST` | `/api/v1/teaching-groups/:id/units` | `REST` | Core academic service call |
| `POST` | `/api/v1/teaching-groups/` | `REST` | Core academic service call |
| `PUT` | `/api/v1/teaching-groups/` | `REST` | Core academic service call |
| `POST` | `/api/v1/assignments/:id/submit` | `REST` | Core academic service call |
| `POST` | `/api/v1/assignments/:id/unsubmit` | `REST` | Core academic service call |
| `PUT` | `/api/v1/faculty/session-header` | `REST` | Core academic service call |
| `PUT` | `/api/v1/teaching-groups/:id/tests/:id` | `REST` | Core academic service call |
| `POST` | `/api/v1/teaching-groups/:id/tests/:id/export/:id` | `REST` | Core academic service call |
| `GET` | `/faculty/registers` | `REST` | Core academic service call |
| `GET` | `/faculty/registers/` | `REST` | Core academic service call |
| `PUT` | `/api/v1/faculty/registers/:id/mark-cell` | `REST` | Core academic service call |
| `POST` | `/api/v1/faculty/registers/:id/sessions` | `REST` | Core academic service call |
| `DELETE` | `/api/v1/faculty/registers/:id/sessions/:id` | `REST` | Core academic service call |
| `GET` | `/api/v1/attendance/registers/:id/esp32-day-scans` | `REST` | Core academic service call |
| `POST` | `/api/v1/attendance/registers/:id/confirm-day-attendance` | `REST` | Core academic service call |
| `PUT` | `/api/v1/faculty/registers/:id/student-status` | `REST` | Core academic service call |
| `GET` | `/api/v1/faculty/registers/:id/sessions` | `REST` | Core academic service call |
| `PUT` | `/api/v1/attendance/sessions/:id/state` | `REST` | Core academic service call |
| `POST` | `/api/v1/attendance/sessions/:id/pin` | `REST` | Core academic service call |
| `POST` | `/api/v1/attendance/sessions/:id/qr` | `REST` | Core academic service call |
| `GET` | `/api/v1/attendance/sessions/:id/self-attendance` | `REST` | Core academic service call |
| `POST` | `/api/v1/faculty/registers/:id/export/attendance` | `REST` | Core academic service call |

---

### FAC-005: Office Studio — Institutional Spreadsheets & Documents Hub

- **URL Route**: `/faculty/sheets/index.html (aliased /faculty/sheets.html)`
- **Source File**: [frontend/faculty/sheets/index.html](file:///e:/uiap/VidyaOS/frontend/faculty/sheets/index.html)
- **Target Role**: `Faculty`
- **Shell & Styling**: VidyaOS Semantic Shell (`variables.css`, `header.js`, `sidebar.js`)
- **Responsive States**: Desktop: clean dual-hub cards layout; Mobile: responsive card feed
- **URL Parameters**: `groupId`, `group_id`, `id`, `registerId`, `register_id`, `register`, `view`, `sheet`

#### 🎯 Purpose & Academic Workflow
Office Studio Subjects & Documents Start Hub: Subject cards, recent workbooks list, quick templates, search, and deep-link routing

#### 🔘 Action Buttons & Interactive Controls (8 Cataloged)
| Button ID | Label / Text | Class / Variant | Action / Behavior |
| :--- | :--- | :--- | :--- |
| `#faculty-nav-toggle` | =769&&typeof toggleDesktopSidebar==='function')... | `header-nav-toggle-btn` | Event handler bound |
| `#theme-toggle-btn` | Toggle Dark/Light Mode | `header-icon-btn header-theme-toggle` | toggleAppTheme() |
| `#header-bell-btn` | 0 | `header-icon-btn header-bell-btn` | toggleNotifications(event) |
| `#null` | Mark all read | `notif-mark-all-btn` | markAllNotificationsAsRead(event) |
| `#header-user-profile` | RS | `header-profile-round-btn gc-user-avatar` | toggleUserProfile(event) |
| `#null` | Sign Out | `profile-dropdown-item dropdown-logout-btn` | if(typeof confirmFacultyLogout=== |
| `#btn-office-open-file` | Open File | `btn btn-outline-secondary btn-sm` | triggerExcelImport() |
| `#null` | Spreadsheet Editor → | `btn btn-primary btn-sm` | closeOfficeHomeScreen() |

#### 📝 Form Inputs & Dropdown Selectors (2 Cataloged)
| Control ID | Type | Name / Purpose | Placeholder / Options | Required |
| :--- | :--- | :--- | :--- | :--- |
| `#excel-file-importer` | `file` | Input | `None` | No |
| `#office-subject-search` | `text` | Input | `Search your subjects, classes, or templates...` | No |

#### 🪟 Modals, Dialogs & Drawers (0 Cataloged)
*No overlay modals on this page; all workflows occur inline or via full-page transitions.*

#### 📡 Backend REST API Contracts (7 Integrated)
| Method | Endpoint | Type | Purpose / Trigger |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/logout` | `REST` | Core academic service call |
| `GET` | `/api/v1/auth/me` | `REST` | Core academic service call |
| `GET` | `/api/v1/auth/heartbeat` | `REST` | Core academic service call |
| `GET` | `/api/v1/notifications` | `REST` | Core academic service call |
| `PUT` | `/api/v1/notifications/:id/read` | `REST` | Core academic service call |
| `PUT` | `/api/v1/notifications/mark-all-read` | `REST` | Core academic service call |
| `GET` | `/teaching-groups` | `REST` | Core academic service call |

---

### FAC-007: Students Management — VidyaOS

- **URL Route**: `/faculty/students/index.html`
- **Source File**: [frontend/faculty/students/index.html](file:///e:/uiap/VidyaOS/frontend/faculty/students/index.html)
- **Target Role**: `Faculty`
- **Shell & Styling**: VidyaOS Semantic Shell (`variables.css`, `header.js`, `sidebar.js`)
- **Responsive States**: Desktop: 6-column table (Avatar, Roll #, Registration No, Enrollment, Student Name with status chip, 3-dot menu with View/Transfer/Withdraw/Reactivate/Reset/Remove); Mobile: 4-column compact table (Avatar, Roll #, Student Name, 3-dot menu) with zero overflow

#### 🎯 Purpose & Academic Workflow
Department student roster, cohort management, roll number sequencing, self-registration, 30-day trash recovery, student transfer and withdrawal workflows with zero data loss, and student profile dossier modal

#### 🔘 Action Buttons & Interactive Controls (38 Cataloged)
| Button ID | Label / Text | Class / Variant | Action / Behavior |
| :--- | :--- | :--- | :--- |
| `#null` | Trash Bin 0 | `btn-trash-header` | switchToTrashTab() |
| `#null` | All Years 0 | `stu-pill active` | Event handler bound |
| `#null` | 1st Year 0 | `stu-pill` | Event handler bound |
| `#null` | 2nd Year 0 | `stu-pill` | Event handler bound |
| `#null` | 3rd Year 0 | `stu-pill` | Event handler bound |
| `#pill-inactive` | Inactive 0 | `stu-pill` | Event handler bound |
| `#pill-pending` | Pending 0 | `stu-pill` | Event handler bound |
| `#pill-trash` | Trash 0 | `stu-pill pill-trash` | Event handler bound |
| `#null` | Add Student | `btn-stu-compact` | openAddStudentModal() |
| `#null` | Bulk CSV | `btn-stu-outline` | openBulkModal() |
| `#null` | Re-Index | `btn-stu-outline btn-reindex` | reindexRoll() |
| `#null` | Restore Selected | `btn-stu-compact btn-bulk-restore` | confirmBulkRestore() |
| `#null` | Delete Permanently | `btn-stu-compact danger btn-bulk-delete` | confirmBulkPermanentDelete() |
| `#null` | Clear | `btn-stu-outline` | clearTrashSelection() |
| `#null` | &times; | `btn-modal-close` | closeStudentDetailsModal() |
| `#null` | Profile Info | `stu-modal-tab active` | switchDetailTab( |
| `#null` | Academic Record | `stu-modal-tab` | switchDetailTab( |
| `#null` | Attendance | `stu-modal-tab` | switchDetailTab( |
| `#null` | Contact &amp; Status | `stu-modal-tab` | switchDetailTab( |
| `#detail-btn-delete` | Remove Student | `btn-stu-compact danger` | detailDeleteStudent() |
| `#null` | Reset Password | `btn-stu-outline` | detailResetPassword() |
| `#null` | Close | `btn-stu-outline` | closeStudentDetailsModal() |
| `#detail-btn-transfer` | Transfer | `btn-stu-outline` | detailTransferStudent() |
| `#detail-btn-withdraw` | Withdraw | `btn-stu-outline` | detailWithdrawStudent() |
| `#detail-btn-reactivate` | Re-Activate | `btn-stu-compact` | detailReactivateStudent() |
| `#detail-btn-edit` | Edit Student | `btn-stu-compact` | setStudentModalEditMode(true) |
| `#null` | Cancel | `btn-stu-compact-cancel` | setStudentModalEditMode(false) |
| `#btn-save-edit-student` | Save Changes | `btn-stu-compact-save` | Event handler bound |
| `#null` | &times; | `btn-modal-close` | closeAddStudentModal() |
| `#null` | Cancel | `btn-stu-outline` | closeAddStudentModal() |
| `#null` | Enroll Student | `btn-stu-compact` | Event handler bound |
| `#null` | &times; | `btn-modal-close` | closeBulkModal() |
| `#null` | Cancel | `btn-stu-outline` | closeBulkModal() |
| `#null` | Import Students | `btn-stu-compact` | Event handler bound |
| `#null` | &times; | `btn-modal-close` | closeTrashConfirmModal() |
| `#null` | Cancel | `btn-stu-outline` | closeTrashConfirmModal() |
| `#trash-confirm-btn` | Confirm | `btn-stu-compact` | Event handler bound |
| `#null` | View Roster | `btn-stu-compact` | closeBulkSuccessModal() |

#### 📝 Form Inputs & Dropdown Selectors (18 Cataloged)
| Control ID | Type | Name / Purpose | Placeholder / Options | Required |
| :--- | :--- | :--- | :--- | :--- |
| `#toggle-student-reg` | `checkbox` | Input | `None` | No |
| `#student-search` | `search` | Input | `Search by name, roll, UBTER roll no...` | No |
| `#check-all-trash` | `checkbox` | Input | `None` | No |
| `#edit-stu-id` | `hidden` | Input | `None` | No |
| `#edit-stu-name` | `text` | Input | `Full Name` | No |
| `#edit-chk-enroll-not-available` | `checkbox` | Input | `None` | No |
| `#edit-stu-enroll` | `text` | Input | `11-digit numeric` | No |
| `#edit-stu-reg` | `text` | Input | `e.g. 24101054001` | No |
| `#edit-stu-roll` | `text` | Input | `01` | No |
| `#add-stu-name` | `text` | Input | `e.g. Aarav Sharma` | No |
| `#add-stu-roll` | `number` | Input | `1` | No |
| `#add-stu-enroll` | `text` | Input | `24011090008` | No |
| `#add-stu-reg` | `text` | Input | `24101054001` | No |
| `#add-stu-email` | `email` | Input | `student@college.edu` | No |
| `#add-stu-phone` | `tel` | Input | `9876543210` | No |
| `#edit-stu-sem` | `select` | Dropdown | Dynamic options | No |
| `#edit-stu-status` | `select` | Dropdown | Dynamic options | No |
| `#add-stu-sem` | `select` | Dropdown | Dynamic options | No |

#### 🪟 Modals, Dialogs & Drawers (7 Cataloged)
##### Modal 1: `#modal-student-details` — Student Profile: Student
- **Container ID**: `#modal-student-details`
- **Submit Action**: `Form submission`

##### Modal 2: `#detail-modal-tabs` — Modal Dialog
- **Container ID**: `#detail-modal-tabs`
- **Submit Action**: `Form submission`

##### Modal 3: `#detail-stu-avatar` — Modal Dialog
- **Container ID**: `#detail-stu-avatar`
- **Submit Action**: `Form submission`

##### Modal 4: `#modal-add-student` — Modal Dialog
- **Container ID**: `#modal-add-student`
- **Submit Action**: `Form submission`

##### Modal 5: `#modal-bulk-csv` — Modal Dialog
- **Container ID**: `#modal-bulk-csv`
- **Submit Action**: `Form submission`

##### Modal 6: `#modal-trash-confirm` — Modal Dialog
- **Container ID**: `#modal-trash-confirm`
- **Submit Action**: `Form submission`

##### Modal 7: `#modal-bulk-success` — Modal Dialog
- **Container ID**: `#modal-bulk-success`
- **Submit Action**: `Form submission`

#### 📡 Backend REST API Contracts (7 Integrated)
| Method | Endpoint | Type | Purpose / Trigger |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/logout` | `REST` | Core academic service call |
| `GET` | `/api/v1/auth/me` | `REST` | Core academic service call |
| `GET` | `/api/v1/auth/heartbeat` | `REST` | Core academic service call |
| `GET` | `/api/v1/notifications` | `REST` | Core academic service call |
| `PUT` | `/api/v1/notifications/:id/read` | `REST` | Core academic service call |
| `PUT` | `/api/v1/notifications/mark-all-read` | `REST` | Core academic service call |
| `GET` | `/api/v1:id` | `REST` | Core academic service call |

---

### FAC-009: Create Classwork - VidyaOS

- **URL Route**: `/faculty/classwork/create.html`
- **Source File**: [frontend/faculty/classwork/create/index.html](file:///e:/uiap/VidyaOS/frontend/faculty/classwork/create/index.html)
- **Target Role**: `Faculty`
- **Shell & Styling**: Classroom Shell (`classroom-nav.css`, `nav.js`)
- **Responsive States**: Desktop: structured 2-column form (content + settings); Mobile: single-column form with sticky save bar
- **URL Parameters**: `type`, `group`, `groupId`, `id`, `register`, `registerId`

#### 🎯 Purpose & Academic Workflow
Create assignments, materials, quizzes, and deadlines

#### 🔘 Action Buttons & Interactive Controls (27 Cataloged)
| Button ID | Label / Text | Class / Variant | Action / Behavior |
| :--- | :--- | :--- | :--- |
| `#cw-btn-back` | Cancel and close | `cw-close-btn` | Event handler bound |
| `#cw-btn-cancel` | Cancel | `btn-gclass-cancel` | window.cwHandleCancel() |
| `#cw-btn-publish` | Assign | `btn-gclass-assign` | window.cwHandlePublish() |
| `#null` | Add Syllabus Unit | `cw-add-unit-mini-btn` | window.cwOpenAddUnitModal() |
| `#null` | Icon Button | `cw-collapse-icon-btn` | Event handler bound |
| `#null` | B | `cw-tool-btn` | window.cwFormatText( |
| `#null` | I | `cw-tool-btn` | window.cwFormatText( |
| `#null` | U | `cw-tool-btn` | window.cwFormatText( |
| `#null` | Add numbered line | `cw-tool-btn` | window.cwFormatText( |
| `#null` | Insert Template | `cw-tool-chip` | window.cwInsertInstructionTemplate() |
| `#null` | Clear instructions | `cw-tool-btn` | window.cwClearInstructions() |
| `#null` | Reset Numbers | `cw-tool-chip` | window.cwResetQuestionSlots() |
| `#null` | Clear questions | `cw-tool-btn` | window.cwClearText() |
| `#btn-attach-doc` | Upload File | `cw-attach-pill-btn` | window.cwTriggerAttachDoc() |
| `#btn-ocr-scan` | Scan Paper (OCR) | `cw-attach-pill-btn` | window.cwOpenOcrModal() |
| `#null` | Remove attachment | `cw-att-remove-btn` | window.cwRemoveAttachedDoc() |
| `#btn-due-date-trigger` | No due date | `cw-due-btn` | window.cwOpenDueDateModal() |
| `#btn-due-date-clear` | Remove due date | `cw-due-clear-btn` | window.cwClearDueDate(event) |
| `#null` | Close | `cw-modal-close` | window.cwCloseOcrModal() |
| `#null` | Cancel | `btn-gclass-cancel` | window.cwCloseOcrModal() |
| `#btn-ingest-ocr` | Ingest Questions | `btn-gclass-assign` | window.cwIngestOcrQuestions() |
| `#null` | Close | `cw-modal-close` | window.cwCloseAddUnitModal() |
| `#null` | Cancel | `btn-gclass-cancel` | window.cwCloseAddUnitModal() |
| `#btn-submit-add-unit` | Add Unit | `btn-gclass-assign` | window.cwSubmitAddUnit() |
| `#null` | Close | `cw-modal-close` | window.cwCloseDueDateModal() |
| `#null` | Cancel | `btn-gclass-cancel` | window.cwCloseDueDateModal() |
| `#null` | Save | `btn-gclass-assign` | window.cwSaveDueDateModal() |

#### 📝 Form Inputs & Dropdown Selectors (14 Cataloged)
| Control ID | Type | Name / Purpose | Placeholder / Options | Required |
| :--- | :--- | :--- | :--- | :--- |
| `#work-number` | `number` | Input | `None` | No |
| `#work-title` | `text` | Input | `Title` | No |
| `#work-questions-count` | `number` | Input | `None` | No |
| `#input-attach-doc` | `file` | Input | `None` | No |
| `#work-course-select` | `hidden` | Input | `None` | No |
| `#work-max-marks` | `number` | Input | `None` | No |
| `#work-due-date` | `hidden` | Input | `None` | No |
| `#input-ocr-file` | `file` | Input | `None` | No |
| `#unit-modal-tag` | `text` | Input | `Unit 6` | No |
| `#unit-modal-title` | `text` | Input | `e.g. Basics and Language Features` | No |
| `#modal-due-date-input` | `date` | Input | `None` | No |
| `#modal-due-time-input` | `time` | Input | `None` | No |
| `#modal-due-close-submissions` | `checkbox` | Input | `None` | No |
| `#work-unit` | `select` | Dropdown | Dynamic options | No |

#### 🪟 Modals, Dialogs & Drawers (7 Cataloged)
##### Modal 1: `#ocr-scanner-modal` — Smart Question Paper OCR
- **Container ID**: `#ocr-scanner-modal`
- **Submit Action**: `Form submission`

##### Modal 2: `#ocr-dropzone` — Modal Dialog
- **Container ID**: `#ocr-dropzone`
- **Submit Action**: `Form submission`
- **Contained Fields**: `input-ocr-file`

##### Modal 3: `#btn-ingest-ocr` — Modal Dialog
- **Container ID**: `#btn-ingest-ocr`
- **Submit Action**: `Form submission`

##### Modal 4: `#modal-add-unit` — Modal Dialog
- **Container ID**: `#modal-add-unit`
- **Submit Action**: `Form submission`

##### Modal 5: `#unit-modal-tag` — Modal Dialog
- **Container ID**: `#unit-modal-tag`
- **Submit Action**: `Form submission`
- **Contained Fields**: `unit-modal-tag`

##### Modal 6: `#btn-submit-add-unit` — Modal Dialog
- **Container ID**: `#btn-submit-add-unit`
- **Submit Action**: `window.cwCloseAddUnitModal()`

##### Modal 7: `#modal-set-due-date` — Set due date
- **Container ID**: `#modal-set-due-date`
- **Submit Action**: `Form submission`

#### 📡 Backend REST API Contracts (10 Integrated)
| Method | Endpoint | Type | Purpose / Trigger |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/logout` | `REST` | Core academic service call |
| `GET` | `/api/v1/auth/me` | `REST` | Core academic service call |
| `GET` | `/api/v1/auth/heartbeat` | `REST` | Core academic service call |
| `GET` | `/api/v1/teaching-groups/:id` | `REST` | Core academic service call |
| `GET` | `/api/v1/teaching-groups/:id/tests` | `REST` | Core academic service call |
| `GET` | `/api/v1/teaching-groups/:id/assignments` | `REST` | Core academic service call |
| `POST` | `/api/v1/teaching-groups/:id/units` | `REST` | Core academic service call |
| `POST` | `/api/v1/ocr/extract-questions` | `REST` | Core academic service call |
| `POST` | `/api/v1/exams` | `REST` | Core academic service call |
| `POST` | `/api/v1/teaching-groups/:id/assignments` | `REST` | Core academic service call |

---

### FAC-011: Leave Requests — Faculty Portal

- **URL Route**: `/faculty/leave-approvals.html`
- **Source File**: [frontend/faculty/leave-approvals/index.html](file:///e:/uiap/VidyaOS/frontend/faculty/leave-approvals/index.html)
- **Target Role**: `Faculty`
- **Shell & Styling**: Classroom Shell (`classroom-nav.css`, `nav.js`)
- **Responsive States**: Desktop: side-by-side pending/approved tabs; Mobile: card feed with action buttons

#### 🎯 Purpose & Academic Workflow
Student medical and duty leave approval workflow

#### 🔘 Action Buttons & Interactive Controls (11 Cataloged)
| Button ID | Label / Text | Class / Variant | Action / Behavior |
| :--- | :--- | :--- | :--- |
| `#null` | Pending 3 | `leave-tab-btn active` | filterByStatus( |
| `#null` | Approved 12 | `leave-tab-btn` | filterByStatus( |
| `#null` | Rejected 4 | `leave-tab-btn` | filterByStatus( |
| `#null` | All | `leave-tab-btn` | filterByStatus( |
| `#null` | Filter | `leave-filter-action-btn` | toggleAdvancedFilter() |
| `#page-prev-btn` | ‹ | `leave-page-nav-btn` | prevPage() |
| `#page-num-btn` | 1 | `leave-page-num-btn active` | Event handler bound |
| `#page-next-btn` | › | `leave-page-nav-btn` | nextPage() |
| `#null` | Cancel | `btn btn-secondary leave-alert-btn` | closeRejectModal() |
| `#confirm-reject-btn` | Reject Application | `btn btn-danger leave-alert-btn` | confirmReject() |
| `#leave-alert-ok-btn` | OK | `btn btn-primary leave-alert-btn` | closeLeaveAlert(true) |

#### 📝 Form Inputs & Dropdown Selectors (2 Cataloged)
| Control ID | Type | Name / Purpose | Placeholder / Options | Required |
| :--- | :--- | :--- | :--- | :--- |
| `#leave-search-input` | `text` | Input | `Search by student name, roll no...` | No |
| `#leave-select-all` | `checkbox` | Input | `None` | No |

#### 🪟 Modals, Dialogs & Drawers (2 Cataloged)
##### Modal 1: `#leave-rejection-modal` — Modal Dialog
- **Container ID**: `#leave-rejection-modal`
- **Submit Action**: `Form submission`

##### Modal 2: `#leave-alert-modal` — Modal Dialog
- **Container ID**: `#leave-alert-modal`
- **Submit Action**: `Form submission`

#### 📡 Backend REST API Contracts (6 Integrated)
| Method | Endpoint | Type | Purpose / Trigger |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/logout` | `REST` | Core academic service call |
| `GET` | `/api/v1/auth/me` | `REST` | Core academic service call |
| `GET` | `/api/v1/auth/heartbeat` | `REST` | Core academic service call |
| `GET` | `/api/v1/notifications` | `REST` | Core academic service call |
| `PUT` | `/api/v1/notifications/:id/read` | `REST` | Core academic service call |
| `PUT` | `/api/v1/notifications/mark-all-read` | `REST` | Core academic service call |

---

### FAC-012: Course File Preparation (NBA/NAAC) — VidyaOS

- **URL Route**: `/faculty/course-file.html`
- **Source File**: [frontend/faculty/course-file/index.html](file:///e:/uiap/VidyaOS/frontend/faculty/course-file/index.html)
- **Target Role**: `Faculty`
- **Shell & Styling**: Classroom Shell (`classroom-nav.css`, `nav.js`)
- **Responsive States**: Desktop: syllabus checklist + document previews; Mobile: file list with upload buttons
- **URL Parameters**: `group_id`, `groupId`, `class_id`, `classId`, `id`, `subject_id`, `subjectId`, `register_id`, `registerId`, `type`, `tab`, `doc`, `action`

#### 🎯 Purpose & Academic Workflow
NBA/NAAC course compliance file compilation

#### 🔘 Action Buttons & Interactive Controls (23 Cataloged)
| Button ID | Label / Text | Class / Variant | Action / Behavior |
| :--- | :--- | :--- | :--- |
| `#btn-combine-export` | Combine &amp; Export All | `btn btn-primary btn-combine-export` | openCombineExportModal() |
| `#null` | Print Dossier Index | `btn btn-outline` | printDossierIndex() |
| `#null` | HOD Audit Verification | `btn btn-outline` | openHodAuditModal() |
| `#null` | All 18 Documents 18 | `cf-tab-pill active` | setCategoryFilter( |
| `#null` | Curriculum &amp; Syllabus 7 | `cf-tab-pill` | setCategoryFilter( |
| `#null` | Students &amp; Diagnostics 4 | `cf-tab-pill` | setCategoryFilter( |
| `#null` | Assessments &amp; Schedules 5 | `cf-tab-pill` | setCategoryFilter( |
| `#null` | Review &amp; Attainment 2 | `cf-tab-pill` | setCategoryFilter( |
| `#null` | &times; | `modal-close` | closeModal( |
| `#null` | Cancel | `btn btn-outline` | closeModal( |
| `#btn-submit-upload` | Upload Document | `btn btn-primary` | Event handler bound |
| `#null` | Print Student List | `btn btn-sm btn-primary` | printStudentRoster() |
| `#null` | Upload Signed / Certified PDF Roster (Optional) | `btn btn-outline` | openDirectUploadModal( |
| `#null` | Close | `btn btn-primary` | closeModal( |
| `#null` | Print Schedule | `btn btn-sm btn-primary` | printAssignmentSchedule() |
| `#null` | Upload Signed Tutorial Schedule PDF (Optional) | `btn btn-outline` | openDirectUploadModal( |
| `#null` | Upload Signed PDF | `btn btn-outline` | openDirectUploadModal( |
| `#null` | Save Evaluation Plan | `btn btn-primary` | Event handler bound |
| `#null` | Upload CO-PO PDF | `btn btn-outline` | openDirectUploadModal( |
| `#null` | Save Outcomes &amp; Matrix | `btn btn-primary` | saveCopoData() |
| `#btn-learners-upload-pdf` | Upload Formal PDF Report | `btn btn-outline` | Event handler bound |
| `#null` | Submit Audit Sign-Off | `btn btn-primary` | Event handler bound |
| `#btn-start-merge-export` | ⏳ Merge &amp; Download PDF | `btn btn-primary` | executeCombineExport() |

#### 📝 Form Inputs & Dropdown Selectors (14 Cataloged)
| Control ID | Type | Name / Purpose | Placeholder / Options | Required |
| :--- | :--- | :--- | :--- | :--- |
| `#cf-search-input` | `text` | Input | `Search course file document or keyword...` | No |
| `#cf-hidden-file-input` | `file` | Input | `None` | No |
| `#upload-item-key` | `hidden` | Input | `None` | No |
| `#upload-doc-title` | `text` | Input | `None` | No |
| `#upload-file-field` | `file` | Input | `None` | No |
| `#eval-midsem` | `number` | Input | `None` | No |
| `#eval-assignments` | `number` | Input | `None` | No |
| `#eval-lab` | `number` | Input | `None` | No |
| `#eval-attendance` | `number` | Input | `None` | No |
| `#scope-current-module` | `radio` | export-merge-scope | `None` | No |
| `#scope-all-modules` | `radio` | export-merge-scope | `None` | No |
| `#select-class-switch` | `select` | Dropdown | Dynamic options | No |
| `#select-dossier-type` | `select` | Dropdown | Dynamic options | No |
| `#audit-decision-status` | `select` | Dropdown | Dynamic options | No |

#### 🪟 Modals, Dialogs & Drawers (24 Cataloged)
##### Modal 1: `#modal-upload-doc` — Modal Dialog
- **Container ID**: `#modal-upload-doc`
- **Submit Action**: `Form submission`

##### Modal 2: `#upload-modal-title` — Upload Course File Document
- **Container ID**: `#upload-modal-title`
- **Submit Action**: `Form submission`

##### Modal 3: `#upload-doc-title` — Modal Dialog
- **Container ID**: `#upload-doc-title`
- **Submit Action**: `Form submission`
- **Contained Fields**: `upload-doc-title`

##### Modal 4: `#btn-submit-upload` — Modal Dialog
- **Container ID**: `#btn-submit-upload`
- **Submit Action**: `closeModal(`

##### Modal 5: `#modal-pdf-preview` — Modal Dialog
- **Container ID**: `#modal-pdf-preview`
- **Submit Action**: `Form submission`

##### Modal 6: `#preview-modal-title` — Document Preview
- **Container ID**: `#preview-modal-title`
- **Submit Action**: `Form submission`

##### Modal 7: `#pdf-preview-frame` — Modal Dialog
- **Container ID**: `#pdf-preview-frame`
- **Submit Action**: `Form submission`

##### Modal 8: `#modal-student-roster` — Modal Dialog
- **Container ID**: `#modal-student-roster`
- **Submit Action**: `Form submission`

##### Modal 9: `#roster-count-badge` — Modal Dialog
- **Container ID**: `#roster-count-badge`
- **Submit Action**: `Form submission`

##### Modal 10: `#modal-assignment-schedule` — Modal Dialog
- **Container ID**: `#modal-assignment-schedule`
- **Submit Action**: `Form submission`

##### Modal 11: `#schedule-count-badge` — Modal Dialog
- **Container ID**: `#schedule-count-badge`
- **Submit Action**: `Form submission`

##### Modal 12: `#modal-evaluation-scheme` — Modal Dialog
- **Container ID**: `#modal-evaluation-scheme`
- **Submit Action**: `Form submission`

##### Modal 13: `#eval-midsem` — Modal Dialog
- **Container ID**: `#eval-midsem`
- **Submit Action**: `Form submission`
- **Contained Fields**: `eval-midsem`

##### Modal 14: `#modal-copo-matrix` — Modal Dialog
- **Container ID**: `#modal-copo-matrix`
- **Submit Action**: `Form submission`

##### Modal 15: `#co-list-inputs` — Course Outcomes
          (CO1
          - CO6)
- **Container ID**: `#co-list-inputs`
- **Submit Action**: `Form submission`

##### Modal 16: `#modal-learners-view` — Modal Dialog
- **Container ID**: `#modal-learners-view`
- **Submit Action**: `Form submission`

##### Modal 17: `#learners-modal-title` — Student Diagnostic Roster
- **Container ID**: `#learners-modal-title`
- **Submit Action**: `Form submission`

##### Modal 18: `#tbody-learners-roster` — Modal Dialog
- **Container ID**: `#tbody-learners-roster`
- **Submit Action**: `Form submission`

##### Modal 19: `#btn-learners-upload-pdf` — Modal Dialog
- **Container ID**: `#btn-learners-upload-pdf`
- **Submit Action**: `Form submission`

##### Modal 20: `#modal-hod-audit` — Modal Dialog
- **Container ID**: `#modal-hod-audit`
- **Submit Action**: `Form submission`

##### Modal 21: `#audit-decision-status` — Modal Dialog
- **Container ID**: `#audit-decision-status`
- **Submit Action**: `Form submission`

##### Modal 22: `#modal-combine-export` — Modal Dialog
- **Container ID**: `#modal-combine-export`
- **Submit Action**: `Form submission`

##### Modal 23: `#scope-current-module` — Modal Dialog
- **Container ID**: `#scope-current-module`
- **Submit Action**: `Form submission`
- **Contained Fields**: `scope-current-module`

##### Modal 24: `#btn-start-merge-export` — Modal Dialog
- **Container ID**: `#btn-start-merge-export`
- **Submit Action**: `closeModal(`

#### 📡 Backend REST API Contracts (14 Integrated)
| Method | Endpoint | Type | Purpose / Trigger |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/logout` | `REST` | Core academic service call |
| `GET` | `/api/v1/auth/me` | `REST` | Core academic service call |
| `GET` | `/api/v1/auth/heartbeat` | `REST` | Core academic service call |
| `GET` | `/api/v1/notifications` | `REST` | Core academic service call |
| `PUT` | `/api/v1/notifications/:id/read` | `REST` | Core academic service call |
| `PUT` | `/api/v1/notifications/mark-all-read` | `REST` | Core academic service call |
| `GET` | `/api/v1` | `REST` | Core academic service call |
| `GET` | `/teaching-groups` | `REST` | Core academic service call |
| `GET` | `/course-files` | `INTERNAL` | Core academic service call |
| `POST` | `/api/v1/course-files/:id/documents:id` | `REST` | Core academic service call |
| `DELETE` | `/course-files/:id/documents/:id:id` | `INTERNAL` | Core academic service call |
| `PUT` | `/course-files/:id/evaluation-scheme` | `INTERNAL` | Core academic service call |
| `PUT` | `/course-files/:id/structured-data` | `INTERNAL` | Core academic service call |
| `POST` | `/course-files/:id/audit` | `INTERNAL` | Core academic service call |

---

### FAC-013: Faculty Drive & Media Vault — VidyaOS

- **URL Route**: `/faculty/media.html`
- **Source File**: [frontend/faculty/media/index.html](file:///e:/uiap/VidyaOS/frontend/faculty/media/index.html)
- **Target Role**: `Faculty`
- **Shell & Styling**: Classroom Shell (`classroom-nav.css`, `nav.js`)
- **Responsive States**: Desktop: responsive thumbnail grid; Mobile: list view with tap-to-download
- **URL Parameters**: `action`

#### 🎯 Purpose & Academic Workflow
Lecture notes, syllabus PDFs, lab manual file repository

#### 🔘 Action Buttons & Interactive Controls (13 Cataloged)
| Button ID | Label / Text | Class / Variant | Action / Behavior |
| :--- | :--- | :--- | :--- |
| `#null` | Refresh | `btn btn-secondary btn-sm` | loadMediaAssets() |
| `#null` | Upload File | `btn btn-primary` | openUploadModal() |
| `#null` | All Files 0 | `chip-btn active` | selectCategory( |
| `#null` | Documents &amp; Slides 0 | `chip-btn` | selectCategory( |
| `#null` | Videos &amp; Demos 0 | `chip-btn` | selectCategory( |
| `#null` | Images &amp; Whiteboards 0 | `chip-btn` | selectCategory( |
| `#null` | Student Documents 0 | `chip-btn` | selectCategory( |
| `#btn-view-grid` | Grid View | `view-toggle-btn active` | setViewMode( |
| `#btn-view-list` | List View | `view-toggle-btn` | setViewMode( |
| `#null` | &times; | `btn-close-simple` | closeUploadModal() |
| `#null` | Cancel | `btn btn-secondary` | closeUploadModal() |
| `#btn-submit-upload` | Upload File | `btn btn-primary` | Event handler bound |
| `#null` | &times; | `btn-close-simple` | closePreviewModal() |

#### 📝 Form Inputs & Dropdown Selectors (9 Cataloged)
| Control ID | Type | Name / Purpose | Placeholder / Options | Required |
| :--- | :--- | :--- | :--- | :--- |
| `#drive-search-input` | `text` | Input | `Search by title, tag, or topic...` | No |
| `#file-input` | `file` | Input | `None` | No |
| `#upload-title` | `text` | Input | `e.g. Unit 2 Normalization Slides` | No |
| `#upload-tags` | `text` | Input | `e.g. unit2, midterm, lab5` | No |
| `#upload-public` | `checkbox` | Input | `None` | No |
| `#omnisearch-input` | `text` | Input | `Type to search media, documents, students, or registers...` | No |
| `#drive-subject-select` | `select` | Dropdown | Dynamic options | No |
| `#upload-category` | `select` | Dropdown | Dynamic options | No |
| `#upload-subject` | `select` | Dropdown | Dynamic options | No |

#### 🪟 Modals, Dialogs & Drawers (3 Cataloged)
##### Modal 1: `#upload-modal` — Modal Dialog
- **Container ID**: `#upload-modal`
- **Submit Action**: `Form submission`

##### Modal 2: `#btn-submit-upload` — Modal Dialog
- **Container ID**: `#btn-submit-upload`
- **Submit Action**: `closeUploadModal()`

##### Modal 3: `#preview-modal` — File Preview
- **Container ID**: `#preview-modal`
- **Submit Action**: `Form submission`

#### 📡 Backend REST API Contracts (11 Integrated)
| Method | Endpoint | Type | Purpose / Trigger |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/logout` | `REST` | Core academic service call |
| `GET` | `/api/v1/auth/me` | `REST` | Core academic service call |
| `GET` | `/api/v1/auth/heartbeat` | `REST` | Core academic service call |
| `GET` | `/api/v1/notifications` | `REST` | Core academic service call |
| `PUT` | `/api/v1/notifications/:id/read` | `REST` | Core academic service call |
| `PUT` | `/api/v1/notifications/mark-all-read` | `REST` | Core academic service call |
| `GET` | `/teaching-groups` | `REST` | Core academic service call |
| `GET` | `/media:id` | `INTERNAL` | Core academic service call |
| `DELETE` | `/media/:id` | `INTERNAL` | Core academic service call |
| `GET` | `/media/search/omni` | `INTERNAL` | Core academic service call |
| `GET` | `/media/:id` | `INTERNAL` | Core academic service call |

---

### FAC-014: Faculty Profile — VidyaOS

- **URL Route**: `/faculty/profile.html`
- **Source File**: [frontend/faculty/profile/index.html](file:///e:/uiap/VidyaOS/frontend/faculty/profile/index.html)
- **Target Role**: `Faculty`
- **Shell & Styling**: Classroom Shell (`classroom-nav.css`, `nav.js`)
- **Responsive States**: Desktop: 2-column profile layout; Mobile: stacked card form

#### 🎯 Purpose & Academic Workflow
Faculty profile, qualifications, active devices, password management

#### 🔘 Action Buttons & Interactive Controls (7 Cataloged)
| Button ID | Label / Text | Class / Variant | Action / Behavior |
| :--- | :--- | :--- | :--- |
| `#tab-btn-overview` | Overview | `prof-tab active` | Event handler bound |
| `#tab-btn-edit` | Edit Profile | `prof-tab` | Event handler bound |
| `#tab-btn-security` | Security | `prof-tab` | Event handler bound |
| `#btn-google-action` | Re-link | `btn-outline` | handleGoogleLinkAction() |
| `#btn-save-profile` | Save Changes | `btn-solid` | Event handler bound |
| `#btn-save-password` | Update Password | `btn-solid` | Event handler bound |
| `#null` | &times; | `google-modal-close` | closeGoogleCard() |

#### 📝 Form Inputs & Dropdown Selectors (7 Cataloged)
| Control ID | Type | Name / Purpose | Placeholder / Options | Required |
| :--- | :--- | :--- | :--- | :--- |
| `#prof-input-empid` | `text` | Input | `None` | No |
| `#prof-input-name` | `text` | Input | `Prof. Amit Verma` | No |
| `#prof-input-email` | `email` | Input | `faculty@college.edu` | No |
| `#prof-input-phone` | `tel` | Input | `+91 98765 43210` | No |
| `#pass-current` | `password` | Input | `••••••••` | No |
| `#pass-new` | `password` | Input | `••••••••` | No |
| `#pass-confirm` | `password` | Input | `••••••••` | No |

#### 🪟 Modals, Dialogs & Drawers (1 Cataloged)
##### Modal 1: `#google-signin-modal` — Link Google Account
- **Container ID**: `#google-signin-modal`
- **Submit Action**: `Form submission`

#### 📡 Backend REST API Contracts (7 Integrated)
| Method | Endpoint | Type | Purpose / Trigger |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/logout` | `REST` | Core academic service call |
| `GET` | `/api/v1/auth/me` | `REST` | Core academic service call |
| `GET` | `/api/v1/auth/heartbeat` | `REST` | Core academic service call |
| `GET` | `/api/v1/notifications` | `REST` | Core academic service call |
| `PUT` | `/api/v1/notifications/:id/read` | `REST` | Core academic service call |
| `PUT` | `/api/v1/notifications/mark-all-read` | `REST` | Core academic service call |
| `GET` | `/api/v1:id` | `REST` | Core academic service call |

---

### FAC-015: My Teaching Classes — VidyaOS

- **URL Route**: `/faculty/classes/index.html`
- **Source File**: [frontend/faculty/classes/index.html](file:///e:/uiap/VidyaOS/frontend/faculty/classes/index.html)
- **Target Role**: `Faculty`
- **Shell & Styling**: VidyaOS Semantic Shell (`variables.css`, `header.js`, `sidebar.js`)
- **Responsive States**: Desktop: 3-column responsive card grid with uniform module tiles; Mobile: compact grid with zero overflow

#### 🎯 Purpose & Academic Workflow
Teaching Classes Overview: 3 KPI status cards, classroom cards with uniform 6-module action grid (Theory Classes, Laboratory, NBA, Student Performance, Direct Assessment, Indirect Assessment), 3-dot kebab menu (Edit Class, Move to Trash), Create Class modal, Broadcast Notice modal with Year cohort filter and media upload, and Trash Bin navigation with live count badge

#### 🔘 Action Buttons & Interactive Controls (15 Cataloged)
| Button ID | Label / Text | Class / Variant | Action / Behavior |
| :--- | :--- | :--- | :--- |
| `#null` | Create Class | `btn-create-class-solid` | openCreateGroupModal() |
| `#null` | Broadcast Notice | `btn-action-outline` | openBroadcastNoticeModal() |
| `#null` | &times; | `modal-close-btn` | closeCreateGroupModal() |
| `#null` | Cancel | `btn-dialog-cancel` | closeCreateGroupModal() |
| `#null` | Create Class | `btn-dialog-primary` | Event handler bound |
| `#null` | &times; | `modal-close-btn` | closeEditClassModal() |
| `#null` | Cancel | `btn-dialog-cancel` | closeEditClassModal() |
| `#null` | Save Changes | `btn-dialog-primary` | Event handler bound |
| `#null` | &times; | `modal-close-btn` | closeDeleteClassModal() |
| `#null` | Cancel | `btn-dialog-cancel` | closeDeleteClassModal() |
| `#btn-confirm-delete-class` | Move to Trash | `btn-dialog-danger` | executeDeleteClass() |
| `#null` | &times; | `modal-close-btn` | closeBroadcastNoticeModal() |
| `#null` | &times; | `file-chip-remove-btn` | clearBroadcastFile(event) |
| `#null` | Cancel | `btn-dialog-cancel` | closeBroadcastNoticeModal() |
| `#btn-submit-broadcast` | Send Broadcast | `btn-dialog-primary` | Event handler bound |

#### 📝 Form Inputs & Dropdown Selectors (21 Cataloged)
| Control ID | Type | Name / Purpose | Placeholder / Options | Required |
| :--- | :--- | :--- | :--- | :--- |
| `#search-classes-input` | `text` | Input | `Search class, code or subject...` | No |
| `#input-class-name` | `text` | Input | `e.g. Database Management Systems` | No |
| `#input-class-short-name` | `text` | Input | `e.g. DBMS` | No |
| `#input-class-code` | `text` | Input | `e.g. IT501` | No |
| `#input-class-year` | `text` | Input | `None` | No |
| `#edit-class-id` | `hidden` | Input | `None` | No |
| `#input-edit-class-name` | `text` | Input | `e.g. Database Management Systems` | No |
| `#input-edit-class-short-name` | `text` | Input | `e.g. DBMS` | No |
| `#input-edit-class-code` | `text` | Input | `e.g. IT501` | No |
| `#input-edit-class-year` | `text` | Input | `None` | No |
| `#input-confirm-delete` | `text` | Input | `Type DELETE to confirm` | No |
| `#broadcast-title-input` | `text` | Input | `e.g. Schedule Change, Exam Guidelines, Project Submission` | No |
| `#broadcast-file-input` | `file` | Input | `None` | No |
| `#filter-semester-select` | `select` | Dropdown | Dynamic options | No |
| `#select-class-comp` | `select` | Dropdown | Dynamic options | No |
| `#select-class-session` | `select` | Dropdown | Dynamic options | No |
| `#select-class-sem` | `select` | Dropdown | Dynamic options | No |
| `#select-edit-class-comp` | `select` | Dropdown | Dynamic options | No |
| `#select-edit-class-session` | `select` | Dropdown | Dynamic options | No |
| `#select-edit-class-sem` | `select` | Dropdown | Dynamic options | No |
| `#broadcast-target-year-select` | `select` | Dropdown | Dynamic options | No |

#### 🪟 Modals, Dialogs & Drawers (9 Cataloged)
##### Modal 1: `#create-class-modal` — + Create New Class
- **Container ID**: `#create-class-modal`
- **Submit Action**: `Form submission`

##### Modal 2: `#input-class-name` — Modal Dialog
- **Container ID**: `#input-class-name`
- **Submit Action**: `Form submission`
- **Contained Fields**: `input-class-name`

##### Modal 3: `#edit-class-modal` — Edit Classroom Details
- **Container ID**: `#edit-class-modal`
- **Submit Action**: `Form submission`

##### Modal 4: `#input-edit-class-name` — Modal Dialog
- **Container ID**: `#input-edit-class-name`
- **Submit Action**: `Form submission`
- **Contained Fields**: `input-edit-class-name`

##### Modal 5: `#delete-class-modal` — Modal Dialog
- **Container ID**: `#delete-class-modal`
- **Submit Action**: `Form submission`

##### Modal 6: `#btn-confirm-delete-class` — Modal Dialog
- **Container ID**: `#btn-confirm-delete-class`
- **Submit Action**: `closeDeleteClassModal()`

##### Modal 7: `#broadcast-notice-modal` — Modal Dialog
- **Container ID**: `#broadcast-notice-modal`
- **Submit Action**: `Form submission`

##### Modal 8: `#broadcast-title-input` — Modal Dialog
- **Container ID**: `#broadcast-title-input`
- **Submit Action**: `Form submission`
- **Contained Fields**: `broadcast-title-input`

##### Modal 9: `#btn-submit-broadcast` — Modal Dialog
- **Container ID**: `#btn-submit-broadcast`
- **Submit Action**: `closeBroadcastNoticeModal()`

#### 📡 Backend REST API Contracts (12 Integrated)
| Method | Endpoint | Type | Purpose / Trigger |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/logout` | `REST` | Core academic service call |
| `GET` | `/api/v1/auth/me` | `REST` | Core academic service call |
| `GET` | `/api/v1/auth/heartbeat` | `REST` | Core academic service call |
| `GET` | `/api/v1/notifications` | `REST` | Core academic service call |
| `PUT` | `/api/v1/notifications/:id/read` | `REST` | Core academic service call |
| `PUT` | `/api/v1/notifications/mark-all-read` | `REST` | Core academic service call |
| `GET` | `/api/v1/teaching-groups` | `REST` | Core academic service call |
| `GET` | `/api/v1/student-records/filters` | `REST` | Core academic service call |
| `POST` | `/api/v1/teaching-groups` | `REST` | Core academic service call |
| `PUT` | `/api/v1/teaching-groups/:id` | `REST` | Core academic service call |
| `POST` | `/api/v1/teaching-groups/:id/trash` | `REST` | Core academic service call |
| `POST` | `/api/v1/teaching-groups/broadcast-notice` | `REST` | Core academic service call |

---

### FAC-016: Classroom Trash Bin — VidyaOS

- **URL Route**: `/faculty/classes/trash.html`
- **Source File**: [frontend/faculty/classes/trash.html](file:///e:/uiap/VidyaOS/frontend/faculty/classes/trash.html)
- **Target Role**: `Faculty`
- **Shell & Styling**: VidyaOS Semantic Shell (`variables.css`, `header.js`, `sidebar.js`)
- **Responsive States**: Desktop: responsive deleted cards with remaining days badge; Mobile: single-column card list

#### 🎯 Purpose & Academic Workflow
Classroom Trash Bin & Recovery Studio: 30-day retention countdown, auto-purge policy banner, Restore Class back to active teaching, and Permanent Deletion dialog with TYPE-TO-CONFIRM safety check

#### 🔘 Action Buttons & Interactive Controls (3 Cataloged)
| Button ID | Label / Text | Class / Variant | Action / Behavior |
| :--- | :--- | :--- | :--- |
| `#null` | &times; | `modal-close-btn` | closePermanentDeleteModal() |
| `#null` | Cancel | `btn-dialog-cancel` | closePermanentDeleteModal() |
| `#btn-confirm-perm-delete` | Delete Permanently | `btn-dialog-danger` | executePermanentDelete() |

#### 📝 Form Inputs & Dropdown Selectors (3 Cataloged)
| Control ID | Type | Name / Purpose | Placeholder / Options | Required |
| :--- | :--- | :--- | :--- | :--- |
| `#search-trash-input` | `text` | Input | `Search deleted classes by name, code or teacher...` | No |
| `#input-confirm-perm-delete` | `text` | Input | `Type DELETE to confirm` | No |
| `#filter-trash-semester-select` | `select` | Dropdown | Dynamic options | No |

#### 🪟 Modals, Dialogs & Drawers (2 Cataloged)
##### Modal 1: `#permanent-delete-modal` — Modal Dialog
- **Container ID**: `#permanent-delete-modal`
- **Submit Action**: `Form submission`

##### Modal 2: `#btn-confirm-perm-delete` — Modal Dialog
- **Container ID**: `#btn-confirm-perm-delete`
- **Submit Action**: `closePermanentDeleteModal()`

#### 📡 Backend REST API Contracts (9 Integrated)
| Method | Endpoint | Type | Purpose / Trigger |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/logout` | `REST` | Core academic service call |
| `GET` | `/api/v1/auth/me` | `REST` | Core academic service call |
| `GET` | `/api/v1/auth/heartbeat` | `REST` | Core academic service call |
| `GET` | `/api/v1/notifications` | `REST` | Core academic service call |
| `PUT` | `/api/v1/notifications/:id/read` | `REST` | Core academic service call |
| `PUT` | `/api/v1/notifications/mark-all-read` | `REST` | Core academic service call |
| `GET` | `/api/v1/teaching-groups` | `REST` | Core academic service call |
| `POST` | `/api/v1/teaching-groups/:id/restore` | `REST` | Core academic service call |
| `DELETE` | `/api/v1/teaching-groups/:id/permanent` | `REST` | Core academic service call |

---

### FAC-017: Spreadsheet Studio — Institutional Excel Workspace

- **URL Route**: `/faculty/sheets/editor.html`
- **Source File**: [frontend/faculty/sheets/editor.html](file:///e:/uiap/VidyaOS/frontend/faculty/sheets/editor.html)
- **Target Role**: `Faculty`
- **Shell & Styling**: VidyaOS Semantic Shell (`variables.css`, `header.js`, `sidebar.js`)
- **Responsive States**: Desktop: high-density Excel-style grid with auto-fit, zoom, and multi-tier sticky headers; Mobile: responsive table with touch pinch zoom & sliding bottom tools drawer
- **URL Parameters**: `registerId`, `register_id`, `register`, `groupId`, `group_id`, `id`, `sheet`, `view`, `action`

#### 🎯 Purpose & Academic Workflow
Dedicated Excel Spreadsheet Studio: Multi-sheet academic evaluation studio (Master Internal Evaluation, Class Tests, Assignment Marksheet, Practical Marksheet with 8-tab ribbon, formula bar, physical grid, color formatting suite, and XLSX/PDF export)

#### 🔘 Action Buttons & Interactive Controls (205 Cataloged)
| Button ID | Label / Text | Class / Variant | Action / Behavior |
| :--- | :--- | :--- | :--- |
| `#faculty-nav-toggle` | =769&&typeof toggleDesktopSidebar==='function')... | `header-nav-toggle-btn` | Event handler bound |
| `#btn-back-bar1` | Back to Office Start Hub | `btn-icon-minimal header-back-btn excel-back-btn` | window.location.href= |
| `#btn-office-home` | Back to Office Start Hub | `btn-icon-minimal header-office-home-btn` | window.location.href= |
| `#theme-toggle-btn` | Toggle Dark/Light Mode | `header-icon-btn header-theme-toggle` | toggleAppTheme() |
| `#header-bell-btn` | 0 | `header-icon-btn header-bell-btn` | toggleNotifications(event) |
| `#null` | Mark all read | `notif-mark-all-btn` | markAllNotificationsAsRead(event) |
| `#header-user-profile` | RS | `header-profile-round-btn gc-user-avatar` | toggleUserProfile(event) |
| `#null` | Sign Out | `profile-dropdown-item dropdown-logout-btn` | if(typeof confirmFacultyLogout=== |
| `#null` | File | `excel-tab-btn` | switchRibbonTab( |
| `#null` | Home | `excel-tab-btn active` | switchRibbonTab( |
| `#null` | Insert | `excel-tab-btn` | switchRibbonTab( |
| `#null` | Page Layout | `excel-tab-btn` | switchRibbonTab( |
| `#null` | Formulas | `excel-tab-btn` | switchRibbonTab( |
| `#null` | Data | `excel-tab-btn` | switchRibbonTab( |
| `#null` | Review | `excel-tab-btn` | switchRibbonTab( |
| `#null` | View | `excel-tab-btn` | switchRibbonTab( |
| `#null` | Templates | `excel-tab-btn` | switchRibbonTab( |
| `#btn-ribbon-scroll-left` | Scroll Ribbon Left | `ribbon-scroll-btn ribbon-scroll-left` | scrollRibbon(-220) |
| `#btn-ribbon-home` | Home | `excel-action-btn-large` | openOfficeHomeScreen() |
| `#null` | New Sheet | `excel-action-btn-large` | createNewWorksheet() |
| `#null` | Open / Import | `excel-action-btn-large` | triggerExcelImport() |
| `#null` | Save | `excel-action-btn-large` | saveActiveSheetData(true) |
| `#null` | Export .XLSX | `excel-action-btn-large` | exportCurrentSheet( |
| `#null` | Print | `excel-action-btn-large` | window.print() |
| `#btn-ribbon-paste` | Paste | `excel-action-btn-large` | excelPaste() |
| `#btn-ribbon-cut` | Cut | `excel-tool-btn` | excelCut() |
| `#btn-ribbon-copy` | Copy | `excel-tool-btn` | excelCopy() |
| `#btn-ribbon-undo` | Undo (Ctrl+Z) | `excel-icon-btn` | excelUndo() |
| `#btn-ribbon-redo` | Redo (Ctrl+Y) | `excel-icon-btn` | excelRedo() |
| `#btn-font-bold` | B | `excel-icon-btn` | toggleFontBold() |
| `#btn-font-italic` | I | `excel-icon-btn` | toggleFontItalic() |
| `#btn-font-underline` | U | `excel-icon-btn` | toggleFontUnderline() |
| `#btn-border-dropdown` | Borders | `excel-icon-btn` | toggleBordersMenu(event) |
| `#null` | All Borders | `excel-menu-row` | applyCellBorders( |
| `#null` | Outside Borders | `excel-menu-row` | applyCellBorders( |
| `#null` | Thick Bottom Border | `excel-menu-row` | applyCellBorders( |
| `#null` | No Border | `excel-menu-row` | applyCellBorders( |
| `#btn-fill-color-picker` | Fill Color (Background) | `excel-icon-btn` | toggleColorPalette( |
| `#btn-font-color-picker` | A | `excel-icon-btn` | toggleColorPalette( |
| `#btn-valign-top` | Top Align | `excel-icon-btn` | applyVAlign( |
| `#btn-valign-middle` | Middle Align | `excel-icon-btn active` | applyVAlign( |
| `#btn-valign-bottom` | Bottom Align | `excel-icon-btn` | applyVAlign( |
| `#btn-wrap-text` | Wrap Text | `excel-tool-btn` | toggleWrapText() |
| `#btn-align-left` | Align Left | `excel-icon-btn` | applyHAlign( |
| `#btn-align-center` | Align Center | `excel-icon-btn` | applyHAlign( |
| `#btn-align-right` | Align Right | `excel-icon-btn` | applyHAlign( |
| `#btn-merge-cells` | Merge &amp; Center ▾ | `excel-tool-btn` | toggleMergeAndCenterMenu(event) |
| `#null` | Merge &amp; Center | `excel-menu-item` | mergeAndCenter() |
| `#null` | Merge Across | `excel-menu-item` | mergeAcross() |
| `#null` | Merge Cells | `excel-menu-item` | mergeCellsOnly() |
| `#null` | Unmerge Cells | `excel-menu-item text-danger` | unmergeSelectedCells() |
| `#btn-dec-increase` | .0+ | `excel-icon-btn` | adjustDecimals(1) |
| `#btn-dec-decrease` | -.0 | `excel-icon-btn` | adjustDecimals(-1) |
| `#null` | ₹ | `excel-icon-btn` | applyNumberFormat( |
| `#null` | % | `excel-icon-btn` | applyNumberFormat( |
| `#btn-conditional-formatting` | Conditional Formatting ▾ | `excel-tool-btn` | toggleConditionalFormattingMenu(event, this) |
| `#btn-color-templates` | Color Templates ▾ | `excel-tool-btn` | toggleColorTemplatesMenu(event, this) |
| `#btn-insert-row` | + Row ↑ | `excel-tool-btn` | insertRowAtActive(true) |
| `#btn-insert-row-down` | + Row ↓ | `excel-tool-btn` | insertRowAtActive(false) |
| `#btn-insert-col` | + Col ← | `excel-tool-btn` | insertColAtActive(true) |
| `#btn-insert-col-right` | + Col → | `excel-tool-btn` | insertColAtActive(false) |
| `#btn-delete-row` | − Row | `excel-tool-btn text-danger` | deleteActiveRow() |
| `#btn-delete-col` | − Col | `excel-tool-btn text-danger` | deleteActiveCol() |
| `#btn-add-student-row` | + Student | `excel-tool-btn` | openAddRowModal() |
| `#btn-open-roster-form` | Roster Form | `excel-tool-btn` | openEditStudentRosterModal() |
| `#btn-home-fit-screen` | Fit Screen | `excel-tool-btn` | triggerFitColumnsToScreen() |
| `#btn-autosum-dropdown` | Σ AutoSum ▾ | `excel-tool-btn` | toggleAutoSumMenu(event) |
| `#null` | SUM | `excel-menu-row` | insertAutoFormula( |
| `#null` | AVERAGE | `excel-menu-row` | insertAutoFormula( |
| `#null` | COUNT NUMBERS | `excel-menu-row` | insertAutoFormula( |
| `#null` | MAX | `excel-menu-row` | insertAutoFormula( |
| `#null` | MIN | `excel-menu-row` | insertAutoFormula( |
| `#btn-sort-asc` | A→Z | `excel-tool-btn` | sortActiveColumn( |
| `#btn-sort-desc` | Z→A | `excel-tool-btn` | sortActiveColumn( |
| `#btn-find-replace-open` | Find &amp; Replace | `excel-tool-btn` | openFindReplaceModal() |
| `#btn-clear-contents` | Clear | `excel-tool-btn` | clearSelectedCellContents() |
| `#null` | ƒx Insert Function | `excel-action-btn-large` | openInsertFunctionModal() |
| `#null` | Student Row | `excel-action-btn-large` | openAddRowModal() |
| `#null` | Column | `excel-action-btn-large` | openAddColumnModal() |
| `#null` | College Header | `excel-action-btn-large` | toggleInstitutionalBanner() |
| `#null` | Signatures | `excel-action-btn-large` | togglePrintSignatures() |
| `#null` | Print Sheet | `excel-action-btn-large` | window.print() |
| `#null` | Scheme Marks | `excel-action-btn-large` | openEditMarksModal() |
| `#null` | SUM() | `excel-tool-btn` | insertFormulaTemplate( |
| `#null` | AVERAGE() | `excel-tool-btn` | insertFormulaTemplate( |
| `#null` | COUNT() | `excel-tool-btn` | insertFormulaTemplate( |
| `#null` | IF() | `excel-tool-btn` | insertFormulaTemplate( |
| `#null` | ROUND() | `excel-tool-btn` | insertFormulaTemplate( |
| `#null` | TODAY() | `excel-tool-btn` | insertFormulaTemplate( |
| `#null` | Calculate Sheet | `excel-action-btn-large` | recalculateAllSheetFormulas(true) |
| `#null` | Sort A &rarr; Z | `excel-tool-btn` | sortActiveColumn( |
| `#null` | Sort Z &rarr; A | `excel-tool-btn` | sortActiveColumn( |
| `#btn-data-filter` | Filters &amp; Sort | `excel-tool-btn` | openSheetFilterModal() |
| `#null` | Clear Filter | `excel-tool-btn` | clearAllSheetFilters() |
| `#null` | Refresh Data | `excel-action-btn-large` | reloadGroupAcademicData() |
| `#null` | Audit Pass/Fail | `excel-action-btn-large` | auditSheetPassFail() |
| `#null` | Protect Sheet | `excel-action-btn-large` | toggleEditSaveMode() |
| `#btn-toggle-gridlines` | Gridlines: ON | `excel-tool-btn active` | toggleGridlines() |
| `#btn-toggle-formula-view` | ƒx Formula Bar: ON | `excel-tool-btn active` | toggleFormulaBarVisibility() |
| `#btn-toggle-banner-view` | College Banner: ON | `excel-tool-btn active` | toggleInstitutionalBanner() |
| `#btn-toggle-signatures-bar` | Signatures: ON | `excel-tool-btn active` | toggleSignatureBarVisibility() |
| `#null` | Zoom Out (−) | `excel-icon-btn` | zoomOut() |
| `#null` | Zoom In (+) | `excel-icon-btn` | zoomIn() |
| `#null` | 100% | `excel-tool-btn` | resetZoom() |
| `#btn-view-fit-screen` | Fit to Screen | `excel-tool-btn` | triggerFitColumnsToScreen() |
| `#btn-view-freeze-panes` | Freeze Panes ▾ | `excel-tool-btn` | toggleFreezePanesMenu(event) |
| `#null` | Freeze Top Row | `excel-menu-row` | freezeTopRow() |
| `#null` | Freeze First Column | `excel-menu-row` | freezeFirstColumn() |
| `#null` | Unfreeze Panes | `excel-menu-row` | unfreezePanes() |
| `#null` | Scheme Weightage | `excel-tool-btn` | openEditMarksModal() |
| `#null` | Browse Templates | `excel-action-btn-large` | openTemplateManagerModal() |
| `#null` | Save As Template | `excel-action-btn-large` | openSaveTemplateDialog() |
| `#null` | Polytechnic Master Eval | `excel-action-btn` | applyPresetTemplate( |
| `#null` | Class Test (20M) | `excel-action-btn` | applyPresetTemplate( |
| `#null` | Assignments Roster | `excel-action-btn` | applyPresetTemplate( |
| `#null` | Practicals Lab | `excel-action-btn` | applyPresetTemplate( |
| `#btn-ribbon-scroll-right` | Scroll Ribbon Right | `ribbon-scroll-btn ribbon-scroll-right` | scrollRibbon(220) |
| `#btn-formula-cancel` | Cancel (Esc) | `btn-formula-action cancel` | cancelFormulaInput() |
| `#btn-formula-accept` | Enter / Accept (Enter) | `btn-formula-action accept` | acceptFormulaInput() |
| `#btn-formula-fx` | ƒx | `btn-formula-action fx` | openInsertFunctionModal() |
| `#btn-toggle-college-banner` | College Banner | `btn btn-secondary btn-sm active` | toggleInstitutionalBanner() |
| `#btn-toggle-formula-bar` | Formula Bar | `btn btn-secondary btn-sm active` | toggleFormulaBarVisibility() |
| `#btn-fit-columns-screen` | Fit to Screen | `btn btn-secondary btn-sm` | triggerFitColumnsToScreen() |
| `#btn-open-filter-modal` | Filters 1 | `btn btn-secondary btn-sm` | openSheetFilterModal() |
| `#btn-quick-save` | Save | `btn btn-sm btn-quick-save` | saveActiveSheetData(true) |
| `#btn-export-dropdown` | Export ▼ | `btn btn-secondary btn-sm studio-export-btn` | toggleExportMenu(event) |
| `#null` | .XLSX Excel Spreadsheet Native Microsoft Excel ... | `export-menu-item` | exportCurrentSheet( |
| `#null` | .PDF Printable Document Institutional PDF for s... | `export-menu-item` | exportCurrentSheet( |
| `#null` | .DOC Word Document Editable formatted table (.doc) | `export-menu-item` | exportCurrentSheet( |
| `#null` | .CSV Raw Data Values Comma-separated tabular te... | `export-menu-item` | exportCurrentSheet( |
| `#btn-mode-dynamic` | Dynamic | `btn-mode-toggle active` | Event handler bound |
| `#btn-mode-overview` | ⇲ Overview | `btn-mode-toggle` | Event handler bound |
| `#null` | Click or double-click to edit banner text | `banner-edit-pencil-btn` | makeBannerEditable() |
| `#btn-sheet-nav-prev` | Scroll tabs left | `excel-sheet-nav-btn` | scrollSheetTabs(-1) |
| `#btn-sheet-nav-next` | Scroll tabs right | `excel-sheet-nav-btn` | scrollSheetTabs(1) |
| `#btn-add-sheet` | + | `excel-add-sheet-btn` | createNewWorksheet() |
| `#excel-status-zoom-pct` | 100% | `excel-status-zoom-pct` | resetZoom() |
| `#null` | Icon Button | `btn btn-secondary btn-sm` | closeModal( |
| `#null` | Cancel | `btn btn-secondary btn-sm` | closeModal( |
| `#null` | + Add Column | `btn btn-primary btn-sm` | confirmAddColumn() |
| `#null` | Delete Column | `btn btn-sm` | confirmRemoveColumn() |
| `#null` | + Add Student | `btn btn-primary btn-sm` | confirmAddStudentRow() |
| `#null` | Delete Student | `btn btn-sm` | confirmDeleteStudentRow() |
| `#null` | Save Details | `btn btn-primary btn-sm` | confirmUpdateStudentRow() |
| `#null` | Back / Close | `btn` | closeSheetFilterModal() |
| `#btn-filter-clear-all` | Clear All Filters | `filter-btn-clear` | clearAllSheetFilters() |
| `#tab-btn-sort` | Sort | `filter-sidebar-tab active` | switchFilterCategory( |
| `#tab-btn-students` | Students | `filter-sidebar-tab` | switchFilterCategory( |
| `#tab-btn-visibility` | Visibility | `filter-sidebar-tab` | switchFilterCategory( |
| `#tab-btn-focus` | Focus | `filter-sidebar-tab` | switchFilterCategory( |
| `#null` | Show All | `btn` | resetFilterModalColumnsVisible() |
| `#null` | Cancel | `btn btn-secondary btn-sm` | closeSheetFilterModal() |
| `#btn-filter-apply` | Apply Filters | `btn btn-primary btn-sm` | applyAndCloseFilterModal() |
| `#btn-floating-tools` | Adjust Scale &amp; Spreadsheet Columns | `floating-tools-fab` | toggleFloatingToolsDrawer() |
| `#null` | Icon Button | `drawer-close-btn` | toggleFloatingToolsDrawer(false) |
| `#null` | − | `screen-ctrl-btn` | zoomOut() |
| `#null` | + | `screen-ctrl-btn` | zoomIn() |
| `#btn-autofit` | ⇲ Auto-Fit | `screen-ctrl-btn active` | toggleAutoFit() |
| `#drawer-btn-mode-dynamic` | Dynamic Mode | `btn-mode-toggle active` | setSheetViewMode( |
| `#drawer-btn-mode-overview` | ⇲ Overview Mode | `btn-mode-toggle` | setSheetViewMode( |
| `#btn-edit-student-row` | Edit Scores Form Scores | `btn btn-secondary btn-sm` | openEditStudentRosterModal(); toggleFloatingToolsDrawer(false); |
| `#null` | + Student | `btn btn-secondary btn-sm` | openAddRowModal(); toggleFloatingToolsDrawer(false); |
| `#null` | + Column | `btn btn-secondary btn-sm` | openAddColumnModal(); toggleFloatingToolsDrawer(false); |
| `#null` | − Column | `btn btn-secondary btn-sm` | openRemoveColumnModal(); toggleFloatingToolsDrawer(false); |
| `#null` | Columns Visibility | `btn btn-secondary btn-sm` | toggleFloatingToolsDrawer(false); toggleColumnVisibilityMenu(); |
| `#null` | Icon Button | `btn btn-secondary btn-sm` | closeEditMarksModal() |
| `#null` | Close | `btn btn-secondary btn-sm` | closeEditMarksModal() |
| `#null` | Apply Scheme | `btn btn-primary btn-sm` | applyAndCloseEditMarksModal() |
| `#null` | Save Student Data | `btn btn-primary btn-sm` | confirmSaveStudentRosterModal() |
| `#null` | Icon Button | `btn btn-secondary btn-sm` | closeFindReplaceModal() |
| `#null` | Close | `btn btn-secondary btn-sm` | closeFindReplaceModal() |
| `#btn-find-replace-all` | Replace All | `btn btn-secondary btn-sm` | executeReplaceAll() |
| `#btn-find-replace-one` | Replace | `btn btn-secondary btn-sm` | executeReplaceOne() |
| `#btn-find-next` | Find Next | `btn btn-primary btn-sm` | executeFindNext() |
| `#null` | Icon Button | `btn btn-secondary btn-sm` | closeInsertFunctionModal() |
| `#null` | Cancel | `btn btn-secondary btn-sm` | closeInsertFunctionModal() |
| `#btn-confirm-insert-fn` | Insert Function | `btn btn-primary btn-sm` | confirmInsertSelectedFunction() |
| `#null` | Icon Button | `btn btn-secondary btn-sm` | closeRenameSheetModal() |
| `#null` | Cancel | `btn btn-secondary btn-sm` | closeRenameSheetModal() |
| `#null` | Rename | `btn btn-primary btn-sm` | confirmRenameWorksheet() |
| `#null` | Icon Button | `btn btn-secondary btn-sm` | closeTemplateManagerModal() |
| `#null` | Save Current Layout | `btn btn-primary btn-sm` | saveActiveSheetAsTemplate() |
| `#null` | Close | `btn btn-secondary btn-sm` | closeTemplateManagerModal() |
| `#null` | ✕ No Fill | `excel-palette-no-color-btn` | selectFillColor( |
| `#null` | White | `excel-theme-cell` | selectFillColor( |
| `#null` | A Automatic | `excel-palette-no-color-btn` | selectFontColor( |
| `#null` | White | `excel-theme-cell` | selectFontColor( |
| `#null` | ✓ High Distinction (≥ 75%) Soft green fill with... | `cond-menu-item` | applyPresetFormatting( |
| `#null` | ~ Average (50% – 74%) Soft amber fill with dark... | `cond-menu-item` | applyPresetFormatting( |
| `#null` | ! At Risk (&lt; 50%) Soft red fill with dark re... | `cond-menu-item` | applyPresetFormatting( |
| `#null` | 0 Absent / Zero Marks Muted slate fill with das... | `cond-menu-item` | applyPresetFormatting( |
| `#null` | Green – Yellow – Red | `cond-menu-item` | applyColorScale( |
| `#null` | Red – Yellow – Green | `cond-menu-item` | applyColorScale( |
| `#null` | Blue – White – Red | `cond-menu-item` | applyColorScale( |
| `#null` | ✕ Clear Rules from Selected Cells | `cond-menu-item text-danger` | clearFormattingRules( |
| `#null` | ✕ Clear Rules from Entire Sheet | `cond-menu-item text-danger` | clearFormattingRules( |
| `#null` | Header Total Executive Navy | `template-card-btn` | applySheetColorTemplate( |
| `#null` | Header Total Forest Emerald | `template-card-btn` | applySheetColorTemplate( |
| `#null` | Header Total Royal Cobalt | `template-card-btn` | applySheetColorTemplate( |
| `#null` | Header Total Slate Charcoal | `template-card-btn` | applySheetColorTemplate( |
| `#null` | Header Total Warm Amber | `template-card-btn` | applySheetColorTemplate( |
| `#null` | Header Total Royal Purple | `template-card-btn` | applySheetColorTemplate( |
| `#null` | Header Total Modern Teal | `template-card-btn` | applySheetColorTemplate( |
| `#null` | Header Total Crimson Wine | `template-card-btn` | applySheetColorTemplate( |
| `#null` | ✕ Clear Template / Plain White | `template-reset-btn` | applySheetColorTemplate( |

#### 📝 Form Inputs & Dropdown Selectors (63 Cataloged)
| Control ID | Type | Name / Purpose | Placeholder / Options | Required |
| :--- | :--- | :--- | :--- | :--- |
| `#excel-name-box` | `text` | Input | `None` | No |
| `#excel-formula-input` | `text` | Input | `Enter value, text, or formula starting with =` | No |
| `#input-font-color` | `color` | Input | `None` | No |
| `#input-fill-color` | `color` | Input | `None` | No |
| `#excel-file-import-input` | `file` | Input | `None` | No |
| `#sheet-search-input` | `text` | Input | `Search student name, roll, or cell text...` | No |
| `#excel-bottom-zoom-slider` | `range` | Input | `None` | No |
| `#add-col-sheet-target` | `text` | Input | `None` | No |
| `#add-col-title` | `text` | Input | `e.g. Practical Exam, Viva, Mini Project, Q5` | No |
| `#add-col-max` | `number` | Input | `None` | No |
| `#add-row-roll` | `number` | Input | `None` | No |
| `#add-row-name` | `text` | Input | `e.g. Vikas Chauhan` | No |
| `#add-row-enroll` | `text` | Input | `e.g. 24011090008` | No |
| `#add-row-reg` | `text` | Input | `e.g. 24101054011` | No |
| `#edit-row-roll` | `number` | Input | `None` | No |
| `#edit-row-name` | `text` | Input | `None` | No |
| `#edit-row-enroll` | `text` | Input | `None` | No |
| `#edit-row-reg` | `text` | Input | `None` | No |
| `#null` | `radio` | filter_sort_radio | `None` | No |
| `#null` | `radio` | filter_sort_radio | `None` | No |
| `#null` | `radio` | filter_sort_radio | `None` | No |
| `#null` | `radio` | filter_sort_radio | `None` | No |
| `#null` | `radio` | filter_sort_radio | `None` | No |
| `#null` | `radio` | filter_sort_radio | `None` | No |
| `#null` | `radio` | filter_sort_radio | `None` | No |
| `#null` | `radio` | filter_sort_radio | `None` | No |
| `#null` | `radio` | filter_student_radio | `None` | No |
| `#null` | `radio` | filter_student_radio | `None` | No |
| `#null` | `radio` | filter_student_radio | `None` | No |
| `#null` | `radio` | filter_student_radio | `None` | No |
| `#null` | `radio` | filter_student_radio | `None` | No |
| `#null` | `radio` | filter_student_radio | `None` | No |
| `#null` | `radio` | filter_focus_radio | `None` | No |
| `#null` | `radio` | filter_focus_radio | `None` | No |
| `#null` | `radio` | filter_focus_radio | `None` | No |
| `#null` | `radio` | filter_focus_radio | `None` | No |
| `#null` | `radio` | filter_focus_radio | `None` | No |
| `#scheme-assign-max` | `number` | Input | `None` | No |
| `#scheme-exam-max` | `number` | Input | `None` | No |
| `#scheme-att-max` | `number` | Input | `None` | No |
| `#roster-modal-name` | `text` | Input | `None` | No |
| `#roster-modal-roll` | `number` | Input | `None` | No |
| `#find-input-text` | `text` | Input | `Search text, number, or formula...` | No |
| `#replace-input-text` | `text` | Input | `Replacement value...` | No |
| `#find-match-case` | `checkbox` | Input | `None` | No |
| `#find-entire-cell` | `checkbox` | Input | `None` | No |
| `#insert-fn-search` | `text` | Input | `Type function name (e.g. SUM, AVERAGE, IF)...` | No |
| `#rename-sheet-input` | `text` | Input | `e.g. Master Evaluation, UT Marks` | No |
| `#new-template-name-input` | `text` | Input | `Template name (e.g. Standard Evaluation Layout)...` | No |
| `#input-fill-color` | `color` | Input | `None` | No |
| `#input-font-color` | `color` | Input | `None` | No |
| `#group-switcher-select` | `select` | Dropdown | Dynamic options | No |
| `#font-family-select` | `select` | Dropdown | Dynamic options | No |
| `#font-size-select` | `select` | Dropdown | Dynamic options | No |
| `#number-format-select` | `select` | Dropdown | Dynamic options | No |
| `#view-density-selector` | `select` | Dropdown | Dynamic options | No |
| `#sheet-selector-dropdown` | `select` | Dropdown | Dynamic options | No |
| `#sheet-column-focus-select` | `select` | Dropdown | Dynamic options | No |
| `#add-col-category` | `select` | Dropdown | Dynamic options | No |
| `#remove-col-select` | `select` | Dropdown | Dynamic options | No |
| `#edit-row-select` | `select` | Dropdown | Dynamic options | No |
| `#density-selector` | `select` | Dropdown | Dynamic options | No |
| `#modal-roster-student-select` | `select` | Dropdown | Dynamic options | No |

#### 🪟 Modals, Dialogs & Drawers (26 Cataloged)
##### Modal 1: `#modal-add-column` — + Add Spreadsheet Column
- **Container ID**: `#modal-add-column`
- **Submit Action**: `Form submission`

##### Modal 2: `#add-col-sheet-target` — Modal Dialog
- **Container ID**: `#add-col-sheet-target`
- **Submit Action**: `Form submission`
- **Contained Fields**: `add-col-sheet-target`

##### Modal 3: `#modal-remove-column` — − Remove Spreadsheet Column
- **Container ID**: `#modal-remove-column`
- **Submit Action**: `Form submission`

##### Modal 4: `#remove-col-select` — Modal Dialog
- **Container ID**: `#remove-col-select`
- **Submit Action**: `Form submission`

##### Modal 5: `#modal-add-row` — + Add Student Row
- **Container ID**: `#modal-add-row`
- **Submit Action**: `Form submission`

##### Modal 6: `#add-row-roll` — Modal Dialog
- **Container ID**: `#add-row-roll`
- **Submit Action**: `Form submission`
- **Contained Fields**: `add-row-roll`

##### Modal 7: `#modal-edit-row` — Edit / Remove Student
- **Container ID**: `#modal-edit-row`
- **Submit Action**: `Form submission`

##### Modal 8: `#edit-row-select` — Modal Dialog
- **Container ID**: `#edit-row-select`
- **Submit Action**: `Form submission`

##### Modal 9: `#sheet-filter-modal` — Filters
- **Container ID**: `#sheet-filter-modal`
- **Submit Action**: `Form submission`

##### Modal 10: `#tab-btn-sort` — Modal Dialog
- **Container ID**: `#tab-btn-sort`
- **Submit Action**: `Form submission`

##### Modal 11: `#filter-modal-status-text` — Modal Dialog
- **Container ID**: `#filter-modal-status-text`
- **Submit Action**: `Form submission`

##### Modal 12: `#modal-edit-total-marks` — Edit Total Marks &amp;
              Scheme
- **Container ID**: `#modal-edit-total-marks`
- **Submit Action**: `Form submission`

##### Modal 13: `#modal-custom-cols-container` — Modal Dialog
- **Container ID**: `#modal-custom-cols-container`
- **Submit Action**: `Form submission`

##### Modal 14: `#modal-scheme-total-display` — Modal Dialog
- **Container ID**: `#modal-scheme-total-display`
- **Submit Action**: `Form submission`

##### Modal 15: `#modal-edit-student-roster` — Edit Student Row Data
- **Container ID**: `#modal-edit-student-roster`
- **Submit Action**: `Form submission`

##### Modal 16: `#modal-roster-student-select` — Modal Dialog
- **Container ID**: `#modal-roster-student-select`
- **Submit Action**: `Form submission`

##### Modal 17: `#modal-find-replace` — Find and Replace
- **Container ID**: `#modal-find-replace`
- **Submit Action**: `Form submission`

##### Modal 18: `#find-input-text` — Modal Dialog
- **Container ID**: `#find-input-text`
- **Submit Action**: `Form submission`
- **Contained Fields**: `find-input-text`

##### Modal 19: `#btn-find-replace-all` — Modal Dialog
- **Container ID**: `#btn-find-replace-all`
- **Submit Action**: `Form submission`

##### Modal 20: `#modal-insert-function` — Insert Function
- **Container ID**: `#modal-insert-function`
- **Submit Action**: `Form submission`

##### Modal 21: `#insert-fn-search` — Modal Dialog
- **Container ID**: `#insert-fn-search`
- **Submit Action**: `Form submission`
- **Contained Fields**: `insert-fn-search`

##### Modal 22: `#btn-confirm-insert-fn` — Modal Dialog
- **Container ID**: `#btn-confirm-insert-fn`
- **Submit Action**: `closeInsertFunctionModal()`

##### Modal 23: `#modal-rename-sheet` — Rename Worksheet
- **Container ID**: `#modal-rename-sheet`
- **Submit Action**: `Form submission`

##### Modal 24: `#rename-sheet-input` — Modal Dialog
- **Container ID**: `#rename-sheet-input`
- **Submit Action**: `Form submission`
- **Contained Fields**: `rename-sheet-input`

##### Modal 25: `#modal-template-manager` — Spreadsheet Formatting
              Templates
- **Container ID**: `#modal-template-manager`
- **Submit Action**: `Form submission`

##### Modal 26: `#new-template-name-input` — Modal Dialog
- **Container ID**: `#new-template-name-input`
- **Submit Action**: `saveActiveSheetAsTemplate()`
- **Contained Fields**: `new-template-name-input`

#### 📡 Backend REST API Contracts (17 Integrated)
| Method | Endpoint | Type | Purpose / Trigger |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/logout` | `REST` | Core academic service call |
| `GET` | `/api/v1/auth/me` | `REST` | Core academic service call |
| `GET` | `/api/v1/auth/heartbeat` | `REST` | Core academic service call |
| `GET` | `/api/v1/notifications` | `REST` | Core academic service call |
| `PUT` | `/api/v1/notifications/:id/read` | `REST` | Core academic service call |
| `PUT` | `/api/v1/notifications/mark-all-read` | `REST` | Core academic service call |
| `GET` | `/teaching-groups` | `REST` | Core academic service call |
| `GET` | `/teaching-groups/:id` | `REST` | Core academic service call |
| `GET` | `/teaching-groups/:id/members` | `REST` | Core academic service call |
| `GET` | `/teaching-groups/:id/assignments` | `REST` | Core academic service call |
| `GET` | `/teaching-groups/:id/tests` | `REST` | Core academic service call |
| `GET` | `/faculty/registers/:id/internal-evaluation` | `REST` | Core academic service call |
| `GET` | `/student-records` | `INTERNAL` | Core academic service call |
| `GET` | `/students` | `INTERNAL` | Core academic service call |
| `GET` | `/teaching-groups/:id/tests/:id/scores` | `REST` | Core academic service call |
| `POST` | `/teaching-groups/:id/tests/:id/scores` | `REST` | Core academic service call |
| `POST` | `/api/v1/faculty/export/table-to-excel` | `REST` | Core academic service call |

---

## 🌐 3. Head of Department (HOD) Governance & Biometrics (HOD)

*Department-level faculty allocation, student intake, and ESP32 physical IoT biometric fingerprint synchronization.*

### HOD-004: Faculty Management — VidyaOS

- **URL Route**: `/faculty/faculty/index.html`
- **Source File**: [frontend/faculty/faculty/index.html](file:///e:/uiap/VidyaOS/frontend/faculty/faculty/index.html)
- **Target Role**: `HOD`
- **Shell & Styling**: VidyaOS Semantic Shell (`variables.css`, `header.js`, `sidebar.js`)
- **Responsive States**: Desktop: compact faculty table with actions; Mobile: compact cards with direct reset/remove actions

#### 🎯 Purpose & Academic Workflow
Department faculty roster, instructor onboarding, self-registration toggle, credentials

#### 🔘 Action Buttons & Interactive Controls (14 Cataloged)
| Button ID | Label / Text | Class / Variant | Action / Behavior |
| :--- | :--- | :--- | :--- |
| `#null` | Trash Bin 0 | `btn-trash-header` | switchToTrashTab() |
| `#null` | All Faculty 0 | `fac-pill active` | Event handler bound |
| `#null` | HOD | `fac-pill` | Event handler bound |
| `#null` | Lecturers | `fac-pill` | Event handler bound |
| `#pill-pending` | Pending 0 | `fac-pill` | Event handler bound |
| `#pill-trash` | Trash 0 | `fac-pill pill-trash` | Event handler bound |
| `#null` | Add Faculty | `btn-primary-compact` | openAddFacultyModal() |
| `#null` | &times; | `btn` | closeAddFacultyModal() |
| `#null` | Cancel | `btn` | closeAddFacultyModal() |
| `#null` | Onboard Faculty | `btn` | Event handler bound |
| `#null` | &times; | `btn` | closeFacultyDetailsModal() |
| `#detail-btn-reset` | Reset Password | `btn-icon-action` | detailResetPassword() |
| `#detail-btn-delete` | Remove Faculty | `btn-icon-action danger` | detailDeleteFaculty() |
| `#null` | Close | `btn` | closeFacultyDetailsModal() |

#### 📝 Form Inputs & Dropdown Selectors (7 Cataloged)
| Control ID | Type | Name / Purpose | Placeholder / Options | Required |
| :--- | :--- | :--- | :--- | :--- |
| `#toggle-faculty-reg` | `checkbox` | Input | `None` | No |
| `#faculty-search` | `search` | Input | `Search faculty by name, ID...` | No |
| `#add-fac-name` | `text` | Input | `e.g. Prof. Amit Verma` | No |
| `#add-fac-empid` | `text` | Input | `IT-T-02` | No |
| `#add-fac-phone` | `tel` | Input | `9876543210` | No |
| `#add-fac-email` | `email` | Input | `faculty@college.edu` | No |
| `#add-fac-pass` | `password` | Input | `None` | No |

#### 🪟 Modals, Dialogs & Drawers (2 Cataloged)
##### Modal 1: `#modal-add-faculty` — Modal Dialog
- **Container ID**: `#modal-add-faculty`
- **Submit Action**: `Form submission`

##### Modal 2: `#modal-faculty-details` — Modal Dialog
- **Container ID**: `#modal-faculty-details`
- **Submit Action**: `Form submission`

#### 📡 Backend REST API Contracts (7 Integrated)
| Method | Endpoint | Type | Purpose / Trigger |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/logout` | `REST` | Core academic service call |
| `GET` | `/api/v1/auth/me` | `REST` | Core academic service call |
| `GET` | `/api/v1/auth/heartbeat` | `REST` | Core academic service call |
| `GET` | `/api/v1/notifications` | `REST` | Core academic service call |
| `PUT` | `/api/v1/notifications/:id/read` | `REST` | Core academic service call |
| `PUT` | `/api/v1/notifications/mark-all-read` | `REST` | Core academic service call |
| `GET` | `/api/v1:id` | `REST` | Core academic service call |

---

### HOD-005: ESP32 Biometric Terminals & Student Fingerprint Vault — HOD Portal

- **URL Route**: `/faculty/esp32-devices.html`
- **Source File**: [frontend/faculty/esp32-devices/index.html](file:///e:/uiap/VidyaOS/frontend/faculty/esp32-devices/index.html)
- **Target Role**: `HOD / Faculty`
- **Shell & Styling**: VidyaOS Semantic Shell (`variables.css`, `header.js`, `sidebar.js`)
- **Responsive States**: Desktop: split terminals & OLED simulator, biometric roster; Mobile: responsive card stack

#### 🎯 Purpose & Academic Workflow
Department ESP32 Biometric Terminals, AES-256-GCM Keys, Student Fingerprint Cloud Vault & Wi-Fi Management

#### 🔘 Action Buttons & Interactive Controls (42 Cataloged)
| Button ID | Label / Text | Class / Variant | Action / Behavior |
| :--- | :--- | :--- | :--- |
| `#btn-quick-register-bio` | + Register Biometric | `btn btn-primary btn-sm` | focusBiometricEnrollmentSection() |
| `#btn-check-esp-connect` | Check ESP Connected | `btn btn-secondary btn-sm` | checkActiveEspConnection() |
| `#btn-add-esp-terminal` | + Add ESP Terminal | `btn btn-secondary btn-sm` | openRegisterDeviceModal() |
| `#null` | Refresh | `btn btn-secondary btn-sm` | loadEsp32Overview() |
| `#btn-scan-wifi` | Scan Nearby | `btn btn-secondary btn-sm` | triggerScanNearbyWifi() |
| `#btn-add-wifi-manual` | + Add Network | `btn btn-primary btn-sm` | openAddWifiModal() |
| `#btn-fallback-wifi` | Fallback Default | `btn btn-secondary btn-sm` | triggerWifiFallback() |
| `#btn-reset-wifi` | Emergency Reset | `btn btn-outline-danger btn-sm` | triggerWifiReset() |
| `#sim-btn-standby` | Clock | `oled-sim-btn active` | setOledSimMode( |
| `#sim-btn-success` | Verified | `oled-sim-btn` | setOledSimMode( |
| `#sim-btn-fail` | Failed | `oled-sim-btn` | setOledSimMode( |
| `#sim-btn-unregistered` | Not Registered | `oled-sim-btn` | setOledSimMode( |
| `#sim-btn-enroll` | Enroll Mode | `oled-sim-btn` | setOledSimMode( |
| `#sim-btn-low_batt` | Low Battery | `oled-sim-btn` | setOledSimMode( |
| `#btn-enroll-selected-student` | Enroll Fingerprint on ESP32 | `btn btn-primary btn-sm esp-btn-enroll` | enrollCurrentSelectedStudent() |
| `#btn-simulate-test-scan` | Test Scan | `btn btn-secondary btn-sm esp-btn-test-scan` | simulateCurrentSelectedStudent() |
| `#btn-remove-selected-bio` | Remove | `btn btn-danger btn-sm esp-btn-remove-bio` | removeCurrentSelectedStudentTemplate() |
| `#tab-btn-vault` | Student Biometric Vault 0 | `esp-tab-btn active` | switchEspTab( |
| `#tab-btn-feed` | Live Attendance Feed LIVE | `esp-tab-btn` | switchEspTab( |
| `#tab-btn-logs` | Remote ESP32 System Logs | `esp-tab-btn` | switchEspTab( |
| `#null` | Refresh | `btn btn-secondary btn-sm` | loadDeviceRemoteLogs() |
| `#null` | Clear | `btn btn-secondary btn-sm` | clearDeviceRemoteLogs() |
| `#null` | &times; | `btn` | closeRegisterDeviceModal() |
| `#btn-esp-detect-rescan` | Rescan | `btn btn-secondary btn-sm` | startEspDetectionScan() |
| `#btn-esp-detect-usb` | USB Serial | `btn btn-secondary btn-sm` | detectViaWebSerial() |
| `#btn-esp-detect-sim` | Detect Now | `btn btn-secondary btn-sm` | simulateEspDetection() |
| `#null` | Generate | `btn btn-secondary btn-sm` | generateRandomHexSecret() |
| `#null` | Cancel | `btn btn-secondary` | closeRegisterDeviceModal() |
| `#btn-submit-pair-esp` | Add &amp; Pair ESP Terminal | `btn btn-primary` | Event handler bound |
| `#null` | &times; | `btn` | closeEspConfigModal() |
| `#null` | Copy `config.h` | `btn btn-secondary` | copyEspConfigCode() |
| `#null` | Done | `btn btn-primary` | closeEspConfigModal() |
| `#null` | &times; | `btn` | closeScanWifiModal() |
| `#null` | Rescan | `btn btn-secondary btn-sm` | triggerScanNearbyWifi(true) |
| `#null` | Cancel | `btn btn-secondary` | closeScanWifiModal() |
| `#null` | Connect &amp; Switch Terminal Now | `btn btn-primary` | Event handler bound |
| `#null` | &times; | `btn` | closeAddWifiModal() |
| `#null` | Cancel | `btn btn-secondary` | closeAddWifiModal() |
| `#null` | Save Wi-Fi Network | `btn btn-primary` | Event handler bound |
| `#null` | &times; | `btn` | closeOtaUpdateModal() |
| `#null` | Cancel | `btn btn-secondary` | closeOtaUpdateModal() |
| `#btn-submit-ota` | Update Firmware Now (OTA) | `btn btn-primary` | Event handler bound |

#### 📝 Form Inputs & Dropdown Selectors (24 Cataloged)
| Control ID | Type | Name / Purpose | Placeholder / Options | Required |
| :--- | :--- | :--- | :--- | :--- |
| `#chk-buzzer-audio` | `checkbox` | Input | `None` | No |
| `#search-bio-student` | `text` | Input | `Search student or roll #...` | No |
| `#esp-dept-input` | `hidden` | Input | `None` | No |
| `#esp-uid-input` | `text` | Input | `e.g. ESP32-IT-LAB-01` | No |
| `#esp-name-input` | `text` | Input | `e.g. IT Lab Biometric Terminal 01` | No |
| `#esp-secret-input` | `text` | Input | `64-character hex AES-256 key` | No |
| `#scanned-wifi-ssid` | `text` | esp_selected_wifi_ssid | `Select a network above or type SSID` | No |
| `#scanned-wifi-password` | `password` | esp_selected_wifi_key | `Leave blank if open Wi-Fi network` | No |
| `#scanned-wifi-is-default` | `checkbox` | Input | `None` | No |
| `#manual-wifi-ssid` | `text` | Input | `e.g. IT_DEPT_FACULTY_5G` | No |
| `#manual-wifi-password` | `password` | Input | `Router WPA2/WPA3 password` | No |
| `#manual-wifi-is-default` | `checkbox` | Input | `None` | No |
| `#manual-wifi-switch-now` | `checkbox` | Input | `None` | No |
| `#ota-custom-url` | `url` | Input | `http://192.168.1.15:3000/uploads/firmware/firmware.bin` | No |
| `#dept-switcher-select` | `select` | Dropdown | Dynamic options | No |
| `#active-device-select` | `select` | Dropdown | Dynamic options | No |
| `#enroll-cohort-filter` | `select` | Dropdown | Dynamic options | No |
| `#enroll-student-select` | `select` | Dropdown | Dynamic options | No |
| `#filter-bio-year` | `select` | Dropdown | Dynamic options | No |
| `#filter-bio-status` | `select` | Dropdown | Dynamic options | No |
| `#esp-log-level-filter` | `select` | Dropdown | Dynamic options | No |
| `#esp-year-input` | `select` | Dropdown | Dynamic options | No |
| `#esp-sem-input` | `select` | Dropdown | Dynamic options | No |
| `#ota-binary-source` | `select` | Dropdown | Dynamic options | No |

#### 🪟 Modals, Dialogs & Drawers (5 Cataloged)
##### Modal 1: `#register-esp-modal` — Pair Department ESP32 Terminal
- **Container ID**: `#register-esp-modal`
- **Submit Action**: `Form submission`

##### Modal 2: `#esp-config-modal` — ESP32 Firmware Configuration (`config.h`)
- **Container ID**: `#esp-config-modal`
- **Submit Action**: `Form submission`

##### Modal 3: `#scan-wifi-modal` — Nearby Wi-Fi Networks
- **Container ID**: `#scan-wifi-modal`
- **Submit Action**: `Form submission`

##### Modal 4: `#add-wifi-modal` — Add Wi-Fi Network Manually
- **Container ID**: `#add-wifi-modal`
- **Submit Action**: `Form submission`

##### Modal 5: `#ota-update-modal` — Wireless Firmware Update (OTA)
- **Container ID**: `#ota-update-modal`
- **Submit Action**: `Form submission`

#### 📡 Backend REST API Contracts (6 Integrated)
| Method | Endpoint | Type | Purpose / Trigger |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/logout` | `REST` | Core academic service call |
| `GET` | `/api/v1/auth/me` | `REST` | Core academic service call |
| `GET` | `/api/v1/auth/heartbeat` | `REST` | Core academic service call |
| `GET` | `/api/v1/notifications` | `REST` | Core academic service call |
| `PUT` | `/api/v1/notifications/:id/read` | `REST` | Core academic service call |
| `PUT` | `/api/v1/notifications/mark-all-read` | `REST` | Core academic service call |

---

## 🌐 4. Student Portal & Academic Self-Service (STU)

*Student classroom stream, monthly attendance calendars, to-do coursework, exam scorecards, and biometric verification.*

### STU-001: Student Classroom Dashboard — VidyaOS

- **URL Route**: `/student/dashboard.html`
- **Source File**: [frontend/student/dashboard/index.html](file:///e:/uiap/VidyaOS/frontend/student/dashboard/index.html)
- **Target Role**: `Student`
- **Shell & Styling**: Student Shell (`classroom-nav.css`, `nav.js`)
- **Responsive States**: Desktop: multi-column course grid; Mobile: single-column cards with tap-to-enter

#### 🎯 Purpose & Academic Workflow
Student classroom dashboard, enrolled courses, attendance progress

#### 🔘 Action Buttons & Interactive Controls (21 Cataloged)
| Button ID | Label / Text | Class / Variant | Action / Behavior |
| :--- | :--- | :--- | :--- |
| `#open-self-attendance-btn` | Icon Button | `btn` | openSelfAttendanceModal() |
| `#null` | + Join Class | `btn btn-primary btn-sm btn-join-class-header` | openStudentJoinModal() |
| `#filter-all` | All (0) | `active` | setClassesFilter( |
| `#filter-theory` | Theory (0) | `btn` | setClassesFilter( |
| `#filter-practical` | Practical (0) | `btn` | setClassesFilter( |
| `#null` | Icon Button | `btn` | closeSelfAttendanceModal() |
| `#submit-self-btn` | Submit Presence Claim → | `btn btn-success` | Event handler bound |
| `#null` | &times; | `btn-close` | closeJoinModal() |
| `#null` | Cancel | `btn btn-secondary` | closeJoinModal() |
| `#btn-submit-join` | Join Class | `btn btn-primary` | Event handler bound |
| `#null` | &times; | `btn-close` | closeStudentStreamModal() |
| `#null` | Close | `btn btn-secondary btn-sm` | closeStudentStreamModal() |
| `#fab-action-pin` | PIN Attendance | `gc-fab-menu-action` | openSelfAttendanceModal( |
| `#fab-action-qr` | Scan QR (Camera) | `gc-fab-menu-action` | openCameraQrModal(); toggleStudentFabMenu(false); |
| `#fab-action-join-class` | Join Class | `gc-fab-menu-action` | openStudentJoinModal(); toggleStudentFabMenu(false); |
| `#student-fab-trigger` | Student Actions | `gc-fab-trigger` | toggleStudentFabMenu() |
| `#null` | &times; | `btn-close` | closeCameraQrModal() |
| `#null` | Submit | `btn btn-primary` | submitManualQrToken() |
| `#null` | &times; | `btn-close` | closeCompleteProfileModal() |
| `#null` | Remind Me Later | `btn btn-secondary btn-sm` | closeCompleteProfileModal() |
| `#pop-submit-btn` | Save &amp; Complete Profile | `btn btn-primary btn-sm` | Event handler bound |

#### 📝 Form Inputs & Dropdown Selectors (12 Cataloged)
| Control ID | Type | Name / Purpose | Placeholder / Options | Required |
| :--- | :--- | :--- | :--- | :--- |
| `#search-classes` | `text` | Input | `Search classes, subjects or teachers...` | No |
| `#self-pin` | `text` | Input | `e.g. 482109` | No |
| `#self-qr` | `text` | Input | `Scan or paste QR token` | No |
| `#join-invite-code` | `text` | Input | `e.g. 7X9K2P` | No |
| `#manual-qr-token-input` | `text` | Input | `Paste token hash...` | No |
| `#pop-father-name` | `text` | Input | `e.g. Rajesh Sharma` | No |
| `#pop-mother-name` | `text` | Input | `e.g. Sunita Sharma` | No |
| `#pop-dob` | `date` | Input | `None` | No |
| `#pop-aadhar` | `text` | Input | `e.g. 1234 5678 9012` | No |
| `#self-method` | `select` | Dropdown | Dynamic options | No |
| `#pop-gender` | `select` | Dropdown | Dynamic options | No |
| `#pop-category` | `select` | Dropdown | Dynamic options | No |

#### 🪟 Modals, Dialogs & Drawers (9 Cataloged)
##### Modal 1: `#self-attendance-modal` — Submit Classroom Attendance
- **Container ID**: `#self-attendance-modal`
- **Submit Action**: `Form submission`

##### Modal 2: `#join-group-modal` — Join Class with Code
- **Container ID**: `#join-group-modal`
- **Submit Action**: `Form submission`

##### Modal 3: `#join-invite-code` — Modal Dialog
- **Container ID**: `#join-invite-code`
- **Submit Action**: `Form submission`
- **Contained Fields**: `join-invite-code`

##### Modal 4: `#btn-submit-join` — Modal Dialog
- **Container ID**: `#btn-submit-join`
- **Submit Action**: `closeJoinModal()`

##### Modal 5: `#student-stream-modal` — Class Stream
- **Container ID**: `#student-stream-modal`
- **Submit Action**: `Form submission`

##### Modal 6: `#stream-posts-container` — Modal Dialog
- **Container ID**: `#stream-posts-container`
- **Submit Action**: `Form submission`

##### Modal 7: `#camera-qr-modal` — Scan Attendance QR
- **Container ID**: `#camera-qr-modal`
- **Submit Action**: `Form submission`

##### Modal 8: `#complete-profile-modal` — Modal Dialog
- **Container ID**: `#complete-profile-modal`
- **Submit Action**: `Form submission`

##### Modal 9: `#pop-submit-btn` — Modal Dialog
- **Container ID**: `#pop-submit-btn`
- **Submit Action**: `closeCompleteProfileModal()`

#### 📡 Backend REST API Contracts (7 Integrated)
| Method | Endpoint | Type | Purpose / Trigger |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/logout` | `REST` | Core academic service call |
| `GET` | `/api/v1/auth/me` | `REST` | Core academic service call |
| `GET` | `/api/v1/auth/heartbeat` | `REST` | Core academic service call |
| `POST` | `/api/v1/faculty/export/table-to-excel` | `REST` | Core academic service call |
| `GET` | `/api/v1/notifications` | `REST` | Core academic service call |
| `PUT` | `/api/v1/notifications/:id/read` | `REST` | Core academic service call |
| `PUT` | `/api/v1/notifications/mark-all-read` | `REST` | Core academic service call |

---

### STU-002: My Attendance & Calendar — Student Portal

- **URL Route**: `/student/attendance.html`
- **Source File**: [frontend/student/attendance/index.html](file:///e:/uiap/VidyaOS/frontend/student/attendance/index.html)
- **Target Role**: `Student`
- **Shell & Styling**: Student Shell (`classroom-nav.css`, `nav.js`)
- **Responsive States**: Desktop: full monthly calendar ledger; Mobile: swipeable monthly view + subject summary
- **URL Parameters**: `subject_id`, `group_id`

#### 🎯 Purpose & Academic Workflow
Personal monthly attendance ledger, present/absent breakdown

#### 🔘 Action Buttons & Interactive Controls (5 Cataloged)
| Button ID | Label / Text | Class / Variant | Action / Behavior |
| :--- | :--- | :--- | :--- |
| `#null` | Submit PIN | `btn btn-secondary` | submitLivePin() |
| `#null` | &times; | `btn` | closeCalendarModal() |
| `#null` | ◀ | `calendar-nav-btn` | prevMonth() |
| `#null` | ▶ | `calendar-nav-btn` | nextMonth() |
| `#null` | Close Calendar | `btn btn-secondary btn-sm` | closeCalendarModal() |

#### 📝 Form Inputs & Dropdown Selectors (3 Cataloged)
| Control ID | Type | Name / Purpose | Placeholder / Options | Required |
| :--- | :--- | :--- | :--- | :--- |
| `#live-pin-input` | `text` | Input | `6-DIGIT PIN` | No |
| `#cal-month-select` | `select` | Dropdown | Dynamic options | No |
| `#cal-year-select` | `select` | Dropdown | Dynamic options | No |

#### 🪟 Modals, Dialogs & Drawers (2 Cataloged)
##### Modal 1: `#calendar-modal` — Database Management Systems
- **Container ID**: `#calendar-modal`
- **Submit Action**: `Form submission`

##### Modal 2: `#cal-month-stats` — Modal Dialog
- **Container ID**: `#cal-month-stats`
- **Submit Action**: `Form submission`

#### 📡 Backend REST API Contracts (6 Integrated)
| Method | Endpoint | Type | Purpose / Trigger |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/logout` | `REST` | Core academic service call |
| `GET` | `/api/v1/auth/me` | `REST` | Core academic service call |
| `GET` | `/api/v1/auth/heartbeat` | `REST` | Core academic service call |
| `GET` | `/api/v1/notifications` | `REST` | Core academic service call |
| `PUT` | `/api/v1/notifications/:id/read` | `REST` | Core academic service call |
| `PUT` | `/api/v1/notifications/mark-all-read` | `REST` | Core academic service call |

---

### STU-003: To-do — Student Portal | VidyaOS Classroom

- **URL Route**: `/student/assignments.html`
- **Source File**: [frontend/student/assignments/index.html](file:///e:/uiap/VidyaOS/frontend/student/assignments/index.html)
- **Target Role**: `Student`
- **Shell & Styling**: Student Shell (`classroom-nav.css`, `nav.js`)
- **Responsive States**: Desktop: 3-column Kanban/tab view; Mobile: segmented control list

#### 🎯 Purpose & Academic Workflow
To-do assignments, submitted tasks, graded coursework

#### 🔘 Action Buttons & Interactive Controls (3 Cataloged)
| Button ID | Label / Text | Class / Variant | Action / Behavior |
| :--- | :--- | :--- | :--- |
| `#tab-btn-assigned` | Assigned 0 | `todo-tab-btn active` | switchTodoTab( |
| `#tab-btn-missing` | Missing 0 | `todo-tab-btn` | switchTodoTab( |
| `#tab-btn-done` | Done 0 | `todo-tab-btn` | switchTodoTab( |

#### 📝 Form Inputs & Dropdown Selectors (1 Cataloged)
| Control ID | Type | Name / Purpose | Placeholder / Options | Required |
| :--- | :--- | :--- | :--- | :--- |
| `#todo-class-filter` | `select` | Dropdown | Dynamic options | No |

#### 🪟 Modals, Dialogs & Drawers (0 Cataloged)
*No overlay modals on this page; all workflows occur inline or via full-page transitions.*

#### 📡 Backend REST API Contracts (7 Integrated)
| Method | Endpoint | Type | Purpose / Trigger |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/logout` | `REST` | Core academic service call |
| `GET` | `/api/v1/auth/me` | `REST` | Core academic service call |
| `GET` | `/api/v1/auth/heartbeat` | `REST` | Core academic service call |
| `POST` | `/api/v1/faculty/export/table-to-excel` | `REST` | Core academic service call |
| `GET` | `/api/v1/notifications` | `REST` | Core academic service call |
| `PUT` | `/api/v1/notifications/:id/read` | `REST` | Core academic service call |
| `PUT` | `/api/v1/notifications/mark-all-read` | `REST` | Core academic service call |

---

### STU-004: Classwork — Student Portal | VidyaOS

- **URL Route**: `/student/group-detail.html`
- **Source File**: [frontend/student/group-detail/index.html](file:///e:/uiap/VidyaOS/frontend/student/group-detail/index.html)
- **Target Role**: `Student`
- **Shell & Styling**: Student Shell (`classroom-nav.css`, `nav.js`)
- **Responsive States**: Desktop: wide stream timeline; Mobile: compact vertical timeline
- **URL Parameters**: `id`, `groupId`, `group`, `tab`

#### 🎯 Purpose & Academic Workflow
Enrolled course stream, teacher announcements, materials

#### 🔘 Action Buttons & Interactive Controls (26 Cataloged)
| Button ID | Label / Text | Class / Variant | Action / Behavior |
| :--- | :--- | :--- | :--- |
| `#null` | Icon Button | `btn-icon-ghost` | toggleStudentDrawer() |
| `#mobile-btn-filter` | Filter Units | `btn-icon-ghost` | toggleMobileUnitFilter() |
| `#btn-theme-toggle-mobile` | Toggle Theme | `btn-icon-ghost` | toggleTheme() |
| `#null` | Options | `btn-icon-ghost` | toggleMobileOptionsMenu() |
| `#null` | Refresh | `mobile-opt-item` | refreshClassroomData() |
| `#null` | Class Info | `mobile-opt-item` | showCourseInfoModal() |
| `#null` | Icon Button | `btn-icon-ghost` | closeMobileUnitFilter() |
| `#null` | Icon Button | `btn-icon-ghost` | closeCourseInfoModal() |
| `#null` | Close | `btn btn-outline` | closeCourseInfoModal() |
| `#tab-btn-stream` | Stream | `student-tab-btn` | switchStudentTab( |
| `#tab-btn-classwork` | Classwork | `student-tab-btn active` | switchStudentTab( |
| `#tab-btn-people` | People | `student-tab-btn` | switchStudentTab( |
| `#tab-btn-attendance` | Attendance | `student-tab-btn` | switchStudentTab( |
| `#null` | Icon Button | `btn btn-secondary btn-sm` | clearComposerAttachment() |
| `#null` | Cancel | `btn btn-secondary btn-sm` | collapseStudentComposer() |
| `#btn-post-announcement` | Post | `btn btn-primary btn-sm` | submitStudentAnnouncement() |
| `#mob-tab-stream` | Stream | `mobile-bottom-nav-item` | switchStudentTab( |
| `#mob-tab-classwork` | Classwork | `mobile-bottom-nav-item active` | switchStudentTab( |
| `#mob-tab-people` | People | `mobile-bottom-nav-item` | switchStudentTab( |
| `#mob-tab-attendance` | Attendance | `mobile-bottom-nav-item` | switchStudentTab( |
| `#null` | Options | `btn-icon-ghost` | Event handler bound |
| `#null` | Icon Button | `comment-send-btn` | submitPcClassComment() |
| `#pc-btn-unsubmit` | Unsubmit | `btn-pwd-unsubmit` | handleUnsubmitWork() |
| `#pc-btn-turnin` | Turn in | `btn-pwd-turnin` | handleStudentWorkSubmission() |
| `#null` | Icon Button | `btn-icon-ghost` | closeStudentWorkDetails(event) |
| `#null` | Unsubmit | `btn btn-secondary btn-sm` | handleUnsubmitWork() |

#### 📝 Form Inputs & Dropdown Selectors (5 Cataloged)
| Control ID | Type | Name / Purpose | Placeholder / Options | Required |
| :--- | :--- | :--- | :--- | :--- |
| `#null` | `text` | Input | `Announce something to your class...` | No |
| `#composer-file-input` | `file` | Input | `None` | No |
| `#pc-class-comment-input` | `text` | Input | `Add comment...` | No |
| `#pc-work-file-input` | `file` | Input | `None` | No |
| `#mobile-work-file-input` | `file` | Input | `None` | No |

#### 🪟 Modals, Dialogs & Drawers (2 Cataloged)
##### Modal 1: `#mobile-unit-filter-modal` — Filter by Topic
- **Container ID**: `#mobile-unit-filter-modal`
- **Submit Action**: `Form submission`

##### Modal 2: `#student-course-info-modal` — Class Information
- **Container ID**: `#student-course-info-modal`
- **Submit Action**: `Form submission`

#### 📡 Backend REST API Contracts (10 Integrated)
| Method | Endpoint | Type | Purpose / Trigger |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/logout` | `REST` | Core academic service call |
| `GET` | `/api/v1/auth/me` | `REST` | Core academic service call |
| `GET` | `/api/v1/auth/heartbeat` | `REST` | Core academic service call |
| `POST` | `/api/v1/faculty/export/table-to-excel` | `REST` | Core academic service call |
| `GET` | `/api/v1/notifications` | `REST` | Core academic service call |
| `PUT` | `/api/v1/notifications/:id/read` | `REST` | Core academic service call |
| `PUT` | `/api/v1/notifications/mark-all-read` | `REST` | Core academic service call |
| `POST` | `/api/v1/teaching-groups/:id/stream` | `REST` | Core academic service call |
| `POST` | `/api/v1/assignments/:id/submit` | `REST` | Core academic service call |
| `POST` | `/api/v1/assignments/:id/unsubmit` | `REST` | Core academic service call |

---

### STU-005: My Test Scores & Marks — Student Portal

- **URL Route**: `/student/scores.html`
- **Source File**: [frontend/student/scores/index.html](file:///e:/uiap/VidyaOS/frontend/student/scores/index.html)
- **Target Role**: `Student`
- **Shell & Styling**: Student Shell (`classroom-nav.css`, `nav.js`)
- **Responsive States**: Desktop: subject-wise score table; Mobile: collapsible test cards

#### 🎯 Purpose & Academic Workflow
Class test scores, mid-term results, faculty feedback

#### 🔘 Action Buttons & Interactive Controls (10 Cataloged)
| Button ID | Label / Text | Class / Variant | Action / Behavior |
| :--- | :--- | :--- | :--- |
| `#null` | All Semesters | `active` | setSemesterFilter( |
| `#null` | Sem 1 | `btn` | setSemesterFilter( |
| `#null` | Sem 2 | `btn` | setSemesterFilter( |
| `#null` | Sem 3 | `btn` | setSemesterFilter( |
| `#null` | Sem 4 | `btn` | setSemesterFilter( |
| `#null` | Sem 5 | `btn` | setSemesterFilter( |
| `#null` | Sem 6 | `btn` | setSemesterFilter( |
| `#null` | All (0) | `active` | setTypeFilter( |
| `#null` | Exams &amp; Tests (0) | `btn` | setTypeFilter( |
| `#null` | Assignments (0) | `btn` | setTypeFilter( |

#### 📝 Form Inputs & Dropdown Selectors (1 Cataloged)
| Control ID | Type | Name / Purpose | Placeholder / Options | Required |
| :--- | :--- | :--- | :--- | :--- |
| `#scores-search-input` | `search` | Input | `Search assessments, subjects...` | No |

#### 🪟 Modals, Dialogs & Drawers (0 Cataloged)
*No overlay modals on this page; all workflows occur inline or via full-page transitions.*

#### 📡 Backend REST API Contracts (7 Integrated)
| Method | Endpoint | Type | Purpose / Trigger |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/logout` | `REST` | Core academic service call |
| `GET` | `/api/v1/auth/me` | `REST` | Core academic service call |
| `GET` | `/api/v1/auth/heartbeat` | `REST` | Core academic service call |
| `POST` | `/api/v1/faculty/export/table-to-excel` | `REST` | Core academic service call |
| `GET` | `/api/v1/notifications` | `REST` | Core academic service call |
| `PUT` | `/api/v1/notifications/:id/read` | `REST` | Core academic service call |
| `PUT` | `/api/v1/notifications/mark-all-read` | `REST` | Core academic service call |

---

### STU-006: Academic Timetable (PDF) — Student Portal

- **URL Route**: `/student/timetable.html`
- **Source File**: [frontend/student/timetable/index.html](file:///e:/uiap/VidyaOS/frontend/student/timetable/index.html)
- **Target Role**: `Student`
- **Shell & Styling**: Student Shell (`classroom-nav.css`, `nav.js`)
- **Responsive States**: Desktop: 6-day timetable grid; Mobile: single-day view with horizontal day tabs

#### 🎯 Purpose & Academic Workflow
Weekly class timetable, classroom locations, faculty names

#### 🔘 Action Buttons & Interactive Controls (6 Cataloged)
| Button ID | Label / Text | Class / Variant | Action / Behavior |
| :--- | :--- | :--- | :--- |
| `#null` | My Year Timetable | `tt-year-pill active` | switchYearFilter( |
| `#null` | All Department Timetables | `tt-year-pill` | switchYearFilter( |
| `#null` | 1st Year | `tt-year-pill` | switchYearFilter(1) |
| `#null` | 2nd Year | `tt-year-pill` | switchYearFilter(2) |
| `#null` | 3rd Year | `tt-year-pill` | switchYearFilter(3) |
| `#null` | ✕ Close | `btn btn-secondary btn-sm` | closePreviewModal() |

#### 📝 Form Inputs & Dropdown Selectors (0 Cataloged)
*No direct form inputs on this page; view-only or modal-driven input flow.*

#### 🪟 Modals, Dialogs & Drawers (2 Cataloged)
##### Modal 1: `#tt-preview-modal` — Timetable Preview
- **Container ID**: `#tt-preview-modal`
- **Submit Action**: `Form submission`

##### Modal 2: `#tt-modal-iframe` — Modal Dialog
- **Container ID**: `#tt-modal-iframe`
- **Submit Action**: `Form submission`

#### 📡 Backend REST API Contracts (7 Integrated)
| Method | Endpoint | Type | Purpose / Trigger |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/logout` | `REST` | Core academic service call |
| `GET` | `/api/v1/auth/me` | `REST` | Core academic service call |
| `GET` | `/api/v1/auth/heartbeat` | `REST` | Core academic service call |
| `POST` | `/api/v1/faculty/export/table-to-excel` | `REST` | Core academic service call |
| `GET` | `/api/v1/notifications` | `REST` | Core academic service call |
| `PUT` | `/api/v1/notifications/:id/read` | `REST` | Core academic service call |
| `PUT` | `/api/v1/notifications/mark-all-read` | `REST` | Core academic service call |

---

### STU-007: Leave Applications — Student Portal

- **URL Route**: `/student/leave.html`
- **Source File**: [frontend/student/leave/index.html](file:///e:/uiap/VidyaOS/frontend/student/leave/index.html)
- **Target Role**: `Student`
- **Shell & Styling**: Student Shell (`classroom-nav.css`, `nav.js`)
- **Responsive States**: Desktop: side-by-side apply form + history table; Mobile: apply modal + history cards

#### 🎯 Purpose & Academic Workflow
Apply for medical / duty leave, track application approval

#### 🔘 Action Buttons & Interactive Controls (5 Cataloged)
| Button ID | Label / Text | Class / Variant | Action / Behavior |
| :--- | :--- | :--- | :--- |
| `#null` | Medical / Sick Leave | `reason-chip` | setLeaveReason( |
| `#null` | Family Function | `reason-chip` | setLeaveReason( |
| `#null` | Official Event | `reason-chip` | setLeaveReason( |
| `#null` | Personal Work | `reason-chip` | setLeaveReason( |
| `#null` | Submit Leave Application | `btn btn-primary` | Event handler bound |

#### 📝 Form Inputs & Dropdown Selectors (2 Cataloged)
| Control ID | Type | Name / Purpose | Placeholder / Options | Required |
| :--- | :--- | :--- | :--- | :--- |
| `#f-from` | `date` | Input | `None` | No |
| `#f-to` | `date` | Input | `None` | No |

#### 🪟 Modals, Dialogs & Drawers (0 Cataloged)
*No overlay modals on this page; all workflows occur inline or via full-page transitions.*

#### 📡 Backend REST API Contracts (7 Integrated)
| Method | Endpoint | Type | Purpose / Trigger |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/logout` | `REST` | Core academic service call |
| `GET` | `/api/v1/auth/me` | `REST` | Core academic service call |
| `GET` | `/api/v1/auth/heartbeat` | `REST` | Core academic service call |
| `POST` | `/api/v1/faculty/export/table-to-excel` | `REST` | Core academic service call |
| `GET` | `/api/v1/notifications` | `REST` | Core academic service call |
| `PUT` | `/api/v1/notifications/:id/read` | `REST` | Core academic service call |
| `PUT` | `/api/v1/notifications/mark-all-read` | `REST` | Core academic service call |

---

### STU-008: Student Profile & Academic Credentials — College Attendance System

- **URL Route**: `/student/profile.html`
- **Source File**: [frontend/student/profile/index.html](file:///e:/uiap/VidyaOS/frontend/student/profile/index.html)
- **Target Role**: `Student`
- **Shell & Styling**: Student Shell (`classroom-nav.css`, `nav.js`)
- **Responsive States**: Desktop: 2-column card layout; Mobile: single-column profile view
- **URL Parameters**: `complete`

#### 🎯 Purpose & Academic Workflow
Academic credentials, PRN, branch, semester, active devices

#### 🔘 Action Buttons & Interactive Controls (6 Cataloged)
| Button ID | Label / Text | Class / Variant | Action / Behavior |
| :--- | :--- | :--- | :--- |
| `#null` | Icon Button | `password-toggle-btn` | togglePassVisibility( |
| `#save-profile-btn` | Save Profile Updates | `btn btn-primary` | Event handler bound |
| `#null` | Print / PDF | `btn btn-secondary btn-sm` | exportStudentDossier( |
| `#null` | Excel (.csv) | `btn btn-secondary btn-sm` | exportStudentDossier( |
| `#null` | Word (.doc) | `btn btn-secondary btn-sm` | exportStudentDossier( |
| `#save-demographics-btn` | Save Demographic Details | `btn btn-primary` | Event handler bound |

#### 📝 Form Inputs & Dropdown Selectors (12 Cataloged)
| Control ID | Type | Name / Purpose | Placeholder / Options | Required |
| :--- | :--- | :--- | :--- | :--- |
| `#profile-username` | `text` | Input | `None` | No |
| `#profile-email` | `email` | Input | `student@gmail.com` | No |
| `#current-password` | `password` | Input | `Required only if changing password` | No |
| `#new-password` | `password` | Input | `Minimum 8 characters` | No |
| `#confirm-password` | `password` | Input | `Re-enter new password` | No |
| `#profile-father-name` | `text` | Input | `e.g. Rajesh Sharma` | No |
| `#profile-mother-name` | `text` | Input | `e.g. Sunita Sharma` | No |
| `#profile-dob` | `date` | Input | `None` | No |
| `#profile-aadhar` | `text` | Input | `e.g. 1234 5678 9012` | No |
| `#profile-phone` | `tel` | Input | `10-digit mobile` | No |
| `#profile-gender` | `select` | Dropdown | Dynamic options | No |
| `#profile-category` | `select` | Dropdown | Dynamic options | No |

#### 🪟 Modals, Dialogs & Drawers (0 Cataloged)
*No overlay modals on this page; all workflows occur inline or via full-page transitions.*

#### 📡 Backend REST API Contracts (7 Integrated)
| Method | Endpoint | Type | Purpose / Trigger |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/logout` | `REST` | Core academic service call |
| `GET` | `/api/v1/auth/me` | `REST` | Core academic service call |
| `GET` | `/api/v1/auth/heartbeat` | `REST` | Core academic service call |
| `POST` | `/api/v1/faculty/export/table-to-excel` | `REST` | Core academic service call |
| `GET` | `/api/v1/notifications` | `REST` | Core academic service call |
| `PUT` | `/api/v1/notifications/:id/read` | `REST` | Core academic service call |
| `PUT` | `/api/v1/notifications/mark-all-read` | `REST` | Core academic service call |

---

## 🌐 5. Institutional System Administration (ADM)

*Institutional academic hierarchy, department management, global settings, audit logging, and accreditation reports.*

### ADM-001: Academic Departments & Branches — Admin Console

- **URL Route**: `/admin/academic-structure.html`
- **Source File**: [frontend/admin/academic-structure/index.html](file:///e:/uiap/VidyaOS/frontend/admin/academic-structure/index.html)
- **Target Role**: `Admin`
- **Shell & Styling**: Admin Shell (`nav.css`, `nav.js`)
- **Responsive States**: Desktop: high-density table + KPI cards; Mobile: automatic card view + sliding bottom-sheet modal

#### 🎯 Purpose & Academic Workflow
Department, course, semester, section and room structure management

#### 🔘 Action Buttons & Interactive Controls (6 Cataloged)
| Button ID | Label / Text | Class / Variant | Action / Behavior |
| :--- | :--- | :--- | :--- |
| `#null` | &times; | `btn` | closeDeptModal() |
| `#dept-delete-btn` | Delete | `btn-danger-soft` | deleteCurrentDeptFromModal() |
| `#null` | Cancel | `btn btn-secondary` | closeDeptModal() |
| `#dept-submit-btn` | Save Department | `btn btn-primary` | Event handler bound |
| `#null` | Cancel | `btn btn-secondary` | closeDeleteModal() |
| `#delete-modal-confirm-btn` | Delete | `btn-danger` | executeDeleteDepartment() |

#### 📝 Form Inputs & Dropdown Selectors (7 Cataloged)
| Control ID | Type | Name / Purpose | Placeholder / Options | Required |
| :--- | :--- | :--- | :--- | :--- |
| `#dept-search` | `text` | Input | `Search by code or name...` | No |
| `#dept-id` | `hidden` | Input | `None` | No |
| `#dept-code` | `text` | Input | `e.g. IT, CE, ME, CL, EE` | No |
| `#dept-name` | `text` | Input | `e.g. Information Technology` | No |
| `#delete-modal-code-input` | `text` | Input | `Type department code here` | No |
| `#dept-duration` | `select` | Dropdown | Dynamic options | No |
| `#dept-status` | `select` | Dropdown | Dynamic options | No |

#### 🪟 Modals, Dialogs & Drawers (2 Cataloged)
##### Modal 1: `#dept-modal` — Edit Department
- **Container ID**: `#dept-modal`
- **Submit Action**: `Form submission`

##### Modal 2: `#delete-confirm-modal` — Modal Dialog
- **Container ID**: `#delete-confirm-modal`
- **Submit Action**: `Form submission`

#### 📡 Backend REST API Contracts (6 Integrated)
| Method | Endpoint | Type | Purpose / Trigger |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/logout` | `REST` | Core academic service call |
| `GET` | `/api/v1/auth/me` | `REST` | Core academic service call |
| `GET` | `/api/v1/auth/heartbeat` | `REST` | Core academic service call |
| `GET` | `/api/v1/notifications` | `REST` | Core academic service call |
| `PUT` | `/api/v1/notifications/:id/read` | `REST` | Core academic service call |
| `PUT` | `/api/v1/notifications/mark-all-read` | `REST` | Core academic service call |

---

### ADM-003: Admin Dashboard — VidyaOS Institutional Console

- **URL Route**: `/admin/dashboard.html`
- **Source File**: [frontend/admin/dashboard/index.html](file:///e:/uiap/VidyaOS/frontend/admin/dashboard/index.html)
- **Target Role**: `Admin`
- **Shell & Styling**: Admin Shell (`nav.css`, `nav.js`)
- **Responsive States**: Desktop: 3-column KPI grid + module cards; Mobile: single-column scrollable metric cards

#### 🎯 Purpose & Academic Workflow
System-wide institutional KPIs, attendance averages, active sessions

#### 🔘 Action Buttons & Interactive Controls (0 Cataloged)
*This page utilizes card-level tap targets, contextual links, and direct row navigation without standalone static toolbar buttons.*

#### 📝 Form Inputs & Dropdown Selectors (0 Cataloged)
*No direct form inputs on this page; view-only or modal-driven input flow.*

#### 🪟 Modals, Dialogs & Drawers (0 Cataloged)
*No overlay modals on this page; all workflows occur inline or via full-page transitions.*

#### 📡 Backend REST API Contracts (6 Integrated)
| Method | Endpoint | Type | Purpose / Trigger |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/logout` | `REST` | Core academic service call |
| `GET` | `/api/v1/auth/me` | `REST` | Core academic service call |
| `GET` | `/api/v1/auth/heartbeat` | `REST` | Core academic service call |
| `GET` | `/api/v1/notifications` | `REST` | Core academic service call |
| `PUT` | `/api/v1/notifications/:id/read` | `REST` | Core academic service call |
| `PUT` | `/api/v1/notifications/mark-all-read` | `REST` | Core academic service call |

---

### ADM-004: Institutional Audit Trail — Admin Console

- **URL Route**: `/admin/audit-logs.html`
- **Source File**: [frontend/admin/audit-logs/index.html](file:///e:/uiap/VidyaOS/frontend/admin/audit-logs/index.html)
- **Target Role**: `Admin`
- **Shell & Styling**: Admin Shell (`admin-nav.css`, `admin-nav.js`)
- **Responsive States**: Desktop: tabular event log with timestamp filters; Mobile: stacked event timeline

#### 🎯 Purpose & Academic Workflow
Compliance audit trail, login attempts, grade changes, ledger edits

#### 🔘 Action Buttons & Interactive Controls (8 Cataloged)
| Button ID | Label / Text | Class / Variant | Action / Behavior |
| :--- | :--- | :--- | :--- |
| `#null` | Export JSON | `btn btn-secondary btn-sm` | exportLogsJson() |
| `#null` | Refresh Feed | `btn btn-primary btn-sm` | loadAuditLogs() |
| `#null` | Apply | `btn btn-primary` | applyFilters() |
| `#null` | Reset | `btn btn-secondary` | resetFilters() |
| `#prev-btn` | &larr; Previous | `btn btn-secondary btn-sm` | changePage(-1) |
| `#next-btn` | Next &rarr; | `btn btn-secondary btn-sm` | changePage(1) |
| `#null` | Icon Button | `btn btn-secondary btn-sm` | closeModal() |
| `#null` | Close | `btn btn-secondary btn-sm` | closeModal() |

#### 📝 Form Inputs & Dropdown Selectors (5 Cataloged)
| Control ID | Type | Name / Purpose | Placeholder / Options | Required |
| :--- | :--- | :--- | :--- | :--- |
| `#filter-search` | `text` | Input | `Search actor, email, role, or details...` | No |
| `#filter-start-date` | `date` | Input | `None` | No |
| `#filter-end-date` | `date` | Input | `None` | No |
| `#filter-event` | `select` | Dropdown | Dynamic options | No |
| `#filter-target` | `select` | Dropdown | Dynamic options | No |

#### 🪟 Modals, Dialogs & Drawers (2 Cataloged)
##### Modal 1: `#details-modal` — Audit Event Details
- **Container ID**: `#details-modal`
- **Submit Action**: `Form submission`

##### Modal 2: `#modal-meta-line` — Modal Dialog
- **Container ID**: `#modal-meta-line`
- **Submit Action**: `Form submission`

#### 📡 Backend REST API Contracts (6 Integrated)
| Method | Endpoint | Type | Purpose / Trigger |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/logout` | `REST` | Core academic service call |
| `GET` | `/api/v1/auth/me` | `REST` | Core academic service call |
| `GET` | `/api/v1/auth/heartbeat` | `REST` | Core academic service call |
| `GET` | `/api/v1/notifications` | `REST` | Core academic service call |
| `PUT` | `/api/v1/notifications/:id/read` | `REST` | Core academic service call |
| `PUT` | `/api/v1/notifications/mark-all-read` | `REST` | Core academic service call |

---

### ADM-005: Admin Console

- **URL Route**: `/admin/reports.html`
- **Source File**: [frontend/admin/reports/index.html](file:///e:/uiap/VidyaOS/frontend/admin/reports/index.html)
- **Target Role**: `Admin`
- **Shell & Styling**: Admin Shell (`admin-nav.css`, `admin-nav.js`)
- **Responsive States**: Desktop: parameter configuration grid + live preview; Mobile: vertical step form

#### 🎯 Purpose & Academic Workflow
Institutional attendance reports, accreditation extracts, Excel export

#### 🔘 Action Buttons & Interactive Controls (7 Cataloged)
| Button ID | Label / Text | Class / Variant | Action / Behavior |
| :--- | :--- | :--- | :--- |
| `#null` | Refresh | `btn btn-secondary btn-sm` | loadDeptReport(true) |
| `#btn-export-excel` | Export Report | `btn btn-primary btn-sm` | exportReport() |
| `#clear-search-btn` | Clear search | `clear-search-icon` | clearSearchInput() |
| `#btn-toggle-filters` | Filters 0 | `filter-toggle-btn` | toggleFilterDrawer() |
| `#btn-reset-filters` | Reset all filters | `filter-reset-icon-btn` | resetFilters() |
| `#btn-chart-trend` | Daily Activity | `chart-tab-btn active` | switchReportChart( |
| `#btn-chart-cohort` | Cohort Share | `chart-tab-btn` | switchReportChart( |

#### 📝 Form Inputs & Dropdown Selectors (5 Cataloged)
| Control ID | Type | Name / Purpose | Placeholder / Options | Required |
| :--- | :--- | :--- | :--- | :--- |
| `#report-search` | `text` | Input | `Search cohorts, depts...` | No |
| `#report-dept` | `select` | Dropdown | Dynamic options | No |
| `#report-date-preset` | `select` | Dropdown | Dynamic options | No |
| `#report-year` | `select` | Dropdown | Dynamic options | No |
| `#report-sem` | `select` | Dropdown | Dynamic options | No |

#### 🪟 Modals, Dialogs & Drawers (0 Cataloged)
*No overlay modals on this page; all workflows occur inline or via full-page transitions.*

#### 📡 Backend REST API Contracts (6 Integrated)
| Method | Endpoint | Type | Purpose / Trigger |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/logout` | `REST` | Core academic service call |
| `GET` | `/api/v1/auth/me` | `REST` | Core academic service call |
| `GET` | `/api/v1/auth/heartbeat` | `REST` | Core academic service call |
| `GET` | `/api/v1/notifications` | `REST` | Core academic service call |
| `PUT` | `/api/v1/notifications/:id/read` | `REST` | Core academic service call |
| `PUT` | `/api/v1/notifications/mark-all-read` | `REST` | Core academic service call |

---

### ADM-006: Institution Settings — Admin Console

- **URL Route**: `/admin/settings.html`
- **Source File**: [frontend/admin/settings/index.html](file:///e:/uiap/VidyaOS/frontend/admin/settings/index.html)
- **Target Role**: `Admin`
- **Shell & Styling**: Admin Shell (`admin-nav.css`, `admin-nav.js`)
- **Responsive States**: Desktop: grouped settings form; Mobile: full-width card list with toggle controls

#### 🎯 Purpose & Academic Workflow
Institutional policies, academic terms, attendance minimum thresholds

#### 🔘 Action Buttons & Interactive Controls (6 Cataloged)
| Button ID | Label / Text | Class / Variant | Action / Behavior |
| :--- | :--- | :--- | :--- |
| `#null` | Reload | `btn btn-secondary btn-sm` | loadSettings(true) |
| `#null` | Upload Logo | `btn btn-secondary btn-sm` | document.getElementById( |
| `#null` | Reset default logo | `btn btn-icon-square` | resetDefaultLogo() |
| `#null` | Replace Image | `btn btn-secondary btn-sm` | document.getElementById( |
| `#null` | Reset default campus banner | `btn btn-icon-square` | resetDefaultBanner() |
| `#save-settings-btn` | Save Changes | `btn btn-primary btn-save-fullwidth` | Event handler bound |

#### 📝 Form Inputs & Dropdown Selectors (9 Cataloged)
| Control ID | Type | Name / Purpose | Placeholder / Options | Required |
| :--- | :--- | :--- | :--- | :--- |
| `#setting-inst-name` | `text` | Input | `Government Polytechnic College` | No |
| `#setting-inst-code` | `text` | Input | `GP-UBTER-101` | No |
| `#setting-affiliating-body` | `text` | Input | `UBTER (Uttarakhand Board of Technical Education)` | No |
| `#setting-location` | `text` | Input | `Uttarakhand, India` | No |
| `#setting-inst-tagline` | `hidden` | Input | `None` | No |
| `#upload-logo-file` | `file` | Input | `None` | No |
| `#setting-inst-logo-url` | `hidden` | Input | `None` | No |
| `#upload-banner-file` | `file` | Input | `None` | No |
| `#setting-inst-banner-url` | `hidden` | Input | `None` | No |

#### 🪟 Modals, Dialogs & Drawers (0 Cataloged)
*No overlay modals on this page; all workflows occur inline or via full-page transitions.*

#### 📡 Backend REST API Contracts (6 Integrated)
| Method | Endpoint | Type | Purpose / Trigger |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/logout` | `REST` | Core academic service call |
| `GET` | `/api/v1/auth/me` | `REST` | Core academic service call |
| `GET` | `/api/v1/auth/heartbeat` | `REST` | Core academic service call |
| `GET` | `/api/v1/notifications` | `REST` | Core academic service call |
| `PUT` | `/api/v1/notifications/:id/read` | `REST` | Core academic service call |
| `PUT` | `/api/v1/notifications/mark-all-read` | `REST` | Core academic service call |

---

### ADM-007: Administrator Profile & Security — VidyaOS Admin Console

- **URL Route**: `/admin/profile.html`
- **Source File**: [frontend/admin/profile/index.html](file:///e:/uiap/VidyaOS/frontend/admin/profile/index.html)
- **Target Role**: `Admin`
- **Shell & Styling**: Admin Shell (`admin-nav.css`, `admin-nav.js`)
- **Responsive States**: Desktop: two-column security overview; Mobile: stacked credentials with single-tap revoke

#### 🎯 Purpose & Academic Workflow
Administrator credentials, password rotation, active device sessions

#### 🔘 Action Buttons & Interactive Controls (13 Cataloged)
| Button ID | Label / Text | Class / Variant | Action / Behavior |
| :--- | :--- | :--- | :--- |
| `#btn-camera-upload` | Upload or Change Profile Photo | `profile-camera-btn` | triggerPhotoUpload() |
| `#btn-toggle-google-link` | Disconnect Google Account | `btn btn-secondary btn-sm` | handleGoogleLinkingToggle() |
| `#null` | Upload Photo | `btn btn-secondary btn-sm` | triggerPhotoUpload() |
| `#btn-remove-photo` | Remove | `btn btn-secondary btn-sm` | removeProfilePhoto() |
| `#save-admin-btn` | Update Profile | `btn btn-primary` | Event handler bound |
| `#null` | Icon Button | `password-toggle-btn` | togglePassVisibility( |
| `#save-pass-btn` | Change Password | `btn btn-secondary` | Event handler bound |
| `#null` | + New Administrator | `btn btn-primary` | openCreateAdminModal() |
| `#null` | &times; | `btn` | closeCreateAdminModal() |
| `#null` | Cancel | `btn btn-secondary` | closeCreateAdminModal() |
| `#btn-submit-new-admin` | Create Administrator | `btn btn-primary` | Event handler bound |
| `#null` | Cancel | `btn btn-secondary` | closeDeleteAdminModal() |
| `#confirm-delete-admin-btn` | Confirm Delete | `btn btn-danger` | Event handler bound |

#### 📝 Form Inputs & Dropdown Selectors (11 Cataloged)
| Control ID | Type | Name / Purpose | Placeholder / Options | Required |
| :--- | :--- | :--- | :--- | :--- |
| `#profile-photo-input` | `file` | Input | `None` | No |
| `#admin-username` | `text` | Input | `None` | No |
| `#admin-email` | `email` | Input | `None` | No |
| `#admin-current-pass` | `password` | Input | `••••••••` | No |
| `#admin-new-pass` | `password` | Input | `••••••••` | No |
| `#admin-confirm-pass` | `password` | Input | `••••••••` | No |
| `#new-admin-name` | `text` | Input | `e.g. Principal Rajesh Sharma` | No |
| `#new-admin-email` | `email` | Input | `e.g. principal@college.edu.in` | No |
| `#new-admin-pass` | `password` | Input | `••••••••` | No |
| `#new-admin-empid` | `text` | Input | `e.g. ADMIN-02` | No |
| `#new-admin-phone` | `tel` | Input | `10-digit mobile` | No |

#### 🪟 Modals, Dialogs & Drawers (2 Cataloged)
##### Modal 1: `#create-admin-modal` — Add System Administrator
- **Container ID**: `#create-admin-modal`
- **Submit Action**: `Form submission`

##### Modal 2: `#delete-admin-modal` — Modal Dialog
- **Container ID**: `#delete-admin-modal`
- **Submit Action**: `Form submission`

#### 📡 Backend REST API Contracts (6 Integrated)
| Method | Endpoint | Type | Purpose / Trigger |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/logout` | `REST` | Core academic service call |
| `GET` | `/api/v1/auth/me` | `REST` | Core academic service call |
| `GET` | `/api/v1/auth/heartbeat` | `REST` | Core academic service call |
| `GET` | `/api/v1/notifications` | `REST` | Core academic service call |
| `PUT` | `/api/v1/notifications/:id/read` | `REST` | Core academic service call |
| `PUT` | `/api/v1/notifications/mark-all-read` | `REST` | Core academic service call |

---

