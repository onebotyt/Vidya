# Reusable UI Component Inventory & Duplication Catalog

Last audited: 2026-10-28
Coverage: 145 files (117,655 lines of code) analyzed across `frontend/`.

## 1. Concrete Duplication Audit Findings

Our deep scan across 43 HTML, 51 JavaScript, and 51 CSS files revealed massive code duplication that can be consolidated using declarative, dynamic React-like patterns:

### A. Modal & Dialog Duplication (656 Instances across 32 HTML Pages)
- **Problem**: Every page hand-codes its own `<div class="modal-backdrop">` or `<div class="modal">` wrapper, header, close button, body, and footer with separate JavaScript open/close functions.
- **Top Duplicators**:
  - `faculty/group-detail/index.html`: **115** modal elements
  - `faculty/dashboard/index.html`: **81** modal elements
  - `faculty/groups/index.html`: **69** modal elements
  - `faculty/course-file/index.html`: **47** modal elements
  - `faculty/sheets/index.html`: **44** modal elements
  - `faculty/hod-teachers/index.html`: **30** modal elements
  - `faculty/students/index.html`: **30** modal elements
  - `admin/faculty/index.html`: **20** modal elements

### B. Delete Confirmation Modals (30 Copy-Pasted Implementations)
- **Problem**: Modals like `#delete-confirm-modal`, `#delete-modal`, and `#modal-delete-group` appear across 30 separate pages with identical danger iconography, "Are you sure you want to delete... This action cannot be undone" text, and identical Cancel/Delete action buttons.
- **Pages**: `admin/academic-structure`, `admin/faculty`, `faculty/assignments`, `faculty/dashboard`, `faculty/group-detail`, `faculty/groups`, `faculty/hod-teachers`, `faculty/registers`, `faculty/students`, `faculty/tests`.

### C. Edit / Create Form Modals (21 Copy-Pasted Implementations)
- **Problem**: Pages with edit boxes (some with 2 inputs like Name & Code, others with 5 inputs like Department, Designation, Email, Phone, Semester) write completely custom HTML dialogs and bespoke JS state bindings instead of passing a schema to a single dynamic form modal.
- **Examples**: `#modal-edit-group`, `#modal-edit-classwork`, `#modal-edit-row`, `#modal-unit-editor`, `#modal-edit-questions`.

### D. CSS Selector Duplication (126 Selectors Repeated in >3 Files)
- **Problem**: Individual page stylesheets duplicate global layout and navigation styling:
  - `.gc-navbar`: duplicated in **33** separate CSS files.
  - `.gc-brand-link`, `.gc-brand-icon`, `.gc-brand-title`, `.gc-nav-right`: duplicated in **24** separate CSS files.
  - `.gc-drawer-header`, `.gc-drawer-link`: duplicated in **20** separate CSS files.
  - Total CSS is currently **44,611 lines** due to repeated selector definitions.

---

## 2. Component Inventory & Target React-Like Primitives

| Component ID | Name / Source | Responsibility | Props / Schema Variants | Consumers (Page IDs) | Accessibility & Behavior | Shared or Feature-Specific | Target Status |
|---|---|---|---|---|---|---|---|
| UI-001 | `ConfirmDialog` (`/components/dialog.js`, `/shared/js/ui-dialog.js`) | Replaces 30 delete/destructive confirmation modals with one dynamic call | `title`, `message`, `confirmText`, `confirmVariant ('danger'|'primary')`, `onConfirm`, `requireTyping` | ADM-001, ADM-002, HOD-001, HOD-003, FAC-001..008, STU-007 | `role="dialog"`, `aria-modal="true"`, focus trap, Esc to dismiss, Enter to confirm | Shared Core | Active (Implemented in `/components/dialog.js`) |
| UI-002 | `DynamicFormDialog` & `openDetailDialog` (`/components/dialog.js`, `/shared/js/ui-dialog.js`) | Dynamically renders edit/create dialogs from schema, and inspect/payload dialogs without HTML markup | `title`, `fields: [...]`, `onSubmit`, or `title`, `subtitle`, `content` for details inspector | ADM-001, ADM-002, ADM-004, HOD-001, HOD-003, FAC-001, FAC-003, FAC-004, FAC-008, STU-007 | Native `<dialog>` or accessible backdrop, auto-focus first input, `:user-valid` inline errors, Enter to submit | Shared Core | Active (Implemented in `/components/dialog.js`) |
| UI-003 | `ToastNotification` (`/components/toast.js`, `/shared/js/ui-toast.js`) | Non-blocking status messages (success, error, warning, info) | `message`, `type ('success'|'error'|'warning'|'info')`, `duration` | All Pages (743 toast trigger locations) | `aria-live="polite"`, auto-dismiss with animated slide, swipe-to-dismiss on mobile | Shared Core | Active (Implemented in `/components/toast.js`) |
| UI-004 | `DataTable` (`/components/table.js`, `/shared/js/ui-table.js`) | Reusable data table with column definition, sorting, search filter, and mobile card transformation | `columns: [{ key, label, sortable, render }]`, `data: []`, `actions: [{ icon, label, onClick, variant }]` | ADM-001, ADM-002, ADM-004, ADM-005, HOD-001, FAC-007, STU-005 | Arrow key navigation, sticky header, mobile switches to card list automatically | Shared Core | Active (Implemented in `/components/table.js`) |
| UI-005 | `StatCard` (`/components/stat-card.js`, `/shared/css/components.css`) | KPI summary metric card with trend indicators | `title`, `value`, `delta`, `icon`, `trend ('up'|'down')` | ADM-003, ADM-004, ADM-005, ADM-007, HOD-001, HOD-002, FAC-002, STU-001 | High contrast, screen-reader announced labels | Shared Core | Active (Implemented in `/components/stat-card.js`) |
| UI-006 | `AppShell` (`/shared/nav/nav.js`, `nav.css`) | Institutional brand bar, mobile menu button, quick launcher popover, profile popover | `role`, `activeRoute`, `breadcrumbs` | All 39 Portal Pages | Zero-flash View Transitions (`navigation: auto`), fixed position, mobile slide drawer | Shared Core | Active (Milestone 337) |
| UI-007 | `AttendanceMatrix` (`faculty/registers/`) | 31-day attendance matrix with live roll-call studio | `month`, `year`, `students: []`, `attendanceMap` | FAC-001, STU-002 | Strict status tokens (`--status-present`, `--status-absent`, `--status-late`), keyboard quick navigation | Feature-Specific | Active (Implemented in `frontend-v2/faculty/registers/`) |
| UI-008 | `ActionToolbar` (`/shared/css/components.css`) | Search box, filter dropdown, and primary action button cluster | `searchPlaceholder`, `filters: []`, `primaryAction: { label, icon, onClick }` | ADM-001, ADM-002, FAC-001, FAC-007 | Focus rings, mobile sticky bottom action bar | Shared Core | Proposed Consolidated |
| UI-009 | `AjaxClient` (`/components/ajax.js`, `/shared/js/ajax.js`) | Modern Native Fetch wrapper with classic AJAX API (ajax.get, post, put, delete, auto Bearer auth, token refresh, and toast handling) | `url`, `method`, `body`, `headers` | All 39 Portal Pages | Asynchronous Promise-based HTTP engine with automatic 401 retry | Shared Core | Active (Milestone 364) |
| UI-010 | `ModalComponentBridge` (`/shared/css/components.css`) | Standardized `.modal-backdrop` and `.modal-card` styling bridge for declarative & legacy-compatible modal dialogs | Classes: `.modal-backdrop`, `.modal-backdrop.open`, `.modal-backdrop.active`, `.modal-card`, `.modal-card-sm`, `.modal-card-lg`, `.modal-card-xl` | FAC-002, FAC-004, FAC-006, FAC-007, FAC-008, FAC-012, FAC-014 | `position: fixed; inset: 0; z-index: 1100`, backdrop blur, default `max-width: var(--modal-max-width, 540px)` with inline style overrides, auto-scroll `max-height: 90vh` | Shared Core | Active (Milestone 1) |
| UI-011 | `ResponsiveGridUtilities` (`/shared/css/components.css`) | Standard responsive column grids with monotonic tablet & mobile degradation | Classes: `.grid-cols-2`, `.grid-cols-4` | FAC-004, FAC-014, ADM-001..007 | Monotonic breakpoint scaling: `<=768px` stacks 4 cols to 2, `<=480px` stacks both 2 and 4 cols to 1 | Shared Core | Active (Milestone 1) |
| UI-ADM-001 | `AdminDualStateSidebar` (`/admin/components/sidebar/`) | Modular dual-state navigation rail and mobile drawer with zero outside CSS/JS dependency | `sidebar_open`, `admin_sidebar_collapsed`, `Ctrl+B` shortcut | ADM-003 (`admin/dashboard`) | High contrast, keyboard trap on mobile, instant paint from localStorage | Admin Feature-Specific | Active (Milestone 386-388) |
| UI-ADM-002 | `AdminSvgIcons` (`/admin/components/icons.js`) | Self-contained SVG icon registry isolating admin vector graphics from outside scripts | `name: string`, `options: { width, height, stroke, className }` | All Admin Pages | Scalable inline SVGs, semantic aria-hidden, theme-tokenized colors (`currentColor`) | Admin Feature-Specific | Active (Milestone 388) |


---

## 3. Dynamic Form Modal Specification (React-Like Declarative Pattern)

Instead of hardcoding a 100-line modal in HTML for every single entity, any page will call:

```javascript
// Example: Edit Department (2 text boxes)
openDynamicForm({
  title: 'Edit Department',
  fields: [
    { name: 'name', label: 'Department Name', type: 'text', required: true },
    { name: 'code', label: 'Department Code', type: 'text', required: true, uppercase: true }
  ],
  initialValues: { name: 'Information Technology', code: 'IT' },
  onSubmit: async (values) => {
    await api.put(`/api/admin/departments/${id}`, values);
    showToast('Department updated successfully', 'success');
  }
});

// Example: Edit Faculty Profile (5 text boxes + select)
openDynamicForm({
  title: 'Edit Faculty Member',
  fields: [
    { name: 'name', label: 'Full Name', type: 'text', required: true },
    { name: 'email', label: 'College Email', type: 'email', required: true },
    { name: 'phone', label: 'Contact Phone', type: 'tel' },
    { name: 'designation', label: 'Designation', type: 'select', options: ['Assistant Professor', 'Associate Professor', 'Professor'] },
    { name: 'department_id', label: 'Department', type: 'select', options: departmentsList },
    { name: 'room_no', label: 'Cabin / Room No.', type: 'text' }
  ],
  initialValues: currentFacultyData,
  onSubmit: async (values) => {
    await api.put(`/api/admin/faculty/${id}`, values);
    showToast('Faculty updated successfully', 'success');
  }
});
```

**Benefits**:
- **Zero duplicated HTML**: 656 hardcoded modal `div`s eliminated from page templates.
- **Zero duplicated CSS**: Modal backdrops, animations, headers, inputs, and button groups defined once in `components.css`.
- **Zero duplicated JS**: Open/close lifecycle, Esc key dismissal, backdrop click, autofocus, input validation, and loading spinners handled automatically by the single primitive.
- **Estimated Code Reduction**: Over **35,000 lines of redundant HTML/CSS/JS removed**.
